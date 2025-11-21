import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PermitApplication } from "@/integrations/supabase/hooks/usePermits";
import { Building, Calendar, DollarSign, Eye } from "lucide-react";
import PermitApplicationDetail from "./PermitApplicationDetail";

interface PermitApplicationsListProps {
  applications: PermitApplication[];
}

const PermitApplicationsList = ({ applications }: PermitApplicationsListProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Approved":
        return "default";
      case "Submitted":
        return "secondary";
      case "Under Review":
        return "outline";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No permit applications yet</h3>
        <p className="text-muted-foreground">
          Create your first permit application to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((application) => (
        <Card key={application.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {application.jurisdiction?.name}
                </CardTitle>
                <CardDescription>
                  {application.project_type}
                </CardDescription>
              </div>
              <Badge variant={getStatusVariant(application.status || "Draft")}>
                {application.status || "Draft"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {application.square_footage && (
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4" />
                <span>{application.square_footage.toLocaleString()} sq ft</span>
              </div>
            )}
            
            {application.estimated_fee && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>${application.estimated_fee.toFixed(2)} estimated fee</span>
              </div>
            )}
            
            {application.application_date && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Applied {new Date(application.application_date).toLocaleDateString()}</span>
              </div>
            )}

            {application.permit_number && (
              <div className="text-sm font-medium">
                Permit #: {application.permit_number}
              </div>
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
                <DialogHeader>
                  <DialogTitle>
                    Permit Application - {application.jurisdiction?.name}
                  </DialogTitle>
                </DialogHeader>
                <PermitApplicationDetail application={application} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PermitApplicationsList;