import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduledTradeTask, isWeekendDay } from "./types";

interface ScheduleCalendarViewProps {
  startDate: Date;
  trades: ScheduledTradeTask[];
}

export function ScheduleCalendarView({ startDate, trades }: ScheduleCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(startDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get the full calendar view including leading/trailing days to fill the grid
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const allCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  
  // Filter to only show weekdays (Monday-Friday)
  const calendarDays = allCalendarDays.filter(day => {
    const dayOfWeek = getDay(day);
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday (1) through Friday (5)
  });

  const getTradesForDay = (day: Date) => {
    // Don't show trades on weekends
    if (isWeekendDay(day)) {
      return [];
    }
    return trades.filter(trade => {
      return day >= trade.startDate && day <= trade.endDate;
    });
  };

  // Organize days into weeks for proper bar rendering
  const organizeIntoWeeks = () => {
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    calendarDays.forEach((day, index) => {
      const dayOfWeek = getDay(day);
      
      // Start new week on Monday
      if (dayOfWeek === 1 && currentWeek.length > 0) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return weeks;
  };

  const weeks = organizeIntoWeeks();

  // Create trade segments for each week
  const getTradeSegmentsForWeek = (week: Date[], weekIndex: number) => {
    const segments: Array<{
      trade: ScheduledTradeTask;
      startIndex: number;
      length: number;
      isFirstSegment: boolean;
    }> = [];

    trades.forEach(trade => {
      const tradeDaysInWeek: number[] = [];
      
      week.forEach((day, dayIndex) => {
        if (day >= trade.startDate && day <= trade.endDate) {
          tradeDaysInWeek.push(dayIndex);
        }
      });

      if (tradeDaysInWeek.length > 0) {
        // Check if this is the first week where this trade appears
        const isFirstSegment = isSameDay(trade.startDate, week[tradeDaysInWeek[0]]) || 
                              week[tradeDaysInWeek[0]] <= trade.startDate;
        
        segments.push({
          trade,
          startIndex: tradeDaysInWeek[0],
          length: tradeDaysInWeek.length,
          isFirstSegment
        });
      }
    });

    return segments;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid - Week by Week */}
      <div className="space-y-1">
        {/* Day Headers */}
        <div className="grid grid-cols-5 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-t">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="relative">
            {/* Week Row */}
            <div className="grid grid-cols-5 gap-1">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] p-2 border border-border bg-background rounded relative",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isToday && "bg-primary/10 border-primary ring-2 ring-primary/20"
                    )}
                  >
                    <div className="text-sm font-medium mb-2">
                      <span className="bg-muted px-2 py-1 rounded text-xs">
                        {format(day, 'MMM d')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trade Bar Overlays for this week */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="grid grid-cols-5 gap-1 h-full">
                {week.map((day, dayIndex) => (
                  <div key={dayIndex} className="relative">
                    {getTradeSegmentsForWeek(week, weekIndex)
                      .filter(segment => segment.startIndex === dayIndex)
                      .map((segment, segmentIndex) => (
                        <div
                          key={`${segment.trade.name}-${weekIndex}-${segmentIndex}`}
                          className="absolute text-xs p-1.5 rounded text-white font-medium flex items-center pointer-events-auto"
                          style={{
                            backgroundColor: segment.trade.color,
                            left: '8px', // Match calendar day padding
                            right: segment.length > 1 ? `calc(-${(segment.length - 1) * 100}% - ${(segment.length - 1) * 4}px - 8px)` : '8px',
                            top: `${40 + segmentIndex * 26}px`, // Below the date
                            height: '24px',
                            zIndex: 10
                          }}
                          title={`${segment.trade.name} - ${format(segment.trade.startDate, 'MMM d')} to ${format(segment.trade.endDate, 'MMM d')}`}
                        >
                          {segment.isFirstSegment && (
                            <span className="truncate">{segment.trade.name}</span>
                          )}
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {trades.map(trade => (
            <div key={trade.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded" 
                style={{ backgroundColor: trade.color }}
              />
              <span className="text-xs truncate" title={trade.name}>
                {trade.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}