from __future__ import annotations

import io

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Résultats", page_icon="🧭", layout="wide")

assets = ui.load_assets()
referentiel = assets["referentiel"]
comp_labels = assets["comp_labels"]
bloc_labels = assets["bloc_labels"]
ui.inject_css()
ui.ensure_state(referentiel)
ui.render_stepper("resultats")

st.title("Résultats de l'analyse")

result = st.session_state.get("analysis_result")
responses = st.session_state.get("analysis_responses")

if result is None or responses is None:
    st.info("Lancez l'analyse depuis l'étape 5 pour voir vos résultats.")
    if st.button("Aller à l'analyse", use_container_width=True):
        ui.switch_page_safe("pages/5_Analyse.py")
    st.stop()

st.markdown("<div class='section-card'>", unsafe_allow_html=True)
col1, col2 = st.columns([2, 1])
with col1:
    st.subheader("Radar des métiers")
    ui.show_bloc_radar(result, bloc_labels)
with col2:
    st.subheader("Score global")
    st.metric("Score", f"{result.scoreGlobal*100:.1f}%")
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section-card' style='margin-top:12px;'>", unsafe_allow_html=True)
st.subheader("Scores par compétence")
ui.show_competence_table(result, bloc_labels, comp_labels)
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section-card' style='margin-top:12px;'>", unsafe_allow_html=True)
ui.show_recommendations(result, comp_labels)
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section-card' style='margin-top:12px;'>", unsafe_allow_html=True)
ui.show_generation(result)
st.markdown("</div>", unsafe_allow_html=True)

st.markdown("<div class='section-card' style='margin-top:12px;'>", unsafe_allow_html=True)
ui.show_context_snippets(responses, referentiel, assets["competence_embeddings"])
st.markdown("</div>", unsafe_allow_html=True)

nav_prev = st.columns(1)[0]
with nav_prev:
    if st.button("← Ajuster mes réponses", use_container_width=True):
        ui.switch_page_safe("pages/2_Auto_evaluation.py")

# Export section
ui.render_export_section(result, responses, referentiel, assets["competence_embeddings"], bloc_labels, comp_labels)
