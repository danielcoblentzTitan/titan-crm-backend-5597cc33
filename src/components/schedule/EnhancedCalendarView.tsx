import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, addDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CloudRain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ScheduledTradeTask, isWeekendDay, isNonWorkDay, getHolidayName } from "./types";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

interface EnhancedCalendarViewProps {
  startDate: Date;
  trades: ScheduledTradeTask[];
  onTradeUpdate: (trade: ScheduledTradeTask) => void;
  onTradesUpdate?: (trades: ScheduledTradeTask[]) => void;
  readOnly?: boolean;
}

interface DraggableTradeProps {
  trade: ScheduledTradeTask;
  week: Date[];
  weekIndex: number;
  segmentIndex: number;
  startIndex: number;
  length: number;
  isFirstSegment: boolean;
  readOnly?: boolean;
}

function DraggableTrade({ trade, week, weekIndex, segmentIndex, startIndex, length, isFirstSegment, readOnly = false }: DraggableTradeProps) {
  const {
    attributes: moveAttributes,
    listeners: moveListeners,
    setNodeRef: setMoveNodeRef,
    transform: moveTransform,
    isDragging: isMoving,
  } = useDraggable({
    id: `${trade.name}-${weekIndex}-${segmentIndex}`,
    data: {
      trade,
      originalStartDate: trade.startDate,
      type: 'move',
    },
    disabled: readOnly,
  });

  const {
    attributes: resizeAttributes,
    listeners: resizeListeners,
    setNodeRef: setResizeNodeRef,
    transform: resizeTransform,
    isDragging: isResizing,
  } = useDraggable({
    id: `${trade.name}-${weekIndex}-${segmentIndex}-resize`,
    data: {
      trade,
      originalEndDate: trade.endDate,
      type: 'resize',
    },
    disabled: readOnly,
  });

  const isDragging = isMoving || isResizing;
  const transform = moveTransform || resizeTransform;

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const combinedStyle = {
    backgroundColor: trade.color,
    left: '2px',
    right: length > 1 ? `calc(-${(length - 1) * 100}% - ${(length - 1) * 4}px - 2px)` : '2px',
    top: `${60 + segmentIndex * 24}px`, // More space on mobile
    height: '18px', // Smaller height for mobile
    zIndex: isDragging ? 1000 : 10,
    ...style,
  };

  return (
    <div
      ref={setMoveNodeRef}
      style={combinedStyle}
      {...(!readOnly ? moveListeners : {})}
      {...(!readOnly ? moveAttributes : {})}
      className={cn(
        "absolute text-xs font-medium flex items-center rounded text-white",
        "p-0.5 sm:p-1", // Smaller padding on mobile
        !readOnly && "cursor-grab active:cursor-grabbing group",
        readOnly && "cursor-default",
        isDragging && "opacity-50"
      )}
      title={`${trade.name} - ${format(trade.startDate, 'MMM d')} to ${format(trade.endDate, 'MMM d')}`}
    >
      {isFirstSegment && (
        <span className="truncate flex-1">{trade.name}</span>
      )}
      
      {/* Resize handle on the right edge */}
      {length > 0 && !readOnly && (
        <div
          ref={setResizeNodeRef}
          {...resizeListeners}
          {...resizeAttributes}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 bg-white/30 rounded-r"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

interface DroppableDayProps {
  day: Date;
  dayIndex: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function DroppableDay({ day, dayIndex, isCurrentMonth, isToday, readOnly = false, weatherDays }: DroppableDayProps & { readOnly?: boolean; weatherDays: Record<string, { reason: string; delay_days: number }> }) {
  const { isOver, setNodeRef } = useDroppable({
    id: day.toISOString(),
    data: {
      date: day,
    },
    disabled: readOnly,
  });

  const holidayName = getHolidayName(day);
  const dayKey = format(day, 'yyyy-MM-dd');
  const isWeatherDay = weatherDays[dayKey];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[120px] sm:min-h-[140px] p-1 sm:p-2 border border-border bg-background rounded relative",
        !isCurrentMonth && "bg-muted/30 text-muted-foreground",
        isToday && "bg-primary/20 border-primary ring-2 ring-primary/30 shadow-lg",
        isOver && "bg-primary/20 border-primary",
        holidayName && "bg-red-50 border-red-200",
        isWeatherDay && "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
      )}
    >
      {/* Date section - fixed height to ensure consistent spacing */}
      <div className="h-12 sm:h-8 flex flex-col items-center justify-start mb-1">
        <div className="flex items-center justify-between w-full">
          <span className={cn(
            "px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-xs font-medium text-center",
            isWeatherDay ? "bg-blue-100 text-blue-800" : 
            isToday ? "bg-primary text-primary-foreground font-bold" : "bg-muted"
          )}>
            {format(day, 'd')}
          </span>
          {isWeatherDay && (
            <div 
              className="h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center"
              title={`Weather Delay: ${isWeatherDay.reason} (${isWeatherDay.delay_days} day${isWeatherDay.delay_days > 1 ? 's' : ''})`}
            >
              <CloudRain className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-0.5 text-center block sm:hidden">
          {format(day, 'MMM')}
        </span>
      </div>
      
      {/* Phase blocks will appear below this fixed-height date section */}
      {holidayName && (
        <div className="absolute bottom-2 left-2 right-2">
          <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded text-center font-medium">
            {holidayName}
          </div>
        </div>
      )}
    </div>
  );
}

export function EnhancedCalendarView({ startDate, trades, onTradeUpdate, onTradesUpdate, readOnly = false }: EnhancedCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [draggedTrade, setDraggedTrade] = useState<ScheduledTradeTask | null>(null);
  const [weatherDays, setWeatherDays] = useState<Record<string, { reason: string; delay_days: number }>>({});
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Load weather days for the current month view
  useEffect(() => {
    const loadWeatherDays = async () => {
      try {
        const { data: weatherData, error } = await supabase
          .from("global_exceptions")
          .select("exception_date, reason, delay_days")
          .eq("exception_type", "weather")
          .gte("exception_date", format(calendarStart, 'yyyy-MM-dd'))
          .lte("exception_date", format(calendarEnd, 'yyyy-MM-dd'));

        if (error) {
          console.error("Error loading weather data:", error);
          return;
        }

        // Convert to lookup object
        const weatherLookup: Record<string, { reason: string; delay_days: number }> = {};
        weatherData?.forEach(w => {
          weatherLookup[w.exception_date] = {
            reason: w.reason,
            delay_days: w.delay_days
          };
        });
        setWeatherDays(weatherLookup);
      } catch (error) {
        console.error("Error loading weather data:", error);
      }
    };

    loadWeatherDays();
  }, [currentMonth, calendarStart, calendarEnd]);

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

  const handleDragStart = (event: DragStartEvent) => {
    if (readOnly) return;
    const trade = event.active.data.current?.trade;
    if (trade) {
      setDraggedTrade(trade);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (readOnly) {
      setDraggedTrade(null);
      return;
    }
    const { active, over } = event;
    
    if (!over || !draggedTrade) {
      setDraggedTrade(null);
      return;
    }

    const dropDate = over.data.current?.date as Date;
    const dragType = active.data.current?.type as 'move' | 'resize';
    
    if (!dropDate) {
      setDraggedTrade(null);
      return;
    }

    // Skip weekends and holidays for drop
    let targetDate = dropDate;
    while (isNonWorkDay(targetDate)) {
      targetDate = addDays(targetDate, 1);
    }

    if (dragType === 'resize') {
      // Handle resize operation - change the end date and workdays
      const originalEndDate = active.data.current?.originalEndDate as Date;
      
      if (!originalEndDate) {
        setDraggedTrade(null);
        return;
      }

      // Calculate new end date
      let newEndDate = targetDate;
      
      // Count workdays between start and new end date
      let workdaysCount = 0;
      let currentDate = draggedTrade.startDate;
      
      while (currentDate <= newEndDate) {
        if (!isNonWorkDay(currentDate)) {
          workdaysCount++;
        }
        currentDate = addDays(currentDate, 1);
      }

      // Ensure minimum of 1 workday
      workdaysCount = Math.max(1, workdaysCount);

      // Recalculate proper end date based on workdays
      let properEndDate = draggedTrade.startDate;
      let workdaysAdded = 0;
      
      while (workdaysAdded < workdaysCount) {
        if (!isNonWorkDay(properEndDate)) {
          workdaysAdded++;
        }
        if (workdaysAdded < workdaysCount) {
          properEndDate = addDays(properEndDate, 1);
        }
      }

      const updatedTrade: ScheduledTradeTask = {
        ...draggedTrade,
        endDate: properEndDate,
        workdays: workdaysCount,
      };

      onTradeUpdate(updatedTrade);
      
      toast({
        title: "Trade Duration Updated",
        description: `${draggedTrade.name} duration changed to ${workdaysCount} workdays`,
      });

    } else {
      // Handle move operation (existing logic)
      const originalStartDate = active.data.current?.originalStartDate as Date;
      
      if (!originalStartDate) {
        setDraggedTrade(null);
        return;
      }

      // Calculate the shift amount in days
      const shiftDays = differenceInDays(targetDate, originalStartDate);
      
      if (shiftDays === 0) {
        setDraggedTrade(null);
        return; // No change needed
      }

      // Calculate new end date for the dragged trade
      let newEndDate = targetDate;
      let workdaysAdded = 0;
      
      while (workdaysAdded < draggedTrade.workdays) {
        if (!isNonWorkDay(newEndDate)) {
          workdaysAdded++;
        }
        if (workdaysAdded < draggedTrade.workdays) {
          newEndDate = addDays(newEndDate, 1);
        }
      }

      // Use cascading updates if onTradesUpdate is available
      if (onTradesUpdate) {
        // Find all trades that start after the original end date of the moved trade
        const originalEndDate = draggedTrade.endDate;
        const updatedTrades = trades.map(trade => {
          if (trade.name === draggedTrade.name) {
            // Update the dragged trade
            return {
              ...trade,
              startDate: targetDate,
              endDate: newEndDate,
            };
          } else if (trade.startDate > originalEndDate) {
            // Shift trades that start after the original end date
            let shiftedStartDate = addDays(trade.startDate, shiftDays);
            
            // Skip weekends and holidays for shifted start date
            while (isNonWorkDay(shiftedStartDate)) {
              shiftedStartDate = addDays(shiftedStartDate, 1);
            }
            
            // Calculate new end date for shifted trade
            let shiftedEndDate = shiftedStartDate;
            let shiftedWorkdaysAdded = 0;
            
            while (shiftedWorkdaysAdded < trade.workdays) {
              if (!isNonWorkDay(shiftedEndDate)) {
                shiftedWorkdaysAdded++;
              }
              if (shiftedWorkdaysAdded < trade.workdays) {
                shiftedEndDate = addDays(shiftedEndDate, 1);
              }
            }
            
            return {
              ...trade,
              startDate: shiftedStartDate,
              endDate: shiftedEndDate,
            };
          }
          return trade; // No change for trades that start before or during the moved trade
        });

        onTradesUpdate(updatedTrades);
        
        toast({
          title: "Schedule Updated",
          description: `${draggedTrade.name} and subsequent trades have been rescheduled`,
        });
      } else {
        // Fallback to single trade update
        const updatedTrade: ScheduledTradeTask = {
          ...draggedTrade,
          startDate: targetDate,
          endDate: newEndDate,
        };

        onTradeUpdate(updatedTrade);
        
        toast({
          title: "Trade Rescheduled",
          description: `${draggedTrade.name} moved to ${format(targetDate, 'MMM d')} - ${format(newEndDate, 'MMM d')}`,
        });
      }
    }

    setDraggedTrade(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
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
                     <DroppableDay
                       key={day.toISOString()}
                       day={day}
                       dayIndex={dayIndex}
                       isCurrentMonth={isCurrentMonth}
                       isToday={isToday}
                       readOnly={readOnly}
                       weatherDays={weatherDays}
                     />
                   );
                })}
              </div>

              {/* Trade Bar Overlays for this week */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="grid grid-cols-5 gap-1 h-full">
                  {week.map((day, dayIndex) => (
                    <div key={dayIndex} className="relative">
                      {getTradeSegmentsForWeek(week, weekIndex)
                        .filter(segment => segment.startIndex === dayIndex)
                        .map((segment, segmentIndex) => (
                           <DraggableTrade
                            key={`${segment.trade.name}-${weekIndex}-${segmentIndex}`}
                            trade={segment.trade}
                            week={week}
                            weekIndex={weekIndex}
                            segmentIndex={segmentIndex}
                            startIndex={segment.startIndex}
                            length={segment.length}
                            isFirstSegment={segment.isFirstSegment}
                            readOnly={readOnly}
                          />
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

        <DragOverlay>
          {draggedTrade ? (
            <div 
              className="text-xs p-1.5 rounded text-white font-medium opacity-90"
              style={{ backgroundColor: draggedTrade.color }}
            >
              {draggedTrade.name}
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}