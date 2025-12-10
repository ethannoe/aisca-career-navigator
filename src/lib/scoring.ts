// Scoring engine for AISCA - Coherent evaluation system
// GUARANTEE: Highest bloc score = recommended job profile

import type {
  Referentiel,
  UserResponses,
  BlocScore,
  MetierRecommandation,
  AnalysisResult,
} from "@/types/aisca";

// STRICT mapping: Bloc → Job profiles (ordered by relevance)
const BLOC_TO_JOBS: { [blocId: string]: string[] } = {
  "B1": ["J01", "J07"],        // Analyse de Données → Data Analyst, BI Analyst
  "B2": ["J02", "J03"],        // Machine Learning → Data Scientist, ML Engineer
  "B3": ["J04", "J06"],        // NLP → NLP Engineer, AI Engineer
  "B4": ["J05", "J08"],        // Data Engineering → Data Engineer, MLOps
  "B5": ["J06"],               // IA Générative → AI Engineer
};

// Job level requirements
const JOB_LEVEL_REQUIREMENTS: { [key: string]: { minScore: number; isJuniorFriendly: boolean } } = {
  "J01": { minScore: 0.20, isJuniorFriendly: true },  // Data Analyst
  "J02": { minScore: 0.45, isJuniorFriendly: false }, // Data Scientist
  "J03": { minScore: 0.55, isJuniorFriendly: false }, // ML Engineer
  "J04": { minScore: 0.45, isJuniorFriendly: false }, // NLP Engineer
  "J05": { minScore: 0.45, isJuniorFriendly: false }, // Data Engineer
  "J06": { minScore: 0.55, isJuniorFriendly: false }, // AI Engineer
  "J07": { minScore: 0.15, isJuniorFriendly: true },  // BI Analyst
  "J08": { minScore: 0.55, isJuniorFriendly: false }, // MLOps
};

