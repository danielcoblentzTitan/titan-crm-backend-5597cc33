import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { EnhancedPhase } from './SophisticatedGantt';

interface Props {
  phase: EnhancedPhase;
  timelineBounds: {
    start: Date;
    end: Date;
    totalDays: number;
  };
}

export function BaselineComparison({ phase, timelineBounds }: Props) {
  const getPosition = (startDate: string | null, endDate: string | null) => {
    if (!startDate || !endDate) return null;

    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    const startOffset = differenceInDays(start, timelineBounds.start);
    const duration = differenceInDays(end, start) + 1;
    
    return {
      left: `${(startOffset / timelineBounds.totalDays) * 100}%`,
      width: `${(duration / timelineBounds.totalDays) * 100}%`
    };
  };

  const currentPosition = getPosition(phase.start_date, phase.end_date);
  const baselinePosition = getPosition(phase.baseline_start_date, phase.baseline_end_date);

  if (!currentPosition || !baselinePosition) return null;

  // Calculate variance
  const startVariance = phase.start_date && phase.baseline_start_date 
    ? differenceInDays(parseISO(phase.start_date), parseISO(phase.baseline_start_date))
    : 0;
  
  const durationVariance = phase.duration_days - (phase.baseline_duration_days || 0);

  const isDelayed = startVariance > 0;
  const isDurationChanged = durationVariance !== 0;

  return (
    <div className="absolute top-0 bottom-0">
      {/* Baseline bar (underneath) */}
      <div
        className="absolute top-1 h-4 bg-gray-300 rounded-sm opacity-60 border border-gray-400"
        style={{
          left: baselinePosition.left,
          width: baselinePosition.width
        }}
        title={`Baseline: ${phase.baseline_start_date} to ${phase.baseline_end_date} (${phase.baseline_duration_days || 0}d)`}
      >
        <div className="absolute inset-0 flex items-center px-1">
          <span className="text-gray-600 text-xs truncate">Baseline</span>
        </div>
      </div>

      {/* Current planned bar (on top) */}
      <div
        className={`absolute top-3 h-6 rounded-sm border-2 ${
          isDelayed ? 'border-red-500 bg-red-100' : 
          isDurationChanged ? 'border-yellow-500 bg-yellow-100' : 
          'border-green-500 bg-green-100'
        }`}
        style={{
          left: currentPosition.left,
          width: currentPosition.width,
          backgroundColor: phase.color ? `${phase.color}80` : undefined
        }}
      >
        {/* Variance indicators */}
        {(isDelayed || isDurationChanged) && (
          <div className="absolute -top-6 left-0 text-xs bg-background border border-border rounded px-1">
            {isDelayed && <span className="text-red-600">+{startVariance}d</span>}
            {isDurationChanged && (
              <span className={durationVariance > 0 ? 'text-orange-600' : 'text-green-600'}>
                {durationVariance > 0 ? '+' : ''}{durationVariance}d duration
              </span>
            )}
          </div>
        )}
      </div>

      {/* Connecting lines to show relationship */}
      {isDelayed && (
        <div className="absolute top-1 bottom-1">
          {/* Left connection */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-400 opacity-50"
            style={{ left: baselinePosition.left }}
          />
          {/* Right connection */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-400 opacity-50"
            style={{ 
              left: `calc(${baselinePosition.left} + ${baselinePosition.width})`
            }}
          />
        </div>
      )}
    </div>
  );
}