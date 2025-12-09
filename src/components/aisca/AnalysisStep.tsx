import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Brain, Database, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisStepProps {
  onComplete: () => void;
}

const ANALYSIS_STEPS = [
  {
    id: "embedding",
    icon: Brain,
    title: "Génération des embeddings",
    description: "Transformation de vos réponses en vecteurs sémantiques...",
  },
  {
    id: "matching",
    icon: Database,
    title: "Analyse sémantique",
    description: "Comparaison avec le référentiel de compétences...",
  },
  {
    id: "scoring",
    icon: Target,
    title: "Calcul des scores",
    description: "Évaluation de la couverture par bloc de compétences...",
  },
  {
    id: "recommendation",
    icon: Sparkles,
    title: "Génération des recommandations",
    description: "Identification des métiers correspondants...",
  },
];

export function AnalysisStep({ onComplete }: AnalysisStepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < ANALYSIS_STEPS.length - 1) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 1200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setCompletedSteps((completed) => [...completed, ANALYSIS_STEPS.length - 1]);
      setTimeout(onComplete, 800);
    }, ANALYSIS_STEPS.length * 1200);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-slow">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Analyse en cours...
        </h2>
        <p className="text-muted-foreground">
          AISCA analyse vos compétences avec l'IA sémantique
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4">
        {ANALYSIS_STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index && !isCompleted;
          const isPending = currentStep < index;

          return (
            <Card
              key={step.id}
              className={cn(
                "p-4 transition-all duration-300",
                isCompleted && "bg-success/5 border-success/30",
                isCurrent && "bg-primary/5 border-primary/30 shadow-md",
                isPending && "opacity-50"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCompleted && "bg-success text-success-foreground",
                    isCurrent && "bg-primary text-primary-foreground",
                    isPending && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                {isCurrent && (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="max-w-xl mx-auto mt-8">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${((completedSteps.length) / ANALYSIS_STEPS.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
