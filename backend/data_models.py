"""
Structures de données et chargement du référentiel AISCA.

Ce module fournit des dataclasses fortement typées pour manipuler le
référentiel de compétences/métiers/questionnaire ainsi que les réponses
utilisateur dans la pipeline Python. Il ne dépend d'aucune API externe
et reste compatible avec le JSON existant côté frontend.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional


@dataclass
class Competence:
    id: str
    nom: str
    description: str
    bloc_id: str


@dataclass
class Bloc:
    id: str
    nom: str
    description: str
    poids: float
    competences: List[Competence]


@dataclass
class Metier:
    id: str
    titre: str
    description: str
    niveau: str
    competencesRequises: List[str]
    blocsClés: List[str]
    seuilMinimum: float


@dataclass
class QuestionLikert:
    id: str
    texte: str
    competencesLiees: List[str]
    bloc: str


@dataclass
class QuestionOuverte:
    id: str
    texte: str
    blocsLies: List[str]
    minWords: int


@dataclass
class QuestionChoix:
    id: str
    texte: str
    options: List[str]
    competencesLiees: List[str]
    bloc: str


@dataclass
class Questions:
    likert: List[QuestionLikert]
    ouvertes: List[QuestionOuverte]
    choixMultiples: List[QuestionChoix]


@dataclass
class Referentiel:
    version: str
    blocs: List[Bloc]
    metiers: List[Metier]
    questions: Questions
    description: Optional[str] = None
    lastUpdated: Optional[str] = None
    source_path: Optional[Path] = None
    fallback: bool = False


@dataclass
class UserResponses:
    likert: Dict[str, int]
    ouvertes: Dict[str, str]
    choixMultiples: Dict[str, List[str]]
    timestamp: Optional[str] = None


@dataclass
class Recommendation:
    metier: Metier
    score: float
    scoreCouverture: float
    competencesManquantes: List[str]
    compatibilite: str


@dataclass
class BlocScore:
    blocId: str
    blocNom: str
    score: float
    competenceScores: Dict[str, float]


@dataclass
class AnalysisResult:
    blocsScores: List[BlocScore]
    recommandations: List[Recommendation]
    competencesFortes: List[str]
    competencesFaibles: List[str]
    scoreGlobal: float
    planProgression: Optional[str] = None
    bioProfessionnelle: Optional[str] = None


def _to_competence(raw: Dict[str, str], bloc_id: str) -> Competence:
    return Competence(
        id=raw["id"],
        nom=raw["nom"],
        description=raw.get("description", ""),
        bloc_id=bloc_id,
    )


def _to_bloc(raw: Dict) -> Bloc:
    competences = [_to_competence(c, raw["id"]) for c in raw.get("competences", [])]
    return Bloc(
        id=raw["id"],
        nom=raw["nom"],
        description=raw.get("description", ""),
        poids=float(raw.get("poids", 1.0)),
        competences=competences,
    )


def _to_metier(raw: Dict) -> Metier:
    return Metier(
        id=raw["id"],
        titre=raw["titre"],
        description=raw.get("description", ""),
        niveau=raw.get("niveau", ""),
        competencesRequises=list(raw.get("competencesRequises", [])),
        blocsClés=list(raw.get("blocsClés", [])),
        seuilMinimum=float(raw.get("seuilMinimum", 0.0)),
    )


def _to_questions(raw: Dict) -> Questions:
    likert = [
        QuestionLikert(
          id=q["id"],
          texte=q["texte"],
          competencesLiees=list(q.get("competencesLiees", [])),
          bloc=q.get("bloc", ""),
        ) for q in raw.get("likert", [])
    ]

    ouvertes = [
        QuestionOuverte(
          id=q["id"],
          texte=q["texte"],
          blocsLies=list(q.get("blocsLies", [])),
          minWords=int(q.get("minWords", 0)),
        ) for q in raw.get("ouvertes", [])
    ]

    choix = [
        QuestionChoix(
          id=q["id"],
          texte=q["texte"],
          options=list(q.get("options", [])),
          competencesLiees=list(q.get("competencesLiees", [])),
          bloc=q.get("bloc", ""),
        ) for q in raw.get("choixMultiples", [])
    ]

    return Questions(likert=likert, ouvertes=ouvertes, choixMultiples=choix)


def load_referentiel(path: Optional[Path | str] = None) -> Referentiel:
    """Charge le référentiel JSON avec tolérance aux fichiers vides/malformés.

    - Si le fichier est absent ou invalide, on le recrée avec une structure minimale.
    - Un message est loggé pour informer l'utilisateur.
    """

    logger = logging.getLogger(__name__)
    default_path = Path(__file__).resolve().parents[1] / "src" / "data" / "referentiel.json"
    file_path = Path(path) if path else default_path

    def minimal_payload() -> Dict:
        return {
            "version": "0.0.0",
            "description": "Référentiel minimal auto-généré",
            "lastUpdated": None,
            "blocs": [
                {
                    "id": "B1",
                    "nom": "Data Analyst",
                    "description": "Référentiel par défaut (fallback)",
                    "poids": 1.0,
                    "competences": [
                        {
                            "id": "C1",
                            "nom": "Analyse de données",
                            "description": "Analyse exploratoire",
                        }
                    ],
                }
            ],
            "metiers": [],
            "questions": {"likert": [], "ouvertes": [], "choixMultiples": []},
        }

    fallback_used = False

    # Création si manquant
    if not file_path.exists():
        logger.info("[AISCA] Référentiel introuvable, création de %s", file_path)
        file_path.parent.mkdir(parents=True, exist_ok=True)
        payload = minimal_payload()
        file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        fallback_used = True

    # Chargement avec tolérance
    raw: Dict
    try:
        content = file_path.read_text(encoding="utf-8")
        if not content.strip():  # fichier vide
            raise json.JSONDecodeError("empty", doc="", pos=0)
        raw = json.loads(content)
    except (json.JSONDecodeError, OSError, Exception):
        logger.warning("[AISCA] Fichier JSON vide ou invalide, utilisation du référentiel minimal par défaut")
        raw = minimal_payload()
        fallback_used = True
        try:
            file_path.write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            # On ignore les erreurs d'écriture pour garantir un fallback en mémoire
            pass

    # Sanity check : champs obligatoires
    raw.setdefault("blocs", [])
    raw.setdefault("metiers", [])
    raw.setdefault("questions", {"likert": [], "ouvertes": [], "choixMultiples": []})

    # Déduplication simple des compétences par id (avertissement si doublons)
    seen_comp = set()
    for bloc in raw.get("blocs", []):
        if "competences" not in bloc:
            bloc["competences"] = []
        unique_comps = []
        for comp in bloc.get("competences", []):
            cid = comp.get("id")
            if cid in seen_comp:
                logger.warning("[AISCA] Compétence dupliquée détectée: %s (conservée première occurrence)", cid)
                continue
            seen_comp.add(cid)
            unique_comps.append(comp)
        bloc["competences"] = unique_comps

    blocs = [_to_bloc(b) for b in raw.get("blocs", [])]
    metiers = [_to_metier(m) for m in raw.get("metiers", [])]
    questions = _to_questions(raw.get("questions", {}))

    return Referentiel(
        version=raw.get("version", "0.0.0"),
        description=raw.get("description"),
        lastUpdated=raw.get("lastUpdated"),
        blocs=blocs,
        metiers=metiers,
        questions=questions,
        source_path=file_path,
        fallback=fallback_used,
    )
