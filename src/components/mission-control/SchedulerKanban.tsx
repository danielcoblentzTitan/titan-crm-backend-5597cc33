import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Calendar, MapPin, User, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
  phases: Phase[];
  onRefresh: () => void;
}

const statusColumns = [
  { key: 'Not Started', label: 'Not Started', color: 'bg-gray-100 border-gray-200' },
  { key: 'In Progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
  { key: 'Blocked', label: 'Blocked', color: 'bg-red-50 border-red-200' },
  { key: 'Done', label: 'Done', color: 'bg-green-50 border-green-200' }
] as const;

export function SchedulerKanban({ phases, onRefresh }: Props) {
  const [draggedPhase, setDraggedPhase] = useState<Phase | null>(null);
  const [statusChangeDialog, setStatusChangeDialog] = useState<Phase | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  const handleDragStart = (e: React.DragEvent, phase: Phase) => {
    setDraggedPhase(phase);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    
    if (!draggedPhase || draggedPhase.status === targetStatus) {
      setDraggedPhase(null);
      return;
    }

    // Show confirmation dialog for status change
    setNewStatus(targetStatus);
    setStatusChangeDialog(draggedPhase);
    setDraggedPhase(null);
  };

  const confirmStatusChange = async () => {
    if (!statusChangeDialog || !newStatus) return;

    try {
      const { error } = await supabase
        .from('phases_new')
        .update({ status: newStatus })
        .eq('id', statusChangeDialog.id);

      if (error) throw error;

      // Log audit entry
      await supabase
        .from('audit_logs')
        .insert({
          entity_type: 'phase',
          entity_id: statusChangeDialog.id,
          action: 'status_change',
          details: {
            old_status: statusChangeDialog.status,
            new_status: newStatus,
            project_code: statusChangeDialog.project_code,
            phase_name: statusChangeDialog.name
          }
        });

      toast({
        title: "Status Updated",
        description: `${statusChangeDialog.project_code} - ${statusChangeDialog.name} moved to ${newStatus}`
      });

      setStatusChangeDialog(null);
      setNewStatus('');
      onRefresh();

    } catch (error) {
      console.error('Failed to update phase status:', error);
      toast({
        title: "Error",
        description: "Failed to update phase status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-500';
      case 'In Progress': return 'bg-blue-500';
      case 'Blocked': return 'bg-red-500';
      case 'Not Started': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const PhaseCard = ({ phase }: { phase: Phase }) => (
    <Card 
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={(e) => handleDragStart(e, phase)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium text-sm">{phase.project_code}</div>
              <div className="text-xs text-muted-foreground">{phase.project_name}</div>
            </div>
            {phase.status === 'Blocked' && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
          
          <div className="text-sm font-medium">{phase.name}</div>
          
          {phase.planned_start && phase.planned_finish && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(phase.planned_start), 'MMM d')} - {format(new Date(phase.planned_finish), 'MMM d')}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={`text-xs ${getStatusBadgeColor(phase.status)} text-white border-none`}
            >
              {phase.status}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Order: {phase.sort_order}
            </div>
          </div>
          
          {phase.dependency_phase_id && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <ArrowRight className="h-3 w-3" />
              Has dependency
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Phase Kanban Board</h3>
        <div className="text-sm text-muted-foreground">
          Drag phases between columns to update status
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statusColumns.map(column => {
          const columnPhases = phases.filter(p => p.status === column.key);
          
          return (
            <div key={column.key} className="space-y-3">
              <div className={`rounded-lg border-2 ${column.color} p-4 h-full min-h-96`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">{column.label}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {columnPhases.length}
                  </Badge>
                </div>
                
                <div 
                  className="space-y-2 min-h-80"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.key)}
                >
                  {columnPhases.map(phase => (
                    <PhaseCard key={phase.id} phase={phase} />
                  ))}
                  
                  {columnPhases.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No phases in this status
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={!!statusChangeDialog} onOpenChange={() => setStatusChangeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
          </DialogHeader>
          {statusChangeDialog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div><strong>Project:</strong> {statusChangeDialog.project_code}</div>
                <div><strong>Phase:</strong> {statusChangeDialog.name}</div>
                <div><strong>Current Status:</strong> {statusChangeDialog.status}</div>
                <div><strong>New Status:</strong> {newStatus}</div>
              </div>
              
              {newStatus === 'Done' && statusChangeDialog.status !== 'In Progress' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 inline mr-2" />
                  Moving directly to "Done" without being "In Progress". This will record completion.
                </div>
              )}
              
              {newStatus === 'Blocked' && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600 inline mr-2" />
                  This phase will be marked as blocked and require attention.
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStatusChangeDialog(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmStatusChange}>
                  Confirm Change
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}