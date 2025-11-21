import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";
import { Lead } from "@/services/supabaseService";

interface LeadTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  leads: Lead[];
}

export const LeadTabs = ({ activeTab, onTabChange, children, leads }: LeadTabsProps) => {
  // Calculate counts for each tab
  const activeCounts = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'New' || lead.status === 'Contacted' || lead.status === 'Qualified') &&
    lead.priority !== 'Hot' && lead.priority !== 'High'
  ).length;

  const decisionCounts = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'Proposal' || lead.status === 'Negotiation')
  ).length;

  const hotlistCounts = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'Hot List' || lead.priority === 'Hot' || lead.priority === 'High')
  ).length;

  const wonCounts = leads.filter(lead => lead.status === 'Won').length;

  const lostCounts = leads.filter(lead => 
    lead.status === 'Lost' || lead.archived_at
  ).length;

  // Calculate total value for hot list
  const hotlistValue = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'Hot List' || lead.priority === 'Hot' || lead.priority === 'High')
  ).reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {/* Mobile Tabs - Only Active and Hot List */}
      <TabsList className="grid w-full grid-cols-2 sm:hidden">
        <TabsTrigger value="active">
          Active {activeCounts > 0 && `(${activeCounts})`}
        </TabsTrigger>
        <TabsTrigger value="hotlist">
          Hot List {hotlistCounts > 0 && `(${hotlistCounts})`}
        </TabsTrigger>
      </TabsList>

      {/* Desktop Tabs - All tabs */}
      <TabsList className="hidden sm:grid w-full grid-cols-6">
        <TabsTrigger value="active">
          Active Leads {activeCounts > 0 && `(${activeCounts})`}
        </TabsTrigger>
        <TabsTrigger value="decision">
          In Decision Making {decisionCounts > 0 && `(${decisionCounts})`}
        </TabsTrigger>
        <TabsTrigger value="hotlist">
          Hot List {hotlistCounts > 0 && `(${hotlistCounts})`}
        </TabsTrigger>
        <TabsTrigger value="won">
          Won {wonCounts > 0 && `(${wonCounts})`}
        </TabsTrigger>
        <TabsTrigger value="lost">
          Lost/Archived {lostCounts > 0 && `(${lostCounts})`}
        </TabsTrigger>
        <TabsTrigger value="map">
          Map View
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab} className="space-y-4">
        {children}
      </TabsContent>
    </Tabs>
  );
};