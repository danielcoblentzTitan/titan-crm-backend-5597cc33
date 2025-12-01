import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Copy, Eye, FileText, Clock, DollarSign, Edit } from "lucide-react";
import { estimatesService, Estimate } from "@/services/estimatesService";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EstimateVersion {
  id: string;
  version: number;
  estimate: Estimate;
  notes: string;
  created_at: string;
  version_name: string;
}

interface EstimateVersionManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

export const EstimateVersionManager = ({ isOpen, onOpenChange, leadId, leadName }: EstimateVersionManagerProps) => {
  const [versions, setVersions] = useState<EstimateVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<EstimateVersion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    estimated_price: 0,
    building_type: 'Barndominium',
    dimensions: '',
    wall_height: '12',
    description: '',
    scope: '',
    timeline: '90-120 days',
    notes: '',
    version_name: ''
  });
  const [versionNotes, setVersionNotes] = useState('');
  const [editingVersionName, setEditingVersionName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadEstimateVersions();
    } else {
      // Clean up state when dialog closes to prevent freeze
      setIsEditing(false);
      setEditingVersionName(null);
      setCurrentVersion(null);
      setVersionNotes('');
    }
  }, [isOpen, leadId]);

  const loadEstimateVersions = async () => {
    try {
      console.log('Loading estimate versions for leadId:', leadId);
      console.log('Current user:', await supabase.auth.getUser());
      
      // Test direct query
      const { data: directData, error: directError } = await supabase
        .from('estimates')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      console.log('Direct Supabase query:', { directData, directError });
      
      const estimates = await estimatesService.getEstimatesByLead(leadId);
      console.log('Service estimates:', estimates);
      
      const versionData = estimates.map((estimate, index) => ({
        id: estimate.id,
        version: index + 1,
        estimate,
        notes: estimate.notes || '',
        created_at: estimate.created_at,
        version_name: estimate.version_name || `Version ${index + 1}`
      }));
      
      console.log('Version data:', versionData);
      setVersions(versionData);
      if (versionData.length > 0) {
        setCurrentVersion(versionData[versionData.length - 1]); // Latest version
        setEditForm({
          estimated_price: versionData[versionData.length - 1].estimate.estimated_price,
          building_type: versionData[versionData.length - 1].estimate.building_type,
          dimensions: versionData[versionData.length - 1].estimate.dimensions || '',
          wall_height: versionData[versionData.length - 1].estimate.wall_height || '12',
          description: versionData[versionData.length - 1].estimate.description || '',
          scope: versionData[versionData.length - 1].estimate.scope || '',
          timeline: versionData[versionData.length - 1].estimate.timeline || '90-120 days',
          notes: versionData[versionData.length - 1].estimate.notes || '',
          version_name: versionData[versionData.length - 1].version_name
        });
      }
    } catch (error) {
      console.error('Error loading estimate versions:', error);
      toast({
        title: "Error", 
        description: "Failed to load estimate versions.",
        variant: "destructive"
      });
    }
  };

  const handleCreateVersion = async () => {
    try {
      const nextVersionNumber = versions.length + 1;
      const defaultVersionName = `Version ${nextVersionNumber}`;
      
      const estimateData = {
        lead_id: leadId,
        lead_name: leadName,
        version_name: editForm.version_name || defaultVersionName,
        ...editForm
      };

      const newEstimate = await estimatesService.createEstimateFromData(estimateData);
      const newVersion: EstimateVersion = {
        id: newEstimate.id,
        version: versions.length + 1,
        estimate: newEstimate,
        notes: versionNotes,
        created_at: newEstimate.created_at,
        version_name: newEstimate.version_name || defaultVersionName
      };

      setVersions([...versions, newVersion]);
      setCurrentVersion(newVersion);
      setVersionNotes('');
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error creating estimate version:', error);
      toast({
        title: "Error",
        description: "Failed to create estimate version",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCurrentVersion = async () => {
    if (!currentVersion) return;

    try {
      const updatedEstimate = await estimatesService.updateEstimate(currentVersion.id, editForm);
      
      setVersions(prev => prev.map(v => 
        v.id === currentVersion.id 
          ? { ...v, estimate: updatedEstimate }
          : v
      ));
      
      setCurrentVersion(prev => prev ? { ...prev, estimate: updatedEstimate } : null);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error updating estimate:', error);
      toast({
        title: "Error",
        description: "Failed to update estimate",
        variant: "destructive"
      });
    }
  };

  const handleSelectVersion = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setCurrentVersion(version);
      setEditForm({
        estimated_price: version.estimate.estimated_price,
        building_type: version.estimate.building_type,
        dimensions: version.estimate.dimensions || '',
        wall_height: version.estimate.wall_height || '12',
        description: version.estimate.description || '',
        scope: version.estimate.scope || '',
        timeline: version.estimate.timeline || '90-120 days',
        notes: version.estimate.notes || '',
        version_name: version.version_name
      });
      setIsEditing(false);
    }
  };

  const handleDuplicateVersion = () => {
    if (currentVersion) {
      setVersionNotes(`Duplicate of ${currentVersion.version_name}`);
      setEditForm(prev => ({ ...prev, version_name: `Copy of ${currentVersion.version_name}` }));
      setIsEditing(true);
    }
  };

  const handleUpdateVersionName = async (versionId: string, newName: string) => {
    try {
      await estimatesService.updateEstimate(versionId, { version_name: newName });
      setVersions(prev => prev.map(v => 
        v.id === versionId 
          ? { ...v, version_name: newName, estimate: { ...v.estimate, version_name: newName } }
          : v
      ));
      if (currentVersion?.id === versionId) {
        setCurrentVersion(prev => prev ? { ...prev, version_name: newName } : null);
      }
      setEditingVersionName(null);
      toast({
        title: "Success",
        description: "Version name updated successfully",
      });
    } catch (error) {
      console.error('Error updating version name:', error);
      toast({
        title: "Error",
        description: "Failed to update version name",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Estimate Versions - {leadName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[80vh]">
          {/* Version List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Versions</h3>
              <Button 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Version
              </Button>
            </div>
            
            <div className="space-y-2">
              {versions.map((version) => (
                <Card 
                  key={version.id}
                  className={`cursor-pointer transition-colors ${
                    currentVersion?.id === version.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => handleSelectVersion(version.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editingVersionName === version.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={version.version_name}
                              onChange={(e) => {
                                setVersions(prev => prev.map(v => 
                                  v.id === version.id 
                                    ? { ...v, version_name: e.target.value }
                                    : v
                                ));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUpdateVersionName(version.id, version.version_name);
                                } else if (e.key === 'Escape') {
                                  setEditingVersionName(null);
                                  loadEstimateVersions(); // Reload to reset changes
                                }
                              }}
                              className="text-sm"
                              autoFocus
                            />
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleUpdateVersionName(version.id, version.version_name)}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="font-medium cursor-pointer hover:text-blue-600 flex items-center gap-2"
                            onClick={() => setEditingVersionName(version.id)}
                          >
                            {version.version_name}
                            <Edit className="h-3 w-3 opacity-50" />
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          ${version.estimate.estimated_price.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={version.estimate.status === 'Draft' ? 'secondary' : 'default'}>
                        {version.estimate.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(version.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {versions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No estimates yet</p>
                  <p className="text-xs">Create your first version</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Version Details */}
          <div className="lg:col-span-2 space-y-4">
            {currentVersion && !isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{currentVersion.version_name} Details</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleDuplicateVersion}>
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Building Type</Label>
                        <p className="text-sm">{currentVersion.estimate.building_type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Estimated Price</Label>
                        <p className="text-lg font-semibold text-green-600">
                          ${currentVersion.estimate.estimated_price.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Dimensions</Label>
                        <p className="text-sm">{currentVersion.estimate.dimensions || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Wall Height</Label>
                        <p className="text-sm">{currentVersion.estimate.wall_height || '12'} ft</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Timeline</Label>
                        <p className="text-sm">{currentVersion.estimate.timeline}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <Badge>{currentVersion.estimate.status}</Badge>
                      </div>
                    </div>
                    
                    {currentVersion.estimate.description && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm mt-1">{currentVersion.estimate.description}</p>
                      </div>
                    )}
                    
                    {currentVersion.estimate.scope && (
                      <div>
                        <Label className="text-sm font-medium">Scope</Label>
                        <p className="text-sm mt-1">{currentVersion.estimate.scope}</p>
                      </div>
                    )}
                    
                    {currentVersion.estimate.notes && (
                      <div>
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm mt-1">{currentVersion.estimate.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {currentVersion ? `Edit ${currentVersion.version_name}` : 'Create New Version'}
                  </h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={currentVersion ? handleUpdateCurrentVersion : handleCreateVersion}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {currentVersion ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label htmlFor="version_name">Version Name</Label>
                      <Input
                        id="version_name"
                        value={editForm.version_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, version_name: e.target.value }))}
                        placeholder="Enter version name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="building_type">Building Type</Label>
                        <Select 
                          value={editForm.building_type}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, building_type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Barndominium">Barndominium</SelectItem>
                            <SelectItem value="Shop">Shop</SelectItem>
                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                            <SelectItem value="Garage">Garage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="estimated_price">Estimated Price</Label>
                        <Input
                          id="estimated_price"
                          type="number"
                          value={editForm.estimated_price}
                          onChange={(e) => setEditForm(prev => ({ ...prev, estimated_price: Number(e.target.value) }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dimensions">Dimensions</Label>
                        <Input
                          id="dimensions"
                          value={editForm.dimensions}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dimensions: e.target.value }))}
                          placeholder="e.g., 40x60"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="wall_height">Wall Height (ft)</Label>
                        <Input
                          id="wall_height"
                          value={editForm.wall_height}
                          onChange={(e) => setEditForm(prev => ({ ...prev, wall_height: e.target.value }))}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <Label htmlFor="timeline">Timeline</Label>
                        <Input
                          id="timeline"
                          value={editForm.timeline}
                          onChange={(e) => setEditForm(prev => ({ ...prev, timeline: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="scope">Scope</Label>
                      <Textarea
                        id="scope"
                        value={editForm.scope}
                        onChange={(e) => setEditForm(prev => ({ ...prev, scope: e.target.value }))}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={editForm.notes}
                        onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    
                    {!currentVersion && (
                      <div>
                        <Label htmlFor="version_notes">Version Notes</Label>
                        <Input
                          id="version_notes"
                          value={versionNotes}
                          onChange={(e) => setVersionNotes(e.target.value)}
                          placeholder="What changed in this version?"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a version to view details</p>
                  <p className="text-sm">or create a new estimate version</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};