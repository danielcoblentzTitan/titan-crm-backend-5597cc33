import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useJurisdictions, useCreatePermitApplication, useCreatePermitTasks, calculatePermitFee } from "@/integrations/supabase/hooks/usePermits";
import { toast } from "@/hooks/use-toast";

interface PermitApplicationFormProps {
  onSuccess: () => void;
}

const PermitApplicationForm = ({ onSuccess }: PermitApplicationFormProps) => {
  const [formData, setFormData] = useState({
    jurisdiction_id: "",
    project_type: "",
    square_footage: "",
    notes: ""
  });

  const { data: jurisdictions = [] } = useJurisdictions();
  const createApplication = useCreatePermitApplication();
  const createTasks = useCreatePermitTasks();

  const selectedJurisdiction = jurisdictions.find(j => j.id === formData.jurisdiction_id);
  const availableProjectTypes = selectedJurisdiction?.project_types || [];

  const estimatedFee = selectedJurisdiction && formData.project_type && formData.square_footage
    ? calculatePermitFee(selectedJurisdiction, formData.project_type, parseInt(formData.square_footage))
    : 0;

  const defaultTasks = [
    { name: "Verify Property Jurisdiction", order: 1, assigned_to: "Admin" },
    { name: "Contact County Office", order: 2, assigned_to: "PM" },
    { name: "Collect Required Documents", order: 3, assigned_to: "PM" },
    { name: "Fee Estimate & Approval", order: 4, assigned_to: "Admin" },
    { name: "Submit Application", order: 5, assigned_to: "Admin" },
    { name: "Track Application Status", order: 6, assigned_to: "PM" },
    { name: "Inspections Scheduling", order: 7, assigned_to: "PM" },
    { name: "Permit Closeout", order: 8, assigned_to: "Admin" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.jurisdiction_id || !formData.project_type || !formData.square_footage) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const applicationData = {
        jurisdiction_id: formData.jurisdiction_id,
        project_type: formData.project_type,
        square_footage: parseInt(formData.square_footage),
        estimated_fee: estimatedFee,
        status: "Draft",
        notes: formData.notes || null
      };

      const application = await createApplication.mutateAsync(applicationData);

      // Create default tasks
      const tasksData = defaultTasks.map(task => ({
        application_id: application.id,
        task_name: task.name,
        task_order: task.order,
        assigned_to: task.assigned_to,
        status: "Pending"
      }));

      await createTasks.mutateAsync(tasksData);

      toast({
        title: "Success",
        description: "Permit application created successfully"
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating permit application:", error);
      toast({
        title: "Error", 
        description: "Failed to create permit application",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-background p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jurisdiction">Jurisdiction *</Label>
            <Select 
              value={formData.jurisdiction_id} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                jurisdiction_id: value,
                project_type: "" // Reset project type when jurisdiction changes
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                {jurisdictions.map((jurisdiction) => (
                  <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                    {jurisdiction.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectType">Project Type *</Label>
            <Select 
              value={formData.project_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}
              disabled={!formData.jurisdiction_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {availableProjectTypes.map((projectType: any, index: number) => (
                  <SelectItem key={index} value={projectType.type}>
                    {projectType.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="squareFootage">Square Footage *</Label>
          <Input
            id="squareFootage"
            type="number"
            placeholder="Enter square footage"
            value={formData.square_footage}
            onChange={(e) => setFormData(prev => ({ ...prev, square_footage: e.target.value }))}
            required
          />
        </div>

        {estimatedFee > 0 && (
          <div className="p-4 bg-secondary/20 rounded-lg">
            <Label className="text-sm font-medium">Estimated Fee</Label>
            <div className="text-2xl font-bold text-primary">
              ${estimatedFee.toFixed(2)}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Additional notes or requirements..."
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button 
            type="submit" 
            disabled={createApplication.isPending || createTasks.isPending}
          >
            {createApplication.isPending || createTasks.isPending ? "Creating..." : "Create Application"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PermitApplicationForm;