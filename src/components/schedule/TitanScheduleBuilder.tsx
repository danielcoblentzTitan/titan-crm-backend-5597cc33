import { EnhancedScheduleBuilder } from "./EnhancedScheduleBuilder";
import { CustomerScheduleView } from "./CustomerScheduleView";

interface TitanScheduleBuilderProps {
  projectId: string;
  customerPortal?: boolean;
}

export function TitanScheduleBuilder({ projectId, customerPortal = false }: TitanScheduleBuilderProps) {
  // Use CustomerScheduleView for customer portal, EnhancedScheduleBuilder for admin
  if (customerPortal) {
    return <CustomerScheduleView projectId={projectId} />;
  }
  
  return <EnhancedScheduleBuilder projectId={projectId} />;
}