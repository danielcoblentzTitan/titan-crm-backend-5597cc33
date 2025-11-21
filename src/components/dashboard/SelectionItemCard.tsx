import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

interface SelectionItem {
  id: string;
  label: string;
  description: string;
  brand: string;
  model_or_sku: string;
  color_name: string;
  finish: string;
  material_type: string;
  quantity: number;
  unit: string;
  unit_cost_allowance: number;
  total_cost_allowance: number;
  image_url: string;
  trade: string;
  is_upgrade: boolean;
  upgrade_cost: number;
}

interface SelectionItemCardProps {
  selection: SelectionItem;
  onUpdate: () => void;
}

export const SelectionItemCard: React.FC<SelectionItemCardProps> = ({ selection, onUpdate }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {selection.image_url && (
            <div className="flex-shrink-0">
              <img
                src={selection.image_url}
                alt={selection.label}
                className="w-20 h-20 object-cover rounded-md"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">{selection.label}</h4>
                {selection.description && (
                  <p className="text-sm text-muted-foreground mb-2">{selection.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {selection.brand && <span>Brand: {selection.brand}</span>}
                  {selection.model_or_sku && <span>Model: {selection.model_or_sku}</span>}
                  {selection.color_name && <span>Color: {selection.color_name}</span>}
                  {selection.finish && <span>Finish: {selection.finish}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {selection.trade && (
                <Badge variant="secondary" className="text-xs">
                  {selection.trade}
                </Badge>
              )}
              {selection.is_upgrade && (
                <Badge variant="default" className="text-xs">
                  Upgrade ${selection.upgrade_cost?.toFixed(2) || '0.00'}
                </Badge>
              )}
              {selection.quantity && selection.unit && (
                <span className="text-xs text-muted-foreground">
                  Qty: {selection.quantity} {selection.unit}
                </span>
              )}
              {selection.total_cost_allowance && (
                <span className="text-xs font-medium text-foreground">
                  ${selection.total_cost_allowance.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
