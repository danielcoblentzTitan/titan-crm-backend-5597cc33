import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarProps } from '@/components/ui/calendar';
import { 
  Video, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone,
  CheckCircle,
  XCircle,
  Edit
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

interface VideoCall {
  id: string;
  project_id: string;
  customer_id: string;
  builder_id?: string;
  call_title: string;
  call_description?: string;
  scheduled_for: string;
  duration_minutes: number;
  meeting_url?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  reminder_sent: boolean;
  created_at: string;
}

interface VideoCallSchedulerProps {
  projectId: string;
  customerName: string;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00'
];

const callTypes = [
  { value: 'progress-review', label: 'Progress Review', duration: 30 },
  { value: 'design-discussion', label: 'Design Discussion', duration: 45 },
  { value: 'problem-solving', label: 'Problem Solving', duration: 60 },
  { value: 'final-walkthrough', label: 'Final Walkthrough', duration: 90 },
  { value: 'general-update', label: 'General Update', duration: 15 }
];

export const VideoCallScheduler = ({ projectId, customerName }: VideoCallSchedulerProps) => {
  const [calls, setCalls] = useState<VideoCall[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    time: '',
    duration: 30,
    type: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCalls();
    setupRealtimeSubscription();
    
    return () => {
      supabase.removeAllChannels();
    };
  }, [projectId]);

  const loadCalls = async () => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

      if (!customer) return;

      const { data, error } = await supabase
        .from('video_calls')
        .select('*')
        .eq('project_id', projectId)
        .eq('customer_id', customer.id)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      setCalls((data || []).map(call => ({
        ...call,
        status: call.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      })));
    } catch (error) {
      console.error('Error loading calls:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`video_calls:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'video_calls',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          loadCalls();
        }
      )
      .subscribe();
  };

  const scheduleCall = async () => {
    if (!selectedDate || !formData.time || !formData.title) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', user.data.user.id)
        .single();

      if (!customer) throw new Error('Customer not found');

      // Combine date and time
      const [hours, minutes] = formData.time.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const callData = {
        project_id: projectId,
        customer_id: customer.id,
        call_title: formData.title,
        call_description: formData.description,
        scheduled_for: scheduledDateTime.toISOString(),
        duration_minutes: formData.duration,
        status: 'scheduled' as const,
        created_by: user.data.user.id
      };

      const { error } = await supabase
        .from('video_calls')
        .insert(callData);

      if (error) throw error;

      toast({
        title: 'Call Scheduled',
        description: 'Your video call has been scheduled successfully!'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        time: '',
        duration: 30,
        type: ''
      });
      setSelectedDate(undefined);
      setIsScheduling(false);
    } catch (error) {
      console.error('Error scheduling call:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule video call',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelCall = async (callId: string) => {
    try {
      const { error } = await supabase
        .from('video_calls')
        .update({ status: 'cancelled' })
        .eq('id', callId);

      if (error) throw error;

      toast({
        title: 'Call Cancelled',
        description: 'The video call has been cancelled'
      });
    } catch (error) {
      console.error('Error cancelling call:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel call',
        variant: 'destructive'
      });
    }
  };

  const handleTypeChange = (type: string) => {
    const callType = callTypes.find(ct => ct.value === type);
    if (callType) {
      setFormData(prev => ({
        ...prev,
        type,
        title: callType.label,
        duration: callType.duration
      }));
    }
  };

  const getCallStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-primary/20 text-primary">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-success/20 text-success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingCalls = calls.filter(call => 
    call.status === 'scheduled' && isAfter(new Date(call.scheduled_for), new Date())
  );

  const pastCalls = calls.filter(call => 
    call.status !== 'scheduled' || isBefore(new Date(call.scheduled_for), new Date())
  );

  return (
    <div className="space-y-6">
      {/* Schedule New Call */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Video className="h-5 w-5 text-primary" />
            <span>Video Call Scheduler</span>
          </CardTitle>
          
          <Dialog open={isScheduling} onOpenChange={setIsScheduling}>
            <DialogTrigger asChild>
              <Button>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Video Call</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="call-type">Call Type</Label>
                  <Select onValueChange={handleTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select call type" />
                    </SelectTrigger>
                    <SelectContent>
                      {callTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} ({type.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="title">Call Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter call title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What would you like to discuss?"
                    className="h-20"
                  />
                </div>
                
                <div>
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    className="rounded-md border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Select onValueChange={(time) => setFormData(prev => ({ ...prev, time }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={scheduleCall} 
                    disabled={loading || !selectedDate || !formData.time || !formData.title}
                    className="flex-1"
                  >
                    {loading ? 'Scheduling...' : 'Schedule Call'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsScheduling(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Schedule video calls with your builder team to discuss progress, ask questions, 
            and get personalized updates on your project.
          </p>
        </CardContent>
      </Card>

      {/* Upcoming Calls */}
      {upcomingCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingCalls.map(call => (
                <div key={call.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{call.call_title}</h3>
                        {getCallStatusBadge(call.status)}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{format(new Date(call.scheduled_for), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(call.scheduled_for), 'HH:mm')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{call.duration_minutes} min</span>
                        </div>
                      </div>
                      
                      {call.call_description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {call.call_description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {call.meeting_url && (
                        <Button size="sm" asChild>
                          <a href={call.meeting_url} target="_blank" rel="noopener noreferrer">
                            <Video className="h-4 w-4 mr-1" />
                            Join
                          </a>
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => cancelCall(call.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Calls */}
      {pastCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pastCalls.slice(0, 5).map(call => (
                <div key={call.id} className="border rounded-lg p-3 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{call.call_title}</span>
                        {getCallStatusBadge(call.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(call.scheduled_for), 'MMM d, yyyy • HH:mm')}
                      </div>
                    </div>
                    
                    {call.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                    {call.status === 'cancelled' && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};