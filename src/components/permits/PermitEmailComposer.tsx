import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useJurisdictions } from "@/integrations/supabase/hooks/usePermits";
import { Mail, Send, Building } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PermitEmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  jurisdictionId?: string;
  applicationId?: string;
  prefilledTemplate?: string;
}

const PermitEmailComposer = ({ isOpen, onClose, jurisdictionId, applicationId, prefilledTemplate }: PermitEmailComposerProps) => {
  const [emailData, setEmailData] = useState({
    to: "",
    subject: "",
    body: "",
    template: prefilledTemplate || ""
  });

  const { data: jurisdictions = [] } = useJurisdictions();
  const selectedJurisdiction = jurisdictions.find(j => j.id === jurisdictionId);

  const emailTemplates = {
    permit_intro: {
      subject: "Building Permit Application - {{project.code}} at {{site.address}}",
      body: "Dear {{jurisdiction.name}} Building Department,\n\nWe are submitting a building permit application for the following project:\n\nProject Type: {{project.type}}\nLocation: {{site.address}}\nSquare Footage: {{project.sqft}}\nEstimated Construction Value: ${{project.valuation}}\n\nAttached please find:\n{{checklist_summary}}\n\nPlease let us know if you need any additional information or documentation.\n\nBest regards,\nTitan Buildings Team\nPhone: {{company.phone}}\nEmail: {{company.email}}"
    },
    request_deldot: {
      subject: "DelDOT Entrance Permit Request - {{project.code}}",
      body: "Dear DelDOT Office,\n\nWe are requesting an entrance permit for the following project:\n\nProject: {{project.type}}\nLocation: {{site.address}}\nProposed entrance modifications: New/modified driveway access\n\nAttached: Site plan showing proposed entrance location\n\nPlease advise on the application process and any additional requirements.\n\nThank you,\nTitan Buildings Team"
    },
    request_osfm: {
      subject: "State Fire Marshal Plan Review - {{project.code}}",
      body: "Dear State Fire Marshal Office,\n\nWe are submitting plans for fire marshal review:\n\nProject Type: {{project.type}}\nLocation: {{site.address}}\nConstruction Value: ${{project.valuation}}\nOccupancy Type: {{project.occupancy}}\n\nAttached: Complete construction plans and specifications\n\nPlease process this plan review application and provide any comments.\n\nRegards,\nTitan Buildings Team"
    },
    lines_grades_question: {
      subject: "Lines & Grades Requirements - {{project.code}}",
      body: "Dear {{jurisdiction.name}} Engineering Department,\n\nWe are planning a {{project.type}} project and need to confirm Lines & Grades requirements:\n\nProject: {{project.type}}\nLocation: {{site.address}}\nBuilding Size: {{project.sqft}} sq ft\nEstimated Value: ${{project.valuation}}\n\nQuestions:\n1. Is Lines & Grades approval required for this project size/type?\n2. What documentation is needed if required?\n3. What are the current fees and processing times?\n\nThank you for your assistance.\n\nBest regards,\nTitan Buildings Team"
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    const template = emailTemplates[templateKey as keyof typeof emailTemplates];
    if (template) {
      setEmailData(prev => ({
        ...prev,
        template: templateKey,
        subject: template.subject,
        body: template.body
      }));
    }
  };

  const populateRecipient = () => {
    if (selectedJurisdiction?.contact_email && selectedJurisdiction.contact_email !== "via web form") {
      setEmailData(prev => ({
        ...prev,
        to: selectedJurisdiction.contact_email!
      }));
    }
  };

  const handleSend = () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Create mailto link with pre-filled data
    const mailtoLink = `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoLink;
    
    toast({
      title: "Success",
      description: "Email client opened with pre-filled message"
    });
    onClose();
  };

  const mergeFields = [
    { field: "{{jurisdiction.name}}", description: "Jurisdiction name" },
    { field: "{{project.code}}", description: "Project code/number" },
    { field: "{{project.type}}", description: "Project type" },
    { field: "{{site.address}}", description: "Project address" },
    { field: "{{project.sqft}}", description: "Square footage" },
    { field: "{{project.valuation}}", description: "Construction value" },
    { field: "{{company.phone}}", description: "Company phone" },
    { field: "{{company.email}}", description: "Company email" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Permit Email Composer
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Templates</CardTitle>
                <CardDescription>Choose a pre-built template to get started</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(emailTemplates).map(([key, template]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTemplateSelect(key)}
                      className="justify-start text-left h-auto p-3"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {template.subject.split(' - ')[0]}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Email Form */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Email</CardTitle>
                {selectedJurisdiction && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="text-sm">{selectedJurisdiction.name}</span>
                    {selectedJurisdiction.contact_email && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={populateRecipient}
                      >
                        Use Contact Email
                      </Button>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To *</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="recipient@county.gov"
                    value={emailData.to}
                    onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject line"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message *</Label>
                  <Textarea
                    id="body"
                    placeholder="Email message body"
                    value={emailData.body}
                    onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                    rows={12}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSend} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Open in Email Client
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Merge Fields Reference */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Merge Fields</CardTitle>
                <CardDescription>Available placeholders for dynamic content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mergeFields.map((field, index) => (
                    <div key={index} className="text-sm">
                      <code className="bg-secondary px-1 rounded text-xs">
                        {field.field}
                      </code>
                      <p className="text-muted-foreground">{field.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedJurisdiction && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedJurisdiction.contact_phone && (
                    <div className="text-sm">
                      <strong>Phone:</strong> {selectedJurisdiction.contact_phone}
                    </div>
                  )}
                  {selectedJurisdiction.contact_email && (
                    <div className="text-sm">
                      <strong>Email:</strong> {selectedJurisdiction.contact_email}
                    </div>
                  )}
                  {selectedJurisdiction.portal_url && (
                    <div className="text-sm">
                      <strong>Portal:</strong>{" "}
                      <a
                        href={selectedJurisdiction.portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Visit Portal
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermitEmailComposer;