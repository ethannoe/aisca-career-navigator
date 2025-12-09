# Plan de Présentation Orale - AISCA

## Durée estimée: 15-20 minutes

---

## 1. Introduction (2 min)

### Accroche
- "Comment évaluer objectivement les compétences Data & IA d'un professionnel?"
- Présentation du problème: auto-évaluation biaisée, matching emploi-compétences difficile

### Présentation du projet
- **AISCA**: Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences
- Objectif: analyser les compétences via IA sémantique et recommander des métiers adaptés

---

## 2. Architecture Technique (4 min)

### Stack technologique
- Frontend: React + TypeScript + Tailwind CSS
- Visualisation: Recharts (radar, barres)
- Architecture: Component-based, State management avec hooks

### Modules clés
1. **Interface questionnaire**: Likert, ouvertes, choix multiples
2. **Moteur NLP sémantique**: Scoring par mots-clés pondérés (simulation SBERT)
3. **Système de scoring**: Formule pondérée multi-sources
4. **RAG Pipeline**: Retrieval → Context → Generation

### Diagramme d'architecture
```
[Utilisateur] → [Questionnaire] → [Moteur Scoring] → [Analyse] → [Recommandations]
                                        ↓                            ↓
                                  [Référentiel]              [GenAI (plan/bio)]
```

---

## 3. Démonstration Live (5 min)

### Parcours utilisateur
1. Page d'accueil et présentation
2. Questions Likert (auto-évaluation)
3. Questions ouvertes (expériences)
4. Questions à choix multiples (compétences techniques)
5. Animation d'analyse
6. Résultats: radar, recommandations, plan de progression

### Points à montrer
- Indicateur de progression
- Validation des réponses (compteur de mots)
- Graphiques interactifs
- Génération IA du plan et de la bio

---

## 4. Focus Technique (4 min)

### Analyse Sémantique
- Approche par mots-clés pondérés (inspiration SBERT)
- Calcul de similarité texte ↔ compétences
- Agrégation pondérée par bloc

### Formule de scoring
```
Score_bloc = Σ(score_competence) / n_competences
Score_global = Σ(Score_bloc × Poids_bloc) / Σ(Poids_bloc)
Score_metier = 0.6 × Couverture + 0.4 × Score_blocs_clés
```

### Architecture RAG
1. **Retrieval**: Extraction des compétences pertinentes, écarts
2. **Context**: Construction de prompts structurés
3. **Generation**: Plan de progression, bio professionnelle

---

## 5. Référentiel de Compétences (2 min)

### Structure
- 5 blocs de compétences (Data Analysis, ML, NLP, Data Engineering, IA Générative)
- 25 compétences détaillées
- 8 métiers cibles avec compétences requises

### Sources d'inspiration
- ROME (Répertoire Opérationnel des Métiers)
- European e-Competence Framework
- Standards professionnels du secteur

---

## 6. Respect du Cahier des Charges (2 min)

### Exigences fonctionnelles validées
- ✅ EF1: Acquisition de données (questionnaire hybride)
- ✅ EF2: Moteur NLP sémantique local
- ✅ EF3: Scoring pondéré et recommandation
- ✅ EF4: Augmentation GenAI contrôlée

### Contraintes respectées
- ✅ Analyse sémantique (pas juste numérique)
- ✅ Interface web fonctionnelle
- ✅ Visualisation (radar, barres)
- ✅ Caching des appels API
- ✅ 1 appel pour le plan, 1 appel pour la bio

---

## 7. Difficultés et Solutions (2 min)

### Challenges rencontrés
1. **Simulation SBERT en frontend**: Solution par mots-clés pondérés
2. **Interface responsive**: Tailwind CSS + composants adaptatifs
3. **Optimisation API**: Système de cache avec hash de validation

### Améliorations possibles
- Intégration SBERT réel via backend
- Enrichissement du référentiel
- Export PDF des résultats
- Historique des analyses

---

## 8. Conclusion (1 min)

### Résumé
- Application fonctionnelle de bout en bout
- Architecture RAG moderne et évolutive
- Respect des contraintes du cahier des charges

### Perspectives
- Déploiement en production
- Intégration avec bases de données d'emploi
- Extension à d'autres domaines métiers

---

## Questions & Réponses

*Prévoir des réponses pour:*
- Pourquoi cette stack technologique?
- Comment fonctionne le scoring exactement?
- Comment gérer l'enrichissement du référentiel?
- Quelles sont les limites de l'approche actuelle?

---

## Supports Visuels Suggérés

1. Slide architecture technique
2. Démo live de l'application
3. Capture d'écran des résultats
4. Diagramme du pipeline RAG
5. Tableau de correspondance cahier des charges / implémentation

---

© 2024 AISCA - EFREI Data Engineering & AI
