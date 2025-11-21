import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Edit, History } from "lucide-react";
import { ColorSelectionSection } from "./design-selections/ColorSelectionSection";
import { useDesignSelections } from "@/hooks/useDesignSelections";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { VersionHistory } from "./design-selections/VersionHistory";
import { ConfirmationDialogs } from "./design-selections/ConfirmationDialogs";
import { ActionButtons } from "./design-selections/ActionButtons";
import { generateSelectionsSummaryPDF } from "@/utils/selectionsPdfGenerator";
import { REQUIRED_SELECTIONS, TAB_NAVIGATION } from "@/constants/selectionConstants";

interface DesignSelectionsProps {
  projectId: string;
}

const DesignSelections = ({ projectId }: DesignSelectionsProps) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  
  const { toast } = useToast();
  
  const {
    projectInfo,
    selections,
    setSelections,
    customNotes,
    setCustomNotes,
    loading,
    saving,
    existingDocument,
    currentVersion,
    versions,
    isEditing,
    setIsEditing,
    lastSavedSelections,
    currentTab,
    setCurrentTab,
    formRef,
    handleSaveDraft,
    collectFormData
  } = useDesignSelections(projectId);

  // Track unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(selections) !== JSON.stringify(lastSavedSelections);
    setHasUnsavedChanges(hasChanges);
  }, [selections, lastSavedSelections]);

  // Handle unsaved changes detection
  useUnsavedChanges({
    hasUnsavedChanges,
    onShowExitConfirmation: () => setShowExitConfirmation(true)
  });

  const handleSubmit = async () => {
    // Check if all required selections are made
    const missingSelections = REQUIRED_SELECTIONS.filter(field => !selections[field]);
    
    if (missingSelections.length > 0) {
      toast({
        title: "Incomplete Selections",
        description: "Please complete all required selections before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    setShowSubmitConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    await handleSaveDraft();
    setHasUnsavedChanges(false);
    setShowSubmitConfirmation(false);
    
    // Generate and download PDF summary
    await generateSelectionsSummaryPDF(projectInfo, selections, customNotes);
    
    toast({
      title: "Selections Submitted",
      description: "Your design selections have been submitted and a summary PDF has been generated",
    });
  };

  const handleExitConfirmation = () => {
    setHasUnsavedChanges(false);
    setShowExitConfirmation(false);
    window.history.back();
  };

  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleSaveAndFinishLater = async () => {
    await handleSaveDraft();
    setHasUnsavedChanges(false);
    // Navigate back to dashboard
    window.location.href = '/dashboard';
  };

  const handleSaveAndContinue = async () => {
    await handleSaveDraft();
    // Continue editing - advance to next tab
    const currentIndex = TAB_NAVIGATION.indexOf(currentTab);
    if (currentIndex < TAB_NAVIGATION.length - 1) {
      setCurrentTab(TAB_NAVIGATION[currentIndex + 1]);
    }
    setIsEditing(true);
  };

  // Calculate progress
  const completedSelections = REQUIRED_SELECTIONS.filter(field => selections[field]).length;
  const totalSelections = REQUIRED_SELECTIONS.length;
  const progressPercentage = Math.round((completedSelections / totalSelections) * 100);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading design selections...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header with Design Selections Title and Progress */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Design Selections</h1>
          <div className="flex items-center space-x-2">
            {existingDocument && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <History className="h-3 w-3" />
                <span>Version {currentVersion}</span>
              </Badge>
            )}
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Selection Progress</span>
            <span className="text-sm text-gray-600">{completedSelections} of {totalSelections} required</span>
          </div>
          <span className="text-sm font-medium text-gray-700">{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2 bg-gray-200 mb-2" />
        <p className="text-xs text-gray-600">
          Complete all required selections to submit your design choices
        </p>
      </div>

      {/* Project Information */}
      <div className="text-center border-b pb-4">
        <div className="flex flex-wrap justify-center gap-8 text-sm">
          <div className="flex items-center space-x-2">
            <span>Project Name:</span>
            <span className="border-b border-dotted border-border px-2 min-w-32">{projectInfo.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Customer Name:</span>
            <span className="border-b border-dotted border-border px-2 min-w-32">{projectInfo.customerName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>Date:</span>
            <span className="border-b border-dotted border-border px-2 min-w-24">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

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

      <ActionButtons
        isEditing={isEditing}
        saving={saving}
        onSaveAndFinishLater={handleSaveAndFinishLater}
        onSaveAndContinue={handleSaveAndContinue}
        onSubmit={handleSubmit}
        allSelectionsComplete={(() => {
          const missingSelections = REQUIRED_SELECTIONS.filter(field => !selections[field]);
          return missingSelections.length === 0;
        })()}
      />

      <VersionHistory versions={versions} />

      <ConfirmationDialogs
        showExitConfirmation={showExitConfirmation}
        showSubmitConfirmation={showSubmitConfirmation}
        saving={saving}
        onCancelExit={handleCancelExit}
        onExitConfirmation={handleExitConfirmation}
        onSaveDraft={handleSaveDraft}
        onConfirmSubmit={handleConfirmSubmit}
        onCloseSubmitConfirmation={() => setShowSubmitConfirmation(false)}
      />
    </div>
  );
};

export default DesignSelections;