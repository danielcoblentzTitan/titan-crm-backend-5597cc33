import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2 } from "lucide-react";
import { ScheduledTradeTask } from "./types";

interface ScheduleSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trades: ScheduledTradeTask[];
  projectId: string;
}

export function ScheduleSendDialog({ open, onOpenChange, trades, projectId }: ScheduleSendDialogProps) {
  const [emailTo, setEmailTo] = useState("");
  const [subject, setSubject] = useState("Project Schedule Update");
  const [notes, setNotes] = useState("");
  const [sendType, setSendType] = useState<"full" | "filtered">("full");
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleTradeSelection = (tradeName: string, checked: boolean) => {
    setSelectedTrades(prev => 
      checked 
        ? [...prev, tradeName]
        : prev.filter(name => name !== tradeName)
    );
  };

  const getFilteredTrades = () => {
    return sendType === "full" ? trades : trades.filter(trade => selectedTrades.includes(trade.name));
  };

  const formatScheduleText = (tradesToInclude: ScheduledTradeTask[]) => {
    let scheduleText = "PROJECT SCHEDULE\n\n";
    
    tradesToInclude.forEach(trade => {
      scheduleText += `${trade.name}\n`;
      scheduleText += `  Start: ${format(trade.startDate, 'MMMM dd, yyyy (EEEE)')}\n`;
      scheduleText += `  End: ${format(trade.endDate, 'MMMM dd, yyyy (EEEE)')}\n`;
      scheduleText += `  Duration: ${trade.workdays} workdays\n\n`;
    });

    if (notes) {
      scheduleText += `\nNOTES:\n${notes}`;
    }

    return scheduleText;
  };

  const sendSchedule = async () => {
    if (!emailTo) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const tradesToSend = getFilteredTrades();
    if (tradesToSend.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one trade to send",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const scheduleContent = formatScheduleText(tradesToSend);
      
      console.log("Attempting to send schedule email...", {
        to: emailTo,
        subject: subject,
        scheduleContent: scheduleContent.substring(0, 100) + "...",
        projectId: projectId,
      });
      
      // Call the edge function to send the email
      const { data, error } = await supabase.functions.invoke('send-schedule-email', {
        body: {
          to: emailTo,
          subject: subject,
          scheduleContent: scheduleContent,
          projectId: projectId,
        },
      });

      console.log("Function response:", { data, error });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      // Log the activity
      const { error: activityError } = await supabase
        .from("activities")
        .insert({
          project_id: projectId,
          type: "note",
          title: "Schedule Sent",
          description: `Schedule sent to ${emailTo}. Subject: ${subject}`,
          status: "completed",
          time: new Date().toISOString(),
        });

      if (activityError) {
        console.error("Error logging activity:", activityError);
      }

      toast({
        title: "Schedule Sent",
        description: `Schedule has been sent to ${emailTo}`,
      });

      // Reset form and close dialog
      setEmailTo("");
      setSubject("Project Schedule Update");
      setNotes("");
      setSendType("full");
      setSelectedTrades([]);
      onOpenChange(false);

    } catch (error) {
      console.error("Error sending schedule:", error);
      toast({
        title: "Error",
        description: "Failed to send schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Project Schedule</DialogTitle>
          <DialogDescription>
            Send the project schedule via email with optional filtering by trade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Email To */}
          <div className="space-y-2">
            <Label htmlFor="email-to">Send To (Email)</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="recipient@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
            />
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Project Schedule Update"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Send Type */}
          <div className="space-y-2">
            <Label>Schedule Type</Label>
            <Select value={sendType} onValueChange={(value: "full" | "filtered") => setSendType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Schedule (All Trades)</SelectItem>
                <SelectItem value="filtered">Filtered by Trade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trade Selection (if filtered) */}
          {sendType === "filtered" && (
            <div className="space-y-2">
              <Label>Select Trades to Include</Label>
               <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border rounded p-2">
                 {trades.map(trade => (
                   <div key={trade.name} className="flex items-center space-x-1.5">
                     <Checkbox
                       id={`trade-${trade.name}`}
                       checked={selectedTrades.includes(trade.name)}
                       onCheckedChange={(checked) => 
                         handleTradeSelection(trade.name, checked === true)
                       }
                       className="h-3 w-3"
                     />
                     <Label 
                       htmlFor={`trade-${trade.name}`}
                       className="text-xs flex items-center gap-1.5 cursor-pointer leading-tight"
                     >
                       <div 
                         className="w-2 h-2 rounded" 
                         style={{ backgroundColor: trade.color }}
                       />
                       {trade.name}
                     </Label>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted p-3 rounded text-sm max-h-40 overflow-y-auto whitespace-pre-line">
              {formatScheduleText(getFilteredTrades())}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={sendSchedule} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}