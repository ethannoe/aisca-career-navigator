from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Introduction", page_icon="🧭", layout="wide")

assets = ui.load_assets()
ui.inject_css()
ui.ensure_state(assets["referentiel"])
ui.render_stepper("intro")

st.title("Bienvenue dans l'évaluation AISCA")
left, right = st.columns([2, 1])
with left:
    st.markdown(
        """
        Cette évaluation combine auto-positionnement, questions ouvertes et analyse sémantique locale.
        Les données restent sur votre machine : embeddings SBERT, scoring métiers et génération sont exécutés en local.
        """
    )
    st.markdown("- 6 étapes guidées\n- ~5 minutes\n- Recommandations et plan de progression")
with right:
    st.markdown(
        "<div class='card'><strong>Conseil</strong><br/>Répondez de façon concise mais précise. Les questions ouvertes alimentent l'analyse sémantique et la génération du plan.",
        unsafe_allow_html=True,
    )

cta_col1, cta_col2 = st.columns([1, 2])
with cta_col1:
    if st.button("Passer à l'auto-évaluation", key="go_auto", use_container_width=True):
        ui.mark_step_done("intro")
        ui.switch_page_safe("pages/2_Auto_evaluation.py")
with cta_col2:
    st.caption("Étape 1/6")
