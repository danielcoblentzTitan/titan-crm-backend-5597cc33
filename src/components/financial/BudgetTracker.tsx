import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Save, X } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/services/supabaseService";

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

interface BudgetTrackerProps {
  project: Project;
  onUpdate?: () => void;
}

export const BudgetTracker = ({ project, onUpdate }: BudgetTrackerProps) => {
  const [costs, setCosts] = useState<ProjectCosts>({
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedCosts, setEditedCosts] = useState<ProjectCosts>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProjectCosts();
  }, [project.id]);

  const fetchProjectCosts = async () => {
    try {
      const allCosts = await supabaseService.getProjectCosts();
      const projectCosts = allCosts.find(c => c.project_id === project.id);
      
      if (projectCosts) {
        setCosts(projectCosts);
      } else {
        // Initialize with zeros if no data exists
        setCosts({
          metal: 0,
          lumber: 0,
          doors_windows: 0,
          garage_doors: 0,
          flooring: 0,
          drywall: 0,
          paint: 0,
          fixtures: 0,
          trim: 0,
          building_crew: 0,
          concrete: 0,
          electric: 0,
          plumbing: 0,
          hvac: 0,
          drywall_sub: 0,
          painter: 0,
          additional_cogs: 0,
          miscellaneous: 0,
          materials: 0,
          permits: 0,
          equipment: 0
        });
      }
    } catch (error) {
      console.error('Error fetching project costs:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    setEditedCosts({ ...costs });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedCosts({});
    setIsEditing(false);
  };

  const saveCosts = async () => {
    try {
      await supabaseService.updateProjectCosts(project.id, editedCosts);

      setCosts(editedCosts);
      setIsEditing(false);
      setEditedCosts({});
      onUpdate?.();

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

      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
    } catch (error) {
      console.error('Error saving project costs:', error);
      toast({
        title: "Error",
        description: "Failed to save budget data",
        variant: "destructive",
      });
    }
  };

  const updateCost = (key: keyof ProjectCosts, value: string) => {
    setEditedCosts({
      ...editedCosts,
      [key]: parseFloat(value) || 0,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate totals
  const currentCosts = isEditing ? editedCosts : costs;
  
  const cogsTotal = (currentCosts.metal || 0) + (currentCosts.lumber || 0) + (currentCosts.doors_windows || 0) + 
                   (currentCosts.garage_doors || 0) + (currentCosts.flooring || 0) + (currentCosts.drywall || 0) + 
                   (currentCosts.paint || 0) + (currentCosts.fixtures || 0) + (currentCosts.trim || 0);

  const subcontractorsTotal = (currentCosts.building_crew || 0) + (currentCosts.concrete || 0) + (currentCosts.electric || 0) + 
                             (currentCosts.plumbing || 0) + (currentCosts.hvac || 0) + (currentCosts.drywall_sub || 0) + 
                             (currentCosts.painter || 0);

  const otherTotal = (currentCosts.additional_cogs || 0) + (currentCosts.miscellaneous || 0) + 
                    (currentCosts.materials || 0) + (currentCosts.permits || 0) + (currentCosts.equipment || 0);

  const totalSpent = cogsTotal + subcontractorsTotal + otherTotal;
  const totalBudget = project.budget || 0;
  const remaining = totalBudget - totalSpent;
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Define cost categories
  const cogsSubcategories = [
    { key: 'metal', label: 'Metal', value: currentCosts.metal || 0 },
    { key: 'lumber', label: 'Lumber', value: currentCosts.lumber || 0 },
    { key: 'doors_windows', label: 'Doors/Windows', value: currentCosts.doors_windows || 0 },
    { key: 'garage_doors', label: 'Garage Doors', value: currentCosts.garage_doors || 0 },
    { key: 'flooring', label: 'Flooring', value: currentCosts.flooring || 0 },
    { key: 'drywall', label: 'Drywall', value: currentCosts.drywall || 0 },
    { key: 'paint', label: 'Paint', value: currentCosts.paint || 0 },
    { key: 'fixtures', label: 'Fixtures', value: currentCosts.fixtures || 0 },
    { key: 'trim', label: 'Trim', value: currentCosts.trim || 0 }
  ];

  const subcontractorSubcategories = [
    { key: 'building_crew', label: 'Building Crew', value: currentCosts.building_crew || 0 },
    { key: 'concrete', label: 'Concrete', value: currentCosts.concrete || 0 },
    { key: 'electric', label: 'Electric', value: currentCosts.electric || 0 },
    { key: 'plumbing', label: 'Plumbing', value: currentCosts.plumbing || 0 },
    { key: 'hvac', label: 'HVAC', value: currentCosts.hvac || 0 },
    { key: 'drywall_sub', label: 'Drywall Sub', value: currentCosts.drywall_sub || 0 },
    { key: 'painter', label: 'Painter', value: currentCosts.painter || 0 }
  ];

  const otherCategories = [
    { key: 'additional_cogs', label: 'Additional COGS', value: currentCosts.additional_cogs || 0 },
    { key: 'miscellaneous', label: 'Miscellaneous', value: currentCosts.miscellaneous || 0 },
    { key: 'materials', label: 'Materials', value: currentCosts.materials || 0 },
    { key: 'permits', label: 'Permits & Fees', value: currentCosts.permits || 0 },
    { key: 'equipment', label: 'Equipment Rental', value: currentCosts.equipment || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Overview</CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={startEditing} size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit Budget
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={saveCosts} size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button onClick={cancelEditing} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-muted-foreground">Total Budget</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(remaining)}
              </p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Budget Used</span>
              <span>{percentageUsed.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(percentageUsed, 100)} 
              className={`h-2 ${percentageUsed > 100 ? '[&>div]:bg-red-500' : ''}`} 
            />
          </div>
          
          {percentageUsed > 100 && (
            <Badge variant="destructive" className="mt-2">
              Over Budget by {formatCurrency(totalSpent - totalBudget)}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* COGS Section */}
      <Card>
        <CardHeader>
          <CardTitle>COGS (Cost of Goods Sold) - Budget</CardTitle>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(cogsTotal)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cogsSubcategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label className="text-sm font-medium">{category.label}</Label>
                {!isEditing ? (
                  <div className="p-2 bg-gray-50 rounded border">
                    <span className="font-semibold">{formatCurrency(category.value)}</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={editedCosts[category.key as keyof ProjectCosts] ?? category.value}
                    onChange={(e) => updateCost(category.key as keyof ProjectCosts, e.target.value)}
                    className="text-right"
                    step="0.01"
                    min="0"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subcontractors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Subcontractors - Budget</CardTitle>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(subcontractorsTotal)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subcontractorSubcategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label className="text-sm font-medium">{category.label}</Label>
                {!isEditing ? (
                  <div className="p-2 bg-gray-50 rounded border">
                    <span className="font-semibold">{formatCurrency(category.value)}</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={editedCosts[category.key as keyof ProjectCosts] ?? category.value}
                    onChange={(e) => updateCost(category.key as keyof ProjectCosts, e.target.value)}
                    className="text-right"
                    step="0.01"
                    min="0"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Other Categories Section */}
      <Card>
        <CardHeader>
          <CardTitle>Other Costs - Budget</CardTitle>
          <p className="text-sm text-muted-foreground">Total: {formatCurrency(otherTotal)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label className="text-sm font-medium">{category.label}</Label>
                {!isEditing ? (
                  <div className="p-2 bg-gray-50 rounded border">
                    <span className="font-semibold">{formatCurrency(category.value)}</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={editedCosts[category.key as keyof ProjectCosts] ?? category.value}
                    onChange={(e) => updateCost(category.key as keyof ProjectCosts, e.target.value)}
                    className="text-right"
                    step="0.01"
                    min="0"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold mb-2">
              <span>Total Budget Costs:</span>
              <span>{formatCurrency(totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Project Budget:</span>
              <span>{formatCurrency(totalBudget)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Variance:</span>
              <span className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};