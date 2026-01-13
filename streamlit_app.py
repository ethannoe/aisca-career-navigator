"""
Application Streamlit autonome pour AISCA.

EF1 – Acquisition : questionnaire hybride (Likert, ouvertes, choix multiples)
EF2 – Moteur NLP : embeddings SBERT locaux + similarité cosinus
EF3 – Scoring & Recommandation : agrégation pondérée, top 3 métiers
EF4 – GenAI locale : plan de progression + bio via Flan-T5 sans API externe

Lancement local :
    streamlit run streamlit_app.py
"""

from __future__ import annotations

import datetime as dt
import io
import tempfile
from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
import plotly.express as px
import streamlit as st
from fpdf import FPDF

from backend.data_models import AnalysisResult, UserResponses, load_referentiel
from backend.pipeline import (
    build_competence_embeddings,
    full_pipeline,
    retrieve_context,
    canonical_competence_id,
)


st.set_page_config(page_title="AISCA - Navigator", page_icon="🧭", layout="wide")

# Design system (HSL -> converted in CSS variables)
st.markdown(
    """
    <style>
    :root {
      --background: hsl(210, 25%, 97%);
      --foreground: hsl(215, 25%, 12%);
      --card: hsl(0, 0%, 100%);
      --card-foreground: hsl(215, 25%, 12%);
      --primary: hsl(185, 70%, 28%);
      --primary-foreground: hsl(0, 0%, 100%);
      --secondary: hsl(210, 20%, 92%);
      --accent: hsl(200, 90%, 50%);
      --muted: hsl(210, 20%, 94%);
      --muted-foreground: hsl(215, 15%, 45%);
      --destructive: hsl(0, 70%, 55%);
      --border: hsl(210, 20%, 88%);
      --success: hsl(160, 70%, 40%);
      --warning: hsl(40, 95%, 55%);
      --gradient-primary: linear-gradient(90deg, hsl(185,70%,28%), hsl(200,90%,50%));
    }
        body {background-color: var(--background) !important; color: var(--foreground) !important;}
        .stApp {background-color: var(--background);}    
        h1, h2, h3, h4, h5, h6, p, label, .stMarkdown, .stTextInput label, .stTextArea label, .stSelectbox label { color: var(--foreground) !important; }
    .section-card {background: var(--card); padding: 18px 20px; border-radius: 14px; border:1px solid var(--border); box-shadow: 0 6px 18px rgba(0,0,0,0.04);}
    .pill {background: var(--secondary); padding:4px 10px; border-radius:12px; border:1px solid var(--border); font-size:12px; margin-right:6px; color: var(--foreground);}
        .stButton>button {background: var(--gradient-primary); color: var(--primary-foreground); border-radius:10px; border:none; padding:10px 18px; transition: all 0.2s ease-in-out;}
        .stButton>button:hover {opacity:0.94; box-shadow: 0 8px 18px rgba(0,0,0,0.08);}    
        .stTextInput>div>input, .stTextArea textarea, .stSelectbox>div>div {border-radius:10px !important; border:1px solid var(--border) !important; color: var(--foreground) !important;}
    .stMetric label, .stMetric value {color: var(--foreground);} 
        .stPlotlyChart > div {background: var(--card); border-radius: 12px; padding: 8px; border:1px solid var(--border);}
    </style>
    """,
    unsafe_allow_html=True,
)

CHART_COLORS = [
    "hsl(185,70%,28%)",
    "hsl(200,90%,50%)",
    "hsl(160,70%,40%)",
    "hsl(40,95%,55%)",
    "hsl(0,70%,55%)",
]

BLOC_RENAMING = {
    "B1": "Data Analyst",
    "B2": "Data Scientist",
    "B3": "NLP Specialist",
    "B4": "Data Engineer",
    "B5": "AI Engineer",
}


def competence_label(comp_id: str) -> str:
    canonical = canonical_competence_id(comp_id)
    return COMP_LABELS.get(canonical, COMP_LABELS.get(comp_id, comp_id))


def bloc_label(bloc_id: str, default: str | None = None) -> str:
    return BLOC_LABELS.get(bloc_id, default or bloc_id)


@st.cache_resource(show_spinner=False)
def load_assets():
    referentiel = load_referentiel()
    comp_emb = build_competence_embeddings(referentiel)
    return referentiel, comp_emb


