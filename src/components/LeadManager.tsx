
import { useState, useCallback, useRef } from "react";
import { Users } from "lucide-react";
import { Lead } from "@/services/supabaseService";
import { LeadFilters } from "./leads/LeadFilters";
import { LeadList } from "./leads/LeadList";
import { LeadDialog } from "./leads/LeadDialog";
import { LeadTabs } from "./leads/LeadTabs";
import { LeadsMapView } from "./leads/LeadsMapView";
import { UnifiedEstimateForm } from "./UnifiedEstimateForm";
import { LeadProcessTracker } from "./LeadProcessTracker";

import { useLeadManager } from "./lead-manager/useLeadManager";
import { useLeadFilters } from "./lead-manager/useLeadFilters";
import { estimateService, EstimateData } from "@/services/estimate/estimateService";

const LeadManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEstimateFormOpen, setIsEstimateFormOpen] = useState(false);
  const [estimateLead, setEstimateLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  console.log('LeadManager render - editingLead:', editingLead?.id);

  const {
    leads,
    teamMembers,
    loading,
    updating,
    handleAddLead,
    handleEditLead,
    handleDeleteLead,
    handleUpdateStatus,
    updateLeadInPlace
  } = useLeadManager();

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assignedToFilter,
    setAssignedToFilter,
    activeTab,
    setActiveTab,
    filteredLeads,
    clearFilters
  } = useLeadFilters(leads);

  // Separate active leads (until Proposal status) and contacts (Proposal onwards)
  const activeLeads = filteredLeads.filter(lead => lead.status !== 'Proposal' && lead.status !== 'Won' && lead.status !== 'Lost');
  const contactLeads = filteredLeads.filter(lead => lead.status === 'Proposal' || lead.status === 'Won' || lead.status === 'Lost');

  const handleCreateEstimate = useCallback((lead: Lead) => {
    console.log('Opening estimate form for lead:', lead.id);
    setEstimateLead(lead);
    setIsEstimateFormOpen(true);
  }, []);

  const handleEstimateCreated = useCallback(async (estimateData: EstimateData) => {
    if (!estimateLead) return;
    updateLeadInPlace(estimateLead.id, { estimated_value: estimateData.estimatedPrice });
  }, [estimateLead, updateLeadInPlace]);

  const handleConvertToWrittenEstimate = useCallback(async (estimateData: EstimateData) => {
    if (!estimateLead) return;
    
    try {
      await estimateService.createWrittenEstimate(estimateLead, estimateData);
      updateLeadInPlace(estimateLead.id, { 
        status: 'Qualified',
        estimated_value: estimateData.estimatedPrice 
      });
    } catch (error) {
      console.error('Error creating written estimate:', error);
    }
  }, [estimateLead, updateLeadInPlace]);

  const handleAddToHotlist = useCallback(async (leadId: string) => {
    updateLeadInPlace(leadId, { priority: 'Hot', status: 'Hot List' });
  }, [updateLeadInPlace]);

  const handleArchiveLead = useCallback(async (leadId: string) => {
    await estimateService.updateLeadStatusForEstimate(leadId, 'archive');
    updateLeadInPlace(leadId, { status: 'Lost' });
  }, [updateLeadInPlace]);

  const handleAddLeadSubmit = useCallback(async (leadData: Partial<Lead>) => {
    await handleAddLead(leadData);
    setIsAddDialogOpen(false);
  }, [handleAddLead]);

  const handleEditLeadSubmit = useCallback(async (leadData: Partial<Lead>) => {
    if (!editingLead) return;
    
    await handleEditLead(editingLead, leadData);
    setIsEditDialogOpen(false);
    setEditingLead(null);
  }, [editingLead, handleEditLead]);

  console.log('Rendering LeadManager - loading:', loading, 'leads:', leads.length, 'filtered:', filteredLeads.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="block sm:hidden">
        <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-sm opacity-90">Lead Management</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Lead Management
        </h2>
        <LeadDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          teamMembers={teamMembers}
          onSubmit={handleAddLeadSubmit}
          title="Add New Lead"
        />
      </div>

      {/* Lead Process Tracker */}
      <LeadProcessTracker leads={leads} />

      <LeadTabs activeTab={activeTab} onTabChange={setActiveTab} leads={leads}>
        {activeTab === 'map' ? (
          <LeadsMapView leads={leads} onLeadSelect={(lead) => setSelectedLead(lead)} />
        ) : (
          <>
            <LeadFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              assignedToFilter={assignedToFilter}
              setAssignedToFilter={setAssignedToFilter}
              teamMembers={teamMembers}
              clearFilters={clearFilters}
            />
            <LeadList
              activeLeads={activeLeads || []}
              contactLeads={contactLeads || []}
              teamMembers={teamMembers}
              updating={updating}
              onEdit={(lead: Lead) => {
                setEditingLead(lead);
                setIsEditDialogOpen(true);
              }}
              onDelete={handleDeleteLead}
              onCreateEstimate={handleCreateEstimate}
              onUpdateStatus={handleUpdateStatus}
              onAddLead={() => setIsAddDialogOpen(true)}
              activeTab={activeTab}
              onAddToHotlist={handleAddToHotlist}
              onArchiveLead={handleArchiveLead}
              updateLeadInPlace={updateLeadInPlace}
            />
          </>
        )}
      </LeadTabs>

      {editingLead && (
        <LeadDialog
          key={`edit-${editingLead.id}`}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          lead={editingLead}
          teamMembers={teamMembers}
          onSubmit={handleEditLeadSubmit}
          title="Edit Lead"
          isEdit
        />
      )}

      {estimateLead && (
        <UnifiedEstimateForm
          lead={estimateLead}
          isOpen={isEstimateFormOpen}
          onOpenChange={(open) => {
            setIsEstimateFormOpen(open);
            if (!open) {
              setEstimateLead(null);
            }
          }}
          onEstimateCreated={handleEstimateCreated}
        />
      )}
    </div>
  );
};

// Export the enhanced version instead
export { default } from "./leads/EnhancedLeadManager";
