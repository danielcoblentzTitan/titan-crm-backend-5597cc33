
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, Palette, FileText, Calendar, DollarSign, MessageCircle, HelpCircle, CheckCircle } from "lucide-react";
import { useProjectTabSettings } from "@/hooks/useProjectTabSettings";

interface CustomerPortalTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentPhase?: string;
  projectId: string;
}

const CustomerPortalTabs = ({ activeTab, onTabChange, currentPhase, projectId }: CustomerPortalTabsProps) => {
  const isPunchlistPhase = currentPhase?.toLowerCase().includes('punchlist') || currentPhase?.toLowerCase().includes('punch list');
  const { isTabEnabled, loading } = useProjectTabSettings(projectId);

  if (loading) {
    return (
      <div className="relative mb-8">
        <div className="flex w-full justify-center items-center h-12 bg-muted rounded-md">
          <span className="text-sm text-muted-foreground">Loading tabs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mb-8">
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="flex w-full justify-between" style={{flexWrap: 'nowrap'}}>
          {isTabEnabled('overview') && (
            <TabsTrigger 
              value="overview" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <Building2 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
          )}
          {isTabEnabled('schedule') && (
            <TabsTrigger 
              value="schedule" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span>Schedule</span>
            </TabsTrigger>
          )}
          {isTabEnabled('documents') && (
            <TabsTrigger 
              value="documents" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <FileText className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          )}
          {isTabEnabled('financial') && (
            <TabsTrigger 
              value="financial" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <DollarSign className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Financial</span>
              <span className="sm:hidden">Finance</span>
            </TabsTrigger>
          )}
          {isTabEnabled('messages') && (
            <TabsTrigger 
              value="messages" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <MessageCircle className="h-3 w-3 md:h-4 md:w-4" />
              <span>Messages</span>
            </TabsTrigger>
          )}
          {isTabEnabled('design') && (
            <TabsTrigger 
              value="design" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <Palette className="h-3 w-3 md:h-4 md:w-4" />
              <span>Design</span>
            </TabsTrigger>
          )}
          {isPunchlistPhase && isTabEnabled('punchlist') && (
            <TabsTrigger 
              value="punchlist" 
              className="flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm font-medium px-2 md:px-3 py-1 md:py-1.5 flex-shrink-0 whitespace-nowrap"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Punchlist</span>
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default CustomerPortalTabs;
