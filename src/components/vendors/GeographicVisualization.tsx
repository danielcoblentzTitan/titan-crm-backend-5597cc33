import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Map, 
  MapPin, 
  Search, 
  Filter,
  Navigation,
  Zap,
  Building,
  Users,
  Star,
  Target,
  Layers
} from 'lucide-react';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';

interface GeographicVisualizationProps {
  selectedRegion?: string;
}

interface VendorLocation {
  vendorId: string;
  vendor: any;
  lat: number;
  lng: number;
  city: string;
  state: string;
  region: string;
  density: number;
  serviceRadius: number;
}

interface RegionStats {
  region: string;
  vendorCount: number;
  avgRating: number;
  trades: string[];
  avgPrice: number;
  coverage: 'high' | 'medium' | 'low';
}

export const GeographicVisualization: React.FC<GeographicVisualizationProps> = ({ 
  selectedRegion 
}) => {
  const { data: vendors = [] } = useVendors();
  const [viewMode, setViewMode] = useState<'map' | 'heatmap' | 'coverage'>('map');
  const [filterTrade, setFilterTrade] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  // Use real vendor locations from database - no mock coordinates
  const vendorLocations = useMemo(() => {
    return vendors
      .filter(vendor => vendor.regions && vendor.regions.length > 0)
      .flatMap(vendor => 
        vendor.regions.map((region: string) => ({
          vendorId: vendor.id,
          vendor,
          lat: 0, // Would need real coordinates from vendor addresses
          lng: 0,
          city: vendor.city || 'Unknown',
          state: region,
          region,
          density: 1,
          serviceRadius: 50 // Default radius
        }))
      );
  }, [vendors]);

  // Calculate real regional statistics
  const regionStats: RegionStats[] = useMemo(() => {
    const stats: Record<string, RegionStats> = {};

    vendorLocations.forEach(location => {
      const region = location.region;
      if (!stats[region]) {
        stats[region] = {
          region,
          vendorCount: 0,
          avgRating: 0,
          trades: [],
          avgPrice: 0,
          coverage: 'low'
        };
      }

      stats[region].vendorCount++;
      stats[region].avgRating += location.vendor.rating || 0;
      
      if (location.vendor.trade && !stats[region].trades.includes(location.vendor.trade)) {
        stats[region].trades.push(location.vendor.trade);
      }
    });

    // Calculate averages and coverage
    Object.values(stats).forEach(stat => {
      stat.avgRating = stat.vendorCount > 0 ? stat.avgRating / stat.vendorCount : 0;
      stat.avgPrice = 0; // Would come from real pricing data
      
      if (stat.vendorCount >= 10) stat.coverage = 'high';
      else if (stat.vendorCount >= 5) stat.coverage = 'medium';
      else stat.coverage = 'low';
    });

    return Object.values(stats).sort((a, b) => b.vendorCount - a.vendorCount);
  }, [vendorLocations]);

  // Filter locations based on search criteria
  const filteredLocations = useMemo(() => {
    return vendorLocations.filter(location => {
      if (filterTrade && filterTrade !== 'all' && location.vendor.trade !== filterTrade) return false;
      if (searchLocation && !location.region.toLowerCase().includes(searchLocation.toLowerCase())) return false;
      return true;
    });
  }, [vendorLocations, filterTrade, searchLocation]);

  const getCoverageColor = (coverage: string) => {
    switch (coverage) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getCoverageBadge = (coverage: string) => {
    switch (coverage) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const uniqueTrades = [...new Set(vendors.map(v => v.trade).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Map className="h-5 w-5 text-blue-600" />
            <span>Geographic Coverage & Heat Maps</span>
            <Badge variant="outline">
              <Layers className="h-3 w-3 mr-1" />
              Interactive
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: 'map' | 'heatmap' | 'coverage') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="map">Vendor Locations</SelectItem>
                  <SelectItem value="heatmap">Density Heatmap</SelectItem>
                  <SelectItem value="coverage">Coverage Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Trade</label>
              <Select value={filterTrade} onValueChange={setFilterTrade}>
                <SelectTrigger>
                  <SelectValue placeholder="All trades..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Trades</SelectItem>
                  {uniqueTrades.map(trade => (
                    <SelectItem key={trade} value={trade!}>{trade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search Location</label>
              <Input
                placeholder="Search regions..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline">
                <Navigation className="h-4 w-4 mr-2" />
                Find Vendors Near Me
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {viewMode === 'map' && 'Vendor Location Map'}
              {viewMode === 'heatmap' && 'Vendor Density Heatmap'}
              {viewMode === 'coverage' && 'Service Coverage Analysis'}
            </span>
            <Badge variant="outline">
              {filteredLocations.length} vendors shown
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Map visualization placeholder */}
          <div className="h-96 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
            {/* Simulated map with vendor markers */}
            <div className="absolute inset-0 p-8">
              {filteredLocations.slice(0, 20).map((location, index) => (
                <div
                  key={location.vendorId}
                  className="absolute w-3 h-3 bg-blue-600 rounded-full cursor-pointer hover:scale-150 transition-transform"
                  style={{
                    left: `${20 + (index % 8) * 12}%`,
                    top: `${15 + Math.floor(index / 8) * 15}%`,
                  }}
                  title={`${location.vendor.name} - ${location.region}`}
                />
              ))}
              
              {/* Simulated service coverage circles */}
              {viewMode === 'coverage' && filteredLocations.slice(0, 8).map((location, index) => (
                <div
                  key={`coverage-${location.vendorId}`}
                  className="absolute rounded-full border-2 border-blue-300 bg-blue-100 opacity-30"
                  style={{
                    left: `${18 + (index % 8) * 12}%`,
                    top: `${13 + Math.floor(index / 8) * 15}%`,
                    width: `${location.serviceRadius / 10}px`,
                    height: `${location.serviceRadius / 10}px`,
                  }}
                />
              ))}
            </div>

            {/* Map legend */}
            <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-sm border">
              <h4 className="text-sm font-medium mb-2">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Active Vendor</span>
                </div>
                {viewMode === 'coverage' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-300 rounded-full bg-blue-100 opacity-50"></div>
                    <span>Service Area</span>
                  </div>
                )}
                {viewMode === 'heatmap' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-red-600 rounded"></div>
                    <span>Density (Low to High)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Interactive controls */}
            <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-sm border">
              <div className="flex flex-col space-y-1">
                <Button variant="ghost" size="sm">+</Button>
                <Button variant="ghost" size="sm">-</Button>
                <Button variant="ghost" size="sm">
                  <Target className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="text-center text-muted-foreground">
              <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Interactive Map Visualization</h3>
              <p className="text-sm max-w-md">
                {viewMode === 'map' && 'Explore vendor locations across your service regions'}
                {viewMode === 'heatmap' && 'View vendor density distribution to identify coverage gaps'}
                {viewMode === 'coverage' && 'Analyze service area coverage and potential overlaps'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Coverage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionStats.map((region) => (
              <Card key={region.region}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{region.region}</h4>
                    <Badge variant={getCoverageBadge(region.coverage)}>
                      <span className={getCoverageColor(region.coverage)}>
                        {region.coverage} coverage
                      </span>
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Vendors:</span>
                      <span className="font-medium">{region.vendorCount}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg Rating:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        <span className="font-medium">{region.avgRating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trades:</span>
                      <span className="font-medium">{region.trades.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Avg Price:</span>
                      <span className="font-medium">${region.avgPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex flex-wrap gap-1">
                      {region.trades.slice(0, 3).map((trade, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {trade}
                        </Badge>
                      ))}
                      {region.trades.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{region.trades.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vendor List by Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vendors by Location</span>
            <Button variant="outline" size="sm">
              <Search className="h-4 w-4 mr-2" />
              Find Coverage Gaps
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredLocations.slice(0, 10).map((location) => (
              <div key={`${location.vendorId}-${location.region}`} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{location.vendor.name}</h4>
                      <Badge variant="outline">{location.vendor.trade}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {location.city}, {location.state} • {location.serviceRadius.toFixed(0)} mile radius
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span>{location.vendor.rating}/5</span>
                    </div>
                    <div className="text-muted-foreground">
                      Density: {location.density.toFixed(1)}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    View Profile
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