
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseService, Invoice } from "@/services/supabaseService";
import { FileText, DollarSign, Calendar, AlertCircle } from "lucide-react";
import InvoicePaymentButton from "./InvoicePaymentButton";

interface CustomerInvoicesProps {
  projectId: string;
}

const CustomerInvoices = ({ projectId }: CustomerInvoicesProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [projectId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allInvoices = await supabaseService.getInvoices();
      // Filter invoices for this specific project and sort by due date (soonest first)
      const projectInvoices = allInvoices
        .filter(invoice => invoice.project_id === projectId)
        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      setInvoices(projectInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Overdue":
        return "bg-red-100 text-red-800 border-red-200";
      case "Draft":
        return "bg-blue-100 text-blue-800 border-blue-200"; // Show as pending instead of draft
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getDisplayStatus = (status: string) => {
    return status === "Draft" ? "Pending" : status;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadInvoices}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  const paidInvoices = invoices.filter(inv => inv.status === "Paid");
  const outstandingInvoices = invoices.filter(inv => inv.status !== "Paid");
  const today = new Date();
  const inSevenDays = new Date(today);
  inSevenDays.setDate(today.getDate() + 7);
  
  // Check if invoice is due within 7 days for pay button visibility
  const isPayable = (invoice: Invoice) => {
    if (invoice.status === "Paid") return false;
    const due = new Date(invoice.due_date);
    return due <= inSevenDays; // Due within 7 days or overdue
  };
  
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const payableAmount = outstandingInvoices.filter(isPayable).reduce((sum, inv) => sum + (inv.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-gray-600">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">${payableAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-gray-600">Due Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-sm text-gray-600">Total Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{invoices.length}</p>
                <p className="text-sm text-gray-600">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Tabs */}
      <Tabs defaultValue="outstanding" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outstanding">Outstanding Invoices ({outstandingInvoices.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid Invoices ({paidInvoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="space-y-4 mt-6">
          {outstandingInvoices.length > 0 ? (
            outstandingInvoices.map((invoice) => (
              <Card key={invoice.id} className={`border-l-4 ${isPayable(invoice) ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(invoice.status)}>
                        {getDisplayStatus(invoice.status)}
                      </Badge>
                      {isPayable(invoice) && (
                        <Badge variant="destructive" className="text-xs">
                          Pay Now Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Amount Due</p>
                        <p className={`text-lg font-bold ${isPayable(invoice) ? 'text-red-600' : 'text-orange-600'}`}>
                          ${(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    {!invoice.invoice_number.includes('Deposit') && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Due Date</p>
                          <p className="text-gray-600">{new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {invoice.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{invoice.notes}</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-end gap-2">
                    <button 
                      onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                    >
                      View Invoice
                    </button>
                    {isPayable(invoice) && (
                      <InvoicePaymentButton
                        invoiceId={invoice.id}
                        invoiceNumber={invoice.invoice_number}
                        amount={invoice.total || 0}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No outstanding invoices.</p>
                <p className="text-sm text-gray-500 mt-2">All invoices have been paid.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4 mt-6">
          {paidInvoices.length > 0 ? (
            paidInvoices.map((invoice) => (
              <Card key={invoice.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                    <Badge className={getStatusColor(invoice.status)}>
                      {getDisplayStatus(invoice.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Amount Paid</p>
                        <p className="text-lg font-bold text-green-600">${(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    {!invoice.invoice_number.includes('Deposit') && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">Due Date</p>
                          <p className="text-gray-600">{new Date(invoice.due_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                    >
                      View Invoice
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No paid invoices yet.</p>
                <p className="text-sm text-gray-500 mt-2">Completed payments will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* No Invoices Message */}
      {invoices.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No invoices available yet.</p>
            <p className="text-sm text-gray-500 mt-2">Your builder will create invoices as work progresses.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerInvoices;
