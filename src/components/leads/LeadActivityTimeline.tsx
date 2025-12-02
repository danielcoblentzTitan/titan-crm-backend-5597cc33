import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lead, LeadActivity, TeamMember } from "@/services/supabaseService";
import { Clock, Phone, Mail, FileText, Calendar, User, Plus, MessageSquare, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadActivityTimelineProps {
  lead: Lead;
  teamMembers: TeamMember[];
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  document: FileText,
  estimate: DollarSign,
  follow_up: Clock,
  message: MessageSquare,
  other: FileText
};

const activityColors = {
  call: 'bg-blue-100 text-blue-800',
  email: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800',
  note: 'bg-gray-100 text-gray-800',
  document: 'bg-orange-100 text-orange-800',
  estimate: 'bg-emerald-100 text-emerald-800',
  follow_up: 'bg-yellow-100 text-yellow-800',
  message: 'bg-indigo-100 text-indigo-800',
  other: 'bg-slate-100 text-slate-800'
};

export const LeadActivityTimeline = ({ lead, teamMembers }: LeadActivityTimelineProps) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'note',
    subject: '',
    notes: '',
    scheduled_for: '',
    team_member_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadActivities();
  }, [lead.id]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_activities')
        .select(`
          *,
          team_members!lead_activities_team_member_id_fkey(name)
        `)
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const activityData = {
        lead_id: lead.id,
        activity_type: newActivity.activity_type,
        subject: newActivity.subject,
        notes: newActivity.notes,
        scheduled_for: newActivity.scheduled_for ? new Date(newActivity.scheduled_for).toISOString() : null,
        team_member_id: newActivity.team_member_id || null
      };

      const { error } = await supabase
        .from('lead_activities')
        .insert([activityData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity added successfully"
      });

      setIsAddActivityOpen(false);
      setNewActivity({
        activity_type: 'note',
        subject: '',
        notes: '',
        scheduled_for: '',
        team_member_id: ''
      });
      loadActivities();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive"
      });
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading activities...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
        
        <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddActivity} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="activity_type">Activity Type</Label>
                  <Select 
                    value={newActivity.activity_type} 
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, activity_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="estimate">Estimate</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="team_member">Team Member</Label>
                  <Select 
                    value={newActivity.team_member_id} 
                    onValueChange={(value) => setNewActivity(prev => ({ ...prev, team_member_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newActivity.subject}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Activity subject..."
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newActivity.notes}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Activity details..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="scheduled_for">Scheduled For (Optional)</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={newActivity.scheduled_for}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, scheduled_for: e.target.value }))}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddActivityOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Activity</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activities recorded yet</p>
            <p className="text-sm text-muted-foreground">Add the first activity to start tracking interactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.activity_type as keyof typeof activityIcons] || FileText;
              const colorClass = activityColors[activity.activity_type as keyof typeof activityColors] || activityColors.other;
              
              return (
                <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-').replace('800', '200')}`}>
                      <Icon className={`h-4 w-4 ${colorClass.split(' ')[1]}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={colorClass}>
                            {activity.activity_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getTimeAgo(activity.created_at)}
                          </span>
                        </div>
                        
                        {activity.subject && (
                          <h4 className="font-medium text-sm mb-1">{activity.subject}</h4>
                        )}
                        
                        {activity.notes && (
                          <p className="text-sm text-muted-foreground">{activity.notes}</p>
                        )}
                        
                        {activity.scheduled_for && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {format(new Date(activity.scheduled_for), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                        
                        {(activity as any).team_members?.name && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {(activity as any).team_members.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};