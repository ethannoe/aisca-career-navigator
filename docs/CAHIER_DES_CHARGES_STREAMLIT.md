# 📋 CAHIER DES CHARGES COMPLET - AISCA Streamlit

## 🎯 Objectif du Projet

Développer une application **Streamlit** appelée **AISCA** (Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences) qui permet d'évaluer les compétences des étudiants en Data Engineering & AI et de leur recommander des métiers adaptés à leur profil.

---

## 📊 Architecture Globale

```
AISCA/
├── streamlit_app.py          # Point d'entrée principal
├── pages/
│   ├── 1_questionnaire.py    # Étapes du questionnaire
│   ├── 2_resultats.py        # Affichage des résultats
├── components/
│   ├── header.py             # En-tête de l'application
│   ├── step_indicator.py     # Indicateur d'étapes
│   ├── likert_questions.py   # Questions Likert
│   ├── open_questions.py     # Questions ouvertes
│   ├── multiple_choice.py    # Questions à choix multiples
│   ├── charts.py             # Graphiques (radar, barres)
│   ├── recommendations.py    # Affichage des recommandations
├── lib/
│   ├── scoring.py            # Moteur de scoring
│   ├── rag.py                # Système RAG pour génération
│   ├── cache.py              # Cache des résultats
├── data/
│   └── referentiel.json      # Référentiel compétences/métiers
├── assets/
│   └── styles.css            # Styles personnalisés
└── requirements.txt
```

---

## 🎨 Design System & Couleurs

### Palette de Couleurs (HSL)

| Variable | HSL | Hex Approx | Usage |
|----------|-----|------------|-------|
| `background` | 210 40% 98% | #f8fafc | Fond de page |
| `foreground` | 222 47% 11% | #1e293b | Texte principal |
| `primary` | 180 50% 30% | #267373 | Boutons, liens, accents |
| `primary-foreground` | 210 40% 98% | #f8fafc | Texte sur primary |
| `secondary` | 215 25% 90% | #e2e8f0 | Fonds secondaires |
| `accent` | 199 95% 50% | #0ea5e9 | Highlights, badges |
| `muted` | 215 25% 95% | #f1f5f9 | Fonds désactivés |
| `destructive` | 0 84% 60% | #ef4444 | Erreurs, alertes |
| `success` | 142 76% 36% | #22c55e | Succès, validations |
| `warning` | 38 92% 50% | #f59e0b | Avertissements |

### Couleurs des Graphiques

| Variable | HSL | Usage |
|----------|-----|-------|
| `chart-1` | 180 60% 35% | Bloc 1 - Data Analyse |
| `chart-2` | 199 95% 50% | Bloc 2 - ML |
| `chart-3` | 142 70% 40% | Bloc 3 - NLP |
| `chart-4` | 240 60% 55% | Bloc 4 - Data Engineering |
| `chart-5` | 280 70% 55% | Bloc 5 - IA Générative |

### Couleurs de Compatibilité Métiers

| Niveau | Couleur | Description |
|--------|---------|-------------|
| Excellente | `#22c55e` (vert) | Score ≥ 55% |
| Bonne | `#3b82f6` (bleu) | Score ≥ 40% |
| Moyenne | `#f59e0b` (orange) | Score ≥ 25% |
| Faible | `#6b7280` (gris) | Score < 25% |

### Typographie

- **Titre principal**: Space Grotesk, Bold, 2rem
- **Sous-titres**: DM Sans, Semi-Bold, 1.5rem
- **Corps de texte**: DM Sans, Regular, 1rem
- **Labels**: DM Sans, Medium, 0.875rem

---

## 📱 Parcours Utilisateur (6 Étapes)

### Étape 1: Introduction
```python
# Écran d'accueil avec:
- Logo AISCA et titre
- Description du projet
- Bouton "Commencer l'évaluation"
- Temps estimé: ~10 minutes
```