referentiel, competence_embeddings = load_assets()
COMP_LABELS = {c.id: c.nom for b in referentiel.blocs for c in b.competences}
COMP_DESC = {c.id: c.description for b in referentiel.blocs for c in b.competences}
BLOC_LABELS = {b.id: BLOC_RENAMING.get(b.id, b.nom) for b in referentiel.blocs}
QUESTION_BY_ID = {
    q.id: {"texte": q.texte, "type": "likert", "bloc": q.bloc} for q in referentiel.questions.likert
}
QUESTION_BY_ID.update({q.id: {"texte": q.texte, "type": "ouverte", "bloc": (q.blocsLies[0] if q.blocsLies else "")} for q in referentiel.questions.ouvertes})
QUESTION_BY_ID.update({q.id: {"texte": q.texte, "type": "choix", "bloc": q.bloc} for q in referentiel.questions.choixMultiples})


def make_responses() -> UserResponses:
    """Collecte des réponses utilisateur (EF1)."""
    st.subheader("1. Questionnaire hybride")
    likert_values: Dict[str, int] = {}
    open_values: Dict[str, str] = {}
    multi_values: Dict[str, List[str]] = {}

    with st.container():
        st.markdown('<div class="section-card">', unsafe_allow_html=True)
        st.markdown("**Questions Likert (1-5)**")
        for q in referentiel.questions.likert:
            likert_values[q.id] = st.slider(q.texte, 1, 5, 3, key=f"likert_{q.id}")
        st.markdown('</div>', unsafe_allow_html=True)

    with st.container():
        st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
        st.markdown("**Questions ouvertes**")
        for q in referentiel.questions.ouvertes:
            open_values[q.id] = st.text_area(q.texte, height=120, key=f"open_{q.id}")
        st.markdown('</div>', unsafe_allow_html=True)

    with st.container():
        st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
        st.markdown("**Choix multiples**")
        for q in referentiel.questions.choixMultiples:
            multi_values[q.id] = st.multiselect(q.texte, q.options, key=f"multi_{q.id}")
        st.markdown('</div>', unsafe_allow_html=True)

    return UserResponses(
        likert=likert_values,
        ouvertes=open_values,
        choixMultiples=multi_values,
        timestamp=dt.datetime.now(dt.timezone.utc).isoformat(),
    )


def show_bloc_radar(result: AnalysisResult):
    if not result.blocsScores:
        return
    df = pd.DataFrame({"Bloc": [bloc_label(b.blocId, b.blocNom) for b in result.blocsScores], "Score": [b.score for b in result.blocsScores]})
    fig = px.line_polar(df, r="Score", theta="Bloc", line_close=True, range_r=[0, 1])
    fig.update_traces(fill="toself", line_color=CHART_COLORS[0], fillcolor="rgba(24,154,152,0.20)")
    fig.update_layout(
        polar=dict(radialaxis=dict(showline=False, gridcolor="rgba(0,0,0,0.07)", tickfont=dict(color="var(--foreground)"))),
        showlegend=False,
        paper_bgcolor="white",
        plot_bgcolor="white",
        margin=dict(l=40, r=40, t=30, b=30),
    )
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})


def show_competence_table(result: AnalysisResult):
    records = []
    for bloc in result.blocsScores:
        for comp, score in bloc.competenceScores.items():
            records.append({"Bloc": bloc_label(bloc.blocId, bloc.blocNom), "Compétence": competence_label(comp), "Score": round(score, 3)})
    if not records:
        st.info("Aucun score disponible.")
        return
    df = pd.DataFrame(records)
    df = df.groupby(["Bloc", "Compétence"], as_index=False)["Score"].mean()
    df = df.sort_values(by="Score", ascending=False)
    st.dataframe(df, use_container_width=True, hide_index=True)

    fig = px.bar(
        df,
        x="Score",
        y="Compétence",
        color="Bloc",
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
    )
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})


def show_recommendations(result: AnalysisResult):
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
    fig.update_layout(paper_bgcolor="white", plot_bgcolor="white", yaxis_tickformat=".0%", margin=dict(t=10, b=50))
    st.plotly_chart(fig, width="stretch", config={"displayModeBar": False})

    cols = st.columns(len(result.recommandations))
    for col, rec in zip(cols, result.recommandations):
        with col:
            score_cls = "metric-positive" if rec.score >= 0.6 else "metric-medium" if rec.score >= 0.4 else "metric-low"
            badge_color = {
                "metric-positive": "var(--success)",
                "metric-medium": "var(--warning)",
                "metric-low": "var(--destructive)",
            }[score_cls]
            st.markdown(
                f"<div style='background: {badge_color}; color:white; padding:8px 12px; border-radius:12px; font-weight:700;'>"
                f"Score: {rec.score*100:.1f}% ({rec.compatibilite})" 
                "</div>",
                unsafe_allow_html=True,
            )
            missing = [competence_label(cid) for cid in rec.competencesManquantes]
            st.caption(f"Compétences à renforcer: {', '.join(missing) or 'aucune majeure'}")


