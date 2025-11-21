
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./supabaseService";

export interface LeadDocument {
  id: string;
  lead_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
}

export const documentService = {
  async createLeadsDocumentsFolder(leadId: string) {
    // Create a folder structure for the lead's documents
    const folderPath = `leads/${leadId}/documents/`;
    
    // Create a placeholder file to ensure the folder exists
    const placeholderContent = new Blob(['This folder contains documents for this lead.'], { type: 'text/plain' });
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`${folderPath}.placeholder`, placeholderContent);

    if (error) {
      console.error('Error creating documents folder:', error);
      throw error;
    }

    return data;
  },

  async uploadLeadDocument(leadId: string, file: Blob, fileName: string) {
    const filePath = `leads/${leadId}/documents/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading document:', error);
      throw error;
    }

    // Record the document in the database
    const { data: docRecord, error: dbError } = await supabase
      .from('lead_documents')
      .insert({
        lead_id: leadId,
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording document:', dbError);
      throw dbError;
    }

    return { storageData: data, documentRecord: docRecord };
  },

  async getLeadDocuments(leadId: string): Promise<LeadDocument[]> {
    const { data, error } = await supabase
      .from('lead_documents')
      .select('*')
      .eq('lead_id', leadId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead documents:', error);
      throw error;
    }

    return data || [];
  },

  async downloadDocument(filePath: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      console.error('Error downloading document:', error);
      throw error;
    }

    return data;
  }
};
