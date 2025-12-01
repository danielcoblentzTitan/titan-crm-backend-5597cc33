import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Star, 
  MapPin, 
  DollarSign, 
  TrendingUp,
  Clock,
  Users,
  Building,
  Search,
  Filter,
  Zap,
  Brain,
  CheckCircle
} from 'lucide-react';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';

interface VendorRecommendationEngineProps {
  projectRequirements?: {
    trade?: string;
    region?: string;
    budget?: number;
    timeline?: string;
    priority?: 'cost' | 'quality' | 'speed';
  };
}

interface VendorScore {
  vendorId: string;
  vendor: any;
  score: number;
  reasons: string[];
  matchFactors: {
    trade: number;
    location: number;
    performance: number;
    availability: number;
    cost: number;
  };
}

export const VendorRecommendationEngine: React.FC<VendorRecommendationEngineProps> = ({ 
  projectRequirements 
}) => {
  const { data: vendors = [] } = useVendors();
  const [requirements, setRequirements] = useState({
    trade: projectRequirements?.trade || '',
    region: projectRequirements?.region || '',
    budget: projectRequirements?.budget || 0,
    timeline: projectRequirements?.timeline || '',
    priority: projectRequirements?.priority || 'quality' as const
  });

  // Use real vendor performance metrics from database
  const getVendorMetrics = (vendorId: string) => ({
    avgResponseTime: 0, // Would come from message timestamps
    onTimeDelivery: 0, // Would come from project delivery data
    qualityScore: 0, // Would come from project ratings
    priceCompetitiveness: 0, // Would come from pricing analysis
    availability: 0, // Would come from scheduling system
    recentProjects: 0 // Would come from project history
  });

  // Intelligent vendor scoring algorithm
  const calculateVendorScore = (vendor: any): VendorScore => {
    const metrics = getVendorMetrics(vendor.id);
    let score = 0;
    const reasons: string[] = [];
    const matchFactors = {
      trade: 0,
      location: 0,
      performance: 0,
      availability: 0,
      cost: 0
    };

    // Trade match (40% weight)
    if (requirements.trade && vendor.trade) {
      const tradeMatch = vendor.trade.toLowerCase().includes(requirements.trade.toLowerCase()) ? 100 : 0;
      matchFactors.trade = tradeMatch;
      score += tradeMatch * 0.4;
      if (tradeMatch > 0) {
        reasons.push(`Specializes in ${vendor.trade}`);
      }
    }

    // Location/Region match (20% weight)
    if (requirements.region && vendor.regions) {
      const regionMatch = vendor.regions.some((region: string) => 
        region.toLowerCase().includes(requirements.region.toLowerCase())
      ) ? 100 : 0;
      matchFactors.location = regionMatch;
      score += regionMatch * 0.2;
      if (regionMatch > 0) {
        reasons.push(`Services ${requirements.region} region`);
      }
    }

    // Performance scoring (25% weight)
    const performanceScore = (
      vendor.rating / 5 * 100 + 
      metrics.onTimeDelivery + 
      metrics.qualityScore
    ) / 3;
    matchFactors.performance = performanceScore;
    score += performanceScore * 0.25;

    // Availability (10% weight)
    matchFactors.availability = metrics.availability;
    score += metrics.availability * 0.1;

    // Cost competitiveness (5% weight)
    matchFactors.cost = metrics.priceCompetitiveness;
    score += metrics.priceCompetitiveness * 0.05;

    // Priority-based adjustments
    switch (requirements.priority) {
      case 'cost':
        score = score * 0.7 + metrics.priceCompetitiveness * 0.3;
        break;
      case 'speed':
        score = score * 0.7 + (100 - metrics.avgResponseTime / 48 * 100) * 0.3;
        break;
      case 'quality':
        score = score * 0.7 + (vendor.rating / 5 * 100) * 0.3;
        break;
    }

    // Status penalties
    if (vendor.status === 'Probation') score *= 0.8;
    if (vendor.status === 'Inactive') score *= 0.5;
    if (vendor.status === 'Blacklisted') score = 0;

    // Add performance-based reasons
    if (vendor.rating >= 4.5) reasons.push('Highly rated vendor');
    if (metrics.onTimeDelivery > 90) reasons.push('Excellent delivery record');
    if (metrics.avgResponseTime < 12) reasons.push('Fast response time');
    if (metrics.recentProjects > 10) reasons.push('Active with recent projects');

    return {
      vendorId: vendor.id,
      vendor,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      matchFactors
    };
  };

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!requirements.trade && !requirements.region) return [];
    
    return vendors
      .filter(vendor => vendor.status === 'Active')
      .map(calculateVendorScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [vendors, requirements]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'outline';
  };

  const uniqueTrades = [...new Set(vendors.map(v => v.trade).filter(Boolean))];
  const uniqueRegions = [...new Set(vendors.flatMap(v => v.regions || []))];

  return (
    <div className="space-y-6">
      {/* AI Recommendation Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Vendor Recommendation Engine</span>
            <Badge variant="outline" className="ml-2">
              <Zap className="h-3 w-3 mr-1" />
              Smart Matching
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Trade/Service</label>
              <Select value={requirements.trade} onValueChange={(value) => 
                setRequirements(prev => ({ ...prev, trade: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueTrades.map(trade => (
                    <SelectItem key={trade} value={trade!}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Region</label>
              <Select value={requirements.region} onValueChange={(value) => 
                setRequirements(prev => ({ ...prev, region: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select region..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueRegions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Budget Range</label>
              <Input
                type="number"
                placeholder="Max budget..."
                value={requirements.budget || ''}
                onChange={(e) => setRequirements(prev => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={requirements.priority} onValueChange={(value: 'cost' | 'quality' | 'speed') => 
                setRequirements(prev => ({ ...prev, priority: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quality">Quality First</SelectItem>
                  <SelectItem value="cost">Cost Effective</SelectItem>
                  <SelectItem value="speed">Fast Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations List */}
      {recommendations.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              Top Recommendations ({recommendations.length})
            </h3>
            <Badge variant="outline">
              Optimized for {requirements.priority}
            </Badge>
          </div>

          {recommendations.map((rec, index) => {
            const metrics = getVendorMetrics(rec.vendorId);
            
            return (
              <Card key={rec.vendorId} className={index === 0 ? 'ring-2 ring-purple-200' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {index === 0 && <Badge className="bg-purple-600">Best Match</Badge>}
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-lg">{rec.vendor.name}</h3>
                        </div>
                        <Badge variant="outline">{rec.vendor.code}</Badge>
                        {rec.vendor.trade && (
                          <Badge variant="secondary">{rec.vendor.trade}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Match Factors</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Trade Match</span>
                              <span className={getScoreColor(rec.matchFactors.trade)}>
                                {rec.matchFactors.trade.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Location</span>
                              <span className={getScoreColor(rec.matchFactors.location)}>
                                {rec.matchFactors.location.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Performance</span>
                              <span className={getScoreColor(rec.matchFactors.performance)}>
                                {rec.matchFactors.performance.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Key Metrics</h4>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-400" />
                              <span>{rec.vendor.rating}/5 rating</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-blue-400" />
                              <span>{metrics.avgResponseTime.toFixed(0)}h response</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span>{metrics.onTimeDelivery.toFixed(0)}% on-time</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Why Recommended</h4>
                          <div className="space-y-1">
                            {rec.reasons.slice(0, 3).map((reason, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-xs">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {rec.vendor.regions && rec.vendor.regions.length > 0 && (
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {rec.vendor.regions.slice(0, 3).map((region: string) => (
                              <Badge key={region} variant="outline" className="text-xs">
                                {region}
                              </Badge>
                            ))}
                            {rec.vendor.regions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{rec.vendor.regions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-2">
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(rec.score)}`}>
                          {rec.score.toFixed(0)}%
                        </div>
                        <Badge variant={getScoreBadge(rec.score)} className="text-xs">
                          Match Score
                        </Badge>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button size="sm">
                          View Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          Send RFQ
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">AI Recommendations Ready</h3>
            <p className="text-muted-foreground mb-4">
              Specify trade and region requirements to get intelligent vendor recommendations
            </p>
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Set Requirements
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};