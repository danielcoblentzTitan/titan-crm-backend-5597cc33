import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Clock, MapPin, Users, Phone, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AppointmentBookingProps {
  projectId: string;
  customerName: string;
}

interface Appointment {
  id: string;
  type: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  attendees: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const AppointmentBooking = ({ projectId, customerName }: AppointmentBookingProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const appointmentTypes = [
    { 
      value: 'site-visit', 
      label: 'Site Visit & Walkthrough', 
      duration: 60,
      description: 'In-person visit to review progress and discuss any concerns'
    },
    { 
      value: 'design-review', 
      label: 'Design Review Meeting', 
      duration: 90,
      description: 'Review and finalize design selections and material choices'
    },
    { 
      value: 'progress-update', 
      label: 'Progress Update Call', 
      duration: 30,
      description: 'Virtual call to discuss project status and upcoming milestones'
    },
    { 
      value: 'final-walkthrough', 
      label: 'Final Walkthrough', 
      duration: 120,
      description: 'Comprehensive final inspection before project completion'
    },
    { 
      value: 'consultation', 
      label: 'General Consultation', 
      duration: 45,
      description: 'Discuss any questions or concerns about your project'
    }
  ];

  const timeSlots: TimeSlot[] = [
    { time: '08:00', available: true },
    { time: '09:00', available: true },
    { time: '10:00', available: false },
    { time: '11:00', available: true },
    { time: '13:00', available: true },
    { time: '14:00', available: true },
    { time: '15:00', available: false },
    { time: '16:00', available: true },
  ];

  useEffect(() => {
    loadAppointments();
  }, [projectId]);

  const loadAppointments = async () => {
    try {
      // Mock data for demonstration
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          type: 'site-visit',
          title: 'Site Visit & Walkthrough',
          date: '2024-01-15',
          time: '10:00',
          duration: 60,
          location: 'Project Site - 123 Main St',
          attendees: ['John Doe (Project Manager)', 'Sarah Smith (Foreman)'],
          status: 'completed',
          notes: 'Reviewed foundation progress, discussed timeline'
        },
        {
          id: '2',
          type: 'design-review',
          title: 'Design Review Meeting',
          date: '2024-01-22',
          time: '14:00',
          duration: 90,
          location: 'Titan Buildings Office',
          attendees: ['John Doe (Project Manager)', 'Mike Johnson (Designer)'],
          status: 'scheduled'
        }
      ];

      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedType || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date, appointment type, and time slot.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const appointmentType = appointmentTypes.find(type => type.value === selectedType);
      
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        type: selectedType,
        title: appointmentType?.label || 'Appointment',
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: appointmentType?.duration || 60,
        location: selectedType === 'progress-update' ? 'Virtual Call' : 'Project Site',
        attendees: ['John Doe (Project Manager)'],
        status: 'scheduled',
        notes: notes || undefined
      };

      setAppointments(prev => [...prev, newAppointment]);

      toast({
        title: "Appointment Booked",
        description: `Your ${appointmentType?.label} has been scheduled for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
      });

      // Reset form
      setSelectedType('');
      setSelectedTime('');
      setNotes('');

    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Book New Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Appointment Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Appointment Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.duration} minutes</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <p className="text-xs text-muted-foreground mt-2">
                  {appointmentTypes.find(type => type.value === selectedType)?.description}
                </p>
              )}
            </div>

            {/* Calendar */}
            <div>
              <label className="text-sm font-medium mb-2 block">Select Date</label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                className="rounded-md border"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="text-sm font-medium mb-2 block">Available Times</label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="text-xs"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</label>
              <Textarea
                placeholder="Any specific topics you'd like to discuss..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-20"
              />
            </div>

            <Button 
              onClick={handleBookAppointment}
              disabled={loading || !selectedDate || !selectedType || !selectedTime}
              className="w-full"
            >
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Your Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No appointments scheduled yet.
                </p>
              ) : (
                appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{appointment.title}</h4>
                        <p className="text-sm text-muted-foreground">{appointment.type}</p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.attendees.join(', ')}</span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                        <strong>Notes:</strong> {appointment.notes}
                      </div>
                    )}

                    {appointment.status === 'scheduled' && (
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Phone className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Emergency Contact</h4>
              <p className="text-sm text-muted-foreground mb-2">Need immediate assistance?</p>
              <Button variant="outline" size="sm">Call (555) 123-4567</Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CalendarDays className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Reschedule</h4>
              <p className="text-sm text-muted-foreground mb-2">Need to change an appointment?</p>
              <Button variant="outline" size="sm">Contact Manager</Button>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-medium mb-1">Business Hours</h4>
              <p className="text-sm text-muted-foreground">Mon-Fri: 8AM-5PM<br />Sat: 9AM-2PM</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentBooking;