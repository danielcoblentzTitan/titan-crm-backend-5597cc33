import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Upload, 
  Download,
  Folder,
  Package
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pricingService, PricingCategory, PricingItemWithCategory } from "@/services/pricingService";

interface PricingManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingManager = ({ isOpen, onClose }: PricingManagerProps) => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [items, setItems] = useState<PricingItemWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingItem, setEditingItem] = useState<PricingItemWithCategory | null>(null);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    unit_type: "each",
    base_price: 0,
    category_id: ""
  });
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        pricingService.getCategories(),
        pricingService.getItems()
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pricing data",
        variant: "destructive"
      });
    }
  };

  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category_id === selectedCategory);

  const handlePriceChange = (itemId: string, newPrice: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, base_price: newPrice } : item
    ));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      const updates = items.map(item => ({
        id: item.id,
        base_price: item.base_price
      }));
      
      await pricingService.bulkUpdatePrices(updates);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Pricing updates saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save pricing updates",
        variant: "destructive"
      });
    }
  };

  const createCategory = async () => {
    try {
      const category = await pricingService.createCategory({
        ...newCategory,
        sort_order: categories.length
      });
      setCategories(prev => [...prev, category]);
      setNewCategory({ name: "", description: "" });
      setShowNewCategoryDialog(false);
      toast({
        title: "Success",
        description: "Category created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };

  const createItem = async () => {
    try {
      const item = await pricingService.createItem({
        ...newItem,
        sort_order: items.length,
        is_active: true
      });
      
      // Reload data to get the category relationship
      await loadData();
      setNewItem({
        name: "",
        description: "",
        unit_type: "each",
        base_price: 0,
        category_id: ""
      });
      setShowNewItemDialog(false);
      toast({
        title: "Success",
        description: "Item created successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      await pricingService.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const exportPricing = () => {
    const csvContent = [
      ["Category", "Item", "Unit Type", "Base Price"],
      ...items.map(item => [
        item.category?.name || "",
        item.name,
        item.unit_type,
        item.base_price.toString()
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pricing-sheet.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Master Pricing Sheet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="category-filter">Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Folder className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category-name">Category Name</Label>
                      <Input
                        id="category-name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category-description">Description</Label>
                      <Input
                        id="category-description"
                        value={newCategory.description}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter description (optional)"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewCategoryDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createCategory} disabled={!newCategory.name}>
                        Create Category
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Package className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="item-category">Category</Label>
                      <Select value={newItem.category_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, category_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="item-name">Item Name</Label>
                      <Input
                        id="item-name"
                        value={newItem.name}
                        onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter item name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="item-unit">Unit Type</Label>
                        <Select value={newItem.unit_type} onValueChange={(value) => setNewItem(prev => ({ ...prev, unit_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sq ft">Square Foot</SelectItem>
                            <SelectItem value="roof sq ft">Roof Sq Ft</SelectItem>
                            <SelectItem value="wall sq ft">Wall Sq Ft</SelectItem>
                            <SelectItem value="linear ft">Linear Foot</SelectItem>
                            <SelectItem value="cubic yard">Cubic Yard</SelectItem>
                            <SelectItem value="board ft">Board Foot</SelectItem>
                            <SelectItem value="each">Each</SelectItem>
                            <SelectItem value="hour">Hour</SelectItem>
                            <SelectItem value="day">Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="item-price">Base Price</Label>
                        <Input
                          id="item-price"
                          type="number"
                          step="0.01"
                          value={newItem.base_price}
                          onChange={(e) => setNewItem(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewItemDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createItem} disabled={!newItem.name || !newItem.category_id}>
                        Create Item
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={exportPricing}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>

              {hasChanges && (
                <Button onClick={saveChanges} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedCategory === "all" ? "All Items" : categories.find(c => c.id === selectedCategory)?.name || "Items"}
                <span className="text-sm text-muted-foreground ml-2">({filteredItems.length} items)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-3">Category</div>
                  <div className="col-span-4">Item Name</div>
                  <div className="col-span-2">Unit Type</div>
                  <div className="col-span-2">Base Price</div>
                  <div className="col-span-1">Actions</div>
                </div>

                {filteredItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-2 border-b border-border/50">
                    <div className="col-span-3 text-sm">
                      <span className="inline-block px-2 py-1 bg-muted rounded text-xs">
                        {item.category?.name}
                      </span>
                    </div>
                    <div className="col-span-4">
                      <span className="font-medium">{item.name}</span>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {item.unit_type}
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <span className="text-sm mr-1">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.base_price}
                          onChange={(e) => handlePriceChange(item.id, Number(e.target.value))}
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No items found. Create some items to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingManager;