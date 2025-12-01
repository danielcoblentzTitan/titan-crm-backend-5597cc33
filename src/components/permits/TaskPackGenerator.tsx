import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useJurisdictions, useCreatePermitApplication, useCreatePermitTasks } from "@/integrations/supabase/hooks/usePermits";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, AlertTriangle, Clock, Building, Mail } from "lucide-react";
import PermitEmailComposer from "./PermitEmailComposer";

interface TaskPackGeneratorProps {
  onSuccess: () => void;
}

const TaskPackGenerator = ({ onSuccess }: TaskPackGeneratorProps) => {
  const [formData, setFormData] = useState({
    jurisdiction_id: "",
    project_type: "",
    square_footage: "",
    valuation: "",
    notes: ""
  });

  const [flags, setFlags] = useState({
    needs_deldot: false,
    needs_osfm: false,
    sussex_inside_muni: false,
    needs_lines_grades: false
  });

  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const [estimatedFee, setEstimatedFee] = useState(0);

  const { data: jurisdictions = [] } = useJurisdictions();
  const createApplication = useCreatePermitApplication();
  const createTasks = useCreatePermitTasks();

  const selectedJurisdiction = jurisdictions.find(j => j.id === formData.jurisdiction_id);
  const availableProjectTypes = selectedJurisdiction?.project_types || [];

  // Enhanced task templates with conditional logic
  const getTaskPack = () => {
    const baseTasks = [
      { name: "Verify Property Jurisdiction", order: 1, assigned_to: "Admin", description: "Confirm correct county/municipality jurisdiction" },
      { name: "Prepare Site/Plot Plan", order: 2, assigned_to: "PM", description: "Create plan with setbacks, dimensions, drives/entrances" },
      { name: "Gather Structural Plans & Truss Specs", order: 3, assigned_to: "Estimator", description: "Stamped drawings and manufacturer specs" },
      { name: "Energy Code Documentation", order: 4, assigned_to: "Estimator", description: "IECC compliance / ResCheck/ComCheck as applicable" },
    ];

    const conditionalTasks = [];

    // Add conditional tasks based on flags
    if (flags.needs_deldot) {
      conditionalTasks.push({
        name: "Request DelDOT Entrance Permit",
        order: 5,
        assigned_to: "PM",
        description: "Required for new/modified driveways",
        hasEmail: true
      });
    }

    if (flags.needs_osfm) {
      conditionalTasks.push({
        name: "Submit State Fire Marshal Plan Review",
        order: 6,
        assigned_to: "PM",
        description: "Required for commercial & certain occupancies",
        hasEmail: true
      });
    }

    if (flags.needs_lines_grades) {
      conditionalTasks.push({
        name: "Lines & Grades Approval",
        order: 7,
        assigned_to: "PM",
        description: "Required for larger projects (varies by county)",
        hasEmail: true
      });
    }

    const finalTasks = [
      { name: "Create/Verify Portal Account", order: 10, assigned_to: "Admin", description: "County ePlans/portal access ready" },
      { name: "Complete Online Application", order: 11, assigned_to: "PM", description: "Enter project details, select occupancy type" },
      { name: "Attach Plans & Documents", order: 12, assigned_to: "PM", description: "Upload all required PDFs to portal" },
      { name: "Estimate Fees & Get Approval", order: 13, assigned_to: "Admin", description: "Calculate fees and get internal approval to proceed" },
      { name: "Submit Application & Pay Fees", order: 14, assigned_to: "Admin", description: "Submit in portal and process payment" },
      { name: "Track Application Status", order: 15, assigned_to: "PM", description: "Monitor portal/emails for review progress" },
      { name: "Address Review Comments", order: 16, assigned_to: "PM", description: "Respond to comments and resubmit if needed" },
      { name: "Permit Issued - Archive & Notify", order: 17, assigned_to: "Admin", description: "Store permit PDF and notify team" }
    ];

    return [...baseTasks, ...conditionalTasks, ...finalTasks].sort((a, b) => a.order - b.order);
  };

  const calculateEstimatedFee = () => {
    if (!selectedJurisdiction || !formData.project_type || !formData.valuation) return 0;

    const projectTypeData = selectedJurisdiction.project_types.find(
      (pt: any) => pt.type === formData.project_type
    );

    if (!projectTypeData) return 0;

    const valuationNum = parseFloat(formData.valuation);
    let totalFee = 0;

    // Apply enhanced fee calculation based on jurisdiction
    if (selectedJurisdiction.name === "Kent County, DE") {
      // Base permit
      const basePermit = Math.max(50, 
        valuationNum <= 1000000 
          ? (valuationNum / 1000) * 10
          : (1000000 / 1000) * 10 + ((valuationNum - 1000000) / 1000) * 3
      );
      // School surcharge
      const schoolSurcharge = valuationNum * 0.0125;
      totalFee = basePermit + schoolSurcharge;
    } else if (selectedJurisdiction.name === "Sussex County, DE") {
      if (flags.sussex_inside_muni) {
        totalFee = 5 + Math.max(0, (valuationNum - 1000) / 1000) * 2;
      } else {
        totalFee = 7.50 + Math.max(0, (valuationNum - 1000) / 1000) * 3;
      }
    } else if (selectedJurisdiction.name === "New Castle County, DE") {
      const permitReview = Math.max(142,
        valuationNum <= 1000000
          ? (valuationNum / 1000) * 12
          : (1000000 / 1000) * 12 + ((valuationNum - 1000000) / 1000) * 5.25
      );
      const zoningReview = Math.min(145, Math.max(21, permitReview * 0.10));
      const fireAssistance = Math.min(valuationNum, 1000000) * 0.005;
      const coFee = (formData.project_type.includes("Barndominium") || formData.project_type.includes("Commercial")) ? 60 : 0;
      
      totalFee = permitReview + zoningReview + fireAssistance + coFee;
    }

    // Add OSFM fee if applicable
    if (flags.needs_osfm) {
      const osfmFee = Math.max(150, 
        Math.min(valuationNum, 1000000) * 0.007 + 
        Math.max(0, valuationNum - 1000000) * 0.003
      );
      totalFee += osfmFee;
    }

    return totalFee;
  };

  const handleGenerate = async () => {
    if (!formData.jurisdiction_id || !formData.project_type || !formData.valuation) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const fee = calculateEstimatedFee();
      setEstimatedFee(fee);

      const applicationData = {
        jurisdiction_id: formData.jurisdiction_id,
        project_type: formData.project_type,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        estimated_fee: fee,
        status: "Draft",
        notes: formData.notes || null
      };

      const application = await createApplication.mutateAsync(applicationData);

      // Generate task pack
      const taskPack = getTaskPack();
      const tasksData = taskPack.map(task => ({
        application_id: application.id,
        task_name: task.name,
        task_order: task.order,
        assigned_to: task.assigned_to,
        status: "Pending",
        notes: task.description
      }));

      await createTasks.mutateAsync(tasksData);
      setGeneratedTasks(taskPack);

      toast({
        title: "Success",
        description: `Task pack generated: ${taskPack.length} tasks created`
      });
      onSuccess();
    } catch (error) {
      console.error("Error generating task pack:", error);
      toast({
        title: "Error",
        description: "Failed to generate task pack",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Task Pack Generator creates a complete permit workflow with automatic task assignment and dependencies.
        </AlertDescription>
      </Alert>

      {/* Basic Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">Jurisdiction *</Label>
              <Select 
                value={formData.jurisdiction_id} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  jurisdiction_id: value,
                  project_type: ""
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valuation">Construction Valuation ($) *</Label>
              <Input
                id="valuation"
                type="number"
                placeholder="Enter construction value"
                value={formData.valuation}
                onChange={(e) => setFormData(prev => ({ ...prev, valuation: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="squareFootage">Square Footage</Label>
              <Input
                id="squareFootage"
                type="number"
                placeholder="Enter square footage"
                value={formData.square_footage}
                onChange={(e) => setFormData(prev => ({ ...prev, square_footage: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditional Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Project Requirements</CardTitle>
          <CardDescription>Select applicable requirements to include additional tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="deldot" 
                checked={flags.needs_deldot}
                onCheckedChange={(checked) => setFlags(prev => ({ ...prev, needs_deldot: checked }))}
              />
              <Label htmlFor="deldot">Needs DelDOT entrance permit</Label>
            </div>

            {formData.project_type.includes("Commercial") && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="osfm" 
                  checked={flags.needs_osfm}
                  onCheckedChange={(checked) => setFlags(prev => ({ ...prev, needs_osfm: checked }))}
                />
                <Label htmlFor="osfm">Requires State Fire Marshal review</Label>
              </div>
            )}

            {selectedJurisdiction?.name === "Sussex County, DE" && (
              <div className="flex items-center space-x-2">
                <Switch 
                  id="sussex_muni" 
                  checked={flags.sussex_inside_muni}
                  onCheckedChange={(checked) => setFlags(prev => ({ ...prev, sussex_inside_muni: checked }))}
                />
                <Label htmlFor="sussex_muni">Inside municipality (Sussex)</Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch 
                id="lines_grades" 
                checked={flags.needs_lines_grades}
                onCheckedChange={(checked) => setFlags(prev => ({ ...prev, needs_lines_grades: checked }))}
              />
              <Label htmlFor="lines_grades">May need Lines & Grades</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated Fee Preview */}
      {formData.valuation && selectedJurisdiction && formData.project_type && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Estimated Total Fee</p>
                <p className="text-xs text-muted-foreground">
                  {selectedJurisdiction.name} • {formData.project_type}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">
                ${calculateEstimatedFee().toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Preview */}
      {formData.jurisdiction_id && formData.project_type && (
        <Card>
          <CardHeader>
            <CardTitle>Task Pack Preview</CardTitle>
            <CardDescription>
              {getTaskPack().length} tasks will be generated for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {getTaskPack().map((task, index) => (
                <div key={index} className="flex items-center gap-3 p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-muted-foreground">
                      {task.order.toString().padStart(2, '0')}
                    </span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.name}</p>
                    <p className="text-xs text-muted-foreground">{task.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {task.assigned_to}
                    </Badge>
                    {(task as any).hasEmail && (
                      <Mail className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleGenerate}
          disabled={!formData.jurisdiction_id || !formData.project_type || !formData.valuation || createApplication.isPending}
          className="flex items-center gap-2"
        >
          <Building className="h-4 w-4" />
          {createApplication.isPending ? "Generating..." : "Generate Task Pack"}
        </Button>

        {selectedJurisdiction && (
          <Button 
            variant="outline"
            onClick={() => setShowEmailComposer(true)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Email County
          </Button>
        )}
      </div>

      <PermitEmailComposer
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        jurisdictionId={formData.jurisdiction_id}
        prefilledTemplate="permit_intro"
      />
    </div>
  );
};

export default TaskPackGenerator;