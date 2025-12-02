import { useState, useEffect } from "react";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Save, Send, Download, Calendar as GoogleCalendarIcon, GripVertical, FileText } from "lucide-react";
import { EnhancedCalendarView } from "./EnhancedCalendarView";
import { ScheduleSendDialog } from "./ScheduleSendDialog";
import { TradeTask, ScheduledTradeTask, isWeekendDay, isNonWorkDay } from "./types";
import { GoogleCalendarIntegration } from "./GoogleCalendarIntegration";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { updateDrawDueDatesFromSchedule, handleScheduleChanges } from "@/services/drawsService";

interface EnhancedScheduleBuilderProps {
  projectId: string;
}

const DEFAULT_TRADES: Omit<TradeTask, 'startDate' | 'endDate'>[] = [
  { name: "Framing Crew", workdays: 5, color: "#ef4444" },
  { name: "Plumbing Underground", workdays: 2, color: "#3b82f6" },
  { name: "Concrete Crew", workdays: 3, color: "#6b7280" },
  { name: "Interior Framing", workdays: 4, color: "#f59e0b" },
  { name: "Plumbing Rough In", workdays: 3, color: "#3b82f6" },
  { name: "HVAC Rough In", workdays: 3, color: "#10b981" },
  { name: "Electric Rough In", workdays: 3, color: "#fbbf24" },
  { name: "Insulation", workdays: 2, color: "#8b5cf6" },
  { name: "Drywall", workdays: 5, color: "#4b5563" },
  { name: "Paint", workdays: 4, color: "#ec4899" },
  { name: "Flooring", workdays: 4, color: "#92400e" },
  { name: "Doors and Trim", workdays: 3, color: "#059669" },
  { name: "Garage Doors and Gutters", workdays: 2, color: "#dc2626" },
  { name: "Garage Finish", workdays: 2, color: "#7c3aed" },
  { name: "Plumbing Final", workdays: 2, color: "#3b82f6" },
  { name: "HVAC Final", workdays: 2, color: "#10b981" },
  { name: "Electric Final", workdays: 2, color: "#fbbf24" },
  { name: "Kitchen Install", workdays: 3, color: "#f97316" },
  { name: "Interior Finishes", workdays: 4, color: "#06b6d4" },
  { name: "Final", workdays: 2, color: "#65a30d" },
];

interface SortableTradeItemProps {
  trade: TradeTask;
  index: number;
  onWorkdaysChange: (workdays: number) => void;
}

