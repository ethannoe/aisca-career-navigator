// Scoring engine for AISCA - Realistic evaluation for students
// Balanced scoring: generous for beginners but realistic job matching

import type {
  Referentiel,
  UserResponses,
  BlocScore,
  MetierRecommandation,
  AnalysisResult,
} from "@/types/aisca";

// Job family definitions - used to filter unrealistic recommendations
const JOB_FAMILIES: { [key: string]: string[] } = {
  "data_analysis": ["J01", "J07"], // Data Analyst, BI Analyst
  "data_science": ["J02"], // Data Scientist
  "ml_engineering": ["J03", "J08"], // ML Engineer, MLOps
  "nlp": ["J04"], // NLP Engineer
  "data_engineering": ["J05"], // Data Engineer
  "ai_engineering": ["J06"], // AI Engineer
};

// Define which job families are compatible (can be suggested together)
const COMPATIBLE_FAMILIES: { [key: string]: string[] } = {
  "data_analysis": ["data_analysis"], // Data Analyst stays in analysis family
  "data_science": ["data_analysis", "data_science"], 
  "ml_engineering": ["ml_engineering"],
  "nlp": ["nlp"],
  "data_engineering": ["data_engineering"],
  "ai_engineering": ["ai_engineering", "nlp"],
};

// Job level requirements (minimum score to realistically qualify)
const JOB_LEVEL_REQUIREMENTS: { [key: string]: { minScore: number; isJuniorFriendly: boolean } } = {
  "J01": { minScore: 0.25, isJuniorFriendly: true }, // Data Analyst - Junior OK
  "J02": { minScore: 0.50, isJuniorFriendly: false }, // Data Scientist - needs experience
  "J03": { minScore: 0.60, isJuniorFriendly: false }, // ML Engineer - Senior role
  "J04": { minScore: 0.50, isJuniorFriendly: false }, // NLP Engineer - specialized
  "J05": { minScore: 0.50, isJuniorFriendly: false }, // Data Engineer - needs infra exp
  "J06": { minScore: 0.60, isJuniorFriendly: false }, // AI Engineer - Senior role
  "J07": { minScore: 0.20, isJuniorFriendly: true }, // BI Analyst - Junior OK
  "J08": { minScore: 0.60, isJuniorFriendly: false }, // MLOps - Senior role
};

// Competency keywords - focused on beginner terms
const COMPETENCY_KEYWORDS: { [key: string]: string[] } = {
  // B1 - Analyse de Données
  C01: [
    "nettoyage", "nettoyer", "données manquantes", "manquantes", "missing",
    "outliers", "preprocessing", "prétraitement", "qualité",
    "pandas", "dataframe", "excel", "csv", "filtrer", "null", "nan",
    "doublons", "erreurs", "vérifier", "valider", "traitement"
  ],
  C02: [
    "visualisation", "graphique", "graph", "dashboard", "tableau de bord",
    "matplotlib", "seaborn", "plotly", "chart", "rapport", "courbe", "histogramme",
    "bar", "camembert", "scatter", "powerbi", "power bi", "excel",
    "diagramme", "représentation", "kpi", "indicateur"
  ],
  C03: [
    "statistiques", "statistique", "moyenne", "mean", "médiane",
    "écart-type", "distribution", "corrélation", "analyse",
    "variance", "probabilité", "pourcentage", "ratio",
    "tendance", "comparaison", "mesure", "chiffres"
  ],
  C04: [
    "python", "programmation", "code", "coder", "script", "fonction",
    "pandas", "numpy", "jupyter", "notebook", "librairie",
    "import", "variable", "boucle", "condition", "développer",
    "automatiser", "programme", "anaconda", "pip"
  ],
  C05: [
    "sql", "base de données", "database", "bdd", "requête", "query", "join",
    "postgresql", "mysql", "sqlite", "table", "select", "where",
    "group by", "insert", "données structurées", "extraire", "stocker"
  ],
  
  // B2 - Machine Learning
  C06: [
    "classification", "classifier", "prédiction classe", "catégorie",
    "random forest", "svm", "logistic", "decision tree", "arbre",
    "knn", "naïve bayes", "supervisé", "prédire", "modèle", "entraîner"
  ],
  C07: [
    "régression", "prédiction", "prédire", "valeur continue", "linéaire",
    "loss", "erreur", "prix", "prévision", "estimation",
    "modèle prédictif", "variable cible", "target"
  ],
  C08: [
    "réseaux neurones", "neural", "deep learning", "cnn", "rnn",
    "transformer", "tensorflow", "pytorch", "keras", "perceptron",
    "couches", "epoch", "batch"
  ],
  C09: [
    "évaluation", "métriques", "accuracy", "précision", "precision",
    "recall", "f1", "score", "roc", "auc", "cross-validation",
    "validation", "test", "train", "performance", "confusion"
  ],
  C10: [
    "feature", "variable", "sélection", "extraction", "transformation",
    "normalisation", "standardisation", "encoding", "one-hot"
  ],
  
  // B3 - NLP
  C11: [
    "tokenization", "token", "segmentation", "mot", "sous-mot",
    "nlp", "texte", "découper", "phrase"
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
    "chargement", "workflow", "flux", "automatisation"
  ],
  C17: [
    "big data", "spark", "hadoop", "distribué", "cluster",
    "scalable", "volume", "massif", "données massives"
  ],
  C18: [
    "cloud", "aws", "gcp", "azure", "s3", "ec2", "lambda",
    "serverless", "hébergement", "déploiement"
  ],
  C19: [
    "orchestration", "airflow", "prefect", "dag", "planification",
    "workflow", "cron", "tâche", "séquence"
  ],
  C20: [
    "qualité données", "data quality", "monitoring", "surveillance",
    "validation", "contrôle", "vérification", "intégrité"
  ],
  
  // B5 - IA Générative
  C21: [
    "prompt", "instruction", "few-shot", "prompt engineering",
    "question", "formuler", "optimiser"
  ],
  C22: [
    "rag", "retrieval", "augmented", "generation", "contexte",
    "documents", "recherche", "base connaissance"
  ],
  C23: [
    "fine-tuning", "adaptation", "transfer learning",
    "lora", "personnaliser", "spécialiser"
  ],
  C24: [
    "api", "openai", "gemini", "claude", "integration",
    "llm api", "appel api", "clé api"
  ],
  C25: [
    "agent", "autonomous", "autonome", "multi-agent",
    "tool use", "planning", "chatbot", "assistant"
  ],
};

