import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { PricingItemWithCategory } from "@/services/pricingService";
import { FormulaService, FormulaDimensions, FormulaResult } from "@/services/formulaService";

interface FormulaCalculatorProps {
  item: PricingItemWithCategory;
  onCalculationChange?: (result: FormulaResult | null) => void;
  buildingDimensions?: {
    width: number;
    length: number;
    pitch?: number;
    roofArea?: number;
  };
}

export const FormulaCalculator = ({ item, onCalculationChange, buildingDimensions }: FormulaCalculatorProps) => {
  const [dimensions, setDimensions] = useState<FormulaDimensions>({});
  const [result, setResult] = useState<FormulaResult | null>(null);

  const requiredInputs = item.formula_type ? FormulaService.getRequiredInputs(item.formula_type) : [];
  const formulaDescription = item.formula_type ? FormulaService.getFormulaDescription(item.formula_type) : '';

  useEffect(() => {
    if (!item.has_formula || !item.formula_type) {
      setResult(null);
      onCalculationChange?.(null);
      return;
    }

    // Automatically use building dimensions for specific formula types
    let calculationDimensions = dimensions;
    if (buildingDimensions) {
      if (item.formula_type === 'greenpost' || item.formula_type === 'perimeter_insulation') {
        calculationDimensions = {
          ...dimensions,
          width: buildingDimensions.width,
          length: buildingDimensions.length
        };
      } else if (item.formula_type === 'roofing_material') {
        calculationDimensions = {
          ...dimensions,
          roofArea: buildingDimensions.roofArea
        };
      } else if (item.formula_type === 'scissor_truss') {
        calculationDimensions = {
          ...dimensions,
          length: buildingDimensions.length
        };
      } else if (item.formula_type === 'siding') {
        calculationDimensions = {
          ...dimensions,
          width: buildingDimensions.width,
          length: buildingDimensions.length,
          pitch: buildingDimensions.pitch
        };
      }
    }

    const calculatedResult = FormulaService.calculatePrice(item, calculationDimensions);
    setResult(calculatedResult);
    onCalculationChange?.(calculatedResult);
  }, [dimensions, item, onCalculationChange, buildingDimensions]);

  const handleDimensionChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setDimensions(prev => ({
      ...prev,
      [field]: numValue > 0 ? numValue : undefined
    }));
  };

  if (!item.has_formula || !item.formula_type) {
    return null;
  }

  return (
    <Card className="mt-2">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-primary" />
          <div className="text-sm font-medium">Formula Calculator</div>
        </div>
        
        <div className="text-xs text-muted-foreground mb-3">
          {formulaDescription}
          {(item.formula_type === 'greenpost' || item.formula_type === 'perimeter_insulation') && buildingDimensions && (
            <div className="text-green-600 mt-1">
              Using building shell dimensions: {buildingDimensions.width}' × {buildingDimensions.length}'
            </div>
          )}
          {item.formula_type === 'roofing_material' && buildingDimensions?.roofArea && (
            <div className="text-green-600 mt-1">
              Using calculated roof area: {buildingDimensions.roofArea.toFixed(1)} sq ft
            </div>
          )}
          {item.formula_type === 'scissor_truss' && buildingDimensions && (
            <div className="text-green-600 mt-1">
              Using building shell length: {buildingDimensions.length}'
            </div>
          )}
          {item.formula_type === 'siding' && buildingDimensions && (
            <div className="text-green-600 mt-1">
              Using building dimensions: {buildingDimensions.width}' × {buildingDimensions.length}' × {buildingDimensions.pitch}' pitch
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          {requiredInputs.includes('width') && item.formula_type !== 'greenpost' && item.formula_type !== 'perimeter_insulation' && item.formula_type !== 'roofing_material' && (
            <div>
              <Label htmlFor={`width-${item.id}`} className="text-xs">Width (ft)</Label>
              <Input
                id={`width-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.width || ''}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
          
          {requiredInputs.includes('height') && (
            <div>
              <Label htmlFor={`height-${item.id}`} className="text-xs">Height (ft)</Label>
              <Input
                id={`height-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.height || ''}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
          
          {requiredInputs.includes('length') && item.formula_type !== 'greenpost' && item.formula_type !== 'scissor_truss' && item.formula_type !== 'perimeter_insulation' && item.formula_type !== 'roofing_material' && (
            <div>
              <Label htmlFor={`length-${item.id}`} className="text-xs">Length (ft)</Label>
              <Input
                id={`length-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.length || ''}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Lean-To 1 specific fields */}
          {requiredInputs.includes('leanTo1Width') && (
            <div>
              <Label htmlFor={`leanTo1Width-${item.id}`} className="text-xs">Lean-To 1 Width (ft)</Label>
              <Input
                id={`leanTo1Width-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.leanTo1Width || ''}
                onChange={(e) => handleDimensionChange('leanTo1Width', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {requiredInputs.includes('leanTo1Height') && (
            <div>
              <Label htmlFor={`leanTo1Height-${item.id}`} className="text-xs">Lean-To 1 Height (ft)</Label>
              <Input
                id={`leanTo1Height-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.leanTo1Height || ''}
                onChange={(e) => handleDimensionChange('leanTo1Height', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {/* Lean-To 2 specific fields */}
          {requiredInputs.includes('leanTo2Width') && (
            <div>
              <Label htmlFor={`leanTo2Width-${item.id}`} className="text-xs">Lean-To 2 Width (ft)</Label>
              <Input
                id={`leanTo2Width-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.leanTo2Width || ''}
                onChange={(e) => handleDimensionChange('leanTo2Width', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}

          {requiredInputs.includes('leanTo2Height') && (
            <div>
              <Label htmlFor={`leanTo2Height-${item.id}`} className="text-xs">Lean-To 2 Height (ft)</Label>
              <Input
                id={`leanTo2Height-${item.id}`}
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={dimensions.leanTo2Height || ''}
                onChange={(e) => handleDimensionChange('leanTo2Height', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>

        {item.formula_type === 'greenpost' && !buildingDimensions && (
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
            Greenpost calculation requires building shell dimensions. Please use the Building Price Calculator above first.
          </div>
        )}

        {item.formula_type === 'scissor_truss' && !buildingDimensions && (
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
            Scissor Truss calculation requires building shell length. Please use the Building Price Calculator above first.
          </div>
        )}

        {item.formula_type === 'perimeter_insulation' && !buildingDimensions && (
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
            Perimeter insulation calculation requires building shell dimensions. Please use the Building Price Calculator above first.
          </div>
        )}

        {item.formula_type === 'roofing_material' && (!buildingDimensions || !buildingDimensions.roofArea) && (
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
            Roofing material calculation requires roof area from the Building Price Calculator. Please calculate the building with pitch first.
          </div>
        )}

        {item.formula_type === 'siding' && (!buildingDimensions || !buildingDimensions.pitch) && (
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded">
            Siding calculation requires building shell dimensions and pitch. Please use the Building Price Calculator above first.
          </div>
        )}

        {result && (
          <div className="text-xs space-y-1 p-2 bg-muted/30 rounded">
            <div className="font-medium text-primary">Calculation:</div>
            <div className="text-muted-foreground">{result.formula}</div>
            <div className="flex justify-between items-center">
              <span>Quantity: {result.quantity}</span>
              <span className="font-medium">Total: ${result.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};