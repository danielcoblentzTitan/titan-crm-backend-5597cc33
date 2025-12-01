import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Calendar, DollarSign, Clock, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/services/supabaseService";

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
  payment_plan_data?: any; // Using any for JSON data from Supabase
}

interface PaymentPlan {
  payment_number: number;
  amount: number;
  due_date: string;
}

interface ChangeOrderManagerProps {
  project: Project;
  onUpdate?: () => void;
}

export const ChangeOrderManager = ({ project, onUpdate }: ChangeOrderManagerProps) => {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingChangeOrder, setEditingChangeOrder] = useState<ChangeOrder | null>(null);
  const [newChangeOrder, setNewChangeOrder] = useState({
    title: '',
    description: '',
    cost_impact: 0,
    schedule_impact_days: 0,
    requested_by: '',
    notes: '',
    payment_plan_type: 'one_payment',
  });
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan[]>([
    { payment_number: 1, amount: 0, due_date: '' }
  ]);
  const { toast } = useToast();

  useEffect(() => {
    fetchChangeOrders();
  }, [project.id]);

  const fetchChangeOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', project.id)
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
    }
  };

  const updatePaymentPlanType = (type: string) => {
    setNewChangeOrder({ ...newChangeOrder, payment_plan_type: type });
    
    const numPayments = type === 'one_payment' ? 1 : type === 'two_payments' ? 2 : 3;
    const amountPerPayment = Math.round(newChangeOrder.cost_impact / numPayments * 100) / 100;
    
    const newPlan = Array.from({ length: numPayments }, (_, i) => ({
      payment_number: i + 1,
      amount: i === numPayments - 1 ? 
        newChangeOrder.cost_impact - (amountPerPayment * (numPayments - 1)) : 
        amountPerPayment,
      due_date: ''
    }));
    
    setPaymentPlan(newPlan);
  };

  const updatePaymentPlanItem = (index: number, field: keyof PaymentPlan, value: string | number) => {
    const updated = [...paymentPlan];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentPlan(updated);
  };

  const createChangeOrder = async () => {
    try {
      const { error } = await supabase
        .from('change_orders')
        .insert({
          project_id: project.id,
          ...newChangeOrder,
          payment_plan_data: JSON.stringify(paymentPlan),
        });

      if (error) throw error;

      resetForm();
      fetchChangeOrders();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Change order created successfully",
      });
    } catch (error) {
      console.error('Error creating change order:', error);
      toast({
        title: "Error",
        description: "Failed to create change order",
        variant: "destructive",
      });
    }
  };

  const updateChangeOrder = async () => {
    if (!editingChangeOrder) return;
    
    try {
      const { error } = await supabase
        .from('change_orders')
        .update({
          ...newChangeOrder,
          payment_plan_data: JSON.stringify(paymentPlan),
        })
        .eq('id', editingChangeOrder.id);

      if (error) throw error;

      resetForm();
      fetchChangeOrders();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Change order updated successfully",
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

  const resetForm = () => {
    setIsCreating(false);
    setIsEditing(false);
    setEditingChangeOrder(null);
    setNewChangeOrder({
      title: '',
      description: '',
      cost_impact: 0,
      schedule_impact_days: 0,
      requested_by: '',
      notes: '',
      payment_plan_type: 'one_payment',
    });
    setPaymentPlan([{ payment_number: 1, amount: 0, due_date: '' }]);
  };

  const updateChangeOrderStatus = async (id: string, status: string) => {
    try {
      const updateData: any = { status };
      
      if (status === 'Approved') {
        updateData.approved_date = new Date().toISOString();
        
        // Create invoices for approved change order based on payment plan
        await createChangeOrderInvoices(id);
      }

      const { error } = await supabase
        .from('change_orders')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      fetchChangeOrders();
      onUpdate?.();

      toast({
        title: "Success",
        description: status === 'Approved' 
          ? `Change order approved and invoices created` 
          : `Change order ${status.toLowerCase()}`,
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

  const handleEdit = (changeOrder: ChangeOrder) => {
    setEditingChangeOrder(changeOrder);
    setNewChangeOrder({
      title: changeOrder.title,
      description: changeOrder.description,
      cost_impact: changeOrder.cost_impact,
      schedule_impact_days: changeOrder.schedule_impact_days,
      requested_by: changeOrder.requested_by,
      notes: changeOrder.notes,
      payment_plan_type: changeOrder.payment_plan_type || 'one_payment',
    });

    // Parse payment plan data
    try {
      const planData = typeof changeOrder.payment_plan_data === 'string' 
        ? JSON.parse(changeOrder.payment_plan_data) 
        : changeOrder.payment_plan_data || [{ payment_number: 1, amount: changeOrder.cost_impact, due_date: '' }];
      setPaymentPlan(planData);
    } catch {
      setPaymentPlan([{ payment_number: 1, amount: changeOrder.cost_impact, due_date: '' }]);
    }

    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this change order?')) return;

    try {
      const { error } = await supabase
        .from('change_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchChangeOrders();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Change order deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting change order:', error);
      toast({
        title: "Error",
        description: "Failed to delete change order",
        variant: "destructive",
      });
    }
  };

  const createChangeOrderInvoices = async (changeOrderId: string) => {
    try {
      const changeOrder = changeOrders.find(co => co.id === changeOrderId);
      if (!changeOrder || changeOrder.cost_impact <= 0) return;

      // Parse payment plan data if it's a string, otherwise use as array
      let paymentPlans: PaymentPlan[];
      try {
        paymentPlans = typeof changeOrder.payment_plan_data === 'string' 
          ? JSON.parse(changeOrder.payment_plan_data) 
          : changeOrder.payment_plan_data || [
            { payment_number: 1, amount: changeOrder.cost_impact, due_date: '' }
          ];
      } catch {
        paymentPlans = [{ payment_number: 1, amount: changeOrder.cost_impact, due_date: '' }];
      }

      // Create an invoice for each payment in the plan
      for (const payment of paymentPlans) {
        const timestamp = Date.now() + payment.payment_number;
        const invoiceNumber = `${project.customer_name.split(' ').pop()} - CO-${timestamp}`;
        
        // Use the payment due date or default to 30 days from now
        const dueDate = payment.due_date || 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            customer_id: project.customer_id,
            project_id: project.id,
            invoice_number: invoiceNumber,
            customer_name: project.customer_name,
            project_name: project.name,
            issue_date: new Date().toISOString().split('T')[0],
            due_date: dueDate,
            total: payment.amount,
            subtotal: payment.amount,
            tax: 0,
            status: 'Draft',
            job_type: 'Change Order',
            notes: `Change Order: ${changeOrder.title} - Payment ${payment.payment_number} of ${paymentPlans.length}`,
          });

        if (invoiceError) {
          console.error('Error creating change order invoice:', invoiceError);
          throw invoiceError;
        }
      }
    } catch (error) {
      console.error('Error creating change order invoices:', error);
      // Don't throw error here to prevent blocking the change order approval
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

  const totalCostImpact = changeOrders
    .filter(co => co.status === 'Approved')
    .reduce((sum, co) => sum + (co.cost_impact || 0), 0);

  const totalScheduleImpact = changeOrders
    .filter(co => co.status === 'Approved')
    .reduce((sum, co) => sum + (co.schedule_impact_days || 0), 0);

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
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${totalCostImpact.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Approved Cost Impact</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalScheduleImpact}</p>
                <p className="text-sm text-muted-foreground">Schedule Impact (Days)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Orders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Change Orders</CardTitle>
          <Dialog open={isCreating || isEditing} onOpenChange={(open) => {
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Change Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Change Order' : 'Create Change Order'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newChangeOrder.title}
                    onChange={(e) => setNewChangeOrder({ ...newChangeOrder, title: e.target.value })}
                    placeholder="Change order title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newChangeOrder.description}
                    onChange={(e) => setNewChangeOrder({ ...newChangeOrder, description: e.target.value })}
                    placeholder="Detailed description of the change"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_impact">Cost Impact ($)</Label>
                    <Input
                      id="cost_impact"
                      type="number"
                      value={newChangeOrder.cost_impact}
                      onChange={(e) => setNewChangeOrder({ ...newChangeOrder, cost_impact: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="schedule_impact">Schedule Impact (Days)</Label>
                    <Input
                      id="schedule_impact"
                      type="number"
                      value={newChangeOrder.schedule_impact_days}
                      onChange={(e) => setNewChangeOrder({ ...newChangeOrder, schedule_impact_days: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="requested_by">Requested By</Label>
                  <Input
                    id="requested_by"
                    value={newChangeOrder.requested_by}
                    onChange={(e) => setNewChangeOrder({ ...newChangeOrder, requested_by: e.target.value })}
                    placeholder="Name of requester"
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_plan_type">Payment Plan</Label>
                  <Select
                    value={newChangeOrder.payment_plan_type}
                    onValueChange={updatePaymentPlanType}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one_payment">One Payment</SelectItem>
                      <SelectItem value="two_payments">Two Payments</SelectItem>
                      <SelectItem value="three_payments">Three Payments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Plan Details */}
                <div className="space-y-3">
                  <Label>Payment Schedule</Label>
                  {paymentPlan.map((payment, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-3 border rounded">
                      <div>
                        <Label htmlFor={`payment_${index}_amount`}>Payment {payment.payment_number} Amount ($)</Label>
                        <Input
                          id={`payment_${index}_amount`}
                          type="number"
                          value={payment.amount}
                          onChange={(e) => updatePaymentPlanItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`payment_${index}_date`}>Due Date</Label>
                        <Input
                          id={`payment_${index}_date`}
                          type="date"
                          value={payment.due_date}
                          onChange={(e) => updatePaymentPlanItem(index, 'due_date', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="text-sm text-muted-foreground">
                    Total: ${paymentPlan.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newChangeOrder.notes}
                    onChange={(e) => setNewChangeOrder({ ...newChangeOrder, notes: e.target.value })}
                    placeholder="Additional notes"
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button onClick={isEditing ? updateChangeOrder : createChangeOrder}>
                    {isEditing ? 'Update Change Order' : 'Create Change Order'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {changeOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No change orders found for this project.
            </p>
          ) : (
            <div className="space-y-4">
              {changeOrders.map((changeOrder) => (
                <Card key={changeOrder.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{changeOrder.title}</h4>
                        <p className="text-sm text-muted-foreground">{changeOrder.description}</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            ${changeOrder.cost_impact?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {changeOrder.schedule_impact_days || 0} days
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(changeOrder.requested_date).toLocaleDateString()}
                          </span>
                        </div>
                        {changeOrder.requested_by && (
                          <p className="text-xs text-muted-foreground">
                            Requested by: {changeOrder.requested_by}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={getStatusColor(changeOrder.status)}>
                          {changeOrder.status}
                        </Badge>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(changeOrder)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(changeOrder.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                        
                        {changeOrder.status === 'Pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600 hover:bg-green-50"
                            onClick={() => updateChangeOrderStatus(changeOrder.id, 'Approved')}
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};