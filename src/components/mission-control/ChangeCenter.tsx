import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChangeRequest {
  id: string;
  project_id: string;
  phase_id: string | null;
  requested_by: string;
  requested_by_type: string;
  title: string;
  description: string | null;
  status: string;
  delta_days: number;
  delta_cost: number;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  reason: string | null;
  // These are from joins and may be null if join fails
  project_name?: string;
  phase_name?: string;
  requester_name?: string;
  requester_email?: string;
}

interface ImpactAnalysis {
  scheduleImpact: string;
  costImpact: string;
  resourceImpact: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const ChangeCenter: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'Approved' | 'Rejected' | null>(null);

  const loadChangeRequests = async () => {
    setLoading(true);
    try {
      // First get change requests with basic project and phase info
      const { data: changeRequestsData, error: changeRequestsError } = await supabase
        .from("change_requests")
        .select(`
          *,
          projects!inner(name),
          project_phases(name)
        `)
        .order("created_at", { ascending: false });

      if (changeRequestsError) throw changeRequestsError;

      // Transform the data to match our interface
      const transformedData: ChangeRequest[] = (changeRequestsData || []).map(req => ({
        ...req,
        project_name: req.projects?.name || 'Unknown Project',
        phase_name: req.project_phases?.name || null,
        requester_name: req.requested_by_type === 'customer' ? 'Customer' : req.requested_by_type,
        requester_email: null
      }));

      setChangeRequests(transformedData);
    } catch (e) {
      console.error("Failed to load change requests", e);
      toast({ title: "Error", description: "Failed to load change requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChangeRequests();
  }, []);

  const analyzeImpact = (request: ChangeRequest): ImpactAnalysis => {
    const absTime = Math.abs(request.delta_days);
    const absCost = Math.abs(request.delta_cost);
    
    let scheduleImpact = "None";
    if (absTime > 0) {
      scheduleImpact = request.delta_days > 0 
        ? `+${request.delta_days} days delay`
        : `${Math.abs(request.delta_days)} days saved`;
    }

    let costImpact = "None";
    if (absCost > 0) {
      costImpact = request.delta_cost > 0
        ? `+$${request.delta_cost.toLocaleString()} increase`
        : `-$${Math.abs(request.delta_cost).toLocaleString()} savings`;
    }

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (absTime > 7 || absCost > 10000) riskLevel = 'high';
    else if (absTime > 3 || absCost > 5000) riskLevel = 'medium';

    return {
      scheduleImpact,
      costImpact,
      resourceImpact: request.phase_name ? `Affects ${request.phase_name}` : "Project-wide impact",
      riskLevel
    };
  };

  const handleDecision = async (requestId: string, decision: 'Approved' | 'Rejected', reason?: string) => {
    try {
      const { error } = await supabase
        .from("change_requests")
        .update({
          status: decision,
          decided_by: (await supabase.auth.getUser()).data.user?.id,
          decided_at: new Date().toISOString(),
          reason: reason || null
        })
        .eq("id", requestId);

      if (error) throw error;

      toast({ 
        title: `Change Request ${decision}`, 
        description: `The change request has been ${decision.toLowerCase()}.` 
      });
      
      await loadChangeRequests();
      setShowDecisionDialog(false);
      setDecisionReason("");
      setPendingDecision(null);
      setSelectedRequest(null);
    } catch (e) {
      console.error("Failed to update change request", e);
      toast({ title: "Error", description: "Failed to update change request", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
    }
  };

  const pendingRequests = changeRequests.filter(r => r.status === 'Pending');
  const recentDecisions = changeRequests.filter(r => r.status !== 'Pending').slice(0, 10);

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Change Center</h2>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </section>
    );
  }

  return (
    <section aria-label="Change Center" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Change Center</h2>
        <Button variant="outline" size="sm" onClick={loadChangeRequests}>
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Approved This Week</p>
                <p className="text-2xl font-bold">
                  {changeRequests.filter(r => 
                    r.status === 'Approved' && 
                    new Date(r.decided_at || '') > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-muted-foreground">Avg Cost Impact</p>
                <p className="text-2xl font-bold">
                  ${Math.abs(changeRequests.reduce((sum, r) => sum + r.delta_cost, 0) / Math.max(changeRequests.length, 1)).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Change Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map(request => {
              const impact = analyzeImpact(request);
              return (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium">{request.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {request.project_name} {request.phase_name && `• ${request.phase_name}`}
                      </p>
                      {request.description && (
                        <p className="text-sm">{request.description}</p>
                      )}
                    </div>
                    <Badge className={getRiskColor(impact.riskLevel)}>
                      {impact.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span>{impact.scheduleImpact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span>{impact.costImpact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <span>{request.requester_name || request.requested_by_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedRequest(request);
                        setPendingDecision('Approved');
                        setShowDecisionDialog(true);
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setSelectedRequest(request);
                        setPendingDecision('Rejected');
                        setShowDecisionDialog(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Requested {format(parseISO(request.created_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent Decisions */}
      {recentDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDecisions.map(request => (
                <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.project_name} • {request.phase_name || "Project-wide"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {request.decided_at && format(parseISO(request.decided_at), "MMM dd")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {changeRequests.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No change requests found.</p>
              <p className="text-sm">Change requests will appear here when submitted.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDecision} Change Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  <strong>{selectedRequest.title}</strong>
                  <br />
                  {selectedRequest.project_name} {selectedRequest.phase_name && `• ${selectedRequest.phase_name}`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                {pendingDecision === 'Approved' ? 'Approval' : 'Rejection'} Reason (Optional)
              </label>
              <Textarea
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                placeholder={`Explain why this change request is being ${pendingDecision?.toLowerCase()}...`}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={pendingDecision === 'Approved' ? 'default' : 'destructive'}
              onClick={() => {
                if (selectedRequest && pendingDecision) {
                  handleDecision(selectedRequest.id, pendingDecision, decisionReason);
                }
              }}
            >
              {pendingDecision === 'Approved' ? 'Approve' : 'Reject'} Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};