def show_generation(result: AnalysisResult):
    st.subheader("Plan de progression (Flan-T5 local)")
    st.markdown(result.planProgression or "Plan non généré")
    st.subheader("Bio professionnelle")
    st.write(result.bioProfessionnelle or "Bio non générée")


def show_context_snippets(responses: UserResponses):
    snippets = retrieve_context(list(responses.ouvertes.values()), referentiel, competence_embeddings)
    if not snippets:
        return
    st.subheader("Contexte RAG (compétences proches)")
    for text, sim in snippets:
        st.progress(sim, text)


def collect_responses_by_bloc(responses: UserResponses):
    rows = []
    # Likert
    for qid, value in responses.likert.items():
        meta = QUESTION_BY_ID.get(qid, {})
        rows.append({
            "Bloc": bloc_label(meta.get("bloc", ""), meta.get("bloc", "")),
            "Type": "Likert",
            "Question": meta.get("texte", qid),
            "Réponse": str(value),
        })
    # Ouvertes
    for qid, value in responses.ouvertes.items():
        meta = QUESTION_BY_ID.get(qid, {})
        rows.append({
            "Bloc": bloc_label(meta.get("bloc", ""), meta.get("bloc", "")),
            "Type": "Ouverte",
            "Question": meta.get("texte", qid),
            "Réponse": value,
        })
    # Choix multiples
    for qid, value in responses.choixMultiples.items():
        meta = QUESTION_BY_ID.get(qid, {})
        rows.append({
            "Bloc": bloc_label(meta.get("bloc", ""), meta.get("bloc", "")),
            "Type": "Choix multiples",
            "Question": meta.get("texte", qid),
            "Réponse": ", ".join(value),
        })
    return rows


def export_pdf(result: AnalysisResult, responses: UserResponses, buf: io.BytesIO):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "AISCA - Rapport", ln=1)
    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 8, f"Score global: {result.scoreGlobal*100:.1f}%")

    # Scores blocs
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Scores par bloc", ln=1)
    pdf.set_font("Arial", "", 11)
    for b in result.blocsScores:
        pdf.multi_cell(0, 7, f"- {bloc_label(b.blocId, b.blocNom)} : {b.score*100:.1f}%")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Top 3 métiers", ln=1)
    pdf.set_font("Arial", "", 11)
    for rec in result.recommandations:
        pdf.multi_cell(0, 7, f"- {rec.metier.titre}: {rec.score*100:.1f}% ({rec.compatibilite})")

    # Top compétences fortes
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Compétences fortes", ln=1)
    pdf.set_font("Arial", "", 11)
    for comp in result.competencesFortes:
        pdf.multi_cell(0, 7, f"- {comp}")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Compétences à renforcer", ln=1)
    pdf.set_font("Arial", "", 11)
    for comp in result.competencesFaibles:
        pdf.multi_cell(0, 7, f"- {comp}")

    # Graphiques : radar + bar recos
    try:
        # Radar blocs
        radar_df = pd.DataFrame({"Bloc": [bloc_label(b.blocId, b.blocNom) for b in result.blocsScores], "Score": [b.score for b in result.blocsScores]})
        radar_fig = px.line_polar(radar_df, r="Score", theta="Bloc", line_close=True, range_r=[0, 1])
        radar_fig.update_traces(fill="toself", line_color=CHART_COLORS[0], fillcolor="rgba(24,154,152,0.20)")
        radar_fig.update_layout(paper_bgcolor="white", plot_bgcolor="white")

        # Bar recos
        reco_df = pd.DataFrame(
            {
                "Métier": [r.metier.titre for r in result.recommandations],
                "Score": [r.score for r in result.recommandations],
            }
        )
        reco_fig = px.bar(reco_df, x="Métier", y="Score", range_y=[0, 1], color="Métier", color_discrete_sequence=CHART_COLORS)
        reco_fig.update_layout(paper_bgcolor="white", plot_bgcolor="white")

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_radar:
            radar_fig.write_image(tmp_radar.name)
            radar_path = tmp_radar.name
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_reco:
            reco_fig.write_image(tmp_reco.name)
            reco_path = tmp_reco.name

        pdf.image(radar_path, w=170)
        pdf.ln(4)
        pdf.image(reco_path, w=170)
    except Exception:
        pdf.multi_cell(0, 7, "Graphiques non disponibles dans cet export.")

    # Réponses par bloc
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Réponses par bloc", ln=1)
    pdf.set_font("Arial", "", 11)
    for row in collect_responses_by_bloc(responses):
        pdf.multi_cell(0, 6, f"[{row['Bloc']}] {row['Type']}: {row['Question']} => {row['Réponse']}")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Plan de progression", ln=1)
    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 7, result.planProgression or "Non généré")

    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 8, "Bio professionnelle", ln=1)
    pdf.set_font("Arial", "", 11)
    pdf.multi_cell(0, 7, result.bioProfessionnelle or "Non générée")

    buf.truncate(0)
    buf.seek(0)
    pdf.output(buf)


