import { useState, useCallback, useEffect } from "react";
import { Users, Calendar, TrendingUp, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lead, TeamMember } from "@/services/supabaseService";
import { LeadDialog } from "./LeadDialog";
import { LeadList } from "./LeadList";
import { LeadsMapView } from "./LeadsMapView";
import { UnifiedEstimateForm } from "../UnifiedEstimateForm";
import { LeadAgingDashboard } from "./LeadAgingDashboard";
import { LeadMetricsDashboard } from "./LeadMetricsDashboard";
import { FollowUpTaskManager } from "./FollowUpTaskManager";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { SimplifiedLeadFilters } from "./SimplifiedLeadFilters";
import { SystemAdminPanel } from "./SystemAdminPanel";
import { LeadActivityTimeline } from "./LeadActivityTimeline";
import { LeadScoreCard } from "./LeadScoreCard";
import { BulkOperationsToolbar } from "./BulkOperationsToolbar";
import { AdvancedWorkflowAutomation } from "./AdvancedWorkflowAutomation";
import EnhancedMondayCrmImport from "./EnhancedMondayCrmImport";
import { UpdateCatchDatesButton } from "./UpdateCatchDatesButton";
import { BulkEstimateUpdater } from "./BulkEstimateUpdater";
import { useLeadManager } from "../lead-manager/useLeadManager";
import { useEnhancedLeadFilters } from "./useEnhancedLeadFilters";
import { estimateService, EstimateData } from "@/services/estimate/estimateService";

const EnhancedLeadManager = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEstimateFormOpen, setIsEstimateFormOpen] = useState(false);
  const [estimateLead, setEstimateLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

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
    filteredLeads,
    activeLeads,
    contactLeads,
    clearFilters,
    activeFiltersCount,
    sortField,
    sortDirection,
    handleSort
  } = useEnhancedLeadFilters(leads);

  const handleCreateEstimate = useCallback((lead: Lead) => {
    console.log('Opening estimate form for lead:', lead.id);
    setEstimateLead(lead);
    setIsEstimateFormOpen(true);
  }, []);

  const handleEstimateCreated = useCallback(async (estimateData: EstimateData) => {
    if (!estimateLead) return;
    
    // Update lead status to Quoted and set quote date
    updateLeadInPlace(estimateLead.id, { 
      estimated_value: estimateData.estimatedPrice,
      stage: 'Quoted',
      quote_date: new Date().toISOString().split('T')[0]
    });
  }, [estimateLead, updateLeadInPlace]);

  const handleConvertToWrittenEstimate = useCallback(async (estimateData: EstimateData) => {
    if (!estimateLead) return;
    
    try {
      await estimateService.createWrittenEstimate(estimateLead, estimateData);
      updateLeadInPlace(estimateLead.id, { 
        stage: 'Quoted',
        estimated_value: estimateData.estimatedPrice,
        quote_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating written estimate:', error);
    }
  }, [estimateLead, updateLeadInPlace]);

  const handleAddToHotlist = useCallback(async (leadId: string) => {
    updateLeadInPlace(leadId, { 
      priority: 'Hot', 
      stage: 'Negotiating',
      sub_status: 'In Decision Making'
    });
  }, [updateLeadInPlace]);

  const handleArchiveLead = useCallback(async (leadId: string) => {
    await estimateService.updateLeadStatusForEstimate(leadId, 'archive');
    updateLeadInPlace(leadId, { 
      stage: 'Lost',
      deals_active: false
    });
  }, [updateLeadInPlace]);

  const handleAddLeadSubmit = useCallback(async (leadData: Partial<Lead>) => {
    // Set default stage and deals_active for new leads
    const enhancedLeadData = {
      ...leadData,
      stage: leadData.stage || 'New',
      deals_active: true
    };
    await handleAddLead(enhancedLeadData);
    setIsAddDialogOpen(false);
  }, [handleAddLead]);

  const handleEditLeadSubmit = useCallback(async (leadData: Partial<Lead>) => {
    if (!editingLead) return;
    
    await handleEditLead(editingLead, leadData);
    setIsEditDialogOpen(false);
    setEditingLead(null);
  }, [editingLead, handleEditLead]);

  const handleAssignLead = useCallback(async (leadId: string, assignedTo: string | null) => {
    try {
      updateLeadInPlace(leadId, { assigned_to: assignedTo });
    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  }, [updateLeadInPlace]);

  // Quick stats for dashboard header
  const quickStats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(l => !['Won', 'Lost'].includes(l.stage || '')).length,
    quotedLeads: leads.filter(l => l.stage === 'Quoted').length,
    hotLeads: leads.filter(l => l.priority === 'Hot').length,
    totalValue: leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading enhanced lead management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground">
            Comprehensive lead tracking, automation, and analytics
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.totalLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.activeLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quoted</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.quotedLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats.hotLeads}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${quickStats.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="list">Leads</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="map">Map</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <BulkOperationsToolbar
            leads={leads}
            selectedLeads={selectedLeads}
            onSelectionChange={setSelectedLeads}
            teamMembers={teamMembers}
            onBulkUpdate={async (leadIds, updates) => {
              for (const leadId of leadIds) {
                await updateLeadInPlace(leadId, updates);
              }
            }}
            onBulkDelete={async (leadIds) => {
              for (const leadId of leadIds) {
                await handleDeleteLead(leadId);
              }
            }}
          />
          
          <SimplifiedLeadFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            clearFilters={clearFilters}
          />
          
          <LeadList
            activeLeads={activeLeads}
            contactLeads={contactLeads}
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
            activeTab="list"
            onAddToHotlist={handleAddToHotlist}
            onArchiveLead={handleArchiveLead}
            updateLeadInPlace={updateLeadInPlace}
            onAssignLead={handleAssignLead}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="aging" className="space-y-4">
          <LeadAgingDashboard />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <FollowUpTaskManager leads={leads} teamMembers={teamMembers} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <EmailTemplateManager />
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <AdvancedWorkflowAutomation />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnhancedMondayCrmImport />
            <UpdateCatchDatesButton />
            <BulkEstimateUpdater />
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
              <LeadsMapView 
                leads={[...activeLeads, ...contactLeads]} 
                onLeadSelect={(lead) => {
                  setEditingLead(lead);
                  setIsEditDialogOpen(true);
                }} 
              />
        </TabsContent>

        <TabsContent value="admin" className="space-y-4">
          <SystemAdminPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LeadDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        teamMembers={teamMembers}
        onSubmit={handleAddLeadSubmit}
        title="Add New Lead"
      />

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

export default EnhancedLeadManager;