import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface EstimateItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  formula?: string;
  isFormula?: boolean;
}

interface EstimateBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimate: {
    id: string;
    lead_name: string;
    building_type: string;
    dimensions?: string;
    wall_height?: string;
    estimated_price: number;
    detailed_breakdown: EstimateItem[] | any; // Allow flexible type for different structures
    created_at: string;
  };
}

export const EstimateBreakdownModal: React.FC<EstimateBreakdownModalProps> = ({
  isOpen,
  onClose,
  estimate
}) => {
  // Ensure detailed_breakdown is an array and handle different data structures
  const getEstimateItems = (): EstimateItem[] => {
    if (!estimate?.detailed_breakdown) return [];
    
    // Handle case where detailed_breakdown might be stored as a different structure
    if (Array.isArray(estimate.detailed_breakdown)) {
      return estimate.detailed_breakdown;
    }
    
    // Handle case where it might be an object with items array (newer structure)
    if (typeof estimate.detailed_breakdown === 'object' && (estimate.detailed_breakdown as any).items) {
      return Array.isArray((estimate.detailed_breakdown as any).items) ? (estimate.detailed_breakdown as any).items : [];
    }
    
    // Handle case where it might be a different object structure
    if (typeof estimate.detailed_breakdown === 'object') {
      // Try to convert object keys to items if it's not the expected structure
      const obj = estimate.detailed_breakdown as any;
      if (obj && typeof obj === 'object' && !obj.items) {
        // If it's a flat object, try to extract meaningful data
        const keys = Object.keys(obj);
        if (keys.length > 0 && keys.some(key => key !== 'items' && key !== 'options' && key !== 'dimensions')) {
          // This might be an old structure - return empty for now
          console.warn('Unexpected detailed_breakdown structure:', obj);
        }
      }
    }
    
    return [];
  };

  const estimateItems = getEstimateItems();

  // Group items by category
  const groupedItems = estimateItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, EstimateItem[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalEstimate = estimateItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  // Debug logging
  console.log('Estimate breakdown data:', {
    estimate: estimate.detailed_breakdown,
    estimateItems,
    totalItems: estimateItems.length
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Estimate Breakdown - {estimate.lead_name}</span>
            <Badge variant="secondary">{formatCurrency(estimate.estimated_price)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Project Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Building Type:</span>
                <span className="ml-2">{estimate.building_type}</span>
              </div>
              {estimate.dimensions && (
                <div>
                  <span className="text-muted-foreground">Dimensions:</span>
                  <span className="ml-2">{estimate.dimensions}</span>
                </div>
              )}
              {estimate.wall_height && (
                <div>
                  <span className="text-muted-foreground">Wall Height:</span>
                  <span className="ml-2">{estimate.wall_height}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Generated:</span>
                <span className="ml-2">{new Date(estimate.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown by Category */}
          <div className="space-y-4">
            <h3 className="font-semibold">Cost Breakdown</h3>
            {estimateItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No detailed breakdown available for this estimate.</p>
                <p className="text-sm mt-2">
                  The estimate may have been calculated using a different method or the breakdown data is not available.
                </p>
              </div>
            ) : (
              Object.entries(groupedItems).map(([category, items]) => {
                const categoryTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                
                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-lg">{category}</h4>
                      <Badge variant="outline">{formatCurrency(categoryTotal)}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={item.id || index} className="flex justify-between items-center py-2 border-b border-muted/30 last:border-b-0">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.quantity || 0} {item.unit || 'each'} × {formatCurrency(item.unitPrice || 0)}
                              {item.isFormula && (
                                <Badge variant="secondary" className="ml-2 text-xs">Formula</Badge>
                              )}
                            </div>
                          </div>
                          <div className="font-medium">{formatCurrency(item.totalPrice || 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Separator />

          {/* Total Summary */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Estimate:</span>
            <span>{formatCurrency(totalEstimate)}</span>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded">
            <p><strong>Note:</strong> This is an automated preliminary estimate based on standard pricing and building specifications. Final pricing may vary based on detailed engineering, site conditions, permit requirements, and design modifications.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};