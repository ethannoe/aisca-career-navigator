import builtins
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np


def _dummy_embed(texts):
    # Renvoie des vecteurs simples et déterministes (longueur 3)
    return np.vstack([np.array([i + 1, i + 2, i + 3], dtype=np.float32) for i, _ in enumerate(texts)])


def _dummy_generation_model():
    class DummyTok:
        def __call__(self, prompt, return_tensors=None, truncation=None, max_length=None):
            return {"input_ids": np.array([[1, 2, 3]])}

        def decode(self, arr, skip_special_tokens=True):
            return "DUMMY_GENERATION"

    class DummyModel:
        def generate(self, **kwargs):
            return np.array([[1, 2, 3, 4]])

    return DummyTok(), DummyModel()


def _sample_responses(referentiel):
    # Renseigne une réponse minimale pour chaque type de question
    likert = {q.id: 4 for q in referentiel.questions.likert[:2]}
    ouvertes = {q.id: "Projet data avec pandas et SQL" for q in referentiel.questions.ouvertes[:1]}
    choix = {q.id: q.options[:2] for q in referentiel.questions.choixMultiples[:1]}
    return {
        "likert": likert,
        "ouvertes": ouvertes,
        "choixMultiples": choix,
        "timestamp": "2025-01-01T00:00:00Z",
    }


def test_analyze_user_profile_smoke():
    from backend import pipeline
    from backend.data_models import load_referentiel, UserResponses

    referentiel = load_referentiel()
    responses = UserResponses(**_sample_responses(referentiel))

    with patch.object(pipeline, "embed_texts", side_effect=_dummy_embed), \
         patch.object(pipeline, "_load_sentence_model"), \
         patch.object(pipeline, "generate_local_text", return_value="DUMMY"), \
         patch.object(pipeline, "_load_generation_model", side_effect=_dummy_generation_model):

        result = pipeline.analyze_user_profile(responses, referentiel)

    assert result.scoreGlobal >= 0
    assert len(result.blocsScores) == len(referentiel.blocs)
    assert len(result.recommandations) > 0


def test_recommend_jobs_top3_sorted():
    from backend import pipeline
    from backend.data_models import BlocScore, Recommendation, load_referentiel

    referentiel = load_referentiel()
    # scores artificiels
    comp_scores = {c.id: 0.8 for b in referentiel.blocs for c in b.competences}
    bloc_scores = [
        BlocScore(blocId=b.id, blocNom=b.nom, score=0.8, competenceScores={c.id: 0.8 for c in b.competences})
        for b in referentiel.blocs
    ]

    recs = pipeline.recommend_jobs(bloc_scores, comp_scores, referentiel)
    assert recs == sorted(recs, key=lambda r: r.score, reverse=True)
    assert len(recs) <= 3
    assert all(isinstance(r, Recommendation) for r in recs)


def test_generate_local_text_fallback(monkeypatch):
    from backend import pipeline

    def boom(*args, **kwargs):
        raise RuntimeError("no model")

    with patch.object(pipeline, "_load_generation_model", side_effect=boom):
        txt = pipeline.generate_local_text("prompt test", max_new_tokens=8)

    assert "canevas" in txt.lower()
