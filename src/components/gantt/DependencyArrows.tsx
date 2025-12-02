import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { EnhancedPhase } from './SophisticatedGantt';

interface Props {
  phase: EnhancedPhase;
  allPhases: EnhancedPhase[];
  timelineBounds: {
    start: Date;
    end: Date;
    totalDays: number;
  };
}

export function DependencyArrows({ phase, allPhases, timelineBounds }: Props) {
  // Find phases that this phase depends on (predecessors)
  const predecessors = allPhases.filter(p => 
    p.project_id === phase.project_id && 
    p.end_date && 
    phase.start_date &&
    parseISO(p.end_date) <= parseISO(phase.start_date) &&
    // Simple heuristic: if this phase starts within 5 days of another ending, assume dependency
    differenceInDays(parseISO(phase.start_date), parseISO(p.end_date)) <= 5
  );

  const getPhasePosition = (targetPhase: EnhancedPhase) => {
    if (!targetPhase.start_date || !targetPhase.end_date) return null;

    const startDate = parseISO(targetPhase.start_date);
    const endDate = parseISO(targetPhase.end_date);
    
    const startOffset = differenceInDays(startDate, timelineBounds.start);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: (startOffset / timelineBounds.totalDays) * 100,
      width: (duration / timelineBounds.totalDays) * 100,
      startOffset,
      endOffset: startOffset + duration
    };
  };

  const currentPosition = getPhasePosition(phase);
  if (!currentPosition) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {predecessors.map((predecessor) => {
        const predPosition = getPhasePosition(predecessor);
        if (!predPosition) return null;

        // Calculate arrow path
        const startX = predPosition.left + predPosition.width;
        const endX = currentPosition.left;
        const midX = (startX + endX) / 2;

        // Skip if phases overlap or are too close
        if (endX <= startX + 1) return null;

        return (
          <div key={`${predecessor.id}-${phase.id}`} className="absolute inset-0">
            {/* Horizontal line from predecessor end */}
            <div
              className="absolute top-1/2 h-0.5 bg-blue-500"
              style={{
                left: `${startX}%`,
                width: `${midX - startX}%`,
                transform: 'translateY(-50%)'
              }}
            />
            
            {/* Vertical connector */}
            <div
              className="absolute w-0.5 bg-blue-500"
              style={{
                left: `${midX}%`,
                top: '25%',
                height: '50%'
              }}
            />
            
            {/* Horizontal line to current phase start */}
            <div
              className="absolute top-1/2 h-0.5 bg-blue-500"
              style={{
                left: `${midX}%`,
                width: `${endX - midX}%`,
                transform: 'translateY(-50%)'
              }}
            />
            
            {/* Arrow head */}
            <div
              className="absolute top-1/2 transform -translate-y-1/2"
              style={{ left: `${endX - 1}%` }}
            >
              <ArrowRight className="h-3 w-3 text-blue-500" />
            </div>

            {/* Dependency info tooltip on hover */}
            <div
              className="absolute top-1/2 opacity-0 hover:opacity-100 transition-opacity bg-black text-white text-xs rounded p-1 z-10"
              style={{
                left: `${midX - 5}%`,
                transform: 'translateY(-100%)'
              }}
            >
              {predecessor.name} → {phase.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}