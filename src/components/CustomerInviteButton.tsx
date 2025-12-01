
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Send, Check, AlertCircle } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import type { Customer } from "@/services/supabaseService";

interface CustomerInviteButtonProps {
  customer: Customer;
  onInviteSent?: () => void;
}

const CustomerInviteButton = ({ customer, onInviteSent }: CustomerInviteButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendInvite = async () => {
    try {
      setIsSending(true);
      console.log('Sending invite to customer:', customer.email);
      
      const result = await supabaseService.sendCustomerInvite(customer.id, customer.email);
      console.log('Invite result:', result);
      
      toast({
        title: "Invite Sent",
        description: `Portal invitation sent to ${customer.email}`,
      });
      
      setIsDialogOpen(false);
      onInviteSent?.();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      
      let errorMessage = "Failed to send invite. Please try again.";
      
      if (error.message?.includes('RESEND_API_KEY')) {
        errorMessage = "Email service not configured. Please contact your administrator.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Show different button based on signup status
  if (customer.signed_up_at) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="h-4 w-4 mr-1 text-green-600" />
        <span className="text-green-600">Signed Up</span>
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Mail className="h-4 w-4 mr-1" />
          Send Portal Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Portal Invitation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{customer.name}</strong> will receive an email invitation at:
            </p>
            <p className="text-sm font-mono bg-white p-2 rounded mt-2">{customer.email}</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              The invitation will include:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
              <li>Instructions to create their account</li>
              <li>Direct link to access their customer portal</li>
              <li>Information about tracking project progress</li>
              <li>Access to documents and communication tools</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertCircle className="h-4 w-4" />
            <span>This invitation will expire in 7 days</span>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvite} 
              disabled={isSending}
              className="bg-[#003562] hover:bg-[#003562]/90"
            >
              {isSending ? (
                <>
                  <Send className="h-4 w-4 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerInviteButton;
