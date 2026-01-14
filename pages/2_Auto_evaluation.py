from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Auto-évaluation", page_icon="🧭", layout="wide")

assets = ui.load_assets()
referentiel = assets["referentiel"]
ui.inject_css()
ui.ensure_state(referentiel)
ui.render_stepper("auto")

st.title("Auto-évaluation")
st.markdown("Positionnez-vous sur l'échelle 1 (débutant) à 5 (expert). Cela alimente le scoring initial.")

st.markdown("<div class='section-card'>", unsafe_allow_html=True)
for q in referentiel.questions.likert:
    ui.likert_row(q.id, q.texte, helper="Débutant → Expert")
st.markdown("</div>", unsafe_allow_html=True)

nav_prev, nav_next = st.columns([1, 1])
with nav_prev:
    if st.button("← Retour introduction", use_container_width=True):
        ui.switch_page_safe("pages/1_Introduction.py")
with nav_next:
    if st.button("Continuer vers expériences →", use_container_width=True):
        ui.mark_step_done("auto")
        ui.switch_page_safe("pages/3_Experiences.py")
