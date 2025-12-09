# AISCA - Documentation Technique

## Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences

### Vue d'ensemble

AISCA est une application web permettant d'analyser les compétences d'un utilisateur dans le domaine de la Data et de l'IA, et de lui recommander des métiers correspondant à son profil.

### Architecture

```
src/
├── components/
│   └── aisca/              # Composants de l'application
│       ├── Header.tsx      # En-tête de l'application
│       ├── StepIndicator.tsx # Indicateur de progression
│       ├── IntroStep.tsx   # Page d'introduction
│       ├── LikertStep.tsx  # Questions Likert
│       ├── OpenQuestionsStep.tsx # Questions ouvertes
│       ├── MultipleChoiceStep.tsx # Questions à choix multiples
│       ├── AnalysisStep.tsx # Animation d'analyse
│       ├── ResultsStep.tsx # Affichage des résultats
│       └── Questionnaire.tsx # Orchestration du questionnaire
├── data/
│   ├── referentiel.json    # Référentiel complet (JSON)
│   ├── competences.csv     # Export CSV des compétences
│   ├── metiers.csv         # Export CSV des métiers
│   └── blocs.csv           # Export CSV des blocs
├── lib/
│   ├── scoring.ts          # Moteur de scoring sémantique
│   ├── cache.ts            # Système de cache pour GenAI
│   ├── rag.ts              # Utilitaires RAG
│   └── utils.ts            # Utilitaires généraux
├── types/
│   └── aisca.ts            # Types TypeScript
└── pages/
    └── Index.tsx           # Page principale
```

### Moteur de Scoring Sémantique

Le moteur de scoring (`src/lib/scoring.ts`) implémente une analyse sémantique simplifiée inspirée de SBERT:

1. **Correspondance par mots-clés pondérés**: Chaque compétence est associée à un ensemble de mots-clés représentatifs
2. **Scoring multi-sources**: Combine les réponses Likert (30%), ouvertes (50%) et choix multiples (20%)
3. **Agrégation par bloc**: Les scores sont agrégés par bloc de compétences avec pondération
4. **Recommandation de métiers**: Calcul de la couverture des compétences requises par métier

### Architecture RAG

Le système RAG (`src/lib/rag.ts`) suit le pattern Retrieval-Augmented Generation:

1. **Retrieval**: Extraction des compétences pertinentes, scores par bloc, écarts avec les métiers cibles
2. **Context Construction**: Construction de prompts enrichis avec le contexte utilisateur
3. **Generation**: Génération du plan de progression et de la bio professionnelle

### Système de Cache

Le cache (`src/lib/cache.ts`) évite les appels API doublons:

- Stockage en localStorage avec hash des entrées
- Expiration après 24 heures
- Vérification de l'intégrité par hash

### Référentiel de Compétences

Le référentiel (`src/data/referentiel.json`) contient:

- **5 blocs de compétences**: Analyse de Données, ML, NLP, Data Engineering, IA Générative
- **25 compétences** réparties dans les blocs
- **8 métiers** avec leurs compétences requises
- **Questions**: 7 Likert, 5 ouvertes, 5 choix multiples

### Technologies

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Graphiques**: Recharts (radar, barres)
- **État**: React hooks (useState, useCallback)

### Guide d'Installation

```bash
# Cloner le projet
git clone <repository-url>
cd aisca

# Installer les dépendances
npm install

# Lancer en développement
npm run dev

# Build pour la production
npm run build
```

### Personnalisation

#### Ajouter une compétence

1. Ajouter dans `referentiel.json` sous le bloc approprié
2. Ajouter les mots-clés dans `COMPETENCY_KEYWORDS` de `scoring.ts`
3. Mettre à jour les CSV d'export

#### Ajouter un métier

1. Ajouter dans `referentiel.json` section `metiers`
2. Spécifier les compétences requises et blocs clés
3. Définir le seuil minimum de couverture

### Prompts GenAI

Les prompts sont construits dynamiquement dans `src/lib/rag.ts`:

- `buildProgressionPlanPrompt()`: Plan de progression personnalisé
- `buildBioPrompt()`: Bio professionnelle

### Contribution

Ce projet a été développé dans le cadre du module IA Générative de l'EFREI, programme Data Engineering & AI 2025-26.

---

© 2024 AISCA - EFREI Data Engineering & AI
