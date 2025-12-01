import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, DollarSign, Calendar, User } from 'lucide-react';

import { Lead } from '@/services/supabaseService';

interface LeadsMapViewProps {
  leads: Lead[];
  onLeadSelect: (lead: Lead) => void;
}

interface MapMarker extends google.maps.Marker {
  leadData?: Lead;
}

export const LeadsMapView: React.FC<LeadsMapViewProps> = ({ leads, onLeadSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getMarkerIcon = (stage: string, priority: string) => {
    let color = '#6B7280'; // Default gray
    
    switch (stage) {
      case 'Quoted':
        color = '#F59E0B'; // Yellow
        break;
      case 'Won':
        color = '#10B981'; // Green
        break;
      case 'Lost':
        color = '#EF4444'; // Red
        break;
      case 'Working':
        color = '#3B82F6'; // Blue
        break;
      case 'New':
        color = '#8B5CF6'; // Purple
        break;
    }

    if (priority === 'Hot') {
      color = '#DC2626'; // Hot red
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      scale: 8,
    };
  };

  const geocodeAddress = async (address: string, city: string, state: string, zip: string): Promise<google.maps.LatLng | null> => {
    const geocoder = new google.maps.Geocoder();
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    
    try {
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === 'OK' && results) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });
      
      return result[0]?.geometry?.location || null;
    } catch (error) {
      console.warn(`Failed to geocode address: ${fullAddress}`, error);
      return null;
    }
  };

  const createMarkers = async (map: google.maps.Map, leads: Lead[]) => {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: MapMarker[] = [];
    const bounds = new google.maps.LatLngBounds();

    for (const lead of leads) {
      if (!lead.address || !lead.city || !lead.state) continue;

      const position = await geocodeAddress(lead.address, lead.city, lead.state, lead.zip);
      if (!position) continue;

      const marker = new google.maps.Marker({
        position,
        map,
        icon: getMarkerIcon(lead.stage, lead.priority),
        title: `${lead.first_name} ${lead.last_name} - ${lead.company}`,
      }) as MapMarker;

      marker.leadData = lead;

      marker.addListener('click', () => {
        setSelectedLead(lead);
        onLeadSelect(lead);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    }

    if (newMarkers.length > 0) {
      map.fitBounds(bounds);
      
      // Don't zoom too close if there's only one marker
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }

    setMarkers(newMarkers);
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        // For now, show a placeholder map since Google Maps API key is needed
        setError('Google Maps API key required. Please configure in project settings.');
        setIsLoading(false);
        
        /* Uncomment and add real API key when ready:
        const loader = new Loader({
          apiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
          version: 'weekly',
        });

        await loader.load();

        if (!mapRef.current) return;

        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: 32.7767, lng: -96.7970 }, // Dallas, TX default center
          zoom: 10,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMap(mapInstance);
        setIsLoading(false);
        */
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setError('Failed to load map. Please check your Google Maps API key.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (map && leads.length > 0) {
      createMarkers(map, leads);
    }
  }, [map, leads]);

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Quoted': return 'bg-yellow-100 text-yellow-800';
      case 'Won': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-red-100 text-red-800';
      case 'Working': return 'bg-blue-100 text-blue-800';
      case 'New': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Hot': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Map View</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <div className="text-sm text-muted-foreground">
                <p>To enable map view:</p>
                <ol className="list-decimal list-inside text-left mt-2 space-y-1">
                  <li>Get a Google Maps API key</li>
                  <li>Enable Maps JavaScript API</li>
                  <li>Add the key to your environment</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Leads Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapRef} className="w-full h-96 lg:h-[600px] rounded-b-lg bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Map will appear here once configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm">New</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-sm">Working</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Quoted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Won</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Lost</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <span className="text-sm">Hot Priority</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Leads:</span>
                <span className="font-medium">{leads.length}</span>
              </div>
              <div className="flex justify-between">
                <span>With Addresses:</span>
                <span className="font-medium">
                  {leads.filter(lead => lead.address && lead.city && lead.state).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hot Priority:</span>
                <span className="font-medium text-red-600">
                  {leads.filter(lead => lead.priority === 'Hot').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Value:</span>
                <span className="font-medium">
                  ${leads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedLead && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selected Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedLead.first_name} {selectedLead.last_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedLead.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedLead.city}, {selectedLead.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">${selectedLead.estimated_value?.toLocaleString()}</span>
                </div>
                {selectedLead.quote_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Quoted: {new Date(selectedLead.quote_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Badge className={getStageColor(selectedLead.stage)}>
                  {selectedLead.stage}
                </Badge>
                <Badge className={getPriorityColor(selectedLead.priority)}>
                  {selectedLead.priority}
                </Badge>
              </div>

              <Button 
                onClick={() => onLeadSelect(selectedLead)}
                className="w-full"
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};