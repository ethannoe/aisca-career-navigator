from __future__ import annotations

import datetime as dt
from pathlib import Path
from typing import Dict, List, Tuple
import io

import pandas as pd
import plotly.express as px
import streamlit as st

from backend.data_models import AnalysisResult, UserResponses, load_referentiel
from backend.pipeline import (
    build_competence_embeddings,
    canonical_competence_id,
    full_pipeline,
    retrieve_context,
)

CHART_COLORS = [
    "hsl(185,70%,28%)",
    "hsl(200,90%,50%)",
    "hsl(160,70%,40%)",
    "hsl(40,95%,55%)",
    "hsl(0,70%,55%)",
]

STEPS = [
    {"id": "intro", "label": "Introduction", "page": "pages/1_Introduction.py"},
    {"id": "auto", "label": "Auto-évaluation", "page": "pages/2_Auto_evaluation.py"},
    {"id": "xp", "label": "Expériences", "page": "pages/3_Experiences.py"},
    {"id": "comp", "label": "Compétences", "page": "pages/4_Competences.py"},
    {"id": "analyse", "label": "Analyse", "page": "pages/5_Analyse.py"},
    {"id": "resultats", "label": "Résultats", "page": "pages/6_Resultats.py"},
]


@st.cache_resource(show_spinner=False)
def load_assets():
    referentiel = load_referentiel()
    comp_emb = build_competence_embeddings(referentiel)
    comp_labels = {c.id: c.nom for b in referentiel.blocs for c in b.competences}
    comp_desc = {c.id: c.description for b in referentiel.blocs for c in b.competences}
    bloc_labels = {b.id: b.nom for b in referentiel.blocs}
    question_by_id = {q.id: {"texte": q.texte, "type": "likert", "bloc": q.bloc} for q in referentiel.questions.likert}
    question_by_id.update(
        {
            q.id: {"texte": q.texte, "type": "ouverte", "bloc": (q.blocsLies[0] if q.blocsLies else "")}
            for q in referentiel.questions.ouvertes
        }
    )
    question_by_id.update({q.id: {"texte": q.texte, "type": "choix", "bloc": q.bloc} for q in referentiel.questions.choixMultiples})
    return {
        "referentiel": referentiel,
        "competence_embeddings": comp_emb,
        "comp_labels": comp_labels,
        "comp_desc": comp_desc,
        "bloc_labels": bloc_labels,
        "question_by_id": question_by_id,
    }


def inject_css():
    css_path = Path(__file__).resolve().parent / "styles.css"
    if css_path.exists():
        css = css_path.read_text(encoding="utf-8")
        st.markdown(f"<style>{css}</style>", unsafe_allow_html=True)


def competence_label(comp_id: str, labels: Dict[str, str]) -> str:
    canonical = canonical_competence_id(comp_id)
    return labels.get(canonical, labels.get(comp_id, comp_id))


def bloc_label(bloc_id: str, bloc_labels: Dict[str, str], default: str | None = None) -> str:
    return bloc_labels.get(bloc_id, default or bloc_id)


def ensure_state(referentiel):
    if "responses" not in st.session_state:
        st.session_state["responses"] = {"likert": {}, "ouvertes": {}, "choixMultiples": {}}
    resp = st.session_state["responses"]
    for q in referentiel.questions.likert:
        resp["likert"].setdefault(q.id, 3)
    for q in referentiel.questions.ouvertes:
        resp["ouvertes"].setdefault(q.id, "")
    for q in referentiel.questions.choixMultiples:
        resp["choixMultiples"].setdefault(q.id, [])
    st.session_state["responses"] = resp
    st.session_state.setdefault("completed_steps", [])


def user_responses_from_state() -> UserResponses:
    resp = st.session_state.get("responses", {"likert": {}, "ouvertes": {}, "choixMultiples": {}})
    return UserResponses(
        likert={k: int(v) for k, v in resp.get("likert", {}).items()},
        ouvertes={k: v for k, v in resp.get("ouvertes", {}).items()},
        choixMultiples={k: list(v) for k, v in resp.get("choixMultiples", {}).items()},
        timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),
    )


def mark_step_done(step_id: str):
    completed = set(st.session_state.get("completed_steps", []))
    completed.add(step_id)
    st.session_state["completed_steps"] = list(completed)


