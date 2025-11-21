import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useJurisdictions } from "@/integrations/supabase/hooks/usePermits";
import { AlertTriangle, Calendar, CheckCircle, Edit, Eye, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminVerificationTracker = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: jurisdictions = [] } = useJurisdictions();

  // Calculate verification status
  const getVerificationStatus = (lastVerified?: string) => {
    if (!lastVerified) {
      return { status: "never", daysAgo: null, variant: "destructive" as const };
    }

    const lastDate = new Date(lastVerified);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return { status: "recent", daysAgo: diffDays, variant: "default" as const };
    } else if (diffDays <= 90) {
      return { status: "moderate", daysAgo: diffDays, variant: "secondary" as const };
    } else if (diffDays <= 180) {
      return { status: "old", daysAgo: diffDays, variant: "outline" as const };
    } else {
      return { status: "critical", daysAgo: diffDays, variant: "destructive" as const };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "recent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "moderate":
        return <Calendar className="h-4 w-4 text-yellow-600" />;
      case "old":
      case "critical":
      case "never":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, daysAgo: number | null) => {
    switch (status) {
      case "never":
        return "Never verified";
      case "recent":
        return `Verified ${daysAgo} days ago`;
      case "moderate":
        return `Verified ${daysAgo} days ago`;
      case "old":
        return `Needs verification (${daysAgo} days ago)`;
      case "critical":
        return `URGENT: ${daysAgo} days since verification`;
      default:
        return "Unknown";
    }
  };

  const handleMarkAsVerified = async (jurisdictionId: string) => {
    try {
      // In a real implementation, this would update the database
      // For now, we'll simulate it with a success message
      
      toast({
        title: "Success",
        description: "Jurisdiction marked as verified"
      });
      
      // TODO: Update jurisdiction with current date as last_verified
      // await updateJurisdiction({ id: jurisdictionId, last_verified: new Date().toISOString() });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
    }
  };

  const criticalCount = jurisdictions.filter(j => {
    const status = getVerificationStatus(j.updated_at);
    return status.status === "critical" || status.status === "never";
  }).length;

  const oldCount = jurisdictions.filter(j => {
    const status = getVerificationStatus(j.updated_at);
    return status.status === "old";
  }).length;

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      {(criticalCount > 0 || oldCount > 0) && (
        <Alert variant={criticalCount > 0 ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {criticalCount > 0 && (
              <>
                <strong>{criticalCount}</strong> jurisdiction{criticalCount !== 1 ? 's' : ''} need urgent verification (180+ days).
              </>
            )}
            {oldCount > 0 && (
              <>
                {criticalCount > 0 && " "}
                <strong>{oldCount}</strong> jurisdiction{oldCount !== 1 ? 's' : ''} should be verified soon (90-180 days).
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Verification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Jurisdiction Verification Tracker
          </CardTitle>
          <CardDescription>
            Track when jurisdiction information was last verified and get alerts for outdated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jurisdictions.map((jurisdiction) => {
              const verification = getVerificationStatus(jurisdiction.updated_at);
              
              return (
                <Card key={jurisdiction.id} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{jurisdiction.name}</h4>
                        {getStatusIcon(verification.status)}
                      </div>
                      
                      <div className="space-y-2">
                        <Badge variant={verification.variant} className="text-xs">
                          {getStatusText(verification.status, verification.daysAgo)}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground">
                          Last updated: {jurisdiction.updated_at 
                            ? new Date(jurisdiction.updated_at).toLocaleDateString()
                            : "Never"
                          }
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsVerified(jurisdiction.id)}
                          className="flex-1 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Verified
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="px-2">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{jurisdiction.name} - Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong>Phone:</strong> {jurisdiction.contact_phone || "Not provided"}
                                </div>
                                <div>
                                  <strong>Email:</strong> {jurisdiction.contact_email || "Not provided"}
                                </div>
                                <div className="col-span-2">
                                  <strong>Address:</strong> {jurisdiction.contact_address || "Not provided"}
                                </div>
                                <div className="col-span-2">
                                  <strong>Portal:</strong>{" "}
                                  {jurisdiction.portal_url ? (
                                    <a 
                                      href={jurisdiction.portal_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {jurisdiction.portal_url}
                                    </a>
                                  ) : (
                                    "Not provided"
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <strong>Project Types:</strong>
                                <div className="mt-2 space-y-1">
                                  {jurisdiction.project_types.map((pt: any, index: number) => (
                                    <Badge key={index} variant="outline" className="mr-2">
                                      {pt.type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div className="pt-4 border-t">
                                <Label htmlFor="notes">Verification Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add notes about this verification..."
                                  value={verificationNotes}
                                  onChange={(e) => setVerificationNotes(e.target.value)}
                                  rows={3}
                                />
                                <Button
                                  className="mt-2"
                                  onClick={() => {
                                    handleMarkAsVerified(jurisdiction.id);
                                    setVerificationNotes("");
                                  }}
                                >
                                  Save Verification
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {jurisdictions.filter(j => getVerificationStatus(j.updated_at).status === "recent").length}
            </div>
            <div className="text-sm text-muted-foreground">Recently Verified</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {jurisdictions.filter(j => getVerificationStatus(j.updated_at).status === "moderate").length}
            </div>
            <div className="text-sm text-muted-foreground">Moderate Age</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {oldCount}
            </div>
            <div className="text-sm text-muted-foreground">Need Verification</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {criticalCount}
            </div>
            <div className="text-sm text-muted-foreground">Critical</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminVerificationTracker;