import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionLikert, ReponsesLikert } from "@/types/aisca";

interface LikertStepProps {
  questions: QuestionLikert[];
  responses: ReponsesLikert;
  onResponseChange: (questionId: string, value: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const LIKERT_LABELS = [
  { value: 1, label: "Débutant", description: "Notions de base" },
  { value: 2, label: "Élémentaire", description: "Utilisation guidée" },
  { value: 3, label: "Intermédiaire", description: "Autonomie partielle" },
  { value: 4, label: "Avancé", description: "Maîtrise confirmée" },
  { value: 5, label: "Expert", description: "Référent dans le domaine" },
];

export function LikertStep({
  questions,
  responses,
  onResponseChange,
  onNext,
  onPrevious,
}: LikertStepProps) {
  const answeredCount = Object.keys(responses).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Auto-évaluation des compétences
        </h2>
        <p className="text-muted-foreground">
          Évaluez votre niveau de maîtrise pour chaque domaine
        </p>
        
        {/* Progress bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>{answeredCount} / {questions.length} questions</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Likert scale legend */}
      <div className="mb-8 p-4 bg-secondary/50 rounded-xl">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          {LIKERT_LABELS.map((item) => (
            <div key={item.value} className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold">
                {item.value}
              </span>
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <Card
            key={question.id}
            className={cn(
              "p-6 transition-all duration-200",
              responses[question.id] !== undefined
                ? "border-primary/30 bg-primary/5"
                : "border-border"
            )}
          >
            <div className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1">
                <Label className="text-base font-medium leading-relaxed">
                  {question.texte}
                </Label>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {LIKERT_LABELS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onResponseChange(question.id, option.value)}
                      className={cn(
                        "flex-1 min-w-[80px] px-3 py-3 rounded-lg border-2 transition-all duration-200",
                        "hover:border-primary/50 hover:bg-primary/5",
                        "focus:outline-none focus:ring-2 focus:ring-primary/30",
                        responses[question.id] === option.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card"
                      )}
                    >
                      <div className="text-lg font-semibold">{option.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                        {option.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Précédent
        </Button>
        <Button
          onClick={onNext}
          disabled={answeredCount < questions.length}
        >
          Suivant
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
