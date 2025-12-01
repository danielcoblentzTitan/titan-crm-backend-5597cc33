import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Users } from "lucide-react";
import { Lead } from "@/services/supabaseService";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface HotListTrackerProps {
  leads: Lead[];
}

export const HotListTracker = ({ leads }: HotListTrackerProps) => {
  const [leadEstimates, setLeadEstimates] = useState<Record<string, number>>({});

  console.log('=== ALL LEADS DEBUG ===');
  console.log('Total leads received:', leads.length);
  leads.forEach(lead => {
    console.log(`Lead: ${lead.first_name} ${lead.last_name} | Status: "${lead.status}" | Priority: "${lead.priority}" | Building Type: "${lead.building_type}" | Archived: ${lead.archived_at ? 'YES' : 'NO'}`);
  });

  const hotListLeads = leads.filter(lead => 
    !lead.archived_at && 
    (lead.status === 'Hot List' || 
     lead.priority === 'Hot' || 
     lead.priority === 'High' || 
     lead.priority === 'high')
  );

  console.log('Hot list leads found:', hotListLeads.length);
  console.log('Hot list leads:', hotListLeads.map(l => `${l.first_name} ${l.last_name} - Building Type: ${l.building_type}`));
  console.log('=== END DEBUG ===');

  useEffect(() => {
    const fetchEstimates = async () => {
      if (hotListLeads.length === 0) return;

      console.log('Fetching estimates for hot list leads:', hotListLeads.map(l => `${l.first_name} ${l.last_name} (${l.id})`));
      
      const estimates: Record<string, number> = {};
      
      for (const lead of hotListLeads) {
        console.log(`Fetching estimate for ${lead.first_name} ${lead.last_name} (ID: ${lead.id})`);
        
        const { data, error } = await supabase
          .from('estimates')
          .select('estimated_price')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log(`Estimate result for ${lead.first_name}:`, { data, error });

        if (!error && data) {
          estimates[lead.id] = data.estimated_price;
          console.log(`Set estimate for ${lead.first_name}: $${data.estimated_price}`);
        } else if (error) {
          console.error(`Error fetching estimate for ${lead.first_name}:`, error);
        } else {
          console.log(`No estimate found for ${lead.first_name}, using fallback: $${lead.estimated_value || 0}`);
        }
      }
      
      console.log('Final estimates object:', estimates);
      setLeadEstimates(estimates);
    };

    fetchEstimates();
  }, [hotListLeads.map(lead => lead.id).join(',')]);

  // Function to get project type indicator
  const getProjectTypeIndicator = (lead: Lead): string => {
    const buildingType = lead.building_type?.toLowerCase() || '';
    
    if (buildingType.includes('commercial')) return 'C - ';
    if (buildingType.includes('barndominium') || buildingType.includes('barndo')) return 'B - ';
    if (buildingType.includes('residential')) return 'R - ';
    
    // Default to residential if unclear
    return 'R - ';
  };

  const totalValue = hotListLeads.reduce((sum, lead) => sum + (leadEstimates[lead.id] || lead.estimated_value || 0), 0);
  const averageValue = hotListLeads.length > 0 ? totalValue / hotListLeads.length : 0;

  return (
    <Card className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900">Hot List</h3>
        </div>

        <div className="flex justify-between items-start">
          <div className="flex-1">
            {hotListLeads.length > 0 && (
              <div>
                <p className="text-sm font-bold text-red-800 mb-3">Hot Leads:</p>
                <div className="space-y-1">
                  {hotListLeads.map(lead => {
                    const estimatePrice = leadEstimates[lead.id];
                    const leadValue = lead.estimated_value || 0;
                    const displayValue = estimatePrice || leadValue;
                    
                     return (
                       <div key={lead.id} className="text-red-700">
                         {getProjectTypeIndicator(lead)}{lead.first_name} {lead.last_name} - ${displayValue > 0 ? displayValue.toLocaleString() : '0'}
                       </div>
                     );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="text-right space-y-2">
            <div className="flex justify-between items-center min-w-[120px]">
              <span className="text-muted-foreground">Count</span>
              <span className="font-bold text-red-800">{hotListLeads.length}</span>
            </div>
            <div className="flex justify-between items-center min-w-[120px]">
              <span className="text-muted-foreground">Value</span>
              <span className="font-bold text-green-700">${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center min-w-[120px]">
              <span className="text-muted-foreground">Avg</span>
              <span className="font-bold text-gray-800">${Math.round(averageValue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};