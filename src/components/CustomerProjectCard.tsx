
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustomerPortalViewButton } from "@/components/CustomerPortalViewButton";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { SteppedProgressBar } from "@/components/ui/SteppedProgressBar";

interface CustomerProjectCardProps {
  project: {
    id: string;
    name: string;
    customer_name: string;
    status: string;
    progress: number;
    start_date: string;
    estimated_completion: string;
    budget: number;
    description?: string;
  };
  showActionButtons?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Planning":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "In Progress":
      return "bg-[#003562]/10 text-[#003562] border-[#003562]/20";
    case "Completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "On Hold":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const CustomerProjectCard = ({ project, showActionButtons = false }: CustomerProjectCardProps) => {
  const navigate = useNavigate();
  
  // Use phase calculation for accurate progress
  const { currentProgress, currentPhase } = useProjectPhases(project.id);

  return (
    <Card className="bg-gray-50 border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <p className="text-sm text-gray-600">{project.customer_name}</p>
          </div>
          <Badge className={getStatusColor(project.status)}>
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-3">
              <span className="font-medium">Project Progress</span>
            </div>
            <SteppedProgressBar 
              currentPhase={currentPhase || 'Planning & Permits'} 
              currentProgress={currentProgress}
              variant="compact"
              showLabels={true}
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Start Date</p>
                <p className="text-gray-600">{new Date(project.start_date.split('T')[0] + 'T12:00:00Z').toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Est. Completion</p>
                <p className="text-gray-600">{new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z').toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div>
                <p className="font-medium">Budget</p>
                <p className="text-gray-600">${project.budget?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {project.description && (
            <div className="text-sm text-gray-600">
              {project.description}
            </div>
          )}

          {/* Action Buttons - Only show if enabled */}
          {showActionButtons && (
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/schedule/${project.id}`)}>
                <Calendar className="h-4 w-4 mr-1" />
                Schedule
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/documents/${project.id}`)}>
                <FileText className="h-4 w-4 mr-1" />
                Documents
              </Button>
              <CustomerPortalViewButton 
                project={{
                  id: project.id,
                  name: project.name,
                  customer_name: project.customer_name,
                  status: project.status as "Planning" | "In Progress" | "Completed" | "On Hold",
                  progress: project.progress,
                  start_date: project.start_date,
                  estimated_completion: project.estimated_completion,
                  budget: project.budget,
                  customer_id: '',
                  created_at: '',
                  updated_at: '',
                  description: project.description
                }} 
                size="sm" 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
