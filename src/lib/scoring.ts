// Scoring engine for AISCA - Optimized for beginner-friendly evaluation
// This module implements semantic similarity scoring with enhanced tolerance

import type {
  Referentiel,
  UserResponses,
  BlocScore,
  MetierRecommandation,
  AnalysisResult,
} from "@/types/aisca";

// Enhanced competency keywords with beginner-friendly terms and synonyms
const COMPETENCY_KEYWORDS: { [key: string]: string[] } = {
  // B1 - Analyse de Données (enriched with beginner terms)
  C01: [
    "nettoyage", "nettoyer", "cleaning", "clean", "données manquantes", "manquantes", "missing",
    "outliers", "valeurs aberrantes", "preprocessing", "prétraitement", "data quality", "qualité",
    "pandas", "dataframe", "excel", "csv", "supprimer", "corriger", "filtrer", "null", "nan",
    "doublons", "duplicates", "erreurs", "incohérences", "vérifier", "valider", "traitement"
  ],
  C02: [
    "visualisation", "visualiser", "graphique", "graph", "dashboard", "tableau de bord", "tableau",
    "matplotlib", "seaborn", "plotly", "chart", "report", "rapport", "courbe", "histogramme",
    "bar", "camembert", "pie", "scatter", "nuage", "powerbi", "power bi", "excel", "présenter",
    "afficher", "montrer", "diagramme", "représentation", "visuel", "image", "kpi", "indicateur"
  ],
  C03: [
    "statistiques", "statistique", "stats", "moyenne", "mean", "médiane", "median", "écart-type",
    "std", "distribution", "test", "corrélation", "correlation", "analyse", "analyser", "calcul",
    "calculer", "variance", "probabilité", "normale", "pourcentage", "ratio", "proportion",
    "tendance", "trend", "comparaison", "comparer", "mesure", "chiffres", "données"
  ],
  C04: [
    "python", "programmation", "programmer", "code", "coder", "script", "fonction", "fonctions",
    "classe", "pandas", "numpy", "jupyter", "notebook", "librairie", "library", "bibliothèque",
    "import", "variable", "boucle", "loop", "condition", "if", "développer", "développement",
    "automatiser", "automatisation", "programme", "logiciel", "anaconda", "pip", "vscode"
  ],
  C05: [
    "sql", "base de données", "database", "bdd", "requête", "query", "join", "jointure", "select",
    "postgresql", "mysql", "sqlite", "table", "tables", "colonne", "ligne", "row", "where",
    "group by", "order", "insert", "update", "delete", "relationnel", "données structurées",
    "extraire", "extraction", "récupérer", "interroger", "stocker", "stockage"
  ],
  
  // B2 - Machine Learning (enriched)
  C06: [
    "classification", "classifier", "classer", "prédiction classe", "catégorie", "catégoriser",
    "random forest", "forêt aléatoire", "svm", "logistic", "logistique", "decision tree",
    "arbre", "knn", "naïve bayes", "classe", "étiquette", "label", "supervisé", "prédire",
    "prédiction", "modèle", "entraîner", "apprentissage", "spam", "fraude", "détection"
  ],
  C07: [
    "régression", "prédiction", "prédire", "valeur continue", "linear", "linéaire", "gradient",
    "loss", "erreur", "price", "prix", "forecast", "prévision", "estimation", "estimer",
    "numérique", "quantité", "modèle prédictif", "variable cible", "target", "tendance"
  ],
  C08: [
    "réseaux neurones", "neural", "neurone", "deep learning", "apprentissage profond", "cnn",
    "rnn", "transformer", "layers", "couches", "tensorflow", "pytorch", "keras", "perceptron",
    "activation", "poids", "weights", "backpropagation", "epoch", "batch", "ia", "intelligence"
  ],
  C09: [
    "évaluation", "évaluer", "métriques", "métrique", "accuracy", "précision", "precision",
    "recall", "rappel", "f1", "score", "roc", "auc", "cross-validation", "validation",
    "test", "train", "performance", "mesurer", "qualité", "erreur", "confusion", "matrice"
  ],
  C10: [
    "feature", "variable", "engineering", "sélection", "sélectionner", "extraction", "extraire",
    "transformation", "transformer", "créer", "nouvelle", "colonne", "attribut", "caractéristique",
    "normalisation", "standardisation", "encoding", "encodage", "one-hot"
  ],
  
  // B3 - NLP (enriched with simpler terms)
  C11: [
    "tokenization", "tokenizer", "token", "segmentation", "segmenter", "mot", "mots", "sous-mot",
    "nlp", "texte", "découper", "séparer", "phrase", "caractère", "unité", "linguistique"
  ],
  C12: [
    "embedding", "embeddings", "word2vec", "glove", "fasttext", "représentation vectorielle",
    "vecteur", "vecteurs", "espace vectoriel", "dimension", "sémantique", "similarité"
  ],
  C13: [
    "transformer", "transformers", "bert", "gpt", "chatgpt", "attention", "huggingface",
    "hugging face", "llm", "language model", "modèle langage", "pré-entraîné", "pretrained",
    "nlp", "traitement langage", "texte", "génération", "compréhension"
  ],
  C14: [
    "sémantique", "sens", "signification", "compréhension", "comprendre", "relation", "contexte",
    "meaning", "interprétation", "interpréter", "analyser", "analyse textuelle", "extraction"
  ],
  C15: [
    "sentiment", "sentiments", "opinion", "opinions", "émotion", "émotions", "positif", "négatif",
    "neutre", "analyse opinion", "avis", "commentaire", "commentaires", "review", "polarité"
  ],
  
  // B4 - Data Engineering (enriched)
  C16: [
    "etl", "elt", "pipeline", "pipelines", "extraction", "extraire", "transformation", "transformer",
    "chargement", "charger", "workflow", "flux", "données", "automatisation", "process", "traitement"
  ],
  C17: [
    "big data", "spark", "hadoop", "distributed", "distribué", "cluster", "scale", "scalable",
    "parallèle", "volume", "massif", "masse", "millions", "milliards", "terabyte", "données massives"
  ],
  C18: [
    "cloud", "aws", "amazon", "gcp", "google cloud", "azure", "microsoft", "s3", "ec2", "lambda",
    "serverless", "serveur", "hébergement", "déploiement", "stockage cloud", "service cloud"
  ],
  C19: [
    "orchestration", "orchestrer", "airflow", "prefect", "dag", "schedule", "planification",
    "planifier", "workflow", "automatisation", "cron", "tâche", "dépendance", "séquence"
  ],
  C20: [
    "qualité données", "data quality", "monitoring", "surveiller", "surveillance", "validation",
    "valider", "test data", "contrôle", "vérification", "vérifier", "intégrité", "cohérence"
  ],
  
  // B5 - IA Générative (enriched with common terms)
  C21: [
    "prompt", "prompts", "instruction", "instructions", "few-shot", "chain of thought", "cot",
    "prompt engineering", "question", "demande", "requête", "formuler", "rédiger", "optimiser"
  ],
  C22: [
    "rag", "retrieval", "augmented", "generation", "contexte", "documents", "document",
    "recherche", "récupération", "base connaissance", "knowledge", "enrichir", "augmenter"
  ],
  C23: [
    "fine-tuning", "fine tuning", "finetuning", "adaptation", "adapter", "transfer learning",
    "transfert", "lora", "qlora", "personnaliser", "spécialiser", "ajuster", "réentraîner"
  ],
  C24: [
    "api", "apis", "openai", "gemini", "claude", "anthropic", "integration", "intégrer",
    "llm api", "appel api", "connexion", "utiliser", "service", "clé api", "requête"
  ],
  C25: [
    "agent", "agents", "autonomous", "autonome", "multi-agent", "tool use", "outil", "outils",
    "planning", "planification", "reasoning", "raisonnement", "chatbot", "assistant", "automatique"
  ],
};

// Additional generic positive keywords that boost scores
const GENERIC_POSITIVE_KEYWORDS = [
  "projet", "expérience", "travaillé", "utilisé", "appris", "développé", "créé", "analysé",
  "implémenté", "construit", "réalisé", "mis en place", "formation", "cours", "pratique",
  "équipe", "collaboration", "résultat", "objectif", "solution", "problème", "résolu",
  "amélioration", "optimisation", "données", "data", "analyse", "model", "modèle"
];

// Calculate text similarity score with enhanced tolerance for beginners
function calculateTextSimilarity(text: string, keywords: string[]): number {
  if (!text || text.trim().length === 0) return 0;
  
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = normalizedText.split(/\s+/);
  
  let matchCount = 0;
  let partialMatchCount = 0;
  let totalWeight = 0;
  
  // Check for keyword matches
  keywords.forEach((keyword, index) => {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const weight = 1 / (index * 0.2 + 1); // More gradual weight decay
    totalWeight += weight;
    
    // Exact match
    if (normalizedText.includes(normalizedKeyword)) {
      matchCount += weight;
    } 
    // Partial match (keyword starts with word or word starts with keyword)
    else if (words.some(word => 
      (word.length >= 4 && normalizedKeyword.startsWith(word)) || 
      (normalizedKeyword.length >= 4 && word.startsWith(normalizedKeyword))
    )) {
      partialMatchCount += weight * 0.6;
    }
  });
  
  // Check for generic positive keywords (bonus)
  const genericBonus = GENERIC_POSITIVE_KEYWORDS.filter(kw => 
    normalizedText.includes(kw.toLowerCase())
  ).length * 0.03;
  
  // Base score for having content (minimum effort recognition)
  const contentLengthBonus = Math.min(words.length / 50, 0.25); // Up to 25% bonus for detailed answers
  
  // Calculate raw similarity
  const rawSimilarity = totalWeight > 0 
    ? (matchCount + partialMatchCount) / (totalWeight * 0.35) // More permissive divisor
    : 0;
  
  // Apply bonuses and cap at 1.0
  return Math.min(rawSimilarity + genericBonus + contentLengthBonus, 1);
}

