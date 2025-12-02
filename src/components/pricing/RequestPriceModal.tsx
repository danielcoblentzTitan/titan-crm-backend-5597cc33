import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestPriceModalProps {
  projectId?: string;
  projectName?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface Project {
  id: string;
  name: string;
  customer_name: string;
  status: string;
}

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  building_type: string;
}

interface Estimator {
  id: string;
  full_name: string;
  email: string;
}

export const RequestPriceModal = ({ projectId, projectName, isOpen, onClose, onSuccess }: RequestPriceModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestType, setRequestType] = useState<"project" | "lead">("project");
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [selectedLead, setSelectedLead] = useState("");
  const [scopeSummary, setScopeSummary] = useState("");
  const [assignedEstimator, setAssignedEstimator] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [attachments, setAttachments] = useState<File[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [estimators, setEstimators] = useState<Estimator[]>([]);
  const { toast } = useToast();

  // Control modal state
  const modalOpen = isOpen !== undefined ? isOpen : isModalOpen;
  const handleClose = () => {
    console.log('RequestPriceModal: handleClose called');
    if (onClose) {
      onClose();
    } else {
      setIsModalOpen(false);
    }
  };

  React.useEffect(() => {
    if (modalOpen) {
      loadData();
    }
  }, [modalOpen]);

  const loadData = async () => {
    try {
      // Load active projects 
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, customer_name, status')
        .in('status', ['Active', 'Planning', 'On Hold'])
        .order('name');
      
      if (projectsData) {
        setProjects(projectsData);
      }

      // Load active leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, first_name, last_name, company, building_type')
        .in('status', ['New', 'Contacted', 'Qualified', 'Proposal'])
        .is('archived_at', null)
        .order('created_at', { ascending: false });
      
      if (leadsData) {
        setLeads(leadsData);
      }

      // Load team members who have "estimator" role
      const { data: estimatorsData } = await supabase
        .from('team_members')
        .select('id, name, email, roles, role')
        .eq('is_active', true)
        .or('roles.cs.{"estimator"},role.eq.estimator') // Support both new roles array and old single role
        .order('name');
      
      if (estimatorsData) {
        // Transform data to match expected interface
        const formattedEstimators = estimatorsData.map(estimator => ({
          id: estimator.id,
          full_name: estimator.name,
          email: estimator.email
        }));
        setEstimators(formattedEstimators);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load required data",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const uploadAttachments = async (): Promise<string[]> => {
    const uploadedPaths: string[] = [];
    
    for (const file of attachments) {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `price-requests/${selectedProject}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      uploadedPaths.push(filePath);
    }
    
    return uploadedPaths;
  };

  const handleSubmit = async () => {
    if ((requestType === "project" && !selectedProject) || 
        (requestType === "lead" && !selectedLead) ||
        !scopeSummary || !assignedEstimator) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let attachmentPaths: string[] = [];
      
      if (attachments.length > 0) {
        attachmentPaths = await uploadAttachments();
      }

      const { error } = await supabase
        .from('price_requests')
        .insert({
          project_id: requestType === "project" ? selectedProject : null,
          lead_id: requestType === "lead" ? selectedLead : null,
          requested_by_user_id: (await supabase.auth.getUser()).data.user?.id,
          assigned_estimator_id: assignedEstimator,
          scope_summary: scopeSummary,
          attachments: attachmentPaths,
          due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : null,
          status: 'New'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price request submitted successfully",
      });

      // Reset form
      setRequestType("project");
      setSelectedProject(projectId || "");
      setSelectedLead("");
      setScopeSummary("");
      setAssignedEstimator("");
      setDueDate(undefined);
      setAttachments([]);
      handleClose();
      
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit price request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('RequestPriceModal render:', { modalOpen, isOpen, isModalOpen });
  
  return (
    <Dialog open={modalOpen} onOpenChange={(open) => {
      console.log('Dialog onOpenChange:', open);
      if (!open) {
        handleClose();
      } else {
        setIsModalOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
          onClick={() => {
            console.log('Request Price button clicked');
            setIsModalOpen(true);
          }}
        >
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="truncate">Request Price</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Price Estimate</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Type Selection */}
          {!projectId && (
            <div className="space-y-2">
              <Label>Request Type *</Label>
              <Select value={requestType} onValueChange={(value: "project" | "lead") => setRequestType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select request type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">Existing Project</SelectItem>
                  <SelectItem value="lead">New Lead/Opportunity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Project Selection */}
          {requestType === "project" && !projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.customer_name}) - {project.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lead Selection */}
          {requestType === "lead" && (
            <div className="space-y-2">
              <Label htmlFor="lead">Lead *</Label>
              <Select value={selectedLead} onValueChange={setSelectedLead}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.first_name} {lead.last_name} ({lead.company}) - {lead.building_type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {projectId && (
            <div className="space-y-2">
              <Label>Project</Label>
              <Input value={projectName || ""} disabled />
            </div>
          )}

          {/* Scope Summary */}
          <div className="space-y-2">
            <Label htmlFor="scope">Scope Summary *</Label>
            <Textarea
              id="scope"
              placeholder="Describe what needs to be priced..."
              value={scopeSummary}
              onChange={(e) => setScopeSummary(e.target.value)}
              rows={4}
            />
          </div>

          {/* Estimator Assignment */}
          <div className="space-y-2">
            <Label htmlFor="estimator">Assign to Estimator *</Label>
            <Select value={assignedEstimator} onValueChange={setAssignedEstimator}>
              <SelectTrigger>
                <SelectValue placeholder="Select an estimator" />
              </SelectTrigger>
              <SelectContent>
                {estimators.map((estimator) => (
                  <SelectItem key={estimator.id} value={estimator.id}>
                    {estimator.full_name} ({estimator.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments</Label>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <Label htmlFor="attachments" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Click to upload files or drag and drop
                  </span>
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </Label>
              </div>
              {attachments.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {attachments.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};