"""
Script de pré-téléchargement des modèles HF utilisés par AISCA.

Objectif : permettre un usage totalement offline après exécution unique.

Télécharge et met en cache :
- sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (embeddings)
- google/flan-t5-small (génération)

Usage :
    python download_models.py
    # Option : python download_models.py --cache-dir ~/.cache/aisca --embedding-model <id> --gen-model <id>
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from sentence_transformers import SentenceTransformer
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


DEFAULT_CACHE = Path.home() / ".cache" / "aisca"
DEFAULT_EMB = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
DEFAULT_GEN = "google/flan-t5-small"


def ensure_cache_env(cache_dir: Path):
    cache_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("TRANSFORMERS_CACHE", str(cache_dir))
    os.environ.setdefault("HF_HOME", str(cache_dir))
    os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", str(cache_dir))


def download_models(cache_dir: Path, embedding_model: str, gen_model: str):
    ensure_cache_env(cache_dir)
    print(f"Cache: {cache_dir}")

    print(f"→ Téléchargement embedding : {embedding_model}")
    _ = SentenceTransformer(embedding_model, device="cpu")

    print(f"→ Téléchargement modèle génératif : {gen_model}")
    tokenizer = AutoTokenizer.from_pretrained(gen_model)
    model = AutoModelForSeq2SeqLM.from_pretrained(gen_model)

    # Sauvegarde des configs/tokenizer pour usage offline complet
    tokenizer.save_pretrained(cache_dir / "tokenizer")
    model.save_pretrained(cache_dir / "gen_model")
    print("Téléchargement terminé. Le projet peut maintenant fonctionner sans connexion internet.")


def main():
    parser = argparse.ArgumentParser(description="Pré-télécharge les modèles AISCA pour un usage offline")
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE, help="Répertoire cache (défaut: ~/.cache/aisca)")
    parser.add_argument("--embedding-model", type=str, default=DEFAULT_EMB, help="Modèle d'embedding SBERT")
    parser.add_argument("--gen-model", type=str, default=DEFAULT_GEN, help="Modèle de génération")
    args = parser.parse_args()

    download_models(args.cache_dir, args.embedding_model, args.gen_model)


if __name__ == "__main__":
    main()
