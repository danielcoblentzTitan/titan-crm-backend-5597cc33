import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CloudRain } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScheduledTradeTask, isWeekendDay } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectScheduleData {
  id: string;
  project_id: string;
  project_name: string;
  customer_name: string;
  project_start_date: string;
  schedule_data: any[];
  trades: ScheduledTradeTask[];
}

interface ProjectScheduleViewProps {
  projectId: string;
  projectName?: string;
}

export function ProjectScheduleView({ projectId, projectName }: ProjectScheduleViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [projectSchedule, setProjectSchedule] = useState<ProjectScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherDays, setWeatherDays] = useState<Record<string, { reason: string; delay_days: number }>>({});

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

  // Load project schedule and weather days
  const loadProjectSchedule = async () => {
    setLoading(true);
    try {
      // Load project schedule
      const { data: schedule, error } = await supabase
        .from("project_schedules")
        .select(`
          *,
          projects!inner(
            id,
            name,
            customer_name
          )
        `)
        .eq("project_id", projectId)
        .single();

      if (error) throw error;

      // Load weather days for the current month view
      const { data: weatherData, error: weatherError } = await supabase
        .from("global_exceptions")
        .select("exception_date, reason, delay_days")
        .eq("exception_type", "weather")
        .gte("exception_date", format(calendarStart, 'yyyy-MM-dd'))
        .lte("exception_date", format(calendarEnd, 'yyyy-MM-dd'));

      if (weatherError) {
        console.error("Error loading weather data:", weatherError);
      } else {
        // Convert to lookup object
        const weatherLookup: Record<string, { reason: string; delay_days: number }> = {};
        weatherData?.forEach(w => {
          weatherLookup[w.exception_date] = {
            reason: w.reason,
            delay_days: w.delay_days
          };
        });
        setWeatherDays(weatherLookup);
      }

      if (schedule) {
        const project = (schedule as any).projects;
        const startDate = parseISO(schedule.project_start_date);
        const scheduleData = schedule.schedule_data as any[];

        // Convert schedule data to ScheduledTradeTask format
        const trades: ScheduledTradeTask[] = [];
        let currentDate = new Date(startDate);

        scheduleData.forEach(tradeData => {
          if (tradeData.workdays > 0) {
            const trade: ScheduledTradeTask = {
              name: tradeData.name,
              workdays: tradeData.workdays,
              color: tradeData.color,
              startDate: new Date(currentDate),
              endDate: new Date(currentDate)
            };

            // Calculate end date by adding workdays (excluding weekends)
            let daysAdded = 0;
            let endDate = new Date(currentDate);
            
            while (daysAdded < tradeData.workdays) {
              if (!isWeekendDay(endDate)) {
                daysAdded++;
              }
              if (daysAdded < tradeData.workdays) {
                endDate.setDate(endDate.getDate() + 1);
              }
            }

            trade.endDate = endDate;
            trades.push(trade);

            // Move to next day after this trade ends
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            // Skip weekends for next trade start
            while (isWeekendDay(currentDate)) {
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        });

        setProjectSchedule({
          id: schedule.id,
          project_id: schedule.project_id,
          project_name: project.name,
          customer_name: project.customer_name,
          project_start_date: schedule.project_start_date,
          schedule_data: scheduleData,
          trades
        });
      }
    } catch (error) {
      console.error("Error loading project schedule:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectSchedule();
  }, [projectId, currentMonth]);

  // Get trade segments for a specific week
  const getTradeSegmentsForWeek = (week: Date[]) => {
    if (!projectSchedule) return [];

    const segments: Array<{
      trade: ScheduledTradeTask;
      startIndex: number;
      length: number;
      isFirstSegment: boolean;
    }> = [];

    projectSchedule.trades.forEach(trade => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{projectName || "Project Schedule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading schedule...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projectSchedule) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{projectName || "Project Schedule"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No schedule found for this project
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{projectSchedule.project_name} - {projectSchedule.customer_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {/* Day Headers */}
        <div className="grid grid-cols-5 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted/50 rounded-t">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid with trade bars */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="relative">
            {/* Week Row */}
            <div className="grid grid-cols-5 gap-1">
              {week.map((day, dayIndex) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isToday = isSameDay(day, new Date());
                const dayKey = format(day, 'yyyy-MM-dd');
                const isWeatherDay = weatherDays[dayKey];

                // Calculate total height needed for all trade bars on this day
                const allTradesOnDay = getTradeSegmentsForWeek(week)
                  .filter(segment => segment.startIndex === dayIndex);

                const minHeight = Math.max(60, 20 + allTradesOnDay.length * 20);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-1 border border-border bg-background rounded relative",
                      !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                      isToday && "bg-primary/10 border-primary ring-1 ring-primary/20",
                      isWeatherDay && "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                    )}
                    style={{ minHeight: `${minHeight}px` }}
                  >
                    <div className="text-xs font-medium flex items-center justify-between">
                      <span className={cn(
                        "px-1 py-0.5 rounded text-xs",
                        isWeatherDay ? "bg-blue-100 text-blue-800" : "bg-muted"
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
                  </div>
                );
              })}
            </div>

            {/* Trade Bar Overlays for this week */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="grid grid-cols-5 gap-1 h-full">
                {week.map((day, dayIndex) => {
                  const weekTrades = getTradeSegmentsForWeek(week)
                    .filter(segment => segment.startIndex === dayIndex);
                  
                  if (weekTrades.length === 0) return null;
                  
                  return weekTrades.map((segment, tradeIndex) => (
                    <div
                      key={`${segment.trade.name}-${weekIndex}-${tradeIndex}`}
                      className="absolute text-xs p-1 rounded text-white font-medium flex items-center"
                      style={{
                        backgroundColor: segment.trade.color,
                        left: '4px',
                        right: segment.length > 1 ? `calc(-${(segment.length - 1) * 100}% - ${(segment.length - 1) * 4}px - 4px)` : '4px',
                        top: `${20 + (tradeIndex * 20)}px`,
                        height: '18px',
                        zIndex: 10
                      }}
                      title={`${segment.trade.name} - ${format(segment.trade.startDate, 'MMM d')} to ${format(segment.trade.endDate, 'MMM d')}`}
                    >
                      {segment.isFirstSegment && (
                        <span className="truncate text-xs">
                          {segment.trade.name}
                        </span>
                      )}
                    </div>
                  ));
                })}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}