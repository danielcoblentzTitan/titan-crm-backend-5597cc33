import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, RefreshCw, Plus } from "lucide-react";

interface BuildingDimensions {
  length: number;
  width: number;
  height: number;
  pitch: number;
  // Barndominium specific fields (first floor uses main dimensions)
  secondFloorSqFt?: number;
  garageWidth?: number;
  garageLength?: number;
  garageHeight?: number;
  interiorWallsLf?: number;
}

interface BuildingPriceCalculatorProps {
  onPriceCalculated?: (pricePerSqFt: number, totalSqFt: number, dimensions: BuildingDimensions) => void;
  onCreateBasePriceItem?: (pricePerSqFt: number, dimensions: BuildingDimensions) => void;
}

const BuildingPriceCalculator = ({ onPriceCalculated, onCreateBasePriceItem }: BuildingPriceCalculatorProps) => {
  const [dimensions, setDimensions] = useState<BuildingDimensions>({
    length: 40,
    width: 60,
    height: 12,
    pitch: 6,
    // Barndominium defaults
    secondFloorSqFt: 0,
    garageWidth: 24,
    garageLength: 24,
    garageHeight: 12,
    interiorWallsLf: 0
  });
  const [result, setResult] = useState<{
    pricePerSqFt: number;
    totalSqFt: number;
    totalPrice: number;
    secondFloorPrice?: number;
    garagePrice?: number;
    totalBarndominiumPrice?: number;
  } | null>(null);

  // Your updated formula: -108+(2.566461*B2)+ (0.003432*B3) + (0.466366*B4) + (1675.96798/B2) + (189.909144/B3) - (0.003643*B2*B4) - (0.001466*B3*B4) + (0.672221*(B5-4)) - (6.56163*(B5-4)/B2) + (5.930883*(B5-4)/B3) + (0.000142*B2*B3) - (0.018508*B2*B2) + (0.000051*B3*B3)
  // Where B2 = Width, B3 = Length, B4 = Height, B5 = Pitch
  const calculatePricePerSqFt = (length: number, width: number, height: number, pitch: number): number => {
    const B2 = width;   // B2 is width (as in your spreadsheet)
    const B3 = length;  // B3 is length (as in your spreadsheet)
    const B4 = height;  // B4 is height
    const B5 = pitch;   // B5 is roof pitch

    const pricePerSqFt = 
      -108 +
      (2.566461 * B2) +
      (0.003432 * B3) +
      (0.466366 * B4) +
      (1675.96798 / B2) +
      (189.909144 / B3) -
      (0.003643 * B2 * B4) -
      (0.001466 * B3 * B4) +
      (0.672221 * (B5 - 4)) -
      (6.56163 * (B5 - 4) / B2) +
      (5.930883 * (B5 - 4) / B3) +
      (0.000142 * B2 * B3) -
      (0.018508 * B2 * B2) +
      (0.000051 * B3 * B3);

    return Math.max(0, pricePerSqFt); // Ensure non-negative price
  };

  const calculate = () => {
    const { length, width, height, pitch, secondFloorSqFt, garageWidth, garageLength, garageHeight } = dimensions;
    
    if (length <= 0 || width <= 0 || height <= 0 || pitch <= 0) {
      return;
    }

    const pricePerSqFt = calculatePricePerSqFt(length, width, height, pitch);
    const totalSqFt = length * width;
    const totalPrice = pricePerSqFt * totalSqFt;

    let calculationResult = {
      pricePerSqFt,
      totalSqFt,
      totalPrice,
      secondFloorPrice: undefined as number | undefined,
      garagePrice: undefined as number | undefined,
      totalBarndominiumPrice: undefined as number | undefined
    };

    // Calculate second floor pricing: just $7 per sq ft
    if (secondFloorSqFt && secondFloorSqFt > 0) {
      calculationResult.secondFloorPrice = 7 * secondFloorSqFt;
    }

    // Calculate garage pricing using the same base formula
    if (garageWidth && garageLength && garageHeight) {
      const garageBasePricePerSqFt = calculatePricePerSqFt(garageLength, garageWidth, garageHeight, pitch);
      const garageSqFt = garageWidth * garageLength;
      calculationResult.garagePrice = garageBasePricePerSqFt * garageSqFt;
    }

    // Calculate total barndominium price: first floor + second floor + garage
    calculationResult.totalBarndominiumPrice = 
      totalPrice + 
      (calculationResult.secondFloorPrice || 0) + 
      (calculationResult.garagePrice || 0);

    setResult(calculationResult);
    
    if (onPriceCalculated) {
      onPriceCalculated(pricePerSqFt, totalSqFt, dimensions);
    }
  };

  const createBasePriceItem = () => {
    if (result && onCreateBasePriceItem) {
      onCreateBasePriceItem(result.pricePerSqFt, dimensions);
    }
  };

  const updateDimension = (field: keyof BuildingDimensions, value: number) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Building Price Calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calculate base square foot pricing using your custom formula
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="space-y-6">
          {/* Basic Building Dimensions */}
          <div>
            <h4 className="text-md font-semibold mb-3">Basic Building Dimensions</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="width">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => updateDimension('width', Number(e.target.value))}
                  placeholder="Enter width"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="length">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  value={dimensions.length}
                  onChange={(e) => updateDimension('length', Number(e.target.value))}
                  placeholder="Enter length"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="height">Wall Height (ft)</Label>
                <Input
                  id="height"
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => updateDimension('height', Number(e.target.value))}
                  placeholder="Enter height"
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="pitch">Roof Pitch</Label>
                <Input
                  id="pitch"
                  type="number"
                  value={dimensions.pitch}
                  onChange={(e) => updateDimension('pitch', Number(e.target.value))}
                  placeholder="Enter pitch"
                  min="1"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Barndominium Specific Fields */}
          <div>
            <h4 className="text-md font-semibold mb-3">Barndominium Specifications</h4>
            <p className="text-sm text-muted-foreground mb-4">
              First floor dimensions use the main building dimensions above.
            </p>
            
            {/* Second Floor */}
            <div className="mb-4">
              <div>
                <Label htmlFor="secondFloorSqFt">Second Floor Sq Ft ($7/sq ft)</Label>
                <Input
                  id="secondFloorSqFt"
                  type="number"
                  value={dimensions.secondFloorSqFt || ''}
                  onChange={(e) => updateDimension('secondFloorSqFt', Number(e.target.value))}
                  placeholder="Second floor square feet"
                  min="0"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Garage */}
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground">Garage Dimensions</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  <Label htmlFor="garageWidth">Width (ft)</Label>
                  <Input
                    id="garageWidth"
                    type="number"
                    value={dimensions.garageWidth || ''}
                    onChange={(e) => updateDimension('garageWidth', Number(e.target.value))}
                    placeholder="Garage width"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="garageLength">Length (ft)</Label>
                  <Input
                    id="garageLength"
                    type="number"
                    value={dimensions.garageLength || ''}
                    onChange={(e) => updateDimension('garageLength', Number(e.target.value))}
                    placeholder="Garage length"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="garageHeight">Height (ft)</Label>
                  <Input
                    id="garageHeight"
                    type="number"
                    value={dimensions.garageHeight || ''}
                    onChange={(e) => updateDimension('garageHeight', Number(e.target.value))}
                    placeholder="Garage height"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Interior Walls */}
            <div>
              <Label htmlFor="interiorWallsLf">Interior Walls Linear Feet</Label>
              <Input
                id="interiorWallsLf"
                type="number"
                value={dimensions.interiorWallsLf || ''}
                onChange={(e) => updateDimension('interiorWallsLf', Number(e.target.value))}
                placeholder="Interior walls linear feet"
                min="0"
                className="mt-2"
              />
            </div>

            {/* Total Square Footage Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <Label className="text-sm font-medium">Total Barndominium Sq Ft</Label>
                <p className="text-xl font-bold text-primary">
                  {(dimensions.length * dimensions.width + (dimensions.secondFloorSqFt || 0)).toLocaleString()} sq ft
                </p>
                <p className="text-xs text-muted-foreground">
                  First Floor: {(dimensions.length * dimensions.width).toLocaleString()} + Second Floor: {(dimensions.secondFloorSqFt || 0).toLocaleString()}
                </p>
              </div>
              {dimensions.garageWidth && dimensions.garageLength && (
                <div className="text-center">
                  <Label className="text-sm font-medium">Total Garage Sq Ft</Label>
                  <p className="text-xl font-bold text-primary">
                    {(dimensions.garageWidth * dimensions.garageLength).toLocaleString()} sq ft
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dimensions.garageWidth}' × {dimensions.garageLength}'
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Button onClick={calculate} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Calculate Base Price
        </Button>

        {result && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Calculation Results</h3>
              
              {/* Basic Building Results */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Price per Sq Ft</p>
                  <p className="text-2xl font-bold text-primary">
                    ${result.pricePerSqFt.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Square Feet</p>
                  <p className="text-2xl font-bold">
                    {result.totalSqFt.toLocaleString()} sq ft
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Base Building Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${result.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Barndominium Breakdown */}
              {(result.secondFloorPrice || result.garagePrice) && (
                <>
                  <Separator />
                  <h4 className="text-md font-semibold">Barndominium Pricing Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-muted-foreground">First Floor</p>
                      <p className="text-lg font-bold text-blue-700">
                        ${result.totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.totalSqFt} sq ft @ ${result.pricePerSqFt.toFixed(2)}/sq ft
                      </p>
                    </div>
                    {result.secondFloorPrice && (
                      <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">Second Floor</p>
                        <p className="text-lg font-bold text-purple-700">
                          ${result.secondFloorPrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dimensions.secondFloorSqFt} sq ft @ $7.00/sq ft
                        </p>
                      </div>
                    )}
                    {result.garagePrice && (
                      <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">Garage</p>
                        <p className="text-lg font-bold text-orange-700">
                          ${result.garagePrice.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dimensions.garageWidth! * dimensions.garageLength!} sq ft
                        </p>
                      </div>
                    )}
                  </div>
                  {result.totalBarndominiumPrice && (
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg mt-4">
                      <p className="text-sm text-muted-foreground">Total Barndominium Price</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${result.totalBarndominiumPrice.toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Formula Used:</strong> -108 + (2.566461×W) + (0.003432×L) + (0.466366×H) + (1675.96798/W) + (189.909144/L) - (0.003643×W×H) - (0.001466×L×H) + (0.672221×(P-4)) - (6.56163×(P-4)/W) + (5.930883×(P-4)/L) + (0.000142×W×L) - (0.018508×W²) + (0.000051×L²)
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Building: {dimensions.length}' × {dimensions.width}' × {dimensions.height}' @ {dimensions.pitch}:12 pitch = {result.totalSqFt} sq ft @ ${result.pricePerSqFt.toFixed(2)}/sq ft
                </p>
              </div>

              {onCreateBasePriceItem && (
                <div className="flex justify-center">
                  <Button onClick={createBasePriceItem} className="w-full md:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Pricing Sheet as Base Building Price
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BuildingPriceCalculator;