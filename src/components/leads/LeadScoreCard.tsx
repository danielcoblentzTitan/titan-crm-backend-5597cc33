import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lead } from "@/services/supabaseService";
import { LeadScoringService, LeadScore } from "@/services/leadScoringService";
import { TrendingUp, BarChart3, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadScoreCardProps {
  lead: Lead;
  compact?: boolean;
}

export const LeadScoreCard = ({ lead, compact = false }: LeadScoreCardProps) => {
  const [leadScore, setLeadScore] = useState<LeadScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLeadScore();
  }, [lead.id]);

  const loadLeadScore = async () => {
    try {
      setLoading(true);
      let score = await LeadScoringService.getLeadScore(lead.id);
      
      // If no score exists, calculate it
      if (!score) {
        score = await LeadScoringService.calculateLeadScore(lead);
      }
      
      setLeadScore(score);
    } catch (error) {
      console.error('Error loading lead score:', error);
    } finally {
      setLoading(false);
    }
  };

  const recalculateScore = async () => {
    try {
      setCalculating(true);
      const score = await LeadScoringService.calculateLeadScore(lead);
      setLeadScore(score);
      
      toast({
        title: "Score Updated",
        description: "Lead score has been recalculated"
      });
    } catch (error) {
      console.error('Error recalculating score:', error);
      toast({
        title: "Error",
        description: "Failed to recalculate score",
        variant: "destructive"
      });
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card className={compact ? "h-fit" : ""}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leadScore) {
    return (
      <Card className={compact ? "h-fit" : ""}>
        <CardContent className="p-4">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No score available</p>
            <Button size="sm" onClick={recalculateScore} disabled={calculating}>
              <Zap className="h-4 w-4 mr-2" />
              Calculate Score
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const interpretation = LeadScoringService.getScoreInterpretation(leadScore.total_score);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${interpretation.color}`}>
            {interpretation.grade}
          </div>
          <div>
            <div className="font-medium text-sm">{leadScore.total_score}/100</div>
            <div className="text-xs text-muted-foreground">{interpretation.label}</div>
          </div>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Score Breakdown</DialogTitle>
            </DialogHeader>
            <LeadScoreDetailsContent leadScore={leadScore} interpretation={interpretation} onRecalculate={recalculateScore} calculating={calculating} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Lead Score
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={recalculateScore} disabled={calculating}>
          <RefreshCw className={`h-4 w-4 ${calculating ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent>
        <LeadScoreDetailsContent leadScore={leadScore} interpretation={interpretation} onRecalculate={recalculateScore} calculating={calculating} />
      </CardContent>
    </Card>
  );
};

const LeadScoreDetailsContent = ({ 
  leadScore, 
  interpretation, 
  onRecalculate, 
  calculating 
}: { 
  leadScore: LeadScore; 
  interpretation: ReturnType<typeof LeadScoringService.getScoreInterpretation>;
  onRecalculate: () => void;
  calculating: boolean;
}) => {
  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${interpretation.color}`}>
          {interpretation.grade}
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{leadScore.total_score}/100</div>
          <Badge variant="outline" className={interpretation.color}>
            {interpretation.label}
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">{interpretation.description}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="font-medium">Score Breakdown</h4>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Demographics</span>
            <span className="text-sm font-medium">{leadScore.demographic_score}</span>
          </div>
          <Progress value={leadScore.demographic_score} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Behavior</span>
            <span className="text-sm font-medium">{leadScore.behavioral_score}</span>
          </div>
          <Progress value={leadScore.behavioral_score} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Engagement</span>
            <span className="text-sm font-medium">{leadScore.engagement_score}</span>
          </div>
          <Progress value={leadScore.engagement_score} className="h-2" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Qualification</span>
            <span className="text-sm font-medium">{leadScore.qualification_score}</span>
          </div>
          <Progress value={leadScore.qualification_score} className="h-2" />
        </div>
      </div>

      {/* Score Factors */}
      <div className="space-y-3">
        <h4 className="font-medium">Contributing Factors</h4>
        <div className="space-y-2">
          {leadScore.score_breakdown.factors.map((factor, index) => (
            <div key={index} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm font-medium">{factor.factor}</div>
                <div className="text-xs text-muted-foreground">{factor.reason}</div>
              </div>
              <div className={`text-sm font-medium ${factor.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {factor.points >= 0 ? '+' : ''}{factor.points}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last Updated */}
      <div className="text-xs text-muted-foreground text-center">
        Last calculated: {new Date(leadScore.last_calculated).toLocaleString()}
      </div>
    </div>
  );
};