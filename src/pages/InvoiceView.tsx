import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

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
}

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-blue-100 text-blue-800';
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

  const getDisplayStatus = (status: string) => {
    return status === "Draft" ? "Pending" : status;
  };

  const { profile } = useAuth();
  const handleBack = () => {
    const sameOriginRef = document.referrer && new URL(document.referrer).origin === window.location.origin;
    if (sameOriginRef && window.history.length > 1) {
      navigate(-1);
      return;
    }
    if (window.opener) {
      window.close();
      return;
    }
    const defaultPath = profile?.role === 'builder' ? '/dashboard' : '/customer-portal';
    navigate(defaultPath, { replace: true });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl mb-2">{invoice.invoice_number}</CardTitle>
              <p className="text-lg text-muted-foreground">{invoice.project_name}</p>
            </div>
            <Badge className={getStatusColor(invoice.status)}>
              {getDisplayStatus(invoice.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Bill To:</h3>
              <div className="space-y-1">
                <p className="font-medium">{invoice.customer_name}</p>
                <p className="text-sm text-muted-foreground">Job Type: {invoice.job_type}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-3">Invoice Details:</h3>
              <div className="space-y-2">
                {!invoice.invoice_number.includes('Deposit') && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Description */}
          {invoice.notes && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Description:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{invoice.notes}</p>
              </div>
            </div>
          )}

          {/* Amount Summary */}
          <div className="border-t pt-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="space-y-3">
                {invoice.subtotal > 0 && (
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${invoice.subtotal.toLocaleString()}</span>
                  </div>
                )}
                
                {invoice.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${invoice.tax.toLocaleString()}</span>
                  </div>
                )}
                
                <div className="flex justify-between border-t pt-3 text-xl font-bold">
                  <span>Total Amount:</span>
                  <span className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-1" />
                    {invoice.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="text-center border-t pt-6">
            {invoice.status === 'Paid' ? (
              <div className="text-green-600">
                <p className="text-lg font-semibold">✓ Payment Received</p>
                <p className="text-sm">Thank you for your payment!</p>
              </div>
            ) : (
              <div className="text-blue-600">
                <p className="text-lg font-semibold">Payment {getDisplayStatus(invoice.status)}</p>
                <p className="text-sm">Please contact us if you have any questions about this invoice.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}