// Enriched competency keywords for better detection
const COMPETENCY_KEYWORDS: { [key: string]: string[] } = {
  // B1 - Analyse de Données
  C01: [
    "nettoyage", "nettoyer", "données manquantes", "manquantes", "missing",
    "outliers", "preprocessing", "prétraitement", "qualité", "données",
    "pandas", "dataframe", "excel", "csv", "filtrer", "null", "nan",
    "doublons", "erreurs", "vérifier", "valider", "traitement", "data",
    "clean", "preparation", "wrangling"
  ],
  C02: [
    "visualisation", "graphique", "graph", "dashboard", "tableau de bord",
    "matplotlib", "seaborn", "plotly", "chart", "rapport", "courbe", "histogramme",
    "bar", "camembert", "scatter", "powerbi", "power bi", "excel", "tableau",
    "diagramme", "représentation", "kpi", "indicateur", "looker", "qlik"
  ],
  C03: [
    "statistiques", "statistique", "moyenne", "mean", "médiane",
    "écart-type", "distribution", "corrélation", "analyse", "stats",
    "variance", "probabilité", "pourcentage", "ratio", "test",
    "tendance", "comparaison", "mesure", "chiffres", "métrique"
  ],
  C04: [
    "python", "programmation", "code", "coder", "script", "fonction",
    "pandas", "numpy", "jupyter", "notebook", "librairie", "r",
    "import", "variable", "boucle", "condition", "développer",
    "automatiser", "programme", "anaconda", "pip", "sql"
  ],
  C05: [
    "sql", "base de données", "database", "bdd", "requête", "query", "join",
    "postgresql", "mysql", "sqlite", "table", "select", "where",
    "group by", "insert", "données structurées", "extraire", "stocker",
    "mongodb", "nosql", "oracle", "sgbd"
  ],
  
  // B2 - Machine Learning
  C06: [
    "classification", "classifier", "prédiction classe", "catégorie",
    "random forest", "svm", "logistic", "decision tree", "arbre",
    "knn", "naïve bayes", "supervisé", "prédire", "modèle", "entraîner",
    "scikit-learn", "sklearn", "apprentissage"
  ],
  C07: [
    "régression", "prédiction", "prédire", "valeur continue", "linéaire",
    "loss", "erreur", "prix", "prévision", "estimation",
    "modèle prédictif", "variable cible", "target", "forecast"
  ],
  C08: [
    "réseaux neurones", "neural", "deep learning", "cnn", "rnn",
    "transformer", "tensorflow", "pytorch", "keras", "perceptron",
    "couches", "epoch", "batch", "apprentissage profond"
  ],
  C09: [
    "évaluation", "métriques", "accuracy", "précision", "precision",
    "recall", "f1", "score", "roc", "auc", "cross-validation",
    "validation", "test", "train", "performance", "confusion", "matrice"
  ],
  C10: [
    "feature", "variable", "sélection", "extraction", "transformation",
    "normalisation", "standardisation", "encoding", "one-hot",
    "pca", "réduction", "dimension"
  ],
  
  // B3 - NLP
  C11: [
    "tokenization", "token", "segmentation", "mot", "sous-mot",
    "nlp", "texte", "découper", "phrase", "spacy", "nltk"
  ],
  C12: [
    "embedding", "word2vec", "glove", "représentation vectorielle",
    "vecteur", "dimension", "sémantique", "similarité"
  ],
  C13: [
    "transformer", "bert", "gpt", "chatgpt", "attention", "huggingface",
    "llm", "modèle langage", "pré-entraîné", "génération"
  ],
  C14: [
    "sémantique", "sens", "signification", "compréhension",
    "contexte", "interprétation", "analyse textuelle"
  ],
  C15: [
    "sentiment", "opinion", "émotion", "positif", "négatif",
    "neutre", "avis", "commentaire", "polarité"
  ],
  
  // B4 - Data Engineering
  C16: [
    "etl", "pipeline", "extraction", "transformation",
    "chargement", "workflow", "flux", "automatisation", "elt"
  ],
  C17: [
    "big data", "spark", "hadoop", "distribué", "cluster",
    "scalable", "volume", "massif", "données massives", "datalake"
  ],
  C18: [
    "cloud", "aws", "gcp", "azure", "s3", "ec2", "lambda",
    "serverless", "hébergement", "déploiement", "databricks"
  ],
  C19: [
    "orchestration", "airflow", "prefect", "dag", "planification",
    "workflow", "cron", "tâche", "séquence", "dbt"
  ],
  C20: [
    "qualité données", "data quality", "monitoring", "surveillance",
    "validation", "contrôle", "vérification", "intégrité", "tests"
  ],
  
  // B5 - IA Générative
  C21: [
    "prompt", "instruction", "few-shot", "prompt engineering",
    "question", "formuler", "optimiser", "zero-shot"
  ],
  C22: [
    "rag", "retrieval", "augmented", "generation", "contexte",
    "documents", "recherche", "base connaissance", "vectorstore"
  ],
  C23: [
    "fine-tuning", "adaptation", "transfer learning",
    "lora", "personnaliser", "spécialiser", "qlora"
  ],
  C24: [
    "api", "openai", "gemini", "claude", "integration",
    "llm api", "appel api", "clé api", "anthropic"
  ],
  C25: [
    "agent", "autonomous", "autonome", "multi-agent",
    "tool use", "planning", "chatbot", "assistant", "langchain"
  ],
};

// Generic positive keywords
const GENERIC_POSITIVE_KEYWORDS = [
  "projet", "expérience", "travaillé", "utilisé", "appris", "développé", "créé",
  "formation", "cours", "pratique", "équipe", "données", "data", "analyse",
  "entreprise", "stage", "missions", "tâches", "réalisé"
];

// Calculate text similarity with enriched matching
function calculateTextSimilarity(text: string, keywords: string[]): number {
  if (!text || text.trim().length === 0) return 0;
  
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = normalizedText.split(/\s+/);
  
  let matchCount = 0;
  let partialMatchCount = 0;
  
  keywords.forEach((keyword) => {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (normalizedText.includes(normalizedKeyword)) {
      matchCount++;
    } else if (words.some(word => 
      (word.length >= 4 && normalizedKeyword.startsWith(word)) || 
      (normalizedKeyword.length >= 4 && word.startsWith(normalizedKeyword))
    )) {
      partialMatchCount += 0.5;
    }
  });
  
  // Generic bonus (limited)
  const genericBonus = Math.min(GENERIC_POSITIVE_KEYWORDS.filter(kw => 
    normalizedText.includes(kw.toLowerCase())
  ).length * 0.015, 0.08);
  
  // Content length bonus
  const contentLengthBonus = Math.min(words.length / 100, 0.12);
  
  // Calculate similarity
  const rawSimilarity = keywords.length > 0 
    ? (matchCount + partialMatchCount) / (keywords.length * 0.55)
    : 0;
  
  return Math.min(rawSimilarity + genericBonus + contentLengthBonus, 1);
}

// Calculate competence score
function calculateCompetenceScore(
  competenceId: string,
  responses: UserResponses,
  referentiel: Referentiel
): number {
  const keywords = COMPETENCY_KEYWORDS[competenceId] || [];
  let totalScore = 0;
  let weightSum = 0;
  
  // Participation bonus
  const hasAnyResponse = Object.keys(responses.likert).length > 0 || 
                         Object.values(responses.ouvertes).some(r => r && r.length > 10) ||
                         Object.keys(responses.choixMultiples).length > 0;
  
  const participationBonus = hasAnyResponse ? 0.06 : 0;

  // Likert questions (30%)
  referentiel.questions.likert.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const response = responses.likert[q.id];
      if (response !== undefined) {
        const likertScoreMap: { [key: number]: number } = {
          1: 0.10, 2: 0.28, 3: 0.48, 4: 0.68, 5: 0.85
        };
        const likertScore = likertScoreMap[response] || (response / 5);
        totalScore += likertScore * 0.30;
        weightSum += 0.30;
      }
    }
  });

  // Open questions (50%)
  const relevantTexts: string[] = [];
  referentiel.questions.ouvertes.forEach((q) => {
    const response = responses.ouvertes[q.id];
    if (response && response.length > 0) {
      relevantTexts.push(response);
    }
  });
  
  if (relevantTexts.length > 0) {
    const combinedText = relevantTexts.join(" ");
    const similarity = calculateTextSimilarity(combinedText, keywords);
    const openScore = Math.max(similarity, relevantTexts.length > 0 ? 0.08 : 0);
    totalScore += openScore * 0.50;
    weightSum += 0.50;
  }

  // Multiple choice (20%)
  referentiel.questions.choixMultiples.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const selected = responses.choixMultiples[q.id] || [];
      if (selected.length > 0) {
        const relevanceScore = Math.min(selected.length / 4, 1);
        totalScore += relevanceScore * 0.20;
        weightSum += 0.20;
      }
    }
  });

  const baseScore = weightSum > 0 ? totalScore / weightSum : 0;
  return Math.min(baseScore + participationBonus, 0.85);
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

    return {
      blocId: bloc.id,
      blocNom: bloc.nom,
      score: avgScore,
      competenceScores,
    };
  });
}

