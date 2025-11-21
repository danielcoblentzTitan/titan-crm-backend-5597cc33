import { Edit2, Trash2, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  uses_master_default?: boolean;
  is_overridden?: boolean;
  master_field_name?: string;
  product_id?: string;
  product_type?: string;
}

interface SelectionItemCardProps {
  item: SelectionItem;
  onEdit: (item: SelectionItem) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export function SelectionItemCard({ item, onEdit, onDelete, onRefresh }: SelectionItemCardProps) {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetToDefault = async () => {
    setIsResetting(true);
    try {
      const { error } = await supabase
        .from('selection_items')
        .update({
          is_overridden: false,
          override_reason: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Selection reset to master default"
      });

      onRefresh?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset selection",
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${
      item.uses_master_default && !item.is_overridden ? 'border-primary/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{item.label}</h4>
              {item.uses_master_default && !item.is_overridden && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  <Shield className="h-3 w-3 mr-1" />
                  Master Default
                </Badge>
              )}
              {item.is_overridden && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  Custom Selection
                </Badge>
              )}
              {item.is_upgrade && (
                <Badge variant="secondary">Upgrade</Badge>
              )}
              {item.trade && (
                <Badge variant="outline">{item.trade}</Badge>
              )}
            </div>
            
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {item.material_type && (
                <div>
                  <span className="text-muted-foreground">Material:</span>{" "}
                  <span className="font-medium">{item.material_type}</span>
                </div>
              )}
              {item.brand && (
                <div>
                  <span className="text-muted-foreground">Brand:</span>{" "}
                  <span className="font-medium">{item.brand}</span>
                </div>
              )}
              {item.model_or_sku && (
                <div>
                  <span className="text-muted-foreground">SKU:</span>{" "}
                  <span className="font-medium">{item.model_or_sku}</span>
                </div>
              )}
              {item.color_name && (
                <div>
                  <span className="text-muted-foreground">Color:</span>{" "}
                  <span className="font-medium">{item.color_name}</span>
                </div>
              )}
              {item.finish && (
                <div>
                  <span className="text-muted-foreground">Finish:</span>{" "}
                  <span className="font-medium">{item.finish}</span>
                </div>
              )}
              {item.quantity && (
                <div>
                  <span className="text-muted-foreground">Quantity:</span>{" "}
                  <span className="font-medium">
                    {item.quantity} {item.unit || ""}
                  </span>
                </div>
              )}
              {item.total_cost_allowance && (
                <div>
                  <span className="text-muted-foreground">Cost:</span>{" "}
                  <span className="font-medium">
                    ${item.total_cost_allowance.toFixed(2)}
                  </span>
                </div>
              )}
              {item.is_upgrade && item.upgrade_cost && (
                <div>
                  <span className="text-muted-foreground">Upgrade Cost:</span>{" "}
                  <span className="font-medium text-orange-600">
                    +${item.upgrade_cost.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
            
            {item.notes_for_sub && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Notes for Sub:</span> {item.notes_for_sub}
                </p>
              </div>
            )}
          </div>
          
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.label}
              className="w-20 h-20 object-cover rounded"
            />
          )}
        </div>
        
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(item)}
          >
            <Edit2 className="h-3 w-3 mr-1" />
            {item.uses_master_default && !item.is_overridden ? 'Override' : 'Edit'}
          </Button>
          
          {item.uses_master_default && item.is_overridden && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetToDefault}
              disabled={isResetting}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
              Reset to Default
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
