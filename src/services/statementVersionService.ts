import { supabase } from "@/integrations/supabase/client";

export interface StatementVersion {
  id: string;
  project_id: string;
  version_number: number;
  statement_name: string;
  statement_data: any;
  created_at: string;
  created_by?: string;
  file_path?: string;
}

export const statementVersionService = {
  async getVersions(projectId: string): Promise<StatementVersion[]> {
    const { data, error } = await supabase
      .from('statement_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching statement versions:', error);
      throw error;
    }

    return data || [];
  },

  async saveVersion(
    projectId: string,
    statementData: any,
    projectName: string,
    filePath?: string
  ): Promise<StatementVersion> {
    // Get the next version number for this user's versions
    const { data: versions } = await supabase
      .from('statement_versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;
    const statementName = `${projectName} - V${nextVersion}`;

    const { data, error } = await supabase
      .from('statement_versions')
      .insert({
        project_id: projectId,
        version_number: nextVersion,
        statement_name: statementName,
        statement_data: statementData,
        file_path: filePath
        // created_by will be set automatically by the database default
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving statement version:', error);
      throw error;
    }

    return data;
  },

  async updateVersion(
    versionId: string,
    statementData: any,
    projectName: string
  ): Promise<StatementVersion> {
    const { data, error } = await supabase
      .from('statement_versions')
      .update({
        statement_data: statementData,
        statement_name: projectName
      })
      .eq('id', versionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating statement version:', error);
      throw error;
    }

    return data;
  },

  async getVersion(versionId: string): Promise<StatementVersion | null> {
    const { data, error } = await supabase
      .from('statement_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error) {
      console.error('Error fetching statement version:', error);
      return null;
    }

    return data;
  }
};