import { EstimateVersionManager } from "./EstimateVersionManager";

interface EstimateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

export const EstimateDialog = ({ isOpen, onOpenChange, leadId, leadName }: EstimateDialogProps) => {
  return (
    <EstimateVersionManager 
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      leadId={leadId}
      leadName={leadName}
    />
  );
};