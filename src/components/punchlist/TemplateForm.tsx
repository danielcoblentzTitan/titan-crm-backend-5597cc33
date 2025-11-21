import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { usePunchlistTemplates, PunchlistTemplate, TemplateItem, CreateTemplateData } from '@/hooks/usePunchlistTemplates';

interface TemplateFormProps {
  projectId: string;
  template?: PunchlistTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TemplateForm({ projectId, template, onSuccess, onCancel }: TemplateFormProps) {
  const { createTemplate, updateTemplate } = usePunchlistTemplates(projectId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'general',
    template_items: template?.template_items || [],
    is_public: template?.is_public || false,
    project_id: template?.project_id || (template?.is_public ? undefined : projectId)
  });

  const [newItem, setNewItem] = useState<TemplateItem>({
    location: '',
    description: '',
    priority: 'Medium'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.template_items.length === 0) return;

    setIsSubmitting(true);
    try {
      if (template) {
        await updateTemplate(template.id, formData);
      } else {
        await createTemplate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    if (!newItem.location.trim() || !newItem.description.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      template_items: [...prev.template_items, { ...newItem }]
    }));
    
    setNewItem({
      location: '',
      description: '',
      priority: 'Medium'
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      template_items: prev.template_items.filter((_, i) => i !== index)
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === formData.template_items.length - 1)
    ) return;

    const newItems = [...formData.template_items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    setFormData(prev => ({
      ...prev,
      template_items: newItems
    }));
  };

  const commonLocations = [
    'Kitchen', 'Living Room', 'Master Bedroom', 'Bathroom', 'Garage', 
    'Exterior', 'Basement', 'Attic', 'Dining Room', 'Office', 'Laundry Room',
    'Throughout House', 'Electrical Panel', 'Trim Work', 'Doors', 'Windows'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Kitchen Final Inspection"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={(value: 'room' | 'trade' | 'general') => 
              setFormData(prev => ({ ...prev, category: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room">Room-based</SelectItem>
              <SelectItem value="trade">Trade-specific</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this template is used for..."
          rows={2}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="public"
          checked={formData.is_public}
          onCheckedChange={(checked) => 
            setFormData(prev => ({ 
              ...prev, 
              is_public: checked,
              project_id: checked ? undefined : projectId
            }))
          }
        />
        <Label htmlFor="public">Make this template public (available to all projects)</Label>
      </div>

      {/* Template Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Item */}
          <div className="p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
            <h4 className="font-medium mb-3">Add New Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <Label htmlFor="location" className="text-sm">Location</Label>
                <Input
                  id="location"
                  value={newItem.location}
                  onChange={(e) => setNewItem(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Location"
                  list="locations"
                />
                <datalist id="locations">
                  {commonLocations.map(location => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </div>
              
              <div className="md:col-span-6">
                <Label htmlFor="item-description" className="text-sm">Description</Label>
                <Input
                  id="item-description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the item or task"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label className="text-sm">Priority</Label>
                <Select
                  value={newItem.priority}
                  onValueChange={(value: 'Low' | 'Medium' | 'High') => 
                    setNewItem(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newItem.location.trim() || !newItem.description.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Existing Items */}
          {formData.template_items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Items ({formData.template_items.length})</h4>
              <ScrollArea className="h-64 w-full">
                <div className="space-y-2">
                  {formData.template_items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-background rounded border">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={index === formData.template_items.length - 1}
                          className="h-6 w-6 p-0"
                        >
                          ↓
                        </Button>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-3">
                          <span className="font-medium text-sm">{item.location}</span>
                        </div>
                        <div className="md:col-span-7">
                          <span className="text-sm text-muted-foreground">{item.description}</span>
                        </div>
                        <div className="md:col-span-2">
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
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {formData.template_items.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>No items added yet. Add your first item above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.name.trim() || formData.template_items.length === 0}
        >
          {isSubmitting ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
