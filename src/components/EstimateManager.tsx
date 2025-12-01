import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calculator, FileText, Edit, Trash2, MoreHorizontal, Search, Eye, Building, DollarSign, Clock, FolderOpen, Zap } from "lucide-react";
import { estimatesService, Estimate } from "@/services/estimatesService";
import { estimateService } from "@/services/estimate/estimateService";
import { enhancedDocumentService, LeadDocument } from "@/services/enhancedDocumentService";
import { useToast } from "@/hooks/use-toast";
import { UnifiedEstimateForm } from "./UnifiedEstimateForm";
import { DocumentList } from "./DocumentList";

export const EstimateManager = () => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDocuments, setShowDocuments] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEstimates();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredEstimates(
        estimates.filter(estimate =>
          estimate.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          estimate.building_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          estimate.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredEstimates(estimates);
    }
  }, [estimates, searchTerm]);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      const data = await estimatesService.getEstimates();
      setEstimates(data);
    } catch (error) {
      console.error('Error loading estimates:', error);
      toast({
        title: "Error",
        description: "Failed to load estimates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setIsFormOpen(true);
  };

  const handleDelete = async (estimate: Estimate) => {
    if (!confirm(`Are you sure you want to delete the estimate for ${estimate.lead_name}?`)) return;

    try {
      await estimatesService.deleteEstimate(estimate.id);
      setEstimates(prev => prev.filter(e => e.id !== estimate.id));
      toast({
        title: "Success",
        description: "Estimate deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting estimate:', error);
      toast({
        title: "Error",
        description: "Failed to delete estimate",
        variant: "destructive"
      });
    }
  };

  const handleConvertToWritten = async (estimate: Estimate) => {
    try {
      const updatedEstimate = await estimatesService.convertToWrittenEstimate(estimate.id);
      setEstimates(prev => prev.map(e => e.id === estimate.id ? updatedEstimate : e));
      toast({
        title: "Success",
        description: "Estimate converted to written estimate"
      });
    } catch (error) {
      console.error('Error converting estimate:', error);
      toast({
        title: "Error",
        description: "Failed to convert estimate",
        variant: "destructive"
      });
    }
  };

  const handleConvertToQuickWritten = async (estimate: Estimate) => {
    try {
      // Create the quick written estimate document
      const estimateData = {
        buildingType: estimate.building_type,
        dimensions: estimate.dimensions || '',
        wallHeight: estimate.wall_height || '12',
        estimatedPrice: estimate.estimated_price,
        description: estimate.description || '',
        scope: estimate.scope || '',
        timeline: estimate.timeline || '90-120 days',
        notes: estimate.notes || ''
      };

      // Create lead object from estimate data
      const [firstName, ...lastNameParts] = estimate.lead_name.split(' ');
      const lead = {
        id: estimate.lead_id,
        first_name: firstName,
        last_name: lastNameParts.join(' '),
        email: '', // We don't have this in estimate data
        phone: '', // We don't have this in estimate data
        company: '', // We don't have this in estimate data
        notes: estimate.notes || ''
      };

      await estimateService.createQuickWrittenEstimate(lead as any, estimateData);
      
      // Update estimate status
      const updatedEstimate = await estimatesService.convertToQuickWrittenEstimate(estimate.id);
      setEstimates(prev => prev.map(e => e.id === estimate.id ? updatedEstimate : e));
      
      toast({
        title: "Success",
        description: "Quick written estimate created and saved"
      });
    } catch (error) {
      console.error('Error creating quick written estimate:', error);
      toast({
        title: "Error",
        description: "Failed to create quick written estimate",
        variant: "destructive"
      });
    }
  };

  const handleFormSubmit = async (estimateData: any) => {
    try {
      if (selectedEstimate) {
        const updatedEstimate = await estimatesService.updateEstimate(selectedEstimate.id, estimateData);
        setEstimates(prev => prev.map(e => e.id === selectedEstimate.id ? updatedEstimate : e));
        toast({
          title: "Success",
          description: "Estimate updated successfully"
        });
      }
      setIsFormOpen(false);
      setSelectedEstimate(null);
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast({
        title: "Error",
        description: "Failed to save estimate",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Written Estimate':
        return 'bg-blue-100 text-blue-800';
      case 'Quick Estimate':
        return 'bg-purple-100 text-purple-800';
      case 'Sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading estimates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          Estimate Manager
        </h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search estimates by customer name, building type, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estimates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEstimates.map((estimate) => (
          <Card key={estimate.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{estimate.lead_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{estimate.building_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(estimate.status)}>
                    {estimate.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(estimate)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Estimate
                      </DropdownMenuItem>
                      {!estimate.is_written_estimate && (
                        <>
                          <DropdownMenuItem onClick={() => handleConvertToQuickWritten(estimate)}>
                            <Zap className="h-4 w-4 mr-2" />
                            Quick Written Estimate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConvertToWritten(estimate)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Detailed Written Estimate
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => setShowDocuments(estimate.lead_id)}>
                        <FolderOpen className="h-4 w-4 mr-2" />
                        View Lead Files
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(estimate)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span>{estimate.dimensions || 'No dimensions'}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">${estimate.estimated_price.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{estimate.timeline}</span>
              </div>

              {estimate.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {estimate.description}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {new Date(estimate.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEstimates.length === 0 && (
        <div className="text-center py-12">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No estimates found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try adjusting your search terms.' : 'Estimates will appear here once they are created from leads.'}
          </p>
        </div>
      )}

      {/* Edit Form Dialog */}
      {selectedEstimate && (
        <UnifiedEstimateForm
          lead={{
            id: selectedEstimate.lead_id,
            first_name: selectedEstimate.lead_name.split(' ')[0],
            last_name: selectedEstimate.lead_name.split(' ').slice(1).join(' '),
            email: '',
            phone: '',
            company: '',
            notes: selectedEstimate.notes || ''
          } as any}
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onEstimateCreated={handleFormSubmit}
        />
      )}

      {/* Documents Dialog */}
      {showDocuments && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Lead Documents</h2>
              <Button variant="ghost" onClick={() => setShowDocuments(null)}>
                ×
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              <DocumentList entityType="lead" entityId={showDocuments} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};