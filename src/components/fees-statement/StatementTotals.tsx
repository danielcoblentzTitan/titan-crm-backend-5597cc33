import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { DebouncedInput } from "./DebouncedInput";

interface StatementTotalsProps {
  subtotal: number;
  profitMargin: number;
  setProfitMargin: (margin: number) => void;
  profit: number;
  total: number;
  formatCurrency: (amount: number) => string;
  isLocked: boolean;
}

export const StatementTotals = ({
  subtotal,
  profitMargin,
  setProfitMargin,
  profit,
  total,
  formatCurrency,
  isLocked
}: StatementTotalsProps) => {
  const handleMarginChange = (value: string) => {
    if (isLocked) return;
    
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setProfitMargin(numValue);
  };

  return (
    <Card className="print:shadow-none print:border">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Construction Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          <Separator />

          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center space-x-2">
              <Label htmlFor="margin" className="font-medium">Profit Margin:</Label>
              <DebouncedInput
                initialValue={profitMargin}
                onDebouncedChange={handleMarginChange}
                className="w-16 h-8"
                disabled={isLocked}
                placeholder="0"
                inputMode="decimal"
              />
              <span className="text-sm">%</span>
            </div>
            <span className="font-semibold text-green-600">
              {formatCurrency(profit)}
            </span>
          </div>

          <div className="print:hidden">
            <div className="flex justify-between text-lg">
              <span>Profit Margin ({profitMargin}%):</span>
              <span className="font-semibold text-green-600">{formatCurrency(profit)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between text-xl font-bold">
            <span>Total Project Cost:</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          <div className="text-xs text-gray-600 mt-4 print:text-black">
            <p><strong>Notes:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Prices are estimates based on current Delaware market conditions</li>
              <li>Final costs may vary based on material selections and site conditions</li>
              <li>Permits and inspections based on Sussex County requirements</li>
              <li>Does not include well, septic installation, or utility connections</li>
              <li>Valid for 30 days from date of issue</li>
              <li>Project Manager Fee includes oversight of all construction phases</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
