
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import BuildingPriceCalculator from "@/components/BuildingPriceCalculator";
import { MasterPricingHeader } from "@/components/master-pricing/MasterPricingHeader";
import { MasterPricingControls } from "@/components/master-pricing/MasterPricingControls";
import { MasterPricingStats } from "@/components/master-pricing/MasterPricingStats";
import { MasterPricingTable } from "@/components/master-pricing/MasterPricingTable";
import { CreateCategoryDialog } from "@/components/master-pricing/CreateCategoryDialog";
import { CreateItemDialog } from "@/components/master-pricing/CreateItemDialog";
import { BarndoRatesSettings } from "@/components/master-pricing/BarndoRatesSettings";
import { useMasterPricing } from "@/hooks/useMasterPricing";
import { useAuth } from "@/contexts/AuthContext";

const MasterPricing = () => {
  const { profile } = useAuth();
  const {
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
    setSelectedCategory,
    setNewCategory,
    setNewItem,
    setShowNewCategoryDialog,
    setShowNewItemDialog,
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
    handleAddToMechanicals
  } = useMasterPricing();

  const { toast } = useToast();

  // Debug information display
  if (profile === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-2">Loading user profile...</p>
          <div className="animate-pulse bg-gray-200 h-4 w-32 mx-auto rounded"></div>
        </div>
      </div>
    );
  }

  if (profile === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-red-600 mb-2">No profile found</p>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'builder') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-red-600 mb-2">Access Denied</p>
          <p className="text-gray-600 mb-4">This page is only accessible to builders.</p>
          <p className="text-sm text-gray-500">Your role: {profile.role || 'No role set'}</p>
          <p className="text-sm text-gray-500">Profile ID: {profile.id}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-600 mb-2">Loading master pricing...</p>
          <p className="text-sm text-gray-500">User role: {profile.role}</p>
          <div className="animate-pulse bg-gray-200 h-4 w-48 mx-auto rounded mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MasterPricingHeader hasChanges={hasChanges} onSaveChanges={saveChanges} />

      <div className="container mx-auto px-4 py-8">
        <MasterPricingControls
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          onAddCategory={() => setShowNewCategoryDialog(true)}
          onAddItem={() => setShowNewItemDialog(true)}
          onExport={exportPricing}
          onAddToMechanicals={handleAddToMechanicals}
        />

        <CreateCategoryDialog
          open={showNewCategoryDialog}
          onOpenChange={setShowNewCategoryDialog}
          newCategory={newCategory}
          onCategoryChange={setNewCategory}
          onCreateCategory={createCategory}
        />

        <CreateItemDialog
          open={showNewItemDialog}
          onOpenChange={setShowNewItemDialog}
          newItem={newItem}
          onItemChange={setNewItem}
          onCreateItem={createItem}
          categories={categories}
        />

        <Separator className="mb-6" />

        <BuildingPriceCalculator 
          onPriceCalculated={(pricePerSqFt, totalSqFt, dimensions) => {
            toast({
              title: "Base Price Calculated",
              description: `${dimensions.length}' × ${dimensions.width}' building: $${pricePerSqFt.toFixed(2)}/sq ft`,
            });
          }}
          onCreateBasePriceItem={handleCreateBasePriceItem}
        />

        <div className="my-8">
          <Separator />
        </div>

        <BarndoRatesSettings />

        <div className="my-8">
          <Separator />
        </div>

        <MasterPricingStats categories={categories} items={items} />

        <MasterPricingTable
          selectedCategory={selectedCategory}
          categories={categories}
          filteredItems={filteredItems}
          groupedItems={groupedItems}
          onCategoryNameChange={handleCategoryNameChange}
          onItemNameChange={handleItemNameChange}
          onPriceChange={handlePriceChange}
          onUnitTypeChange={handleUnitTypeChange}
          onDeleteItem={deleteItem}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
          buildingDimensions={buildingDimensions}
        />
      </div>
    </div>
  );
};

export default MasterPricing;
