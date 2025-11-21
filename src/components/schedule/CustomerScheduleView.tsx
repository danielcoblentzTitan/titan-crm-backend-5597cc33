import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarIcon, Clock, MapPin, Calendar, List } from "lucide-react";
import { EnhancedCalendarView } from "./EnhancedCalendarView";
import { ScheduledTradeTask } from "./types";
import { syncProjectSchedule } from "@/services/scheduleSyncService";

// Phase descriptions for customer understanding
const getPhaseDescription = (phaseName: string): string => {
  const descriptions: { [key: string]: string } = {
    "Preconstruction": "Preparation phase between permit approval and construction start. During this time, materials are being ordered, crews are being scheduled, and final preparations are made. You'll see lumber and other materials arriving on site, staging areas being set up, and crews finalizing their schedules.",
    "Framing Crew": "Building the main structural framework of your barndominium using wood framing. You'll see the wooden skeleton of your building take shape - walls, roof structure, and main support beams will be erected. This is when your building really starts to look like a structure!",
    "Dried-In": "Completing the building envelope to make it weather-tight with roofing, windows, and exterior doors installed. You'll see your building protected from the elements with a complete roof, windows in place, and exterior doors installed. The structure is now secure from weather.",
    "Plumbing Underground": "Installing underground plumbing lines and connections before concrete is poured. You'll see trenches dug for water supply and sewer lines, with pipes being laid and connected. Most of this work happens below ground level and will be covered by concrete.",
    "Concrete Crew": "Pouring and finishing the concrete foundation and floor slab for your building. You'll see forms being set up, concrete trucks arriving, and the foundation taking shape. After this phase, you'll have a solid, level floor to walk on throughout your building. ⏱️ Note: If interior framing is part of your project, there will be a curing period to allow the concrete to properly set and gain strength before proceeding with interior framing work.",
    "Interior Framing": "Constructing interior walls and room divisions using wood framing inside the building. You'll see the interior layout come to life as wooden room divisions are built. You can now walk through and visualize each room's size and the flow between spaces.",
    "Plumbing Rough In": "Installing water supply lines, drain pipes, and plumbing fixtures throughout the interior. You'll see pipes running through walls and floors, with stub-outs for future fixtures. The basic plumbing infrastructure will be visible but not yet connected to working fixtures.",
    "HVAC Rough In": "Installing heating, ventilation, and air conditioning ductwork and equipment placement. You'll see large metal ducts being installed in walls and ceilings, along with the main HVAC units being positioned. The climate control skeleton of your home is taking shape.",
    "Electric Rough In": "Running electrical wiring, installing outlet boxes, and setting up the electrical panel. You'll see wires running through the framing, outlet and switch boxes mounted in walls, and the main electrical panel being installed. No switches or outlets are functional yet.",
    "Insulation": "Adding insulation to walls and ceilings to improve energy efficiency and comfort. You'll see fluffy insulation material filling the spaces between wall studs and ceiling joists. The building will start to feel more enclosed and temperature-controlled.",
    "Drywall": "Hanging, taping, and finishing drywall to create smooth interior wall and ceiling surfaces. You'll see the transformation from exposed framing to smooth, white walls. This is a dramatic change - your rooms will suddenly look like actual interior spaces!",
    "Paint": "Applying primer and paint to all interior surfaces for protection and aesthetic appeal. You'll see your color choices come to life as walls transform from white drywall to your selected colors. The interior will start to feel like a real home with personality.",
    "Flooring": "Installing your chosen flooring materials throughout the living and work spaces. You'll see the final floor surfaces being installed - whether it's hardwood, tile, concrete staining, or other materials. Walking through will feel completely different with finished floors.",
    "Doors and Trim": "Installing interior and exterior doors, windows, and decorative trim work. You'll see doors being hung, windows installed, and trim work around openings. Rooms become truly separate spaces, and the craftsmanship details start to show.",
    "Garage Doors and Gutters": "Installing garage doors and exterior gutter systems for water management. You'll see the large garage doors being installed and tested, plus gutters and downspouts being mounted around the roofline. The exterior is becoming complete.",
    "Garage Finish": "Completing garage area with final touches, storage solutions, and finishing work. You'll see the garage transformed from a concrete shell to a functional space with proper finishes, lighting, and any custom storage solutions you've planned.",
    "Plumbing Final": "Installing final plumbing fixtures, faucets, toilets, and testing all water systems. You'll see working sinks, toilets, showers, and faucets being installed. You can now turn on water and see your plumbing system come to life!",
    "HVAC Final": "Completing HVAC installation, testing systems, and ensuring proper climate control. You'll see vents being installed, thermostats mounted, and the system being tested. You'll be able to adjust temperature and feel conditioned air throughout the building.",
    "Electric Final": "Installing light fixtures, switches, outlets, and testing all electrical systems. You'll see lights being installed and working, outlets becoming functional, and switches controlling various fixtures. The electrical system becomes fully operational.",
    "Kitchen Install": "Installing kitchen cabinets, countertops, appliances, and plumbing fixtures. You'll see your kitchen transform dramatically as cabinets go in, countertops are installed, and appliances are connected. This is often the most exciting visual transformation!",
    "Interior Finishes": "Adding final interior touches like hardware, light fixtures, and decorative elements. You'll see cabinet hardware installed, final light fixtures mounted, and decorative elements added. The space starts to feel truly finished and move-in ready.",
    "Final": "Final inspections, punch list completion, and preparing your barndominium for move-in. You'll see any remaining touch-ups being completed, final cleaning, and systems being tested one last time. Your dream barndominium is ready for you to call home!"
  };
  
  return descriptions[phaseName] || "Work being completed for this phase of construction with visible progress being made.";
};

