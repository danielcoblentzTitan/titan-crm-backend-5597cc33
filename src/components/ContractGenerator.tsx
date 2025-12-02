import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Signature, CheckCircle } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Customer, Project } from "@/services/supabaseService";
import DigitalSignature from "./DigitalSignature";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ContractGeneratorProps {
  customer: Customer;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ContractProject {
  id: string;
  name: string;
  description: string;
  budget: number;
}

interface DigitalSignatureRecord {
  id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  document_type: string;
}

const ContractGenerator = ({ customer, isOpen, onOpenChange }: ContractGeneratorProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contractGenerated, setContractGenerated] = useState(false);
  const [contractId, setContractId] = useState<string>("");
  const [isCustomerSigningOpen, setIsCustomerSigningOpen] = useState(false);
  const [isCompanySigningOpen, setIsCompanySigningOpen] = useState(false);
  const [signatures, setSignatures] = useState<DigitalSignatureRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCustomerProjects();
    }
  }, [isOpen, customer.id]);

  useEffect(() => {
    if (contractId) {
      loadSignatures();
    }
  }, [contractId]);

  const loadCustomerProjects = async () => {
    try {
      const allProjects = await supabaseService.getProjects();
      const customerProjects = allProjects.filter(p => p.customer_id === customer.id);
      setProjects(customerProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast({
        title: "Error",
        description: "Failed to load customer projects.",
        variant: "destructive",
      });
    }
  };

  const loadSignatures = async () => {
    try {
      const { data, error } = await supabase
        .from('digital_signatures')
        .select('*')
        .eq('document_id', contractId)
        .eq('document_type', 'Contract');
      
      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Error loading signatures:', error);
    }
  };

  const generateContract = async (project: Project) => {
    setLoading(true);
    try {
      // Create a unique contract ID
      const newContractId = `contract-${project.id}-${Date.now()}`;
      setContractId(newContractId);
      setSelectedProject(project);
      setContractGenerated(true);
      
      toast({
        title: "Success",
        description: "Contract generated successfully!",
      });
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Error",
        description: "Failed to generate contract.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = () => {
    if (!selectedProject) return;

    const contractContent = generateContractHTML();
    const blob = new Blob([contractContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name.replace(/\s+/g, '_')}_Contract_${selectedProject.name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateContractHTML = () => {
    if (!selectedProject) return '';

    const customerSignature = signatures.find(s => s.signer_email === customer.email);
    const companySignature = signatures.find(s => s.signer_email !== customer.email);

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Construction Contract - ${customer.name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #003562; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #003562; }
        .signature-section { border: 2px solid #003562; padding: 15px; margin: 20px 0; }
        .signature-line { border-bottom: 1px solid #000; display: inline-block; width: 300px; margin: 0 10px; }
        .price { font-size: 20px; font-weight: bold; color: #003562; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">CONSTRUCTION CONTRACT</div>
        <p><strong>Titan Buildings LLC</strong></p>
        <p>Contract Date: ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <div class="section-title">PARTIES</div>
        <p><strong>Contractor:</strong> Titan Buildings LLC</p>
        <p><strong>Customer:</strong> ${customer.name}</p>
        <p><strong>Address:</strong> ${[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone}</p>
    </div>

    <div class="section">
        <div class="section-title">PROJECT DETAILS</div>
        <p><strong>Project Name:</strong> ${selectedProject.name}</p>
        <p><strong>Description:</strong> ${selectedProject.description || 'Custom construction project as discussed'}</p>
        <p><strong>Location:</strong> ${[selectedProject.address, selectedProject.city, selectedProject.state, selectedProject.zip].filter(Boolean).join(', ')}</p>
        <p><strong>Estimated Start Date:</strong> ${new Date(selectedProject.start_date).toLocaleDateString()}</p>
        <p><strong>Estimated Completion:</strong> ${new Date(selectedProject.estimated_completion).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <div class="section-title">CONTRACT PRICE</div>
        <p class="price">Total Contract Price: $${selectedProject.budget.toLocaleString()}</p>
    </div>

    <div class="section">
        <div class="section-title">TERMS AND CONDITIONS</div>
        <p><strong>1. SCOPE OF WORK:</strong> Contractor agrees to provide all labor, materials, equipment, and services necessary for the completion of the above-described project in accordance with the plans, specifications, and industry standards.</p>
        
        <p><strong>2. PAYMENT TERMS:</strong> Payment shall be made according to the payment schedule to be provided separately. Final payment is due upon completion and acceptance of all work.</p>
        
        <p><strong>3. CHANGE ORDERS:</strong> Any changes to the original scope of work must be documented in writing and signed by both parties before implementation.</p>
        
        <p><strong>4. WARRANTIES:</strong> Contractor warrants all work performed under this contract for a period of one (1) year from completion date against defects in workmanship.</p>
        
        <p><strong>5. PERMITS AND CODES:</strong> Contractor shall obtain all necessary permits and ensure all work complies with applicable building codes and regulations.</p>
        
        <p><strong>6. LIABILITY AND INSURANCE:</strong> Contractor maintains general liability insurance and workers' compensation as required by law.</p>
        
        <p><strong>7. FORCE MAJEURE:</strong> Neither party shall be liable for delays caused by circumstances beyond their reasonable control, including but not limited to acts of God, weather conditions, or governmental actions.</p>
        
        <p><strong>8. DISPUTE RESOLUTION:</strong> Any disputes arising under this contract shall be resolved through mediation, and if necessary, binding arbitration.</p>
        
        <p><strong>9. ENTIRE AGREEMENT:</strong> This contract represents the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein.</p>
        
        <p><strong>10. GOVERNING LAW:</strong> This contract shall be governed by the laws of the applicable state jurisdiction.</p>
    </div>

    <div class="section">
        <div class="section-title">SIGNATURES</div>
        <p><strong>By signing below, both parties acknowledge that they have read, understood, and agree to be bound by all terms and conditions of this contract.</strong></p>
        
        <div class="signature-section">
            <p><strong>CUSTOMER SIGNATURE:</strong></p>
            ${customerSignature ? `
                <p>Signed by: ${customerSignature.signer_name}</p>
                <p>Date: ${new Date(customerSignature.signed_at).toLocaleDateString()}</p>
                <p>Email: ${customerSignature.signer_email}</p>
                <p style="color: green;">✓ DIGITALLY SIGNED</p>
            ` : `
                <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line"></span></p>
                <p>Print Name: <span class="signature-line"></span></p>
            `}
        </div>
        
        <div class="signature-section">
            <p><strong>TITAN BUILDINGS LLC SIGNATURE:</strong></p>
            ${companySignature ? `
                <p>Signed by: ${companySignature.signer_name}</p>
                <p>Date: ${new Date(companySignature.signed_at).toLocaleDateString()}</p>
                <p>Email: ${companySignature.signer_email}</p>
                <p style="color: green;">✓ DIGITALLY SIGNED</p>
            ` : `
                <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line"></span></p>
                <p>Print Name: <span class="signature-line"></span></p>
                <p>Title: <span class="signature-line"></span></p>
            `}
        </div>
    </div>

    <div style="margin-top: 30px; padding: 10px; background-color: #f5f5f5; text-align: center; font-size: 12px;">
        <p><strong>LEGAL NOTICE:</strong> This document constitutes a legally binding contract. Both parties should retain a copy for their records.</p>
    </div>
</body>
</html>`;
  };

  const customerSignature = signatures.find(s => s.signer_email === customer.email);
  const companySignature = signatures.find(s => s.signer_email !== customer.email);
  const isFullySigned = customerSignature && companySignature;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Contract Generator - {customer.name}
            </DialogTitle>
          </DialogHeader>

          {!contractGenerated ? (
            <div className="space-y-4">
              <p className="text-gray-600">Select a project to generate a contract:</p>
              
              {projects.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No projects found for this customer.</p>
                    <p className="text-sm text-gray-400 mt-2">Create a project first to generate a contract.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {projects.map((project) => (
                    <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <p className="text-gray-600 mt-1">{project.description || 'No description provided'}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Budget: ${project.budget.toLocaleString()}</span>
                              <Badge variant="outline">{project.status}</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => generateContract(project)}
                            disabled={loading}
                            className="bg-[#003562] hover:bg-[#003562]/90"
                          >
                            {loading ? "Generating..." : "Generate Contract"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Contract: {selectedProject?.name}</h3>
                <div className="flex items-center space-x-2">
                  {isFullySigned && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Fully Signed
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    onClick={downloadContract}
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Contract Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Project:</p>
                      <p>{selectedProject?.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Total Price:</p>
                      <p className="text-xl font-bold text-[#003562]">
                        ${selectedProject?.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Customer:</p>
                      <p>{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Project Timeline:</p>
                      <p className="text-sm">
                        Start: {selectedProject && new Date(selectedProject.start_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Est. Completion: {selectedProject && new Date(selectedProject.estimated_completion).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Signature Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Customer Signature:</span>
                        {customerSignature ? (
                          <Badge className="bg-green-100 text-green-800">Signed</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      {customerSignature ? (
                        <div className="text-sm text-gray-600">
                          <p>Signed by: {customerSignature.signer_name}</p>
                          <p>Date: {new Date(customerSignature.signed_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsCustomerSigningOpen(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Signature className="h-4 w-4 mr-2" />
                          Sign as Customer
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Company Signature:</span>
                        {companySignature ? (
                          <Badge className="bg-green-100 text-green-800">Signed</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      {companySignature ? (
                        <div className="text-sm text-gray-600">
                          <p>Signed by: {companySignature.signer_name}</p>
                          <p>Date: {new Date(companySignature.signed_at).toLocaleDateString()}</p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setIsCompanySigningOpen(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Signature className="h-4 w-4 mr-2" />
                          Sign as Titan Buildings
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setContractGenerated(false);
                    setSelectedProject(null);
                    setContractId("");
                    setSignatures([]);
                  }}
                >
                  Generate New Contract
                </Button>
                <Button onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DigitalSignature
        documentId={contractId}
        documentType="Contract"
        isOpen={isCustomerSigningOpen}
        onOpenChange={setIsCustomerSigningOpen}
        onSignatureComplete={() => {
          loadSignatures();
          toast({
            title: "Success",
            description: "Customer signature completed!",
          });
        }}
      />

      <DigitalSignature
        documentId={contractId}
        documentType="Contract"
        isOpen={isCompanySigningOpen}
        onOpenChange={setIsCompanySigningOpen}
        onSignatureComplete={() => {
          loadSignatures();
          toast({
            title: "Success",
            description: "Company signature completed!",
          });
        }}
      />
    </>
  );
};

export default ContractGenerator;