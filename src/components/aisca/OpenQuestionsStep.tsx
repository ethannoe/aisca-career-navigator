import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestionOuverte, ReponsesOuvertes } from "@/types/aisca";

interface OpenQuestionsStepProps {
  questions: QuestionOuverte[];
  responses: ReponsesOuvertes;
  onResponseChange: (questionId: string, value: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function OpenQuestionsStep({
  questions,
  responses,
  onResponseChange,
  onNext,
  onPrevious,
}: OpenQuestionsStepProps) {
  const getWordCount = (questionId: string) => {
    return countWords(responses[questionId] || "");
  };

  const isQuestionValid = (question: QuestionOuverte) => {
    return getWordCount(question.id) >= question.minWords;
  };

  const validCount = questions.filter(q => isQuestionValid(q)).length;
  const progress = (validCount / questions.length) * 100;

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Décrivez vos expériences
        </h2>
        <p className="text-muted-foreground">
          Répondez en détail pour une analyse sémantique plus précise
        </p>
        
        {/* Progress bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>{validCount} / {questions.length} réponses complètes</span>
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
          const wordCount = getWordCount(question.id);
          const isValid = wordCount >= question.minWords;
          const isEmpty = wordCount === 0;

          return (
            <Card
              key={question.id}
              className={cn(
                "p-6 transition-all duration-200",
                isValid
                  ? "border-success/30 bg-success/5"
                  : !isEmpty
                  ? "border-warning/30 bg-warning/5"
                  : "border-border"
              )}
            >
              <div className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <Label className="text-base font-medium leading-relaxed block">
                    {question.texte}
                  </Label>
                  
                  <Textarea
                    value={responses[question.id] || ""}
                    onChange={(e) => onResponseChange(question.id, e.target.value)}
                    placeholder="Décrivez votre expérience en détail..."
                    className="min-h-[120px] resize-none"
                  />

                  <div className="flex items-center justify-between text-sm">
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isValid ? "text-success" : !isEmpty ? "text-warning" : "text-muted-foreground"
                      )}
                    >
                      {isValid ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : !isEmpty ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : null}
                      <span>
                        {wordCount} mot{wordCount > 1 ? "s" : ""}
                        {!isValid && ` (minimum ${question.minWords})`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Plus vous êtes précis, meilleure sera l'analyse
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="bg-secondary/50 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Conseil pour de meilleures analyses</p>
            <p className="text-muted-foreground mt-1">
              Mentionnez les outils, technologies et méthodologies que vous avez utilisés. 
              Décrivez vos responsabilités et les résultats obtenus.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Précédent
        </Button>
        <Button
          onClick={onNext}
          disabled={validCount < questions.length}
        >
          Suivant
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
