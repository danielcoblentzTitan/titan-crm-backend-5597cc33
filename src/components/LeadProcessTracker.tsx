import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Target, 
  CheckCircle,
  ArrowRight 
} from "lucide-react";
import { Lead } from "@/services/supabaseService";

interface LeadProcessTrackerProps {
  leads: Lead[];
}

export const LeadProcessTracker = ({ leads }: LeadProcessTrackerProps) => {
  // Filter leads by status/stage
  const activeLeads = leads.filter(lead => 
    !lead.archived_at && 
    ['New', 'Contacted', 'Qualified', 'Follow-up'].includes(lead.status || '')
  );

  const decisionMakingLeads = leads.filter(lead => 
    !lead.archived_at && 
    ['In Decision', 'Proposal Sent', 'Negotiating'].includes(lead.status || '')
  );

  const hotListLeads = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'Hot List' || 
     lead.priority === 'Hot' || 
     lead.priority === 'High' || 
     lead.priority === 'high')
  );

  // Function to get project type indicator
  const getProjectTypeIndicator = (lead: Lead): string => {
    const buildingType = lead.building_type?.toLowerCase() || '';
    
    if (buildingType.includes('commercial')) return 'C - ';
    if (buildingType.includes('barndominium') || buildingType.includes('barndo')) return 'B - ';
    if (buildingType.includes('residential')) return 'R - ';
    
    // Default to residential if unclear
    return 'R - ';
  };

  const wonLeads = leads.filter(lead => 
    !lead.archived_at && 
    lead.status === 'Won'
  );

  // Calculate values for each stage
  const calculateStageData = (stageLeads: Lead[]) => {
    const total = stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
    const average = stageLeads.length > 0 ? total / stageLeads.length : 0;
    return { count: stageLeads.length, total, average };
  };

  const activeData = calculateStageData(activeLeads);
  const decisionData = calculateStageData(decisionMakingLeads);
  const hotListData = calculateStageData(hotListLeads);
  const wonData = calculateStageData(wonLeads);

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Lead Pipeline Tracker</h3>
          <Badge variant="outline" className="text-blue-700 border-blue-300">
            Total Pipeline: ${(activeData.total + decisionData.total + hotListData.total).toLocaleString()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Active Leads */}
          <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900">Active Leads</h4>
              </div>
              <ArrowRight className="h-4 w-4 text-blue-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-bold text-blue-800">{activeData.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-bold text-green-700">${activeData.total.toLocaleString()}</span>
              </div>
              {activeData.count > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg</span>
                  <span className="text-sm font-medium">${Math.round(activeData.average).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* In Decision Making */}
          <div className="bg-white rounded-lg p-4 border border-orange-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <h4 className="font-medium text-orange-900">Decision Making</h4>
              </div>
              <ArrowRight className="h-4 w-4 text-orange-400" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-bold text-orange-800">{decisionData.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-bold text-green-700">${decisionData.total.toLocaleString()}</span>
              </div>
              {decisionData.count > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg</span>
                  <span className="text-sm font-medium">${Math.round(decisionData.average).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hot List */}
          <div className="bg-white rounded-lg p-4 border border-red-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Target className="h-4 w-4 text-red-600" />
                </div>
                <h4 className="font-medium text-red-900">Hot List</h4>
              </div>
              <ArrowRight className="h-4 w-4 text-red-400" />
            </div>
            
            {/* Show names for hot list only */}
            {hotListLeads.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-700 mb-1">Hot Leads:</p>
                 <div className="space-y-1 max-h-20 overflow-y-auto">
                   {hotListLeads.map(lead => (
                     <div key={lead.id} className="text-xs text-black">
                       {getProjectTypeIndicator(lead)}{lead.first_name} {lead.last_name} - ${(lead.estimated_value || 0).toLocaleString()}
                     </div>
                   ))}
                 </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-bold text-red-800">{hotListData.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-bold text-green-700">${hotListData.total.toLocaleString()}</span>
              </div>
              {hotListData.count > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg</span>
                  <span className="text-sm font-medium">${Math.round(hotListData.average).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Won */}
          <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <h4 className="font-medium text-green-900">Won</h4>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-bold text-green-800">{wonData.count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="font-bold text-green-700">${wonData.total.toLocaleString()}</span>
              </div>
              {wonData.count > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg</span>
                  <span className="text-sm font-medium">${Math.round(wonData.average).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t border-blue-100">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="text-center">
              <span className="text-muted-foreground">Total Leads:</span>
              <span className="ml-2 font-bold text-blue-900">
                {activeData.count + decisionData.count + hotListData.count + wonData.count}
              </span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Conversion Rate:</span>
              <span className="ml-2 font-bold text-green-700">
                {activeData.count + decisionData.count + hotListData.count > 0 
                  ? Math.round((wonData.count / (activeData.count + decisionData.count + hotListData.count + wonData.count)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="text-center">
              <span className="text-muted-foreground">Pipeline Health:</span>
              <span className="ml-2 font-bold text-purple-700">
                {hotListData.count > 0 ? 'Strong' : decisionData.count > 0 ? 'Good' : 'Building'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};