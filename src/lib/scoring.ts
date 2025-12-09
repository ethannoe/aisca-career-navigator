// Scoring engine for AISCA
// This module implements semantic similarity scoring based on the SBERT approach

import type {
  Referentiel,
  UserResponses,
  BlocScore,
  MetierRecommandation,
  AnalysisResult,
  Competence,
} from "@/types/aisca";

// Simulated semantic embeddings (in production, this would use actual SBERT)
// These represent pre-computed embeddings for competency keywords
const COMPETENCY_KEYWORDS: { [key: string]: string[] } = {
  C01: ["nettoyage", "cleaning", "données manquantes", "outliers", "preprocessing", "data quality", "pandas", "dataframe"],
  C02: ["visualisation", "graphique", "dashboard", "tableau", "matplotlib", "seaborn", "plotly", "chart", "report"],
  C03: ["statistiques", "moyenne", "médiane", "écart-type", "distribution", "test", "corrélation", "analyse"],
  C04: ["python", "programmation", "code", "script", "fonction", "classe", "pandas", "numpy", "jupyter"],
  C05: ["sql", "base de données", "requête", "join", "select", "database", "postgresql", "mysql", "table"],
  C06: ["classification", "classifier", "prédiction classe", "catégorie", "random forest", "svm", "logistic"],
  C07: ["régression", "prédiction", "valeur continue", "linear", "gradient", "loss"],
  C08: ["réseaux neurones", "deep learning", "neural", "cnn", "rnn", "transformer", "layers", "tensorflow", "pytorch"],
  C09: ["évaluation", "métriques", "accuracy", "precision", "recall", "f1", "roc", "auc", "cross-validation"],
  C10: ["feature", "variable", "engineering", "sélection", "extraction", "transformation"],
  C11: ["tokenization", "token", "segmentation", "mot", "sous-mot", "nlp"],
  C12: ["embedding", "word2vec", "glove", "fasttext", "représentation vectorielle", "vecteur"],
  C13: ["transformer", "bert", "gpt", "attention", "huggingface", "llm", "language model"],
  C14: ["sémantique", "sens", "compréhension", "relation", "contexte", "meaning"],
  C15: ["sentiment", "opinion", "émotion", "positif", "négatif", "analyse opinion"],
  C16: ["etl", "pipeline", "extraction", "transformation", "chargement", "workflow"],
  C17: ["big data", "spark", "hadoop", "distributed", "cluster", "scale", "parallèle"],
  C18: ["cloud", "aws", "gcp", "azure", "s3", "ec2", "lambda", "serverless"],
  C19: ["orchestration", "airflow", "prefect", "dag", "schedule", "workflow"],
  C20: ["qualité données", "monitoring", "validation", "test data", "data quality"],
  C21: ["prompt", "instruction", "few-shot", "chain of thought", "prompt engineering"],
  C22: ["rag", "retrieval", "augmented", "generation", "contexte", "documents"],
  C23: ["fine-tuning", "adaptation", "transfer learning", "lora", "qlora"],
  C24: ["api", "openai", "gemini", "claude", "integration", "llm api"],
  C25: ["agent", "autonomous", "multi-agent", "tool use", "planning", "reasoning"],
};

// Calculate text similarity score (simplified semantic matching)
function calculateTextSimilarity(text: string, keywords: string[]): number {
  const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let matchCount = 0;
  let totalWeight = 0;
  
  keywords.forEach((keyword, index) => {
    const normalizedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const weight = 1 / (index * 0.3 + 1); // Earlier keywords have higher weight
    totalWeight += weight;
    
    if (normalizedText.includes(normalizedKeyword)) {
      matchCount += weight;
    }
  });
  
  // Return similarity score between 0 and 1
  return totalWeight > 0 ? Math.min(matchCount / (totalWeight * 0.6), 1) : 0;
}

// Calculate competence score from all user inputs
function calculateCompetenceScore(
  competenceId: string,
  responses: UserResponses,
  referentiel: Referentiel
): number {
  const keywords = COMPETENCY_KEYWORDS[competenceId] || [];
  let totalScore = 0;
  let weightSum = 0;

  // Score from Likert questions
  referentiel.questions.likert.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const response = responses.likert[q.id];
      if (response !== undefined) {
        totalScore += (response / 5) * 0.3; // Likert contributes 30%
        weightSum += 0.3;
      }
    }
  });

  // Score from open questions (semantic matching)
  referentiel.questions.ouvertes.forEach((q) => {
    const response = responses.ouvertes[q.id];
    if (response && response.length > 0) {
      const similarity = calculateTextSimilarity(response, keywords);
      totalScore += similarity * 0.5; // Open questions contribute 50%
      weightSum += 0.5;
    }
  });

  // Score from multiple choice questions
  referentiel.questions.choixMultiples.forEach((q) => {
    if (q.competencesLiees.includes(competenceId)) {
      const selected = responses.choixMultiples[q.id] || [];
      if (selected.length > 0) {
        // More selections related to this competence = higher score
        const relevanceScore = Math.min(selected.length / 3, 1);
        totalScore += relevanceScore * 0.2; // Multiple choice contributes 20%
        weightSum += 0.2;
      }
    }
  });

  return weightSum > 0 ? totalScore / weightSum : 0;
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

// Calculate job recommendations
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
      // Calculate coverage score for this job
      const requiredCompetences = metier.competencesRequises;
      let totalScore = 0;
      const competencesManquantes: string[] = [];

      requiredCompetences.forEach((compId) => {
        const score = competenceScoreMap[compId] || 0;
        totalScore += score;
        if (score < 0.4) {
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

      // Calculate bloc-based score
      const blocScore = metier.blocsClés.reduce((sum, blocId) => {
        const bloc = referentiel.blocs.find((b) => b.id === blocId);
        const weight = bloc?.poids || 1;
        return sum + (blocScoreMap[blocId] || 0) * weight;
      }, 0) / metier.blocsClés.length;

      const finalScore = (scoreCouverture * 0.6 + blocScore * 0.4);

      let compatibilite: MetierRecommandation["compatibilite"];
      if (finalScore >= 0.7) compatibilite = "excellente";
      else if (finalScore >= 0.5) compatibilite = "bonne";
      else if (finalScore >= 0.35) compatibilite = "moyenne";
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
    .filter((c) => c.score >= 0.5)
    .slice(0, 5)
    .map((c) => c.name);

  const faibles = allCompetenceScores
    .filter((c) => c.score < 0.4)
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

  // Calculate global score (weighted average)
  const totalWeight = referentiel.blocs.reduce((sum, bloc) => sum + bloc.poids, 0);
  const scoreGlobal = blocsScores.reduce((sum, bs) => {
    const bloc = referentiel.blocs.find((b) => b.id === bs.blocId);
    return sum + bs.score * (bloc?.poids || 1);
  }, 0) / totalWeight;

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
    .filter((bs) => bs.score >= 0.5)
    .map((bs) => bs.blocNom)
    .join(", ") || "En développement"}
Orientation recommandée: ${result.recommandations[0]?.metier.titre || "Data Professional"}
Niveau estimé: ${result.scoreGlobal >= 0.7 ? "Senior" : result.scoreGlobal >= 0.5 ? "Mid-level" : "Junior"}
`.trim();
}
