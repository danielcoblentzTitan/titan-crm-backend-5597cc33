import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { pricingService, PricingCategory, PricingItemWithCategory } from "@/services/pricingService";
import { useAuth } from "@/contexts/AuthContext";

export const useMasterPricing = () => {
  const [categories, setCategories] = useState<PricingCategory[]>([]);
  const [items, setItems] = useState<PricingItemWithCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
  const [loading, setLoading] = useState(true);
  const [buildingDimensions, setBuildingDimensions] = useState<{
    width: number;
    length: number;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Check if user is authorized (builder role only)
  useEffect(() => {
    console.log('Profile state:', profile);
    
    if (profile === null) {
      // Profile is loading, don't do anything yet
      console.log('Profile is still loading...');
      return;
    }
    
    if (profile === undefined) {
      // No profile found, redirect to dashboard
      console.log('No profile found, redirecting...');
      navigate('/dashboard');
      return;
    }
    
    if (profile && profile.role !== 'builder') {
      console.log('User role is not builder:', profile.role);
      toast({
        title: "Access Denied",
        description: "This page is only accessible to builders.",
        variant: "destructive"
      });
      navigate('/dashboard');
      return;
    }
    
    // If we have a profile and the role is builder, load the data
    if (profile && profile.role === 'builder') {
      console.log('User is builder, loading data...');
      loadData();
    }
  }, [profile, navigate, toast]);

  const loadData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === "all" 
    ? items 
    : items.filter(item => item.category_id === selectedCategory);

  // Group items by category ID for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(item);
    return acc;
  }, {} as Record<string, PricingItemWithCategory[]>);

  const handlePriceChange = (itemId: string, newPrice: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, base_price: newPrice } : item
    ));
    setHasChanges(true);
  };

  const handleItemNameChange = (itemId: string, newName: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, name: newName } : item
    ));
    setHasChanges(true);
  };

  const handleUnitTypeChange = (itemId: string, newUnitType: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, unit_type: newUnitType } : item
    ));
    setHasChanges(true);
  };

  const handleCategoryNameChange = (categoryId: string, newName: string) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId ? { ...category, name: newName } : category
    ));
    setItems(prev => prev.map(item => 
      item.category_id === categoryId ? { ...item, category: { ...item.category!, name: newName } } : item
    ));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      // Save category changes
      for (const category of categories) {
        await pricingService.updateCategory(category.id, {
          name: category.name
        });
      }
      
      // Save item changes
      for (const item of items) {
        await pricingService.updateItem(item.id, {
          name: item.name,
          base_price: item.base_price
        });
      }
      
      setHasChanges(false);
      toast({
        title: "Success",
        description: "All changes saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save changes",
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

  const deleteCategory = async (categoryId: string) => {
    try {
      await pricingService.deleteCategory(categoryId);
      setCategories(prev => prev.filter(category => category.id !== categoryId));
      setItems(prev => prev.filter(item => item.category_id !== categoryId));
      toast({
        title: "Success",
        description: "Category deleted successfully"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete category";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const reorderCategories = async (activeId: string, overId: string) => {
    const oldIndex = categories.findIndex(cat => cat.id === activeId);
    const newIndex = categories.findIndex(cat => cat.id === overId);
    
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Create new array with reordered categories
    const reorderedCategories = [...categories];
    const [movedCategory] = reorderedCategories.splice(oldIndex, 1);
    reorderedCategories.splice(newIndex, 0, movedCategory);

    // Calculate new sort_order values
    const updates = reorderedCategories.map((category, index) => ({
      id: category.id,
      sort_order: index * 10 // Use increments of 10 for future insertions
    }));

    // Optimistic update
    const updatedCategories = reorderedCategories.map((category, index) => ({
      ...category,
      sort_order: index * 10
    }));
    setCategories(updatedCategories);

    try {
      await pricingService.bulkUpdateCategorySortOrder(updates);
      toast({
        title: "Success",
        description: "Category order updated successfully"
      });
    } catch (error) {
      // Revert on error
      setCategories(categories);
      toast({
        title: "Error",
        description: "Failed to update category order",
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
    link.download = "master-pricing-sheet.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateBasePriceItem = async (pricePerSqFt: number, dimensions: any) => {
    try {
      // Store building dimensions for Greenpost calculations
      setBuildingDimensions({
        width: dimensions.width,
        length: dimensions.length
      });

      // Find the Structural category, or create it
      let structuralCategory = categories.find(cat => cat.name === "Structural");
      
      if (!structuralCategory) {
        structuralCategory = await pricingService.createCategory({
          name: "Structural",
          description: "Base building structure and shell",
          sort_order: 0
        });
        setCategories(prev => [structuralCategory!, ...prev]);
      }

      // Create the building base price item
      const itemName = `Building Shell (${dimensions.length}' × ${dimensions.width}' × ${dimensions.height}' @ ${dimensions.pitch}:12)`;
      
      await pricingService.createItem({
        category_id: structuralCategory.id,
        name: itemName,
        description: `Base building price calculated using custom formula for ${dimensions.length}×${dimensions.width}×${dimensions.height} building with ${dimensions.pitch}:12 pitch`,
        unit_type: "sq ft",
        base_price: pricePerSqFt,
        is_active: true,
        sort_order: 0
      });

      // Reload data to show the new item
      await loadData();
      
      toast({
        title: "Base Price Added",
        description: `${itemName} added at $${pricePerSqFt.toFixed(2)}/sq ft. Building dimensions saved for Greenpost calculations.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add base price item",
        variant: "destructive"
      });
    }
  };

  const handleAddToMechanicals = async (itemName: string, price: number) => {
    try {
      // Find or create the Mechanicals category
      let mechanicalsCategory = categories.find(cat => cat.name === "Mechanicals");
      
      if (!mechanicalsCategory) {
        mechanicalsCategory = await pricingService.createCategory({
          name: "Mechanicals",
          description: "Plumbing, HVAC, and electrical systems",
          sort_order: 50
        });
        setCategories(prev => [...prev, mechanicalsCategory!]);
      }

      // Look for existing "Plumbing" item in Mechanicals category
      const existingPlumbingItem = items.find(item => 
        item.category_id === mechanicalsCategory!.id && 
        (item.name.toLowerCase().includes('plumbing') || item.name === 'Plumbing')
      );

      if (existingPlumbingItem) {
        // Update existing plumbing item
        await pricingService.updateItem(existingPlumbingItem.id, {
          base_price: price,
          name: "Plumbing"
        });
        
        // Update local state
        setItems(prev => prev.map(item => 
          item.id === existingPlumbingItem.id 
            ? { ...item, base_price: price, name: "Plumbing" }
            : item
        ));
        
        toast({
          title: "Plumbing Updated",
          description: `Plumbing item updated to $${price.toLocaleString()}`,
        });
      } else {
        // Create new plumbing item
        await pricingService.createItem({
          category_id: mechanicalsCategory.id,
          name: "Plumbing",
          description: "Generated from plumbing calculator",
          unit_type: "package",
          base_price: price,
          is_active: true,
          sort_order: items.length
        });

        // Reload data to show the new item
        await loadData();
        
        toast({
          title: "Plumbing Added",
          description: `Plumbing item added to Mechanicals category at $${price.toLocaleString()}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add/update plumbing in Mechanicals",
        variant: "destructive"
      });
    }
  };

  const moveGarageDoorsToBottom = async () => {
    try {
      const garageDoorCategory = categories.find(cat => cat.name === "Garage Doors");
      
      if (garageDoorCategory) {
        // Set garage doors sort_order to be much higher
        await pricingService.updateCategory(garageDoorCategory.id, {
          sort_order: 100
        });
        
        // Reload data to reflect the new order
        await loadData();
        
        toast({
          title: "Category Moved",
          description: "Garage Doors moved to bottom of list",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder categories",
        variant: "destructive"
      });
    }
  };

  // Auto-move garage doors to bottom on load if needed
  useEffect(() => {
    if (categories.length > 0) {
      const garageDoorCategory = categories.find(cat => cat.name === "Garage Doors");
      
      if (garageDoorCategory && garageDoorCategory.sort_order !== 100) {
        moveGarageDoorsToBottom();
      }
    }
  }, [categories.length]);

  return {
    // State
    categories,
    items,
    selectedCategory,
    newCategory,
    newItem,
    showNewCategoryDialog,
    showNewItemDialog,
    hasChanges,
    loading,
    filteredItems,
    groupedItems,
    buildingDimensions,
    
    // Setters
    setSelectedCategory,
    setNewCategory,
    setNewItem,
    setShowNewCategoryDialog,
    setShowNewItemDialog,
    
    // Actions
    handlePriceChange,
    handleItemNameChange,
    handleUnitTypeChange,
    handleCategoryNameChange,
    saveChanges,
    createCategory,
    createItem,
    deleteItem,
    deleteCategory,
    reorderCategories,
    exportPricing,
    handleCreateBasePriceItem,
    handleAddToMechanicals,
    loadData
  };
};