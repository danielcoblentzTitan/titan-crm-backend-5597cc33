import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const MondayCrmImport = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
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
        body: { action: 'importLeads', boardId: selectedBoard }
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
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Monday.com CRM Import
        </CardTitle>
        <CardDescription>
          Import leads from your Monday.com CRM boards into your lead management system.
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

        {/* Board Preview */}
        {selectedBoardInfo && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Board Preview</h3>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{selectedBoardInfo.name}</h4>
                  {selectedBoardInfo.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedBoardInfo.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Columns found:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedBoardInfo.columns.map((column) => (
                        <Badge key={column.id} variant="outline">
                          {column.title} ({column.type})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Import */}
        {selectedBoard && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Step 3: Import Leads</h3>
            <Button 
              onClick={importLeads} 
              disabled={importing || !selectedBoard}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing Leads...
                </>
              ) : (
                'Import Leads from Board'
              )}
            </Button>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Import Results</h3>
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-4">
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
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {importResult.details.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>{error.itemName}:</strong> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Import Notes */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <h4 className="font-medium text-blue-900 mb-2">Import Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The import will attempt to map common column names to lead fields</li>
              <li>• Supported mappings: name, email, phone, company, address, city, state, zip, status, value, notes</li>
              <li>• All imported leads will have source set to "Monday.com Import"</li>
              <li>• Duplicate emails will be skipped to prevent conflicts</li>
              <li>• Review the imported leads after import to ensure data accuracy</li>
            </ul>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default MondayCrmImport;