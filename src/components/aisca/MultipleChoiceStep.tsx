import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionChoixMultiple, ReponsesChoixMultiples } from "@/types/aisca";

interface MultipleChoiceStepProps {
  questions: QuestionChoixMultiple[];
  responses: ReponsesChoixMultiples;
  onResponseChange: (questionId: string, values: string[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MultipleChoiceStep({
  questions,
  responses,
  onResponseChange,
  onNext,
  onPrevious,
}: MultipleChoiceStepProps) {
  const answeredCount = questions.filter(
    (q) => (responses[q.id]?.length || 0) > 0
  ).length;
  const progress = (answeredCount / questions.length) * 100;

  const handleToggle = (questionId: string, option: string) => {
    const current = responses[questionId] || [];
    const newValues = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onResponseChange(questionId, newValues);
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Vos compétences techniques
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez les technologies et outils que vous maîtrisez
        </p>

        {/* Progress bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>
              {answeredCount} / {questions.length} questions
            </span>
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

      <div className="space-y-6">
        {questions.map((question, index) => {
          const selected = responses[question.id] || [];
          const hasSelection = selected.length > 0;

          return (
            <Card
              key={question.id}
              className={cn(
                "p-6 transition-all duration-200",
                hasSelection
                  ? "border-primary/30 bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <Label className="text-base font-medium leading-relaxed block mb-4">
                    {question.texte}
                  </Label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {question.options.map((option) => {
                      const isSelected = selected.includes(option);

                      return (
                        <button
                          key={option}
                          onClick={() => handleToggle(question.id, option)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all duration-200",
                            "hover:border-primary/50 hover:bg-primary/5",
                            "focus:outline-none focus:ring-2 focus:ring-primary/30",
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card"
                          )}
                        >
                          <div
                            className={cn(
                              "w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-primary-foreground" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm",
                              isSelected
                                ? "text-primary font-medium"
                                : "text-foreground"
                            )}
                          >
                            {option}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {hasSelection && (
                    <p className="mt-3 text-sm text-primary">
                      {selected.length} élément
                      {selected.length > 1 ? "s" : ""} sélectionné
                      {selected.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Précédent
        </Button>
        <Button onClick={onNext} disabled={answeredCount < questions.length}>
          Analyser mon profil
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
