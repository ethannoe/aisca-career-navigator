# AISCA – Navigator (RNCP40875 Bloc 2)

Projet autonome de cartographie de compétences Data/IA aligné sur le référentiel RNCP40875 – Bloc 2. L’application combine un frontend React (Vite) et une application Streamlit locale couvrant le pipeline complet : questionnaire hybride → prétraitement NLP → embeddings SBERT → scoring/similarité → recommandations → génération de plan & bio avec Flan-T5, sans aucune API externe.

## Architecture

- **Frontend Vite/React (src/)** : questionnaire existant, visualisation UI.
- **Backend local (backend/)** :
  - `data_models.py` : dataclasses pour le référentiel/questions/réponses.
  - `pipeline.py` : prétraitement, embeddings SBERT, similarité cosinus, scoring blocs/compétences, top 3 métiers, RAG sur référentiel, génération locale (Flan-T5).
- **Interface Streamlit (`streamlit_app.py`)** : couvre EF1–EF4 en une page, exploite la pipeline locale.
- **Données** : référentiel métiers/compétences/questions dans `src/data/` (CSV/JSON).

## Pré-requis

- Python 3.10+
- Node 18+ (pour le frontend Vite si besoin)
- Accès ponctuel à Hugging Face lors du **premier lancement** pour télécharger les modèles open-source :
  - Embeddings : `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
  - Génération : `google/flan-t5-small`
  Les poids sont ensuite mis en cache localement; aucune API externe n’est requise.

## Installation rapide (pipeline + Streamlit)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
streamlit run streamlit_app.py
```

### Pré-téléchargement des modèles (offline)

```bash
python download_models.py
```
Télécharge SBERT et Flan-T5-small dans `~/.cache/aisca` pour un usage sans connexion ensuite. Vous pouvez changer le cache via `--cache-dir`.

## Utilisation (Streamlit)

1. Ouvrir l’URL locale fournie par Streamlit.
2. Renseigner le questionnaire hybride (Likert, ouvertes, choix multiples).
3. Cliquer **Analyser & Générer** :
   - Scoring par compétence/bloc (similarité cosinus + pondération)
   - Radar des blocs et tableau des scores
   - Top 3 métiers recommandés
   - Plan de progression et bio générés localement (Flan-T5)
   - Contexte RAG (compétences les plus proches)

## Tests unitaires

```bash
python -m pytest tests/test_pipeline.py
```
Les tests utilisent des mocks pour éviter le chargement réel des modèles (exécution rapide, <1s).

### Export et reporting
- PDF : bouton « Exporter PDF » dans l’app Streamlit (plan, bio, top métiers, scores).
- Excel : bouton « Exporter Excel » (scores blocs/compétences, recommandations).

### Nouveau design / visuels
- Design system cohérent (fond gris clair, cartes blanches, boutons teal à gradient, badges colorés).
- Radar blocs, bar chart top métiers/compétences avec palette dédiée (--chart-1 à --chart-5).
- Fusion des compétences proches (ex. C12/C14/C15) pour un affichage et un scoring cohérents.

### Scoring renforcé / lisibilité
- Barème Likert étalé et pondération plus forte des réponses ouvertes pour différencier les profils.
- Calcul de bloc = moyenne + top 3 compétences, pondéré par le poids du bloc pour faire ressortir les dominantes.
- Affichage des compétences avec leur intitulé complet (plus d’IDs), blocs renommés par métier (Data Analyst, Data Scientist, NLP Specialist, Data Engineer, AI Engineer).

### Export complet
- PDF/Excel : scores des 5 blocs, compétences fortes/faibles, top recommandations, réponses par bloc, plan & bio, graphiques exportés (radar + bar). 

## API locale (optionnel)

Lancer l’API :
```bash
uvicorn backend.api:app --reload --port 8000
```
Endpoints :
- `GET /health`
- `POST /analyze` (payload `likert`, `ouvertes`, `choixMultiples`, `include_generation` bool)
L’API réutilise le pipeline local et reste compatible avec Streamlit.

## Frontend Vite (optionnel)

```bash
npm install
npm run dev
```

## Conformité RNCP40875 – Bloc 2 (synthèse)

- **NLP/Data Science** : prétraitement texte, embeddings SBERT locaux, similarité cosinus, scoring contextualisé.
- **IA Générative locale** : prompts structurés, génération Flan-T5 offline (après cache), RAG sur référentiel.
- **Data Engineering** : référentiel structuré (CSV/JSON), cache embeddings, pipeline reproductible.
- **EF1–EF4** : acquisition questionnaire, moteur NLP, scoring/reco, enrichissement génératif, synthèse finale.
- **Déploiement local** : aucune clé/API externe; modèles et caches sur poste.

## Dépannage rapide

- Première exécution longue : téléchargement des modèles HF (~quelques centaines de Mo).
- Mémoire : Flan-T5-small fonctionne en CPU (<1.5 Go RAM). Réduire `max_new_tokens` si nécessaire.
- Cache embeddings : supprimable dans `~/.cache/aisca/` en cas de corruption.
- Offline complet : exécuter `python download_models.py` avant de couper le réseau.
