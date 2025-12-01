import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useJurisdictions } from "@/integrations/supabase/hooks/usePermits";
import { Calculator, DollarSign, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdvancedFeeCalculator = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [valuation, setValuation] = useState("");
  const [insideMunicipality, setInsideMunicipality] = useState(false);
  const [needsOSFM, setNeedsOSFM] = useState(false);
  const [calculatedFees, setCalculatedFees] = useState<any[]>([]);
  const [totalFee, setTotalFee] = useState(0);

  const { data: jurisdictions = [] } = useJurisdictions();

  const selectedJurisdictionData = jurisdictions.find(j => j.id === selectedJurisdiction);
  const availableProjectTypes = selectedJurisdictionData?.project_types || [];

  const calculateAdvancedFees = () => {
    if (!selectedJurisdictionData || !selectedProjectType || !valuation) {
      return;
    }

    const fees: any[] = [];
    const valuationNum = parseFloat(valuation);
    const jurisdictionName = selectedJurisdictionData.name;

    if (jurisdictionName === "Kent County, DE") {
      // Base permit: $10 per $1k up to $1M, then $3 per $1k + $50 minimum
      const basePermit = Math.max(50, 
        valuationNum <= 1000000 
          ? (valuationNum / 1000) * 10
          : (1000000 / 1000) * 10 + ((valuationNum - 1000000) / 1000) * 3
      );
      fees.push({
        name: "Base Building Permit",
        amount: basePermit,
        formula: `$10 per $1,000 (up to $1M), then $3 per $1,000`,
        source: "eCode360 §205-4"
      });

      // School surcharge: 1.25% of valuation
      const schoolSurcharge = valuationNum * 0.0125;
      fees.push({
        name: "School Surcharge (1.16% + Polytech 0.09%)",
        amount: schoolSurcharge,
        formula: `1.25% × $${valuationNum.toLocaleString()}`,
        source: "eCode360 §128-67.1"
      });
    }

    if (jurisdictionName === "Sussex County, DE") {
      if (insideMunicipality) {
        // Inside municipality: $5 first $1k, then $2 per $1k
        const baseFee = 5 + Math.max(0, (valuationNum - 1000) / 1000) * 2;
        fees.push({
          name: "Base Building Permit (Inside Municipality)",
          amount: baseFee,
          formula: `$5 first $1,000 + $2 per $1,000 thereafter`,
          source: "FY2026 Budget Book"
        });
      } else {
        // Unincorporated: $7.50 first $1k, then $3 per $1k
        const baseFee = 7.50 + Math.max(0, (valuationNum - 1000) / 1000) * 3;
        fees.push({
          name: "Base Building Permit (Unincorporated)",
          amount: baseFee,
          formula: `$7.50 first $1,000 + $3 per $1,000 thereafter`,
          source: "FY2026 Budget Book"
        });
      }
    }

    if (jurisdictionName === "New Castle County, DE") {
      // Permit Review Fee: $12 per $1k up to $1M, then $5.25 per $1k + $142 minimum
      const permitReview = Math.max(142,
        valuationNum <= 1000000
          ? (valuationNum / 1000) * 12
          : (1000000 / 1000) * 12 + ((valuationNum - 1000000) / 1000) * 5.25
      );
      fees.push({
        name: "Permit Review Fee",
        amount: permitReview,
        formula: `$12 per $1,000 (up to $1M), then $5.25 per $1,000`,
        source: "NCC Valuation Data Sheet"
      });

      // Zoning Review: 10% of permit review (min $21, max $145)
      const zoningReview = Math.min(145, Math.max(21, permitReview * 0.10));
      fees.push({
        name: "Zoning Review Fee",
        amount: zoningReview,
        formula: `10% of permit review fee (min $21, max $145)`,
        source: "NCC Valuation Data Sheet"
      });

      // Volunteer Fire Assistance: 0.5% of valuation up to $1M
      const fireAssistance = Math.min(valuationNum, 1000000) * 0.005;
      fees.push({
        name: "Volunteer Fire Assistance Fund",
        amount: fireAssistance,
        formula: `0.5% of valuation (up to first $1M)`,
        source: "NCC Valuation Data Sheet"
      });

      // Certificate of Occupancy for residential/commercial
      if (selectedProjectType.includes("Barndominium") || selectedProjectType.includes("Commercial")) {
        fees.push({
          name: "Certificate of Occupancy",
          amount: 60,
          formula: "Flat fee",
          source: "NCC Valuation Data Sheet"
        });
      }
    }

    // State Fire Marshal (commercial projects)
    if (needsOSFM && selectedProjectType.includes("Commercial")) {
      const osfmFee = Math.max(150, 
        Math.min(valuationNum, 1000000) * 0.007 + 
        Math.max(0, valuationNum - 1000000) * 0.003
      );
      fees.push({
        name: "State Fire Marshal Plan Review",
        amount: osfmFee,
        formula: `Max($150, 0.7% up to $1M + 0.3% of remainder)`,
        source: "OSFM Plan Review Fee Schedule"
      });
    }

    setCalculatedFees(fees);
    setTotalFee(fees.reduce((sum, fee) => sum + fee.amount, 0));
  };

  const reset = () => {
    setSelectedJurisdiction("");
    setSelectedProjectType("");
    setSquareFootage("");
    setValuation("");
    setInsideMunicipality(false);
    setNeedsOSFM(false);
    setCalculatedFees([]);
    setTotalFee(0);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Advanced calculator using real Delaware county fee formulas. These are estimates - final fees may vary.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jurisdiction">Jurisdiction</Label>
          <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
            <SelectTrigger>
              <SelectValue placeholder="Select jurisdiction" />
            </SelectTrigger>
            <SelectContent>
              {jurisdictions.map((jurisdiction) => (
                <SelectItem key={jurisdiction.id} value={jurisdiction.id}>
                  {jurisdiction.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectType">Project Type</Label>
          <Select 
            value={selectedProjectType} 
            onValueChange={setSelectedProjectType}
            disabled={!selectedJurisdiction}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {availableProjectTypes.map((projectType: any, index: number) => (
                <SelectItem key={index} value={projectType.type}>
                  {projectType.type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valuation">Construction Valuation ($)</Label>
          <Input
            id="valuation"
            type="number"
            placeholder="Enter construction value"
            value={valuation}
            onChange={(e) => setValuation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="squareFootage">Square Footage</Label>
          <Input
            id="squareFootage"
            type="number"
            placeholder="Enter square footage"
            value={squareFootage}
            onChange={(e) => setSquareFootage(e.target.value)}
          />
        </div>
      </div>

      {/* Conditional toggles */}
      <div className="space-y-4">
        {selectedJurisdictionData?.name === "Sussex County, DE" && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="municipality" 
              checked={insideMunicipality}
              onCheckedChange={setInsideMunicipality}
            />
            <Label htmlFor="municipality">Inside municipality with own zoning</Label>
          </div>
        )}

        {selectedProjectType.includes("Commercial") && (
          <div className="flex items-center space-x-2">
            <Switch 
              id="osfm" 
              checked={needsOSFM}
              onCheckedChange={setNeedsOSFM}
            />
            <Label htmlFor="osfm">Requires State Fire Marshal plan review</Label>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={calculateAdvancedFees}
          disabled={!selectedJurisdiction || !selectedProjectType || !valuation}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Calculate Advanced Fees
        </Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      {calculatedFees.length > 0 && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Total Estimated Fee: ${totalFee.toFixed(2)}
              </CardTitle>
              <CardDescription>
                {selectedJurisdictionData?.name} • {selectedProjectType}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {calculatedFees.map((fee, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">{fee.name}</h4>
                      <p className="text-sm text-muted-foreground">{fee.formula}</p>
                      <Badge variant="outline" className="text-xs">
                        {fee.source}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold">
                      ${fee.amount.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFeeCalculator;