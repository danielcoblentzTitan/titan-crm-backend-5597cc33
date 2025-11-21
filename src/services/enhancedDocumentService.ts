import { supabase } from "@/integrations/supabase/client";

export interface DocumentUpload {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  customer_facing: boolean;
  uploaded_at: string;
  uploaded_by: string | null;
  notes?: string;
  voice_note?: string;
}

export interface LeadDocument extends DocumentUpload {
  lead_id: string;
}

export interface ProjectDocument extends DocumentUpload {
  project_id: string;
}

export interface CustomerDocument extends DocumentUpload {
  customer_id: string;
}

export const enhancedDocumentService = {
  // Lead document operations
  async uploadLeadDocument(
    leadId: string, 
    file: Blob, 
    fileName: string, 
    customerFacing: boolean = false,
    notes: string = '',
    voiceNote: string = ''
  ): Promise<{ storageData: any; documentRecord: LeadDocument }> {
    const folderPath = customerFacing ? 'customer-facing' : 'internal';
    const filePath = `leads/${leadId}/${folderPath}/${fileName}`;
    
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
        customer_facing: customerFacing,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        notes: notes,
        voice_note: voiceNote
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

  // Project document operations
  async uploadProjectDocument(
    projectId: string, 
    file: Blob, 
    fileName: string, 
    customerFacing: boolean = false,
    notes: string = '',
    voiceNote: string = ''
  ): Promise<{ storageData: any; documentRecord: ProjectDocument }> {
    const folderPath = customerFacing ? 'customer-facing' : 'internal';
    const filePath = `projects/${projectId}/${folderPath}/${fileName}`;
    
    console.log('Uploading to storage:', { filePath, fileType: file.type, fileSize: file.size });
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true  // Allow overwriting existing files
      });

    if (error) {
      console.error('Storage upload error:', error);
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Record the document in the database
    const { data: docRecord, error: dbError } = await supabase
      .from('project_documents')
      .insert({
        project_id: projectId,
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        customer_facing: customerFacing,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        notes: notes,
        voice_note: voiceNote
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording document:', dbError);
      throw dbError;
    }

    return { storageData: data, documentRecord: docRecord };
  },

  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching project documents:', error);
      throw error;
    }

    return data || [];
  },

  async getCustomerFacingProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    const { data, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('customer_facing', true)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer documents:', error);
      throw error;
    }

    return data || [];
  },

  // Customer document operations
  async uploadCustomerDocument(
    customerId: string, 
    file: Blob, 
    fileName: string, 
    customerFacing: boolean = false,
    notes: string = '',
    voiceNote: string = ''
  ): Promise<{ storageData: any; documentRecord: CustomerDocument }> {
    const folderPath = customerFacing ? 'customer-facing' : 'internal';
    const filePath = `customers/${customerId}/${folderPath}/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading customer document:', error);
      throw error;
    }

    // Record the document in the database
    const { data: docRecord, error: dbError } = await supabase
      .from('customer_documents')
      .insert({
        customer_id: customerId,
        file_name: fileName,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        customer_facing: customerFacing,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        notes: notes,
        voice_note: voiceNote
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error recording customer document:', dbError);
      throw dbError;
    }

    return { storageData: data, documentRecord: docRecord };
  },

  async getCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer documents:', error);
      throw error;
    }

    return data || [];
  },

  async getCustomerFacingCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
    const { data, error } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('customer_id', customerId)
      .eq('customer_facing', true)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer-facing customer documents:', error);
      throw error;
    }

    return data || [];
  },

  // Transfer documents from lead to project
  async transferLeadDocumentsToProject(leadId: string, projectId: string): Promise<void> {
    const leadDocuments = await this.getLeadDocuments(leadId);
    
    for (const doc of leadDocuments) {
      try {
        // Download the file from lead storage
        const { data: fileData } = await supabase.storage
          .from('documents')
          .download(doc.file_path);

        if (fileData) {
          // Upload to project storage
          await this.uploadProjectDocument(
            projectId,
            fileData,
            doc.file_name,
            doc.customer_facing
          );
        }
      } catch (error) {
        console.error(`Error transferring document ${doc.file_name}:`, error);
      }
    }
  },

  // Transfer single document for completed project
  async transferSingleDocumentForCompletedProject(leadId: string, projectId: string, customerName: string): Promise<void> {
    const leadDocuments = await this.getLeadDocuments(leadId);
    
    if (leadDocuments.length === 0) return;
    
    // Get the first document (or could be most recent)
    const doc = leadDocuments[0];
    
    try {
      // Download the file from lead storage
      const { data: fileData } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (fileData) {
        // Create new filename with customer name -1
        const fileExtension = doc.file_name.split('.').pop();
        const newFileName = `${customerName}-1.${fileExtension}`;
        
        // Upload to project storage with new name
        await this.uploadProjectDocument(
          projectId,
          fileData,
          newFileName,
          doc.customer_facing,
          doc.notes,
          doc.voice_note
        );
        
        // Remove all other project documents for this project
        const existingProjectDocs = await this.getProjectDocuments(projectId);
        for (const existingDoc of existingProjectDocs) {
          if (existingDoc.file_name !== newFileName) {
            await this.deleteProjectDocument(existingDoc.id);
          }
        }
      }
    } catch (error) {
      console.error(`Error transferring document ${doc.file_name}:`, error);
    }
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
  },

  async getPublicUrl(filePath: string) {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Delete document operations
  async deleteLeadDocument(documentId: string): Promise<void> {
    // First get the document to find the file path
    const { data: doc, error: fetchError } = await supabase
      .from('lead_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('lead_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw dbError;
    }
  },

  async deleteProjectDocument(documentId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw dbError;
    }
  },

  // Save contract document to project folder
  async saveContractDocument(projectId: string, fileName: string, htmlContent: string): Promise<void> {
    try {
      const filePath = `projects/${projectId}/${fileName}`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          contentType: 'text/html',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading contract:', uploadError);
        throw uploadError;
      }
      
      // Create project document record
      await this.createProjectDocumentRecord({
        project_id: projectId,
        file_name: fileName,
        file_path: filePath,
        file_type: 'text/html',
        file_size: blob.size,
        customer_facing: true,
        notes: 'Generated contract document'
      });
      
      console.log(`Contract saved successfully: ${fileName}`);
    } catch (error) {
      console.error('Error saving contract document:', error);
      throw error;
    }
  },

  // Save statement version as COGS document
  async saveStatementAsCogsDocument(projectId: string, fileName: string, statementVersion: any): Promise<void> {
    try {
      const filePath = `projects/${projectId}/${fileName}.json`;
      const jsonContent = JSON.stringify(statementVersion, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading COGS document:', uploadError);
        throw uploadError;
      }
      
      // Create project document record
      await this.createProjectDocumentRecord({
        project_id: projectId,
        file_name: `${fileName}.json`,
        file_path: filePath,
        file_type: 'application/json',
        file_size: blob.size,
        customer_facing: false,
        notes: 'COGS data from converted statement'
      });
      
      console.log(`COGS document saved successfully: ${fileName}`);
    } catch (error) {
      console.error('Error saving COGS document:', error);
      throw error;
    }
  },

  // Create project document record helper
  async createProjectDocumentRecord(docData: any): Promise<void> {
    const { error: dbError } = await supabase
      .from('project_documents')
      .insert({
        ...docData,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (dbError) {
      console.error('Error recording project document:', dbError);
      throw dbError;
    }
  },

  // Save estimate document to lead folder
  async saveEstimateDocument(leadId: string, fileName: string, htmlContent: string): Promise<void> {
    try {
      const filePath = `leads/${leadId}/estimates/${fileName}`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, {
          contentType: 'text/html',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading estimate:', uploadError);
        throw uploadError;
      }
      
      // Create lead document record
      await this.createLeadDocumentRecord({
        lead_id: leadId,
        file_name: fileName,
        file_path: filePath,
        file_type: 'text/html',
        file_size: blob.size,
        customer_facing: true,
        notes: 'Generated written estimate'
      });
      
      console.log(`Estimate saved successfully: ${fileName}`);
    } catch (error) {
      console.error('Error saving estimate document:', error);
      throw error;
    }
  },

  // Create lead document record helper
  async createLeadDocumentRecord(docData: any): Promise<void> {
    const { error: dbError } = await supabase
      .from('lead_documents')
      .insert({
        ...docData,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (dbError) {
      console.error('Error recording lead document:', dbError);
      throw dbError;
    }
  },

  async deleteCustomerDocument(documentId: string): Promise<void> {
    const { data: doc, error: fetchError } = await supabase
      .from('customer_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('customer_documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw dbError;
    }
  }
};