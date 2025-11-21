import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Customer, Project } from "@/services/supabaseService";

interface CustomerPortalViewButtonProps {
  customer?: Customer;
  project?: Project;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export const CustomerPortalViewButton = ({ 
  customer, 
  project, 
  size = "sm", 
  variant = "outline" 
}: CustomerPortalViewButtonProps) => {

  // Early return if we don't have the required data
  if (!customer && !project) {
    console.log('CustomerPortalViewButton: No customer or project provided');
    return null;
  }

  const customerName = customer?.name || project?.customer_name;
  const projectId = project?.id;

  // Don't render if we're missing critical data
  if (!projectId || !customerName) {
    console.log('CustomerPortalViewButton: Missing required data:', { projectId, customerName });
    return null;
  }

  const openPortalInNewTab = () => {
    console.log('CustomerPortalViewButton: Opening portal for project:', { project, customerName });
    
    if (project && projectId) {
      // Use 'projectId' parameter to match what CustomerPortal expects
      const portalUrl = `/customer-portal?projectId=${projectId}&customer=${encodeURIComponent(customerName || 'Customer')}`;
      console.log('CustomerPortalViewButton: Opening URL:', portalUrl);
      
      const newWindow = window.open(portalUrl, '_blank');
      if (newWindow) {
        newWindow.addEventListener('load', () => {
          newWindow.scrollTo(0, 0);
        });
      } else {
        console.error('CustomerPortalViewButton: Failed to open new window');
        // Fallback: navigate in current window
        window.location.href = portalUrl;
      }
    } else {
      console.error('CustomerPortalViewButton: Missing project or projectId:', { project, projectId, customerName });
    }
  };

  return (
    <Button 
      size={size} 
      variant={variant}
      onClick={openPortalInNewTab}
      className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
    >
      <Eye className="h-4 w-4 mr-1" />
      View Portal
    </Button>
  );
};