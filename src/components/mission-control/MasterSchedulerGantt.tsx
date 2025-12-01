import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, ArrowRight, Move, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  pm_name?: string;
  start_target: string;
  finish_target: string;
}

interface Phase {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  planned_start: string | null;
  planned_finish: string | null;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Done';
  dependency_phase_id: string | null;
  project_code?: string;
  project_name?: string;
}

interface Props {
  projects: Project[];
  phases: Phase[];
  onProjectSelect: (project: Project) => void;
  onRefresh: () => void;
}

export function MasterSchedulerGantt({ projects, phases, onProjectSelect, onRefresh }: Props) {
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [bulkShiftDialog, setBulkShiftDialog] = useState(false);
  const [shiftDays, setShiftDays] = useState('');
  const [cascadeDependents, setCascadeDependents] = useState(false);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const allDates = [
      ...projects.map(p => p.start_target),
      ...projects.map(p => p.finish_target),
      ...phases.filter(p => p.planned_start).map(p => p.planned_start!),
      ...phases.filter(p => p.planned_finish).map(p => p.planned_finish!)
    ].filter(Boolean);

    if (allDates.length === 0) {
      const today = new Date();
      return {
        start: today,
        end: addDays(today, 365),
        totalDays: 365
      };
    }

    const startDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())));
    const endDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())));
    
    return {
      start: addDays(startDate, -30), // Add buffer
      end: addDays(endDate, 30),
      totalDays: differenceInDays(addDays(endDate, 30), addDays(startDate, -30))
    };
  }, [projects, phases]);

  const getPhasePosition = (phase: Phase) => {
    if (!phase.planned_start || !phase.planned_finish) return null;

    const startDate = parseISO(phase.planned_start);
    const endDate = parseISO(phase.planned_finish);
    
    const startOffset = differenceInDays(startDate, timelineBounds.start);
    const duration = differenceInDays(endDate, startDate) + 1;
    
    return {
      left: `${(startOffset / timelineBounds.totalDays) * 100}%`,
      width: `${(duration / timelineBounds.totalDays) * 100}%`
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handlePhaseClick = (phase: Phase) => {
    setSelectedPhases(prev => 
      prev.includes(phase.id) 
        ? prev.filter(id => id !== phase.id)
        : [...prev, phase.id]
    );
  };

  const handleBulkShift = async () => {
    if (!shiftDays || selectedPhases.length === 0) return;

    const daysToShift = parseInt(shiftDays);
    if (isNaN(daysToShift)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of days",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const phaseId of selectedPhases) {
        const phase = phases.find(p => p.id === phaseId);
        if (!phase || !phase.planned_start || !phase.planned_finish) continue;

        const newStart = addDays(parseISO(phase.planned_start), daysToShift);
        const newEnd = addDays(parseISO(phase.planned_finish), daysToShift);

        const { error } = await supabase
          .from('phases_new')
          .update({
            planned_start: format(newStart, 'yyyy-MM-dd'),
            planned_finish: format(newEnd, 'yyyy-MM-dd')
          })
          .eq('id', phaseId);

        if (error) throw error;

        // Log audit entry
        await supabase
          .from('audit_logs')
          .insert({
            entity_type: 'phase',
            entity_id: phaseId,
            action: 'bulk_shift',
            details: {
              days_shifted: daysToShift,
              cascade_dependents: cascadeDependents,
              old_start: phase.planned_start,
              old_finish: phase.planned_finish,
              new_start: format(newStart, 'yyyy-MM-dd'),
              new_finish: format(newEnd, 'yyyy-MM-dd')
            }
          });
      }

      toast({
        title: "Success",
        description: `Shifted ${selectedPhases.length} phases by ${daysToShift} days`
      });

      setSelectedPhases([]);
      setBulkShiftDialog(false);
      setShiftDays('');
      onRefresh();

    } catch (error) {
      console.error('Failed to shift phases:', error);
      toast({
        title: "Error",
        description: "Failed to shift phases",
        variant: "destructive"
      });
    }
  };

  // Generate timeline header (months)
  const timelineHeader = useMemo(() => {
    const months = [];
    let currentDate = new Date(timelineBounds.start);
    
    while (currentDate <= timelineBounds.end) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const startOffset = differenceInDays(monthStart, timelineBounds.start);
      const monthDays = differenceInDays(monthEnd, monthStart) + 1;
      
      months.push({
        name: format(monthStart, 'MMM yyyy'),
        left: `${Math.max(0, (startOffset / timelineBounds.totalDays) * 100)}%`,
        width: `${(monthDays / timelineBounds.totalDays) * 100}%`
      });
      
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return months;
  }, [timelineBounds]);

  const projectsWithPhases = projects.map(project => ({
    ...project,
    phases: phases.filter(p => p.project_id === project.id).sort((a, b) => a.sort_order - b.sort_order)
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Master Gantt — All Active & Lead Projects
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedPhases.length > 0 && (
              <>
                <Badge variant="secondary">
                  {selectedPhases.length} selected
                </Badge>
                <Dialog open={bulkShiftDialog} onOpenChange={setBulkShiftDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Move className="h-4 w-4 mr-2" />
                      Bulk Shift
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Shift Phases</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="shiftDays">Days to shift (use negative for earlier)</Label>
                        <Input
                          id="shiftDays"
                          type="number"
                          value={shiftDays}
                          onChange={(e) => setShiftDays(e.target.value)}
                          placeholder="e.g., 7 or -14"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="cascade"
                          checked={cascadeDependents}
                          onChange={(e) => setCascadeDependents(e.target.checked)}
                        />
                        <Label htmlFor="cascade">Cascade dependent phases</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setBulkShiftDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleBulkShift}>
                          Shift {selectedPhases.length} phases
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedPhases([])}
                >
                  Clear Selection
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Timeline Header */}
          <div className="flex border-b pb-2 mb-4">
            <div className="w-64 text-sm font-medium">Project</div>
            <div className="flex-1 relative">
              <div className="flex">
                {timelineHeader.map((month, index) => (
                  <div 
                    key={index}
                    className="text-xs text-center border-l px-1 overflow-hidden"
                    style={{ 
                      marginLeft: month.left,
                      width: month.width,
                      minWidth: '60px'
                    }}
                  >
                    {month.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Project Rows */}
          <div className="space-y-1">
            {projectsWithPhases.map(project => (
              <div key={project.id} className="space-y-1">
                {/* Project Header */}
                <div 
                  className="flex items-center cursor-pointer hover:bg-accent/50 p-2 rounded"
                  onClick={() => onProjectSelect(project)}
                >
                  <div className="w-64">
                    <div className="font-medium text-sm">{project.code}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {project.name} • {project.pm_name}
                    </div>
                  </div>
                  <div className="flex-1 relative h-6">
                    {/* Project timeline bar */}
                    <div 
                      className="absolute top-1 h-4 bg-gray-200 rounded-sm border"
                      style={{
                        left: `${(differenceInDays(parseISO(project.start_target), timelineBounds.start) / timelineBounds.totalDays) * 100}%`,
                        width: `${(differenceInDays(parseISO(project.finish_target), parseISO(project.start_target)) / timelineBounds.totalDays) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Phase Rows */}
                {project.phases.map(phase => {
                  const position = getPhasePosition(phase);
                  const isSelected = selectedPhases.includes(phase.id);
                  
                  return (
                    <div key={phase.id} className="flex items-center ml-4">
                      <div className="w-60 flex items-center gap-2">
                        <div className="text-xs text-muted-foreground truncate">
                          {phase.name}
                        </div>
                        {phase.status === 'Blocked' && (
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(phase.status)} text-white border-none`}
                        >
                          {phase.status.slice(0, 1)}
                        </Badge>
                      </div>
                      <div className="flex-1 relative h-6">
                        {position && (
                          <div 
                            className={`absolute top-1 h-4 rounded-sm cursor-pointer transition-all ${
                              isSelected 
                                ? 'ring-2 ring-blue-500 scale-105' 
                                : 'hover:scale-105'
                            } ${getStatusColor(phase.status)}`}
                            style={position}
                            onClick={() => handlePhaseClick(phase)}
                            title={`${phase.name} (${phase.planned_start} to ${phase.planned_finish})`}
                          >
                            {phase.dependency_phase_id && (
                              <ArrowRight className="h-3 w-3 text-white absolute -left-4 top-0.5" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {projectsWithPhases.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No active or lead projects found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}