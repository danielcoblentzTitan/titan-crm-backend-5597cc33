import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  project_id: string;
  milestone_name: string;
  target_date: string | null;
  completed_date: string | null;
  is_completed: boolean;
  is_automated: boolean;
  trigger_phase: string | null;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectMilestonesProps {
  projectId: string;
  projectName: string;
}

const ProjectMilestones = ({ projectId, projectName }: ProjectMilestonesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast({
        title: "Error",
        description: "Failed to load project milestones.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMilestoneCompletion = async (milestoneId: string, isCompleted: boolean) => {
    try {
      const updateData: any = {
        is_completed: !isCompleted,
        updated_at: new Date().toISOString()
      };

      if (!isCompleted) {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      } else {
        updateData.completed_date = null;
      }

      const { error } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', milestoneId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Milestone ${!isCompleted ? 'completed' : 'reopened'} successfully.`,
      });

      loadMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast({
        title: "Error",
        description: "Failed to update milestone.",
        variant: "destructive",
      });
    }
  };

  const getMilestoneIcon = (milestone: Milestone) => {
    if (milestone.is_completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (milestone.target_date) {
      const targetDate = new Date(milestone.target_date);
      const today = new Date();
      const isOverdue = targetDate < today;
      
      if (isOverdue) {
        return <Clock className="h-5 w-5 text-red-500" />;
      }
    }
    
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getMilestoneStatus = (milestone: Milestone) => {
    if (milestone.is_completed) {
      return { text: "Completed", color: "bg-green-100 text-green-800 border-green-200" };
    }
    
    if (milestone.target_date) {
      const targetDate = new Date(milestone.target_date);
      const today = new Date();
      const isOverdue = targetDate < today;
      
      if (isOverdue) {
        return { text: "Overdue", color: "bg-red-100 text-red-800 border-red-200" };
      } else {
        return { text: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" };
      }
    }
    
    return { text: "Pending", color: "bg-gray-100 text-gray-800 border-gray-200" };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading milestones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Project Milestones - {projectName}
        </h3>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone, index) => {
          const status = getMilestoneStatus(milestone);
          
          return (
            <Card key={milestone.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getMilestoneIcon(milestone)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {milestone.milestone_name}
                        </h4>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                        {milestone.is_automated && (
                          <Badge variant="outline" className="text-xs">
                            Auto
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Target Date:</span>
                          <p>{formatDate(milestone.target_date)}</p>
                        </div>
                        
                        {milestone.is_completed && milestone.completed_date && (
                          <div>
                            <span className="font-medium">Completed:</span>
                            <p>{formatDate(milestone.completed_date)}</p>
                          </div>
                        )}
                        
                        {milestone.trigger_phase && (
                          <div>
                            <span className="font-medium">Triggered by:</span>
                            <p>{milestone.trigger_phase}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleMilestoneCompletion(milestone.id, milestone.is_completed)}
                      className={milestone.is_completed ? 
                        "text-yellow-600 border-yellow-600 hover:bg-yellow-50" : 
                        "text-green-600 border-green-600 hover:bg-green-50"
                      }
                    >
                      {milestone.is_completed ? 'Reopen' : 'Complete'}
                    </Button>
                  </div>
                </div>
                
                {/* Progress line connecting milestones */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-8 bottom-0 w-0.5 h-4 bg-gray-200 transform translate-y-full"></div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {milestones.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No milestones yet.</p>
              <p className="text-sm text-gray-500 mt-2">
                Milestones will be automatically created as the project progresses through different phases.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectMilestones;