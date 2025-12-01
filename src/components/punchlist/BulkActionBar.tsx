import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, CheckSquare, Users, Calendar, X } from 'lucide-react';
import { BulkUpdateData } from '@/hooks/usePunchlist';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface BulkActionBarProps {
  selectedItems: string[];
  onBulkUpdate: (updates: BulkUpdateData) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActionBar({ 
  selectedItems, 
  onBulkUpdate, 
  onBulkDelete, 
  onClearSelection 
}: BulkActionBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkStatusUpdate = async (status: string) => {
    setIsUpdating(true);
    try {
      await onBulkUpdate({ status: status as 'Open' | 'In Progress' | 'Completed' });
      onClearSelection();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkPriorityUpdate = async (priority: string) => {
    setIsUpdating(true);
    try {
      await onBulkUpdate({ priority: priority as 'Low' | 'Medium' | 'High' });
      onClearSelection();
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''}?`)) {
      setIsUpdating(true);
      try {
        await onBulkDelete();
        onClearSelection();
      } finally {
        setIsUpdating(false);
      }
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <Card className="p-4 mb-4 bg-primary/5 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Update Status:</span>
            <Select onValueChange={handleBulkStatusUpdate} disabled={isUpdating}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Update Priority:</span>
            <Select onValueChange={handleBulkPriorityUpdate} disabled={isUpdating}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isUpdating}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
            disabled={isUpdating}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
        </div>
      </div>
    </Card>
  );
}