import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Trophy,
  Target,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Download,
  RefreshCw,
  ChevronRight,
  Award,
  Zap,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult, MetierRecommandation } from "@/types/aisca";

interface ResultsStepProps {
  result: AnalysisResult;
  onRestart: () => void;
  onGeneratePlan: () => void;
  onGenerateBio: () => void;
  isGeneratingPlan: boolean;
  isGeneratingBio: boolean;
}

// Distinct colors for each domain - more vivid and distinguishable
const CHART_COLORS = {
  "B1": "#22c55e", // Green - Analyse de Données
  "B2": "#3b82f6", // Blue - Machine Learning
  "B3": "#a855f7", // Purple - NLP
  "B4": "#f97316", // Orange - Data Engineering
  "B5": "#ec4899", // Pink - IA Générative
};

const CHART_COLORS_ARRAY = [
  "#22c55e", "#3b82f6", "#a855f7", "#f97316", "#ec4899"
];

const COMPATIBILITY_COLORS = {
  excellente: "bg-green-500/10 text-green-600 border-green-500/30",
  bonne: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  moyenne: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  faible: "bg-red-500/10 text-red-600 border-red-500/30",
};

// Profile mapping for display
const BLOC_PROFILES: { [key: string]: string } = {
  "B1": "Data Analyst / BI",
  "B2": "Data Scientist / ML",
  "B3": "NLP / Linguistique",
  "B4": "Data Engineer",
  "B5": "IA Générative",
};

