import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSendVendorEmail } from '@/integrations/supabase/hooks/useVendorWorkflows';
import { RFQEmailTemplate, PurchaseOrderEmailTemplate, ScheduleRequestEmailTemplate } from './EmailTemplates';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any;
  object: any;
  objectType: 'rfq' | 'purchase_order' | 'schedule_request';
  project?: any;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  isOpen,
  onClose,
  vendor,
  object,
  objectType,
  project
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [toEmails, setToEmails] = useState(vendor?.email || '');
  const [ccEmails, setCcEmails] = useState('');
  
  const sendEmail = useSendVendorEmail();

  const renderTemplate = () => {
    const props = { vendor, object, project };
    switch (objectType) {
      case 'rfq':
        return <RFQEmailTemplate {...props} />;
      case 'purchase_order':
        return <PurchaseOrderEmailTemplate {...props} />;
      case 'schedule_request':
        return <ScheduleRequestEmailTemplate {...props} />;
      default:
        return null;
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim() || !toEmails.trim()) {
      return;
    }

    const emailData = {
      vendor_id: vendor.id,
      object_type: objectType,
      object_id: object.id,
      subject,
      body_html: body.replace(/\n/g, '<br>'),
      body_text: body,
      to_emails: toEmails.split(',').map(email => email.trim()),
      cc_emails: ccEmails ? ccEmails.split(',').map(email => email.trim()) : [],
      merge_data: {
        vendor_name: vendor.name,
        object_code: object.code,
        project_name: project?.name
      }
    };

    await sendEmail.mutateAsync(emailData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email - {objectType.toUpperCase()} {object.code}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="to-emails">To (comma separated)</Label>
              <Input
                id="to-emails"
                value={toEmails}
                onChange={(e) => setToEmails(e.target.value)}
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <Label htmlFor="cc-emails">CC (comma separated)</Label>
              <Input
                id="cc-emails"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="manager@company.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body"
              className="min-h-[200px]"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">Template Preview</h3>
            <div className="bg-muted p-4 rounded-md">
              {renderTemplate()}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={sendEmail.isPending || !subject.trim() || !body.trim() || !toEmails.trim()}
            >
              {sendEmail.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};