import { useState, useEffect, useCallback } from "react";
import { Lead, TeamMember, supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";

export const useLeadManager = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null); // Track which lead is being updated
  const { toast } = useToast();

  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const [leadsData, teamData] = await Promise.all([
        supabaseService.getLeads(),
        supabaseService.getTeamMembers()
      ]);
      setLeads(leadsData);
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleAddLead = useCallback(async (leadData: Partial<Lead>) => {
    console.log('handleAddLead called with:', leadData);
    try {
      console.log('Calling supabaseService.addLead...');
      const newLead = await supabaseService.addLead(leadData as Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assigned_to_name'>);
      console.log('Lead created successfully:', newLead);
      setLeads(prev => [newLead, ...prev]);
      toast({
        title: "Success",
        description: "Lead created successfully"
      });
    } catch (error) {
      console.error('Error adding lead:', error);
      toast({
        title: "Error",
        description: "Failed to create lead",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const handleEditLead = useCallback(async (lead: Lead, updates: Partial<Lead>) => {
    try {
      // Ensure assigned_to is properly handled
      const sanitizedUpdates = { ...updates };
      if ('assigned_to' in sanitizedUpdates) {
        // Convert "unassigned" string to null for the database
        if (sanitizedUpdates.assigned_to === 'unassigned') {
          sanitizedUpdates.assigned_to = null;
        }
      }
      
      console.log('handleEditLead called with:', { leadId: lead.id, sanitizedUpdates });
      
      const updatedLead = await supabaseService.updateLead(lead.id, sanitizedUpdates);
      setLeads(prev => prev.map(l => l.id === lead.id ? updatedLead : l));
      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteLead = useCallback(async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      console.log('Attempting to delete lead:', leadId);
      
      // Find the lead to get its name for better logging
      const leadToDelete = leads.find(l => l.id === leadId);
      const leadName = leadToDelete ? `${leadToDelete.first_name} ${leadToDelete.last_name}` : 'Unknown Lead';
      
      await supabaseService.deleteLead(leadId);
      
      // Remove from local state
      setLeads(prev => {
        const newLeads = prev.filter(l => l.id !== leadId);
        console.log(`Lead "${leadName}" deleted. Remaining leads:`, newLeads.length);
        return newLeads;
      });
      
      toast({
        title: "Success",
        description: `Lead "${leadName}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive"
      });
    }
  }, [leads, toast]);

  const handleUpdateStatus = useCallback(async (leadId: string, status: string) => {
    if (updating === leadId) {
      return; // Prevent duplicate calls
    }
    
    try {
      setUpdating(leadId);
      const updatedLead = await supabaseService.updateLead(leadId, { status });
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedLead } : l));
      
      toast({
        title: "Success",
        description: `Lead status updated to ${status}`
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast({
        title: "Error", 
        description: "Failed to update lead status",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  }, [updating, toast]);

  const updateLeadInPlace = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    if (updating === leadId) {
      return; // Prevent duplicate calls
    }
    
    try {
      setUpdating(leadId);
      
      // Ensure assigned_to is properly handled
      const sanitizedUpdates = { ...updates };
      if ('assigned_to' in sanitizedUpdates) {
        // Convert "unassigned" string to null for the database
        if (sanitizedUpdates.assigned_to === 'unassigned') {
          sanitizedUpdates.assigned_to = null;
        }
      }
      
      console.log('updateLeadInPlace called with:', { leadId, sanitizedUpdates });
      
      const updatedLead = await supabaseService.updateLead(leadId, sanitizedUpdates);
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updatedLead } : l));
      
      toast({
        title: "Success",
        description: "Lead updated successfully"
      });
    } catch (error) {
      console.error('Error updating lead in place:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  }, [updating, toast]);

  return {
    leads,
    teamMembers,
    loading,
    updating, // Export updating state
    handleAddLead,
    handleEditLead,
    handleDeleteLead,
    handleUpdateStatus,
    updateLeadInPlace,
    refreshLeads: loadLeads
  };
};