def export_excel(result: AnalysisResult, responses: UserResponses, buf: io.BytesIO):
    rows = []
    for bloc in result.blocsScores:
        for comp, score in bloc.competenceScores.items():
            rows.append({
                "Bloc": bloc_label(bloc.blocId, bloc.blocNom),
                "Compétence": competence_label(comp),
                "Score": score,
            })
    recs = pd.DataFrame({
        "Métier": [r.metier.titre for r in result.recommandations],
        "Score": [r.score for r in result.recommandations],
        "Compatibilité": [r.compatibilite for r in result.recommandations],
    })
    blocs_df = pd.DataFrame({
        "Bloc": [bloc_label(b.blocId, b.blocNom) for b in result.blocsScores],
        "Score": [b.score for b in result.blocsScores],
    })
    responses_df = pd.DataFrame(collect_responses_by_bloc(responses))

    with pd.ExcelWriter(buf, engine="xlsxwriter") as writer:
        pd.DataFrame(rows).to_excel(writer, sheet_name="Compétences", index=False)
        recs.to_excel(writer, sheet_name="Recommandations", index=False)
        blocs_df.to_excel(writer, sheet_name="Blocs", index=False)
        responses_df.to_excel(writer, sheet_name="Réponses", index=False)

    buf.seek(0)


def run_app():
    st.title("AISCA – Navigator RNCP Bloc 2 (local)")
    st.write(
        "Pipeline local : embeddings SBERT, similarité cosinus, scoring, recommandation, génération Flan-T5 sans API externe."
    )
    responses = make_responses()

    if st.button("Analyser & Générer", type="primary"):
        with st.spinner("Analyse locale en cours…"):
            result = full_pipeline(responses, referentiel)

        st.success("Analyse terminée")

        with st.container():
            st.markdown('<div class="section-card">', unsafe_allow_html=True)
            c1, c2 = st.columns([2, 1])
            with c1:
                st.subheader("Radar des blocs")
                show_bloc_radar(result)
            with c2:
                st.subheader("Score global")
                st.metric("Score global", f"{result.scoreGlobal*100:.1f}%")
            st.markdown('</div>', unsafe_allow_html=True)

        with st.container():
            st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
            st.subheader("Scores par compétence")
            show_competence_table(result)
            st.markdown('</div>', unsafe_allow_html=True)

        with st.container():
            st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
            show_recommendations(result)
            st.markdown('</div>', unsafe_allow_html=True)

        with st.container():
            st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
            show_generation(result)
            st.markdown('</div>', unsafe_allow_html=True)

        with st.container():
            st.markdown('<div class="section-card" style="margin-top:12px;">', unsafe_allow_html=True)
            show_context_snippets(responses)
            st.markdown('</div>', unsafe_allow_html=True)

        st.subheader("Export")
        col_pdf, col_xl = st.columns(2)
        if st.button("Exporter PDF", use_container_width=True):
            buf = io.BytesIO()
            export_pdf(result, responses, buf)
            st.download_button("Télécharger le PDF", data=buf.getvalue(), file_name="aisca_rapport.pdf")

        if st.button("Exporter Excel", use_container_width=True):
            buf_xl = io.BytesIO()
            export_excel(result, responses, buf_xl)
            st.download_button(
                "Télécharger Excel",
                data=buf_xl.getvalue(),
                file_name="aisca_scores.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )

    st.markdown("---")
    st.caption(
        "Projet académique – AISCA. Fonctionne sans API externe. Les modèles sont téléchargés une fois via Hugging Face puis mis en cache."
    )


if __name__ == "__main__":
    run_app()
