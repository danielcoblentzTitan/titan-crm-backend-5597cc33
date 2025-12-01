import { supabaseService, Lead } from '../supabaseService';
import { enhancedDocumentService } from '../enhancedDocumentService';
import { EstimateData } from './types';
import { EstimateTemplates } from './templates';

class EstimateService {
  // Generate written estimate HTML content
  generateEstimateHTML(lead: Lead, estimateData: EstimateData): string {
    return EstimateTemplates.generateEstimateHTML(lead, estimateData);
  }

  // Create written estimate document
  async createWrittenEstimate(lead: Lead, estimateData: EstimateData): Promise<void> {
    try {
      // Generate estimate HTML content
      const estimateContent = this.generateEstimateHTML(lead, estimateData);
      
      // Save estimate as document
      const fileName = `${lead.first_name}_${lead.last_name}_Estimate.html`;
      await enhancedDocumentService.saveEstimateDocument(lead.id, fileName, estimateContent);
      
      // Update lead status to "In Decision Making" and store estimate value
      await supabaseService.updateLead(lead.id, {
        status: 'Qualified',
        estimated_value: estimateData.estimatedPrice,
        notes: `${lead.notes || ''}\n\nEstimate Created: ${new Date().toLocaleDateString()} - $${estimateData.estimatedPrice.toLocaleString()}`
      });
      
    } catch (error) {
      console.error('Error creating written estimate:', error);
      throw error;
    }
  }

  // Update lead status based on estimate actions
  async updateLeadStatusForEstimate(leadId: string, action: 'hotlist' | 'archive'): Promise<void> {
    try {
      const status = action === 'hotlist' ? 'Proposal' : 'Lost';
      await supabaseService.updateLead(leadId, { status });
    } catch (error) {
      console.error('Error updating lead status for estimate:', error);
      throw error;
    }
  }

  // Generate quick written estimate HTML content
  generateQuickEstimateHTML(lead: Lead, estimateData: EstimateData): string {
    return EstimateTemplates.generateQuickEstimateHTML(lead, estimateData);
  }

  // Create quick written estimate document
  async createQuickWrittenEstimate(lead: Lead, estimateData: EstimateData, estimateId?: string): Promise<string> {
    try {
      // Generate quick estimate HTML content
      const estimateContent = this.generateQuickEstimateHTML(lead, estimateData);
      
      // Save estimate as document
      const fileName = `${lead.first_name}_${lead.last_name}_Quick_Estimate.html`;
      await enhancedDocumentService.saveEstimateDocument(lead.id, fileName, estimateContent);
      
      // Create estimate link if estimateId is provided
      const estimateDate = new Date().toLocaleDateString();
      const estimatePrice = estimateData.estimatedPrice.toLocaleString();
      
      let estimateNote;
      if (estimateId) {
        // Create clickable link format
        estimateNote = `[ESTIMATE:${estimateId}]Quick Estimate Created: ${estimateDate} - $${estimatePrice}[/ESTIMATE]`;
      } else {
        // Fallback to plain text
        estimateNote = `Quick Estimate Created: ${estimateDate} - $${estimatePrice}`;
      }
      
      await supabaseService.updateLead(lead.id, {
        estimated_value: estimateData.estimatedPrice,
        notes: `${lead.notes || ''}\n\n${estimateNote}`
      });
      
      return estimateNote;
    } catch (error) {
      console.error('Error creating quick written estimate:', error);
      throw error;
    }
  }
}

export const estimateService = new EstimateService();
export * from './types';