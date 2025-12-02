
import { useMemo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, DollarSign, Edit, Trash2, MapPin, Clock, User, FileText, Camera, MessageCircle, BarChart3, CheckCircle, MoreVertical, ClipboardList, Settings2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import type { Project } from "@/services/supabaseService";
import { CustomerPortalViewButton } from "../CustomerPortalViewButton";
import { CameraCaptureDialog } from "@/components/CameraCaptureDialog";
import BudgetPlanner from "../BudgetPlanner";
import { FinancialDashboard } from "@/components/financial/FinancialDashboard";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { supabase } from "@/integrations/supabase/client";
import { PunchlistManager } from "@/components/punchlist/PunchlistManager";
import { ProjectSettingsDialog } from "@/components/ProjectSettingsDialog";

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onPhaseUpdate: (projectId: string, newPhase: string) => void;
  onUpdate: () => void;
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

export const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  onPhaseUpdate,
  onUpdate 
}: ProjectCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  
  // Use centralized phase management
  const { currentPhase, currentProgress, phases, isLoading: phasesLoading } = useProjectPhases(project.id);

  const handlePhaseUpdate = (newPhase: string) => {
    onPhaseUpdate(project.id, newPhase);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg truncate pr-2">{project.name}</CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center mt-1">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{project.customer_name}</span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {project.description?.toLowerCase().includes('barndo') ? 'Barndominium' : 
               project.description?.toLowerCase().includes('commercial') ? 'Commercial' : 'Residential'}
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            
            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <ProjectSettingsDialog 
                project={project} 
                onUpdate={onUpdate}
                trigger={
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(project)}
                className="p-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="p-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600">⚠️ Delete Project - IRREVERSIBLE ACTION</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p className="font-semibold">You are about to permanently delete:</p>
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium text-red-800">Project: {project.name}</p>
                        <p className="text-red-700">Customer: {project.customer_name}</p>
                        <p className="text-red-700">Budget: ${project.budget?.toLocaleString()}</p>
                      </div>
                      <p className="text-red-600 font-medium">
                        This action will permanently delete ALL project data including:
                      </p>
                      <ul className="text-red-600 list-disc list-inside space-y-1">
                        <li>Project files and documents</li>
                        <li>Photos and progress updates</li>
                        <li>Schedule and timeline data</li>
                        <li>Messages and communications</li>
                        <li>Financial records and payments</li>
                      </ul>
                      <p className="text-red-800 font-bold">
                        THIS CANNOT BE UNDONE!
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => onDelete(project.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Yes, Delete Project Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ProjectSettingsDialog 
                    project={project} 
                    onUpdate={onUpdate}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuItem onClick={() => onEdit(project)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">⚠️ Delete Project - IRREVERSIBLE ACTION</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p className="font-semibold">You are about to permanently delete:</p>
                          <div className="bg-red-50 p-3 rounded border border-red-200">
                            <p className="font-medium text-red-800">Project: {project.name}</p>
                            <p className="text-red-700">Customer: {project.customer_name}</p>
                            <p className="text-red-700">Budget: ${project.budget?.toLocaleString()}</p>
                          </div>
                          <p className="text-red-600 font-medium">
                            This action will permanently delete ALL project data including:
                          </p>
                          <ul className="text-red-600 list-disc list-inside space-y-1">
                            <li>Project files and documents</li>
                            <li>Photos and progress updates</li>
                            <li>Schedule and timeline data</li>
                            <li>Messages and communications</li>
                            <li>Financial records and payments</li>
                          </ul>
                          <p className="text-red-800 font-bold">
                            THIS CANNOT BE UNDONE!
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => onDelete(project.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Delete Project Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs sm:text-sm mb-2">
              <span>Progress</span>
              <span className="font-semibold">{Math.round(currentProgress)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
          
          {/* Enhanced Project Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Start Date</p>
                <p className="text-muted-foreground truncate">{new Date(project.start_date.split('T')[0] + 'T12:00:00Z').toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Est. Completion</p>
                <p className="text-muted-foreground truncate">{new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z').toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground truncate">
                  {Math.ceil((new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z').getTime() - new Date(project.start_date.split('T')[0] + 'T12:00:00Z').getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">Budget</p>
                <p className="text-muted-foreground truncate">${project.budget?.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Project Type Badge (phase display moved below) */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {project.description?.toLowerCase().includes('barndo') ? 'Barndominium' : 
               project.description?.toLowerCase().includes('commercial') ? 'Commercial' : 'Residential'}
            </Badge>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-900">
                  Phase: {currentPhase || project.phase || "Planning & Permits"}
                </p>
              </div>
              {(!project.phase || project.phase === "Planning & Permits") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePhaseUpdate("Pre Construction")}
                  className="text-xs sm:text-sm bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  Permit Approved
                </Button>
              )}
            </div>
          </div>
          
          {project.address && (
            <div className="flex items-start space-x-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{project.address}, {project.city}, {project.state} {project.zip}</span>
            </div>
          )}
          
          {project.description && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              <p className="line-clamp-2">{project.description}</p>
            </div>
          )}

          {/* Enhanced Action Buttons with Distinct Colors */}
          <div className="grid grid-cols-3 sm:flex gap-2 pt-2">
            <CustomerPortalViewButton 
              project={project} 
              size="sm"
            />
            <FinancialDashboard 
              project={project} 
              onUpdate={onUpdate}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/documents/${project.id}`)} 
              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Docs</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/schedule/${project.id}`)} 
              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Schedule</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/messages/${project.id}`)} 
              className="bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100"
            >
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Messages</span>
              <span className="sm:hidden">Messages</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/summary/${project.id}`)} 
              className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Summary</span>
              <span className="sm:hidden">Summary</span>
            </Button>
            <CameraCaptureDialog
              entityId={project.id}
              entityType="project"
              onUploadComplete={onUpdate}
              customerInfo={{
                firstName: project.customer_name.split(' ')[0] || '',
                lastName: project.customer_name.split(' ').slice(1).join(' ') || project.customer_name
              }}
              triggerButton={
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100"
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Take Photo</span>
                  <span className="sm:hidden">Photo</span>
                </Button>
              }
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/punchlist/${project.id}`)}
              className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Punchlist</span>
              <span className="sm:hidden">Punch</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
