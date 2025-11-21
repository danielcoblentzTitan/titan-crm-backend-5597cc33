import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail, 
  FileText,
  AlertTriangle,
  Plus
} from "lucide-react";
import { LeadAutomationService, LeadFollowUpTask } from "@/services/leadAutomationService";
import { Lead, TeamMember } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FollowUpTaskManagerProps {
  leads: Lead[];
  teamMembers: TeamMember[];
}

export const FollowUpTaskManager = ({ leads, teamMembers }: FollowUpTaskManagerProps) => {
  const [todayTasks, setTodayTasks] = useState<LeadFollowUpTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<LeadFollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    lead_id: '',
    task_type: 'email',
    due_date: '',
    assigned_to: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const [today, overdue] = await Promise.all([
        LeadAutomationService.getTodayTasks(),
        LeadAutomationService.getOverdueTasks()
      ]);
      setTodayTasks(today);
      setOverdueTasks(overdue);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load follow-up tasks",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, notes?: string) => {
    try {
      await LeadAutomationService.completeTask(taskId, notes);
      await loadTasks(); // Reload tasks
      toast({
        title: "Success",
        description: "Task completed successfully"
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.lead_id || !newTask.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await LeadAutomationService.createTask({
        lead_id: newTask.lead_id,
        task_type: newTask.task_type,
        due_date: newTask.due_date,
        assigned_to: newTask.assigned_to || undefined,
        notes: newTask.notes || undefined,
        is_automated: false
      });
      
      setIsCreateDialogOpen(false);
      setNewTask({
        lead_id: '',
        task_type: 'email',
        due_date: '',
        assigned_to: '',
        notes: ''
      });
      await loadTasks();
      
      toast({
        title: "Success",
        description: "Follow-up task created successfully"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
  };

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case 'call': return Phone;
      case 'email': return Mail;
      case 'quote_follow_up': return FileText;
      default: return Clock;
    }
  };

  const getLeadName = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown Lead';
  };

  const getTeamMemberName = (memberId?: string) => {
    if (!memberId) return 'Unassigned';
    const member = teamMembers.find(m => m.id === memberId);
    return member?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-1/3"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Follow-up Tasks</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Follow-up Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Lead</label>
                <Select value={newTask.lead_id} onValueChange={(value) => setNewTask({...newTask, lead_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.first_name} {lead.last_name} - {lead.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Task Type</label>
                <Select value={newTask.task_type} onValueChange={(value) => setNewTask({...newTask, task_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="quote_follow_up">Quote Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Assign To</label>
                <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({...newTask, assigned_to: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                  placeholder="Add any notes for this task..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">Tasks past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">92%</div>
            <p className="text-xs text-muted-foreground">This week's completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Overdue Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => {
                const Icon = getTaskIcon(task.task_type);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleCompleteTask(task.id);
                          }
                        }}
                      />
                      <Icon className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">{getLeadName(task.lead_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.task_type.replace('_', ' ')} • Due: {task.due_date} • {getTeamMemberName(task.assigned_to)}
                        </p>
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="destructive">Overdue</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Due Today ({todayTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Great job! No tasks due today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => {
                const Icon = getTaskIcon(task.task_type);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleCompleteTask(task.id);
                          }
                        }}
                      />
                      <Icon className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{getLeadName(task.lead_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.task_type.replace('_', ' ')} • {getTeamMemberName(task.assigned_to)}
                        </p>
                        {task.notes && (
                          <p className="text-sm text-gray-600 mt-1">{task.notes}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">Due Today</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};