function SortableTradeItem({ trade, index, onWorkdaysChange }: SortableTradeItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trade.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-2 p-3 border border-border rounded-lg bg-background"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div 
        className="w-3 h-3 rounded" 
        style={{ backgroundColor: trade.color }}
      />
      <div className="flex-1">
        <Label className="text-sm font-medium">{trade.name}</Label>
      </div>
      <div className="w-24">
        <Input
          type="number"
          min="0"
          max="30"
          value={trade.workdays}
          onChange={(e) => onWorkdaysChange(parseInt(e.target.value) || 0)}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

export function EnhancedScheduleBuilder({ projectId }: EnhancedScheduleBuilderProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [trades, setTrades] = useState<TradeTask[]>(
    DEFAULT_TRADES.map(trade => ({ ...trade, startDate: undefined, endDate: undefined }))
  );
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleId, setScheduleId] = useState<string | null>(null);
  const [showGoogleCalendar, setShowGoogleCalendar] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate schedule when start date or trade workdays change
  useEffect(() => {
    if (!startDate) return;

    let currentDate = parseISO(startDate);
    
    // Ensure project start date is not on a weekend or holiday
    while (isNonWorkDay(currentDate)) {
      currentDate = addDays(currentDate, 1);
    }
    
    // Filter out trades with 0 workdays before scheduling
    const activeTrades = trades.filter(trade => trade.workdays > 0);
    
    const updatedTrades = trades.map(trade => {
      // Skip trades with 0 workdays
      if (trade.workdays === 0) {
        return {
          ...trade,
          startDate: undefined,
          endDate: undefined,
        };
      }
      const tradeStartDate = new Date(currentDate);
      
      // Calculate end date by adding workdays (skipping weekends)
      let workdaysAdded = 0;
      let endDate = new Date(currentDate);
      
      while (workdaysAdded < trade.workdays) {
        if (!isNonWorkDay(endDate)) {
          workdaysAdded++;
        }
        if (workdaysAdded < trade.workdays) {
          endDate = addDays(endDate, 1);
        }
      }

      // Set next start date to the day after this trade ends
      currentDate = addDays(endDate, 1);
      
      // Skip weekends and holidays for next trade start
      while (isNonWorkDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
      }

      return {
        ...trade,
        startDate: tradeStartDate,
        endDate: endDate,
      };
    });

    setTrades(updatedTrades);
    
    // Calculate total project duration
    if (updatedTrades.length > 0) {
      const projectStart = parseISO(startDate);
      const projectEnd = updatedTrades[updatedTrades.length - 1].endDate;
      if (projectEnd) {
        const diffTime = projectEnd.getTime() - projectStart.getTime();
        setTotalDuration(Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      }
    }
  }, [startDate, trades.map(t => t.workdays).join(','), trades.map(t => t.name).join(',')]);

  // Load existing schedule
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const { data, error } = await supabase
          .from("project_schedules")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error loading schedule:", error);
          return;
        }

        if (data) {
          setScheduleId(data.id);
          setStartDate(data.project_start_date);
          
          if (data.schedule_data && Array.isArray(data.schedule_data)) {
            const scheduleData = data.schedule_data as any[];
            // Load the saved trades directly to preserve custom phase names and order
            const loadedTrades = scheduleData.map(savedTrade => ({
              name: savedTrade.name,
              workdays: savedTrade.workdays || 0,
              color: savedTrade.color || '#3b82f6',
              startDate: undefined,
              endDate: undefined,
            }));
            setTrades(loadedTrades);
          }
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
      }
    };

    loadSchedule();
  }, [projectId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setTrades((items) => {
        const oldIndex = items.findIndex((item) => item.name === active.id);
        const newIndex = items.findIndex((item) => item.name === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleWorkdaysChange = (index: number, workdays: number) => {
    setTrades(prev => prev.map((trade, i) => 
      i === index ? { ...trade, workdays: Math.max(0, workdays) } : trade
    ));
  };

  const handleTradeUpdate = (updatedTrade: ScheduledTradeTask) => {
    setTrades(prev => prev.map(trade => 
      trade.name === updatedTrade.name ? updatedTrade : trade
    ));
  };

  const handleTradesUpdate = (updatedTrades: ScheduledTradeTask[]) => {
    setTrades(updatedTrades);
  };

  const exportToICal = () => {
    if (!startDate || scheduledTrades.length === 0) return;

    // Generate iCal content
    const generateICalEvent = (trade: ScheduledTradeTask) => {
      const startDateTime = format(trade.startDate, "yyyyMMdd'T'090000");
      const endDateTime = format(trade.endDate, "yyyyMMdd'T'170000");
      const uid = `${trade.name.replace(/\s+/g, '-').toLowerCase()}-${projectId}-${format(trade.startDate, 'yyyyMMdd')}`;
      
      return [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTART:${startDateTime}`,
        `DTEND:${endDateTime}`,
        `SUMMARY:${trade.name}`,
        `DESCRIPTION:Project task: ${trade.name}\\nDuration: ${trade.workdays} workdays\\nProject ID: ${projectId}`,
        `CATEGORIES:Construction,Project Schedule`,
        `STATUS:CONFIRMED`,
        `TRANSP:OPAQUE`,
        'END:VEVENT'
      ].join('\r\n');
    };

    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Project Schedule//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      // Filter out trades with 0 workdays
      ...scheduledTrades.filter(trade => trade.workdays > 0).map(generateICalEvent),
      'END:VCALENDAR'
    ].join('\r\n');

    // Create and download the iCal file
    const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-schedule-${format(parseISO(startDate), 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Calendar Exported",
      description: "Schedule has been exported as an iCal file that can be imported into any calendar app",
    });
  };

  const exportToPDF = () => {
    if (!startDate || trades.every(t => !t.startDate)) return;

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Project Schedule</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .trade { margin: 15px 0; padding: 15px; border-left: 4px solid #ccc; }
          .trade-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .trade-dates { color: #666; font-size: 14px; }
          .trade-duration { color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Project Schedule</h1>
        <div class="summary">
          <p><strong>Project Start Date:</strong> ${format(parseISO(startDate), 'MMMM dd, yyyy')}</p>
          <p><strong>Total Duration:</strong> ${totalDuration} days</p>
          ${trades.length > 0 && trades[trades.length - 1].endDate ? 
            `<p><strong>Estimated Completion:</strong> ${format(trades[trades.length - 1].endDate!, 'MMMM dd, yyyy')}</p>` : ''
          }
        </div>
        ${trades.filter(t => t.startDate && t.workdays > 0).map(trade => `
          <div class="trade" style="border-left-color: ${trade.color}">
            <div class="trade-name">${trade.name}</div>
            <div class="trade-dates">
              Start: ${format(trade.startDate!, 'MMMM dd, yyyy (EEEE)')} | 
              End: ${format(trade.endDate!, 'MMMM dd, yyyy (EEEE)')}
            </div>
            <div class="trade-duration">Duration: ${trade.workdays} workdays</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-schedule-${format(parseISO(startDate), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Schedule Exported",
      description: "Schedule has been downloaded as an HTML file that can be printed to PDF",
    });
  };

  const saveSchedule = async () => {
    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Filter out trades with 0 workdays before saving
      const activeTrades = trades.filter(trade => trade.workdays > 0);
      
      const scheduleData = activeTrades.map(trade => ({
        name: trade.name,
        workdays: trade.workdays,
        startDate: trade.startDate ? format(trade.startDate, 'yyyy-MM-dd') : null,
        endDate: trade.endDate ? format(trade.endDate, 'yyyy-MM-dd') : null,
        color: trade.color,
      }));

      // Calculate the project completion date from the last trade
      const tradesWithEndDates = trades.filter(trade => trade.endDate);
      const lastTrade = tradesWithEndDates.length > 0 ? tradesWithEndDates[tradesWithEndDates.length - 1] : null;
      const estimatedCompletion = lastTrade?.endDate ? format(lastTrade.endDate, 'yyyy-MM-dd') : null;

      const schedulePayload = {
        project_id: projectId,
        project_start_date: startDate,
        total_duration_days: totalDuration,
        schedule_data: scheduleData,
      };

      let result;
      if (scheduleId) {
        result = await supabase
          .from("project_schedules")
          .update(schedulePayload)
          .eq("id", scheduleId);
      } else {
        result = await supabase
          .from("project_schedules")
          .insert(schedulePayload)
          .select("id")
          .single();
        
        if (result.data) {
          setScheduleId(result.data.id);
        }
      }

      if (result.error) {
        console.error("Error saving schedule:", result.error);
        toast({
          title: "Error",
          description: "Failed to save schedule",
          variant: "destructive",
        });
        return;
      }

      // Update the project table with start date and estimated completion
      if (estimatedCompletion) {
        const projectUpdateResult = await supabase
          .from("projects")
          .update({
            start_date: startDate,
            estimated_completion: estimatedCompletion
          })
          .eq("id", projectId);

        if (projectUpdateResult.error) {
          console.error("Error updating project dates:", projectUpdateResult.error);
          // Don't show error for this since schedule was saved successfully
        }
      }


      toast({
        title: "Success",
        description: "Schedule saved successfully",
      });

      // Trigger automated schedule change processing
      try {
        console.log("Calling handleScheduleChanges for project:", projectId);
        await handleScheduleChanges(projectId, "Project schedule has been updated with new phase timelines and dates");
        console.log("Schedule change automation completed successfully");
        
        // Show additional success message for activity creation
        toast({
          title: "Activity Created",
          description: "Schedule change activity has been logged for the customer portal",
        });
      } catch (automationError) {
        console.error("Schedule change automation error:", automationError);
        toast({
          title: "Note",
          description: "Schedule saved but activity notification may not have been created",
          variant: "destructive",
        });
      }

      // Auto-generate payment draw invoices when schedule is first created
      if (!scheduleId && result.data) {
        try {
          await supabaseService.generatePaymentDrawInvoices(projectId);
          toast({
            title: "Invoices Generated",
            description: "Payment draw invoices have been automatically created based on the project schedule",
          });
        } catch (invoiceError) {
          console.error("Error generating invoices:", invoiceError);
          // Don't show error for invoice generation since schedule was saved successfully
          // Just log it for debugging
        }
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const scheduledTrades = trades.filter((t): t is ScheduledTradeTask => 
    t.startDate !== undefined && t.endDate !== undefined && t.workdays > 0
  );

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Enhanced Project Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Start Date Input */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Project Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full max-w-xs"
            />
          </div>

          {/* Trade Duration Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trade Durations (Workdays)</h3>
              <p className="text-sm text-muted-foreground">Drag to reorder trades</p>
            </div>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={trades.map(t => t.name)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trades.map((trade, index) => (
                    <SortableTradeItem
                      key={trade.name}
                      trade={trade}
                      index={index}
                      onWorkdaysChange={(workdays) => handleWorkdaysChange(index, workdays)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Project Summary */}
          {startDate && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Project Summary</h3>
              <p className="text-sm text-muted-foreground">
                Duration: <span className="font-medium">
                  {Math.max(0, differenceInDays(new Date(), parseISO(startDate)))} / {totalDuration} days
                </span>
              </p>
              {trades.length > 0 && trades[trades.length - 1].endDate && (
                <p className="text-sm text-muted-foreground">
                  Estimated Completion: <span className="font-medium">
                    {format(trades[trades.length - 1].endDate!, 'MMMM dd, yyyy')}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={saveSchedule} disabled={saving || !startDate}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Schedule"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowSendDialog(true)}
              disabled={!startDate || trades.every(t => !t.startDate)}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Schedule
            </Button>
            <Button 
              variant="outline"
              onClick={() => exportToPDF()}
              disabled={!startDate || trades.every(t => !t.startDate)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button 
              variant="outline"
              onClick={() => exportToICal()}
              disabled={!startDate || scheduledTrades.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export iCal
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowGoogleCalendar(!showGoogleCalendar)}
              disabled={!startDate || trades.every(t => !t.startDate)}
            >
              <GoogleCalendarIcon className="h-4 w-4 mr-2" />
              Google Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Calendar Integration */}
      {showGoogleCalendar && scheduledTrades.length > 0 && (
        <GoogleCalendarIntegration 
          trades={scheduledTrades}
          projectId={projectId}
        />
      )}

      {/* Enhanced Calendar View */}
      {startDate && scheduledTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Interactive Schedule Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">
              Drag and drop trade blocks to reschedule them
            </p>
          </CardHeader>
          <CardContent>
            <EnhancedCalendarView 
              startDate={parseISO(startDate)}
              trades={scheduledTrades}
              onTradeUpdate={handleTradeUpdate}
              onTradesUpdate={handleTradesUpdate}
            />
          </CardContent>
        </Card>
      )}

      {/* Send Dialog */}
      <ScheduleSendDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        trades={scheduledTrades}
        projectId={projectId}
      />
    </div>
  );
}
