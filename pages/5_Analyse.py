from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Analyse", page_icon="🧭", layout="wide")

assets = ui.load_assets()
referentiel = assets["referentiel"]
ui.inject_css()
ui.ensure_state(referentiel)
ui.render_stepper("analyse")

st.title("Analyse & génération locale")
st.markdown(
    "Lancement du pipeline : scoring (Likert/QCM), analyse sémantique (SBERT), recommandations et génération (Flan-T5)."
)

if st.button("Analyser & Générer", type="primary", use_container_width=True):
    result = ui.analyze_and_store(referentiel)
    ui.mark_step_done("analyse")
    ui.mark_step_done("resultats")
    st.success("Analyse terminée. Consultez les résultats.")
    ui.switch_page_safe("pages/6_Resultats.py")

st.caption("Vous pouvez revenir aux étapes précédentes pour ajuster vos réponses avant de lancer l'analyse.")
