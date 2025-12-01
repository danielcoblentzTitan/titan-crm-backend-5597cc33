import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project, Customer } from "@/services/supabaseService";

const BARNDO_PHASES = [
  { name: "Planning & Permits", percentage: 0 },
  { name: "Pre Construction", percentage: 5 },
  { name: "Framing Crew", percentage: 10 },
  { name: "Plumbing Underground", percentage: 15 },
  { name: "Concrete Crew", percentage: 20 },
  { name: "Interior Framing", percentage: 25 },
  { name: "Plumbing Rough In", percentage: 30 },
  { name: "HVAC Rough In", percentage: 35 },
  { name: "Electric Rough In", percentage: 40 },
  { name: "Insulation", percentage: 45 },
  { name: "Drywall", percentage: 55 },
  { name: "Paint", percentage: 65 },
  { name: "Flooring", percentage: 75 },
  { name: "Doors and Trim", percentage: 80 },
  { name: "Garage Doors and Gutters", percentage: 85 },
  { name: "Garage Finish", percentage: 87 },
  { name: "Plumbing Final", percentage: 90 },
  { name: "HVAC Final", percentage: 92 },
  { name: "Electric Final", percentage: 94 },
  { name: "Kitchen Install", percentage: 96 },
  { name: "Interior Finishes", percentage: 98 },
  { name: "Final", percentage: 100 }
];

interface ProjectFormProps {
  project?: Project;
  customers: Customer[];
  onSubmit: (data: Partial<Project>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const ProjectForm = ({ project, customers, onSubmit, onCancel, isEdit }: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    customer_id: project?.customer_id || "",
    customer_name: project?.customer_name || "",
    status: project?.status || "Planning",
    phase: project?.phase || "",
    start_date: project?.start_date || "",
    estimated_completion: project?.estimated_completion || "",
    budget: project?.budget || 0,
    description: project?.description || "",
    address: project?.address || "",
    city: project?.city || "",
    state: project?.state || "",
    zip: project?.zip || ""
  });

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.name
      }));
    }
  };

  const handlePhaseChange = (newPhase: string) => {
    const phaseData = BARNDO_PHASES.find(p => p.name === newPhase);
    const newProgress = phaseData ? phaseData.percentage : 0;
    
    setFormData(prev => ({
      ...prev,
      phase: newPhase
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Project Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Customer *</Label>
          <Select value={formData.customer_id} onValueChange={handleCustomerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Planning">Planning</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phase">Phase</Label>
          <Select value={formData.phase} onValueChange={handlePhaseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select phase..." />
            </SelectTrigger>
            <SelectContent>
              {BARNDO_PHASES.map((phase) => (
                <SelectItem key={phase.name} value={phase.name}>
                  {phase.name} ({phase.percentage}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Contract Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_completion">Estimated Completion *</Label>
          <Input
            id="estimated_completion"
            type="date"
            value={formData.estimated_completion}
            onChange={(e) => handleInputChange('estimated_completion', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          value={formData.budget}
          onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          placeholder="Project description..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="Street address"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
          {isEdit ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
