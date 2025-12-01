import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Lead } from "@/services/supabaseService";
import { 
  Building, 
  Calendar, 
  DollarSign, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Clock,
  Ruler,
  Square,
  Maximize,
  Settings,
  MessageSquare,
  Edit,
  Calculator,
  Search,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LeadDetailDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onCreateEstimate?: (lead: Lead) => void;
}

export const LeadDetailDialog = ({
  lead,
  isOpen,
  onClose,
  onEdit,
  onCreateEstimate
}: LeadDetailDialogProps) => {
  const { toast } = useToast();
  const [isLoadingParcel, setIsLoadingParcel] = useState(false);
  const [parcelData, setParcelData] = useState<any>(null);
  
  if (!lead) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Qualified':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Proposal':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Negotiation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Hot List':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Lost':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDaysSinceCreated = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleGetParcel = async () => {
    if (!lead.address) {
      toast({
        title: "No Address",
        description: "This lead doesn't have a complete address to look up.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingParcel(true);
    
    try {
      const fullAddress = `${lead.address}, ${[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}`;
      console.log('Calling get-parcel function with address:', fullAddress);
      
      const { data, error } = await supabase.functions.invoke('get-parcel', {
        body: { address: fullAddress }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      if (data.status === 'ok') {
        setParcelData(data);
        
        // Update the lead with parcel information
        const updateData: any = {
          parcel_id: data.parcel_id,
          parcel_lookup_timestamp: new Date().toISOString(),
        };
        
        if (data.map_number) updateData.map_number = data.map_number;
        if (data.grid_number) updateData.grid_number = data.grid_number;
        if (data.parcel_number) updateData.parcel_number = data.parcel_number;
        if (data.jurisdiction_name) updateData.jurisdiction_name = data.jurisdiction_name;

        const { error: updateError } = await supabase
          .from('leads')
          .update(updateData)
          .eq('id', lead.id);

        if (updateError) {
          console.error('Error updating lead with parcel data:', updateError);
        }

        toast({
          title: "Parcel Found",
          description: `Parcel ${data.parcel_id} found successfully.`,
        });
      } else {
        // Log the full response for debugging
        console.log('Parcel lookup failed:', data);
        
        let description = "Could not find parcel information for this address.";
        if (data.code === 'NO_PARCEL') {
          description = "No parcel found at this address. This may indicate the address is not recognized by the county GIS system.";
        } else if (data.code === 'NO_GEOCODE') {
          description = "Unable to locate the address coordinates. Please verify the address is correct.";
        } else if (data.code === 'TIMEOUT') {
          description = "Request timed out. Please try again.";
        }

        toast({
          title: "Parcel Not Found",
          description: description,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error getting parcel:', error);
      toast({
        title: "Error",
        description: "Failed to retrieve parcel information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingParcel(false);
    }
  };

  const buildingSpecs = (lead as any).building_specifications || {};
  
  // Check if lead has existing parcel data or if we have fetched it
  const displayParcelData = parcelData || (lead as any);
  const hasParcelData = displayParcelData.parcel_id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <span className="text-2xl font-bold">
              {lead.first_name} {lead.last_name}
            </span>
            {lead.company && (
              <span className="text-lg text-muted-foreground ml-2">
                at {lead.company}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 -mt-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(lead)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onCreateEstimate && (
            <Button variant="default" size="sm" onClick={() => onCreateEstimate(lead)}>
              <Calculator className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusColor(lead.status || 'New')} variant="outline">
              {lead.status || 'New'}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
              <Clock className="h-3 w-3 mr-1" />
              {getDaysSinceCreated(lead.created_at)} days old
            </Badge>
            {lead.timeline && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Calendar className="h-3 w-3 mr-1" />
                {lead.timeline}
              </Badge>
            )}
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="space-y-3">
                {lead.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                )}
                
                {lead.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                
                {(lead.address || lead.city || lead.state || lead.zip) && (
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-3 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        {lead.address && <div>{lead.address}</div>}
                        <div>
                          {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Get Parcel Button and Parcel Info */}
                    <div className="ml-7">
                      {!hasParcelData && lead.address && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGetParcel}
                          disabled={isLoadingParcel}
                          className="h-8 text-xs"
                        >
                          {isLoadingParcel ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Finding parcel...
                            </>
                          ) : (
                            <>
                              <Search className="h-3 w-3 mr-1" />
                              Get Parcel
                            </>
                          )}
                        </Button>
                      )}
                      
                      {hasParcelData && (
                        <div className="bg-muted/30 p-3 rounded-lg mt-2">
                          <div className="text-xs font-medium text-muted-foreground mb-1">Parcel Information</div>
                          <div className="space-y-1 text-sm">
                            <div className="font-medium">
                              Parcel ID: {displayParcelData.parcel_id}
                            </div>
                            {displayParcelData.map_number && (
                              <div>Map: {displayParcelData.map_number}</div>
                            )}
                            {displayParcelData.grid_number && (
                              <div>Grid: {displayParcelData.grid_number}</div>
                            )}
                            {displayParcelData.parcel_number && (
                              <div>Parcel: {displayParcelData.parcel_number}</div>
                            )}
                            {displayParcelData.jurisdiction_name && (
                              <div>Jurisdiction: {displayParcelData.jurisdiction_name}</div>
                            )}
                            {(displayParcelData.viewer_url || parcelData?.viewer_url) && (
                              <a 
                                href={displayParcelData.viewer_url || parcelData?.viewer_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-xs flex items-center mt-1"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View on Map
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {lead.estimated_value && (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-3 text-muted-foreground" />
                      <span className="font-semibold text-lg">
                        ${lead.estimated_value.toLocaleString()}
                      </span>
                    </div>
                    <div className="ml-7">
                      <span className="text-xs text-muted-foreground">
                        Auto-generated estimate
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Building Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Building Specifications
              </h3>
              
              <div className="space-y-4">
                {/* Dimensions */}
                {buildingSpecs.dimensions && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Ruler className="h-4 w-4 mr-2" />
                      Dimensions
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {buildingSpecs.dimensions.width && (
                        <div>Width: <span className="font-medium">{buildingSpecs.dimensions.width}'</span></div>
                      )}
                      {buildingSpecs.dimensions.length && (
                        <div>Length: <span className="font-medium">{buildingSpecs.dimensions.length}'</span></div>
                      )}
                      {buildingSpecs.dimensions.height && (
                        <div>Height: <span className="font-medium">{buildingSpecs.dimensions.height}'</span></div>
                      )}
                      {buildingSpecs.dimensions.square_footage && (
                        <div className="col-span-2">
                          Square Footage: <span className="font-medium">{buildingSpecs.dimensions.square_footage} sq ft</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Doors */}
                {buildingSpecs.doors && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Square className="h-4 w-4 mr-2" />
                      Doors
                    </h4>
                    <div className="space-y-2 text-sm">
                      {buildingSpecs.doors.overhead_count && (
                        <div>Overhead Doors: <span className="font-medium">{buildingSpecs.doors.overhead_count}</span></div>
                      )}
                      {buildingSpecs.doors.entry_count && (
                        <div>Entry Doors: <span className="font-medium">{buildingSpecs.doors.entry_count}</span></div>
                      )}
                      {buildingSpecs.doors.overhead_specs && buildingSpecs.doors.overhead_specs.length > 0 && (
                        <div>
                          <div className="font-medium">Overhead Door Specs:</div>
                          {buildingSpecs.doors.overhead_specs.map((spec: any, index: number) => (
                            <div key={index} className="ml-2">
                              Door {index + 1}: {spec.width}' × {spec.height}'
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Windows */}
                {buildingSpecs.windows && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Maximize className="h-4 w-4 mr-2" />
                      Windows
                    </h4>
                    <div className="text-sm">
                      Count: <span className="font-medium">{buildingSpecs.windows.count}</span>
                    </div>
                  </div>
                )}

                {/* Building Use */}
                {buildingSpecs.building_use && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <Settings className="h-4 w-4 mr-2" />
                      Building Use
                    </h4>
                    <div className="text-sm">
                      <span className="font-medium">{buildingSpecs.building_use}</span>
                    </div>
                  </div>
                )}

                {/* Options */}
                {buildingSpecs.options && buildingSpecs.options.length > 0 && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Additional Options</h4>
                    <div className="flex flex-wrap gap-1">
                      {buildingSpecs.options.map((option: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {option}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Preferences */}
                {buildingSpecs.contact_preferences && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium flex items-center mb-2">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Preferences
                    </h4>
                    <div className="space-y-1 text-sm">
                      {buildingSpecs.contact_preferences.best_time && (
                        <div>Best Time: <span className="font-medium">{buildingSpecs.contact_preferences.best_time}</span></div>
                      )}
                      {buildingSpecs.contact_preferences.preferred_method && (
                        <div>Preferred Method: <span className="font-medium">{buildingSpecs.contact_preferences.preferred_method}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Features */}
          {(buildingSpecs.lean_to || buildingSpecs.barndominium || buildingSpecs.interior_finishing) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {buildingSpecs.lean_to && buildingSpecs.lean_to !== 'No' && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="font-medium">Lean-To</div>
                      <div className="text-sm text-muted-foreground">{buildingSpecs.lean_to}</div>
                    </div>
                  )}
                  {buildingSpecs.barndominium && buildingSpecs.barndominium !== 'No' && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="font-medium">Barndominium</div>
                      <div className="text-sm text-muted-foreground">{buildingSpecs.barndominium}</div>
                    </div>
                  )}
                  {buildingSpecs.interior_finishing && buildingSpecs.interior_finishing !== 'No' && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <div className="font-medium">Interior Finishing</div>
                      <div className="text-sm text-muted-foreground">{buildingSpecs.interior_finishing}</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {lead.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Notes</h3>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-sm whitespace-pre-wrap">{lead.notes}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};