import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Download, Plus, List } from 'lucide-react';
import { EnhancedFabricCanvas, FabricCanvasRef } from './FabricCanvas';
import { EnhancedToolPalette } from './EnhancedToolPalette';
import { EnhancedPropertyPanel } from './EnhancedPropertyPanel';
import { LayoutList } from './LayoutList';
import { ExportDialog } from './ExportDialog';
import { useLayoutPersistence } from './hooks/useLayoutPersistence';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/services/supabaseService';

interface BuildingLayoutDesignerProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

interface ArchitecturalElement {
  id: string;
  type: 'wall' | 'door' | 'window' | 'room' | 'dimension';
  properties: Record<string, any>;
}

export const BuildingLayoutDesigner: React.FC<BuildingLayoutDesignerProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedElement, setSelectedElement] = useState<ArchitecturalElement | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);
  const [elements, setElements] = useState<ArchitecturalElement[]>([]);
  const [gridSize, setGridSize] = useState(20);
  const canvasRef = React.useRef<FabricCanvasRef>(null);

  const {
    layouts,
    saveLayout,
    loadLayout,
    deleteLayout,
    isSaving,
    loadLayouts,
  } = useLayoutPersistence(customer.id);

  const handleSave = useCallback(async () => {
    if (!elements.length) {
      toast({
        title: "Nothing to save",
        description: "Add some elements to the layout first.",
        variant: "destructive",
      });
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
      toast({
        title: "Layout saved",
        description: "Your building layout has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the layout. Please try again.",
        variant: "destructive",
      });
    }
  }, [elements, saveLayout, customer.name, toast]);

  const handleLoadLayout = useCallback(async (layoutId: string) => {
    try {
      const layout = await loadLayout(layoutId);
      if (layout) {
        setCurrentLayoutId(layoutId);
        toast({
          title: "Layout loaded",
          description: "Layout loaded successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Load failed",
        description: "Failed to load the layout.",
        variant: "destructive",
      });
    }
  }, [loadLayout, toast]);

  const handleNewLayout = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setElements([]);
    setCurrentLayoutId(null);
    setSelectedElement(null);
    toast({
      title: "New layout",
      description: "Started a new blank layout.",
    });
  }, [toast]);

  const handleElementSelect = useCallback((element: ArchitecturalElement | null) => {
    setSelectedElement(element);
  }, []);

  const handleElementUpdate = useCallback((id: string, updates: Partial<ArchitecturalElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el));
  }, []);

  const handleClear = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.clear();
    }
    setElements([]);
    setSelectedElement(null);
    toast({
      title: "Canvas cleared",
      description: "All elements have been removed.",
    });
  }, [toast]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle>Building Layout Designer - {customer.name}</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewLayout}
                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExportDialogOpen(true)}
                  className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 min-h-0">
            <Tabs defaultValue="design" className="h-full flex flex-col">
              <TabsList className="mx-6 w-fit">
                <TabsTrigger value="design" className="flex items-center gap-2">
                  Design
                </TabsTrigger>
                <TabsTrigger value="layouts" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Saved Layouts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="flex-1 min-h-0 m-0">
                <div className="h-full flex">
                  {/* Tool Palette */}
                  <div className="w-64 border-r bg-card p-4">
                    <EnhancedToolPalette
                      selectedTool={selectedTool}
                      onToolSelect={setSelectedTool}
                      gridSize={gridSize}
                      onGridSizeChange={setGridSize}
                      onClear={handleClear}
                      selectedElement={selectedElement}
                    />
                  </div>

                  {/* Canvas */}
                  <div className="flex-1 relative bg-background">
                    <EnhancedFabricCanvas
                      ref={canvasRef}
                      elements={elements}
                      selectedTool={selectedTool}
                      selectedElement={selectedElement}
                      onElementSelect={handleElementSelect}
                      onElementUpdate={handleElementUpdate}
                      gridSize={gridSize}
                    />
                  </div>

                  {/* Property Panel */}
                  <div className="w-64 border-l bg-card p-4">
                    <EnhancedPropertyPanel
                      selectedElement={selectedElement}
                      onUpdateElement={handleElementUpdate}
                    />
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
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        elements={elements}
        canvasRef={canvasRef}
        customerName={customer.name}
      />
    </>
  );
};