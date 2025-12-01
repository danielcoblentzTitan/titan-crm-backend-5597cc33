import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { CalendarIcon, Camera, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePunchlist, CreatePunchlistItemData } from '@/hooks/usePunchlist';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { CameraCaptureDialog } from '@/components/CameraCaptureDialog';

interface PunchlistFormProps {
  projectId: string;
  onClose?: () => void;
}

const commonLocations = [
  'Kitchen', 'Living Room', 'Master Bedroom', 'Bathroom', 'Garage', 
  'Exterior', 'Basement', 'Attic', 'Dining Room', 'Office', 'Laundry Room'
];

const priorities = [
  { value: 'Low', color: 'bg-green-100 text-green-800' },
  { value: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'High', color: 'bg-red-100 text-red-800' }
];

export function PunchlistForm({ projectId, onClose }: PunchlistFormProps) {
  const { createItem } = usePunchlist(projectId);
  const { data: vendors = [] } = useVendors();
  const { data: teamMembers = [] } = useTeamMembers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const [formData, setFormData] = useState<Omit<CreatePunchlistItemData, 'project_id'>>({
    location: '',
    description: '',
    priority: 'Medium',
    source: 'internal',
    assigned_to_vendor: '',
    due_date: ''
  });

  const [dueDate, setDueDate] = useState<Date>();

  // Combine vendors and team members for the assignment autocomplete
  const assignmentOptions: AutocompleteOption[] = useMemo(() => {
    const vendorOptions = vendors.map(vendor => ({
      value: `vendor-${vendor.id}`,
      label: vendor.name,
      type: 'Vendor'
    }));

    const teamOptions = teamMembers.map(member => ({
      value: `team-${member.id}`,
      label: member.name,
      type: 'Team Member'
    }));

    return [...vendorOptions, ...teamOptions];
  }, [vendors, teamMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.description) return;

    setIsSubmitting(true);
    try {
      await createItem({
        ...formData,
        project_id: projectId,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined
      });
      
      // Reset form
      setFormData({
        location: '',
        description: '',
        priority: 'Medium',
        source: 'internal',
        assigned_to_vendor: '',
        due_date: ''
      });
      setDueDate(undefined);
    } catch (error) {
      console.error('Error creating punchlist item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoCapture = (photoUrl: string) => {
    setFormData(prev => ({ ...prev, photo_url: photoUrl }));
    setShowCamera(false);
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">Add Punchlist Item</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location/Area</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {commonLocations.map((loc) => (
                  <Badge
                    key={loc}
                    variant={formData.location === loc ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFormData(prev => ({ ...prev, location: loc }))}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter custom location or select above"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue or item that needs attention..."
                rows={3}
                required
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex gap-2">
                {priorities.map((priority) => (
                  <Badge
                    key={priority.value}
                    className={cn(
                      "cursor-pointer transition-colors",
                      formData.priority === priority.value 
                        ? priority.color 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    onClick={() => setFormData(prev => ({ ...prev, priority: priority.value as 'Low' | 'Medium' | 'High' }))}
                  >
                    {priority.value}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Source Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="source"
                checked={formData.source === 'customer'}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, source: checked ? 'customer' : 'internal' }))
                }
              />
              <Label htmlFor="source">
                {formData.source === 'customer' ? 'Customer Requested' : 'Internal Note'}
              </Label>
            </div>

            {/* Assigned To */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To (Vendor/Subcontractor)</Label>
              <Autocomplete
                options={assignmentOptions}
                value={formData.assigned_to_vendor || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to_vendor: value }))}
                placeholder="Enter vendor or team member name"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Photo */}
            <div className="space-y-2">
              <Label>Photo</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCamera(true)}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {formData.photo_url ? 'Change Photo' : 'Take Photo'}
                </Button>
                {formData.photo_url && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData(prev => ({ ...prev, photo_url: undefined }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.photo_url && (
                <div className="mt-2">
                  <img 
                    src={formData.photo_url} 
                    alt="Punchlist item" 
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !formData.location || !formData.description}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Adding Item...' : 'Add Punchlist Item'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showCamera && (
        <CameraCaptureDialog
          entityId={projectId}
          entityType="project"
          onUploadComplete={() => {
            setShowCamera(false);
            // Get the latest uploaded photo URL - this is a simplified approach
            // In a real implementation, you'd want to get the actual URL from the upload
            setFormData(prev => ({ ...prev, photo_url: 'uploaded' }));
          }}
        />
      )}
    </>
  );
}