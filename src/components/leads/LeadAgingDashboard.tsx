import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, TrendingUp, Users } from "lucide-react";
import { LeadAutomationService } from "@/services/leadAutomationService";
import { Lead } from "@/services/supabaseService";

interface AgingBuckets {
  recent: Lead[];
  thirtyToNinety: Lead[];
  ninetyToOneEighty: Lead[];
  stale: Lead[];
}

export const LeadAgingDashboard = () => {
  const [buckets, setBuckets] = useState<AgingBuckets>({
    recent: [],
    thirtyToNinety: [],
    ninetyToOneEighty: [],
    stale: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgingData();
  }, []);

  const loadAgingData = async () => {
    try {
      const data = await LeadAutomationService.getLeadsByAging();
      setBuckets(data);
    } catch (error) {
      console.error('Error loading aging data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = (leads: Lead[]) => {
    return leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);
  };

  const getBucketColor = (bucketName: string) => {
    switch (bucketName) {
      case 'recent': return 'bg-green-50 border-green-200';
      case 'thirtyToNinety': return 'bg-yellow-50 border-yellow-200';
      case 'ninetyToOneEighty': return 'bg-orange-50 border-orange-200';
      case 'stale': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getBadgeVariant = (bucketName: string) => {
    switch (bucketName) {
      case 'recent': return 'default';
      case 'thirtyToNinety': return 'secondary';
      case 'ninetyToOneEighty': return 'destructive';
      case 'stale': return 'destructive';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const bucketData = [
    {
      title: "Recent Quotes",
      subtitle: "0-30 days",
      leads: buckets.recent,
      icon: Clock,
      key: 'recent'
    },
    {
      title: "Warm Leads",
      subtitle: "30-90 days",
      leads: buckets.thirtyToNinety,
      icon: Calendar,
      key: 'thirtyToNinety'
    },
    {
      title: "At Risk",
      subtitle: "90-180 days",
      leads: buckets.ninetyToOneEighty,
      icon: TrendingUp,
      key: 'ninetyToOneEighty'
    },
    {
      title: "Stale Leads",
      subtitle: "180+ days",
      leads: buckets.stale,
      icon: Users,
      key: 'stale'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lead Aging Dashboard</h2>
        <Badge variant="outline" className="text-sm">
          Total Pipeline: {Object.values(buckets).flat().length} leads
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bucketData.map((bucket) => {
          const Icon = bucket.icon;
          const totalValue = calculateTotalValue(bucket.leads);
          const avgValue = bucket.leads.length > 0 ? totalValue / bucket.leads.length : 0;

          return (
            <Card 
              key={bucket.key} 
              className={`${getBucketColor(bucket.key)} transition-all hover:shadow-md`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium">
                    {bucket.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {bucket.subtitle}
                  </p>
                </div>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{bucket.leads.length}</span>
                    <Badge variant={getBadgeVariant(bucket.key) as any}>
                      {bucket.leads.length} leads
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Total Value: ${totalValue.toLocaleString()}</div>
                    <div>Avg Value: ${Math.round(avgValue).toLocaleString()}</div>
                  </div>

                  {bucket.leads.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs font-medium">Recent:</p>
                      <div className="space-y-1">
                        {bucket.leads.slice(0, 2).map((lead) => (
                          <div key={lead.id} className="text-xs text-muted-foreground">
                            {lead.first_name} {lead.last_name} - {lead.company}
                          </div>
                        ))}
                        {bucket.leads.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{bucket.leads.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};