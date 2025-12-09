import { Brain } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight">
              AISCA
            </h1>
            <p className="text-xs text-muted-foreground">
              Agent Intelligent de Cartographie
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:block">
            EFREI • Data Engineering & AI 2025
          </span>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
      </div>
    </header>
  );
}