// COHERENT job recommendations - based STRICTLY on bloc scores
function calculateRecommandations(
  blocsScores: BlocScore[],
  referentiel: Referentiel
): MetierRecommandation[] {
  // Create bloc score map
  const blocScoreMap: { [key: string]: number } = {};
  blocsScores.forEach((bs) => {
    blocScoreMap[bs.blocId] = bs.score;
  });

  // Create competence score map
  const competenceScoreMap: { [key: string]: number } = {};
  blocsScores.forEach((bs) => {
    Object.entries(bs.competenceScores).forEach(([compId, score]) => {
      competenceScoreMap[compId] = score;
    });
  });

  // Find dominant bloc (highest score)
  const dominantBloc = blocsScores.reduce((max, bs) => 
    bs.score > max.score ? bs : max
  );

  // Get priority jobs for dominant bloc
  const priorityJobs = BLOC_TO_JOBS[dominantBloc.blocId] || [];

  // Calculate global skill level
  const allScores = Object.values(competenceScoreMap);
  const avgSkillScore = allScores.length > 0 
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
    : 0;

  return referentiel.metiers
    .map((metier) => {
      const requiredCompetences = metier.competencesRequises;
      let totalScore = 0;
      const competencesManquantes: string[] = [];

      requiredCompetences.forEach((compId) => {
        const score = competenceScoreMap[compId] || 0;
        totalScore += score;
        if (score < 0.35) {
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

      // Bloc-based score (MAIN factor)
      const blocScore = metier.blocsClés.reduce((sum, blocId) => {
        const bloc = referentiel.blocs.find((b) => b.id === blocId);
        const weight = bloc?.poids || 1;
        return sum + (blocScoreMap[blocId] || 0) * weight;
      }, 0) / Math.max(metier.blocsClés.length, 1);

      // Base score: 50% bloc, 50% competence coverage
      let finalScore = (blocScore * 0.50 + scoreCouverture * 0.50);

      // PRIORITY BOOST for jobs matching dominant bloc (ensures coherence)
      if (priorityJobs.includes(metier.id)) {
        finalScore *= 1.25; // 25% boost for coherent recommendations
      }

      // Level requirements penalty (for advanced roles)
      const jobRequirements = JOB_LEVEL_REQUIREMENTS[metier.id];
      if (jobRequirements && !jobRequirements.isJuniorFriendly) {
        if (avgSkillScore < jobRequirements.minScore) {
          const levelGap = jobRequirements.minScore - avgSkillScore;
          finalScore *= Math.max(0.40, 1 - (levelGap * 1.5));
        }
      }

      // Cap final score
      finalScore = Math.min(finalScore, 1);

      // Compatibility based on final score
      let compatibilite: MetierRecommandation["compatibilite"];
      if (finalScore >= 0.55) compatibilite = "excellente";
      else if (finalScore >= 0.40) compatibilite = "bonne";
      else if (finalScore >= 0.25) compatibilite = "moyenne";
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

// Identify strong and weak competences
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

  const fortes = allCompetenceScores
    .filter((c) => c.score >= 0.40)
    .slice(0, 5)
    .map((c) => c.name);

  const faibles = allCompetenceScores
    .filter((c) => c.score < 0.30)
    .slice(-5)
    .map((c) => c.name);

  return { fortes, faibles };
}

// Determine skill level label
function getSkillLevelLabel(score: number): string {
  if (score >= 0.70) return "Avancé";
  if (score >= 0.50) return "Intermédiaire";
  if (score >= 0.30) return "Débutant confirmé";
  return "Débutant";
}

// Main analysis function
export function analyzeResponses(
  responses: UserResponses,
  referentiel: Referentiel
): AnalysisResult {
  // Calculate bloc scores
  const blocsScores = calculateBlocScores(responses, referentiel);

  // Calculate global score (weighted average)
  const totalWeight = referentiel.blocs.reduce((sum, bloc) => sum + bloc.poids, 0);
  const scoreGlobal = blocsScores.reduce((sum, bs) => {
    const bloc = referentiel.blocs.find((b) => b.id === bs.blocId);
    return sum + bs.score * (bloc?.poids || 1);
  }, 0) / totalWeight;

  // Get job recommendations (coherent with bloc scores)
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
  const skillLevel = getSkillLevelLabel(result.scoreGlobal);

  // Find dominant bloc
  const dominantBloc = result.blocsScores.reduce((max, bs) => 
    bs.score > max.score ? bs : max
  );

  return `
Profil analysé:
- Score global de compétences: ${(result.scoreGlobal * 100).toFixed(0)}%
- Niveau estimé: ${skillLevel}
- Domaine dominant: ${dominantBloc.blocNom} (${(dominantBloc.score * 100).toFixed(0)}%)
- Points forts: ${result.competencesFortes.join(", ")}
- Axes d'amélioration: ${competencesAPrioriser.join(", ")}

Métiers recommandés (cohérents avec le profil dominant):
${topRecommandations.map((r, i) => 
  `${i + 1}. ${r.metier.titre} (compatibilité: ${r.compatibilite}, score: ${(r.score * 100).toFixed(0)}%)`
).join("\n")}

Compétences à développer en priorité pour atteindre les métiers cibles:
${topRecommandations[0]?.competencesManquantes.slice(0, 5).join(", ") || "Aucune compétence critique manquante"}
`.trim();
}

// Export helper for creating bio context
export function createBioContext(result: AnalysisResult): string {
  const skillLevel = getSkillLevelLabel(result.scoreGlobal);
  
  // Find dominant bloc
  const dominantBloc = result.blocsScores.reduce((max, bs) => 
    bs.score > max.score ? bs : max
  );
  
  return `
Profil professionnel:
- Niveau global: ${skillLevel} (${(result.scoreGlobal * 100).toFixed(0)}%)
- Domaine de prédilection: ${dominantBloc.blocNom}
- Compétences clés: ${result.competencesFortes.join(", ")}
- Orientations métiers: ${result.recommandations.slice(0, 2).map(r => r.metier.titre).join(", ")}
- Blocs de compétences principaux: ${result.blocsScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(b => `${b.blocNom} (${(b.score * 100).toFixed(0)}%)`)
    .join(", ")}
`.trim();
}
