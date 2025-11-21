import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, CheckCircle, AlertCircle, Settings, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Workspace {
  id: string;
  name: string;
  description?: string;
}

interface Board {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  columns: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

interface ColumnMapping {
  mondayColumnId: string;
  mondayColumnTitle: string;
  mondayColumnType: string;
  leadField: string;
  transform?: 'none' | 'split_name' | 'parse_number' | 'parse_date' | 'map_status';
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  details: {
    importedLeads: any[];
    errors: Array<{
      itemName: string;
      error: string;
    }>;
  };
}

// All available lead fields for mapping
const LEAD_FIELDS = [
  { value: 'first_name', label: 'First Name', required: true },
  { value: 'last_name', label: 'Last Name', required: true },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'address', label: 'Address' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'zip', label: 'ZIP Code' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'stage', label: 'Stage' },
  { value: 'sub_status', label: 'Sub Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'estimated_value', label: 'Estimated Value' },
  { value: 'building_type', label: 'Building Type' },
  { value: 'notes', label: 'Notes' },
  { value: 'county', label: 'County' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'first_contact_date', label: 'First Contact Date (Catch Date)' },
  { value: 'quote_date', label: 'Quote Date' },
  { value: 'customer_decision_by', label: 'Customer Decision By' },
  { value: 'next_action_due_date', label: 'Next Action Due Date' },
  { value: 'cadence_name', label: 'Cadence Name' },
  { value: 'pipeline_probability', label: 'Pipeline Probability' },
  { value: 'deals_active', label: 'Deals Active' },
];

const EnhancedMondayCrmImport = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [preserveUnmapped, setPreserveUnmapped] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('monday-crm-import', {
        body: { action: 'getWorkspaces' }
      });

      if (error) throw error;

