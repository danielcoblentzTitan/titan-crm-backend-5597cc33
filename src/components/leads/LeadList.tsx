import { Lead, TeamMember } from "@/services/supabaseService";
import { LeadCard } from "./LeadCard";
import { LeadTable } from "./LeadTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Table, Grid } from "lucide-react";

interface LeadListProps {
  activeLeads: Lead[];
  contactLeads: Lead[];
  teamMembers: TeamMember[];
  updating?: string | null;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onCreateEstimate: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onAddLead: () => void;
  activeTab: string;
  onAddToHotlist?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  updateLeadInPlace?: (leadId: string, updates: Partial<Lead>) => void;
  onAssignLead?: (leadId: string, assignedTo: string | null) => void;
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export const LeadList = ({
  activeLeads,
  contactLeads,
  teamMembers,
  updating,
  onEdit,
  onDelete,
  onCreateEstimate,
  onUpdateStatus,
  onAddLead,
  activeTab,
  onAddToHotlist,
  onArchiveLead,
  updateLeadInPlace,
  onAssignLead,
  sortField,
  sortDirection,
  onSort
}: LeadListProps) => {
  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'active':
        return 'No active leads found';
      case 'won':
        return 'No won leads found';
      case 'lost':
        return 'No lost or archived leads found';
      default:
        return 'No leads found';
    }
  };

  const getEmptyStateDescription = () => {
    switch (activeTab) {
      case 'active':
        return 'Create your first lead to start tracking potential customers';
      case 'won':
        return 'Won leads will appear here once you convert them';
      case 'lost':
        return 'Lost or archived leads will appear here';
      default:
        return 'Start by creating a new lead';
    }
  };

  const totalLeads = activeLeads.length + contactLeads.length;
  
  if (totalLeads === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {getEmptyStateMessage()}
          </h3>
          <p className="text-gray-500 mb-6">
            {getEmptyStateDescription()}
          </p>
          {activeTab === 'active' && (
            <Button onClick={onAddLead}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Lead
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="table" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Table View
          </TabsTrigger>
          <TabsTrigger value="cards" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            Card View
          </TabsTrigger>
        </TabsList>
        
        <Button onClick={onAddLead} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <TabsContent value="table" className="mt-0">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Leads ({activeLeads.length})</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contactLeads.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <LeadTable
              activeLeads={activeLeads}
              contactLeads={[]}
              teamMembers={teamMembers}
              updating={updating}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateEstimate={onCreateEstimate}
              onUpdateStatus={onUpdateStatus}
              onAddToHotlist={onAddToHotlist}
              onArchiveLead={onArchiveLead}
              updateLeadInPlace={updateLeadInPlace}
              onAssignLead={onAssignLead}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </TabsContent>
          
          <TabsContent value="contacts" className="mt-4">
            <LeadTable
              activeLeads={[]}
              contactLeads={contactLeads}
              teamMembers={teamMembers}
              updating={updating}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreateEstimate={onCreateEstimate}
              onUpdateStatus={onUpdateStatus}
              onAddToHotlist={onAddToHotlist}
              onArchiveLead={onArchiveLead}
              updateLeadInPlace={updateLeadInPlace}
              onAssignLead={onAssignLead}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
            />
          </TabsContent>
        </Tabs>
      </TabsContent>

      <TabsContent value="cards" className="mt-0">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Leads ({activeLeads.length})</TabsTrigger>
            <TabsTrigger value="contacts">Contacts ({contactLeads.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            {/* Mobile Layout - Active Leads */}
            <div className="block sm:hidden space-y-3 pb-20">
              {activeLeads.length > 0 ? (
                activeLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    teamMembers={teamMembers}
                    updating={updating}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCreateEstimate={onCreateEstimate}
                    onUpdateStatus={onUpdateStatus}
                    onAddToHotlist={onAddToHotlist}
                    onArchiveLead={onArchiveLead}
                    updateLeadInPlace={updateLeadInPlace}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active leads found
                </div>
              )}
            </div>

            {/* Desktop Layout - Active Leads */}
            <div className="hidden sm:block">
              {activeLeads.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {activeLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      teamMembers={teamMembers}
                      updating={updating}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onCreateEstimate={onCreateEstimate}
                      onUpdateStatus={onUpdateStatus}
                      onAddToHotlist={onAddToHotlist}
                      onArchiveLead={onArchiveLead}
                      updateLeadInPlace={updateLeadInPlace}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active leads found
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="contacts" className="mt-4">
            {/* Mobile Layout - Contacts */}
            <div className="block sm:hidden space-y-3 pb-20">
              {contactLeads.length > 0 ? (
                contactLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    teamMembers={teamMembers}
                    updating={updating}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCreateEstimate={onCreateEstimate}
                    onUpdateStatus={onUpdateStatus}
                    onAddToHotlist={onAddToHotlist}
                    onArchiveLead={onArchiveLead}
                    updateLeadInPlace={updateLeadInPlace}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts found
                </div>
              )}
            </div>

            {/* Desktop Layout - Contacts */}
            <div className="hidden sm:block">
              {contactLeads.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {contactLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      teamMembers={teamMembers}
                      updating={updating}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onCreateEstimate={onCreateEstimate}
                      onUpdateStatus={onUpdateStatus}
                      onAddToHotlist={onAddToHotlist}
                      onArchiveLead={onArchiveLead}
                      updateLeadInPlace={updateLeadInPlace}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts found
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Mobile Add Button */}
        <div className="block sm:hidden fixed bottom-16 right-4 z-40">
          <Button onClick={onAddLead} className="rounded-full w-14 h-14 shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};