// Calculate competence score from all user inputs - OPTIMIZED FOR BEGINNERS
function calculateCompetenceScore(
  competenceId: string,
  responses: UserResponses,
  referentiel: Referentiel
): number {
  const keywords = COMPETENCY_KEYWORDS[competenceId] || [];
  let totalScore = 0;
  let weightSum = 0;
  
  // Base score for any participation (recognizes effort)
  const hasAnyResponse = Object.keys(responses.likert).length > 0 || 
                         Object.values(responses.ouvertes).some(r => r && r.length > 10) ||
                         Object.keys(responses.choixMultiples).length > 0;
  
  const participationBonus = hasAnyResponse ? 0.15 : 0; // 15% base for participating

  // Score from Likert questions (increased contribution)
  referentiel.questions.likert.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const response = responses.likert[q.id];
      if (response !== undefined) {
        // More generous Likert scoring: 1=20%, 2=40%, 3=60%, 4=80%, 5=100%
        const likertScore = response / 5;
        totalScore += likertScore * 0.35; // Likert now contributes 35%
        weightSum += 0.35;
      }
    }
  });

  // Score from open questions (semantic matching with enhanced tolerance)
  const allOpenTexts: string[] = [];
  referentiel.questions.ouvertes.forEach((q) => {
    const response = responses.ouvertes[q.id];
    if (response && response.length > 0) {
      allOpenTexts.push(response);
    }
  });
  
  if (allOpenTexts.length > 0) {
    // Combine all open responses for broader matching
    const combinedText = allOpenTexts.join(" ");
    const similarity = calculateTextSimilarity(combinedText, keywords);
    
    // Apply enhanced scoring with minimum recognition
    const openScore = Math.max(similarity, allOpenTexts.length > 0 ? 0.2 : 0); // Minimum 20% if any text provided
    totalScore += openScore * 0.45; // Open questions contribute 45%
    weightSum += 0.45;
  }

  // Score from multiple choice questions (more generous)
  referentiel.questions.choixMultiples.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const selected = responses.choixMultiples[q.id] || [];
      if (selected.length > 0) {
        // Even one selection shows awareness - give partial credit
        const relevanceScore = Math.min((selected.length + 1) / 3, 1); // +1 bonus, easier to score high
        totalScore += relevanceScore * 0.2; // Multiple choice contributes 20%
        weightSum += 0.2;
      }
    }
  });

  // Calculate final score with participation bonus
  const baseScore = weightSum > 0 ? totalScore / weightSum : 0;
  return Math.min(baseScore + participationBonus, 1);
}

