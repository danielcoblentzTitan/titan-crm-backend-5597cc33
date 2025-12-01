import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Plus, DollarSign, Send, Eye, CheckCircle, XCircle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePurchaseOrders, useCreatePurchaseOrder, useSendVendorEmail } from "@/integrations/supabase/hooks/useVendorWorkflows";
import { useVendors } from "@/integrations/supabase/hooks/useVendors";

interface PurchaseOrderManagerProps {
  vendorId?: string;
}

const PurchaseOrderManager = ({ vendorId }: PurchaseOrderManagerProps) => {
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders(vendorId);
  const { data: vendors = [] } = useVendors();
  const createPO = useCreatePurchaseOrder();
  const sendEmail = useSendVendorEmail();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [formData, setFormData] = useState({
    vendor_id: vendorId || "",
    project_id: "",
    rfq_id: "",
    subject: "",
    body: "",
    subtotal: 0,
    tax: 0,
    total: 0,
    target_delivery: undefined as Date | undefined,
  });

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_id || !formData.subject || !formData.total) {
      return;
    }

    try {
      const poData = {
        vendor_id: formData.vendor_id,
        project_id: formData.project_id || null,
        rfq_id: formData.rfq_id || null,
        subject: formData.subject,
        body: formData.body,
        status: 'Draft' as const,
        subtotal: formData.subtotal,
        tax: formData.tax,
        total: formData.total,
        target_delivery: formData.target_delivery ? format(formData.target_delivery, 'yyyy-MM-dd') : null,
        actual_delivery: null,
        attachments: [],
      };

      const newPO = await createPO.mutateAsync(poData);
      
      // Send email immediately
      if (newPO) {
        const vendor = vendors.find(v => v.id === formData.vendor_id);
        if (vendor?.primary_email) {
          await sendEmail.mutateAsync({
            vendor_id: formData.vendor_id,
            object_type: 'po',
            object_id: newPO.id,
            subject: `[${newPO.code}] Purchase Order - ${formData.subject}`,
            body_html: `<p>Hi ${vendor.name},</p><p>Please find attached Purchase Order ${newPO.code} for the following:</p><p>${formData.body}</p><p><strong>Total Amount: $${formData.total.toLocaleString()}</strong></p><p>Target Delivery: ${formData.target_delivery ? format(formData.target_delivery, 'PPP') : 'TBD'}</p><p>Please reply with <strong>ACK</strong> to confirm receipt and <strong>DATE YYYY-MM-DD</strong> for delivery confirmation.</p><p>Best regards,<br>Titan Buildings</p>`,
            body_text: `Hi ${vendor.name},\n\nPlease find attached Purchase Order ${newPO.code} for the following:\n\n${formData.body}\n\nTotal Amount: $${formData.total.toLocaleString()}\n\nTarget Delivery: ${formData.target_delivery ? format(formData.target_delivery, 'PPP') : 'TBD'}\n\nPlease reply with ACK to confirm receipt and DATE YYYY-MM-DD for delivery confirmation.\n\nBest regards,\nTitan Buildings`,
            to_emails: [vendor.primary_email],
            merge_data: {
              'po.code': newPO.code,
              'po.total': formData.total.toLocaleString(),
              'po.target_delivery': formData.target_delivery ? format(formData.target_delivery, 'PPP') : 'TBD',
            }
          });
        }
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create PO:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: vendorId || "",
      project_id: "",
      rfq_id: "",
      subject: "",
      body: "",
      subtotal: 0,
      tax: 0,
      total: 0,
      target_delivery: undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'outline';
      case 'Sent': return 'secondary';
      case 'Acknowledged': return 'default';
      case 'In Progress': return 'default';
      case 'Delivered': return 'default';
      case 'Completed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent': return <Send className="h-4 w-4" />;
      case 'Acknowledged': return <CheckCircle className="h-4 w-4" />;
      case 'In Progress': return <CheckCircle className="h-4 w-4" />;
      case 'Delivered': return <Truck className="h-4 w-4" />;
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading Purchase Orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <p className="text-muted-foreground">Issue and track purchase orders via email</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select 
                    value={formData.vendor_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}
                    disabled={!!vendorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name} ({vendor.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_delivery">Target Delivery</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.target_delivery && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.target_delivery ? format(formData.target_delivery, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.target_delivery}
                        onSelect={(date) => setFormData(prev => ({ ...prev, target_delivery: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Concrete materials for Project ABC"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Description</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Detailed description of items/services being purchased..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => {
                      const subtotal = parseFloat(e.target.value) || 0;
                      const total = subtotal + formData.tax;
                      setFormData(prev => ({ ...prev, subtotal, total }));
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0;
                      const total = formData.subtotal + tax;
                      setFormData(prev => ({ ...prev, tax, total }));
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total *</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) => setFormData(prev => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPO.isPending}>
                  {createPO.isPending ? "Creating & Sending..." : "Create & Send PO"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Purchase Order List */}
      <div className="grid gap-4">
        {purchaseOrders.map((po: any) => (
          <Card key={po.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(po.status)}
                    <Badge variant={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{po.code}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {po.vendor?.name} • {po.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-green-600 font-semibold">
                    ${po.total.toLocaleString()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedPO(po)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  {po.body && <p className="text-sm">{po.body}</p>}
                  {po.project && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Project: {po.project.name}
                    </p>
                  )}
                  {po.rfq && (
                    <p className="text-sm text-muted-foreground">
                      From RFQ: {po.rfq.code}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(po.created_at), 'MMM d, yyyy')}
                  </div>
                  {po.target_delivery && (
                    <div className="text-sm text-muted-foreground">
                      Target: {format(new Date(po.target_delivery), 'MMM d, yyyy')}
                    </div>
                  )}
                  {po.actual_delivery && (
                    <div className="text-sm font-medium text-green-600">
                      Delivered: {format(new Date(po.actual_delivery), 'MMM d, yyyy')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {po.object_alias}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {purchaseOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Purchase Orders found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first purchase order to manage vendor payments
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create First PO
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PO Detail Dialog */}
      {selectedPO && (
        <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedPO.code}</span>
                <Badge variant={getStatusColor(selectedPO.status)}>
                  {selectedPO.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Vendor</Label>
                    <p>{selectedPO.vendor?.name} ({selectedPO.vendor?.code})</p>
                  </div>
                  <div>
                    <Label>Total Amount</Label>
                    <p className="text-lg font-semibold text-green-600">
                      ${selectedPO.total.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Subtotal</Label>
                    <p>${selectedPO.subtotal.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Tax</Label>
                    <p>${selectedPO.tax.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Total</Label>
                    <p className="font-semibold">${selectedPO.total.toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <p>{selectedPO.subject}</p>
                </div>
                
                {selectedPO.body && (
                  <div>
                    <Label>Description</Label>
                    <p className="whitespace-pre-wrap">{selectedPO.body}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {selectedPO.target_delivery && (
                    <div>
                      <Label>Target Delivery</Label>
                      <p>{format(new Date(selectedPO.target_delivery), 'PPP')}</p>
                    </div>
                  )}
                  {selectedPO.actual_delivery && (
                    <div>
                      <Label>Actual Delivery</Label>
                      <p className="text-green-600 font-medium">
                        {format(new Date(selectedPO.actual_delivery), 'PPP')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="messages">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Email thread will appear here</p>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Purchase order and attachments will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PurchaseOrderManager;