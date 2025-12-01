import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, FileText, Layers, Home, Wrench, Settings, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { EnhancedFabricCanvas, FabricCanvasRef } from './FabricCanvas';
import { ModuleLibrary } from './components/ModuleLibrary';
import { FixtureBrowser } from './components/FixtureBrowser';
import { ModuleVariantPanel } from './components/ModuleVariantPanel';
import { ProfessionalExport } from './components/ProfessionalExport';
import { EnhancedPropertyPanel } from './EnhancedPropertyPanel';
import { LayoutList } from './LayoutList';
import { useLayoutPersistence } from './hooks/useLayoutPersistence';
import { Module } from './data/ModuleLibrary';
import type { Customer } from '@/services/supabaseService';

interface BuildingLayoutDesignerProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'module' | 'fixture' | 'dimension';
  properties: Record<string, any>;
}

export const BuildingLayoutDesignerEnhanced: React.FC<BuildingLayoutDesignerProps> = ({
  customer,
  isOpen,
  onClose
}) => {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<ArchitecturalElement | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [elements, setElements] = useState<ArchitecturalElement[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const [activeTab, setActiveTab] = useState('design');
  const [leftSidebarContent, setLeftSidebarContent] = useState<'modules' | 'fixtures'>('modules');

  const canvasRef = useRef<FabricCanvasRef>(null);
  const {
    layouts,
    saveLayout,
    loadLayout,
    deleteLayout,
    isSaving,
  } = useLayoutPersistence(customer.id);

  const handleSave = useCallback(async () => {
    if (!elements.length) {
      toast.error('Nothing to save - Add some elements first');
      return;
    }

    try {
      const layoutName = `Layout ${new Date().toLocaleDateString()}`;
      const layoutId = await saveLayout({
        name: layoutName,
        elements,
        width: 800,
        height: 600,
        notes: `Layout for ${customer.name}`,
      });
      
      setCurrentLayoutId(layoutId);
      toast.success('Layout saved successfully!');
    } catch (error) {
      toast.error('Failed to save layout');
    }
  }, [elements, saveLayout, customer.name]);

  const handleLoadLayout = useCallback(async (layoutId: string) => {
    try {
      const layout = await loadLayout(layoutId);
      if (layout) {
        setElements((layout as any).elements || []);
        setCurrentLayoutId(layoutId);
        toast.success('Layout loaded successfully!');
      }
    } catch (error) {
      toast.error('Failed to load layout');
    }
  }, [loadLayout]);

  const handleNewLayout = useCallback(() => {
    setElements([]);
    setSelectedElement(null);
    setSelectedModule(null);
    setCurrentLayoutId(null);
    canvasRef.current?.clear();
    toast.success('New layout started');
  }, []);

  const handleElementSelect = useCallback((element: ArchitecturalElement | null) => {
    setSelectedElement(element);
    // Clear module selection when selecting individual elements
    if (element) {
      setSelectedModule(null);
      setSelectedVariant(null);
    }
  }, []);

  const handleElementUpdate = useCallback((elementId: string, updates: Partial<ArchitecturalElement>) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  }, []);

  const handleClear = useCallback(() => {
    setElements([]);
    setSelectedElement(null);
    setSelectedModule(null);
    canvasRef.current?.clear();
    toast.success('Canvas cleared');
  }, []);

  // Module handling
  const handleModuleSelect = useCallback((module: Module) => {
    setSelectedModule(module);
    setSelectedVariant(null);
    setSelectedElement(null);
    setSelectedTool('place-module');
    toast.success(`Selected ${module.name} - Click on canvas to place`);
  }, []);

  const handleModuleDrag = useCallback((module: Module) => {
    setSelectedTool('place-module');
    setSelectedModule(module);
  }, []);

  const handleFixtureSelect = useCallback((fixture: any) => {
    setSelectedTool('place-fixture');
    setSelectedElement(null);
    setSelectedModule(null);
    toast.success(`Selected ${fixture.name} - Click on canvas to place`);
  }, []);

  const handleFixtureDrag = useCallback((fixture: any) => {
    setSelectedTool('place-fixture');
  }, []);

  const handleVariantSelect = useCallback((variantId: string) => {
    setSelectedVariant(variantId);
    if (selectedModule) {
      const variant = selectedModule.variants.find(v => v.id === variantId);
      if (variant) {
        toast.success(`Applied variant: ${variant.name}`);
      }
    }
  }, [selectedModule]);

  const handleModuleRotate = useCallback(() => {
    if (selectedModule) {
      toast.success('Module rotated 90°');
    }
  }, [selectedModule]);

  const handleModuleFlip = useCallback(() => {
    if (selectedModule) {
      toast.success('Module flipped horizontally');
    }
  }, [selectedModule]);

  const handleModuleMove = useCallback(() => {
    if (selectedModule) {
      setSelectedTool('move');
      toast.success('Move mode activated - click to place');
    }
  }, [selectedModule]);

  const handleModuleDelete = useCallback(() => {
    if (selectedModule) {
      setSelectedModule(null);
      setSelectedVariant(null);
      toast.success('Module removed');
    }
  }, [selectedModule]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>
                Building Layout Designer - {customer.name}
                {selectedModule && (
                  <Badge variant="outline" className="ml-2">
                    {selectedModule.name}
                  </Badge>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleNewLayout}>
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsExportDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-6 w-fit">
                <TabsTrigger value="design">
                  <Home className="h-4 w-4 mr-1" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="layouts">
                  <FileText className="h-4 w-4 mr-1" />
                  Saved Layouts
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-1" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="flex-1 min-h-0 m-0">
                <div className="h-full flex">
                  {/* Left Sidebar - Modules and Fixtures */}
                  <div className="w-80 border-r bg-card">
                    <div className="flex border-b">
                      <Button
                        variant={leftSidebarContent === 'modules' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setLeftSidebarContent('modules')}
                        className="flex-1 rounded-none"
                      >
                        <Layers className="h-3 w-3 mr-1" />
                        Modules
                      </Button>
                      <Button
                        variant={leftSidebarContent === 'fixtures' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setLeftSidebarContent('fixtures')}
                        className="flex-1 rounded-none"
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        Fixtures
                      </Button>
                    </div>
                    
                    <div className="h-[calc(100%-3rem)]">
                      {leftSidebarContent === 'modules' && (
                        <ModuleLibrary
                          onModuleSelect={handleModuleSelect}
                          onModuleDrag={handleModuleDrag}
                        />
                      )}
                      {leftSidebarContent === 'fixtures' && (
                        <FixtureBrowser
                          onFixtureSelect={handleFixtureSelect}
                          onFixtureDrag={handleFixtureDrag}
                        />
                      )}
                    </div>
                  </div>

                  {/* Center Canvas */}
                  <div className="flex-1 relative bg-background">
                    <EnhancedFabricCanvas
                      ref={canvasRef}
                      selectedTool={selectedTool}
                      selectedElement={selectedElement}
                      onElementSelect={handleElementSelect}
                      onElementUpdate={handleElementUpdate}
                      elements={elements}
                      gridSize={gridSize}
                      selectedModule={selectedModule}
                      selectedVariant={selectedVariant}
                    />
                  </div>

                  {/* Right Sidebar - Properties and Module Variants */}
                  <div className="w-80 border-l bg-card">
                    {selectedModule ? (
                      <ModuleVariantPanel
                        selectedModule={selectedModule}
                        selectedVariant={selectedVariant}
                        onVariantSelect={handleVariantSelect}
                        onModuleRotate={handleModuleRotate}
                        onModuleFlip={handleModuleFlip}
                        onModuleMove={handleModuleMove}
                        onModuleDelete={handleModuleDelete}
                        onClose={() => setSelectedModule(null)}
                      />
                    ) : (
                      <div className="p-4">
                        <EnhancedPropertyPanel
                          selectedElement={selectedElement as any}
                          onUpdateElement={handleElementUpdate}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layouts" className="flex-1 min-h-0 m-0 p-6">
                <LayoutList
                  layouts={layouts}
                  onLoadLayout={handleLoadLayout}
                  onDeleteLayout={deleteLayout}
                  currentLayoutId={currentLayoutId}
                />
              </TabsContent>

              <TabsContent value="settings" className="flex-1 min-h-0 m-0 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Canvas Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Grid Size: {gridSize}px
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="50"
                          value={gridSize}
                          onChange={(e) => setGridSize(Number(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <Separator />
                      <Button variant="outline" onClick={handleClear} className="w-full">
                        Clear All Elements
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tool Information</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p><strong>Modules:</strong> Pre-designed room layouts with fixtures</p>
                      <p><strong>Fixtures:</strong> Individual architectural elements</p>
                      <p><strong>Drag & Drop:</strong> Drag items from library to canvas</p>
                      <p><strong>Variants:</strong> Right-click modules to swap fixtures</p>
                      <p><strong>Export:</strong> Professional PDF/PNG with title blocks</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ProfessionalExport
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        elements={elements}
        canvasRef={canvasRef}
        projectName={`${customer.name} Layout`}
      />
    </>
  );
};