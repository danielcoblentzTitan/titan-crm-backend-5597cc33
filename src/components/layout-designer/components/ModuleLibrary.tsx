import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RotateCw, FlipHorizontal } from 'lucide-react';
import { allModules, getModulesByCategory, Module } from '../data/ModuleLibrary';

interface ModuleLibraryProps {
  onModuleSelect: (module: Module) => void;
  onModuleDrag: (module: Module) => void;
}

export const ModuleLibrary: React.FC<ModuleLibraryProps> = ({
  onModuleSelect,
  onModuleDrag
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Modules', count: allModules.length },
    { id: 'building', name: 'Buildings', count: getModulesByCategory('building').length },
    { id: 'bathroom', name: 'Bathrooms', count: getModulesByCategory('bathroom').length },
    { id: 'kitchen', name: 'Kitchens', count: getModulesByCategory('kitchen').length },
    { id: 'bedroom', name: 'Bedrooms', count: getModulesByCategory('bedroom').length }
  ];

  const filteredModules = allModules.filter(module => {
    const matchesSearch = module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleModuleDragStart = (e: React.DragEvent, module: Module) => {
    e.dataTransfer.setData('application/json', JSON.stringify(module));
    e.dataTransfer.effectAllowed = 'copy';
    onModuleDrag(module);
  };

  const ModuleCard: React.FC<{ module: Module }> = ({ module }) => {
    const isBuilding = module.category === 'building';
    const dimensionsText = isBuilding 
      ? `${Math.round(module.dimensions.width / 12)}' × ${Math.round(module.dimensions.height / 12)}'`
      : `${module.dimensions.width}" × ${module.dimensions.height}"`;
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        draggable
        onDragStart={(e) => handleModuleDragStart(e, module)}
        onClick={() => onModuleSelect(module)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{module.name}</CardTitle>
            <Badge variant={isBuilding ? "default" : "secondary"} className="text-xs">
              {module.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="aspect-video bg-muted rounded-md mb-2 flex items-center justify-center text-xs text-muted-foreground">
            {dimensionsText}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {module.description}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {isBuilding ? `${module.walls.length} walls` : `${module.fixtures.length} fixtures`}
            </span>
            {!isBuilding && (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <RotateCw className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <FlipHorizontal className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          {module.variants.length > 0 && (
            <div className="mt-1">
              <Badge variant="outline" className="text-xs">
                {module.variants.length} variants
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Module Library</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="building" className="text-xs">Buildings</TabsTrigger>
            <TabsTrigger value="bathroom" className="text-xs">Bath</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-2 mt-1">
            <TabsTrigger value="kitchen" className="text-xs">Kitchen</TabsTrigger>
            <TabsTrigger value="bedroom" className="text-xs">Bedroom</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Module Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3">
            {filteredModules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
          
          {filteredModules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No modules found</p>
              <p className="text-xs mt-1">Try adjusting your search or category</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Usage Instructions */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Drag & Drop:</strong> Drag modules to canvas</p>
          <p><strong>Click:</strong> Select and place module</p>
          <p><strong>Variants:</strong> Right-click for options</p>
        </div>
      </div>
    </div>
  );
};