### Étape 2: Questions Likert (7 questions)
```python
# Échelle de 1 à 5:
# 1 = Pas de connaissance
# 2 = Notions de base
# 3 = Intermédiaire
# 4 = Avancé
# 5 = Expert

questions_likert = [
    {
        "id": "Q_L1",
        "texte": "Quel est votre niveau de maîtrise en programmation Python ?",
        "competences": ["C04"],
        "bloc": "B1"
    },
    {
        "id": "Q_L2",
        "texte": "Quel est votre niveau d'expérience avec les techniques de Machine Learning ?",
        "competences": ["C06", "C07", "C08"],
        "bloc": "B2"
    },
    {
        "id": "Q_L3",
        "texte": "Quel est votre niveau de maîtrise des outils de visualisation de données ?",
        "competences": ["C02"],
        "bloc": "B1"
    },
    {
        "id": "Q_L4",
        "texte": "Quel est votre niveau d'expérience avec SQL et les bases de données ?",
        "competences": ["C05"],
        "bloc": "B1"
    },
    {
        "id": "Q_L5",
        "texte": "Quel est votre niveau de connaissance en traitement du langage naturel (NLP) ?",
        "competences": ["C11", "C12", "C13", "C14"],
        "bloc": "B3"
    },
    {
        "id": "Q_L6",
        "texte": "Quel est votre niveau d'expérience avec les services Cloud (AWS, GCP, Azure) ?",
        "competences": ["C18"],
        "bloc": "B4"
    },
    {
        "id": "Q_L7",
        "texte": "Quel est votre niveau de maîtrise de l'IA Générative et des LLMs ?",
        "competences": ["C21", "C22", "C24"],
        "bloc": "B5"
    }
]
```

### Étape 3: Questions Ouvertes (5 questions)
```python
questions_ouvertes = [
    {
        "id": "Q_O1",
        "texte": "Décrivez un projet d'analyse de données que vous avez réalisé. Quels outils et techniques avez-vous utilisés ?",
        "blocs": ["B1"],
        "min_words": 20
    },
    {
        "id": "Q_O2",
        "texte": "Expliquez une problématique de machine learning que vous avez résolue. Comment avez-vous évalué la performance ?",
        "blocs": ["B2"],
        "min_words": 25
    },
    {
        "id": "Q_O3",
        "texte": "Décrivez une expérience en traitement du langage (NLP). Quel modèle ou librairie avez-vous utilisé ?",
        "blocs": ["B3"],
        "min_words": 20
    },
    {
        "id": "Q_O4",
        "texte": "Parlez d'un pipeline de données (ETL/ELT) que vous avez conçu ou maintenu.",
        "blocs": ["B4"],
        "min_words": 20
    },
    {
        "id": "Q_O5",
        "texte": "Quelle est votre expérience avec l'IA générative (LLM, RAG, fine-tuning) ?",
        "blocs": ["B5"],
        "min_words": 20
    }
]
```

### Étape 4: Questions à Choix Multiples (4 questions)
```python
questions_qcm = [
    {
        "id": "Q_C1",
        "texte": "Quelles bibliothèques de data viz utilisez-vous ?",
        "options": ["Matplotlib", "Seaborn", "Plotly", "PowerBI/Tableau"],
        "competences": ["C02"],
        "bloc": "B1",
        "multiple": True  # Permet plusieurs réponses
    },
    {
        "id": "Q_C2",
        "texte": "Quelles plateformes Cloud avez-vous déjà utilisées ?",
        "options": ["AWS", "GCP", "Azure", "On-prem"],
        "competences": ["C18"],
        "bloc": "B4",
        "multiple": True
    },
    {
        "id": "Q_C3",
        "texte": "Quelles techniques de NLP avez-vous déjà mises en œuvre ?",
        "options": ["Tokenization", "Word Embeddings", "Transformers", "Sentiment Analysis"],
        "competences": ["C11", "C12", "C13", "C15"],
        "bloc": "B3",
        "multiple": True
    },
    {
        "id": "Q_C4",
        "texte": "Quelles briques d'IA générative avez-vous déjà utilisées ?",
        "options": ["Prompt engineering", "RAG", "Fine-tuning", "Agents"],
        "competences": ["C21", "C22", "C23", "C25"],
        "bloc": "B5",
        "multiple": True
    }
]
```

### Étape 5: Analyse (écran de chargement)
```python
# Animation de chargement avec:
- Spinner animé
- Message: "Analyse de vos compétences en cours..."
- Barre de progression
- Durée simulée: 2-3 secondes
```