// Calculate bloc scores
function calculateBlocScores(
  responses: UserResponses,
  referentiel: Referentiel
): BlocScore[] {
  return referentiel.blocs.map((bloc) => {
    const competenceScores: { [key: string]: number } = {};
    
    bloc.competences.forEach((competence) => {
      competenceScores[competence.id] = calculateCompetenceScore(
        competence.id,
        responses,
        referentiel
      );
    });

    const scores = Object.values(competenceScores);
    const avgScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    // Apply bloc-level boost for beginners (recognize learning intent)
    const boostedScore = Math.min(avgScore * 1.15, 1); // 15% boost capped at 100%

    return {
      blocId: bloc.id,
      blocNom: bloc.nom,
      score: boostedScore,
      competenceScores,
    };
  });
}

// Calculate job recommendations - OPTIMIZED THRESHOLDS
function calculateRecommandations(
  blocsScores: BlocScore[],
  referentiel: Referentiel
): MetierRecommandation[] {
  const blocScoreMap: { [key: string]: number } = {};
  blocsScores.forEach((bs) => {
    blocScoreMap[bs.blocId] = bs.score;
  });

  const competenceScoreMap: { [key: string]: number } = {};
  blocsScores.forEach((bs) => {
    Object.entries(bs.competenceScores).forEach(([compId, score]) => {
      competenceScoreMap[compId] = score;
    });
  });

  return referentiel.metiers
    .map((metier) => {
      const requiredCompetences = metier.competencesRequises;
      let totalScore = 0;
      const competencesManquantes: string[] = [];

      requiredCompetences.forEach((compId) => {
        const score = competenceScoreMap[compId] || 0;
        totalScore += score;
        // Lower threshold for "missing" competence (was 0.4, now 0.25)
        if (score < 0.25) {
          const comp = referentiel.blocs
            .flatMap((b) => b.competences)
            .find((c) => c.id === compId);
          if (comp) {
            competencesManquantes.push(comp.nom);
          }
        }
      });

      const scoreCouverture = requiredCompetences.length > 0
        ? totalScore / requiredCompetences.length
        : 0;

      // Calculate bloc-based score with boost
      const blocScore = metier.blocsClés.reduce((sum, blocId) => {
        const bloc = referentiel.blocs.find((b) => b.id === blocId);
        const weight = bloc?.poids || 1;
        return sum + (blocScoreMap[blocId] || 0) * weight;
      }, 0) / metier.blocsClés.length;

      // Weighted final score with beginner boost
      const rawScore = (scoreCouverture * 0.6 + blocScore * 0.4);
      const finalScore = Math.min(rawScore * 1.2, 1); // 20% boost capped at 100%

      // More generous compatibility thresholds
      let compatibilite: MetierRecommandation["compatibilite"];
      if (finalScore >= 0.55) compatibilite = "excellente"; // Was 0.7
      else if (finalScore >= 0.40) compatibilite = "bonne";   // Was 0.5
      else if (finalScore >= 0.25) compatibilite = "moyenne"; // Was 0.35
      else compatibilite = "faible";

      return {
        metier,
        score: finalScore,
        scoreCouverture,
        competencesManquantes,
        compatibilite,
      };
    })
    .sort((a, b) => b.score - a.score);
}

