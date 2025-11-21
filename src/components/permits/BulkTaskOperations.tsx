import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Calendar, CheckCircle, Settings, User, Users } from "lucide-react";
import { usePermitTasks, useUpdatePermitTask } from "@/integrations/supabase/hooks/usePermits";
import { toast } from "@/hooks/use-toast";

interface BulkTaskOperationsProps {
  applicationId: string;
}

const BulkTaskOperations = ({ applicationId }: BulkTaskOperationsProps) => {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: tasks = [] } = usePermitTasks(applicationId);
  const updateTask = useUpdatePermitTask();

  const teamMembers = ["Admin", "PM", "Estimator", "Purchasing"];

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks(prev => [...prev, taskId]);
    } else {
      setSelectedTasks(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === tasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(tasks.map(task => task.id));
    }
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedTasks.length === 0) {
      toast({
        title: "Error",
        description: "Please select tasks and an action",
        variant: "destructive"
      });
      return;
    }

    try {
      const updates = [];
      
      for (const taskId of selectedTasks) {
        let updateData: any = { id: taskId };
        
        switch (bulkAction) {
          case "complete":
            updateData.status = "Completed";
            updateData.completion_date = new Date().toISOString().split('T')[0];
            break;
          case "in_progress":
            updateData.status = "In Progress";
            break;
          case "pending":
            updateData.status = "Pending";
            break;
          case "assign":
            if (!bulkAssignee) {
              toast({
                title: "Error",
                description: "Please select an assignee",
                variant: "destructive"
              });
              return;
            }
            updateData.assigned_to = bulkAssignee;
            break;
        }
        
        updates.push(updateTask.mutateAsync(updateData));
      }

      await Promise.all(updates);

      toast({
        title: "Success",
        description: `Updated ${selectedTasks.length} tasks successfully`
      });

      setSelectedTasks([]);
      setBulkAction("");
      setBulkAssignee("");
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Task Operations</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Tasks</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedTasks.length === tasks.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <CardDescription>
                {selectedTasks.length} of {tasks.length} tasks selected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-2 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.task_name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {task.status || "Pending"}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.assigned_to || "Unassigned"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="complete">Mark as Completed</SelectItem>
                    <SelectItem value="in_progress">Mark as In Progress</SelectItem>
                    <SelectItem value="pending">Mark as Pending</SelectItem>
                    <SelectItem value="assign">Assign to Team Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkAction === "assign" && (
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign to</Label>
                  <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={executeBulkAction}
                  disabled={!bulkAction || selectedTasks.length === 0 || updateTask.isPending}
                >
                  {updateTask.isPending ? "Updating..." : `Update ${selectedTasks.length} Tasks`}
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTaskOperations;