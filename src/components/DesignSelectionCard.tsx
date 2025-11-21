
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DesignSelection, DesignOption } from "@/services/dataService";
import { Check, X, Image } from "lucide-react";

interface DesignSelectionCardProps {
  selection: DesignSelection;
  options: DesignOption[];
  isExpanded: boolean;
  customerNotes: string;
  onToggleExpand: () => void;
  onApprove: (optionId?: string) => void;
  onReject: () => void;
  onNotesChange: (notes: string) => void;
}

const DesignSelectionCard = ({
  selection,
  options,
  isExpanded,
  customerNotes,
  onToggleExpand,
  onApprove,
  onReject,
  onNotesChange
}: DesignSelectionCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>{selection.categoryName}</span>
            <Badge className={getStatusColor(selection.status)}>
              {selection.status}
            </Badge>
          </CardTitle>
          {selection.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleExpand}
            >
              {isExpanded ? 'Cancel' : 'Review Options'}
            </Button>
          )}
        </div>
        {selection.optionName && (
          <CardDescription>
            Selected: {selection.optionName}
          </CardDescription>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Available Options */}
          <div className="space-y-3">
            <h4 className="font-medium">Available Options:</h4>
            {options.length === 0 ? (
              <p className="text-sm text-gray-500">No options uploaded yet by your builder.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {options.map((option) => (
                  <div key={option.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{option.name}</h5>
                        {option.description && (
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                        )}
                        {option.supplier && (
                          <p className="text-xs text-gray-500 mt-1">Supplier: {option.supplier}</p>
                        )}
                        {option.price && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            ${option.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onApprove(option.id)}
                        className="ml-2"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Select
                      </Button>
                    </div>
                    {option.imageUrl && (
                      <div className="mt-2">
                        <Image className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 ml-1">Image available</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Notes (Optional):</label>
            <Textarea
              value={customerNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Add any comments or preferences..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onReject}
            >
              <X className="h-4 w-4 mr-1" />
              Need Different Options
            </Button>
          </div>
        </CardContent>
      )}

      {/* Show existing notes */}
      {(selection.customerNotes || selection.builderNotes) && !isExpanded && (
        <CardContent className="pt-0">
          {selection.customerNotes && (
            <div className="text-sm">
              <span className="font-medium">Your notes:</span>
              <p className="text-gray-600 mt-1">{selection.customerNotes}</p>
            </div>
          )}
          {selection.builderNotes && (
            <div className="text-sm mt-2">
              <span className="font-medium">Builder notes:</span>
              <p className="text-gray-600 mt-1">{selection.builderNotes}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default DesignSelectionCard;
