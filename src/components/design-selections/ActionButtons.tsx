import { Button } from "@/components/ui/button";
import { Save, FileText, Download } from "lucide-react";
import { downloadBlankDesignSelectionsPDF } from "@/utils/pdfUtils";

interface ActionButtonsProps {
  isEditing: boolean;
  saving: boolean;
  onSaveAndFinishLater: () => void;
  onSaveAndContinue: () => void;
  onSubmit: () => void;
  allSelectionsComplete: boolean;
}

export const ActionButtons = ({
  isEditing,
  saving,
  onSaveAndFinishLater,
  onSaveAndContinue,
  onSubmit,
  allSelectionsComplete
}: ActionButtonsProps) => {
  return (
    <div className="flex justify-between items-center pt-6">
      <Button 
        variant="outline" 
        onClick={downloadBlankDesignSelectionsPDF}
      >
        <Download className="h-4 w-4 mr-2" />
        Download Blank Form
      </Button>
      
      {isEditing && (
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={onSaveAndFinishLater}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save & Finish Later
          </Button>
          <Button 
            variant="outline" 
            onClick={onSaveAndContinue}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save & Continue
          </Button>
          {allSelectionsComplete && (
            <Button onClick={onSubmit} disabled={saving}>
              <FileText className="h-4 w-4 mr-2" />
              Submit Selections
            </Button>
          )}
        </div>
      )}
    </div>
  );
};