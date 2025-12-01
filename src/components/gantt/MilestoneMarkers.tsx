import React from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Diamond, Target, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Milestone } from './SophisticatedGantt';

interface Props {
  milestones: Milestone[];
  timelineBounds: {
    start: Date;
    end: Date;
    totalDays: number;
  };
}

export function MilestoneMarkers({ milestones, timelineBounds }: Props) {
  const getMilestoneIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <Diamond className="h-4 w-4" />;
      case 'review': return <Target className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'approval': return <AlertTriangle className="h-4 w-4" />;
      case 'start': return <Clock className="h-4 w-4" />;
      case 'finish': return <CheckCircle className="h-4 w-4" />;
      default: return <Diamond className="h-4 w-4" />;
    }
  };

  const getMilestonePosition = (milestone: Milestone) => {
    const targetDate = milestone.target_date ? parseISO(milestone.target_date) : null;
    const actualDate = milestone.actual_date ? parseISO(milestone.actual_date) : null;
    
    if (!targetDate) return null;

    const offset = differenceInDays(targetDate, timelineBounds.start);
    const leftPercentage = (offset / timelineBounds.totalDays) * 100;

    return {
      left: `${leftPercentage}%`,
      targetDate,
      actualDate,
      isOverdue: !actualDate && targetDate < new Date(),
      isCompleted: !!actualDate,
      variance: actualDate ? differenceInDays(actualDate, targetDate) : 0
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {milestones.map((milestone) => {
        const position = getMilestonePosition(milestone);
        if (!position) return null;

        return (
          <div
            key={milestone.id}
            className="absolute top-0 bottom-0 pointer-events-auto group"
            style={{ left: position.left }}
          >
            {/* Milestone marker line */}
            <div className="h-full border-l-2 border-dashed border-gray-400" />
            
            {/* Milestone icon */}
            <div
              className={`absolute -top-1 -left-3 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white ${
                position.isCompleted 
                  ? 'bg-green-500' 
                  : position.isOverdue 
                    ? 'bg-red-500' 
                    : milestone.is_critical 
                      ? 'bg-orange-500' 
                      : 'bg-blue-500'
              }`}
              style={{ backgroundColor: position.isCompleted ? '#10b981' : milestone.color }}
            >
              {getMilestoneIcon(milestone.milestone_type)}
            </div>

            {/* Tooltip */}
            <div className="absolute -top-12 -left-20 w-40 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
              <div className="font-medium">{milestone.milestone_name}</div>
              <div className="text-gray-300">
                Target: {format(position.targetDate, 'MMM d, yyyy')}
              </div>
              {position.actualDate && (
                <div className="text-gray-300">
                  Actual: {format(position.actualDate, 'MMM d, yyyy')}
                </div>
              )}
              {position.variance !== 0 && (
                <div className={position.variance > 0 ? 'text-red-300' : 'text-green-300'}>
                  {position.variance > 0 ? '+' : ''}{position.variance} days
                </div>
              )}
              <div className="text-gray-300">
                Progress: {milestone.completion_percentage}%
              </div>
              
              {/* Arrow pointing down */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
            </div>

            {/* Progress indicator for incomplete milestones */}
            {!position.isCompleted && milestone.completion_percentage > 0 && (
              <div
                className="absolute -top-1 -left-3 w-6 h-6 rounded-full border-2 border-white"
                style={{
                  background: `conic-gradient(${milestone.color} ${milestone.completion_percentage * 3.6}deg, transparent 0deg)`
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}