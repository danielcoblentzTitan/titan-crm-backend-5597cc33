import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermitApplication, usePermitTasks, useUpdatePermitTask } from "@/integrations/supabase/hooks/usePermits";
import { Building, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BulkTaskOperations from "./BulkTaskOperations";
import PDFExport from "./PDFExport";

interface PermitApplicationDetailProps {
  application: PermitApplication;
}

const PermitApplicationDetail = ({ application }: PermitApplicationDetailProps) => {
  const { data: tasks = [] } = usePermitTasks(application.id);
  const updateTask = useUpdatePermitTask();

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask.mutateAsync({ 
        id: taskId, 
        status: newStatus,
        completion_date: newStatus === "Completed" ? new Date().toISOString().split('T')[0] : undefined
      });
      toast({
        title: "Success",
        description: "Task status updated"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive"
      });
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "Blocked":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusVariant = (status: string) => {
    switch (status) {
      case "Completed":
        return "default";
      case "In Progress":
        return "secondary";
      case "Blocked":
        return "destructive";
      default:
        return "outline";
    }
  };

  const completedTasks = tasks.filter(task => task.status === "Completed").length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Application Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Application Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Jurisdiction</p>
            <p className="text-lg">{application.jurisdiction?.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Project Type</p>
            <p className="text-lg">{application.project_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Square Footage</p>
            <p className="text-lg">{application.square_footage?.toLocaleString()} sq ft</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estimated Fee</p>
            <p className="text-lg">${application.estimated_fee?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={application.status === "Approved" ? "default" : "secondary"}>
              {application.status}
            </Badge>
          </div>
          {application.permit_number && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Permit Number</p>
              <p className="text-lg font-mono">{application.permit_number}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList>
          <TabsTrigger value="tasks">Tasks ({completedTasks}/{tasks.length})</TabsTrigger>
          <TabsTrigger value="checklist">Requirements</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="exports">Export & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>
                {progressPercentage.toFixed(0)}% complete • {completedTasks} of {tasks.length} tasks done
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center">
            <BulkTaskOperations applicationId={application.id} />
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTaskStatusIcon(task.status || "Pending")}
                      <div>
                        <p className="font-medium">{task.task_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {task.assigned_to || "Unassigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTaskStatusVariant(task.status || "Pending")}>
                        {task.status || "Pending"}
                      </Badge>
                      {task.status !== "Completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTaskStatusChange(task.id, 
                            task.status === "Pending" ? "In Progress" : "Completed"
                          )}
                          disabled={updateTask.isPending}
                        >
                          {task.status === "Pending" ? "Start" : "Complete"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Documents & Steps</CardTitle>
              <CardDescription>
                Based on {application.jurisdiction?.name} requirements for {application.project_type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {application.jurisdiction?.project_types
                .find((pt: any) => pt.type === application.project_type)
                ?.checklist?.map((item: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 py-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>{item}</span>
                  </div>
                )) || (
                <p className="text-muted-foreground">No checklist available for this project type.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdiction Contact Information</CardTitle>
              <CardDescription>{application.jurisdiction?.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.jurisdiction?.contact_phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{application.jurisdiction.contact_phone}</p>
                </div>
              )}
              {application.jurisdiction?.contact_email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{application.jurisdiction.contact_email}</p>
                </div>
              )}
              {application.jurisdiction?.contact_address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p>{application.jurisdiction.contact_address}</p>
                </div>
              )}
              {application.jurisdiction?.portal_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Online Portal</p>
                  <Button variant="outline" asChild>
                    <a 
                      href={application.jurisdiction.portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit Portal
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export & Actions</CardTitle>
              <CardDescription>
                Generate PDFs and perform bulk operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <PDFExport
                  application={application}
                  tasks={tasks}
                  type="checklist"
                />
                <PDFExport
                  application={application}
                  type="application_summary"
                />
                <BulkTaskOperations applicationId={application.id} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermitApplicationDetail;