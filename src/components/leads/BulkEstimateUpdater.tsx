import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from 'lucide-react';
import { bulkUpdateLeadEstimates } from '@/utils/bulkUpdateEstimates';
import { toast } from 'sonner';

export const BulkEstimateUpdater = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkUpdate = async () => {
    if (!confirm('This will update estimated values for all leads with width and length. Continue?')) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await bulkUpdateLeadEstimates();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Failed to update estimates');
      console.error('Bulk update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Bulk Estimate Updater
        </CardTitle>
        <CardDescription>
          Update estimated values for all leads based on their dimensions:
          <ul className="list-disc list-inside mt-2 text-sm">
            <li>Residential: $50/sq ft</li>
            <li>Commercial: $75/sq ft</li>
            <li>Barndominium: $145/sq ft</li>
          </ul>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleBulkUpdate} 
          disabled={isUpdating}
          className="w-full"
        >
          {isUpdating ? 'Updating...' : 'Update All Lead Estimates'}
        </Button>
      </CardContent>
    </Card>
  );
};
