import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lead, TeamMember } from "@/services/supabaseService";
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Mail, 
  Phone, 
  Calendar, 
  Target,
  Clock,
  Users,
  Workflow,
  GitBranch,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  trigger: {
    type: 'stage_change' | 'time_based' | 'lead_score' | 'activity' | 'manual';
    conditions: any;
  };
  actions: Array<{
    type: 'email' | 'task' | 'assign' | 'status_change' | 'tag' | 'webhook';
    config: any;
    delay_minutes?: number;
  }>;
  created_at: string;
  updated_at: string;
}

interface WorkflowExecution {
  id: string;
  workflow_rule_id: string;
  lead_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  error_message?: string;
  actions_completed: number;
  total_actions: number;
}

export const AdvancedWorkflowAutomation = () => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowRule | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadWorkflows();
    loadExecutions();
  }, []);

  const loadWorkflows = async () => {
    // Mock data - would load from database
    const mockWorkflows: WorkflowRule[] = [
      {
        id: '1',
        name: 'New Lead Welcome Sequence',
        description: 'Automatically send welcome email and schedule follow-up for new leads',
        is_active: true,
        trigger: {
          type: 'stage_change',
          conditions: { from: null, to: 'New' }
        },
        actions: [
          {
            type: 'email',
            config: { template_id: 'welcome', delay_hours: 0 }
          },
          {
            type: 'task',
            config: { task_type: 'follow_up', due_days: 1 },
            delay_minutes: 60
          }
        ],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'High-Value Lead Alert',
        description: 'Notify sales team when high-value leads are created',
        is_active: true,
        trigger: {
          type: 'lead_score',
          conditions: { score_threshold: 80 }
        },
        actions: [
          {
            type: 'assign',
            config: { team_member: 'senior_sales' }
          },
          {
            type: 'email',
            config: { template_id: 'high_value_alert', recipients: ['sales@company.com'] }
          }
        ],
        created_at: '2024-01-10T15:30:00Z',
        updated_at: '2024-01-10T15:30:00Z'
      },
      {
        id: '3',
        name: 'Stale Lead Re-engagement',
        description: 'Re-engage leads that haven\'t been contacted in 30 days',
        is_active: true,
        trigger: {
          type: 'time_based',
          conditions: { days_since_last_contact: 30 }
        },
        actions: [
          {
            type: 'email',
            config: { template_id: 'reengagement' }
          },
          {
            type: 'task',
            config: { task_type: 'follow_up', priority: 'high' }
          }
        ],
        created_at: '2024-01-05T09:15:00Z',
        updated_at: '2024-01-05T09:15:00Z'
      }
    ];
    
    setWorkflows(mockWorkflows);
  };

  const loadExecutions = async () => {
    // Mock data - would load from database
    const mockExecutions: WorkflowExecution[] = [
      {
        id: '1',
        workflow_rule_id: '1',
        lead_id: 'lead_123',
        status: 'completed',
        started_at: '2024-01-20T14:00:00Z',
        completed_at: '2024-01-20T14:05:00Z',
        actions_completed: 2,
        total_actions: 2
      },
      {
        id: '2',
        workflow_rule_id: '2',
        lead_id: 'lead_456',
        status: 'running',
        started_at: '2024-01-20T15:30:00Z',
        actions_completed: 1,
        total_actions: 2
      }
    ];
    
    setExecutions(mockExecutions);
    setLoading(false);
  };

  const toggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      setWorkflows(prev => prev.map(w => 
        w.id === workflowId ? { ...w, is_active: isActive } : w
      ));
      
      toast({
        title: isActive ? "Workflow Activated" : "Workflow Deactivated",
        description: `The workflow has been ${isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      toast({
        title: "Error",
        description: "Failed to update workflow status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'stage_change':
        return <GitBranch className="h-4 w-4" />;
      case 'time_based':
        return <Clock className="h-4 w-4" />;
      case 'lead_score':
        return <Target className="h-4 w-4" />;
      case 'activity':
        return <Zap className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading workflows...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Workflow className="h-6 w-6" />
            Workflow Automation
          </h2>
          <p className="text-muted-foreground">
            Automate lead management with intelligent workflows
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Workflow</DialogTitle>
            </DialogHeader>
            <WorkflowBuilder onSave={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Workflows Created</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first workflow to automate lead management
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Workflow
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getTriggerIcon(workflow.trigger.type)}
                          <CardTitle className="text-lg">{workflow.name}</CardTitle>
                          <Badge variant={workflow.is_active ? "default" : "secondary"}>
                            {workflow.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={workflow.is_active}
                          onCheckedChange={(checked) => toggleWorkflow(workflow.id, checked)}
                        />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-1">Trigger</div>
                        <Badge variant="outline">
                          {workflow.trigger.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Actions ({workflow.actions.length})</div>
                        <div className="flex flex-wrap gap-2">
                          {workflow.actions.map((action, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {action.type === 'email' && <Mail className="h-3 w-3 mr-1" />}
                              {action.type === 'task' && <Calendar className="h-3 w-3 mr-1" />}
                              {action.type === 'assign' && <Users className="h-3 w-3 mr-1" />}
                              {action.type.replace('_', ' ')}
                              {action.delay_minutes && (
                                <span className="ml-1 text-muted-foreground">
                                  (+{action.delay_minutes}m)
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <div className="text-center py-8">
                  <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No workflow executions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {executions.map((execution) => {
                    const workflow = workflows.find(w => w.id === execution.workflow_rule_id);
                    return (
                      <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{workflow?.name || 'Unknown Workflow'}</div>
                          <div className="text-sm text-muted-foreground">
                            Lead ID: {execution.lead_id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Started: {new Date(execution.started_at).toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="text-right space-y-1">
                          <Badge className={getStatusColor(execution.status)}>
                            {execution.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {execution.actions_completed}/{execution.total_actions} actions
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{workflows.filter(w => w.is_active).length}</div>
                <p className="text-xs text-muted-foreground">
                  {workflows.length} total workflows
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Executions Today</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  +20% from yesterday
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Workflow Builder Component
const WorkflowBuilder = ({ onSave }: { onSave: () => void }) => {
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [actions, setActions] = useState<any[]>([]);

  const addAction = () => {
    setActions(prev => [...prev, { type: '', config: {}, delay_minutes: 0 }]);
  };

  const removeAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: any) => {
    setActions(prev => prev.map((action, i) => 
      i === index ? { ...action, [field]: value } : action
    ));
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Workflow Name</Label>
          <Input
            id="name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Enter workflow name..."
          />
        </div>
        
        <div>
          <Label htmlFor="trigger">Trigger Type</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stage_change">Stage Change</SelectItem>
              <SelectItem value="time_based">Time Based</SelectItem>
              <SelectItem value="lead_score">Lead Score</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={workflowDescription}
          onChange={(e) => setWorkflowDescription(e.target.value)}
          placeholder="Describe what this workflow does..."
          rows={3}
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Actions</h4>
          <Button variant="outline" size="sm" onClick={addAction}>
            <Plus className="h-4 w-4 mr-2" />
            Add Action
          </Button>
        </div>
        
        <div className="space-y-3">
          {actions.map((action, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="grid grid-cols-3 gap-3">
                <Select 
                  value={action.type} 
                  onValueChange={(value) => updateAction(index, 'type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Send Email</SelectItem>
                    <SelectItem value="task">Create Task</SelectItem>
                    <SelectItem value="assign">Assign Lead</SelectItem>
                    <SelectItem value="status_change">Change Status</SelectItem>
                    <SelectItem value="tag">Add Tag</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Delay (minutes)"
                  type="number"
                  value={action.delay_minutes}
                  onChange={(e) => updateAction(index, 'delay_minutes', parseInt(e.target.value) || 0)}
                />
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeAction(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSave}>
          Cancel
        </Button>
        <Button onClick={onSave}>
          Create Workflow
        </Button>
      </div>
    </div>
  );
};