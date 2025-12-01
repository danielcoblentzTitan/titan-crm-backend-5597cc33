import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Filter, ToggleLeft, ToggleRight } from "lucide-react";

interface Project {
  id: string;
  name: string;
  customer_name: string;
  building_type?: string;
  budget?: number;
  status: string;
  county?: string;
  square_footage?: number;
  start_date?: string;
}

interface ProjectsMapViewProps {
  projects: Project[];
}

interface MapMarker {
  project: Project;
  marker: google.maps.marker.AdvancedMarkerElement;
}

// County coordinates for Delaware and Maryland regions
const COUNTY_COORDINATES = {
  'Sussex': { lat: 38.6912, lng: -75.4013 },
  'Kent': { lat: 39.1573, lng: -75.5277 },
  'New Castle': { lat: 39.6403, lng: -75.6061 },
  'Dorchester': { lat: 38.4204, lng: -76.0442 },
  'Worcester': { lat: 38.2904, lng: -75.3710 },
  'Talbot': { lat: 38.7740, lng: -76.0744 },
  'Queen Annes': { lat: 38.9567, lng: -76.1458 },
  'Baltimore': { lat: 39.2904, lng: -76.6122 },
  'Cecil': { lat: 39.6059, lng: -75.9447 },
  'Caroline': { lat: 38.8540, lng: -75.8885 },
  'Wicomico': { lat: 38.3607, lng: -75.5994 },
  'Somerset': { lat: 38.0431, lng: -75.8730 },
  'Annapolis': { lat: 38.9784, lng: -76.4951 },
  'Easton': { lat: 38.7740, lng: -76.0744 }
};

export const ProjectsMapView = ({ projects }: ProjectsMapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get random position within county bounds (avoiding water)
  const getRandomPositionInCounty = (county: string) => {
    const baseCoords = COUNTY_COORDINATES[county as keyof typeof COUNTY_COORDINATES];
    if (!baseCoords) {
      // Default to Sussex County if county not found
      return {
        lat: 38.6912 + (Math.random() - 0.5) * 0.1,
        lng: -75.4013 + (Math.random() - 0.5) * 0.1
      };
    }
    
    // Smaller, more conservative offsets to avoid water bodies (±0.08 degrees)
    // Bias slightly westward (inland) to avoid coastal water
    const latOffset = (Math.random() - 0.5) * 0.16;
    const lngOffset = (Math.random() - 0.3) * 0.16; // Bias westward
    
    return {
      lat: baseCoords.lat + latOffset,
      lng: baseCoords.lng + lngOffset
    };
  };

  // Color coding based on building type
  const getMarkerColor = (project: Project) => {
    switch (project.building_type) {
      case 'Residential':
        return '#16A34A'; // Green
      case 'Commercial':
        return '#2563EB'; // Blue
      case 'Barndominium':
        return '#8B5CF6'; // Purple
      default:
        return '#6B7280'; // Gray
    }
  };

  const getBuildingTypeLabel = (buildingType: string) => {
    return buildingType || 'Unknown';
  };

  // Initialize Google Map
  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        const loader = new Loader({
          apiKey: "AIzaSyAz6bfxeTMYwAvDeGGFSxQ4PazfME-m-WI",
          version: "weekly",
          libraries: ["places", "marker"]
        });

        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        if (mapRef.current) {
          const mapInstance = new Map(mapRef.current, {
            center: { lat: 39.1612, lng: -75.5264 }, // Delaware center
            zoom: 8,
            mapId: "119c34a3980b81385d4b0360",
          });

          setMap(mapInstance);
        }
      } catch (err) {
        console.error("Error loading Google Maps:", err);
        setError("Failed to load Google Maps. Please check your API key configuration.");
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Create markers for completed projects
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(({ marker }) => {
      marker.map = null;
    });

    // Filter projects
    console.log("Total projects received by map:", projects.length);
    console.log("Projects by building type:", projects.reduce((acc, p) => {
      const type = p.building_type || 'No building_type';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    const filteredProjects = projects.filter(project => {
      // Since we're already getting completed projects, don't filter by status
      // if (project.status !== 'Completed') return false;
      
      // Filter by building type
      if (buildingTypeFilter !== "all" && project.building_type !== buildingTypeFilter) {
        return false;
      }

      // Filter by year
      if (yearFilter !== "all" && project.start_date) {
        const projectYear = new Date(project.start_date).getFullYear().toString();
        if (projectYear !== yearFilter) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          project.name.toLowerCase().includes(searchLower) ||
          project.customer_name.toLowerCase().includes(searchLower) ||
          (project.county && project.county.toLowerCase().includes(searchLower))
        );
      }

      // Filter out projects without county (they can't be mapped)
      if (!project.county) {
        console.log("Filtered out project due to missing county:", project.name);
        return false;
      }

      return true;
    });
    
    console.log("Filtered projects for map:", filteredProjects.length);
    console.log("Filtered by building type:", filteredProjects.reduce((acc, p) => {
      const type = p.building_type || 'No building_type';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));

    const newMarkers: MapMarker[] = [];

    filteredProjects.forEach((project) => {
      if (project.county) {
        try {
          const position = getRandomPositionInCounty(project.county);
          
          // Create custom marker
          const markerDiv = document.createElement('div');
          markerDiv.style.width = '18px';
          markerDiv.style.height = '18px';
          markerDiv.style.backgroundColor = getMarkerColor(project);
          markerDiv.style.borderRadius = '50%';
          markerDiv.style.border = '2px solid white';
          markerDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
          markerDiv.style.cursor = 'pointer';

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position,
            map,
            content: markerDiv,
            title: `${project.square_footage?.toLocaleString() || 'N/A'} sq ft - ${project.name}`,
          });

          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; max-width: 250px;">
                <h3 style="margin: 0 0 4px 0; font-weight: bold;">${project.customer_name}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">${project.name}</p>
                <div style="margin: 4px 0;">
                  <span style="background-color: ${getMarkerColor(project)}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                    ${getBuildingTypeLabel(project.building_type)}
                  </span>
                </div>
                <p style="margin: 4px 0 0 0; color: #666;"><strong>County:</strong> ${project.county}</p>
                <p style="margin: 0; color: #666;"><strong>Size:</strong> ${project.square_footage?.toLocaleString() || 'N/A'} sq ft</p>
                <p style="margin: 4px 0 0 0; font-weight: bold; color: #16A34A;">$${project.budget?.toLocaleString() || '0'}</p>
                <p style="margin: 0; color: #666; font-size: 12px;"><strong>Completed:</strong> ${project.start_date ? new Date(project.start_date).getFullYear() : 'N/A'}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push({ project, marker });
        } catch (error) {
          console.error(`Error creating marker for ${project.customer_name}:`, error);
        }
      }
    });

    setMarkers(newMarkers);
  }, [map, projects, buildingTypeFilter, yearFilter, searchTerm]);

  // Get available years from projects
  const getAvailableYears = () => {
    const years = [...new Set(projects
      .filter(p => p.start_date)
      .map(p => new Date(p.start_date!).getFullYear().toString()))]
      .sort((a, b) => b.localeCompare(a));
    return years;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{error}</p>
            <p className="text-sm mt-2 text-muted-foreground">
              Please configure your Google Maps API key in the component.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Completed Projects Map
          </CardTitle>
          <Badge variant="secondary">
            {markers.length} Projects
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, project, or county..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={buildingTypeFilter} onValueChange={setBuildingTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Barndominium">Barndominium</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {getAvailableYears().map(year => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Residential</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Commercial</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
            <span>Barndominium</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div 
          ref={mapRef} 
          className="w-full h-96 rounded-b-lg"
          style={{ minHeight: '400px' }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading projects map...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};