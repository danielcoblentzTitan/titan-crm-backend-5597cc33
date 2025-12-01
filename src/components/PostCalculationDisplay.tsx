import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Calculator } from "lucide-react";
import { PostCalculationService, PostCalculationInputs, PostBreakdown } from "@/services/postCalculationService";

interface PostCalculationDisplayProps {
  title: string;
  inputs: PostCalculationInputs;
  show?: boolean;
}

export const PostCalculationDisplay = ({ title, inputs, show = true }: PostCalculationDisplayProps) => {
  if (!show || !inputs.building_width || !inputs.building_length || !inputs.building_height) {
    return null;
  }

  const breakdown = PostCalculationService.calculatePostRequirements(inputs);
  
  return (
    <Card className="border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Calculator className="h-4 w-4 text-primary" />
          {title} - Post Calculations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="font-medium text-foreground/80">Building Dimensions:</p>
            <p>{inputs.building_width}' × {inputs.building_length}' × {inputs.building_height}'</p>
            <p>Roof Pitch: {inputs.roof_pitch}/12</p>
          </div>
          
          <div className="space-y-1">
            <p className="font-medium text-foreground/80">Calculated Post Size:</p>
            <p className="text-primary font-semibold">
              {breakdown.calculated_post_size.replace('_', ' ').toUpperCase()}
            </p>
            {breakdown.calculated_post_size !== '3ply_2x6' && (
              <p className="text-orange-600 text-xs">⚠ Upgrade from base 3ply 2x6</p>
            )}
          </div>
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="font-medium text-foreground/80">Gable Posts:</p>
              <p>{breakdown.gable_post_total} posts</p>
              <p>{breakdown.gable_post_total_lf} LF</p>
              <p className="text-xs text-muted-foreground">{breakdown.gable_post_breakdown}</p>
            </div>
            
            <div>
              <p className="font-medium text-foreground/80">Eave Posts:</p>
              <p>{breakdown.eave_post_total} posts @ {breakdown.eave_post_length}'</p>
              <p>{breakdown.eave_post_total_lf} LF</p>
              <p className="text-xs text-muted-foreground">(-2 from calculated total)</p>
            </div>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Total Posts:</span>
              <span>{breakdown.all_post_total} posts ({breakdown.all_post_total_lf} LF)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};