def switch_page_safe(target: str):
    try:
        st.switch_page(target)
    except Exception:
        st.info(f"Ouvrez la page suivante : {target}")


def render_stepper(current_step: str):
    completed = set(st.session_state.get("completed_steps", []))
    items = []
    for step in STEPS:
        status = ""
        if step["id"] in completed and step["id"] != current_step:
            status = "done"
        elif step["id"] == current_step:
            status = "active"
        classes = f"step-item {status}".strip()
        items.append(
            f"<div class='{classes}'><span class='step-dot'></span><span>{step['label']}</span></div>"
        )
    st.markdown(f"<div class='stepper'>{''.join(items)}</div>", unsafe_allow_html=True)


def likert_row(question_id: str, label: str, helper: str | None = None):
    st.markdown(f"**{label}**")
    if helper:
        st.markdown(f"<div class='helper'>{helper}</div>", unsafe_allow_html=True)
    current = st.session_state["responses"]["likert"].get(question_id, 3)
    value = st.radio(
        label,
        options=[1, 2, 3, 4, 5],
        index=max(min(current, 5), 1) - 1,
        key=f"likert_{question_id}",
        horizontal=True,
        label_visibility="collapsed",
    )
    st.session_state["responses"]["likert"][question_id] = int(value)


def experience_area(question_id: str, label: str, min_words: int = 20, placeholder: str | None = None):
    value = st.text_area(
        label,
        key=f"open_{question_id}",
        value=st.session_state["responses"]["ouvertes"].get(question_id, ""),
        height=180,
        placeholder=placeholder or f"Décrivez votre expérience (minimum {min_words} mots)…",
    )
    st.session_state["responses"]["ouvertes"][question_id] = value
    word_count = len(value.split())
    color = "#16a34a" if word_count >= min_words else "#ea580c"
    st.markdown(
        f"<div class='helper' style='color:{color};'>{word_count} mots / {min_words} minimum</div>",
        unsafe_allow_html=True,
    )


def multi_select(question_id: str, label: str, options: List[str]):
    selected = st.multiselect(
        label,
        options,
        key=f"multi_{question_id}",
        default=st.session_state["responses"]["choixMultiples"].get(question_id, []),
    )
    st.session_state["responses"]["choixMultiples"][question_id] = selected


def collect_responses_by_bloc(responses: UserResponses, question_meta: Dict[str, Dict], bloc_labels: Dict[str, str]):
    rows = []
    for qid, value in responses.likert.items():
        meta = question_meta.get(qid, {})
        rows.append({
            "Métier": bloc_label(meta.get("bloc", ""), bloc_labels, meta.get("bloc", "")),
            "Type": "Likert",
            "Question": meta.get("texte", qid),
            "Réponse": str(value),
        })
    for qid, value in responses.ouvertes.items():
        meta = question_meta.get(qid, {})
        rows.append({
            "Métier": bloc_label(meta.get("bloc", ""), bloc_labels, meta.get("bloc", "")),
            "Type": "Ouverte",
            "Question": meta.get("texte", qid),
            "Réponse": value,
        })
    for qid, value in responses.choixMultiples.items():
        meta = question_meta.get(qid, {})
        rows.append({
            "Métier": bloc_label(meta.get("bloc", ""), bloc_labels, meta.get("bloc", "")),
            "Type": "Choix multiples",
            "Question": meta.get("texte", qid),
            "Réponse": ", ".join(value),
        })
    return rows


def show_bloc_radar(result: AnalysisResult, bloc_labels: Dict[str, str]):
    if not result.blocsScores:
        return
    df = pd.DataFrame(
        {
            "Métier": [bloc_label(b.blocId, bloc_labels, b.blocNom) for b in result.blocsScores],
            "Score": [b.score for b in result.blocsScores],
        }
    )
    fig = px.line_polar(df, r="Score", theta="Métier", line_close=True, range_r=[0, 1])
    fig.update_traces(fill="toself", line_color=CHART_COLORS[0], fillcolor="rgba(24,154,152,0.20)")
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                showline=True,
                linewidth=1,
                linecolor="#94a3b8",
                gridcolor="#e2e8f0",
                tickfont=dict(color="#0f172a", size=12),
            ),
            angularaxis=dict(tickfont=dict(color="#0f172a", size=12)),
        ),
        showlegend=False,
        paper_bgcolor="white",
        plot_bgcolor="white",
        margin=dict(l=40, r=40, t=30, b=30),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


