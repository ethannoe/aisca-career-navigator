import { Header } from "@/components/aisca/Header";
import { Questionnaire } from "@/components/aisca/Questionnaire";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Questionnaire />
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-secondary/30 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            AISCA - Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences
          </p>
          <p className="mt-1">
            Projet IA Générative • EFREI Data Engineering & AI 2025-26
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
