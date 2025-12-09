// RAG (Retrieval-Augmented Generation) utilities for AISCA
// This module handles context construction for GenAI prompts

import type { AnalysisResult, Referentiel, UserResponses } from "@/types/aisca";

// Check if text is too short and needs augmentation
export function needsAugmentation(text: string, minWords: number = 5): boolean {
  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return wordCount < minWords;
}

// Retrieve relevant context from the referential
export function retrieveRelevantContext(
  result: AnalysisResult,
  referentiel: Referentiel
): {
  competencesRelevantes: string[];
  blocsScores: { bloc: string; score: number }[];
  ecartsMetiers: { metier: string; ecart: number; manquantes: string[] }[];
} {
  // Get relevant competences (above threshold)
  const competencesRelevantes = result.competencesFortes;

  // Get bloc scores
  const blocsScores = result.blocsScores.map((bs) => ({
    bloc: bs.blocNom,
    score: bs.score,
  }));

  // Calculate gaps for target jobs
  const ecartsMetiers = result.recommandations.slice(0, 3).map((rec) => ({
    metier: rec.metier.titre,
    ecart: 1 - rec.score,
    manquantes: rec.competencesManquantes,
  }));

  return {
    competencesRelevantes,
    blocsScores,
    ecartsMetiers,
  };
}

// Build prompt for progression plan generation
export function buildProgressionPlanPrompt(
  result: AnalysisResult,
  referentiel: Referentiel
): string {
  const context = retrieveRelevantContext(result, referentiel);

  return `Tu es un conseiller en carrière spécialisé dans les métiers de la Data et de l'IA.

CONTEXTE DU PROFIL:
- Score global: ${Math.round(result.scoreGlobal * 100)}%
- Points forts: ${result.competencesFortes.join(", ") || "À développer"}
- Points faibles: ${result.competencesFaibles.join(", ") || "Aucun majeur"}

SCORES PAR DOMAINE:
${context.blocsScores.map((bs) => `- ${bs.bloc}: ${Math.round(bs.score * 100)}%`).join("\n")}

MÉTIERS CIBLES ET ÉCARTS:
${context.ecartsMetiers.map((e) => 
  `- ${e.metier}: écart de ${Math.round(e.ecart * 100)}%
   Compétences manquantes: ${e.manquantes.join(", ") || "Aucune majeure"}`
).join("\n")}

MISSION:
Génère un plan de progression personnalisé et actionnable pour ce profil.
Le plan doit:
1. Être structuré en 3 phases (court, moyen, long terme)
2. Identifier les compétences prioritaires à développer
3. Proposer des ressources concrètes (cours en ligne, certifications, projets)
4. Être aligné avec les métiers cibles identifiés

FORMAT: Utilise des titres en markdown, des listes à puces, et sois concis mais précis.
LONGUEUR: Maximum 500 mots.`;
}

// Build prompt for professional bio generation
export function buildBioPrompt(
  result: AnalysisResult,
  responses: UserResponses,
  referentiel: Referentiel
): string {
  const topJob = result.recommandations[0]?.metier.titre || "Data Professional";
  const level = result.scoreGlobal >= 0.7 ? "Senior" : result.scoreGlobal >= 0.5 ? "Confirmé" : "Junior";

  // Extract key info from open responses
  const experienceHighlights = Object.values(responses.ouvertes)
    .filter((r) => r && r.length > 20)
    .slice(0, 2)
    .join(" ");

  return `Tu es un rédacteur professionnel spécialisé dans les profils LinkedIn et CV tech.

PROFIL À VALORISER:
- Orientation métier: ${topJob}
- Niveau estimé: ${level}
- Domaines maîtrisés: ${result.competencesFortes.join(", ") || "En développement"}
- Score global: ${Math.round(result.scoreGlobal * 100)}%

ÉLÉMENTS D'EXPÉRIENCE:
${experienceHighlights.slice(0, 500)}

MISSION:
Génère une bio professionnelle accrocheuse de style "Executive Summary" pour ce profil.

CRITÈRES:
- Maximum 3 phrases
- Ton professionnel mais dynamique
- Mettre en avant les forces identifiées
- Mentionner l'orientation vers le métier cible
- Adapté pour un profil LinkedIn ou un CV

FORMAT: Texte continu, pas de listes ni de titres.`;
}

// Augment short text with context
export function augmentShortText(
  text: string,
  questionContext: string
): string {
  // In a real implementation, this would call a GenAI API
  // For now, we return the original text as is
  // The semantic analysis will handle short texts gracefully
  return text;
}

// Export context as JSON for debugging
export function exportContext(
  result: AnalysisResult,
  responses: UserResponses,
  referentiel: Referentiel
): string {
  const context = {
    timestamp: new Date().toISOString(),
    scoreGlobal: result.scoreGlobal,
    blocsScores: result.blocsScores,
    recommandations: result.recommandations.slice(0, 3).map((r) => ({
      metier: r.metier.titre,
      score: r.score,
      compatibilite: r.compatibilite,
    })),
    competencesFortes: result.competencesFortes,
    competencesFaibles: result.competencesFaibles,
    responsesCount: {
      likert: Object.keys(responses.likert).length,
      ouvertes: Object.keys(responses.ouvertes).length,
      choixMultiples: Object.keys(responses.choixMultiples).length,
    },
  };

  return JSON.stringify(context, null, 2);
}
