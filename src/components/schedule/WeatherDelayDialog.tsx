import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CloudRain } from "lucide-react";

interface WeatherDelayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  onDelayApplied: () => void;
}

export function WeatherDelayDialog({
  open,
  onOpenChange,
  selectedDate,
  onDelayApplied,
}: WeatherDelayDialogProps) {
  const [reason, setReason] = useState("");
  const [delayDays, setDelayDays] = useState(1);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyDelay = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for the delay");
      return;
    }

    setIsApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke('apply-weather-delay', {
        body: {
          exceptionDate: selectedDate.toISOString().split('T')[0],
          reason: reason.trim(),
          delayDays,
        },
      });

      if (error) throw error;

      toast.success(
        `Weather delay applied successfully! ${data.projectsAffected} project(s) affected.`
      );
      
      onDelayApplied();
      onOpenChange(false);
      setReason("");
      setDelayDays(1);
    } catch (error) {
      console.error('Error applying weather delay:', error);
      toast.error("Failed to apply weather delay");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5" />
            Apply Weather Delay
          </DialogTitle>
          <DialogDescription>
            Apply a weather delay for {selectedDate.toLocaleDateString()} that will 
            affect all active project schedules.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Delay</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Heavy rain prevented outdoor work"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delay-days">Delay Duration (Days)</Label>
            <Input
              id="delay-days"
              type="number"
              min={1}
              max={30}
              value={delayDays}
              onChange={(e) => setDelayDays(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyDelay}
            disabled={isApplying || !reason.trim()}
          >
            {isApplying ? "Applying..." : "Apply Delay"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}