### Étape 6: Résultats
```python
# Affichage complet des résultats (voir section Visualisations)
```

---

## 🧮 Moteur de Scoring

### Référentiel des Blocs de Compétences

```python
BLOCS = {
    "B1": {
        "nom": "Analyse de Données",
        "poids": 1.0,
        "profil": "Data Analyst / BI Analyst",
        "couleur": "#267373",
        "competences": ["C01", "C02", "C03", "C04", "C05"]
    },
    "B2": {
        "nom": "Machine Learning",
        "poids": 1.2,
        "profil": "Data Scientist / ML Engineer",
        "couleur": "#0ea5e9",
        "competences": ["C06", "C07", "C08", "C09", "C10"]
    },
    "B3": {
        "nom": "NLP - Traitement du Langage",
        "poids": 1.1,
        "profil": "NLP Engineer / AI Specialist",
        "couleur": "#22c55e",
        "competences": ["C11", "C12", "C13", "C14", "C15"]
    },
    "B4": {
        "nom": "Data Engineering",
        "poids": 1.0,
        "profil": "Data Engineer / MLOps",
        "couleur": "#6366f1",
        "competences": ["C16", "C17", "C18", "C19", "C20"]
    },
    "B5": {
        "nom": "IA Générative",
        "poids": 1.1,
        "profil": "AI Engineer / Prompt Engineer",
        "couleur": "#a855f7",
        "competences": ["C21", "C22", "C23", "C24", "C25"]
    }
}
```

### Mapping Bloc → Métiers Recommandés

```python
BLOC_TO_JOBS = {
    "B1": ["Data Analyst", "BI Analyst", "Reporting Analyst"],
    "B2": ["Data Scientist", "ML Engineer", "Research Scientist"],
    "B3": ["NLP Engineer", "AI Specialist", "Text Mining Expert"],
    "B4": ["Data Engineer", "MLOps Engineer", "Cloud Data Engineer"],
    "B5": ["AI Engineer", "Prompt Engineer", "GenAI Specialist"]
}
```

### Niveaux de Compétence (pour étudiants)

```python
JOB_LEVELS = {
    "Data Analyst": {"min_score": 0.25, "junior_friendly": True},
    "BI Analyst": {"min_score": 0.20, "junior_friendly": True},
    "Data Scientist": {"min_score": 0.40, "junior_friendly": False},
    "ML Engineer": {"min_score": 0.45, "junior_friendly": False},
    "NLP Engineer": {"min_score": 0.40, "junior_friendly": False},
    "Data Engineer": {"min_score": 0.35, "junior_friendly": True},
    "AI Engineer": {"min_score": 0.45, "junior_friendly": False},
    "MLOps Engineer": {"min_score": 0.40, "junior_friendly": False}
}
```

### Algorithme de Scoring

```python
def calculate_scores(responses):
    """
    Calcule les scores par bloc et les recommandations métiers.
    
    RÈGLES CRITIQUES:
    1. Le métier recommandé DOIT correspondre au bloc avec le score le plus élevé
    2. Plafonnement à 80% pour les étudiants
    3. Pénalité pour les métiers senior si score moyen < seuil
    """
    
    bloc_scores = {}
    
    # 1. SCORING LIKERT (40% du score total par bloc)
    for question in responses['likert']:
        score = question['value'] / 5.0  # Normaliser 1-5 vers 0-1
        score = min(score, 0.80)  # Plafond étudiant
        bloc_id = question['bloc']
        bloc_scores[bloc_id]['likert'] += score
    
    # 2. SCORING QUESTIONS OUVERTES (35% du score total par bloc)
    for question in responses['ouvertes']:
        text = question['value']
        # Analyse sémantique avec mots-clés
        keywords = get_bloc_keywords(question['bloc'])
        similarity = calculate_text_similarity(text, keywords)
        bloc_scores[question['bloc']]['ouvertes'] += similarity
    
    # 3. SCORING QCM (25% du score total par bloc)
    for question in responses['qcm']:
        num_selected = len(question['selected'])
        total_options = len(question['options'])
        score = num_selected / total_options
        bloc_scores[question['bloc']]['qcm'] += score
    
    # 4. AGRÉGATION PAR BLOC
    for bloc_id in bloc_scores:
        weights = {'likert': 0.40, 'ouvertes': 0.35, 'qcm': 0.25}
        bloc_scores[bloc_id]['total'] = sum(
            bloc_scores[bloc_id][key] * weights[key]
            for key in weights
        )
    
    # 5. DÉTERMINATION DU BLOC DOMINANT
    dominant_bloc = max(bloc_scores, key=lambda b: bloc_scores[b]['total'])
    
    # 6. RECOMMANDATIONS MÉTIERS
    # RÈGLE CRITIQUE: Le métier principal DOIT venir du bloc dominant
    recommended_jobs = []
    for job in BLOC_TO_JOBS[dominant_bloc]:
        job_score = bloc_scores[dominant_bloc]['total']
        
        # Pénalité si score insuffisant pour métier senior
        if not JOB_LEVELS[job]['junior_friendly']:
            if job_score < JOB_LEVELS[job]['min_score']:
                job_score *= 0.6  # Pénalité 40%
        
        recommended_jobs.append({
            'job': job,
            'score': job_score,
            'bloc': dominant_bloc
        })
    
    # Trier par score décroissant
    recommended_jobs.sort(key=lambda x: x['score'], reverse=True)
    
    return {
        'bloc_scores': bloc_scores,
        'dominant_bloc': dominant_bloc,
        'recommended_jobs': recommended_jobs[:3],  # Top 3
        'global_score': sum(b['total'] for b in bloc_scores.values()) / len(bloc_scores)
    }
```

### Mots-Clés par Bloc (pour analyse sémantique)

```python
BLOC_KEYWORDS = {
    "B1": [
        "pandas", "numpy", "sql", "tableau", "powerbi", "excel", 
        "analyse", "statistiques", "données", "rapport", "dashboard",
        "visualisation", "matplotlib", "seaborn", "plotly", "kpi",
        "indicateurs", "exploration", "nettoyage", "cleaning"
    ],
    "B2": [
        "machine learning", "ml", "classification", "régression",
        "random forest", "svm", "xgboost", "scikit-learn", "sklearn",
        "modèle", "prédiction", "validation", "cross-validation",
        "f1-score", "accuracy", "confusion matrix", "overfitting",
        "features", "hyperparamètres", "grid search"
    ],
    "B3": [
        "nlp", "traitement langage", "bert", "transformer", "gpt",
        "tokenization", "embedding", "word2vec", "sentiment",
        "huggingface", "spacy", "nltk", "texte", "corpus",
        "classification texte", "ner", "named entity"
    ],
    "B4": [
        "etl", "pipeline", "airflow", "spark", "hadoop", "kafka",
        "aws", "gcp", "azure", "cloud", "docker", "kubernetes",
        "data warehouse", "datalake", "bigquery", "redshift",
        "orchestration", "prefect", "dbt", "data quality"
    ],
    "B5": [
        "llm", "gpt", "chatgpt", "openai", "gemini", "claude",
        "prompt", "rag", "fine-tuning", "langchain", "agent",
        "génératif", "génération", "embedding", "vector database",
        "chromadb", "pinecone", "llama", "mistral"
    ]
}
```

---

## 📈 Visualisations

### 1. Indicateur d'Étapes (Step Indicator)

```python
# Barre de progression horizontale avec 6 étapes
STEPS = [
    {"id": "intro", "label": "Introduction", "short": "Intro"},
    {"id": "likert", "label": "Auto-évaluation", "short": "Likert"},
    {"id": "ouvertes", "label": "Questions ouvertes", "short": "Ouvertes"},
    {"id": "qcm", "label": "Choix multiples", "short": "QCM"},
    {"id": "analyse", "label": "Analyse", "short": "Analyse"},
    {"id": "resultats", "label": "Résultats", "short": "Résultats"}
]

# Visuel:
# ✓ ──── ✓ ──── ● ──── ○ ──── ○ ──── ○
# Intro   Likert  Ouvertes  QCM   Analyse  Résultats
```

### 2. Score Global (Jauge circulaire)

