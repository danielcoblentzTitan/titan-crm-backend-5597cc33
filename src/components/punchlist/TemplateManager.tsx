import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, FileText, Building, Wrench, List, Eye, Edit2, Trash2 } from 'lucide-react';
import { usePunchlistTemplates, PunchlistTemplate, TemplateItem } from '@/hooks/usePunchlistTemplates';
import { TemplateForm } from './TemplateForm';

interface TemplateManagerProps {
  projectId: string;
  onApplyTemplate: (items: TemplateItem[]) => void;
  isCustomerView?: boolean;
}

export function TemplateManager({ projectId, onApplyTemplate, isCustomerView = false }: TemplateManagerProps) {
  const { templates, loading, deleteTemplate, getTemplatesByCategory } = usePunchlistTemplates(projectId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PunchlistTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PunchlistTemplate | null>(null);

  const handleApplyTemplate = (template: PunchlistTemplate) => {
    onApplyTemplate(template.template_items);
  };

  const handleDelete = async (template: PunchlistTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      await deleteTemplate(template.id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'room':
        return <Building className="h-4 w-4" />;
      case 'trade':
        return <Wrench className="h-4 w-4" />;
      default:
        return <List className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'room':
        return 'Room-based';
      case 'trade':
        return 'Trade-specific';
      default:
        return 'General';
    }
  };

  const TemplateCard = ({ template }: { template: PunchlistTemplate }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium">{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {getCategoryIcon(template.category)}
              <span className="ml-1">{getCategoryLabel(template.category)}</span>
            </Badge>
            {template.is_public && (
              <Badge variant="secondary" className="text-xs">Public</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {template.template_items.length} item{template.template_items.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleApplyTemplate(template)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Punchlist
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTemplate(template)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            {!isCustomerView && !template.is_public && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TemplatePreview = ({ template }: { template: PunchlistTemplate }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {getCategoryIcon(template.category)}
          <span className="ml-1">{getCategoryLabel(template.category)}</span>
        </Badge>
        <Badge variant="secondary">{template.template_items.length} items</Badge>
      </div>
      
      <ScrollArea className="h-64 w-full">
        <div className="space-y-2">
          {template.template_items.map((item, index) => (
            <div key={index} className="p-3 bg-muted/50 rounded border">
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-sm">{item.location}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    item.priority === 'High' ? 'border-red-200 text-red-800' :
                    item.priority === 'Medium' ? 'border-yellow-200 text-yellow-800' :
                    'border-green-200 text-green-800'
                  }`}
                >
                  {item.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Punchlist Templates
            <Badge variant="secondary">{templates.length}</Badge>
          </div>
          {!isCustomerView && (
            <Button onClick={() => setShowCreateForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({templates.length})</TabsTrigger>
            <TabsTrigger value="room">
              Room ({getTemplatesByCategory('room').length})
            </TabsTrigger>
            <TabsTrigger value="trade">
              Trade ({getTemplatesByCategory('trade').length})
            </TabsTrigger>
            <TabsTrigger value="general">
              General ({getTemplatesByCategory('general').length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="room" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getTemplatesByCategory('room').map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="trade" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getTemplatesByCategory('trade').map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="general" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getTemplatesByCategory('general').map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Template Dialog */}
        {showCreateForm && (
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create New Template</DialogTitle>
              </DialogHeader>
              <TemplateForm
                projectId={projectId}
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Template Dialog */}
        {editingTemplate && (
          <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Template</DialogTitle>
              </DialogHeader>
              <TemplateForm
                projectId={projectId}
                template={editingTemplate}
                onSuccess={() => setEditingTemplate(null)}
                onCancel={() => setEditingTemplate(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Template Preview Dialog */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
              </DialogHeader>
              <TemplatePreview template={selectedTemplate} />
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={() => {
                    handleApplyTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Punchlist
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {templates.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No templates available</h3>
            <p className="text-sm mb-4">
              Create your first template to speed up punchlist creation
            </p>
            {!isCustomerView && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}