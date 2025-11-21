import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SelectionItemCard } from "@/components/dashboard/SelectionItemCard";
import { AddSelectionDialog } from "@/components/dashboard/AddSelectionDialog";
import { getTemplateForRoomType, createSelectionItemsFromTemplate } from "@/utils/selectionTemplates";
import { toast as sonnerToast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Room {
  id: string;
  room_name: string;
  room_type: string;
  length_ft: number;
  width_ft: number;
  ceiling_height_ft: number;
  notes_general: string;
}

interface SelectionItem {
  id: string;
  label: string;
  description?: string;
  material_type?: string;
  brand?: string;
  model_or_sku?: string;
  color_name?: string;
  finish?: string;
  quantity?: number;
  unit?: string;
  unit_cost_allowance?: number;
  total_cost_allowance?: number;
  is_upgrade?: boolean;
  upgrade_cost?: number;
  notes_for_sub?: string;
  image_url?: string;
  trade?: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  trade: string;
}

export default function RoomSelectionsPage() {
  const { projectId, roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectionsByCategory, setSelectionsByCategory] = useState<Record<string, SelectionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SelectionItem | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId, roomId]);

  const loadData = async () => {
    try {
      // Load room details
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("selection_categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load selections
      const { data: selectionsData, error: selectionsError } = await supabase
        .from("selection_items")
        .select("*")
        .eq("room_id", roomId);

      if (selectionsError) throw selectionsError;

      // Group by category
      const grouped = (selectionsData || []).reduce((acc, item) => {
        if (!acc[item.category_id]) {
          acc[item.category_id] = [];
        }
        acc[item.category_id].push(item);
        return acc;
      }, {} as Record<string, SelectionItem[]>);

      setSelectionsByCategory(grouped);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load room data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSelection = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setEditingItem(null);
    setShowAddDialog(true);
  };

  const handleEditSelection = (item: SelectionItem) => {
    setSelectedCategoryId(item.category_id);
    setEditingItem(item);
    setShowAddDialog(true);
  };

  const handleDeleteSelection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this selection?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("selection_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Selection deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error("Error deleting selection:", error);
      toast({
        title: "Error",
        description: "Failed to delete selection",
        variant: "destructive",
      });
    }
  };

  const handleAddTemplateItems = async () => {
    if (!room || !categories) return;

    setIsAddingTemplate(true);
    try {
      const categoryMap = categories.reduce((acc: Record<string, string>, cat: any) => {
        acc[cat.name] = cat.id;
        return acc;
      }, {});

      const templateItems = createSelectionItemsFromTemplate(
        projectId!,
        roomId!,
        room.room_type,
        categoryMap
      );

      const { error } = await supabase
        .from("selection_items")
        .insert(templateItems as any[]);

      if (error) throw error;

      sonnerToast.success("Standard items added successfully");
      loadData();
    } catch (error) {
      console.error("Error adding template items:", error);
      sonnerToast.error("Failed to add standard items");
    } finally {
      setIsAddingTemplate(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">Room not found</p>
            <Button onClick={() => navigate(`/project/${projectId}`)}>
              Back to Project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasTemplateItems = getTemplateForRoomType(room.room_type).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/project/${projectId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{room.room_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {room.room_type && `${room.room_type} • `}
                  {room.length_ft && room.width_ft && 
                    `${room.length_ft}' × ${room.width_ft}' • `}
                  {room.ceiling_height_ft && `${room.ceiling_height_ft}' ceiling`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {hasTemplateItems && (
                <Button
                  variant="outline"
                  onClick={handleAddTemplateItems}
                  disabled={isAddingTemplate}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Add Standard Items
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {room.notes_general && (
          <Card>
            <CardHeader>
              <CardTitle>Room Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{room.notes_general}</p>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">Selections by Category</h2>
          
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">No categories available</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-4">
              {categories.map((category) => {
                const items = selectionsByCategory[category.id] || [];
                return (
                  <AccordionItem key={category.id} value={category.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{category.name}</h3>
                          <span className="text-xs text-muted-foreground">({category.trade})</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {items.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No selections in this category yet
                          </p>
                        ) : (
                          items.map((item) => (
                            <SelectionItemCard
                              key={item.id}
                              item={item}
                              onEdit={handleEditSelection}
                              onDelete={handleDeleteSelection}
                            />
                          ))
                        )}
                        <Button
                          onClick={() => handleAddSelection(category.id)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add {category.name} Selection
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        <AddSelectionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          projectId={projectId!}
          roomId={roomId!}
          categoryId={selectedCategoryId || undefined}
          editingItem={editingItem || undefined}
          onSuccess={loadData}
        />
      </main>
    </div>
  );
}
