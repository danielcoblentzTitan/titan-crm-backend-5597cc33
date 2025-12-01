import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Home } from "lucide-react";

interface StandardColorsSectionProps {
  isEditing: boolean;
}

export const StandardColorsSection = ({ isEditing }: StandardColorsSectionProps) => {
  const standardItems = [
    { component: 'LT Ceiling', standardColor: 'Brite White', fieldName: 'lt_ceiling_custom' },
    { component: 'Soffit', standardColor: 'White', fieldName: 'soffit_custom' },
    { component: 'Gutters and Downspouts', standardColor: 'White', fieldName: 'gutters_custom' },
    { component: 'Vinyl Post Sleeves', standardColor: 'White', fieldName: 'post_sleeves_custom' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-6 w-6 text-primary" />
          Standard Color Components
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          These components come in standard colors. You can request a different color if needed.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {standardItems.map((item) => (
          <div key={item.fieldName} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <span className="font-medium">{item.component}</span>
              <span className="text-sm text-muted-foreground">Standard: {item.standardColor}</span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm">Request different color:</label>
              <Input 
                name={item.fieldName}
                placeholder="Enter color request..."
                className="w-48"
                disabled={!isEditing}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};