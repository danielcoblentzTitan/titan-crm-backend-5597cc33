import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ColorSelectionSection } from "./design-selections/ColorSelectionSection";
import { REQUIRED_SELECTIONS } from "@/constants/selectionConstants";

interface DesignSelectionsProps {
  projectId: string;
}

const DesignSelections = ({ projectId }: DesignSelectionsProps) => {
  const [selections, setSelections] = useState<any>({});
  const [currentTab, setCurrentTab] = useState("exterior");
  const [isEditing] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  const { toast } = useToast();

  // Calculate progress
  const completedSelections = REQUIRED_SELECTIONS.filter(field => selections[field]).length;
  const totalSelections = REQUIRED_SELECTIONS.length;
  const progressPercentage = Math.round((completedSelections / totalSelections) * 100);

  const handleSave = () => {
    toast({
      title: "Selections Saved",
      description: "Your design selections have been saved locally.",
    });
  };

  const handleSubmit = () => {
    const missingSelections = REQUIRED_SELECTIONS.filter(field => !selections[field]);
    
    if (missingSelections.length > 0) {
      toast({
        title: "Incomplete Selections",
        description: `Please complete ${missingSelections.length} more required selections.`,
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Selections Complete!",
      description: "All required selections have been completed.",
    });
  };

  return (
    <div className="w-full p-6 space-y-6">
      {/* Progress Bar */}
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Selection Progress</span>
            <span className="text-sm text-muted-foreground">{completedSelections} of {totalSelections} required</span>
          </div>
          <span className="text-sm font-medium">{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {/* Design Selection Form */}
      <form ref={formRef} className="space-y-6">
        <ColorSelectionSection 
          selections={selections}
          setSelections={setSelections}
          isEditing={isEditing}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          projectId={projectId}
        />
      </form>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleSave}
        >
          Save Progress
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={progressPercentage < 100}
        >
          Complete Selections
        </Button>
      </div>
    </div>
  );
};

export default DesignSelections;