
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Project } from "@/services/dataService";
import { DebouncedInput } from "./DebouncedInput";
import { ProjectDetails, ProjectType } from "./useStatementData";

interface StatementHeaderProps {
  project: Project;
  projectDetails: ProjectDetails;
  setProjectDetails: (details: ProjectDetails) => void;
  updateProjectDetails: (updates: Partial<ProjectDetails>) => void;
  onAutoCalculate: () => void;
  onProjectTypeChange: (type: ProjectType) => void;
  isLocked: boolean;
}

export const StatementHeader = ({ 
  project, 
  projectDetails, 
  setProjectDetails,
  updateProjectDetails, 
  onAutoCalculate,
  onProjectTypeChange,
  isLocked 
}: StatementHeaderProps) => {
  const handleInputChange = (field: keyof ProjectDetails, value: string) => {
    if (isLocked) return;
    
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    
    // Use updateProjectDetails for dimension fields to auto-calculate sq ft
    if (field.includes('Width') || field.includes('Length') || field.includes('Height') || 
        field === 'width' || field === 'length' || field === 'height') {
      updateProjectDetails({ [field]: numValue });
    } else {
      setProjectDetails({
        ...projectDetails,
        [field]: numValue
      });
    }
  };

  const handleProjectTypeChange = (type: ProjectType) => {
    if (isLocked) return;
    onProjectTypeChange(type);
  };

  return (
    <Card className="print:shadow-none print:border-0">
      <CardHeader className="pb-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Project Information</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Project:</strong> {project.customerName} - {projectDetails.projectType === 'barndominium' ? 'Barndominium' : projectDetails.projectType === 'residential_garage' ? 'Residential Garage' : 'Commercial Building'}</p>
              <p><strong>Customer:</strong> {project.customerName}</p>
              <p><strong>Location:</strong> {project.city}, {project.state}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>
            
            {!isLocked && (
              <div className="mt-4">
                <Label className="text-xs">Project Type</Label>
                <Select 
                  value={projectDetails.projectType} 
                  onValueChange={handleProjectTypeChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barndominium">Barndominium</SelectItem>
                    <SelectItem value="residential_garage">Residential Garage</SelectItem>
                    <SelectItem value="commercial">Commercial Building</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="mt-3 p-2 bg-muted rounded">
                  <Label className="text-xs font-semibold">Total Sq Ft of Project</Label>
                  <p className="text-lg font-bold">{projectDetails.sqft?.toLocaleString() || 0} sq ft</p>
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Project Details</h3>
            <div className="grid grid-cols-3 gap-2">
              {projectDetails.projectType === 'barndominium' ? (
                <>
                  {/* Finished Space Dimensions */}
                  <div className="col-span-3">
                    <Label className="text-xs font-semibold">Finished Space = {projectDetails.finishedSqft?.toLocaleString() || 0} sq ft</Label>
                  </div>
                  <div>
                    <Label htmlFor="finishedWidth" className="text-xs">Width (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.finishedWidth || 0}
                      onDebouncedChange={(value) => handleInputChange('finishedWidth', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="finishedLength" className="text-xs">Length (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.finishedLength || 0}
                      onDebouncedChange={(value) => handleInputChange('finishedLength', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="finishedHeight" className="text-xs">Height (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.finishedHeight || 10}
                      onDebouncedChange={(value) => handleInputChange('finishedHeight', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="10"
                      inputMode="numeric"
                      tabIndex={3}
                    />
                  </div>
                  
                  {/* Building Details */}
                  <div>
                    <Label htmlFor="floors" className="text-xs">Floors</Label>
                    <Select 
                      value={projectDetails.floors?.toString() || "1"} 
                      onValueChange={(value) => handleInputChange('floors', value)}
                      disabled={isLocked}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Floor</SelectItem>
                        <SelectItem value="2">2 Floors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kitchenCabinets" className="text-xs">Kitchen Cabinets (LF)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.kitchenCabinets}
                      onDebouncedChange={(value) => handleInputChange('kitchenCabinets', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms" className="text-xs">Bathrooms</Label>
                    <DebouncedInput
                      initialValue={projectDetails.bathrooms}
                      onDebouncedChange={(value) => handleInputChange('bathrooms', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={5}
                    />
                  </div>
                  
                  {/* Unfinished Space Dimensions */}
                  <div className="col-span-3 mt-2">
                    <Label className="text-xs font-semibold">Garage Space = {projectDetails.unfinishedSqft?.toLocaleString() || 0} sq ft</Label>
                  </div>
                  <div>
                    <Label htmlFor="unfinishedWidth" className="text-xs">Width (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.unfinishedWidth || 0}
                      onDebouncedChange={(value) => handleInputChange('unfinishedWidth', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unfinishedLength" className="text-xs">Length (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.unfinishedLength || 0}
                      onDebouncedChange={(value) => handleInputChange('unfinishedLength', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={7}
                    />
                  </div>
                  <div>
                    <Label htmlFor="unfinishedHeight" className="text-xs">Height (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.unfinishedHeight || 14}
                      onDebouncedChange={(value) => handleInputChange('unfinishedHeight', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="14"
                      inputMode="numeric"
                      tabIndex={8}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Building Dimensions */}
                  <div>
                    <Label htmlFor="width" className="text-xs">Width (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.width || 0}
                      onDebouncedChange={(value) => handleInputChange('width', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="length" className="text-xs">Length (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.length || 0}
                      onDebouncedChange={(value) => handleInputChange('length', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder="0"
                      inputMode="numeric"
                      tabIndex={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-xs">Height (ft)</Label>
                    <DebouncedInput
                      initialValue={projectDetails.height || (projectDetails.projectType === 'commercial' ? 16 : 12)}
                      onDebouncedChange={(value) => handleInputChange('height', value)}
                      className="h-8"
                      disabled={isLocked}
                      placeholder={projectDetails.projectType === 'commercial' ? "16" : "12"}
                      inputMode="numeric"
                      tabIndex={3}
                    />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="acres" className="text-xs">Acres</Label>
                <DebouncedInput
                  initialValue={projectDetails.acres}
                  onDebouncedChange={(value) => handleInputChange('acres', value)}
                  className="h-8"
                  disabled={isLocked}
                  placeholder="0"
                  inputMode="decimal"
                  tabIndex={9}
                />
              </div>
              <div>
                <Label htmlFor="doors" className="text-xs">Overhead Doors</Label>
                <DebouncedInput
                  initialValue={projectDetails.doors}
                  onDebouncedChange={(value) => handleInputChange('doors', value)}
                  className="h-8"
                  disabled={isLocked}
                  placeholder="0"
                  inputMode="numeric"
                  tabIndex={10}
                />
              </div>
              <div>
                <Label htmlFor="walkDoors" className="text-xs">Walk Doors</Label>
                <DebouncedInput
                  initialValue={projectDetails.walkDoors}
                  onDebouncedChange={(value) => handleInputChange('walkDoors', value)}
                  className="h-8"
                  disabled={isLocked}
                  placeholder="0"
                  inputMode="numeric"
                  tabIndex={11}
                />
              </div>
            </div>
            {!isLocked && (
              <Button 
                onClick={onAutoCalculate} 
                size="sm" 
                className="mt-2 w-full"
              >
                Auto-Calculate Quantities
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
