import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileEdit, DollarSign, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChangeOrder {
  id: string;
  project_id: string;
  title: string;
  description: string;
  cost_impact: number;
  schedule_impact_days: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  requested_by: string;
  requested_date: string;
  approved_by?: string;
  approved_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ChangeOrderManagerProps {
  projectId: string;
  projectName: string;
}

const ChangeOrderManager = ({ projectId, projectName }: ChangeOrderManagerProps) => {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ChangeOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cost_impact: 0,
    schedule_impact_days: 0,
    requested_by: "",
    notes: ""
  });

  useEffect(() => {
    loadChangeOrders();
  }, [projectId]);

  const loadChangeOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChangeOrders((data || []) as ChangeOrder[]);
    } catch (error) {
      console.error('Error loading change orders:', error);
      toast({
        title: "Error",
        description: "Failed to load change orders.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      cost_impact: 0,
      schedule_impact_days: 0,
      requested_by: "",
      notes: ""
    });
    setEditingOrder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingOrder) {
        const { error } = await supabase
          .from('change_orders')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingOrder.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Change order updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('change_orders')
          .insert([{
            project_id: projectId,
            ...formData
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Change order created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadChangeOrders();
    } catch (error) {
      console.error('Error saving change order:', error);
      toast({
        title: "Error",
        description: "Failed to save change order.",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: ChangeOrder['status']) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'Approved') {
        updateData.approved_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('change_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Change order ${newStatus.toLowerCase()} successfully.`,
      });

      loadChangeOrders();
    } catch (error) {
      console.error('Error updating change order status:', error);
      toast({
        title: "Error",
        description: "Failed to update change order status.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (order: ChangeOrder) => {
    setEditingOrder(order);
    setFormData({
      title: order.title,
      description: order.description || "",
      cost_impact: order.cost_impact,
      schedule_impact_days: order.schedule_impact_days,
      requested_by: order.requested_by || "",
      notes: order.notes || ""
    });
    setIsDialogOpen(true);
  };

  const getStatusIcon = (status: ChangeOrder['status']) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: ChangeOrder['status']) => {
    switch (status) {
      case 'Approved':
        return "bg-green-100 text-green-800 border-green-200";
      case 'Rejected':
        return "bg-red-100 text-red-800 border-red-200";
      case 'Completed':
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading change orders...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <FileEdit className="h-5 w-5 mr-2" />
          Change Orders - {projectName}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#003562] hover:bg-[#003562]/90">
              <Plus className="h-4 w-4 mr-2" />
              New Change Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? 'Edit Change Order' : 'Create Change Order'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost_impact">Cost Impact ($)</Label>
                  <Input
                    id="cost_impact"
                    type="number"
                    step="0.01"
                    value={formData.cost_impact}
                    onChange={(e) => setFormData({...formData, cost_impact: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="schedule_impact">Schedule Impact (Days)</Label>
                  <Input
                    id="schedule_impact"
                    type="number"
                    value={formData.schedule_impact_days}
                    onChange={(e) => setFormData({...formData, schedule_impact_days: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="requested_by">Requested By</Label>
                <Input
                  id="requested_by"
                  value={formData.requested_by}
                  onChange={(e) => setFormData({...formData, requested_by: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
                  {editingOrder ? 'Update' : 'Create'} Change Order
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {changeOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{order.status}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.description && (
                  <p className="text-gray-600">{order.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Cost Impact</p>
                      <p className={order.cost_impact > 0 ? "text-red-600 font-semibold" : order.cost_impact < 0 ? "text-green-600 font-semibold" : ""}>
                        ${order.cost_impact.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">Schedule Impact</p>
                      <p className={order.schedule_impact_days > 0 ? "text-red-600 font-semibold" : order.schedule_impact_days < 0 ? "text-green-600 font-semibold" : ""}>
                        {order.schedule_impact_days > 0 ? '+' : ''}{order.schedule_impact_days} days
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-medium">Requested By</p>
                    <p className="text-gray-600">{order.requested_by}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Created {new Date(order.created_at).toLocaleDateString()}
                    {order.approved_date && ` • Approved ${new Date(order.approved_date).toLocaleDateString()}`}
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(order)}
                    >
                      Edit
                    </Button>
                    
                    {order.status === 'Pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'Approved')}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(order.id, 'Rejected')}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {order.status === 'Approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'Completed')}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {changeOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileEdit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No change orders yet.</p>
              <p className="text-sm text-gray-500 mt-2">Create your first change order to track project modifications.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChangeOrderManager;