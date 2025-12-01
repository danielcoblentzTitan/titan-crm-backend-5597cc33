import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Clock, AlertTriangle, Plus, Filter, Search, Eye, Printer, CheckSquare } from 'lucide-react';
import { usePunchlist, PunchlistItem, BulkUpdateData } from '@/hooks/usePunchlist';
import { PunchlistForm } from './PunchlistForm';
import { PunchlistItemCard } from './PunchlistItemCard';
import { BulkActionBar } from './BulkActionBar';
import { OverdueWidget } from './OverdueWidget';
import { TemplateManager } from './TemplateManager';
import { TemplateItem } from '@/hooks/usePunchlistTemplates';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { NotificationSettings } from './NotificationSettings';
import { ExportManager } from './ExportManager';
import { format } from 'date-fns';

interface PunchlistManagerProps {
  projectId: string;
  isCustomerView?: boolean;
}

export function PunchlistManager({ projectId, isCustomerView = false }: PunchlistManagerProps) {
  const { items, loading, getCompletionPercentage, bulkUpdate, bulkDelete, getOverdueItems, getDueSoonItems, createItem } = usePunchlist(projectId);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(!isCustomerView);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleApplyTemplate = async (templateItems: TemplateItem[]) => {
    // Apply template items to punchlist
    for (const item of templateItems) {
      await createItem({
        project_id: projectId,
        location: item.location,
        description: item.description,
        priority: item.priority,
        source: 'internal',
        assigned_to_vendor: item.assigned_to_vendor,
        due_date: item.due_date
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusCount = (status: string) => {
    return items.filter(item => item.status === status).length;
  };

  const getPriorityCount = (priority: string) => {
    return items.filter(item => item.priority === priority).length;
  };

  const handleItemSelection = (itemId: string, selected: boolean) => {
    setSelectedItems(prev => 
      selected 
        ? [...prev, itemId]
        : prev.filter(id => id !== itemId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredItems.map(item => item.id) : []);
  };

  const handleBulkUpdate = async (updates: BulkUpdateData) => {
    await bulkUpdate(selectedItems, updates);
    setSelectedItems([]);
  };

  const handleBulkDelete = async () => {
    await bulkDelete(selectedItems);
    setSelectedItems([]);
  };

  const overdueItems = getOverdueItems();
  const dueSoonItems = getDueSoonItems();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overdue Items Widget */}
      {!isCustomerView && (
        <OverdueWidget 
          overdueItems={overdueItems} 
          dueSoonItems={dueSoonItems} 
        />
      )}

      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">
              {isCustomerView ? 'Project Punchlist' : 'Punchlist Management'}
            </CardTitle>
            <div className="flex gap-2">
              {!isCustomerView && (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(`/punchlist/${projectId}/print`, '_blank')}
                    disabled={items.length === 0}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Work Orders
                  </Button>
                  <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={showTemplates ? "bg-primary/10" : ""}
                  >
                    Templates
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className={showBulkActions ? "bg-primary/10" : ""}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Bulk Actions
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={showAnalytics ? "bg-primary/10" : ""}
                  >
                    Analytics
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={showNotifications ? "bg-primary/10" : ""}
                  >
                    Notifications
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowExport(!showExport)}
                    className={showExport ? "bg-primary/10" : ""}
                  >
                    Export
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {getCompletionPercentage()}% Complete ({items.filter(i => i.status === 'Completed').length} of {items.length})
              </span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-2" />
            
            {/* Status Summary */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Open: {getStatusCount('Open')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">In Progress: {getStatusCount('In Progress')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Completed: {getStatusCount('Completed')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {showTemplates && (
        <TemplateManager 
          projectId={projectId}
          onApplyTemplate={handleApplyTemplate}
          isCustomerView={isCustomerView}
        />
      )}

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <AnalyticsDashboard projectId={projectId} />
      )}

      {/* Notification Settings */}
      {showNotifications && (
        <NotificationSettings projectId={projectId} />
      )}

      {/* Export Manager */}
      {showExport && (
        <ExportManager 
          projectId={projectId} 
          items={items}
          projectName={`Project ${projectId}`}
        />
      )}

      {/* Add Item Form */}
      {showForm && !isCustomerView && (
        <PunchlistForm 
          projectId={projectId} 
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <BulkActionBar
          selectedItems={selectedItems}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
          onClearSelection={() => setSelectedItems([])}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {showBulkActions && filteredItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>
            )}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">
                {items.length === 0 ? 'No punchlist items yet' : 'No items match your filters'}
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                {items.length === 0 
                  ? 'Items will appear here once they are added during the walkthrough'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <PunchlistItemCard
              key={item.id}
              item={item}
              isCustomerView={isCustomerView}
              isSelected={selectedItems.includes(item.id)}
              onSelectionChange={handleItemSelection}
              showCheckbox={showBulkActions}
            />
          ))
        )}
      </div>
    </div>
  );
}