// Identify strong and weak competences with adjusted thresholds
function identifyCompetenceStrengthsWeaknesses(
  blocsScores: BlocScore[],
  referentiel: Referentiel
): { fortes: string[]; faibles: string[] } {
  const allCompetenceScores: { name: string; score: number }[] = [];

  blocsScores.forEach((bs) => {
    const bloc = referentiel.blocs.find((b) => b.id === bs.blocId);
    if (bloc) {
      Object.entries(bs.competenceScores).forEach(([compId, score]) => {
        const comp = bloc.competences.find((c) => c.id === compId);
        if (comp) {
          allCompetenceScores.push({ name: comp.nom, score });
        }
      });
    }
  });

  allCompetenceScores.sort((a, b) => b.score - a.score);

  // Adjusted thresholds for beginners
  const fortes = allCompetenceScores
    .filter((c) => c.score >= 0.35) // Was 0.5
    .slice(0, 5)
    .map((c) => c.name);

  const faibles = allCompetenceScores
    .filter((c) => c.score < 0.25) // Was 0.4
    .slice(-5)
    .map((c) => c.name);

  return { fortes, faibles };
}

// Main analysis function
export function analyzeResponses(
  responses: UserResponses,
  referentiel: Referentiel
): AnalysisResult {
  // Calculate bloc scores
  const blocsScores = calculateBlocScores(responses, referentiel);

  // Calculate global score (weighted average with boost)
  const totalWeight = referentiel.blocs.reduce((sum, bloc) => sum + bloc.poids, 0);
  const rawGlobalScore = blocsScores.reduce((sum, bs) => {
    const bloc = referentiel.blocs.find((b) => b.id === bs.blocId);
    return sum + bs.score * (bloc?.poids || 1);
  }, 0) / totalWeight;
  
  // Apply global boost for engagement
  const scoreGlobal = Math.min(rawGlobalScore * 1.15, 1);

  // Get job recommendations
  const recommandations = calculateRecommandations(blocsScores, referentiel);

  // Identify strengths and weaknesses
  const { fortes, faibles } = identifyCompetenceStrengthsWeaknesses(blocsScores, referentiel);

  return {
    scoreGlobal,
    blocsScores,
    recommandations,
    competencesFortes: fortes,
    competencesFaibles: faibles,
  };
}

// Export helper for creating progression plan context
export function createProgressionContext(result: AnalysisResult): string {
  const topRecommandations = result.recommandations.slice(0, 3);
  const competencesAPrioriser = result.competencesFaibles.slice(0, 5);

  return `
Profil analysé:
- Score global de compétences: ${(result.scoreGlobal * 100).toFixed(0)}%
- Points forts: ${result.competencesFortes.join(", ")}
- Points à améliorer: ${competencesAPrioriser.join(", ")}

Métiers recommandés:
${topRecommandations.map((r, i) => `${i + 1}. ${r.metier.titre} (compatibilité: ${r.compatibilite}, score: ${(r.score * 100).toFixed(0)}%)
   Compétences manquantes: ${r.competencesManquantes.join(", ") || "Aucune majeure"}`).join("\n")}

Scores par domaine:
${result.blocsScores.map((bs) => `- ${bs.blocNom}: ${(bs.score * 100).toFixed(0)}%`).join("\n")}
`.trim();
}

// Export helper for creating bio context
export function createBioContext(result: AnalysisResult): string {
  return `
Points forts: ${result.competencesFortes.join(", ")}
Domaines d'expertise: ${result.blocsScores
    .filter((bs) => bs.score >= 0.35) // Adjusted threshold
    .map((bs) => bs.blocNom)
    .join(", ") || "En développement"}
Orientation recommandée: ${result.recommandations[0]?.metier.titre || "Data Professional"}
Niveau estimé: ${result.scoreGlobal >= 0.55 ? "Intermédiaire" : result.scoreGlobal >= 0.35 ? "Junior prometteur" : "Débutant motivé"}
`.trim();
}