export function ResultsStep({
  result,
  onRestart,
  onGeneratePlan,
  onGenerateBio,
  isGeneratingPlan,
  isGeneratingBio,
}: ResultsStepProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Sort blocs by score to find dominant profile
  const sortedBlocs = [...result.blocsScores].sort((a, b) => b.score - a.score);
  const dominantBloc = sortedBlocs[0];
  const dominantProfile = BLOC_PROFILES[dominantBloc?.blocId] || "Non défini";

  // Prepare radar chart data
  const radarData = result.blocsScores.map((bs) => ({
    bloc: bs.blocNom.split(" ")[0],
    fullName: bs.blocNom,
    score: Math.round(bs.score * 100),
    fullMark: 100,
  }));

  // Prepare bar chart data - sorted by score for clarity
  const barData = [...result.blocsScores]
    .sort((a, b) => b.score - a.score)
    .map((bs) => ({
      name: bs.blocNom.length > 15 ? bs.blocNom.substring(0, 15) + "..." : bs.blocNom,
      fullName: bs.blocNom,
      score: Math.round(bs.score * 100),
      color: CHART_COLORS[bs.blocId as keyof typeof CHART_COLORS] || "#64748b",
      blocId: bs.blocId,
    }));

  const top3Jobs = result.recommandations.slice(0, 3);

  return (
    <div className="animate-fade-in">
      {/* Header with dominant profile */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 text-sm font-medium mb-4">
          <Trophy className="w-4 h-4" />
          <span>Analyse terminée</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">
          Votre profil Data & IA
        </h2>

        {/* Dominant profile indicator */}
        <div className="mt-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Profil dominant détecté</p>
          <p className="text-2xl font-bold text-primary">{dominantProfile}</p>
          <p className="text-lg font-semibold mt-1">
            Score: {Math.round(dominantBloc?.score * 100)}%
          </p>
        </div>

        {/* Global score circle */}
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-primary/10 border-4 border-primary/20">
          <div className="text-center">
            <span className="text-3xl font-bold text-primary">
              {Math.round(result.scoreGlobal * 100)}
            </span>
            <span className="text-lg text-primary">%</span>
            <p className="text-xs text-muted-foreground mt-1">Score global</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="jobs">Métiers</TabsTrigger>
          <TabsTrigger value="skills">Compétences</TabsTrigger>
          <TabsTrigger value="plan">Plan & Bio</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Profile scores - NEW primary visualization */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Scores par profil métier
            </h3>
            <div className="space-y-4">
              {sortedBlocs.map((bs, index) => {
                const profile = BLOC_PROFILES[bs.blocId];
                const color = CHART_COLORS[bs.blocId as keyof typeof CHART_COLORS];
                const isDominant = index === 0;
                return (
                  <div key={bs.blocId} className={cn(
                    "p-3 rounded-lg border",
                    isDominant ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border/50"
                  )}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                        <span className={cn("font-medium", isDominant && "text-primary")}>
                          {profile}
                        </span>
                        {isDominant && (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            DOMINANT
                          </Badge>
                        )}
                      </div>
                      <span className={cn(
                        "font-bold text-lg",
                        isDominant ? "text-primary" : "text-foreground"
                      )}>
                        {Math.round(bs.score * 100)}%
                      </span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${bs.score * 100}%`,
                          backgroundColor: color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Radar des compétences
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="bloc"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tickCount={5}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Bar Chart - Horizontal, sorted */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Classement des domaines
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-card border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{payload[0].payload.fullName}</p>
                              <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
                                {payload[0].value}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Top 3 recommendations - COHERENT with dominant profile */}
          <Card className="p-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Top 3 métiers recommandés
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Basés sur votre profil dominant: <span className="font-semibold text-primary">{dominantProfile}</span>
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {top3Jobs.map((rec, index) => (
                <div
                  key={rec.metier.id}
                  className={cn(
                    "p-4 rounded-xl border",
                    index === 0 
                      ? "bg-primary/5 border-primary/30" 
                      : "bg-secondary/50 border-border/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn(
                      "w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center",
                      index === 0 
                        ? "bg-yellow-500/20 text-yellow-600"
                        : index === 1
                        ? "bg-gray-400/20 text-gray-600"
                        : "bg-orange-500/20 text-orange-600"
                    )}>
                      {index + 1}
                    </span>
                    <Badge
                      variant="outline"
                      className={COMPATIBILITY_COLORS[rec.compatibilite]}
                    >
                      {rec.compatibilite}
                    </Badge>
                  </div>
                  <h4 className="font-semibold">{rec.metier.titre}</h4>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {Math.round(rec.score * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="grid gap-4">
            {result.recommandations.map((rec, index) => (
              <JobCard key={rec.metier.id} recommendation={rec} rank={index + 1} />
            ))}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strong skills */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-success">
                <Zap className="w-5 h-5" />
                Points forts
              </h3>
              <div className="space-y-2">
                {result.competencesFortes.length > 0 ? (
                  result.competencesFortes.map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-success/5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      <span>{comp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Continuez à développer vos compétences pour identifier vos points forts.
                  </p>
                )}
              </div>
            </Card>

            {/* Weak skills */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-warning">
                <AlertCircle className="w-5 h-5" />
                À améliorer
              </h3>
              <div className="space-y-2">
                {result.competencesFaibles.length > 0 ? (
                  result.competencesFaibles.map((comp, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2 rounded-lg bg-warning/5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                      <span>{comp}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Excellent ! Vous avez un bon niveau dans l'ensemble des compétences.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Detailed bloc scores */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Détail par bloc de compétences</h3>
            <div className="space-y-4">
              {result.blocsScores.map((bs, index) => (
                <div key={bs.blocId}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{bs.blocNom}</span>
                    <span className="text-primary font-semibold">
                      {Math.round(bs.score * 100)}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${bs.score * 100}%`,
                        backgroundColor: CHART_COLORS[bs.blocId as keyof typeof CHART_COLORS] || CHART_COLORS_ARRAY[index % CHART_COLORS_ARRAY.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Plan & Bio Tab */}
        <TabsContent value="plan" className="space-y-6">
          {/* Progression Plan */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Plan de progression personnalisé
              </h3>
              {!result.planProgression && (
                <Button onClick={onGeneratePlan} disabled={isGeneratingPlan}>
                  {isGeneratingPlan ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer avec IA
                    </>
                  )}
                </Button>
              )}
            </div>
            {result.planProgression ? (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap bg-secondary/30 rounded-lg p-4">
                  {result.planProgression}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Cliquez sur le bouton pour générer un plan de progression personnalisé
                basé sur vos compétences actuelles et les métiers visés.
              </p>
            )}
          </Card>

          {/* Professional Bio */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Bio professionnelle
              </h3>
              {!result.bioProfessionnelle && (
                <Button onClick={onGenerateBio} disabled={isGeneratingBio}>
                  {isGeneratingBio ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer avec IA
                    </>
                  )}
                </Button>
              )}
            </div>
            {result.bioProfessionnelle ? (
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
                <p className="text-lg italic">"{result.bioProfessionnelle}"</p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Cliquez sur le bouton pour générer une bio professionnelle accrocheuse
                basée sur votre profil de compétences.
              </p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <Button variant="outline" onClick={onRestart}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Recommencer
        </Button>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Exporter les résultats
        </Button>
      </div>
    </div>
  );
}

// Job recommendation card component
function JobCard({
  recommendation,
  rank,
}: {
  recommendation: MetierRecommandation;
  rank: number;
}) {
  const { metier, score, scoreCouverture, competencesManquantes, compatibilite } =
    recommendation;

  return (
    <Card
      className={cn(
        "p-6 transition-all duration-200 hover:shadow-lg",
        rank <= 3 && "border-primary/20"
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
            rank === 1
              ? "bg-yellow-500/20 text-yellow-600"
              : rank === 2
              ? "bg-gray-400/20 text-gray-600"
              : rank === 3
              ? "bg-orange-500/20 text-orange-600"
              : "bg-secondary text-muted-foreground"
          )}
        >
          {rank}
        </span>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-lg">{metier.titre}</h4>
            <Badge
              variant="outline"
              className={COMPATIBILITY_COLORS[compatibilite]}
            >
              {compatibilite}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-3">
            {metier.description}
          </p>

          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Score: </span>
              <span className="font-semibold text-primary">
                {Math.round(score * 100)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Couverture: </span>
              <span className="font-semibold">
                {Math.round(scoreCouverture * 100)}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Niveau: </span>
              <span>{metier.niveau}</span>
            </div>
          </div>

          {competencesManquantes.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-sm font-medium text-warning mb-1">
                Compétences à développer:
              </p>
              <div className="flex flex-wrap gap-1">
                {competencesManquantes.map((comp, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {comp}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </Card>
  );
}
