import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, Copy, FileText, Loader2 } from 'lucide-react';
import { quickEstimateService, QuickEstimateInput } from '@/services/quickEstimateService';
import { quickEstimatePdfService } from '@/services/quickEstimatePdfService';
import { useToast } from '@/hooks/use-toast';

interface QuickEstimateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName: string;
  initialLivingSqft?: number;
}

export function QuickEstimateDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  initialLivingSqft = 0,
}: QuickEstimateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const [buildType, setBuildType] = useState<'Shell Only' | 'Dried-In' | 'Turnkey' | 'Custom'>('Turnkey');
  const [stories, setStories] = useState<'Single Story' | '2 Story'>('Single Story');
  const [livingSqft, setLivingSqft] = useState(initialLivingSqft);
  const [shopSqft, setShopSqft] = useState(0);
  const [includeSiteUtilities, setIncludeSiteUtilities] = useState(true);
  const [state, setState] = useState<'Maryland' | 'Delaware'>('Delaware');

  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      quickEstimateService.loadSettings()
        .then(() => {
          setLoading(false);
          calculateEstimate();
        })
        .catch((error) => {
          console.error('Failed to load settings:', error);
          toast({
            title: 'Error',
            description: 'Failed to load estimate settings',
            variant: 'destructive',
          });
          setLoading(false);
        });
    }
  }, [open]);

  useEffect(() => {
    if (!loading && livingSqft > 0) {
      calculateEstimate();
    }
  }, [buildType, stories, livingSqft, shopSqft, includeSiteUtilities, state, loading]);

  const calculateEstimate = () => {
    if (livingSqft <= 0) return;
    
    try {
      const input: QuickEstimateInput = {
        leadId,
        leadName,
        buildType,
        stories,
        livingSqft,
        shopSqft,
        includeSiteUtilities,
        state,
      };

      const calculatedResult = quickEstimateService.calculateEstimate(input);
      setResult(calculatedResult);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  };

  const handleCopySummary = async () => {
    if (!result) return;

    const input: QuickEstimateInput = {
      leadId,
      leadName,
      buildType,
      stories,
      livingSqft,
      shopSqft,
      includeSiteUtilities,
      state,
    };

    const summaryText = quickEstimateService.generateSummaryText(input, result);
    
    try {
      await navigator.clipboard.writeText(summaryText);
      toast({
        title: 'Copied!',
        description: 'Summary copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePdf = async () => {
    if (!result) return;

    setCalculating(true);
    
    try {
      const input: QuickEstimateInput = {
        leadId,
        leadName,
        buildType,
        stories,
        livingSqft,
        shopSqft,
        includeSiteUtilities,
        state,
      };

      // Save to database
      await quickEstimateService.saveEstimate(input, result);

      // Generate PDF
      quickEstimatePdfService.generatePdf(input, result);

      toast({
        title: 'Success!',
        description: 'Quick estimate PDF generated and saved',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Quick Estimate - {leadName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Build Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Build Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={(value: any) => setState(value)}>
                    <SelectTrigger id="state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Delaware">Delaware</SelectItem>
                      <SelectItem value="Maryland">Maryland</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildType">Build Type</Label>
                  <Select value={buildType} onValueChange={(value: any) => setBuildType(value)}>
                    <SelectTrigger id="buildType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shell Only">Shell Only</SelectItem>
                      <SelectItem value="Dried-In">Dried-In</SelectItem>
                      <SelectItem value="Turnkey">Turnkey</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stories">Stories</Label>
                  <Select value={stories} onValueChange={(value: any) => setStories(value)}>
                    <SelectTrigger id="stories">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single Story">Single Story</SelectItem>
                      <SelectItem value="2 Story">2 Story</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="livingSqft">Living Area (sq ft)</Label>
                  <Input
                    id="livingSqft"
                    type="number"
                    value={livingSqft || ''}
                    onChange={(e) => setLivingSqft(Number(e.target.value))}
                    placeholder="2500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopSqft">Shop/Garage (sq ft)</Label>
                  <Input
                    id="shopSqft"
                    type="number"
                    value={shopSqft || ''}
                    onChange={(e) => setShopSqft(Number(e.target.value))}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="siteUtilities"
                    checked={includeSiteUtilities}
                    onCheckedChange={(checked) => setIncludeSiteUtilities(checked as boolean)}
                  />
                  <Label htmlFor="siteUtilities" className="cursor-pointer">
                    Include Site & Utilities
                  </Label>
                </div>
              </div>
            </div>

            {/* Live Calculation Display */}
            {result && livingSqft > 0 && (
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-semibold text-sm mb-3">Estimated Project Cost</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Building:</span>
                    <span className="font-medium">
                      {quickEstimateService.formatCurrency(result.buildingLow)} - {quickEstimateService.formatCurrency(result.buildingHigh)}
                    </span>
                  </div>
                  
                  {shopSqft > 0 && (
                    <div className="flex justify-between">
                      <span>Shop Addition:</span>
                      <span className="font-medium">{quickEstimateService.formatCurrency(result.shopCost)}</span>
                    </div>
                  )}
                  
                  {includeSiteUtilities && (
                    <div className="flex justify-between">
                      <span>Site & Utilities:</span>
                      <span className="font-medium">
                        {quickEstimateService.formatCurrency(result.siteUtilitiesLow)} - {quickEstimateService.formatCurrency(result.siteUtilitiesHigh)}
                      </span>
                    </div>
                  )}
                  
                  {result.sprinklerLow && result.sprinklerHigh && (
                    <div className="flex justify-between">
                      <span>Sprinkler System (MD Required):</span>
                      <span className="font-medium">
                        {quickEstimateService.formatCurrency(result.sprinklerLow)} - {quickEstimateService.formatCurrency(result.sprinklerHigh)}
                      </span>
                    </div>
                  )}
                  
                  {result.taxAmount && (
                    <div className="flex justify-between">
                      <span>Maryland Tax (6%):</span>
                      <span className="font-medium">
                        {quickEstimateService.formatCurrency(result.taxAmount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-base font-bold">
                      <span>TOTAL RANGE:</span>
                      <span className="text-primary">
                        {quickEstimateService.formatCurrency(result.totalLow)} - {quickEstimateService.formatCurrency(result.totalHigh)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Output Options */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleCopySummary}
                disabled={!result || livingSqft <= 0}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Summary
              </Button>
              <Button
                onClick={handleGeneratePdf}
                disabled={!result || livingSqft <= 0 || calculating}
                className="flex-1"
              >
                {calculating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate PDF
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              This is a preliminary estimate for pre-qualification purposes only. 
              Not a formal proposal.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