```python
# Grande jauge circulaire au centre
# Score de 0 à 100%
# Couleur selon le niveau:
#   - < 30%: Rouge
#   - 30-50%: Orange
#   - 50-70%: Bleu
#   - > 70%: Vert

# Label de niveau:
SKILL_LEVELS = {
    (0, 25): "Débutant",
    (25, 40): "Débutant confirmé", 
    (40, 55): "Intermédiaire",
    (55, 70): "Intermédiaire confirmé",
    (70, 100): "Avancé"
}
```

### 3. Profil Dominant (Carte mise en avant)

```python
# Carte en surbrillance avec:
# - Icône du profil
# - Nom du profil (ex: "Data Analyst / BI")
# - Score du bloc dominant
# - Badge "Profil dominant"
# - Couleur de fond: couleur du bloc avec opacité 10%
```

### 4. Scores par Profil Métier (Barres horizontales)

```python
# 5 barres horizontales, triées par score décroissant
# Chaque barre montre:
#   - Nom du profil (ex: "Data Analyst / BI")
#   - Score en pourcentage
#   - Couleur correspondant au bloc
#   - Le profil dominant a un indicateur spécial (étoile)

# Exemple visuel:
# Data Analyst / BI      ████████████████░░░░ 78% ⭐
# Data Engineer          ████████████░░░░░░░░ 62%
# ML / Data Scientist    ██████████░░░░░░░░░░ 48%
# NLP Engineer           ████████░░░░░░░░░░░░ 38%
# AI / GenAI Engineer    ██████░░░░░░░░░░░░░░ 28%
```

### 5. Graphique Radar (Spider Chart)

```python
import plotly.graph_objects as go

# Radar avec 5 axes (un par bloc)
# Échelle de 0 à 100
# Couleur de remplissage: primary avec opacité 30%
# Bordure: primary

fig = go.Figure(data=go.Scatterpolar(
    r=[score_b1, score_b2, score_b3, score_b4, score_b5],
    theta=['Analyse de Données', 'Machine Learning', 'NLP', 'Data Engineering', 'IA Générative'],
    fill='toself',
    fillcolor='rgba(38, 115, 115, 0.3)',
    line=dict(color='#267373', width=2)
))

fig.update_layout(
    polar=dict(
        radialaxis=dict(visible=True, range=[0, 100], tickvals=[20, 40, 60, 80, 100])
    )
)
```

### 6. Graphique Barres Horizontales par Domaine

```python
import plotly.express as px

# Barres horizontales, triées par score
# Couleur unique par bloc
# Tooltip avec détails

CHART_COLORS = {
    "B1": "#267373",  # Teal - Data Analyse
    "B2": "#0ea5e9",  # Blue - ML
    "B3": "#22c55e",  # Green - NLP
    "B4": "#6366f1",  # Indigo - Data Engineering
    "B5": "#a855f7"   # Purple - IA Générative
}

fig = px.bar(
    data,
    x='score',
    y='bloc_name',
    orientation='h',
    color='bloc_id',
    color_discrete_map=CHART_COLORS,
    text='score'
)
```

### 7. Top 3 Métiers Recommandés (Cartes)

```python
# 3 cartes alignées horizontalement
# Classement avec médailles: 🥇 🥈 🥉

# Chaque carte contient:
# - Position (1er, 2ème, 3ème)
# - Titre du métier
# - Score de compatibilité
# - Badge de compatibilité (couleur selon niveau)
# - Niveau requis (Junior/Mid/Senior)
# - Bloc associé

# Couleurs des médailles:
RANK_COLORS = {
    1: "#fbbf24",  # Or
    2: "#9ca3af",  # Argent
    3: "#cd7f32"   # Bronze
}

# Compatibilité:
# ≥ 55%: "Excellente" (vert)
# ≥ 40%: "Bonne" (bleu)
# ≥ 25%: "Moyenne" (orange)
# < 25%: "Faible" (gris)
```

### 8. Compétences Fortes et Faibles (Listes)

```python
# Deux colonnes:

# ✅ Points Forts              ⚠️ Axes d'Amélioration
# - Programmation Python       - Cloud Computing
# - Visualisation             - Réseaux de neurones
# - SQL                       - Fine-tuning LLM
```

### 9. Plan de Progression (Généré par IA)

