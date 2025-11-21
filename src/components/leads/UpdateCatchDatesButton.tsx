import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UpdateResult {
  totalLeads: number;
  updatedLeads: number;
  errors: number;
  noDateFound: number;
  updates: Array<{
    id: string;
    success: boolean;
    extractedDate: string;
    error?: string;
  }>;
}

export const UpdateCatchDatesButton = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const { toast } = useToast();

  const handleUpdateCatchDates = async () => {
    setIsUpdating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('update-lead-catch-dates', {
        body: {}
      });

      if (error) throw error;

      setResult(data);
      
      if (data.updatedLeads > 0) {
        toast({
          title: "Catch dates updated!",
          description: `Successfully updated ${data.updatedLeads} leads with catch dates from their notes.`,
        });
      } else {
        toast({
          title: "No updates needed",
          description: "No catch dates were found in the notes of existing leads.",
        });
      }
    } catch (error) {
      console.error('Error updating catch dates:', error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update catch dates.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Update Catch Dates
          </CardTitle>
          <CardDescription>
            Parse notes from existing imported leads to extract and update catch dates. 
            This will update the "Days Since Contact" calculation for leads that have catch date information in their notes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleUpdateCatchDates}
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing leads...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Extract Catch Dates from Notes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Update Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total leads processed:</span>
                <span className="ml-2">{result.totalLeads}</span>
              </div>
              <div>
                <span className="font-medium">Successfully updated:</span>
                <span className="ml-2 text-green-600">{result.updatedLeads}</span>
              </div>
              <div>
                <span className="font-medium">No catch date found:</span>
                <span className="ml-2 text-yellow-600">{result.noDateFound}</span>
              </div>
              <div>
                <span className="font-medium">Errors:</span>
                <span className="ml-2 text-red-600">{result.errors}</span>
              </div>
            </div>

            {result.updates.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Updated leads:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.updates.filter(u => u.success).map((update, index) => (
                    <div key={index} className="text-sm text-green-600">
                      Lead {update.id.substring(0, 8)}... → {update.extractedDate}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.updates.some(u => !u.success) && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.updates.filter(u => !u.success).map((update, index) => (
                    <div key={index} className="text-sm text-red-600">
                      Lead {update.id.substring(0, 8)}... → {update.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};