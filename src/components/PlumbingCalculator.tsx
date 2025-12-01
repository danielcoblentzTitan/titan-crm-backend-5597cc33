import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, Wrench } from "lucide-react";

interface PlumbingItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface PlumbingCalculatorProps {
  onCalculationComplete?: (total: number, breakdown: any) => void;
  onAddToMechanicals?: (itemName: string, price: number) => void;
}

const PlumbingCalculator: React.FC<PlumbingCalculatorProps> = ({ onCalculationComplete, onAddToMechanicals }) => {
  const [open, setOpen] = useState(false);
  
  // Fixtures
  const [fixtures, setFixtures] = useState<PlumbingItem[]>([
    { name: "Kitchen faucet", quantity: 0, price: 425, total: 0 },
    { name: "Pot filler", quantity: 0, price: 700, total: 0 },
    { name: "2 Hose bibs", quantity: 0, price: 150, total: 0 },
    { name: "Ice Maker", quantity: 0, price: 150, total: 0 },
    { name: "Dishwasher", quantity: 0, price: 150, total: 0 },
    { name: "Washer/Dryer", quantity: 0, price: 150, total: 0 },
    { name: "Toilet", quantity: 0, price: 335, total: 0 },
    { name: "Pedestal sink", quantity: 0, price: 300, total: 0 },
    { name: "Tub/shower unit", quantity: 0, price: 750, total: 0 },
    { name: "Tub/shower trim", quantity: 0, price: 125, total: 0 },
    { name: "Shower trim", quantity: 0, price: 125, total: 0 },
    { name: "Lav faucet", quantity: 0, price: 175, total: 0 },
    { name: "1 piece shower", quantity: 0, price: 950, total: 0 },
    { name: "Rain head", quantity: 0, price: 550, total: 0 },
    { name: "Handheld", quantity: 0, price: 550, total: 0 },
    { name: "Soaking tub 36x72", quantity: 0, price: 1300, total: 0 },
    { name: "Freestanding tub 63x30", quantity: 0, price: 2050, total: 0 },
    { name: "Freestanding tub filler (MOEN Voss - chrome)", quantity: 0, price: 1500, total: 0 },
    { name: "Corner tub", quantity: 0, price: 1250, total: 0 },
    { name: "Roman tub trim", quantity: 0, price: 510, total: 0 },
    { name: "Laundry sink", quantity: 0, price: 150, total: 0 },
    { name: "Laundry sink faucet", quantity: 0, price: 150, total: 0 },
    { name: "Tall electric water heater", quantity: 0, price: 900, total: 0 },
    { name: "Short electric water heater", quantity: 0, price: 850, total: 0 },
    { name: "Low boy electric water heater", quantity: 0, price: 1000, total: 0 },
    { name: "Navien tankless water heater", quantity: 0, price: 1565, total: 0 },
    { name: "Sump pump", quantity: 0, price: 350, total: 0 }
  ]);

  // Labor
  const [labor, setLabor] = useState<PlumbingItem[]>([
    { name: "Kitchen", quantity: 0, price: 850, total: 0 },
    { name: "Pot Filler", quantity: 0, price: 350, total: 0 },
    { name: "Freestanding tub & R/I valve", quantity: 0, price: 1050, total: 0 },
    { name: "Everything Else", quantity: 0, price: 850, total: 0 }
  ]);

  // Additional items
  const [additionals, setAdditionals] = useState<PlumbingItem[]>([
    { name: "Kitchen Sink", quantity: 0, price: 1000, total: 0 },
    { name: "Vanities", quantity: 0, price: 750, total: 0 },
    { name: "Dog Wash", quantity: 0, price: 1000, total: 0 }
  ]);

  const updateQuantity = (
    section: 'fixtures' | 'labor' | 'additionals',
    index: number,
    quantity: number
  ) => {
    const setter = section === 'fixtures' ? setFixtures : 
                   section === 'labor' ? setLabor : setAdditionals;
    
    setter(prev => prev.map((item, i) => 
      i === index 
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const calculateSectionTotal = (items: PlumbingItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const fixtureTotal = calculateSectionTotal(fixtures);
  const laborTotal = calculateSectionTotal(labor);
  const additionalsTotal = calculateSectionTotal(additionals);
  const grandTotal = fixtureTotal + laborTotal + additionalsTotal;

  const handleSaveCalculation = () => {
    const breakdown = {
      fixtures: fixtures.filter(item => item.quantity > 0),
      labor: labor.filter(item => item.quantity > 0),
      additionals: additionals.filter(item => item.quantity > 0),
      totals: {
        fixtures: fixtureTotal,
        labor: laborTotal,
        additionals: additionalsTotal,
        total: grandTotal
      }
    };

    if (onCalculationComplete) {
      onCalculationComplete(grandTotal, breakdown);
    }

    // Add to Mechanicals category if handler provided
    if (onAddToMechanicals && grandTotal > 0) {
      const itemName = `Plumbing Package (${breakdown.fixtures.length + breakdown.labor.length + breakdown.additionals.length} items)`;
      onAddToMechanicals(itemName, grandTotal);
    }
    
    setOpen(false);
  };

  const ItemSection = ({ 
    title, 
    items, 
    onQuantityChange,
    total,
    bgColor = "bg-white"
  }: {
    title: string;
    items: PlumbingItem[];
    onQuantityChange: (index: number, quantity: number) => void;
    total: number;
    bgColor?: string;
  }) => (
    <Card className={bgColor}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 items-center text-sm">
            <div className="col-span-1 font-medium">{item.name}</div>
            <div className="col-span-1">
              <Input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => onQuantityChange(index, parseInt(e.target.value) || 0)}
                className="h-8 text-center"
              />
            </div>
            <div className="col-span-1 text-right">${item.price.toLocaleString()}</div>
            <div className="col-span-1 text-right font-medium">
              ${item.total.toLocaleString()}
            </div>
          </div>
        ))}
        <Separator className="my-2" />
        <div className="grid grid-cols-4 gap-4 items-center font-bold text-base">
          <div className="col-span-2">{title} TOTAL</div>
          <div className="col-span-1"></div>
          <div className="col-span-1 text-right">${total.toLocaleString()}</div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <Wrench className="h-4 w-4" />
          Plumbing Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-5 w-5" />
            PG Plumbing Pricing Calculator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-4 text-sm font-bold bg-blue-600 text-white p-3 rounded">
            <div>Fixtures</div>
            <div className="text-center">Quantity</div>
            <div className="text-right">Price</div>
            <div className="text-right">Total</div>
          </div>

          {/* Fixtures Section */}
          <ItemSection
            title="Fixtures"
            items={fixtures}
            onQuantityChange={(index, quantity) => updateQuantity('fixtures', index, quantity)}
            total={fixtureTotal}
            bgColor="bg-gray-50"
          />

          {/* Labor Section */}
          <ItemSection
            title="Labor"
            items={labor}
            onQuantityChange={(index, quantity) => updateQuantity('labor', index, quantity)}
            total={laborTotal}
            bgColor="bg-blue-50"
          />

          {/* Pat Total Section */}
          <Card className="bg-orange-100">
            <CardContent className="py-4">
              <div className="text-center font-bold text-lg">
                Pat Total: ${(fixtureTotal + laborTotal).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Additional Items */}
          <ItemSection
            title="Additional Items"
            items={additionals}
            onQuantityChange={(index, quantity) => updateQuantity('additionals', index, quantity)}
            total={additionalsTotal}
            bgColor="bg-green-50"
          />

          {/* Grand Total */}
          <Card className="bg-yellow-100">
            <CardContent className="py-6">
              <div className="text-center font-bold text-2xl">
                TOTAL: ${grandTotal.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCalculation} className="gap-2">
              <Calculator className="h-4 w-4" />
              Save Calculation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlumbingCalculator;