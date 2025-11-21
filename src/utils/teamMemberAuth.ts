import { supabase } from "@/integrations/supabase/client";

export interface CreateTeamMemberAuthRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface CreateTeamMemberAuthResponse {
  success: boolean;
  user?: any;
  message?: string;
  error?: string;
}

export async function createTeamMemberAuth(
  request: CreateTeamMemberAuthRequest
): Promise<CreateTeamMemberAuthResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-team-member-auth', {
      body: request
    });

    if (error) {
      console.error('Edge function error:', error);
      return { success: false, error: error.message || 'Failed to create team member auth' };
    }

    return data as CreateTeamMemberAuthResponse;
  } catch (error) {
    console.error('Failed to call create-team-member-auth function:', error);
    return { success: false, error: 'Failed to create team member auth' };
  }
}