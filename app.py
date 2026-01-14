from __future__ import annotations

import streamlit as st

from ui import components as ui

st.set_page_config(page_title="AISCA - Navigator", page_icon="🧭", layout="wide")

assets = ui.load_assets()
ui.inject_css()
ui.ensure_state(assets["referentiel"])

st.markdown(
    """
    <div class="hero">
      <div class="badge">AISCA · Évaluation Data & IA</div>
      <h1>Découvrez votre profil Data & IA</h1>
      <p style="font-size:16px; max-width:720px;">Une évaluation interactive qui combine auto-positionnement, analyse sémantique et recommandations locales pour identifier vos métiers cibles et votre plan de progression.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

st.markdown("<div class='cards-grid'>", unsafe_allow_html=True)
cols = st.columns(3)
features = [
    ("Analyse Sémantique", "Vos expériences sont vectorisées (SBERT) pour repérer les compétences clés."),
    ("Recommandation Métiers", "Scores par bloc et top métiers alignés sur votre profil."),
    ("Plan de progression", "Plan d'actions et bio professionnelle générés localement (Flan-T5)."),
]
for col, (title, desc) in zip(cols, features):
    with col:
        st.markdown(f"<div class='card'><h4>{title}</h4><p>{desc}</p></div>", unsafe_allow_html=True)
        
st.markdown("</div>", unsafe_allow_html=True)

cta_col1, cta_col2 = st.columns([1, 2])
with cta_col1:
    if st.button("Commencer l'évaluation", key="cta_start", use_container_width=True):
        ui.switch_page_safe("pages/1_Introduction.py")
with cta_col2:
    st.caption("6 étapes · ~5 minutes · Données traitées localement")
