from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Compétences", page_icon="🧭", layout="wide")

assets = ui.load_assets()
referentiel = assets["referentiel"]
ui.inject_css()
ui.ensure_state(referentiel)
ui.render_stepper("comp")

st.title("Compétences et outils utilisés")
st.markdown("Sélectionnez les options qui reflètent vos pratiques. Chaque choix affecte directement le scoring.")

st.markdown("<div class='section-card'>", unsafe_allow_html=True)
for q in referentiel.questions.choixMultiples:
    ui.multi_select(q.id, q.texte, q.options)
st.markdown("</div>", unsafe_allow_html=True)

nav_prev, nav_next = st.columns([1, 1])
with nav_prev:
    if st.button("← Retour expériences", use_container_width=True):
        ui.switch_page_safe("pages/3_Experiences.py")
with nav_next:
    if st.button("Passer à l'analyse →", use_container_width=True):
        ui.mark_step_done("comp")
        ui.switch_page_safe("pages/5_Analyse.py")
