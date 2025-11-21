import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, Clock, CheckCircle, XCircle, PenTool } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DigitalSignature from "@/components/DigitalSignature";

interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  status: string;
  cost_impact: number;
  schedule_impact_days: number;
  requested_date: string;
  requested_by: string;
  approved_by: string | null;
  approved_date: string | null;
  notes: string;
  payment_plan_type?: string;
  payment_plan_data?: any;
}

interface CustomerChangeOrderManagerProps {
  projectId: string;
}

export const CustomerChangeOrderManager = ({ projectId }: CustomerChangeOrderManagerProps) => {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [selectedChangeOrderId, setSelectedChangeOrderId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchChangeOrders();
  }, [projectId]);

  const fetchChangeOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('requested_date', { ascending: false });

      if (error) throw error;
      setChangeOrders((data || []) as ChangeOrder[]);
    } catch (error) {
      console.error('Error fetching change orders:', error);
      toast({
        title: "Error",
        description: "Failed to load change orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignChangeOrder = (changeOrderId: string) => {
    console.log('handleSignChangeOrder called with:', changeOrderId);
    setSelectedChangeOrderId(changeOrderId);
    setSignatureDialogOpen(true);
    console.log('Signature dialog should be opening');
  };

  const handleSignatureComplete = async () => {
    console.log('handleSignatureComplete called for change order:', selectedChangeOrderId);
    // The signature has been saved, now approve the change order
    try {
      console.log('Attempting to update change order status to Approved');
      const { data, error } = await supabase
        .from('change_orders')
        .update({ 
          status: 'Approved',
          approved_date: new Date().toISOString()
          // Note: approved_by expects UUID but we're customers, so leaving it null for now
        })
        .eq('id', selectedChangeOrderId);

      console.log('Change order update result:', { data, error });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Change order updated successfully, closing dialog');
      setSignatureDialogOpen(false);
      setSelectedChangeOrderId("");
      fetchChangeOrders();

      toast({
        title: "Success",
        description: "Change order signed and approved",
      });
    } catch (error) {
      console.error('Error approving change order:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      toast({
        title: "Error",
        description: "Failed to approve change order after signing",
        variant: "destructive",
      });
    }
  };

  const updateChangeOrderStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('change_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      fetchChangeOrders();

      toast({
        title: "Success",
        description: `Change order ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating change order:', error);
      toast({
        title: "Error",
        description: "Failed to update change order",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const parsePaymentPlan = (paymentPlanData: any) => {
    try {
      if (typeof paymentPlanData === 'string') {
        return JSON.parse(paymentPlanData);
      }
      return paymentPlanData || [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading change orders...</p>
        </CardContent>
      </Card>
    );
  }

  const pendingChangeOrders = changeOrders.filter(co => co.status === 'Pending');
  const completedChangeOrders = changeOrders.filter(co => co.status !== 'Pending');

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{changeOrders.length}</p>
                <p className="text-sm text-muted-foreground">Total Change Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingChangeOrders.length}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  ${changeOrders
                    .filter(co => co.status === 'Approved')
                    .reduce((sum, co) => sum + (co.cost_impact || 0), 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Approved Cost Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Change Orders */}
      {pendingChangeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Your Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingChangeOrders.map((changeOrder) => {
                const paymentPlan = parsePaymentPlan(changeOrder.payment_plan_data);
                const paymentPlanText = changeOrder.payment_plan_type === 'one_payment' ? 'One Payment' :
                  changeOrder.payment_plan_type === 'two_payments' ? 'Two Payments' :
                  changeOrder.payment_plan_type === 'three_payments' ? 'Three Payments' : 'One Payment';

                return (
                  <Card key={changeOrder.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{changeOrder.title}</h4>
                              <Badge className={getStatusColor(changeOrder.status)}>
                                {changeOrder.status}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{changeOrder.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Cost Impact: ${changeOrder.cost_impact?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Schedule Impact: {changeOrder.schedule_impact_days || 0} days</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Requested: {new Date(changeOrder.requested_date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
                                <span>Payment Plan: {paymentPlanText}</span>
                              </div>
                            </div>

                            {paymentPlan.length > 0 && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <h5 className="text-sm font-medium mb-2">Payment Schedule:</h5>
                                <div className="space-y-1">
                                  {paymentPlan.map((payment: any, index: number) => (
                                    <div key={index} className="flex justify-between text-xs">
                                      <span>Payment {payment.payment_number}:</span>
                                      <span className="font-medium">
                                        ${payment.amount?.toLocaleString()} 
                                        {payment.due_date && ` (Due: ${new Date(payment.due_date).toLocaleDateString()})`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {changeOrder.requested_by && (
                              <p className="text-xs text-muted-foreground">
                                Requested by: {changeOrder.requested_by}
                              </p>
                            )}

                            {changeOrder.notes && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                                <p className="text-sm">{changeOrder.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
                          <Button
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            variant="outline"
                            onClick={() => handleSignChangeOrder(changeOrder.id)}
                          >
                            <PenTool className="h-4 w-4 mr-1" />
                            Sign Change Order
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => updateChangeOrderStatus(changeOrder.id, 'Rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject Change Order
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Change Orders */}
      {completedChangeOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Change Order History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedChangeOrders.map((changeOrder) => (
                <Card key={changeOrder.id} className={`border-l-4 ${
                  changeOrder.status === 'Approved' ? 'border-l-green-500' : 'border-l-red-500'
                }`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{changeOrder.title}</h4>
                          <Badge className={getStatusColor(changeOrder.status)}>
                            {changeOrder.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{changeOrder.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>${changeOrder.cost_impact?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{changeOrder.schedule_impact_days || 0} days</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{changeOrder.status}: {changeOrder.approved_date ? 
                              new Date(changeOrder.approved_date).toLocaleDateString() : 
                              new Date(changeOrder.requested_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {changeOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Change Orders</h3>
            <p className="text-muted-foreground">
              There are currently no change orders for this project.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Digital Signature Dialog */}
      <DigitalSignature
        documentId={selectedChangeOrderId}
        documentType="Change Order"
        isOpen={signatureDialogOpen}
        onOpenChange={setSignatureDialogOpen}
        onSignatureComplete={handleSignatureComplete}
      />
    </div>
  );
};