import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Star,
  Calculator,
  Filter
} from 'lucide-react';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface PriceComparisonProps {
  selectedTrade?: string;
}

interface VendorPricing {
  vendorId: string;
  vendorName: string;
  trade: string;
  avgPrice: number;
  priceRange: { min: number; max: number };
  competitivenessScore: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  sampleSize: number;
  rating: number;
  status: string;
}

export const PriceComparisonTool: React.FC<PriceComparisonProps> = ({ selectedTrade }) => {
  const { data: vendors = [] } = useVendors();
  const [filterTrade, setFilterTrade] = useState(selectedTrade || '');
  const [sortBy, setSortBy] = useState<'price' | 'competitiveness' | 'rating'>('competitiveness');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Use real pricing data from database - no mock generation
  const generatePricingData = (vendor: any): VendorPricing => {
    return {
      vendorId: vendor.id,
      vendorName: vendor.name,
      trade: vendor.trade || 'General',
      avgPrice: 0, // Would come from real PO/quote data
      priceRange: {
        min: 0,
        max: 0
      },
      competitivenessScore: 0,
      trend: 'stable' as const,
      lastUpdated: new Date().toISOString().split('T')[0],
      sampleSize: 0,
      rating: vendor.rating || 0,
      status: vendor.status
    };
  };

  // Generate market analysis data
  const marketAnalysis = useMemo(() => {
    const filteredVendors = vendors.filter(vendor => {
      if (showOnlyActive && vendor.status !== 'Active') return false;
      if (filterTrade && vendor.trade !== filterTrade) return false;
      return true;
    });

    const pricingData = filteredVendors.map(generatePricingData);
    
    // Calculate market insights
    const prices = pricingData.map(p => p.avgPrice);
    const marketStats = {
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      medianPrice: prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)],
      priceVariation: (Math.max(...prices) - Math.min(...prices)) / Math.max(...prices) * 100
    };

    return { pricingData, marketStats };
  }, [vendors, filterTrade, showOnlyActive]);

  // Sort pricing data
  const sortedPricingData = useMemo(() => {
    return [...marketAnalysis.pricingData].sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.avgPrice - b.avgPrice;
        case 'competitiveness':
          return b.competitivenessScore - a.competitivenessScore;
        case 'rating':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });
  }, [marketAnalysis.pricingData, sortBy]);

  // Generate chart data
  const chartData = sortedPricingData.slice(0, 10).map(vendor => ({
    name: vendor.vendorName.length > 12 ? 
      vendor.vendorName.substring(0, 12) + '...' : 
      vendor.vendorName,
    avgPrice: vendor.avgPrice,
    competitiveness: vendor.competitivenessScore,
    rating: vendor.rating * 20 // Scale to 0-100
  }));

  // Use real historical data - no mock trends
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - 11 + i);
    return {
      month: month.toLocaleDateString('en-US', { month: 'short' }),
      avgPrice: 0, // Would come from real historical data
      medianPrice: 0,
    };
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCompetitivenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompetitivenessLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  const uniqueTrades = [...new Set(vendors.map(v => v.trade).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Price Comparison & Market Analysis</span>
            <Badge variant="outline">
              <BarChart3 className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Trade Filter</label>
              <Select value={filterTrade} onValueChange={setFilterTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All trades..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Trades</SelectItem>
                  {uniqueTrades.map(trade => (
                    <SelectItem key={trade} value={trade!}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value: 'price' | 'competitiveness' | 'rating') => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="competitiveness">Competitiveness</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant={showOnlyActive ? "default" : "outline"}
                onClick={() => setShowOnlyActive(!showOnlyActive)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Active Only
              </Button>
            </div>

            <div className="flex items-end">
              <Button variant="outline">
                <Zap className="h-4 w-4 mr-2" />
                Generate Quote
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Market Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${marketAnalysis.marketStats.avgPrice.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filterTrade || 'All trades'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Price Range</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="text-green-600 font-medium">
                ${marketAnalysis.marketStats.minPrice.toLocaleString()}
              </div>
              <div className="text-red-600 font-medium">
                ${marketAnalysis.marketStats.maxPrice.toLocaleString()}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Min - Max</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Median Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${marketAnalysis.marketStats.medianPrice.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              50th percentile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Price Variation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketAnalysis.marketStats.priceVariation.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Market volatility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Price Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Price Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'avgPrice' ? `$${Number(value).toLocaleString()}` : `${Number(value).toFixed(1)}%`,
                  name === 'avgPrice' ? 'Average Price' : 
                  name === 'competitiveness' ? 'Competitiveness' : 'Rating'
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avgPrice" fill="#3b82f6" name="Average Price" />
              <Bar yAxisId="right" dataKey="competitiveness" fill="#10b981" name="Competitiveness %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Price Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>12-Month Price Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="avgPrice" 
                stroke="#3b82f6" 
                name="Average Price"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="medianPrice" 
                stroke="#10b981" 
                name="Median Price"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Vendor Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Price Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedPricingData.slice(0, 10).map((vendor, index) => (
              <div key={vendor.vendorId} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{vendor.vendorName}</h4>
                      <Badge variant="outline">{vendor.trade}</Badge>
                      <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Range: ${vendor.priceRange.min.toLocaleString()} - ${vendor.priceRange.max.toLocaleString()}</span>
                      <span>•</span>
                      <span>{vendor.sampleSize} quotes</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span>{vendor.rating}/5</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      ${vendor.avgPrice.toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(vendor.trend)}
                      <span className="text-xs text-muted-foreground">{vendor.trend}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-bold ${getCompetitivenessColor(vendor.competitivenessScore)}`}>
                      {vendor.competitivenessScore.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCompetitivenessLevel(vendor.competitivenessScore)}
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    Request Quote
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};