def show_competence_table(result: AnalysisResult, bloc_labels: Dict[str, str], comp_labels: Dict[str, str]):
    records = []
    for bloc in result.blocsScores:
        for comp, score in bloc.competenceScores.items():
            records.append({"Métier": bloc_label(bloc.blocId, bloc_labels, bloc.blocNom), "Compétence": competence_label(comp, comp_labels), "Score": round(score, 3)})
    if not records:
        st.info("Aucun score disponible.")
        return
    df = pd.DataFrame(records)
    df = df.groupby(["Métier", "Compétence"], as_index=False)["Score"].mean()
    df = df.sort_values(by="Score", ascending=False)
    st.dataframe(df, use_container_width=True, hide_index=True)

    fig = px.bar(
        df,
        x="Score",
        y="Compétence",
        color="Métier",
        orientation="h",
        range_x=[0, 1],
        color_discrete_sequence=CHART_COLORS,
    )
    fig.update_layout(
        height=420,
        paper_bgcolor="white",
        plot_bgcolor="white",
        bargap=0.2,
        margin=dict(l=60, r=20, t=30, b=40),
        xaxis=dict(tickfont=dict(color="#0f172a", size=12), title=None, gridcolor="#e2e8f0", zeroline=False),
        yaxis=dict(tickfont=dict(color="#0f172a", size=12), title=None),
        legend=dict(font=dict(color="#334155", size=12)),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})


def show_recommendations(result: AnalysisResult, comp_labels: Dict[str, str]):
    st.subheader("Top 3 métiers recommandés")
    if not result.recommandations:
        st.info("Aucune recommandation disponible")
        return

    df = pd.DataFrame(
        {
            "Métier": [r.metier.titre for r in result.recommandations],
            "Score": [r.score for r in result.recommandations],
            "Compatibilité": [r.compatibilite for r in result.recommandations],
        }
    )
    fig = px.bar(df, x="Métier", y="Score", color="Métier", range_y=[0, 1], color_discrete_sequence=CHART_COLORS)
    fig.update_layout(
        paper_bgcolor="white",
        plot_bgcolor="white",
        yaxis_tickformat=".0%",
        margin=dict(t=10, b=50),
        xaxis=dict(tickfont=dict(color="#0f172a", size=12), title=None, gridcolor="#e2e8f0", zeroline=False),
        yaxis=dict(tickfont=dict(color="#0f172a", size=12), title=None),
        legend=dict(font=dict(color="#334155", size=12)),
    )
    st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

    cols = st.columns(len(result.recommandations))
    for col, rec in zip(cols, result.recommandations):
        with col:
            score_cls = "metric-positive" if rec.score >= 0.6 else "metric-medium" if rec.score >= 0.4 else "metric-low"
            badge_color = {
                "metric-positive": "var(--success)",
                "metric-medium": "var(--warning)",
                "metric-low": "#ef4444",
            }[score_cls]
            st.markdown(
                f"<div class='metric-badge' style='background:{badge_color};'>Score: {rec.score*100:.1f}% ({rec.compatibilite})</div>",
                unsafe_allow_html=True,
            )
            missing = [competence_label(cid, comp_labels) for cid in rec.competencesManquantes]
            st.caption(f"Compétences à renforcer: {', '.join(missing) if missing else 'aucune majeure'}")


def show_generation(result: AnalysisResult):
    st.subheader("Plan de progression (Flan-T5 local)")
    st.markdown(result.planProgression or "Plan non généré")
    st.subheader("Bio professionnelle")
    st.write(result.bioProfessionnelle or "Bio non générée")


def show_context_snippets(responses: UserResponses, referentiel, comp_embeddings):
    snippets = retrieve_context(list(responses.ouvertes.values()), referentiel, comp_embeddings)
    if not snippets:
        return
    st.subheader("Contexte RAG (compétences proches)")
    for text, sim in snippets:
        percent = int(sim * 100)
        st.markdown(
            f"<div class='rag-item'><div>{text}</div><div class='rag-meter'><span style='width:{percent}%;'></span></div></div>",
            unsafe_allow_html=True,
        )