interface CustomerScheduleViewProps {
  projectId: string;
}

export function CustomerScheduleView({ projectId }: CustomerScheduleViewProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [trades, setTrades] = useState<ScheduledTradeTask[]>([]);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Load schedule and set up real-time updates
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setLoading(true);
        
        // Load latest schedule snapshot for this project
        // If none exists yet, attempt to generate from published phases
        try {
          const { data: existingSchedule } = await supabase
            .from("project_schedules")
            .select("id")
            .eq("project_id", projectId)
            .limit(1)
            .maybeSingle();

          if (!existingSchedule) {
            try {
              await syncProjectSchedule(projectId);
              console.log('Schedule snapshot created for project:', projectId);
            } catch (syncError) {
              console.warn('Schedule sync failed:', syncError);
            }
          }
        } catch (checkError) {
          console.warn('Schedule check failed:', checkError);
        }
        
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
          setStartDate(data.project_start_date);
          setTotalDuration(data.total_duration_days || 0);
          
          
          if (data.schedule_data && Array.isArray(data.schedule_data)) {
            const scheduleData = data.schedule_data as any[];
            
            // Check if dates have been calculated
            const hasCalculatedDates = scheduleData.some(trade => trade.startDate && trade.endDate);
            
            if (hasCalculatedDates) {
              const loadedTrades = scheduleData
                .filter(trade => trade.startDate && trade.endDate && (trade.workdays || 0) > 0)
                .map(trade => ({
                  name: trade.name,
                  workdays: trade.workdays,
                  startDate: parseISO(trade.startDate),
                  endDate: parseISO(trade.endDate),
                  color: trade.color,
                }));
              setTrades(loadedTrades);
            } else {
              // Schedule exists but dates not calculated - show placeholder
              setTrades([]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();

    // Set up real-time subscription for schedule updates
    const channel = supabase
      .channel('schedule-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_schedules',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Schedule updated:', payload);
          loadSchedule(); // Reload the schedule when it changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!startDate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Schedule Available</h3>
          <p className="text-muted-foreground">
            Your project schedule will appear here once it's been created by your project manager.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Schedule In Progress</h3>
          <p className="text-muted-foreground">
            Your project manager is currently building your schedule. The detailed timeline will appear here once completed.
          </p>
          {startDate && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">Planned Start Date</p>
              <p className="text-lg font-semibold">{format(parseISO(startDate), 'MMMM dd, yyyy')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="calendar" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
              <TabsTrigger 
                value="phases"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                <List className="h-4 w-4 mr-2" />
                Construction Phases
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="p-6 mt-0">
              <div className="space-y-4">
                <EnhancedCalendarView
                  startDate={parseISO(startDate)}
                  trades={trades}
                  onTradeUpdate={() => {}} // No-op for read-only mode
                  onTradesUpdate={() => {}} // No-op for read-only mode
                  readOnly={true}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="phases" className="p-6 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Construction Phases</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Detailed breakdown of each construction phase and timeline
                  </p>
                </div>
                <div className="space-y-4">
                  {trades.map((trade, index) => (
                    <div 
                      key={trade.name}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" 
                          style={{ backgroundColor: trade.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-base">{trade.name}</p>
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                              Phase {index + 1}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(trade.startDate, 'MMMM dd')} - {format(trade.endDate, 'MMMM dd, yyyy')} ({trade.workdays} days)
                          </p>
                        </div>
                      </div>
                      <div className="pl-7">
                        <p className="text-sm text-foreground leading-relaxed">
                          {getPhaseDescription(trade.name)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}