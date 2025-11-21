import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, DollarSign } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Project } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

interface ProjectCosts {
  metal?: number;
  lumber?: number;
  doors_windows?: number;
  garage_doors?: number;
  flooring?: number;
  drywall?: number;
  paint?: number;
  fixtures?: number;
  trim?: number;
  building_crew?: number;
  concrete?: number;
  electric?: number;
  plumbing?: number;
  hvac?: number;
  drywall_sub?: number;
  painter?: number;
  additional_cogs?: number;
  miscellaneous?: number;
  materials?: number;
  permits?: number;
  equipment?: number;
}

interface BudgetPlannerProps {
  project: Project;
  onUpdate: () => void;
}

const BudgetPlanner = ({ project, onUpdate }: BudgetPlannerProps) => {
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [budgetCosts, setBudgetCosts] = useState<ProjectCosts>({
    // COGS subcategories
    metal: 0,
    lumber: 0,
    doors_windows: 0,
    garage_doors: 0,
    flooring: 0,
    drywall: 0,
    paint: 0,
    fixtures: 0,
    trim: 0,
    // Subcontractor subcategories
    building_crew: 0,
    concrete: 0,
    electric: 0,
    plumbing: 0,
    hvac: 0,
    drywall_sub: 0,
    painter: 0,
    // Other categories
    additional_cogs: 0,
    miscellaneous: 0,
    materials: 0,
    permits: 0,
    equipment: 0
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load existing project costs when dialog opens
  useEffect(() => {
    if (isBudgetDialogOpen) {
      loadProjectCosts();
    }
  }, [isBudgetDialogOpen, project.id]);

  const loadProjectCosts = async () => {
    try {
      const costs = await supabaseService.getProjectCosts();
      const projectCosts = costs.find(c => c.project_id === project.id);
      if (projectCosts) {
        setBudgetCosts(projectCosts);
      }
    } catch (error) {
      console.error('Error loading project costs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await supabaseService.updateProjectCosts(project.id, budgetCosts);
      
      toast({
        title: "Success",
        description: "Budget costs updated successfully.",
      });
      
      // Add activity
      await supabaseService.addActivity({
        type: 'milestone',
        title: 'Budget costs updated',
        project_name: project.name,
        project_id: project.id,
        time: new Date().toISOString(),
        status: 'completed',
        description: 'Project budget cost estimates were updated'
      });
      
      onUpdate();
      
      // Trigger a custom event to notify ReportsManager
      window.dispatchEvent(new CustomEvent('projectCostsUpdated', { 
        detail: { projectId: project.id } 
      }));
      
      setIsBudgetDialogOpen(false);
    } catch (error) {
      console.error('Error updating budget costs:', error);
      toast({
        title: "Error",
        description: "Failed to update budget costs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate totals
  const cogsTotal = (budgetCosts.metal || 0) + (budgetCosts.lumber || 0) + (budgetCosts.doors_windows || 0) + 
                   (budgetCosts.garage_doors || 0) + (budgetCosts.flooring || 0) + (budgetCosts.drywall || 0) + 
                   (budgetCosts.paint || 0) + (budgetCosts.fixtures || 0) + (budgetCosts.trim || 0);

  const subcontractorsTotal = (budgetCosts.building_crew || 0) + (budgetCosts.concrete || 0) + (budgetCosts.electric || 0) + 
                             (budgetCosts.plumbing || 0) + (budgetCosts.hvac || 0) + (budgetCosts.drywall_sub || 0) + 
                             (budgetCosts.painter || 0);

  const totalBudgetCosts = cogsTotal + subcontractorsTotal + (budgetCosts.additional_cogs || 0) + 
                          (budgetCosts.miscellaneous || 0) + (budgetCosts.materials || 0) + (budgetCosts.permits || 0) + 
                          (budgetCosts.equipment || 0);

  // Define cost categories
  const cogsSubcategories = [
    { key: 'metal', label: 'Metal', value: budgetCosts.metal },
    { key: 'lumber', label: 'Lumber', value: budgetCosts.lumber },
    { key: 'doors_windows', label: 'Doors/Windows', value: budgetCosts.doors_windows },
    { key: 'garage_doors', label: 'Garage Doors', value: budgetCosts.garage_doors },
    { key: 'flooring', label: 'Flooring', value: budgetCosts.flooring },
    { key: 'drywall', label: 'Drywall', value: budgetCosts.drywall },
    { key: 'paint', label: 'Paint', value: budgetCosts.paint },
    { key: 'fixtures', label: 'Fixtures', value: budgetCosts.fixtures },
    { key: 'trim', label: 'Trim', value: budgetCosts.trim }
  ];

  const subcontractorSubcategories = [
    { key: 'building_crew', label: 'Building Crew', value: budgetCosts.building_crew },
    { key: 'concrete', label: 'Concrete', value: budgetCosts.concrete },
    { key: 'electric', label: 'Electric', value: budgetCosts.electric },
    { key: 'plumbing', label: 'Plumbing', value: budgetCosts.plumbing },
    { key: 'hvac', label: 'HVAC', value: budgetCosts.hvac },
    { key: 'drywall_sub', label: 'Drywall', value: budgetCosts.drywall_sub },
    { key: 'painter', label: 'Painter', value: budgetCosts.painter }
  ];

  const otherCategories = [
    { key: 'additional_cogs', label: 'Additional COGS', value: budgetCosts.additional_cogs },
    { key: 'miscellaneous', label: 'Miscellaneous', value: budgetCosts.miscellaneous },
    { key: 'materials', label: 'Materials', value: budgetCosts.materials },
    { key: 'permits', label: 'Permits & Fees', value: budgetCosts.permits },
    { key: 'equipment', label: 'Equipment Rental', value: budgetCosts.equipment }
  ];

  return (
    <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4 mr-2" />
          Budget Tracker
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Budget Cost Tracking - {project.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* COGS Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">COGS (Cost of Goods Sold) - Budget</h3>
              <p className="text-sm text-gray-600">Total: {formatCurrency(cogsTotal)}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {cogsSubcategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <Label htmlFor={category.key}>{category.label}</Label>
                  <Input
                    id={category.key}
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetCosts[category.key as keyof ProjectCosts] || 0}
                    onChange={(e) => setBudgetCosts({
                      ...budgetCosts,
                      [category.key]: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractors Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">Subcontractors - Budget</h3>
              <p className="text-sm text-gray-600">Total: {formatCurrency(subcontractorsTotal)}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {subcontractorSubcategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <Label htmlFor={category.key}>{category.label}</Label>
                  <Input
                    id={category.key}
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetCosts[category.key as keyof ProjectCosts] || 0}
                    onChange={(e) => setBudgetCosts({
                      ...budgetCosts,
                      [category.key]: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Other Categories Section */}
          <div className="space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">Other Costs - Budget</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {otherCategories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <Label htmlFor={category.key}>{category.label}</Label>
                  <Input
                    id={category.key}
                    type="number"
                    min="0"
                    step="0.01"
                    value={budgetCosts[category.key as keyof ProjectCosts] || 0}
                    onChange={(e) => setBudgetCosts({
                      ...budgetCosts,
                      [category.key]: Number(e.target.value)
                    })}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Budget Costs:</span>
              <span>{formatCurrency(totalBudgetCosts)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Project Budget:</span>
              <span>{formatCurrency(project.budget || 0)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBudgetDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Budget Costs'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetPlanner;
