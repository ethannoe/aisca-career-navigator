from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Expériences", page_icon="🧭", layout="wide")

assets = ui.load_assets()
referentiel = assets["referentiel"]
ui.inject_css()
ui.ensure_state(referentiel)
ui.render_stepper("xp")

st.title("Vos expériences marquantes")
st.markdown("Ces réponses sont analysées (SBERT) pour détecter les compétences. Rédigez au moins 20 mots.")

st.markdown("<div class='section-card'>", unsafe_allow_html=True)
for q in referentiel.questions.ouvertes:
    ui.experience_area(q.id, q.texte, min_words=max(q.minWords, 20))
st.markdown("</div>", unsafe_allow_html=True)

nav_prev, nav_next = st.columns([1, 1])
with nav_prev:
    if st.button("← Retour auto-évaluation", use_container_width=True):
        ui.switch_page_safe("pages/2_Auto_evaluation.py")
with nav_next:
    if st.button("Continuer vers compétences →", use_container_width=True):
        ui.mark_step_done("xp")
        ui.switch_page_safe("pages/4_Competences.py")
