import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';

interface Project {
  id: string;
  code: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onScheduleShifted: () => void;
}

export function ShiftScheduleDialog({ open, onOpenChange, projects, onScheduleShifted }: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [shiftDays, setShiftDays] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleShiftSchedule = async () => {
    if (!selectedProjectId || shiftDays === 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a project and enter shift days (non-zero)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Get all phases for the selected project
      const { data: phases, error: phasesError } = await supabase
        .from('project_phases')
        .select('id, start_date, end_date, duration_days')
        .eq('project_id', selectedProjectId);

      if (phasesError) throw phasesError;

      if (!phases || phases.length === 0) {
        toast({
          title: "No Phases Found",
          description: "This project has no phases to shift",
          variant: "destructive"
        });
        return;
      }

      // Calculate new dates for all phases
      const updatedPhases = phases.map(phase => {
        const newStartDate = addDays(new Date(phase.start_date), shiftDays);
        const newEndDate = addDays(new Date(phase.end_date), shiftDays);
        
        return {
          id: phase.id,
          start_date: format(newStartDate, 'yyyy-MM-dd'),
          end_date: format(newEndDate, 'yyyy-MM-dd')
        };
      });

      // Update all phases in batch
      for (const updatedPhase of updatedPhases) {
        const { error: updateError } = await supabase
          .from('project_phases')
          .update({
            start_date: updatedPhase.start_date,
            end_date: updatedPhase.end_date
          })
          .eq('id', updatedPhase.id);

        if (updateError) throw updateError;
      }

      // Invoke sync function to update project_schedules
      const { error: syncError } = await supabase.functions.invoke('sync-project-schedule', {
        body: { projectId: selectedProjectId }
      });

      if (syncError) {
        console.error('Sync function error:', syncError);
        // Don't throw - the phase updates succeeded, sync is secondary
      }

      const selectedProject = projects.find(p => p.id === selectedProjectId);
      toast({
        title: "Schedule Shifted",
        description: `${selectedProject?.code} schedule shifted by ${shiftDays > 0 ? '+' : ''}${shiftDays} days`,
      });

      onScheduleShifted();
      onOpenChange(false);
      setSelectedProjectId('');
      setShiftDays(0);

    } catch (error) {
      console.error('Failed to shift schedule:', error);
      toast({
        title: "Error",
        description: "Failed to shift project schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Shift Project Schedule
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label>Select Project</Label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project to shift..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.code} - {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Days Input */}
          <div className="space-y-2">
            <Label>Shift Days</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={shiftDays || ''}
                onChange={(e) => setShiftDays(parseInt(e.target.value) || 0)}
                placeholder="Enter days (+ or -)"
                className="flex-1"
              />
              <Badge variant={shiftDays > 0 ? "default" : shiftDays < 0 ? "destructive" : "outline"}>
                {shiftDays > 0 ? `+${shiftDays}` : shiftDays < 0 ? shiftDays : '0'} days
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Positive numbers push schedule forward, negative numbers pull it back
            </div>
          </div>

          {/* Preview */}
          {selectedProject && shiftDays !== 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                Preview Changes
              </div>
              <div className="text-sm text-muted-foreground">
                All phases in <span className="font-medium">{selectedProject.code}</span> will be shifted by{' '}
                <span className={`font-medium ${shiftDays > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {shiftDays > 0 ? '+' : ''}{shiftDays} day{Math.abs(shiftDays) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleShiftSchedule} 
            disabled={loading || !selectedProjectId || shiftDays === 0}
          >
            {loading ? 'Shifting...' : 'Shift Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}