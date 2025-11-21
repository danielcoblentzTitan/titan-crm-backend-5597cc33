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
import { CalendarIcon, Plus, FileText, Send, Eye, Edit, Clock, CheckCircle, XCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRFQs, useCreateRFQ, useSendVendorEmail } from "@/integrations/supabase/hooks/useVendorWorkflows";
import { useVendors } from "@/integrations/supabase/hooks/useVendors";
import { supabase } from "@/integrations/supabase/client";
import { EmailComposer } from "./EmailComposer";
import { MessageThread } from "./MessageThread";

interface RFQManagerProps {
  vendorId?: string;
}

const RFQManager = ({ vendorId }: RFQManagerProps) => {
  const { data: rfqs = [], isLoading } = useRFQs(vendorId);
  const { data: vendors = [] } = useVendors();
  const createRFQ = useCreateRFQ();
  const sendEmail = useSendVendorEmail();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEmailComposerOpen, setIsEmailComposerOpen] = useState(false);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [formData, setFormData] = useState({
    vendor_id: vendorId || "",
    project_id: "",
    subject: "",
    body: "",
    due_date: undefined as Date | undefined,
  });

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vendor_id || !formData.subject || !formData.body) {
      return;
    }

    try {
      const rfqData = {
        vendor_id: formData.vendor_id,
        project_id: formData.project_id || null,
        subject: formData.subject,
        body: formData.body,
        status: 'Draft' as const,
        due_date: formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : null,
        quote_amount: null,
        quote_notes: null,
        attachments: [],
      };

      const newRFQ = await createRFQ.mutateAsync(rfqData);
      
      // Send email immediately if not draft
      if (newRFQ) {
        const vendor = vendors.find(v => v.id === formData.vendor_id);
        if (vendor?.primary_email) {
          await sendEmail.mutateAsync({
            vendor_id: formData.vendor_id,
            object_type: 'rfq',
            object_id: newRFQ.id,
            subject: `[${newRFQ.code}] ${formData.subject}`,
            body_html: `<p>Hi ${vendor.name},</p><p>${formData.body}</p><p>Due date: ${formData.due_date ? format(formData.due_date, 'PPP') : 'Not specified'}</p><p>Reply with <strong>ACK</strong> to confirm receipt, <strong>QUOTE $amount</strong> when ready.</p><p>Best regards,<br>Titan Buildings</p>`,
            body_text: `Hi ${vendor.name},\n\n${formData.body}\n\nDue date: ${formData.due_date ? format(formData.due_date, 'PPP') : 'Not specified'}\n\nReply with ACK to confirm receipt, QUOTE $amount when ready.\n\nBest regards,\nTitan Buildings`,
            to_emails: [vendor.primary_email],
            merge_data: {
              'rfq.code': newRFQ.code,
              'rfq.due_date': formData.due_date ? format(formData.due_date, 'PPP') : 'Not specified',
              'rfq.body': formData.body,
            }
          });
          
          // Update status to Sent
          await supabase
            .from('rfqs')
            .update({ status: 'Sent' })
            .eq('id', newRFQ.id);
        }
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create RFQ:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_id: vendorId || "",
      project_id: "",
      subject: "",
      body: "",
      due_date: undefined,
    });
  };

  const handleSendEmail = (rfq: any) => {
    setSelectedRFQ(rfq);
    setIsEmailComposerOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'outline';
      case 'Sent': return 'secondary';
      case 'Acknowledged': return 'default';
      case 'Quoted': return 'default';
      case 'Declined': return 'destructive';
      case 'Expired': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Sent': return <Send className="h-4 w-4" />;
      case 'Acknowledged': return <CheckCircle className="h-4 w-4" />;
      case 'Quoted': return <CheckCircle className="h-4 w-4" />;
      case 'Declined': return <XCircle className="h-4 w-4" />;
      case 'Expired': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading RFQs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Request for Quotes</h2>
          <p className="text-muted-foreground">Manage vendor quote requests via email</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New RFQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Request for Quote</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRFQ} className="space-y-4">
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
                  <Label htmlFor="due_date">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.due_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.due_date ? format(formData.due_date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.due_date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
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
                  placeholder="e.g., Foundation concrete pour for Project ABC"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Scope of Work *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Detailed description of the work to be quoted..."
                  rows={4}
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRFQ.isPending}>
                  {createRFQ.isPending ? "Creating & Sending..." : "Create & Send RFQ"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* RFQ List */}
      <div className="grid gap-4">
        {rfqs.map((rfq: any) => (
          <Card key={rfq.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(rfq.status)}
                    <Badge variant={getStatusColor(rfq.status)}>
                      {rfq.status}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{rfq.code}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {rfq.vendor?.name} • {rfq.subject}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {rfq.quote_amount && (
                    <Badge variant="outline" className="text-green-600">
                      ${rfq.quote_amount.toLocaleString()}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSendEmail(rfq)}
                    className="flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" />
                    Send
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedRFQ(rfq)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm">{rfq.body}</p>
                  {rfq.project && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Project: {rfq.project.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Created: {format(new Date(rfq.created_at), 'MMM d, yyyy')}
                  </div>
                  {rfq.due_date && (
                    <div className="text-sm text-muted-foreground">
                      Due: {format(new Date(rfq.due_date), 'MMM d, yyyy')}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {rfq.object_alias}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {rfqs.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No RFQs found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first RFQ to request quotes from vendors
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create First RFQ
            </Button>
          </CardContent>
        </Card>
      )}

      {/* RFQ Detail Dialog */}
      {selectedRFQ && (
        <Dialog open={!!selectedRFQ} onOpenChange={() => setSelectedRFQ(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>{selectedRFQ.code}</span>
                <Badge variant={getStatusColor(selectedRFQ.status)}>
                  {selectedRFQ.status}
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
                    <p>{selectedRFQ.vendor?.name} ({selectedRFQ.vendor?.code})</p>
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <p>{selectedRFQ.due_date ? format(new Date(selectedRFQ.due_date), 'PPP') : 'Not specified'}</p>
                  </div>
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <p>{selectedRFQ.subject}</p>
                </div>
                
                <div>
                  <Label>Scope of Work</Label>
                  <p className="whitespace-pre-wrap">{selectedRFQ.body}</p>
                </div>
                
                {selectedRFQ.quote_amount && (
                  <div>
                    <Label>Quote Amount</Label>
                    <p className="text-lg font-semibold text-green-600">
                      ${selectedRFQ.quote_amount.toLocaleString()}
                    </p>
                    {selectedRFQ.quote_notes && (
                      <p className="text-sm text-muted-foreground mt-1">{selectedRFQ.quote_notes}</p>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="messages">
                <MessageThread
                  vendor={vendors.find(v => v.id === selectedRFQ.vendor_id)}
                  objectType="rfq"
                  objectId={selectedRFQ.id}
                  object={selectedRFQ}
                  project={selectedRFQ.project}
                />
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Attachments will appear here</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      <EmailComposer
        isOpen={isEmailComposerOpen}
        onClose={() => setIsEmailComposerOpen(false)}
        vendor={vendors.find(v => v.id === selectedRFQ?.vendor_id)}
        object={selectedRFQ}
        objectType="rfq"
        project={selectedRFQ?.project}
      />
    </div>
  );
};

export default RFQManager;