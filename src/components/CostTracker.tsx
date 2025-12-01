import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Edit } from "lucide-react";
import { dataService, Project, ProjectCosts } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

interface CostTrackerProps {
  project: Project;
  onUpdate: () => void;
}

const CostTracker = ({ project, onUpdate }: CostTrackerProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [costs, setCosts] = useState<ProjectCosts>(project.costs || {
    // COGS subcategories
    metal: 0,
    lumber: 0,
    doorsWindows: 0,
    garageDoors: 0,
    flooring: 0,
    drywall: 0,
    paint: 0,
    fixtures: 0,
    trim: 0,
    // Subcontractor subcategories
    buildingCrew: 0,
    concrete: 0,
    electric: 0,
    plumbing: 0,
    hvac: 0,
    drywallSub: 0,
    painter: 0,
    // Other categories
    additionalCogs: 0,
    miscellaneous: 0,
    materials: 0,
    permits: 0,
    equipment: 0
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updated = dataService.updateProjectCosts(project.id, costs);
    if (updated) {
      toast({
        title: "Success",
        description: "Project costs updated successfully.",
      });
      
      // Add activity
      dataService.addActivity({
        type: 'milestone',
        title: 'Project costs updated',
        project: project.name,
        projectId: project.id,
        time: 'Just now',
        status: 'completed',
        description: 'Project cost tracking information was updated'
      });
      
      onUpdate();
      setIsEditDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate totals
  const cogsTotal = (costs.metal || 0) + (costs.lumber || 0) + (costs.doorsWindows || 0) + 
                   (costs.garageDoors || 0) + (costs.flooring || 0) + (costs.drywall || 0) + 
                   (costs.paint || 0) + (costs.fixtures || 0) + (costs.trim || 0);

  const subcontractorsTotal = (costs.buildingCrew || 0) + (costs.concrete || 0) + (costs.electric || 0) + 
                             (costs.plumbing || 0) + (costs.hvac || 0) + (costs.drywallSub || 0) + 
                             (costs.painter || 0);

  const totalCosts = cogsTotal + subcontractorsTotal + (costs.additionalCogs || 0) + 
                    (costs.miscellaneous || 0) + (costs.materials || 0) + (costs.permits || 0) + 
                    (costs.equipment || 0);

  const profit = project.budget - totalCosts;
  const profitMargin = project.budget > 0 ? (profit / project.budget) * 100 : 0;

  // Define cost categories
  const cogsSubcategories = [
    { key: 'metal', label: 'Metal', value: costs.metal },
    { key: 'lumber', label: 'Lumber', value: costs.lumber },
    { key: 'doorsWindows', label: 'Doors/Windows', value: costs.doorsWindows },
    { key: 'garageDoors', label: 'Garage Doors', value: costs.garageDoors },
    { key: 'flooring', label: 'Flooring', value: costs.flooring },
    { key: 'drywall', label: 'Drywall', value: costs.drywall },
    { key: 'paint', label: 'Paint', value: costs.paint },
    { key: 'fixtures', label: 'Fixtures', value: costs.fixtures },
    { key: 'trim', label: 'Trim', value: costs.trim }
  ];

  const subcontractorSubcategories = [
    { key: 'buildingCrew', label: 'Building Crew', value: costs.buildingCrew },
    { key: 'concrete', label: 'Concrete', value: costs.concrete },
    { key: 'electric', label: 'Electric', value: costs.electric },
    { key: 'plumbing', label: 'Plumbing', value: costs.plumbing },
    { key: 'hvac', label: 'HVAC', value: costs.hvac },
    { key: 'drywallSub', label: 'Drywall', value: costs.drywallSub },
    { key: 'painter', label: 'Painter', value: costs.painter }
  ];

  const otherCategories = [
    { key: 'additionalCogs', label: 'Additional COGS', value: costs.additionalCogs },
    { key: 'miscellaneous', label: 'Miscellaneous', value: costs.miscellaneous },
    { key: 'materials', label: 'Materials', value: costs.materials },
    { key: 'permits', label: 'Permits & Fees', value: costs.permits },
    { key: 'equipment', label: 'Equipment Rental', value: costs.equipment }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Cost Tracking
          </CardTitle>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Costs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Update Project Costs - {project.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* COGS Section */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="text-lg font-semibold">COGS (Cost of Goods Sold)</h3>
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
                          value={costs[category.key as keyof ProjectCosts] || 0}
                          onChange={(e) => setCosts({
                            ...costs,
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
                    <h3 className="text-lg font-semibold">Subcontractors</h3>
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
                          value={costs[category.key as keyof ProjectCosts] || 0}
                          onChange={(e) => setCosts({
                            ...costs,
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
                    <h3 className="text-lg font-semibold">Other Costs</h3>
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
                          value={costs[category.key as keyof ProjectCosts] || 0}
                          onChange={(e) => setCosts({
                            ...costs,
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
                    <span>Total Costs:</span>
                    <span>{formatCurrency(totalCosts)}</span>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Costs
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* COGS Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold text-blue-700 bg-blue-50 p-2 rounded">
              <span>COGS (Cost of Goods Sold):</span>
              <span>{formatCurrency(cogsTotal)}</span>
            </div>
            <div className="ml-4 grid md:grid-cols-2 gap-2">
              {cogsSubcategories.map((category) => (
                <div key={category.key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{category.label}:</span>
                  <span>{formatCurrency(category.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractors Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between font-semibold text-purple-700 bg-purple-50 p-2 rounded">
              <span>Subcontractors:</span>
              <span>{formatCurrency(subcontractorsTotal)}</span>
            </div>
            <div className="ml-4 grid md:grid-cols-2 gap-2">
              {subcontractorSubcategories.map((category) => (
                <div key={category.key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{category.label}:</span>
                  <span>{formatCurrency(category.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Other Categories */}
          <div className="space-y-2">
            <div className="font-semibold text-gray-700">Other Costs:</div>
            <div className="ml-4 grid md:grid-cols-2 gap-2">
              {otherCategories.map((category) => (
                <div key={category.key} className="flex justify-between text-sm">
                  <span className="text-gray-600">{category.label}:</span>
                  <span>{formatCurrency(category.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Costs:</span>
              <span>{formatCurrency(totalCosts)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Project Budget:</span>
              <span>{formatCurrency(project.budget)}</span>
            </div>
            <div className={`flex justify-between text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Profit:</span>
              <span>{formatCurrency(profit)}</span>
            </div>
            <div className={`flex justify-between text-sm ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <span>Profit Margin:</span>
              <span>{profitMargin.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostTracker;
