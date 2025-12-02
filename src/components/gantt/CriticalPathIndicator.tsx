import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { EnhancedPhase } from './SophisticatedGantt';

interface Props {
  phases: EnhancedPhase[];
}

export function CriticalPathIndicator({ phases }: Props) {
  const criticalPhases = phases.filter(p => p.is_critical_path);
  const totalDuration = criticalPhases.reduce((sum, p) => sum + p.duration_days, 0);
  const averageProgress = criticalPhases.length > 0 
    ? criticalPhases.reduce((sum, p) => sum + p.completion_percentage, 0) / criticalPhases.length 
    : 0;

  if (criticalPhases.length === 0) {
    return null;
  }

  const isAtRisk = averageProgress < 50 && criticalPhases.some(p => p.status === 'In Progress');

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={isAtRisk ? "destructive" : "outline"} 
        className="text-xs"
      >
        {isAtRisk ? (
          <AlertTriangle className="h-3 w-3 mr-1" />
        ) : (
          <TrendingUp className="h-3 w-3 mr-1" />
        )}
        Critical: {criticalPhases.length} phases, {totalDuration}d
      </Badge>
      
      {isAtRisk && (
        <Badge variant="destructive" className="text-xs">
          At Risk
        </Badge>
      )}
    </div>
  );
}