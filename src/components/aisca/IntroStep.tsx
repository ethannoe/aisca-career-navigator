import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Brain, Target, Sparkles, TrendingUp } from "lucide-react";

interface IntroStepProps {
  onNext: () => void;
}

export function IntroStep({ onNext }: IntroStepProps) {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Agent Intelligent de Cartographie des Compétences</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
          Découvrez votre{" "}
          <span className="gradient-text">profil Data & IA</span>
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          AISCA analyse vos compétences grâce à l'IA sémantique et vous recommande 
          les métiers qui correspondent le mieux à votre profil.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6 glass-card border-0 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Analyse Sémantique
          </h3>
          <p className="text-muted-foreground text-sm">
            Vos réponses sont analysées par SBERT pour une compréhension 
            contextuelle de vos compétences.
          </p>
        </Card>

        <Card className="p-6 glass-card border-0 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Target className="w-6 h-6 text-chart-2" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Recommandation Métiers
          </h3>
          <p className="text-muted-foreground text-sm">
            Découvrez les 3 métiers Data/IA qui correspondent le mieux 
            à votre profil actuel.
          </p>
        </Card>

        <Card className="p-6 glass-card border-0 hover:shadow-lg transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-chart-3/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6 text-chart-3" />
          </div>
          <h3 className="font-display font-semibold text-lg mb-2">
            Plan de Progression
          </h3>
          <p className="text-muted-foreground text-sm">
            Recevez un plan personnalisé généré par IA pour développer 
            vos compétences prioritaires.
          </p>
        </Card>
      </div>

      <div className="bg-secondary/50 rounded-2xl p-6 mb-8">
        <h4 className="font-semibold mb-3">Le questionnaire comprend :</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Questions d'auto-évaluation (échelle de Likert)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Questions ouvertes sur vos expériences
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Sélection de vos compétences techniques
          </li>
        </ul>
        <p className="text-xs text-muted-foreground mt-4">
          Durée estimée : 10-15 minutes
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onNext}
          className="group text-lg px-8"
        >
          Commencer l'évaluation
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
