import { Button } from "@/components/ui/button";
import { DollarSign, ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MasterPricingHeaderProps {
  hasChanges: boolean;
  onSaveChanges: () => void;
}

export const MasterPricingHeader = ({ hasChanges, onSaveChanges }: MasterPricingHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Master Pricing Sheet</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Button onClick={onSaveChanges} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};