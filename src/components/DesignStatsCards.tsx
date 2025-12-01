
import { Card, CardContent } from "@/components/ui/card";
import { Check, MessageSquare, Palette } from "lucide-react";

interface DesignStatsCardsProps {
  totalSelections: number;
  approvedCount: number;
  pendingCount: number;
}

const DesignStatsCards = ({ totalSelections, approvedCount, pendingCount }: DesignStatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Palette className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totalSelections}</p>
              <p className="text-sm text-gray-600">Total Selections</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignStatsCards;
