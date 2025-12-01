import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lead, TeamMember } from "@/services/supabaseService";
import { 
  Users, 
  CheckSquare, 
  Mail, 
  Archive, 
  Tag, 
  Download, 
  Upload,
  Trash2,
  UserPlus,
  Clock,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkOperationsToolbarProps {
  leads: Lead[];
  selectedLeads: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  teamMembers: TeamMember[];
  onBulkUpdate: (leadIds: string[], updates: Partial<Lead>) => Promise<void>;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
}

export const BulkOperationsToolbar = ({
  leads,
  selectedLeads,
  onSelectionChange,
  teamMembers,
  onBulkUpdate,
  onBulkDelete
}: BulkOperationsToolbarProps) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkActionValue, setBulkActionValue] = useState<string>('');
  const { toast } = useToast();

  const selectedCount = selectedLeads.length;
  const totalCount = leads.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartialSelected = selectedCount > 0 && selectedCount < totalCount;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(leads.map(lead => lead.id));
    }
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedCount === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one lead",
        variant: "destructive"
      });
      return;
    }

    setBulkAction(action);
    setBulkActionValue(value || '');
    setIsConfirmDialogOpen(true);
  };

  const executeBulkAction = async () => {
    try {
      let updates: Partial<Lead> = {};

      switch (bulkAction) {
        case 'assign':
          updates.assigned_to = bulkActionValue === 'unassign' ? null : bulkActionValue;
          break;
        case 'status':
          updates.status = bulkActionValue;
          break;
        case 'priority':
          updates.priority = bulkActionValue;
          break;
        case 'stage':
          updates.stage = bulkActionValue as Lead['stage'];
          break;
        case 'archive':
          updates.archived_at = new Date().toISOString();
          break;
        case 'unarchive':
          updates.archived_at = null;
          break;
        case 'delete':
          await onBulkDelete(selectedLeads);
          break;
        default:
          return;
      }

      if (bulkAction !== 'delete') {
        await onBulkUpdate(selectedLeads, updates);
      }

      toast({
        title: "Success",
        description: `Updated ${selectedCount} lead(s) successfully`
      });

      onSelectionChange([]);
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Bulk operation error:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk operation",
        variant: "destructive"
      });
    }
  };

  const exportSelectedLeads = () => {
    const selectedLeadsData = leads.filter(lead => selectedLeads.includes(lead.id));
    const csvContent = generateCSV(selectedLeadsData);
    downloadCSV(csvContent, 'selected_leads.csv');
    
    toast({
      title: "Export Complete",
      description: `Exported ${selectedCount} lead(s) to CSV`
    });
  };

  const generateCSV = (data: Lead[]): string => {
    const headers = [
      'Name', 'Email', 'Phone', 'Company', 'Status', 'Priority', 'Stage',
      'Estimated Value', 'City', 'State', 'Source', 'Created At'
    ];

    const rows = data.map(lead => [
      `${lead.first_name} ${lead.last_name}`,
      lead.email || '',
      lead.phone || '',
      lead.company || '',
      lead.status || '',
      lead.priority || '',
      lead.stage || '',
      lead.estimated_value?.toString() || '0',
      lead.city || '',
      lead.state || '',
      lead.source || '',
      new Date(lead.created_at).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Selection Header */}
      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            ref={(ref) => {
              if (ref) (ref as any).indeterminate = isPartialSelected;
            }}
            onCheckedChange={toggleSelectAll}
          />
          <Badge variant="secondary">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            Clear Selection
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {selectedCount} of {totalCount} leads selected
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap gap-2 p-3 bg-background border rounded-lg">
        {/* Assignment Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Assign:</span>
          <Select onValueChange={(value) => handleBulkAction('assign', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassign">Unassign</SelectItem>
              {teamMembers.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select onValueChange={(value) => handleBulkAction('status', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Set status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Priority Actions */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Priority:</span>
          <Select onValueChange={(value) => handleBulkAction('priority', value)}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Set priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('archive')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportSelectedLeads}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleBulkAction('delete')}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Operation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>
              Are you sure you want to {bulkAction} {selectedCount} selected lead(s)?
            </p>
            
            {bulkAction === 'delete' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. All selected leads and their associated data will be permanently deleted.
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={executeBulkAction}
                variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              >
                Confirm {bulkAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};