import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const TestInviteButton = () => {
  const [email, setEmail] = useState('daniel@buildatitan.com');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendTestInvite = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('send-test-invite', {
        body: { email }
      });

      if (error) throw error;

      toast({
        title: "Test invite sent!",
        description: `Sample invitation email sent to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending test invite:', error);
      
      // Handle specific error types with user-friendly messages
      const errorData = error.message ? JSON.parse(error.message) : error;
      
      if (errorData.error === 'Email delivery restricted') {
        toast({
          title: "Email Delivery Restricted",
          description: "Test emails can only be sent to verified domains. The email template is working correctly - this is just a Resend API limitation for testing.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: errorData.details || error.message || 'Failed to send test invite',
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Send Test Invitation Email</h3>
      <p className="text-sm text-muted-foreground">
        Note: Test emails can only be sent to verified domains. Use daniel@buildatitan.com for testing.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleSendTestInvite}
          disabled={loading || !email}
        >
          {loading ? 'Sending...' : 'Send Test Invite'}
        </Button>
      </div>
    </div>
  );
};