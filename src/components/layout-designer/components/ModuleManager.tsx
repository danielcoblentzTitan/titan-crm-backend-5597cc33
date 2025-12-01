import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Save, Copy, Trash2, Edit, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Module, Fixture } from '../data/ModuleLibrary';

interface CustomModule extends Module {
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ModuleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentElements?: any[]; // Current canvas elements
  onLoadModule: (module: CustomModule) => void;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  isOpen,
  onClose,
  currentElements = [],
  onLoadModule
}) => {
  const [customModules, setCustomModules] = useState<CustomModule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingModule, setEditingModule] = useState<CustomModule | null>(null);
  
  // Form state for creating/editing modules
  const [moduleName, setModuleName] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');
  const [moduleCategory, setModuleCategory] = useState<'bathroom' | 'kitchen' | 'bedroom'>('bathroom');
  const [moduleNotes, setModuleNotes] = useState('');

  // Load custom modules from localStorage
  React.useEffect(() => {
    const savedModules = localStorage.getItem('customModules');
    if (savedModules) {
      try {
        setCustomModules(JSON.parse(savedModules));
      } catch (error) {
        console.error('Error loading custom modules:', error);
      }
    }
  }, []);

  // Save custom modules to localStorage
  const saveCustomModules = (modules: CustomModule[]) => {
    localStorage.setItem('customModules', JSON.stringify(modules));
    setCustomModules(modules);
  };

  // Convert current canvas elements to module format
  const convertElementsToModule = (): { fixtures: Fixture[], walls: any[] } => {
    const fixtures: Fixture[] = [];
    const walls: any[] = [];

    currentElements.forEach((element, index) => {
      if (element.type === 'fixture' || element.type === 'module') {
        fixtures.push({
          id: `fixture_${index}`,
          type: element.properties.name || element.type,
          symbol: element.properties.symbol || 'generic',
          position: { x: element.properties.left || 0, y: element.properties.top || 0 },
          dimensions: { 
            width: element.properties.width || 50, 
            height: element.properties.height || 50 
          },
          rotation: element.properties.angle || 0,
          properties: element.properties
        });
      } else if (element.type === 'wall') {
        walls.push({
          id: `wall_${index}`,
          start: { x: element.properties.x1 || 0, y: element.properties.y1 || 0 },
          end: { x: element.properties.x2 || 100, y: element.properties.y2 || 0 },
          thickness: element.properties.strokeWidth || 6,
          type: 'interior'
        });
      }
    });

    return { fixtures, walls };
  };

  // Calculate module dimensions from elements
  const calculateModuleDimensions = (fixtures: Fixture[], walls: any[]) => {
    let minX = 0, minY = 0, maxX = 200, maxY = 200;

    fixtures.forEach(fixture => {
      minX = Math.min(minX, fixture.position.x);
      minY = Math.min(minY, fixture.position.y);
      maxX = Math.max(maxX, fixture.position.x + fixture.dimensions.width);
      maxY = Math.max(maxY, fixture.position.y + fixture.dimensions.height);
    });

    walls.forEach(wall => {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    });

    return {
      width: Math.max(200, maxX - minX + 40), // Add padding
      height: Math.max(200, maxY - minY + 40)
    };
  };

  // Create new module from current canvas
  const handleCreateModule = () => {
    if (!moduleName.trim()) {
      toast.error('Please enter a module name');
      return;
    }

    if (currentElements.length === 0) {
      toast.error('No elements on canvas to save');
      return;
    }

    const { fixtures, walls } = convertElementsToModule();
    const dimensions = calculateModuleDimensions(fixtures, walls);

    const newModule: CustomModule = {
      id: `custom_${Date.now()}`,
      name: moduleName,
      category: moduleCategory,
      thumbnail: '/api/placeholder/150/100',
      description: moduleDescription || `Custom ${moduleCategory} module`,
      dimensions,
      fixtures,
      walls,
      variants: [],
      clearances: [],
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedModules = [...customModules, newModule];
    saveCustomModules(updatedModules);

    toast.success(`Module "${moduleName}" saved successfully!`);
    resetForm();
    setIsCreating(false);
  };

  // Clone existing module
  const handleCloneModule = (module: CustomModule) => {
    const clonedModule: CustomModule = {
      ...module,
      id: `custom_${Date.now()}`,
      name: `${module.name} (Copy)`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedModules = [...customModules, clonedModule];
    saveCustomModules(updatedModules);

    toast.success(`Module cloned as "${clonedModule.name}"`);
  };

  // Delete custom module
  const handleDeleteModule = (moduleId: string) => {
    const updatedModules = customModules.filter(m => m.id !== moduleId);
    saveCustomModules(updatedModules);
    toast.success('Module deleted successfully');
  };

  // Reset form
  const resetForm = () => {
    setModuleName('');
    setModuleDescription('');
    setModuleCategory('bathroom');
    setModuleNotes('');
    setEditingModule(null);
  };

  const ModuleCard: React.FC<{ module: CustomModule }> = ({ module }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">
              {module.category}
            </Badge>
            {module.isCustom && (
              <Badge variant="outline" className="text-xs">
                Custom
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center text-xs text-muted-foreground">
          {module.dimensions.width}" × {module.dimensions.height}"
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {module.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{module.fixtures.length} fixtures</span>
          <span>{new Date(module.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => onLoadModule(module)}
          >
            Load
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-2"
            onClick={() => handleCloneModule(module)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-2"
            onClick={() => setEditingModule(module)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="px-2 text-destructive"
            onClick={() => handleDeleteModule(module.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Module Manager</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Module Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create Custom Module</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setIsCreating(!isCreating)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  {isCreating ? 'Cancel' : 'New Module'}
                </Button>
              </div>
            </CardHeader>
            
            {isCreating && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="module-name">Module Name</Label>
                    <Input
                      id="module-name"
                      value={moduleName}
                      onChange={(e) => setModuleName(e.target.value)}
                      placeholder="e.g., Master Bath Layout"
                    />
                  </div>
                  <div>
                    <Label htmlFor="module-category">Category</Label>
                    <Select value={moduleCategory} onValueChange={(value: any) => setModuleCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bathroom">Bathroom</SelectItem>
                        <SelectItem value="kitchen">Kitchen</SelectItem>
                        <SelectItem value="bedroom">Bedroom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="module-description">Description</Label>
                  <Textarea
                    id="module-description"
                    value={moduleDescription}
                    onChange={(e) => setModuleDescription(e.target.value)}
                    placeholder="Describe this module layout..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Current canvas: {currentElements.length} elements
                  </span>
                  <Button onClick={handleCreateModule}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Module
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          <Separator />

          {/* Custom Modules Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Custom Modules ({customModules.length})
            </h3>
            
            {customModules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No custom modules yet</p>
                <p className="text-sm">Create your first custom module from the canvas elements</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customModules.map((module) => (
                    <ModuleCard key={module.id} module={module} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};