```python
# Section avec:
# - Titre: "Plan de progression personnalisé"
# - Texte généré par LLM (300-500 mots)
# - Structure:
#   1. Points forts identifiés
#   2. Compétences à développer
#   3. Ressources recommandées
#   4. Objectifs à 3/6/12 mois

# Bouton "Générer le plan" avec spinner pendant la génération
```

### 10. Bio Professionnelle (Générée par IA)

```python
# Section avec:
# - Titre: "Votre bio professionnelle"
# - Texte généré par LLM (100-150 mots)
# - Style: professionnel, LinkedIn-ready
# - Bouton de copie dans le presse-papier
```

---

## 🔧 Composants Streamlit Spécifiques

### Header

```python
def render_header():
    st.markdown("""
        <div style="text-align: center; padding: 2rem 0;">
            <h1 style="font-size: 2.5rem; font-weight: bold; color: #267373;">
                🧠 AISCA
            </h1>
            <p style="font-size: 1.1rem; color: #64748b;">
                Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences
            </p>
        </div>
    """, unsafe_allow_html=True)
```

### Questions Likert

```python
def render_likert_question(question):
    st.markdown(f"**{question['texte']}**")
    
    options = {
        1: "Pas de connaissance",
        2: "Notions de base",
        3: "Intermédiaire",
        4: "Avancé",
        5: "Expert"
    }
    
    value = st.radio(
        label="",
        options=list(options.keys()),
        format_func=lambda x: f"{x} - {options[x]}",
        horizontal=True,
        key=question['id']
    )
    
    return value
```

### Questions Ouvertes

```python
def render_open_question(question):
    st.markdown(f"**{question['texte']}**")
    st.caption(f"Minimum {question['min_words']} mots requis")
    
    response = st.text_area(
        label="",
        height=150,
        key=question['id'],
        placeholder="Décrivez votre expérience en détail..."
    )
    
    word_count = len(response.split())
    if word_count < question['min_words']:
        st.warning(f"⚠️ {word_count}/{question['min_words']} mots")
    else:
        st.success(f"✓ {word_count} mots")
    
    return response
```

### Questions à Choix Multiples

```python
def render_multiple_choice(question):
    st.markdown(f"**{question['texte']}**")
    
    selected = st.multiselect(
        label="",
        options=question['options'],
        key=question['id']
    )
    
    return selected
```

### Navigation

```python
# Boutons Précédent / Suivant en bas de page
col1, col2, col3 = st.columns([1, 2, 1])

with col1:
    if current_step > 0:
        if st.button("← Précédent", use_container_width=True):
            st.session_state.step -= 1
            st.rerun()

with col3:
    if can_proceed:
        if st.button("Suivant →", type="primary", use_container_width=True):
            st.session_state.step += 1
            st.rerun()
```

---

## 💾 Gestion de l'État (Session State)

```python
# Initialisation
if 'step' not in st.session_state:
    st.session_state.step = 0

if 'responses' not in st.session_state:
    st.session_state.responses = {
        'likert': {},
        'ouvertes': {},
        'qcm': {},
        'timestamp': None
    }

if 'results' not in st.session_state:
    st.session_state.results = None

if 'plan_progression' not in st.session_state:
    st.session_state.plan_progression = None

if 'bio_professionnelle' not in st.session_state:
    st.session_state.bio_professionnelle = None
```

---

## 🤖 Intégration IA Générative (RAG)

### Configuration

```python
# Option 1: OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

# Option 2: Gemini
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)
```

### Prompt pour Plan de Progression

```python
PLAN_PROGRESSION_PROMPT = """
Tu es un conseiller en carrière spécialisé dans les métiers de la Data et de l'IA.

Voici le profil d'un étudiant:
- Score global: {score_global}%
- Profil dominant: {profil_dominant}
- Points forts: {points_forts}
- Axes d'amélioration: {axes_amelioration}
- Métier recommandé: {metier_recommande}

Génère un plan de progression personnalisé et réaliste pour un étudiant.
Le plan doit être structuré ainsi:
1. Synthèse du profil (2-3 phrases)
2. Objectifs à court terme (3 mois)
3. Objectifs à moyen terme (6 mois)
4. Objectifs à long terme (12 mois)
5. Ressources recommandées (cours, certifications, projets)

Reste réaliste et adapté au niveau étudiant.
Utilise un ton encourageant mais professionnel.
"""
```

