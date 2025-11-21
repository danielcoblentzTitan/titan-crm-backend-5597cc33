
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Plus, Trash2, Save, Settings } from "lucide-react";
import { Project } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { pricingService, PricingItemWithCategory } from "@/services/pricingService";
import PricingManager from "./PricingManager";

interface EstimateItem {
  id: string;
  name: string;
  unitCost: number;
  quantity: number;
  total: number;
}

interface DoorWindowSelection {
  id: string;
  name: string;
  category: string;
  unitCost: number;
  quantity: number;
}

interface EstimatingToolProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (estimate: any) => void;
}


const EstimatingTool = ({ project, isOpen, onClose, onSave }: EstimatingToolProps) => {
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [marginPercentage, setMarginPercentage] = useState(20);
  const [pricingItems, setPricingItems] = useState<PricingItemWithCategory[]>([]);
  const [doorWindowSelections, setDoorWindowSelections] = useState<DoorWindowSelection[]>([]);
  const [showPricingManager, setShowPricingManager] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadPricingData();
    }
  }, [isOpen]);

  const loadPricingData = async () => {
    try {
      const pricingData = await pricingService.getItems();
      setPricingItems(pricingData);
      
      // Initialize door/window selections if empty
      if (doorWindowSelections.length === 0) {
        const doorWindowItems = pricingData
          .filter(item => ['Entry Doors', 'Garage Doors', 'Windows'].includes(item.category.name))
          .map(item => ({
            id: item.id,
            name: item.name,
            category: item.category.name,
            unitCost: item.base_price,
            quantity: 0
          }));
        setDoorWindowSelections(doorWindowItems);
      }
      
      // Initialize items with pricing data if empty
      if (items.length === 0) {
        const estimateItems = pricingData.map((item, index) => ({
          id: `item-${index}`,
          name: `${item.name} (${item.unit_type})`,
          unitCost: item.base_price,
          quantity: 0,
          total: 0
        }));
        setItems(estimateItems);
      }
    } catch (error) {
      console.error('Error loading pricing data:', error);
      toast({
        title: "Warning",
        description: "Could not load pricing data. Using default values.",
        variant: "destructive"
      });
    }
  };

  const updateItem = (id: string, field: keyof EstimateItem, value: number | string) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'unitCost' || field === 'quantity') {
            updatedItem.total = Number(updatedItem.unitCost) * Number(updatedItem.quantity);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const addPricingItem = (pricingItemId: string) => {
    const pricingItem = pricingItems.find(item => item.id === pricingItemId);
    if (!pricingItem) return;

    const newItem: EstimateItem = {
      id: `pricing-${Date.now()}`,
      name: `${pricingItem.name} (${pricingItem.unit_type})`,
      unitCost: pricingItem.base_price,
      quantity: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const addCustomItem = () => {
    const newItem: EstimateItem = {
      id: `custom-${Date.now()}`,
      name: "Custom Item",
      unitCost: 0,
      quantity: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateDoorWindowQuantity = (id: string, quantity: number) => {
    setDoorWindowSelections(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const addSelectedDoorsWindows = () => {
    const selectedItems = doorWindowSelections.filter(item => item.quantity > 0);
    const newEstimateItems = selectedItems.map(item => ({
      id: `dw-${item.id}-${Date.now()}`,
      name: `${item.name} (${item.category})`,
      unitCost: item.unitCost,
      quantity: item.quantity,
      total: item.unitCost * item.quantity
    }));
    
    setItems(prev => [...prev, ...newEstimateItems]);
    
    // Reset quantities after adding
    setDoorWindowSelections(prev => 
      prev.map(item => ({ ...item, quantity: 0 }))
    );

    toast({
      title: "Items Added",
      description: `Added ${selectedItems.length} door/window items to estimate.`,
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateMargin = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (marginPercentage / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateMargin();
  };

  const handleSave = () => {
    const estimate = {
      projectId: project.id,
      projectName: project.name,
      items,
      subtotal: calculateSubtotal(),
      marginPercentage,
      marginAmount: calculateMargin(),
      total: calculateTotal(),
      createdAt: new Date().toISOString()
    };

    if (onSave) {
      onSave(estimate);
    }

    toast({
      title: "Estimate Saved",
      description: `Estimate for ${project.name} has been saved.`,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Project Estimate - {project.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Door & Window Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Select Doors & Windows</CardTitle>
                <Button 
                  onClick={addSelectedDoorsWindows}
                  disabled={doorWindowSelections.filter(item => item.quantity > 0).length === 0}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Selected to Estimate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['Entry Doors', 'Garage Doors', 'Windows'].map(category => {
                  const categoryItems = doorWindowSelections.filter(item => item.category === category);
                  
                  return (
                    <div key={category} className="space-y-3">
                      <h4 className="font-semibold text-base border-b pb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryItems.map(item => (
                          <div key={item.id} className="border rounded-lg p-3 space-y-2">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">${item.unitCost.toFixed(2)} each</div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`qty-${item.id}`} className="text-xs">Qty:</Label>
                              <Input
                                id={`qty-${item.id}`}
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateDoorWindowQuantity(item.id, Number(e.target.value))}
                                className="w-16 h-8 text-sm"
                                min="0"
                                step="1"
                              />
                            </div>
                            {item.quantity > 0 && (
                              <div className="text-sm font-medium text-blue-600">
                                Total: ${(item.unitCost * item.quantity).toFixed(2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Estimate Items</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={addPricingItem}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add from pricing" />
                    </SelectTrigger>
                    <SelectContent>
                      {pricingItems.map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} - ${item.base_price.toFixed(2)} ({item.unit_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Custom
                  </Button>
                  <Button onClick={() => setShowPricingManager(true)} size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Pricing
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 border-b pb-2">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2">Unit Cost</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1">Action</div>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.id, 'unitCost', Number(e.target.value))}
                        className="text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="text-sm"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="text-sm font-medium px-3 py-2">
                        ${item.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals and Margin */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span>Subtotal (Cost):</span>
                <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="margin" className="text-sm font-medium">
                  Profit Margin Percentage
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="margin"
                    type="number"
                    value={marginPercentage}
                    onChange={(e) => setMarginPercentage(Number(e.target.value))}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Profit Margin:</span>
                <span className="font-semibold text-green-600">
                  ${calculateMargin().toFixed(2)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Project Price:</span>
                <span className="text-blue-600">${calculateTotal().toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Estimate
            </Button>
          </div>
        </div>

        <PricingManager 
          isOpen={showPricingManager} 
          onClose={() => {
            setShowPricingManager(false);
            loadPricingData(); // Reload pricing data when pricing manager closes
          }} 
        />
      </DialogContent>
    </Dialog>
  );
};

export default EstimatingTool;
