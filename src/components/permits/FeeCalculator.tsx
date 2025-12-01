import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useJurisdictions, calculatePermitFee } from "@/integrations/supabase/hooks/usePermits";
import { Calculator, DollarSign } from "lucide-react";

const FeeCalculator = () => {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");
  const [selectedProjectType, setSelectedProjectType] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);

  const { data: jurisdictions = [] } = useJurisdictions();

  const selectedJurisdictionData = jurisdictions.find(j => j.id === selectedJurisdiction);
  const availableProjectTypes = selectedJurisdictionData?.project_types || [];

  const handleCalculate = () => {
    if (!selectedJurisdictionData || !selectedProjectType || !squareFootage) {
      return;
    }

    const fee = calculatePermitFee(
      selectedJurisdictionData,
      selectedProjectType,
      parseInt(squareFootage)
    );
    
    setCalculatedFee(fee);
  };

  const reset = () => {
    setSelectedJurisdiction("");
    setSelectedProjectType("");
    setSquareFootage("");
    setCalculatedFee(null);
  };

  return (
    <div className="space-y-6">
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

      <div className="flex gap-2">
        <Button 
          onClick={handleCalculate}
          disabled={!selectedJurisdiction || !selectedProjectType || !squareFootage}
          className="flex items-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Calculate Fee
        </Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>

      {calculatedFee !== null && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Estimated Permit Fee
            </CardTitle>
            <CardDescription>
              Based on {selectedJurisdictionData?.name} rates for {selectedProjectType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ${calculatedFee.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Calculation: Base fee + (${selectedJurisdictionData?.project_types.find((pt: any) => pt.type === selectedProjectType)?.fees?.sqft_rate || 0}/sqft × {squareFootage} sqft)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FeeCalculator;