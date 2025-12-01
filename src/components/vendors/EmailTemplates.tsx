import React from 'react';

export interface EmailTemplateProps {
  vendor: any;
  object: any;
  project?: any;
}

export const RFQEmailTemplate: React.FC<EmailTemplateProps> = ({ vendor, object, project }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          defaultValue={`RFQ ${object.code} - ${object.subject}`}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email Body</label>
        <textarea
          className="w-full p-3 border rounded-md h-64"
          defaultValue={`Dear ${vendor.name},

We would like to request a quote for the following:

Project: ${project?.name || 'N/A'}
RFQ Code: ${object.code}
Subject: ${object.subject}

${object.body || ''}

Please provide your quote by: ${object.due_date ? new Date(object.due_date).toLocaleDateString() : 'TBD'}

You can respond directly to this email with your quote details.

Best regards,
Titan Buildings Team`}
        />
      </div>
    </div>
  );
};

export const PurchaseOrderEmailTemplate: React.FC<EmailTemplateProps> = ({ vendor, object, project }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          defaultValue={`Purchase Order ${object.code} - ${object.subject}`}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email Body</label>
        <textarea
          className="w-full p-3 border rounded-md h-64"
          defaultValue={`Dear ${vendor.name},

Please find attached Purchase Order ${object.code}.

Project: ${project?.name || 'N/A'}
PO Code: ${object.code}
Subject: ${object.subject}
Total Amount: $${object.total?.toLocaleString() || '0.00'}

${object.body || ''}

Target Delivery: ${object.target_delivery ? new Date(object.target_delivery).toLocaleDateString() : 'TBD'}

Please confirm receipt and provide delivery confirmation.

Best regards,
Titan Buildings Team`}
        />
      </div>
    </div>
  );
};

export const ScheduleRequestEmailTemplate: React.FC<EmailTemplateProps> = ({ vendor, object, project }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          defaultValue={`Schedule Request ${object.code} - ${object.subject}`}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Email Body</label>
        <textarea
          className="w-full p-3 border rounded-md h-64"
          defaultValue={`Dear ${vendor.name},

We would like to schedule the following work:

Project: ${project?.name || 'N/A'}
Schedule Code: ${object.code}
Subject: ${object.subject}

${object.body || ''}

Requested Window: ${object.window_start ? new Date(object.window_start).toLocaleDateString() : 'TBD'} - ${object.window_end ? new Date(object.window_end).toLocaleDateString() : 'TBD'}

Please confirm your availability by responding to this email.

Best regards,
Titan Buildings Team`}
        />
      </div>
    </div>
  );
};