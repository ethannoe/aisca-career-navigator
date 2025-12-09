import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { QuestionnaireStep } from "@/types/aisca";

interface Step {
  id: QuestionnaireStep;
  label: string;
  shortLabel: string;
}

const STEPS: Step[] = [
  { id: "intro", label: "Introduction", shortLabel: "Intro" },
  { id: "likert", label: "Auto-évaluation", shortLabel: "Niveau" },
  { id: "ouvertes", label: "Expériences", shortLabel: "Exp." },
  { id: "choix", label: "Compétences", shortLabel: "Skills" },
  { id: "analysis", label: "Analyse", shortLabel: "Analyse" },
  { id: "results", label: "Résultats", shortLabel: "Résultats" },
];

interface StepIndicatorProps {
  currentStep: QuestionnaireStep;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-secondary mx-8">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{
              width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center z-10"
            >
              <div
                className={cn(
                  "step-indicator",
                  isCompleted && "step-indicator-completed",
                  isCurrent && "step-indicator-active",
                  isPending && "step-indicator-pending"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors hidden sm:block",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              <span
                className={cn(
                  "mt-2 text-xs font-medium transition-colors sm:hidden",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.shortLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
