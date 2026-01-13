"""
API FastAPI locale (optionnelle) exposant le pipeline AISCA.

Endpoints:
- GET /health : statut
- POST /analyze : analyse complète (scoring + recommandations + génération plan/bio optionnelle)

Compatible avec Streamlit / autres orchestrateurs locaux. Aucun appel API externe.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Dict, List, Optional

from fastapi import FastAPI
from pydantic import BaseModel

from .data_models import AnalysisResult, UserResponses, load_referentiel
from .pipeline import full_pipeline


app = FastAPI(title="AISCA Local API", version="1.0.0")


class ResponsesPayload(BaseModel):
    likert: Dict[str, int]
    ouvertes: Dict[str, str]
    choixMultiples: Dict[str, List[str]]
    timestamp: Optional[str] = None
    include_generation: bool = True


@lru_cache(maxsize=1)
def get_referentiel_cached():
    return load_referentiel()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(payload: ResponsesPayload):
    referentiel = get_referentiel_cached()
    responses = UserResponses(
        likert=payload.likert,
        ouvertes=payload.ouvertes,
        choixMultiples=payload.choixMultiples,
        timestamp=payload.timestamp,
    )

    if payload.include_generation:
        result: AnalysisResult = full_pipeline(responses, referentiel)
    else:
        # Appel sans génération pour accélérer
        from .pipeline import analyze_user_profile, build_competence_embeddings

        comp_emb = build_competence_embeddings(referentiel)
        result = analyze_user_profile(responses, referentiel)
        # pas d’enrichissement générationnel
        result.planProgression = None
        result.bioProfessionnelle = None

    return {
        "scoreGlobal": result.scoreGlobal,
        "blocsScores": [
            {
                "blocId": b.blocId,
                "blocNom": b.blocNom,
                "score": b.score,
                "competenceScores": b.competenceScores,
            }
            for b in result.blocsScores
        ],
        "recommandations": [
            {
                "metier": {
                    "id": r.metier.id,
                    "titre": r.metier.titre,
                    "niveau": r.metier.niveau,
                },
                "score": r.score,
                "scoreCouverture": r.scoreCouverture,
                "compatibilite": r.compatibilite,
                "competencesManquantes": r.competencesManquantes,
            }
            for r in result.recommandations
        ],
        "competencesFortes": result.competencesFortes,
        "competencesFaibles": result.competencesFaibles,
        "planProgression": result.planProgression,
        "bioProfessionnelle": result.bioProfessionnelle,
    }


# Commande de lancement : uvicorn backend.api:app --reload --port 8000