def _summary_text(result: AnalysisResult) -> List[str]:
    highlights = []
    if result.blocsScores:
        top_bloc = max(result.blocsScores, key=lambda b: b.score)
        highlights.append(f"Bloc fort : {top_bloc.blocNom} ({top_bloc.score*100:.1f}%)")
    if result.recommandations:
        best = result.recommandations[0]
        highlights.append(f"Métier prioritaire : {best.metier.titre} ({best.score*100:.1f}%)")
    if result.competencesFortes:
        highlights.append(f"Compétences fortes : {', '.join(result.competencesFortes[:5])}")
    if result.competencesFaibles:
        highlights.append(f"Axes de progrès : {', '.join(result.competencesFaibles[:5])}")
    return highlights


def clean_text_plain(text: str) -> str:
    """Nettoie le texte pour un export .txt lisible (pas de caractères exotiques)."""
    if not isinstance(text, str):
        text = str(text)
    replacements = {
        "•": "-",
        "—": "-",
        "–": "-",
        "“": '"',
        "”": '"',
        "’": "'",
        "‘": "'",
        "…": "...",
        "\u2022": "-",
        "\u00a0": " ",
    }
    for bad, good in replacements.items():
        text = text.replace(bad, good)
    return text


def build_text_report(
    result: AnalysisResult,
    responses: UserResponses,
    bloc_labels: Dict[str, str],
    comp_labels: Dict[str, str],
    snippets: List[Tuple[str, float]],
) -> str:
    lines: List[str] = []
    lines.append("=====================================")
    lines.append("        COMPTE RENDU AISCA")
    lines.append("=====================================")
    lines.append("")

    # 1. Score global
    lines.append("1. Score global")
    lines.append(f"- Score : {result.scoreGlobal*100:.1f}%")
    lines.append("")

    # 2. Scores par bloc
    lines.append("2. Scores par bloc de compétences")
    for bloc in result.blocsScores:
        lines.append(f"- {bloc_label(bloc.blocId, bloc_labels, bloc.blocNom)} : {bloc.score*100:.1f}%")
    lines.append("")

    # 3. Top 3 métiers
    lines.append("3. Top 3 métiers recommandés")
    for rec in result.recommandations:
        lines.append(f"- {rec.metier.titre} : {rec.score*100:.1f}% ({rec.compatibilite})")
    lines.append("")

    # 4. Interprétation
    lines.append("4. Interprétation des résultats")
    summary = _summary_text(result)
    if summary:
        for s in summary:
            lines.append(f"- {clean_text_plain(s)}")
    else:
        lines.append("- Aucune interprétation disponible")
    lines.append("")

    # 5. Contexte RAG
    lines.append("5. Contexte RAG / analyse textuelle")
    if snippets:
        for text, sim in snippets:
            lines.append(f"- ({sim*100:.1f}%) {clean_text_plain(text)}")
    else:
        lines.append("- Non disponible")

    # Contenu txt final
    return "\n".join(lines)


def render_export_section(result: AnalysisResult, responses: UserResponses, referentiel, comp_embeddings, bloc_labels, comp_labels):
    snippets = retrieve_context(list(responses.ouvertes.values()), referentiel, comp_embeddings)
    txt_report = build_text_report(result, responses, bloc_labels, comp_labels, snippets)
    timestamp = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"aisca_resultats_{timestamp}.txt"
    st.markdown("<div class='section-card'>", unsafe_allow_html=True)
    st.subheader("Export / Compte rendu")
    st.download_button(
        label="Extraire les données",
        data=txt_report.encode("utf-8"),
        file_name=filename,
        mime="text/plain",
        use_container_width=True,
        type="primary",
    )
    st.caption("Le fichier texte reprend le score global, les blocs, le top métiers, le résumé et le contexte RAG.")
    st.markdown("</div>", unsafe_allow_html=True)


def analyze_and_store(referentiel):
    responses = user_responses_from_state()
    with st.spinner("Analyse locale en cours…"):
        result = full_pipeline(responses, referentiel)
    st.session_state["analysis_result"] = result
    st.session_state["analysis_responses"] = responses
    return result