// Generic positive keywords (moderate bonus)
const GENERIC_POSITIVE_KEYWORDS = [
  "projet", "expérience", "travaillé", "utilisé", "appris", "développé", "créé",
  "formation", "cours", "pratique", "équipe", "données", "data", "analyse"
];

// Calculate text similarity - balanced for beginners
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
  
  // Generic bonus (limited to 10%)
  const genericBonus = Math.min(GENERIC_POSITIVE_KEYWORDS.filter(kw => 
    normalizedText.includes(kw.toLowerCase())
  ).length * 0.02, 0.10);
  
  // Content length bonus (limited to 15%)
  const contentLengthBonus = Math.min(words.length / 80, 0.15);
  
  // Calculate similarity (balanced)
  const rawSimilarity = keywords.length > 0 
    ? (matchCount + partialMatchCount) / (keywords.length * 0.6)
    : 0;
  
  return Math.min(rawSimilarity + genericBonus + contentLengthBonus, 1);
}

// Get user's primary job family based on responses
function detectUserJobFamily(responses: UserResponses): string | null {
  const allText = Object.values(responses.ouvertes).join(" ").toLowerCase();
  
  const jobMentions: { [key: string]: number } = {
    "data_analysis": 0,
    "data_science": 0,
    "ml_engineering": 0,
    "nlp": 0,
    "data_engineering": 0,
    "ai_engineering": 0,
  };
  
  // Keywords for each family - detect user's stated interest
  if (allText.match(/data analyst|analyste|bi analyst|business intelligence|tableau de bord|reporting|tableau|dashboard|excel|visualis/)) {
    jobMentions["data_analysis"] += 3;
  }
  if (allText.match(/data scientist|science des données|modèle prédictif|machine learning|prédiction|statistique/)) {
    jobMentions["data_science"] += 3;
  }
  if (allText.match(/ml engineer|mlops|déploiement.*modèle|production|industrialisation/)) {
    jobMentions["ml_engineering"] += 3;
  }
  if (allText.match(/nlp|traitement.*langage|text mining|chatbot|linguistique/)) {
    jobMentions["nlp"] += 3;
  }
  if (allText.match(/data engineer|pipeline|etl|infrastructure|ingénieur données|spark|hadoop/)) {
    jobMentions["data_engineering"] += 3;
  }
  if (allText.match(/ai engineer|ia générative|llm|gpt|agents|prompt/)) {
    jobMentions["ai_engineering"] += 3;
  }
  
  const maxFamily = Object.entries(jobMentions).reduce((a, b) => b[1] > a[1] ? b : a);
  return maxFamily[1] > 0 ? maxFamily[0] : null;
}

// Get job family from job ID
function getJobFamily(jobId: string): string | null {
  for (const [family, jobs] of Object.entries(JOB_FAMILIES)) {
    if (jobs.includes(jobId)) return family;
  }
  return null;
}

// Calculate competence score - realistic for students
function calculateCompetenceScore(
  competenceId: string,
  responses: UserResponses,
  referentiel: Referentiel
): number {
  const keywords = COMPETENCY_KEYWORDS[competenceId] || [];
  let totalScore = 0;
  let weightSum = 0;
  
  // Small participation bonus (8%)
  const hasAnyResponse = Object.keys(responses.likert).length > 0 || 
                         Object.values(responses.ouvertes).some(r => r && r.length > 10) ||
                         Object.keys(responses.choixMultiples).length > 0;
  
  const participationBonus = hasAnyResponse ? 0.08 : 0;

  // Likert questions (30% weight) - realistic scoring
  referentiel.questions.likert.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const response = responses.likert[q.id];
      if (response !== undefined) {
        // Realistic Likert: 1=10%, 2=25%, 3=45%, 4=65%, 5=80% (capped for students)
        const likertScoreMap: { [key: number]: number } = {
          1: 0.10, 2: 0.25, 3: 0.45, 4: 0.65, 5: 0.80
        };
        const likertScore = likertScoreMap[response] || (response / 5);
        totalScore += likertScore * 0.30;
        weightSum += 0.30;
      }
    }
  });

  // Open questions (50% weight) - semantic matching
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
    
    // Minimum 10% if any text provided
    const openScore = Math.max(similarity, relevantTexts.length > 0 ? 0.10 : 0);
    totalScore += openScore * 0.50;
    weightSum += 0.50;
  }

  // Multiple choice questions (20% weight)
  referentiel.questions.choixMultiples.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const selected = responses.choixMultiples[q.id] || [];
      if (selected.length > 0) {
        // Realistic: need actual relevant selections
        const relevanceScore = Math.min(selected.length / 4, 1);
        totalScore += relevanceScore * 0.20;
        weightSum += 0.20;
      }
    }
  });

  // Final score with participation bonus (capped at 0.80 for students)
  const baseScore = weightSum > 0 ? totalScore / weightSum : 0;
  return Math.min(baseScore + participationBonus, 0.80);
}

// Calculate bloc scores - no artificial boost
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
      score: avgScore, // No artificial boost
      competenceScores,
    };
  });
}

// Calculate job recommendations - REALISTIC with family filtering
function calculateRecommandations(
  blocsScores: BlocScore[],
  referentiel: Referentiel,
  responses: UserResponses
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

  // Detect user's stated job preference
  const userFamily = detectUserJobFamily(responses);
  const compatibleFamilies = userFamily ? COMPATIBLE_FAMILIES[userFamily] : null;

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
        if (score < 0.30) {
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

      // Bloc-based score
      const blocScore = metier.blocsClés.reduce((sum, blocId) => {
        const bloc = referentiel.blocs.find((b) => b.id === blocId);
        const weight = bloc?.poids || 1;
        return sum + (blocScoreMap[blocId] || 0) * weight;
      }, 0) / metier.blocsClés.length;

      // Base score (no boost)
      let finalScore = (scoreCouverture * 0.6 + blocScore * 0.4);

      // Apply penalties for unrealistic matches
      const jobFamily = getJobFamily(metier.id);
      const jobRequirements = JOB_LEVEL_REQUIREMENTS[metier.id];

      // STRONG penalty if job family doesn't match user's stated preference
      if (userFamily && compatibleFamilies && jobFamily && !compatibleFamilies.includes(jobFamily)) {
        finalScore *= 0.25; // 75% penalty for incompatible family
      }

      // Penalty if job level is too advanced for user
      if (jobRequirements && !jobRequirements.isJuniorFriendly) {
        if (avgSkillScore < jobRequirements.minScore) {
          const levelGap = jobRequirements.minScore - avgSkillScore;
          finalScore *= Math.max(0.15, 1 - (levelGap * 2.5)); // Strong penalty for level gap
        }
      }

      // Realistic compatibility thresholds
      let compatibilite: MetierRecommandation["compatibilite"];
      if (finalScore >= 0.55) compatibilite = "excellente";
      else if (finalScore >= 0.40) compatibilite = "bonne";
      else if (finalScore >= 0.25) compatibilite = "moyenne";
      else compatibilite = "faible";

      return {
        metier,
        score: Math.min(finalScore, 1),
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

  // Realistic thresholds
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

  // Calculate global score (weighted average - no artificial boost)
  const totalWeight = referentiel.blocs.reduce((sum, bloc) => sum + bloc.poids, 0);
  const scoreGlobal = blocsScores.reduce((sum, bs) => {
    const bloc = referentiel.blocs.find((b) => b.id === bs.blocId);
    return sum + bs.score * (bloc?.poids || 1);
  }, 0) / totalWeight;

  // Get job recommendations with user context
  const recommandations = calculateRecommandations(blocsScores, referentiel, responses);

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

  return `
Profil analysé:
- Score global de compétences: ${(result.scoreGlobal * 100).toFixed(0)}%
- Niveau estimé: ${skillLevel}
- Points forts: ${result.competencesFortes.join(", ")}
- Axes d'amélioration: ${competencesAPrioriser.join(", ")}

Métiers recommandés:
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
  
  return `
Profil professionnel:
- Niveau global: ${skillLevel} (${(result.scoreGlobal * 100).toFixed(0)}%)
- Compétences clés: ${result.competencesFortes.join(", ")}
- Orientations métiers: ${result.recommandations.slice(0, 2).map(r => r.metier.titre).join(", ")}
- Blocs de compétences principaux: ${result.blocsScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(b => `${b.blocNom} (${(b.score * 100).toFixed(0)}%)`)
    .join(", ")}
`.trim();
}