### Prompt pour Bio Professionnelle

```python
BIO_PROFESSIONNELLE_PROMPT = """
Tu es un expert en personal branding et en rédaction de profils LinkedIn.

Voici les informations sur un étudiant en Data/IA:
- Profil dominant: {profil_dominant}
- Compétences clés: {competences_cles}
- Score global: {score_global}%

Génère une bio professionnelle de 100-150 mots pour LinkedIn.
- Style: professionnel mais accessible
- Mentionne les compétences techniques principales
- Indique le type de poste recherché
- Ajoute une touche personnelle
- Utilise la première personne (je)
"""
```

---

## 📁 Structure des Données

### Fichier referentiel.json

```json
{
  "version": "1.0.0",
  "lastUpdated": "2024-12-09",
  "description": "Référentiel AISCA - Compétences Data Engineering & AI",
  
  "blocs": [
    {
      "id": "B1",
      "nom": "Analyse de Données",
      "description": "Compétences fondamentales en analyse et exploration de données",
      "poids": 1.0,
      "competences": [
        { "id": "C01", "nom": "Nettoyage de données", "description": "..." },
        { "id": "C02", "nom": "Visualisation de données", "description": "..." }
      ]
    }
  ],
  
  "metiers": [
    {
      "id": "J01",
      "titre": "Data Analyst",
      "description": "Analyse et interprétation des données",
      "niveau": "Junior à Senior",
      "competencesRequises": ["C01", "C02", "C03", "C04", "C05"],
      "blocsClés": ["B1"],
      "seuilMinimum": 0.6
    }
  ],
  
  "questions": {
    "likert": [...],
    "ouvertes": [...],
    "choixMultiples": [...]
  }
}
```

---

## ⚙️ Configuration Technique

### requirements.txt

```
streamlit>=1.28.0
plotly>=5.18.0
pandas>=2.0.0
numpy>=1.24.0
openai>=1.0.0  # ou google-generativeai pour Gemini
sentence-transformers>=2.2.0  # pour analyse sémantique locale
scikit-learn>=1.3.0
```

### Variables d'Environnement

```bash
# .env
OPENAI_API_KEY=sk-xxx
# ou
GOOGLE_API_KEY=xxx
```

### Configuration Streamlit

```toml
# .streamlit/config.toml
[theme]
primaryColor = "#267373"
backgroundColor = "#f8fafc"
secondaryBackgroundColor = "#e2e8f0"
textColor = "#1e293b"
font = "sans serif"

[server]
headless = true
port = 8501
```

---

## 🚀 Points Critiques à Respecter

### 1. Cohérence Scoring ↔ Recommandations
```
❌ INTERDIT: Recommander un métier dont le bloc n'est pas dominant
✅ OBLIGATOIRE: Le métier #1 doit correspondre au bloc avec le score le plus élevé
```

### 2. Calibrage Étudiant
```
❌ INTERDIT: Score > 80% pour un étudiant
✅ OBLIGATOIRE: Plafonnement automatique des scores à 80%
```

### 3. Pénalités Métiers Senior
```
❌ INTERDIT: Recommander "AI Engineer" à un débutant
✅ OBLIGATOIRE: Pénalité de 40% si score < seuil minimum du métier
```

### 4. Visualisations Cohérentes
```
❌ INTERDIT: Graphiques qui ne reflètent pas les vrais scores
✅ OBLIGATOIRE: Échelles cohérentes, couleurs distinctes, profil dominant visible
```

---

## 📋 Checklist de Validation

- [ ] Les 6 étapes sont fonctionnelles
- [ ] Les questions Likert utilisent l'échelle 1-5
- [ ] Les questions ouvertes vérifient le nombre de mots
- [ ] Le scoring agrège correctement les 3 sources
- [ ] Le bloc dominant détermine les métiers recommandés
- [ ] Les visualisations reflètent les vrais scores
- [ ] Le plan de progression est généré par IA
- [ ] La bio professionnelle est générée par IA
- [ ] L'état est persisté dans session_state
- [ ] Les couleurs respectent le design system

---

## 📞 Contact

AISCA - Projet IA Générative
EFREI Data Engineering & AI 2025-26
