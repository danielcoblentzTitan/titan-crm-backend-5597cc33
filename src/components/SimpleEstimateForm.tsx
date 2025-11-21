import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCentralizedPricing } from '@/hooks/useCentralizedPricing';
import type { BuildingDimensions, EstimateOptions } from '@/utils/estimateCalculations';

interface SimpleEstimateFormProps {
  onClose?: () => void;
}

export const SimpleEstimateForm = ({ onClose }: SimpleEstimateFormProps) => {
  // Building dimensions
  const [dimensions, setDimensions] = useState({
    width: '',
    length: '',
    wallHeight: '10',
    buildingType: 'gable'
  });

  // Options
  const [options, setOptions] = useState<EstimateOptions>({
    concrete_thickness: 'none',
    post_sizing: 'standard',
    truss_pitch: 'none',
    truss_spacing: 'none',
    exterior_siding_gauge: 'none',
    moisture_barrier: 'none',
    insulation_wall_finish: 'none',
  });

  // Use centralized pricing
  const { 
    estimateItems, 
    loading, 
    calculateEstimate, 
    getTotalPrice,
    getItemsByCategory 
  } = useCentralizedPricing();

  // Recalculate when dimensions or options change
  useEffect(() => {
    const width = parseFloat(dimensions.width);
    const length = parseFloat(dimensions.length);
    const wallHeight = parseFloat(dimensions.wallHeight);

    if (width && length && !loading) {
      const buildingDimensions: BuildingDimensions = {
        width,
        length,
        wallHeight: wallHeight || 10,
        roofPitch: 4, // Default pitch
        buildingType: dimensions.buildingType
      };

      calculateEstimate(buildingDimensions, options);
    }
  }, [dimensions, options, loading, calculateEstimate]);

  const totalPrice = getTotalPrice();
  const itemsByCategory = getItemsByCategory();

  const handleDimensionChange = (field: string, value: string) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  const handleConcreteChange = (thickness: string, checked: boolean) => {
    if (checked) {
      setOptions(prev => ({ ...prev, concrete_thickness: thickness }));
    } else {
      setOptions(prev => ({ ...prev, concrete_thickness: 'none' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Simple Estimate Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Building Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="width">Width (ft)</Label>
              <Input
                id="width"
                type="number"
                value={dimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                placeholder="30"
              />
            </div>
            <div>
              <Label htmlFor="length">Length (ft)</Label>
              <Input
                id="length"
                type="number"
                value={dimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                placeholder="40"
              />
            </div>
            <div>
              <Label htmlFor="wallHeight">Wall Height (ft)</Label>
              <Input
                id="wallHeight"
                type="number"
                value={dimensions.wallHeight}
                onChange={(e) => handleDimensionChange('wallHeight', e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="buildingType">Building Type</Label>
              <Select
                value={dimensions.buildingType}
                onValueChange={(value) => handleDimensionChange('buildingType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gable">Gable</SelectItem>
                  <SelectItem value="lean-to">Lean-To</SelectItem>
                  <SelectItem value="hip">Hip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Concrete Options */}
          <div>
            <Label className="text-base font-semibold">Concrete Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="no-concrete"
                  checked={options.concrete_thickness === 'none'}
                  onCheckedChange={(checked) => {
                    if (checked) setOptions(prev => ({ ...prev, concrete_thickness: 'none' }));
                  }}
                />
                <Label htmlFor="no-concrete">No Concrete</Label>
              </div>
              {['4', '5', '6'].map(thickness => (
                <div key={thickness} className="flex items-center space-x-2">
                  <Checkbox
                    id={`concrete-${thickness}`}
                    checked={options.concrete_thickness === thickness}
                    onCheckedChange={(checked) => handleConcreteChange(thickness, !!checked)}
                  />
                  <Label htmlFor={`concrete-${thickness}`}>
                    {thickness}" Concrete
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Pricing Summary */}
          {estimateItems.length > 0 && (
            <div>
              <Label className="text-base font-semibold">Estimate Breakdown</Label>
              <div className="mt-3 space-y-3">
                {Object.entries(itemsByCategory).map(([category, items]) => (
                  <Card key={category} className="bg-muted/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      {items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name}</span>
                          <span>${item.totalPrice.toLocaleString()}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="bg-primary/10 border-primary">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total Estimate:</span>
                      <span className="font-bold text-xl text-primary">
                        ${totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-4">
              <p>Loading pricing data...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            <Button>
              Save Estimate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};