      setWorkspaces(data.workspaces || []);
      toast({
        title: "Workspaces loaded",
        description: `Found ${data.workspaces?.length || 0} workspaces.`,
      });
    } catch (error) {
      console.error('Error loading workspaces:', error);
      toast({
        title: "Error loading workspaces",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async (workspaceId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('monday-crm-import', {
        body: { action: 'getBoards', workspaceId }
      });

      if (error) throw error;

      setBoards(data.boards || []);
      toast({
        title: "Boards loaded",
        description: `Found ${data.boards?.length || 0} boards.`,
      });
    } catch (error) {
      console.error('Error loading boards:', error);
      toast({
        title: "Error loading boards",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupColumnMapping = () => {
    const selectedBoardInfo = boards.find(b => b.id === selectedBoard);
    if (!selectedBoardInfo) return;

    const mappings: ColumnMapping[] = selectedBoardInfo.columns.map(column => ({
      mondayColumnId: column.id,
      mondayColumnTitle: column.title,
      mondayColumnType: column.type,
      leadField: autoMapColumn(column.title, column.type),
      transform: getDefaultTransform(column.type)
    }));

    setColumnMappings(mappings);
    setShowMapping(true);
  };

  const autoMapColumn = (title: string, type: string): string => {
    const titleLower = title.toLowerCase();
    
    // Auto-mapping logic
    if (titleLower.includes('name') && !titleLower.includes('company')) {
      return 'first_name'; // Will handle splitting in transform
    }
    if (titleLower.includes('first') || titleLower.includes('fname')) return 'first_name';
    if (titleLower.includes('last') || titleLower.includes('lname')) return 'last_name';
    if (titleLower.includes('email')) return 'email';
    if (titleLower.includes('phone')) return 'phone';
    if (titleLower.includes('company') || titleLower.includes('business')) return 'company';
    if (titleLower.includes('address')) return 'address';
    if (titleLower.includes('city')) return 'city';
    if (titleLower.includes('state')) return 'state';
    if (titleLower.includes('zip')) return 'zip';
    if (titleLower.includes('county')) return 'county';
    if (titleLower.includes('source')) return 'source';
    if (titleLower.includes('status') || titleLower.includes('stage')) return 'stage';
    if (titleLower.includes('priority')) return 'priority';
    if (titleLower.includes('value') || titleLower.includes('budget') || titleLower.includes('price')) return 'estimated_value';
    if (titleLower.includes('building') || titleLower.includes('type')) return 'building_type';
    if (titleLower.includes('timeline') || titleLower.includes('timeframe')) return 'timeline';
    if (titleLower.includes('note') || titleLower.includes('description') || titleLower.includes('comment')) return 'notes';
    if (titleLower.includes('quote') && titleLower.includes('date')) return 'quote_date';
    if (titleLower.includes('catch') && titleLower.includes('date')) return 'first_contact_date';
    if (titleLower.includes('contact') && titleLower.includes('date')) return 'first_contact_date';
    if (titleLower.includes('first') && titleLower.includes('contact')) return 'first_contact_date';
    if (titleLower.includes('decision')) return 'customer_decision_by';
    if (titleLower.includes('probability')) return 'pipeline_probability';
    
    return 'unmapped'; // No mapping
  };

  const getDefaultTransform = (type: string): 'none' | 'split_name' | 'parse_number' | 'parse_date' | 'map_status' => {
    if (type === 'numeric') return 'parse_number';
    if (type === 'date') return 'parse_date';
    if (type === 'status') return 'map_status';
    return 'none';
  };

  const updateColumnMapping = (index: number, field: keyof ColumnMapping, value: string) => {
    const newMappings = [...columnMappings];
    newMappings[index] = { ...newMappings[index], [field]: value };
    setColumnMappings(newMappings);
  };

  const importLeads = async () => {
    if (!selectedBoard) {
      toast({
        title: "No board selected",
        description: "Please select a board to import from.",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('monday-crm-import', {
        body: { 
          action: 'importLeadsAdvanced', 
          boardId: selectedBoard,
          columnMappings,
          preserveUnmapped
        }
      });

      if (error) throw error;

      setImportResult(data);
      toast({
        title: "Import completed",
        description: `Successfully imported ${data.imported} leads${data.errors > 0 ? ` with ${data.errors} errors` : ''}.`,
        variant: data.errors > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error('Error importing leads:', error);
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const selectedBoardInfo = boards.find(b => b.id === selectedBoard);

  return (
    <div className="w-full max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Enhanced Monday.com CRM Import
          </CardTitle>
          <CardDescription>
            Import ALL your lead data from Monday.com with flexible column mapping to preserve every detail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Load Workspaces */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Step 1: Load Workspaces</h3>
            <Button 
              onClick={loadWorkspaces} 
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading Workspaces...
                </>
              ) : (
                'Load Monday.com Workspaces'
              )}
            </Button>
            
            {workspaces.length > 0 && (
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                      {workspace.description && (
                        <span className="text-muted-foreground ml-2">
                          - {workspace.description}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Step 2: Load Boards */}
          {selectedWorkspace && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Step 2: Load Boards</h3>
              <Button 
                onClick={() => loadBoards(selectedWorkspace)} 
                disabled={loading || !selectedWorkspace}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading Boards...
                  </>
                ) : (
                  'Load Boards from Workspace'
                )}
              </Button>
              
              {boards.length > 0 && (
                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a board to import from" />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                        {board.description && (
                          <span className="text-muted-foreground ml-2">
                            - {board.description}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Step 3: Column Mapping */}
          {selectedBoard && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Step 3: Configure Column Mapping</h3>
              <Button 
                onClick={setupColumnMapping} 
                disabled={!selectedBoard}
                className="w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Field Mapping
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Column Mapping Interface */}
      {showMapping && selectedBoardInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Column Mapping Configuration</CardTitle>
            <CardDescription>
              Map your Monday.com columns to lead fields. Unmapped data can be preserved in notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="preserve-unmapped" 
                checked={preserveUnmapped}
                onCheckedChange={(checked) => setPreserveUnmapped(checked === true)}
              />
              <Label htmlFor="preserve-unmapped">
                Preserve unmapped column data in notes
              </Label>
            </div>

            <ScrollArea className="h-96 w-full border rounded-md p-4">
              <div className="space-y-4">
                {columnMappings.map((mapping, index) => (
                  <div key={mapping.mondayColumnId} className="grid grid-cols-4 gap-4 items-center p-3 border rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">{mapping.mondayColumnTitle}</Label>
                      <p className="text-xs text-muted-foreground">
                        Type: {mapping.mondayColumnType}
                      </p>
                    </div>
                    
                    <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                    
                    <Select 
                      value={mapping.leadField} 
                      onValueChange={(value) => updateColumnMapping(index, 'leadField', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select lead field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unmapped">No mapping</SelectItem>
                        {LEAD_FIELDS.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select 
                      value={mapping.transform || 'none'} 
                      onValueChange={(value) => updateColumnMapping(index, 'transform', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No transformation</SelectItem>
                        <SelectItem value="split_name">Split full name</SelectItem>
                        <SelectItem value="parse_number">Parse as number</SelectItem>
                        <SelectItem value="parse_date">Parse as date</SelectItem>
                        <SelectItem value="map_status">Map status values</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-4">
              <Button onClick={importLeads} disabled={importing} className="flex-1">
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing Leads...
                  </>
                ) : (
                  'Import Leads with Custom Mapping'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700">
                Successfully imported {importResult.imported} leads
              </span>
            </div>
            
            {importResult.errors > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium text-red-700">
                  {importResult.errors} items failed to import
                </span>
              </div>
            )}

            {importResult.details.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Import Errors:</p>
                <ScrollArea className="h-32 w-full border rounded p-2">
                  {importResult.details.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded mb-1">
                      <strong>{error.itemName}:</strong> {error.error}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Import Notes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <h4 className="font-medium text-blue-900 mb-2">Enhanced Import Features:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Complete Data Mapping:</strong> Map ALL Monday.com columns to specific lead fields</li>
            <li>• <strong>Smart Auto-Detection:</strong> Automatically suggests field mappings based on column names</li>
            <li>• <strong>Data Transformations:</strong> Convert data types (numbers, dates, status values)</li>
            <li>• <strong>Preserve Everything:</strong> Unmapped data preserved in notes to ensure no data loss</li>
            <li>• <strong>Flexible Mapping:</strong> Handle complex boards with many custom fields</li>
            <li>• <strong>Validation:</strong> Ensures required fields are mapped before import</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMondayCrmImport;