import React, { useMemo } from 'react';
import { format, addDays, addWeeks, addMonths, addQuarters, startOfWeek, startOfMonth, startOfQuarter, differenceInDays } from 'date-fns';

interface TimelineBounds {
  start: Date;
  end: Date;
  totalDays: number;
}

interface Props {
  timelineBounds: TimelineBounds;
  zoomLevel: 'days' | 'weeks' | 'months' | 'quarters';
}

export function GanttTimeline({ timelineBounds, zoomLevel }: Props) {
  const timelineSegments = useMemo(() => {
    const segments = [];
    let currentDate = new Date(timelineBounds.start);
    
    while (currentDate <= timelineBounds.end) {
      let segmentStart: Date;
      let segmentEnd: Date;
      let label: string;
      let sublabel: string = '';
      
      switch (zoomLevel) {
        case 'days':
          segmentStart = new Date(currentDate);
          segmentEnd = addDays(currentDate, 1);
          label = format(currentDate, 'd');
          sublabel = format(currentDate, 'EEE');
          currentDate = addDays(currentDate, 1);
          break;
          
        case 'weeks':
          segmentStart = startOfWeek(currentDate, { weekStartsOn: 1 });
          segmentEnd = addWeeks(segmentStart, 1);
          label = format(segmentStart, 'MMM d');
          sublabel = 'Week';
          currentDate = addWeeks(currentDate, 1);
          break;
          
        case 'months':
          segmentStart = startOfMonth(currentDate);
          segmentEnd = addMonths(segmentStart, 1);
          label = format(segmentStart, 'MMM yyyy');
          currentDate = addMonths(currentDate, 1);
          break;
          
        case 'quarters':
          segmentStart = startOfQuarter(currentDate);
          segmentEnd = addQuarters(segmentStart, 1);
          label = `Q${Math.floor(segmentStart.getMonth() / 3) + 1} ${segmentStart.getFullYear()}`;
          currentDate = addQuarters(currentDate, 1);
          break;
          
        default:
          segmentStart = new Date(currentDate);
          segmentEnd = addDays(currentDate, 7);
          label = format(currentDate, 'MMM d');
          currentDate = addDays(currentDate, 7);
      }
      
      const startOffset = Math.max(0, differenceInDays(segmentStart, timelineBounds.start));
      const segmentDays = differenceInDays(segmentEnd, segmentStart);
      const widthPercentage = (segmentDays / timelineBounds.totalDays) * 100;
      const leftPercentage = (startOffset / timelineBounds.totalDays) * 100;
      
      segments.push({
        start: segmentStart,
        end: segmentEnd,
        label,
        sublabel,
        left: `${leftPercentage}%`,
        width: `${widthPercentage}%`,
        segmentDays
      });
    }
    
    return segments;
  }, [timelineBounds, zoomLevel]);

  // Generate grid lines for better visual alignment
  const gridLines = useMemo(() => {
    const lines = [];
    
    // Add grid line for each major segment
    timelineSegments.forEach((segment, index) => {
      if (index > 0) { // Skip first line
        lines.push({
          left: segment.left,
          type: 'major'
        });
      }
    });
    
    // Add minor grid lines for days when in weeks view
    if (zoomLevel === 'weeks') {
      timelineSegments.forEach(segment => {
        for (let day = 1; day < segment.segmentDays; day++) {
          const dayOffset = (day / segment.segmentDays) * parseFloat(segment.width.replace('%', ''));
          const leftPercent = parseFloat(segment.left.replace('%', '')) + dayOffset;
          lines.push({
            left: `${leftPercent}%`,
            type: 'minor'
          });
        }
      });
    }
    
    return lines;
  }, [timelineSegments, zoomLevel]);

  const getMinWidth = () => {
    switch (zoomLevel) {
      case 'days': return '40px';
      case 'weeks': return '80px';
      case 'months': return '120px';
      case 'quarters': return '160px';
      default: return '80px';
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border">
      {/* Main Timeline Header */}
      <div className="relative h-16 border-b border-border/50">
        {/* Fixed left column */}
        <div className="absolute left-0 top-0 w-80 h-full bg-muted/50 border-r border-border flex items-center px-4">
          <span className="font-semibold text-sm">Project Phases</span>
        </div>
        
        {/* Scrollable timeline */}
        <div className="ml-80 relative h-full overflow-hidden">
          {/* Timeline segments */}
          {timelineSegments.map((segment, index) => (
            <div
              key={index}
              className="absolute top-0 h-full flex flex-col justify-center items-center border-r border-border/30 bg-background"
              style={{
                left: segment.left,
                width: segment.width,
                minWidth: getMinWidth()
              }}
            >
              <div className="text-sm font-medium text-center px-1">
                {segment.label}
              </div>
              {segment.sublabel && (
                <div className="text-xs text-muted-foreground text-center">
                  {segment.sublabel}
                </div>
              )}
            </div>
          ))}
          
          {/* Grid lines overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {gridLines.map((line, index) => (
              <div
                key={index}
                className={`absolute top-0 bottom-0 ${
                  line.type === 'major' 
                    ? 'border-l border-border' 
                    : 'border-l border-border/20'
                }`}
                style={{ left: line.left }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Today indicator */}
      <div className="absolute top-0 bottom-0 border-l-2 border-red-500 z-30 pointer-events-none">
        <div 
          className="absolute"
          style={{
            left: `${(differenceInDays(new Date(), timelineBounds.start) / timelineBounds.totalDays) * 100}%`,
            marginLeft: '320px' // Account for fixed left column
          }}
        >
          <div className="h-full border-l-2 border-red-500">
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm" />
            <div className="absolute top-4 -left-6 text-xs bg-red-500 text-white px-1 rounded">
              Today
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}