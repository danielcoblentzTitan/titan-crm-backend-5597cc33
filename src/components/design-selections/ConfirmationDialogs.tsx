import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Save, FileText, AlertTriangle } from "lucide-react";

interface ConfirmationDialogsProps {
  showExitConfirmation: boolean;
  showSubmitConfirmation: boolean;
  saving: boolean;
  onCancelExit: () => void;
  onExitConfirmation: () => void;
  onSaveDraft: () => void;
  onConfirmSubmit: () => void;
  onCloseSubmitConfirmation: () => void;
}

export const ConfirmationDialogs = ({
  showExitConfirmation,
  showSubmitConfirmation,
  saving,
  onCancelExit,
  onExitConfirmation,
  onSaveDraft,
  onConfirmSubmit,
  onCloseSubmitConfirmation
}: ConfirmationDialogsProps) => {
  return (
    <>
      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitConfirmation} onOpenChange={() => {}}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span>Unsaved Changes</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your design selections. If you leave now, you'll lose all your current progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelExit}>
              Stay and Continue Editing
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onSaveDraft}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save & Stay"}
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={onExitConfirmation}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Leave Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirmation} onOpenChange={onCloseSubmitConfirmation}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span>Confirm Final Selections</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure these are your final design selections? Once submitted, a PDF summary will be generated and your selections will be sent to the Titan team for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCloseSubmitConfirmation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmSubmit}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              {saving ? "Submitting..." : "Yes, Submit Final Selections"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};