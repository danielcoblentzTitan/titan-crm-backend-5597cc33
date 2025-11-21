import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Calendar,
  CheckCircle
} from "lucide-react";
import { LeadAutomationService } from "@/services/leadAutomationService";

interface LeadMetrics {
  totalLeads: number;
  activeLeads: number;
  wonLeads: number;
  lostLeads: number;
  winRate: number;
  avgResponseTime: number;
  avgQuoteToClose: number;
}

export const LeadMetricsDashboard = () => {
  const [metrics, setMetrics] = useState<LeadMetrics>({
    totalLeads: 0,
    activeLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    winRate: 0,
    avgResponseTime: 0,
    avgQuoteToClose: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await LeadAutomationService.getLeadMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metricCards = [
    {
      title: "Total Leads",
      value: metrics.totalLeads,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Pipeline",
      value: metrics.activeLeads,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Win Rate",
      value: `${metrics.winRate}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      progress: metrics.winRate
    },
    {
      title: "Avg Response Time",
      value: `${metrics.avgResponseTime}h`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Metrics</h2>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            {metrics.wonLeads} Won
          </Badge>
          <Badge variant="outline" className="text-red-600">
            {metrics.lostLeads} Lost
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          
          return (
            <Card key={card.title} className={`${card.bgColor} border-0`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </div>
                  
                  {card.progress !== undefined && (
                    <div className="space-y-1">
                      <Progress 
                        value={card.progress} 
                        className="h-2" 
                      />
                      <p className="text-xs text-muted-foreground">
                        Target: 75%
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Average Quote to Close
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {metrics.avgQuoteToClose} days
            </div>
            <p className="text-xs text-muted-foreground">
              Time from quote sent to deal closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Leads</span>
                <span className="font-medium">{metrics.activeLeads}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Conversion Rate</span>
                <span className="font-medium">{metrics.winRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pipeline Status</span>
                <Badge variant={metrics.winRate > 20 ? "default" : "destructive"}>
                  {metrics.winRate > 20 ? "Healthy" : "Needs Attention"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};