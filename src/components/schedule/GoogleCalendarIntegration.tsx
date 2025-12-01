import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ExternalLink, Plus, Settings } from "lucide-react";
import { ScheduledTradeTask } from "./types";

interface GoogleCalendarIntegrationProps {
  trades: ScheduledTradeTask[];
  projectId: string;
}

export function GoogleCalendarIntegration({ trades, projectId }: GoogleCalendarIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [calendarId, setCalendarId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Initialize Google Calendar API
  const initializeGoogleCalendar = async () => {
    setIsConnecting(true);
    try {
      // This would normally initialize the Google Calendar API
      // For demo purposes, we'll simulate the connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setCalendarId("primary"); // Default calendar
      
      toast({
        title: "Google Calendar Connected",
        description: "Successfully connected to your Google Calendar",
      });
    } catch (error) {
      console.error("Error connecting to Google Calendar:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Sync schedule to Google Calendar
  const syncToGoogleCalendar = async () => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Google Calendar first",
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(true);
    try {
      // This would normally sync events to Google Calendar
      // For demo purposes, we'll simulate the sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Sync Complete",
        description: `${trades.length} trade events have been synced to Google Calendar`,
      });
    } catch (error) {
      console.error("Error syncing to Google Calendar:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync schedule to Google Calendar",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Generate Google Calendar URL for manual import
  const generateCalendarUrl = () => {
    const baseUrl = "https://calendar.google.com/calendar/render";
    const events = trades.map(trade => {
      const startDate = format(trade.startDate, 'yyyyMMdd');
      const endDate = format(trade.endDate, 'yyyyMMdd');
      return `${trade.name} (${startDate}-${endDate})`;
    }).join(', ');
    
    const url = `${baseUrl}?action=TEMPLATE&text=Project Schedule&details=${encodeURIComponent(events)}`;
    window.open(url, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Google Calendar to automatically sync project schedule events.
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={initializeGoogleCalendar}
                disabled={isConnecting}
                className="flex-1"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                {isConnecting ? "Connecting..." : "Connect Google Calendar"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={generateCalendarUrl}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Google Calendar
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <p><strong>Note:</strong> This is a demo implementation. In production, you would need to:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Set up Google Calendar API credentials</li>
                <li>Implement OAuth 2.0 authentication flow</li>
                <li>Handle API rate limits and error cases</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">Connected to Google Calendar</span>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calendar-id">Calendar ID</Label>
              <Input
                id="calendar-id"
                value={calendarId}
                onChange={(e) => setCalendarId(e.target.value)}
                placeholder="primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={syncToGoogleCalendar}
                disabled={isSyncing}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isSyncing ? "Syncing..." : "Sync Schedule"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={generateCalendarUrl}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            </div>

            {/* Event Preview */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Events to Sync ({trades.length})</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {trades.map((trade, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded" 
                        style={{ backgroundColor: trade.color }}
                      />
                      <span className="font-medium">{trade.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {format(trade.startDate, 'MMM d')} - {format(trade.endDate, 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}