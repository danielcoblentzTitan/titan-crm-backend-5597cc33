import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Calendar, DollarSign, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/services/supabaseService";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  project_name: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  job_type: string;
  notes: string;
  paid_date?: string;
}

interface InvoiceManagerProps {
  project: Project;
  onUpdate?: () => void;
}

export const InvoiceManager = ({ project, onUpdate }: InvoiceManagerProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: 0,
    tax: 0,
    job_type: 'Residential',
    notes: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    generateInvoiceNumber();
  }, [project.id]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('project_id', project.id)
        .order('issue_date', { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    }
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${year}${month}-${random}`;
    
    setNewInvoice(prev => ({ ...prev, invoice_number: invoiceNumber }));
  };

  const createInvoice = async () => {
    try {
      const total = newInvoice.subtotal + newInvoice.tax;
      
      const { error } = await supabase
        .from('invoices')
        .insert({
          project_id: project.id,
          customer_id: project.customer_id,
          customer_name: project.customer_name,
          project_name: project.name,
          total: total,
          ...newInvoice,
        });

      if (error) throw error;

      setIsCreating(false);
      setNewInvoice({
        invoice_number: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        subtotal: 0,
        tax: 0,
        job_type: 'Residential',
        notes: '',
      });
      generateInvoiceNumber();
      fetchInvoices();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const updateInvoiceStatus = async (id: string, status: string, paidDate?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'Paid') {
        updateData.paid_date = paidDate || new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      fetchInvoices();
      onUpdate?.();

      toast({
        title: "Success",
        description: `Invoice ${status.toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const updatePaidDate = async (id: string, paidDate: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ paid_date: paidDate })
        .eq('id', id);

      if (error) throw error;

      fetchInvoices();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Paid date updated",
      });
    } catch (error) {
      console.error('Error updating paid date:', error);
      toast({
        title: "Error",
        description: "Failed to update paid date",
        variant: "destructive",
      });
    }
  };

  const updateInvoiceTotal = async (id: string, total: number) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ total })
        .eq('id', id);

      if (error) throw error;

      fetchInvoices();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Invoice total updated",
      });
    } catch (error) {
      console.error('Error updating invoice total:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice total",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const upcomingInvoices = invoices.filter(inv => inv.status !== 'Paid');
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const outstandingAmount = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">${totalInvoiced.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">${outstandingAmount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List with Tabs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_number">Invoice Number</Label>
                    <Input
                      id="invoice_number"
                      value={newInvoice.invoice_number}
                      onChange={(e) => setNewInvoice({ ...newInvoice, invoice_number: e.target.value })}
                      placeholder="INV-2024-001"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="job_type">Job Type</Label>
                    <Select
                      value={newInvoice.job_type}
                      onValueChange={(value) => setNewInvoice({ ...newInvoice, job_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Residential">Residential</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                        <SelectItem value="Barndominium">Barndominium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issue_date">Issue Date</Label>
                    <Input
                      id="issue_date"
                      type="date"
                      value={newInvoice.issue_date}
                      onChange={(e) => setNewInvoice({ ...newInvoice, issue_date: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newInvoice.due_date}
                      onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subtotal">Subtotal ($)</Label>
                    <Input
                      id="subtotal"
                      type="number"
                      value={newInvoice.subtotal}
                      onChange={(e) => setNewInvoice({ ...newInvoice, subtotal: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tax">Tax ($)</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={newInvoice.tax}
                      onChange={(e) => setNewInvoice({ ...newInvoice, tax: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newInvoice.notes}
                    onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                    placeholder="Additional notes for the invoice"
                    rows={3}
                  />
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${(newInvoice.subtotal + newInvoice.tax).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createInvoice}>
                    Create Invoice
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming ({upcomingInvoices.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidInvoices.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-6">
              {upcomingInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming invoices found.
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingInvoices.map((invoice) => (
                    <Card key={invoice.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{invoice.invoice_number}</h4>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 text-sm">
                              {!invoice.invoice_number.includes('Deposit') && (
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <p>Job Type: {invoice.job_type}</p>
                              {invoice.notes && <p>Notes: {invoice.notes}</p>}
                            </div>
                          </div>
                          
                           <div className="flex flex-col items-end space-y-2">
                             <div className="text-right">
                               <div className="flex items-center space-x-2">
                                 <Input
                                   type="number"
                                   value={invoice.total || 0}
                                   onChange={(e) => updateInvoiceTotal(invoice.id, parseFloat(e.target.value) || 0)}
                                   className="h-8 w-24 text-right text-lg font-bold"
                                   step="0.01"
                                 />
                                 <span className="text-lg font-bold">$</span>
                               </div>
                              <p className="text-sm text-muted-foreground">
                                Subtotal: ${invoice.subtotal?.toLocaleString()}
                              </p>
                              {invoice.tax > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Tax: ${invoice.tax?.toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              
                              {(invoice.status === 'Draft' || invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => updateInvoiceStatus(invoice.id, 'Paid')}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="paid" className="mt-6">
              {paidInvoices.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No paid invoices found.
                </p>
              ) : (
                <div className="space-y-4">
                  {paidInvoices.map((invoice) => (
                    <Card key={invoice.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{invoice.invoice_number}</h4>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 text-sm">
                              {invoice.paid_date && (
                                <div className="flex items-center space-x-2">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  <span>Paid: {new Date(invoice.paid_date).toLocaleDateString()}</span>
                                  <Input
                                    type="date"
                                    value={invoice.paid_date}
                                    onChange={(e) => updatePaidDate(invoice.id, e.target.value)}
                                    className="h-6 w-32 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <p>Job Type: {invoice.job_type}</p>
                              {invoice.notes && <p>Notes: {invoice.notes}</p>}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                             <div className="text-right">
                               <div className="flex items-center space-x-2">
                                 <Input
                                   type="number"
                                   value={invoice.total || 0}
                                   onChange={(e) => updateInvoiceTotal(invoice.id, parseFloat(e.target.value) || 0)}
                                   className="h-8 w-24 text-right text-lg font-bold"
                                   step="0.01"
                                 />
                                 <span className="text-lg font-bold">$</span>
                               </div>
                              <p className="text-sm text-muted-foreground">
                                Subtotal: ${invoice.subtotal?.toLocaleString()}
                              </p>
                              {invoice.tax > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Tax: ${invoice.tax?.toLocaleString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};