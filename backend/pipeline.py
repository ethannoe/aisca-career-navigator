"""
Pipeline NLP/RAG local pour AISCA.

Objectifs couverts (RNCP40875 – Bloc 2):
- Prétraitement texte, embeddings SBERT locaux, similarité cosinus
- Scoring compétences/blocs, recommandations métiers (Top 3)
- Génération locale (Flan-T5) pour plan de progression & bio
- RAG minimaliste sur référentiel de compétences
- Caching des embeddings pour limiter les coûts CPU

Aucune API externe n'est utilisée. Les modèles Hugging Face sont chargés
localement (téléchargement initial possible, puis cache HF).
"""

from __future__ import annotations

import hashlib
import logging
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
from joblib import dump, load
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from .data_models import (
    AnalysisResult,
    BlocScore,
    Recommendation,
    Referentiel,
    UserResponses,
    load_referentiel,
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Modèles open-source et légers (CPU friendly)
DEFAULT_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_GEN_MODEL = "google/flan-t5-small"

CACHE_DIR = Path.home() / ".cache" / "aisca"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Groupes de compétences très proches à fusionner pour le scoring/affichage
# (évite la sur-représentation de compétences quasi identiques en NLP)
SIMILAR_COMPETENCE_GROUPS: Dict[str, List[str]] = {
    "C12": ["C12", "C14", "C15"],  # Word Embeddings / Analyse sémantique / Sentiment
}


def canonical_competence_id(comp_id: str) -> str:
    for canonical, group in SIMILAR_COMPETENCE_GROUPS.items():
        if comp_id in group:
            return canonical
    return comp_id


# -------------------------------------------------------
# Prétraitement texte
# -------------------------------------------------------
def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^a-z0-9àâäãçéèêëîïôöùûüñ'\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


# -------------------------------------------------------
# Modèles locaux (cached)
# -------------------------------------------------------
@lru_cache(maxsize=1)
def _load_sentence_model(model_name: str = DEFAULT_EMBEDDING_MODEL) -> SentenceTransformer:
    logger.info("Chargement du modèle d'embedding %s", model_name)
    return SentenceTransformer(model_name, device="cpu")


@lru_cache(maxsize=1)
def _load_generation_model(model_name: str = DEFAULT_GEN_MODEL):
    logger.info("Chargement du modèle génératif %s", model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    return tokenizer, model


def embed_texts(texts: List[str], model_name: str = DEFAULT_EMBEDDING_MODEL) -> np.ndarray:
    if len(texts) == 0:
        return np.zeros((0, 384), dtype=np.float32)
    model = _load_sentence_model(model_name)
    embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    return embeddings.astype(np.float32)


# -------------------------------------------------------
# Embeddings des compétences (cache disque)
# -------------------------------------------------------
def _cache_signature(referentiel: Referentiel, model_name: str) -> str:
    ref_sig = f"{referentiel.version}_{referentiel.source_path.stat().st_mtime if referentiel.source_path else ''}"
    raw = f"{ref_sig}_{model_name}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:16]


def build_competence_embeddings(
    referentiel: Referentiel,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> Dict[str, np.ndarray]:
    signature = _cache_signature(referentiel, model_name)
    cache_file = CACHE_DIR / f"competence_embeddings_{signature}.joblib"

    if cache_file.exists():
        try:
            logger.info("Chargement des embeddings compétences depuis le cache")
            return load(cache_file)
        except Exception:
            logger.warning("Cache d'embeddings corrompu, reconstruction en cours…")

    comp_texts = []
    comp_ids = []
    for bloc in referentiel.blocs:
        for comp in bloc.competences:
            comp_ids.append(comp.id)
            comp_texts.append(f"{comp.nom}. {comp.description}")

    embeddings = embed_texts([normalize_text(t) for t in comp_texts], model_name)
    comp_embeddings = {cid: embeddings[i] for i, cid in enumerate(comp_ids)}

    dump(comp_embeddings, cache_file)
    return comp_embeddings


# -------------------------------------------------------
# Scoring
# -------------------------------------------------------
LIKERT_SCORE_MAP = {1: 0.08, 2: 0.25, 3: 0.55, 4: 0.78, 5: 0.95}


def score_likert(responses: UserResponses, referentiel: Referentiel) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    for q in referentiel.questions.likert:
        response = responses.likert.get(q.id)
        if response is None:
            continue
        score = LIKERT_SCORE_MAP.get(response, response / 5)
        for comp_id in q.competencesLiees:
            scores[comp_id] = max(scores.get(comp_id, 0), score)
    return scores


def score_multiple_choice(responses: UserResponses, referentiel: Referentiel) -> Dict[str, float]:
    scores: Dict[str, float] = {}
    for q in referentiel.questions.choixMultiples:
        selected = responses.choixMultiples.get(q.id, [])
        if not selected:
            continue
        relevance = min(len(selected) / max(len(q.options), 1), 1.0)
        for comp_id in q.competencesLiees:
            scores[comp_id] = max(scores.get(comp_id, 0), relevance)
    return scores


def score_open_questions(
    responses: UserResponses,
    competence_embeddings: Dict[str, np.ndarray],
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> Dict[str, float]:
    texts = [normalize_text(t) for t in responses.ouvertes.values() if t and t.strip()]
    if not texts:
        return {comp_id: 0.0 for comp_id in competence_embeddings.keys()}

    resp_embeddings = embed_texts(texts, model_name)
    scores: Dict[str, float] = {}

    for comp_id, comp_emb in competence_embeddings.items():
        comp_emb_2d = comp_emb.reshape(1, -1)
        sims = cosine_similarity(resp_embeddings, comp_emb_2d)
        # moyenne + bonus long texte
        base = float(np.clip(np.mean(sims), 0, 1))
        length_bonus = min(len(" ".join(texts).split()) / 300, 0.1)
        scores[comp_id] = min(base + length_bonus, 1.0)

    return scores


def aggregate_competence_scores(
    likert_scores: Dict[str, float],
    open_scores: Dict[str, float],
    multi_scores: Dict[str, float],
    participation: float = 0.05,
) -> Dict[str, float]:
    all_ids = set(likert_scores.keys()) | set(open_scores.keys()) | set(multi_scores.keys())
    raw: Dict[str, float] = {}
    for comp_id in all_ids:
        score = (
            0.25 * likert_scores.get(comp_id, 0)
            + 0.55 * open_scores.get(comp_id, 0)
            + 0.15 * multi_scores.get(comp_id, 0)
            + participation
        )
        raw[comp_id] = float(np.clip(score, 0, 1))

    return merge_competence_clusters(raw)


def merge_competence_clusters(competence_scores: Dict[str, float]) -> Dict[str, float]:
    """Fusionne les compétences proches (ex: C12/C14/C15) pour éviter la duplication.

    Logique : on prend le max dans le groupe pour ne pas pénaliser un profil qui
    mentionne une seule variante, puis on répercute ce score fusionné sur tous les
    identifiants du groupe afin de garder la compatibilité avec le référentiel
    (metiers, blocs, affichage).
    """

    fused: Dict[str, float] = competence_scores.copy()

    for canonical, group in SIMILAR_COMPETENCE_GROUPS.items():
        scores = [competence_scores.get(cid, 0) for cid in group]
        if not scores:
            continue
        fused_score = max(scores)
        for cid in group:
            fused[cid] = fused_score
        fused[canonical] = fused_score

    return fused


def compute_bloc_scores(
    competence_scores: Dict[str, float],
    referentiel: Referentiel,
) -> List[BlocScore]:
    bloc_scores: List[BlocScore] = []
    for bloc in referentiel.blocs:
        comp_scores = {c.id: competence_scores.get(c.id, 0) for c in bloc.competences}
        values = list(comp_scores.values())
        if values:
            sorted_vals = sorted(values, reverse=True)
            top_k = sorted_vals[: min(3, len(sorted_vals))]
            mean_all = float(np.mean(sorted_vals))
            mean_top = float(np.mean(top_k))
            bloc_avg = 0.6 * mean_all + 0.4 * mean_top
            bloc_avg *= bloc.poids
            bloc_avg = float(np.clip(bloc_avg, 0, 1))
        else:
            bloc_avg = 0.0
        bloc_scores.append(
            BlocScore(
                blocId=bloc.id,
                blocNom=bloc.nom,
                score=bloc_avg,
                competenceScores=comp_scores,
            )
        )
    return bloc_scores


def recommend_jobs(
    bloc_scores: List[BlocScore],
    competence_scores: Dict[str, float],
    referentiel: Referentiel,
) -> List[Recommendation]:
    bloc_map = {b.blocId: b.score for b in bloc_scores}
    avg_skill = np.mean(list(competence_scores.values())) if competence_scores else 0.0

    recommendations: List[Recommendation] = []
    for metier in referentiel.metiers:
        required_scores = [competence_scores.get(cid, 0) for cid in metier.competencesRequises]
        score_couv = float(np.mean(required_scores)) if required_scores else 0.0

        bloc_score = np.mean([bloc_map.get(bid, 0) for bid in metier.blocsClés]) if metier.blocsClés else 0.0
        final = 0.55 * bloc_score + 0.45 * score_couv

        if avg_skill < metier.seuilMinimum:
            gap = metier.seuilMinimum - avg_skill
            final *= max(0.45, 1 - gap)

        final = float(np.clip(final, 0, 1))

        if final >= 0.6:
            compat = "excellente"
        elif final >= 0.45:
            compat = "bonne"
        elif final >= 0.30:
            compat = "moyenne"
        else:
            compat = "faible"

        missing = [cid for cid in metier.competencesRequises if competence_scores.get(cid, 0) < 0.35]
        recommendations.append(
            Recommendation(
                metier=metier,
                score=final,
                scoreCouverture=score_couv,
                competencesManquantes=missing,
                compatibilite=compat,
            )
        )

    recommendations.sort(key=lambda r: r.score, reverse=True)
    return recommendations[:3]


# -------------------------------------------------------
# RAG simple sur référentiel
# -------------------------------------------------------
def retrieve_context(
    query_texts: List[str],
    referentiel: Referentiel,
    competence_embeddings: Dict[str, np.ndarray],
    top_k: int = 5,
) -> List[Tuple[str, float]]:
    if not query_texts:
        return []
    q_emb = embed_texts([normalize_text(" ".join(query_texts))])
    if q_emb.shape[0] == 0:
        return []
    q_emb = q_emb[0].reshape(1, -1)

    scored: List[Tuple[str, float]] = []
    for bloc in referentiel.blocs:
        for comp in bloc.competences:
            emb = competence_embeddings.get(comp.id)
            if emb is None:
                continue
            sim = float(cosine_similarity(q_emb, emb.reshape(1, -1))[0][0])
            scored.append((f"{comp.nom} ({bloc.nom}) - {comp.description}", sim))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_k]


# -------------------------------------------------------
# Génération locale (Flan-T5)
# -------------------------------------------------------
def generate_local_text(prompt: str, max_new_tokens: int = 300) -> str:
    try:
        tokenizer, model = _load_generation_model(DEFAULT_GEN_MODEL)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=768)
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.8,
            num_beams=4,
            no_repeat_ngram_size=3,
        )
        return tokenizer.decode(outputs[0], skip_special_tokens=True)
    except Exception as exc:  # pragma: no cover - fallback
        logger.warning("Génération locale indisponible (%s), fallback statique.", exc)
        return (
            "[MODELE LOCAL NON DISPONIBLE] Plan condensé :\n"
            "Phase 1 (0-2 mois): réviser Python/SQL, 2 exercices par semaine.\n"
            "Phase 2 (2-4 mois): projet pratique aligné métier cible, revue hebdo.\n"
            "Phase 3 (4-6 mois): industrialiser, documenter, publier portfolio."
        )


# -------------------------------------------------------
# Orchestration complète
# -------------------------------------------------------
def analyze_user_profile(
    responses: UserResponses,
    referentiel: Referentiel | None = None,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> AnalysisResult:
    referentiel = referentiel or load_referentiel()
    competence_embeddings = build_competence_embeddings(referentiel, model_name)

    comp_labels = {c.id: c.nom for bloc in referentiel.blocs for c in bloc.competences}

    likert_scores = score_likert(responses, referentiel)
    multi_scores = score_multiple_choice(responses, referentiel)
    open_scores = score_open_questions(responses, competence_embeddings, model_name)

    has_participation = bool(responses.likert or responses.ouvertes or responses.choixMultiples)
    participation_bonus = 0.06 if has_participation else 0.0

    competence_scores = aggregate_competence_scores(
        likert_scores, open_scores, multi_scores, participation=participation_bonus
    )
    bloc_scores = compute_bloc_scores(competence_scores, referentiel)
    recommandations = recommend_jobs(bloc_scores, competence_scores, referentiel)

    comp_sorted = sorted(competence_scores.items(), key=lambda x: x[1], reverse=True)
    fortes = [comp_labels.get(c, c) for c, s in comp_sorted if s >= 0.55][:5]
    faibles = [comp_labels.get(c, c) for c, s in comp_sorted if s < 0.35][:5]
    score_global = float(np.mean(list(competence_scores.values()))) if competence_scores else 0.0

    return AnalysisResult(
        blocsScores=bloc_scores,
        recommandations=recommandations,
        competencesFortes=fortes,
        competencesFaibles=faibles,
        scoreGlobal=score_global,
    )


def build_progression_prompt(result: AnalysisResult, context_chunks: List[Tuple[str, float]]) -> str:
    context_txt = "\n".join([f"- {chunk} (sim={sim:.2f})" for chunk, sim in context_chunks])
    top_metier = result.recommandations[0].metier.titre if result.recommandations else "Profil Data"
    return (
        "Tu es un coach carrière Data/IA. Génère un plan en français, clair et actionnable.\n"
        f"Cible métier: {top_metier}.\n"
        f"Forces: {', '.join(result.competencesFortes) or 'à préciser'}.\n"
        f"Axes de progrès: {', '.join(result.competencesFaibles) or 'aucun majeur'}.\n"
        "Structure attendue (max 220 mots) :\n"
        "- Phase 1 (0-2 mois) : 3 actions concrètes, charge hebdo, livrables.\n"
        "- Phase 2 (2-4 mois) : 3 actions, un projet pratique à livrer.\n"
        "- Phase 3 (4-6 mois) : industrialisation/portfolio/certif.\n"
        "- Ressources nominatives (cours, lib, outil) par phase.\n"
        "- Indiquer un indicateur de succès par phase.\n"
        "Ton concis, listes à puces, pas de blabla.\n"
        f"Contexte référentiel (RAG):\n{context_txt}"
    )


def build_bio_prompt(result: AnalysisResult, responses: UserResponses) -> str:
    target = result.recommandations[0].metier.titre if result.recommandations else "Data/IA"
    experiences = " ".join(list(responses.ouvertes.values())[:2])[:600]
    return (
        f"Rédige une bio LinkedIn en français pour un profil {target}.\n"
        "Contraintes : 3 phrases courtes, ton professionnel, résultats mesurables, pas de buzzwords.\n"
        f"Mettre en avant les forces: {', '.join(result.competencesFortes) or 'apprentissage rapide'}.\n"
        f"Score global: {int(result.scoreGlobal * 100)}%.\n"
        f"Éléments d'expérience: {experiences}.\n"
        "Terminer par une phrase d'impact orientée valeur business."
    )


def enrich_with_generation(
    result: AnalysisResult,
    responses: UserResponses,
    referentiel: Referentiel,
    competence_embeddings: Dict[str, np.ndarray],
) -> AnalysisResult:
    context_chunks = retrieve_context(list(responses.ouvertes.values()), referentiel, competence_embeddings)
    plan_prompt = build_progression_prompt(result, context_chunks)
    bio_prompt = build_bio_prompt(result, responses)

    plan = generate_local_text(plan_prompt, max_new_tokens=320)
    bio = generate_local_text(bio_prompt, max_new_tokens=120)

    result.planProgression = plan
    result.bioProfessionnelle = bio
    return result


def full_pipeline(
    responses: UserResponses,
    referentiel: Referentiel | None = None,
    model_name: str = DEFAULT_EMBEDDING_MODEL,
) -> AnalysisResult:
    referentiel = referentiel or load_referentiel()
    competence_embeddings = build_competence_embeddings(referentiel, model_name)
    analysis = analyze_user_profile(responses, referentiel, model_name)
    analysis = enrich_with_generation(analysis, responses, referentiel, competence_embeddings)
    return analysis


__all__ = [
    "normalize_text",
    "embed_texts",
    "build_competence_embeddings",
    "analyze_user_profile",
    "full_pipeline",
    "retrieve_context",
    "build_progression_prompt",
    "build_bio_prompt",
]
