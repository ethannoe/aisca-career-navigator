import { useState, useCallback, useEffect } from "react";
import { StepIndicator } from "./StepIndicator";
import { IntroStep } from "./IntroStep";
import { LikertStep } from "./LikertStep";
import { OpenQuestionsStep } from "./OpenQuestionsStep";
import { MultipleChoiceStep } from "./MultipleChoiceStep";
import { AnalysisStep } from "./AnalysisStep";
import { ResultsStep } from "./ResultsStep";
import { analyzeResponses, createProgressionContext, createBioContext } from "@/lib/scoring";
import referentielData from "@/data/referentiel.json";
import type {
  QuestionnaireStep,
  QuestionnaireState,
  UserResponses,
  Referentiel,
  AnalysisResult,
} from "@/types/aisca";
import { useToast } from "@/hooks/use-toast";

const referentiel = referentielData as Referentiel;

const initialResponses: UserResponses = {
  likert: {},
  ouvertes: {},
  choixMultiples: {},
  timestamp: new Date().toISOString(),
};

export function Questionnaire() {
  const { toast } = useToast();
  const [state, setState] = useState<QuestionnaireState>({
    currentStep: "intro",
    responses: initialResponses,
    isAnalyzing: false,
    isGeneratingPlan: false,
    isGeneratingBio: false,
  });

  const setStep = (step: QuestionnaireStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const updateLikertResponse = useCallback((questionId: string, value: number) => {
    setState((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        likert: {
          ...prev.responses.likert,
          [questionId]: value,
        },
      },
    }));
  }, []);

  const updateOpenResponse = useCallback((questionId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        ouvertes: {
          ...prev.responses.ouvertes,
          [questionId]: value,
        },
      },
    }));
  }, []);

  const updateMultipleChoiceResponse = useCallback(
    (questionId: string, values: string[]) => {
      setState((prev) => ({
        ...prev,
        responses: {
          ...prev.responses,
          choixMultiples: {
            ...prev.responses.choixMultiples,
            [questionId]: values,
          },
        },
      }));
    },
    []
  );

  const runAnalysis = useCallback(() => {
    setState((prev) => ({ ...prev, isAnalyzing: true }));
    
    // Simulate async analysis
    setTimeout(() => {
      const result = analyzeResponses(state.responses, referentiel);
      setState((prev) => ({
        ...prev,
        analysisResult: result,
        isAnalyzing: false,
      }));
    }, 500);
  }, [state.responses]);

  const handleAnalysisComplete = useCallback(() => {
    runAnalysis();
    setStep("results");
  }, [runAnalysis]);

  const handleGeneratePlan = useCallback(async () => {
    if (!state.analysisResult) return;

    setState((prev) => ({ ...prev, isGeneratingPlan: true }));

    // Simulate AI generation (in production, this would call the GenAI API)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const context = createProgressionContext(state.analysisResult);
    
    // Simulated AI-generated plan
    const plan = `## Plan de Progression Personnalisé

### Phase 1 : Renforcement des Fondamentaux (Mois 1-2)
${state.analysisResult.competencesFaibles.slice(0, 2).map((c, i) => 
  `${i + 1}. **${c}** : Suivre une formation en ligne (Coursera, DataCamp) et pratiquer sur des datasets réels.`
).join('\n')}

### Phase 2 : Spécialisation (Mois 3-4)
- Approfondir les compétences clés pour le métier de **${state.analysisResult.recommandations[0]?.metier.titre || 'Data Professional'}**
- Réaliser un projet personnel démontrant ces compétences
- Contribuer à des projets open source

### Phase 3 : Consolidation (Mois 5-6)
- Préparer des certifications reconnues (AWS, GCP, etc.)
- Construire un portfolio de projets
- Développer votre réseau professionnel

### Ressources Recommandées
- Kaggle pour la pratique
- Fast.ai pour le deep learning
- Documentation officielle des frameworks`;

    setState((prev) => ({
      ...prev,
      isGeneratingPlan: false,
      analysisResult: prev.analysisResult
        ? { ...prev.analysisResult, planProgression: plan }
        : undefined,
    }));

    toast({
      title: "Plan généré",
      description: "Votre plan de progression personnalisé est prêt !",
    });
  }, [state.analysisResult, toast]);

  const handleGenerateBio = useCallback(async () => {
    if (!state.analysisResult) return;

    setState((prev) => ({ ...prev, isGeneratingBio: true }));

    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const topJob = state.analysisResult.recommandations[0]?.metier.titre || "Data Professional";
    const strengths = state.analysisResult.competencesFortes.slice(0, 3).join(", ");
    
    const bio = `Professionnel passionné par la Data et l'IA, avec une expertise particulière en ${strengths}. Fort d'une vision analytique développée et d'une approche pragmatique des problèmes, je m'oriente vers un profil de ${topJob}. Ma capacité à transformer les données en insights actionnables, combinée à ma maîtrise des outils modernes de Data Science, me permet d'apporter une valeur ajoutée significative aux projets data-driven.`;

    setState((prev) => ({
      ...prev,
      isGeneratingBio: false,
      analysisResult: prev.analysisResult
        ? { ...prev.analysisResult, bioProfessionnelle: bio }
        : undefined,
    }));

    toast({
      title: "Bio générée",
      description: "Votre bio professionnelle est prête !",
    });
  }, [state.analysisResult, toast]);

  const handleRestart = useCallback(() => {
    setState({
      currentStep: "intro",
      responses: initialResponses,
      isAnalyzing: false,
      isGeneratingPlan: false,
      isGeneratingBio: false,
    });
  }, []);

  // Step navigation
  const stepFlow: QuestionnaireStep[] = [
    "intro",
    "likert",
    "ouvertes",
    "choix",
    "analysis",
    "results",
  ];

  const goToNextStep = () => {
    const currentIndex = stepFlow.indexOf(state.currentStep);
    if (currentIndex < stepFlow.length - 1) {
      setStep(stepFlow[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = stepFlow.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setStep(stepFlow[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator */}
        {state.currentStep !== "intro" && (
          <StepIndicator currentStep={state.currentStep} />
        )}

        {/* Step content */}
        <div className="mt-8">
          {state.currentStep === "intro" && (
            <IntroStep onNext={goToNextStep} />
          )}

          {state.currentStep === "likert" && (
            <LikertStep
              questions={referentiel.questions.likert}
              responses={state.responses.likert}
              onResponseChange={updateLikertResponse}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
            />
          )}

          {state.currentStep === "ouvertes" && (
            <OpenQuestionsStep
              questions={referentiel.questions.ouvertes}
              responses={state.responses.ouvertes}
              onResponseChange={updateOpenResponse}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
            />
          )}

          {state.currentStep === "choix" && (
            <MultipleChoiceStep
              questions={referentiel.questions.choixMultiples}
              responses={state.responses.choixMultiples}
              onResponseChange={updateMultipleChoiceResponse}
              onNext={goToNextStep}
              onPrevious={goToPreviousStep}
            />
          )}

          {state.currentStep === "analysis" && (
            <AnalysisStep onComplete={handleAnalysisComplete} />
          )}

          {state.currentStep === "results" && state.analysisResult && (
            <ResultsStep
              result={state.analysisResult}
              onRestart={handleRestart}
              onGeneratePlan={handleGeneratePlan}
              onGenerateBio={handleGenerateBio}
              isGeneratingPlan={state.isGeneratingPlan}
              isGeneratingBio={state.isGeneratingBio}
            />
          )}
        </div>
      </div>
    </div>
  );
}
