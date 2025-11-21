import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Mail, 
  Users, 
  Send, 
  Filter,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { useVendors, Vendor } from '@/integrations/supabase/hooks/useVendors';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BulkEmailComposerProps {
  trigger?: React.ReactNode;
}

export const BulkEmailComposer: React.FC<BulkEmailComposerProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>(['Active']);
  const [filterTrade, setFilterTrade] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { data: vendors = [] } = useVendors();
  // Send email function
  const sendVendorEmail = async (emailData: any) => {
    const { data, error } = await supabase.functions.invoke('send-vendor-email', {
      body: emailData
    });
    if (error) throw error;
    return data;
  };
  const { toast } = useToast();

  // Filter vendors based on criteria
  const filteredVendors = vendors.filter(vendor => {
    const statusMatch = filterStatus.length === 0 || filterStatus.includes(vendor.status);
    const tradeMatch = !filterTrade || vendor.trade?.toLowerCase().includes(filterTrade.toLowerCase());
    const hasEmail = vendor.primary_email;
    return statusMatch && tradeMatch && hasEmail;
  });

  const handleVendorToggle = (vendorId: string) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendors.length === filteredVendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(filteredVendors.map(v => v.id));
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedVendors.length === 0 || !subject || !body) {
      toast({
        title: "Error",
        description: "Please select vendors and provide subject and body.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    let failureCount = 0;

    for (const vendorId of selectedVendors) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (!vendor?.primary_email) continue;

      try {
        await sendVendorEmail({
          vendor_id: vendorId,
          to_emails: [vendor.primary_email],
          subject,
          body_html: body.replace(/\n/g, '<br>'),
          body_text: body,
          object_type: 'general',
          object_id: vendorId,
        });
        successCount++;
      } catch (error) {
        failureCount++;
        console.error(`Failed to send email to ${vendor.name}:`, error);
      }
    }

    setIsSending(false);
    toast({
      title: "Bulk Email Complete",
      description: `Sent ${successCount} emails successfully. ${failureCount} failed.`,
      variant: successCount > 0 ? "default" : "destructive",
    });

    if (successCount > 0) {
      setIsOpen(false);
      setSelectedVendors([]);
      setSubject('');
      setBody('');
    }
  };

  const statusOptions = ['Active', 'Probation', 'Inactive'];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Bulk Email
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Bulk Email to Build Partners</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filter Vendors</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filterStatus.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilterStatus(prev => [...prev, status]);
                          } else {
                            setFilterStatus(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm">
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Trade (filter)</label>
                <Input
                  placeholder="Filter by trade..."
                  value={filterTrade}
                  onChange={(e) => setFilterTrade(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Vendor Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Select Vendors ({selectedVendors.length} of {filteredVendors.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedVendors.length === filteredVendors.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {filteredVendors.map(vendor => (
                  <div key={vendor.id} className="flex items-center space-x-3 p-2 rounded border">
                    <Checkbox
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => handleVendorToggle(vendor.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{vendor.name}</span>
                        <Badge variant="outline">{vendor.status}</Badge>
                        {vendor.trade && (
                          <Badge variant="secondary">{vendor.trade}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{vendor.primary_email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Email Composition */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compose Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  placeholder="Email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  placeholder="Email message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>
                  This email will be sent to {selectedVendors.length} selected vendors.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSendBulkEmail}
              disabled={selectedVendors.length === 0 || !subject || !body || isSending}
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to {selectedVendors.length} Vendors
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};