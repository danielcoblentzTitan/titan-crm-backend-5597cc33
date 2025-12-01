import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, Clock, Send, Eye, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScheduleRequests, useCreateScheduleRequest, useSendVendorEmail } from "@/integrations/supabase/hooks/useVendorWorkflows";
import { useVendors } from "@/integrations/supabase/hooks/useVendors";

interface ScheduleManagerProps {
  vendorId?: string;
}

const ScheduleManager = ({ vendorId }: ScheduleManagerProps) => {
  const { data: scheduleRequests = [], isLoading } = useScheduleRequests(vendorId);
  const { data: vendors = [] } = useVendors();
  const createSchedule = useCreateScheduleRequest();
  const sendEmail = useSendVendorEmail();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [formData, setFormData] = useState({
    vendor_id: vendorId || "",
    project_id: "",
    subject: "",
    body: "",
    window_start: undefined as Date | undefined,
    window_end: undefined as Date | undefined,
    crew_notes: "",
  });

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_id || !formData.subject) {
      return;
    }

    try {
      const scheduleData = {
        vendor_id: formData.vendor_id,
        project_id: formData.project_id || null,
        subject: formData.subject,
        body: formData.body,
        status: 'Sent' as const,
        window_start: formData.window_start ? formData.window_start.toISOString() : null,
        window_end: formData.window_end ? formData.window_end.toISOString() : null,
        confirmed_date: null,
        crew_notes: formData.crew_notes,
      };

      const newSchedule = await createSchedule.mutateAsync(scheduleData);
      
      // Send email immediately
      if (newSchedule) {
        const vendor = vendors.find(v => v.id === formData.vendor_id);
        if (vendor?.primary_email) {
          const windowText = formData.window_start && formData.window_end 
            ? `${format(formData.window_start, 'PPP')} to ${format(formData.window_end, 'PPP')}`
            : 'TBD';
            
          await sendEmail.mutateAsync({
            vendor_id: formData.vendor_id,
            object_type: 'schedule',
            object_id: newSchedule.id,
            subject: `[${newSchedule.code}] Schedule Request - ${formData.subject}`,
            body_html: `<p>Hi ${vendor.name},</p><p>We need to schedule the following work:</p><p><strong>${formData.subject}</strong></p><p>${formData.body}</p><p><strong>Proposed Window:</strong> ${windowText}</p>${formData.crew_notes ? `<p><strong>Crew Notes:</strong> ${formData.crew_notes}</p>` : ''}<p>Please reply with <strong>DATE YYYY-MM-DD</strong> to confirm your preferred date within the window.</p><p>Best regards,<br>Titan Buildings</p>`,
            body_text: `Hi ${vendor.name},\n\nWe need to schedule the following work:\n\n${formData.subject}\n\n${formData.body}\n\nProposed Window: ${windowText}\n\n${formData.crew_notes ? `Crew Notes: ${formData.crew_notes}\n\n` : ''}Please reply with DATE YYYY-MM-DD to confirm your preferred date within the window.\n\nBest regards,\nTitan Buildings`,
            to_emails: [vendor.primary_email],
            merge_data: {
              'schedule.code': newSchedule.code,
              'schedule.subject': formData.subject,
              'schedule.window': windowText,
            }
          });
        }
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: vendorId || "",
      project_id: "",
      subject: "",
      body: "",
      window_start: undefined,
      window_end: undefined,
      crew_notes: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Sent': return 'secondary';
      case 'Acknowledged': return 'default';
      case 'Confirmed': return 'default';
      case 'Declined': return 'destructive';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent': return <Send className="h-4 w-4" />;
      case 'Acknowledged': return <CheckCircle className="h-4 w-4" />;
      case 'Confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'Declined': return <XCircle className="h-4 w-4" />;
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading Schedule Requests...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule Coordination</h2>
          <p className="text-muted-foreground">Coordinate work schedules with vendors via email</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Schedule Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select 
                  value={formData.vendor_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}
                  disabled={!!vendorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Work Description *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Foundation pour for Project ABC"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Additional Details</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Any specific requirements, access instructions, etc..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Window Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.window_start && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.window_start ? format(formData.window_start, "PPP") : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.window_start}
                        onSelect={(date) => setFormData(prev => ({ ...prev, window_start: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Window End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.window_end && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.window_end ? format(formData.window_end, "PPP") : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.window_end}
                        onSelect={(date) => setFormData(prev => ({ ...prev, window_end: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="crew_notes">Crew Notes</Label>
                <Textarea
                  id="crew_notes"
                  value={formData.crew_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, crew_notes: e.target.value }))}
                  placeholder="Special instructions for the crew..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Creating & Sending..." : "Create & Send Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Schedule Request List */}
      <div className="grid gap-4">
        {scheduleRequests.map((schedule: any) => (
          <Card key={schedule.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(schedule.status)}
                    <Badge variant={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{schedule.code}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {schedule.vendor?.name} • {schedule.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {schedule.confirmed_date && (
                    <Badge variant="outline" className="text-green-600">
                      Confirmed: {format(new Date(schedule.confirmed_date), 'MMM d')}
                    </Badge>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setSelectedSchedule(schedule)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  {schedule.body && <p className="text-sm">{schedule.body}</p>}
                  {schedule.project && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Project: {schedule.project.name}
                    </p>
                  )}
                  {schedule.crew_notes && (
                    <p className="text-sm text-muted-foreground">
                      Crew Notes: {schedule.crew_notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(schedule.created_at), 'MMM d, yyyy')}
                  </div>
                  {schedule.window_start && schedule.window_end && (
                    <div className="text-sm text-muted-foreground">
                      Window: {format(new Date(schedule.window_start), 'MMM d')} - {format(new Date(schedule.window_end), 'MMM d')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {schedule.object_alias}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {scheduleRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Schedule Requests found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first schedule request to coordinate work with vendors
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create First Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Schedule Detail Dialog */}
      {selectedSchedule && (
        <Dialog open={!!selectedSchedule} onOpenChange={() => setSelectedSchedule(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedSchedule.code}</span>
                <Badge variant={getStatusColor(selectedSchedule.status)}>
                  {selectedSchedule.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vendor</Label>
                  <p>{selectedSchedule.vendor?.name} ({selectedSchedule.vendor?.code})</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusColor(selectedSchedule.status)}>
                    {selectedSchedule.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <Label>Work Description</Label>
                <p>{selectedSchedule.subject}</p>
              </div>
              
              {selectedSchedule.body && (
                <div>
                  <Label>Additional Details</Label>
                  <p className="whitespace-pre-wrap">{selectedSchedule.body}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {selectedSchedule.window_start && (
                  <div>
                    <Label>Window Start</Label>
                    <p>{format(new Date(selectedSchedule.window_start), 'PPP')}</p>
                  </div>
                )}
                {selectedSchedule.window_end && (
                  <div>
                    <Label>Window End</Label>
                    <p>{format(new Date(selectedSchedule.window_end), 'PPP')}</p>
                  </div>
                )}
              </div>
              
              {selectedSchedule.confirmed_date && (
                <div>
                  <Label>Confirmed Date</Label>
                  <p className="text-green-600 font-medium">
                    {format(new Date(selectedSchedule.confirmed_date), 'PPP')}
                  </p>
                </div>
              )}
              
              {selectedSchedule.crew_notes && (
                <div>
                  <Label>Crew Notes</Label>
                  <p>{selectedSchedule.crew_notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ScheduleManager;