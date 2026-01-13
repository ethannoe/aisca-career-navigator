// Types for AISCA Application

export interface Competence {
  id: string;
  nom: string;
  description: string;
}

export interface Bloc {
  id: string;
  nom: string;
  description: string;
  poids: number;
  competences: Competence[];
}

export interface Metier {
  id: string;
  titre: string;
  description: string;
  niveau: string;
  competencesRequises: string[];
  blocsClés: string[];
  seuilMinimum: number;
}

export interface QuestionLikert {
  id: string;
  texte: string;
  competencesLiees: string[];
  bloc: string;
}

export interface QuestionOuverte {
  id: string;
  texte: string;
  blocsLies: string[];
  minWords: number;
}

export interface QuestionChoixMultiple {
  id: string;
  texte: string;
  options: string[];
  competencesLiees: string[];
  bloc: string;
  multiple?: boolean;
}

export interface Referentiel {
  version: string;
  lastUpdated: string;
  description: string;
  blocs: Bloc[];
  metiers: Metier[];
  questions: {
    likert: QuestionLikert[];
    ouvertes: QuestionOuverte[];
    choixMultiples: QuestionChoixMultiple[];
  };
}

// User responses
export interface ReponsesLikert {
  [questionId: string]: number; // 1-5
}

export interface ReponsesOuvertes {
  [questionId: string]: string;
}

export interface ReponsesChoixMultiples {
  [questionId: string]: string[];
}

export interface UserResponses {
  likert: ReponsesLikert;
  ouvertes: ReponsesOuvertes;
  choixMultiples: ReponsesChoixMultiples;
  timestamp: string;
}

// Scoring results
export interface BlocScore {
  blocId: string;
  blocNom: string;
  score: number;
  competenceScores: { [competenceId: string]: number };
}

export interface MetierRecommandation {
  metier: Metier;
  score: number;
  scoreCouverture: number;
  competencesManquantes: string[];
  compatibilite: "excellente" | "bonne" | "moyenne" | "faible";
}

export interface AnalysisResult {
  scoreGlobal: number;
  blocsScores: BlocScore[];
  recommandations: MetierRecommandation[];
  competencesFortes: string[];
  competencesFaibles: string[];
  planProgression?: string;
  bioProfessionnelle?: string;
}

// Questionnaire state
export type QuestionnaireStep = "intro" | "likert" | "ouvertes" | "choix" | "analysis" | "results";

export interface QuestionnaireState {
  currentStep: QuestionnaireStep;
  responses: UserResponses;
  analysisResult?: AnalysisResult;
  isAnalyzing: boolean;
  isGeneratingPlan: boolean;
  isGeneratingBio: boolean;
}
