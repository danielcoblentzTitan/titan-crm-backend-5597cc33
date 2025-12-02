import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { EnhancedPhase, GanttViewSettings } from './SophisticatedGantt';

interface Props {
  phases: EnhancedPhase[];
  viewSettings: GanttViewSettings;
  onFilterChange: (settings: Partial<GanttViewSettings>) => void;
}

export function GanttFilters({ phases, viewSettings, onFilterChange }: Props) {
  const uniqueStatuses = Array.from(new Set(phases.map(p => p.status)));
  const uniqueResources = Array.from(new Set(phases.map(p => p.resource_name).filter(Boolean)));

  const addStatusFilter = (status: string) => {
    if (!viewSettings.filter_status.includes(status)) {
      onFilterChange({
        filter_status: [...viewSettings.filter_status, status]
      });
    }
  };

  const removeStatusFilter = (status: string) => {
    onFilterChange({
      filter_status: viewSettings.filter_status.filter(s => s !== status)
    });
  };

  const addResourceFilter = (resource: string) => {
    if (!viewSettings.filter_resources.includes(resource)) {
      onFilterChange({
        filter_resources: [...viewSettings.filter_resources, resource]
      });
    }
  };

  const removeResourceFilter = (resource: string) => {
    onFilterChange({
      filter_resources: viewSettings.filter_resources.filter(r => r !== resource)
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      filter_status: [],
      filter_resources: []
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Filters</Label>
        
        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select onValueChange={addStatusFilter}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Add status filter..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Active Status Filters */}
          {viewSettings.filter_status.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {viewSettings.filter_status.map(status => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {status}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeStatusFilter(status)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Resource Filter */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Resource</Label>
          <Select onValueChange={addResourceFilter}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Add resource filter..." />
            </SelectTrigger>
            <SelectContent>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource!}>
                  {resource}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Active Resource Filters */}
          {viewSettings.filter_resources.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {viewSettings.filter_resources.map(resource => (
                <Badge key={resource} variant="secondary" className="text-xs">
                  {resource}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1"
                    onClick={() => removeResourceFilter(resource)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Filters */}
        {(viewSettings.filter_status.length > 0 || viewSettings.filter_resources.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8"
            onClick={clearAllFilters}
          >
            Clear All Filters
          </Button>
        )}
      </div>
    </div>
  );
}