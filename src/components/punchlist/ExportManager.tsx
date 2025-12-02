import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer, Mail, Calendar, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PunchlistItem } from '@/hooks/usePunchlist';

interface ExportManagerProps {
  projectId: string;
  items: PunchlistItem[];
  projectName: string;
}

interface ExportFilters {
  statuses: string[];
  priorities: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  includePhotos: boolean;
  includeComments: boolean;
}

export function ExportManager({ projectId, items, projectName }: ExportManagerProps) {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'print'>('pdf');
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<ExportFilters>({
    statuses: ['Open', 'In Progress', 'Completed'],
    priorities: ['High', 'Medium', 'Low'],
    includePhotos: true,
    includeComments: true,
  });

  const handleStatusFilter = (status: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      statuses: checked 
        ? [...prev.statuses, status]
        : prev.statuses.filter(s => s !== status)
    }));
  };

  const handlePriorityFilter = (priority: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      priorities: checked 
        ? [...prev.priorities, priority]
        : prev.priorities.filter(p => p !== priority)
    }));
  };

  const getFilteredItems = () => {
    return items.filter(item => 
      filters.statuses.includes(item.status) &&
      filters.priorities.includes(item.priority)
    );
  };

  const handleExport = async () => {
    setExporting(true);
    
    try {
      const filteredItems = getFilteredItems();
      
      if (filteredItems.length === 0) {
        toast({
          title: 'No Items to Export',
          description: 'Please adjust your filters to include some items.',
          variant: 'destructive',
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-punchlist', {
        body: {
          projectId,
          projectName,
          exportType,
          items: filteredItems,
          filters,
          includePhotos: filters.includePhotos,
          includeComments: filters.includeComments,
        }
      });

      if (error) throw error;

      // Save export record
      await supabase.from('punchlist_exports').insert({
        project_id: projectId,
        export_type: exportType,
        filters_applied: filters as any,
        file_url: data.fileUrl,
      });

      if (exportType === 'print') {
        // Open print dialog
        const printWindow = window.open(data.fileUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      } else {
        // Download file
        const link = document.createElement('a');
        link.href = data.fileUrl;
        link.download = `${projectName}_punchlist_${new Date().toISOString().split('T')[0]}.${exportType}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: 'Export Successful',
        description: `Punchlist has been exported as ${exportType.toUpperCase()}.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the punchlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const sendEmail = async () => {
    setExporting(true);
    
    try {
      const filteredItems = getFilteredItems();
      
      const { error } = await supabase.functions.invoke('email-punchlist', {
        body: {
          projectId,
          projectName,
          items: filteredItems,
          filters,
        }
      });

      if (error) throw error;

      toast({
        title: 'Email Sent',
        description: 'Punchlist has been emailed to stakeholders.',
      });

    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: 'Email Failed',
        description: 'There was an error sending the email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export & Share Punchlist
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="space-y-2">
          <Label>Export Format</Label>
          <Select value={exportType} onValueChange={(value: 'pdf' | 'excel' | 'print') => setExportType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Excel Spreadsheet
                </div>
              </SelectItem>
              <SelectItem value="print">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print View
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Include Statuses
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {['Open', 'In Progress', 'Completed'].map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.statuses.includes(status)}
                  onCheckedChange={(checked) => handleStatusFilter(status, checked as boolean)}
                />
                <Label htmlFor={`status-${status}`} className="text-sm">
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Filters */}
        <div className="space-y-3">
          <Label>Include Priorities</Label>
          <div className="grid grid-cols-3 gap-2">
            {['High', 'Medium', 'Low'].map((priority) => (
              <div key={priority} className="flex items-center space-x-2">
                <Checkbox
                  id={`priority-${priority}`}
                  checked={filters.priorities.includes(priority)}
                  onCheckedChange={(checked) => handlePriorityFilter(priority, checked as boolean)}
                />
                <Label htmlFor={`priority-${priority}`} className="text-sm">
                  {priority}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <Label>Additional Content</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-photos"
                checked={filters.includePhotos}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includePhotos: checked as boolean }))}
              />
              <Label htmlFor="include-photos" className="text-sm">
                Include Photos
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-comments"
                checked={filters.includeComments}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeComments: checked as boolean }))}
              />
              <Label htmlFor="include-comments" className="text-sm">
                Include Comments
              </Label>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 bg-secondary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Export Preview</span>
            <Badge variant="outline">
              {filteredItems.length} items
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            This export will include {filteredItems.length} punchlist items
            {filters.includePhotos && ', photos'}
            {filters.includeComments && ', comments'}.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleExport} 
            disabled={exporting || filteredItems.length === 0}
            className="flex-1"
          >
            {exporting ? 'Exporting...' : (
              <>
                {exportType === 'pdf' && <FileText className="mr-2 h-4 w-4" />}
                {exportType === 'excel' && <Download className="mr-2 h-4 w-4" />}
                {exportType === 'print' && <Printer className="mr-2 h-4 w-4" />}
                Export {exportType.toUpperCase()}
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={sendEmail}
            disabled={exporting || filteredItems.length === 0}
          >
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}