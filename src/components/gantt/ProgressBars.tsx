import React, { useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { EnhancedPhase } from './SophisticatedGantt';

interface Props {
  phase: EnhancedPhase;
  timelineBounds: {
    start: Date;
    end: Date;
    totalDays: number;
  };
  onProgressUpdate?: (progress: number) => void;
}

export function ProgressBars({ phase, timelineBounds, onProgressUpdate }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const getPhasePosition = () => {
    if (!phase.start_date || !phase.end_date) return null;

    const startDate = parseISO(phase.start_date);
    const endDate = parseISO(phase.end_date);
    
    const startOffset = differenceInDays(startDate, timelineBounds.start);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: `${(startOffset / timelineBounds.totalDays) * 100}%`,
      width: `${(duration / timelineBounds.totalDays) * 100}%`,
      startOffset,
      duration
    };
  };

  const position = getPhasePosition();
  if (!position) return null;

  const getStatusColor = () => {
    switch (phase.status) {
      case 'Completed': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'On Hold': return 'bg-yellow-500';
      case 'Cancelled': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityIntensity = () => {
    switch (phase.priority) {
      case 'Critical': return 'opacity-100 shadow-lg';
      case 'High': return 'opacity-90 shadow-md';
      case 'Medium': return 'opacity-80 shadow-sm';
      case 'Low': return 'opacity-70';
      default: return 'opacity-60';
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onProgressUpdate) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const newProgress = Math.round((clickX / rect.width) * 100);
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    
    onProgressUpdate(clampedProgress);
  };

  return (
    <div className="absolute top-0 bottom-0" style={{ left: position.left, width: position.width }}>
      {/* Main phase bar */}
      <div
        className={`absolute top-3 h-6 rounded-sm border ${getStatusColor()} ${getPriorityIntensity()} ${
          phase.is_critical_path ? 'ring-2 ring-red-500 ring-opacity-50' : ''
        } group cursor-pointer`}
        style={{ 
          left: '2px', 
          right: '2px',
          backgroundColor: phase.color || undefined
        }}
        onClick={handleProgressClick}
        title={`${phase.name} - ${phase.completion_percentage}% complete`}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-white bg-opacity-30 rounded-sm transition-all duration-300"
          style={{ width: `${phase.completion_percentage}%` }}
        />

        {/* Phase name label */}
        <div className="absolute inset-0 flex items-center px-2">
          <span className="text-white text-xs font-medium truncate">
            {phase.name}
          </span>
        </div>

        {/* Progress percentage indicator */}
        <div className="absolute -bottom-4 left-0 text-xs text-muted-foreground">
          {phase.completion_percentage}%
        </div>

        {/* Critical path indicator */}
        {phase.is_critical_path && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}

        {/* Hover tooltip */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap">
          <div className="font-medium">{phase.name}</div>
          <div>Status: {phase.status}</div>
          <div>Progress: {phase.completion_percentage}%</div>
          <div>Duration: {phase.duration_days} days</div>
          {phase.effort_hours > 0 && <div>Effort: {phase.effort_hours}h</div>}
          {phase.resource_name && <div>Resource: {phase.resource_name}</div>}
          
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black" />
        </div>

        {/* Actual dates overlay if different from planned */}
        {phase.actual_start_date && phase.actual_start_date !== phase.start_date && (
          <div className="absolute top-7 h-2 bg-green-600 rounded-sm opacity-70" style={{ 
            left: '2px', 
            right: '2px' 
          }} />
        )}
      </div>

      {/* Effort hours indicator */}
      {phase.effort_hours > 0 && (
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground bg-background px-1 rounded">
          {phase.effort_hours}h
        </div>
      )}

      {/* Variance indicators */}
      {phase.actual_start_date && phase.start_date && phase.actual_start_date !== phase.start_date && (
        <div className="absolute top-10 left-0 text-xs text-orange-600 bg-orange-50 px-1 rounded">
          Delayed
        </div>
      )}
    </div>
  );
}