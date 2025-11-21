import { supabaseService, Lead, Customer, Project } from './supabaseService';
import { enhancedDocumentService } from './enhancedDocumentService';

export interface WorkflowData {
  lead?: Lead;
  customer?: Customer;
  project?: Project;
  estimatedValue: number;
  originalData: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
  };
}

class WorkflowService {
  // Convert lead to customer, preserving all original data
  async convertLeadToCustomer(lead: Lead): Promise<Customer> {
    const customerData = {
      name: `${lead.first_name} ${lead.last_name}`,
      email: lead.email || '',
      phone: lead.phone || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip: lead.zip || '',
      notes: lead.notes || `Converted from lead on ${new Date().toLocaleDateString()}`
    };

    const customer = await supabaseService.addCustomer(customerData);
    
    // Update the lead to mark it as converted
    await supabaseService.updateLead(lead.id, {
      status: 'Won',
      converted_to_customer_id: customer.id
    });

    return customer;
  }

  // Convert customer to project, preserving estimated value and storing lead reference
  async convertCustomerToProject(customer: Customer, estimatedValue: number = 0): Promise<Project> {
    const projectData = {
      name: `${customer.name} - Barndominium Project`,
      customer_id: customer.id,
      customer_name: customer.name,
      status: 'Planning' as const,
      progress: 0,
      start_date: new Date().toISOString().split('T')[0],
      estimated_completion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      budget: estimatedValue,
      description: `Barndominium construction project for ${customer.name}`,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip: customer.zip,
      phase: 'Planning & Permits'
    };

    const project = await supabaseService.addProject(projectData);

    // Find the original lead and store reference for later document transfer
    try {
      const leads = await supabaseService.getLeads();
      const originalLead = leads.find(l => l.converted_to_customer_id === customer.id);
      
      if (originalLead) {
        // Store the lead ID in project description for later use when project completes
        const updatedDescription = (project.description || '') + `\n[LEAD_ID:${originalLead.id}]`;
        await supabaseService.updateProject(project.id, { description: updatedDescription });
      }
    } catch (error) {
      console.error('Error storing lead reference:', error);
      // Continue even if this fails
    }

    return project;
  }

  // Convert customer to project with contract generation and document transfer
  async convertCustomerToProjectWithContract(customer: Customer, estimatedValue: number = 0, statementVersion?: any): Promise<Project> {
    const project = await this.convertCustomerToProject(customer, estimatedValue);
    
    try {
      // Generate contract HTML content
      const contractContent = this.generateContractHTML(customer, project);
      
      // Save contract as document
      const contractFileName = `${customer.name.replace(/\s+/g, '_')}_Contract.html`;
      await enhancedDocumentService.saveContractDocument(project.id, contractFileName, contractContent);
      
      // If statement version provided, save it as the COGS document
      if (statementVersion) {
        const cogsFileName = `${customer.name} -1`;
        await enhancedDocumentService.saveStatementAsCogsDocument(project.id, cogsFileName, statementVersion);
      }
      
    } catch (error) {
      console.error('Error generating contract or saving documents:', error);
      // Continue even if this fails
    }
    
    return project;
  }

  // Generate contract HTML content
  private generateContractHTML(customer: Customer, project: Project): string {
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
        <p><strong>Project Name:</strong> ${project.name}</p>
        <p><strong>Description:</strong> ${project.description || 'Custom construction project as discussed'}</p>
        <p><strong>Location:</strong> ${[project.address, project.city, project.state, project.zip].filter(Boolean).join(', ')}</p>
        <p><strong>Estimated Start Date:</strong> ${new Date(project.start_date).toLocaleDateString()}</p>
        <p><strong>Estimated Completion:</strong> ${new Date(project.estimated_completion).toLocaleDateString()}</p>
    </div>

    <div class="section">
        <div class="section-title">CONTRACT PRICE</div>
        <p class="price">Total Contract Price: $${project.budget.toLocaleString()}</p>
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
            <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line"></span></p>
            <p>Print Name: <span class="signature-line"></span></p>
        </div>
        
        <div class="signature-section">
            <p><strong>TITAN BUILDINGS LLC SIGNATURE:</strong></p>
            <p>Signature: <span class="signature-line"></span> Date: <span class="signature-line"></span></p>
            <p>Print Name: <span class="signature-line"></span></p>
            <p>Title: <span class="signature-line"></span></p>
        </div>
    </div>

    <div style="margin-top: 30px; padding: 10px; background-color: #f5f5f5; text-align: center; font-size: 12px;">
        <p><strong>LEGAL NOTICE:</strong> This document constitutes a legally binding contract. Both parties should retain a copy for their records.</p>
    </div>
</body>
</html>`;
  }

  // Handle project completion and document transfer
  async handleProjectCompletion(project: Project): Promise<void> {
    // Extract lead ID from project description
    const leadIdMatch = project.description?.match(/\[LEAD_ID:([^\]]+)\]/);
    
    if (leadIdMatch) {
      const leadId = leadIdMatch[1];
      
      try {
        await enhancedDocumentService.transferSingleDocumentForCompletedProject(
          leadId, 
          project.id, 
          project.customer_name
        );
        
        // Clean up the lead ID from description
        const cleanDescription = project.description.replace(/\n?\[LEAD_ID:[^\]]+\]/, '');
        await supabaseService.updateProject(project.id, { description: cleanDescription });
        
      } catch (error) {
        console.error('Error transferring document for completed project:', error);
      }
    }
  }

  // Create portal access for customer
  async createCustomerPortalAccess(customerId: string): Promise<void> {
    // Portal access is automatically created by database trigger
    // This method can be used for additional portal setup if needed
    console.log(`Portal access created for customer ${customerId}`);
  }

  // Create mock workflow data for demonstration
  async createMockWorkflowData(): Promise<void> {
    const mockLeads = [
      {
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567',
        company: 'Smith Family Ranch',
        address: '123 Ranch Road',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        status: 'Qualified',
        priority: 'High',
        source: 'Website',
        estimated_value: 185000,
        notes: 'Interested in 40x60 barndominium with living quarters'
      },
      {
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '(555) 987-6543',
        company: 'Johnson Farms',
        address: '456 Farm Lane',
        city: 'Waco',
        state: 'TX',
        zip: '76701',
        status: 'Proposal',
        priority: 'Medium',
        source: 'Referral',
        estimated_value: 145000,
        notes: '30x50 barndominium for equipment storage and office'
      },
      {
        first_name: 'Mike',
        last_name: 'Davis',
        email: 'mike.davis@email.com',
        phone: '(555) 456-7890',
        address: '789 Country Drive',
        city: 'San Antonio',
        state: 'TX',
        zip: '78201',
        status: 'New',
        priority: 'Medium',
        source: 'Phone',
        estimated_value: 225000,
        notes: '50x80 barndominium with workshop and residence'
      }
    ];

    // Create the leads
    for (const leadData of mockLeads) {
      await supabaseService.addLead(leadData);
    }

    // Convert first lead to customer and project to show workflow
    const leads = await supabaseService.getLeads();
    const johnLead = leads.find(l => l.first_name === 'John' && l.last_name === 'Smith');
    
    if (johnLead) {
      const customer = await this.convertLeadToCustomer(johnLead);
      await this.convertCustomerToProject(customer, johnLead.estimated_value || 185000);
    }
  }
}

export const workflowService = new WorkflowService();