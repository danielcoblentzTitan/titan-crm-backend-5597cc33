import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InvoicePaymentButtonProps {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  disabled?: boolean;
}

const InvoicePaymentButton = ({ 
  invoiceId, 
  invoiceNumber, 
  amount, 
  disabled = false 
}: InvoicePaymentButtonProps) => {
  const [processing, setProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { toast } = useToast();

  const handlePayment = async (paymentMethod: 'card' | 'ach' | 'bank_transfer') => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('process-invoice-payment', {
        body: { invoiceId, paymentMethod }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative inline-block">
      <Button
        onClick={() => setShowOptions((v) => !v)}
        disabled={disabled || processing}
        className="bg-green-600 hover:bg-green-700 text-white"
     >
        {processing ? (
          "Processing..."
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <ExternalLink className="h-3 w-3 ml-1" />
          </>
        )}
      </Button>

      {showOptions && !processing && (
        <div className="absolute right-0 mt-2 w-64 rounded-md border bg-white shadow-lg z-50">
          <div className="p-2 text-sm font-medium border-b">Choose payment method</div>
          <div className="p-2 space-y-2">
            <button
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
              onClick={() => handlePayment('card')}
            >
              Credit Card (+3.5% fee)
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
              onClick={() => handlePayment('ach')}
            >
              Bank Account (ACH)
            </button>
            <button
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
              onClick={() => handlePayment('bank_transfer')}
            >
              Bank Transfer (Wire/ACH Credit)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicePaymentButton;