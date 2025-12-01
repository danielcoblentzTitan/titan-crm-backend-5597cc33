
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EnhancedCustomerPortal } from "@/components/EnhancedCustomerPortal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CustomerPortal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [customerData, setCustomerData] = useState<{projectId: string; customerName: string; project?: any} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CustomerPortal: useEffect triggered, searchParams changed:', Object.fromEntries(searchParams));
    
    // Try to load from sessionStorage first
    const savedData = sessionStorage.getItem('customerPortalData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        console.log('Loaded customer data from sessionStorage:', parsedData);
        setCustomerData(parsedData);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing saved customer data:', error);
        sessionStorage.removeItem('customerPortalData');
      }
    }
    
    fetchCustomerProject();
  }, [searchParams]);

  const fetchCustomerProject = async () => {
    try {
      setLoading(true);
      const projectId = searchParams.get('projectId') || searchParams.get('project');
      const customerName = searchParams.get('customer') || 'Customer';

      console.log('Customer Portal Debug:', { projectId, customerName, searchParams: Object.fromEntries(searchParams) });

      if (!projectId) {
        toast({ title: "Error", description: "No project ID provided.", variant: "destructive" });
        return;
      }

      // Fetch the project directly; RLS allows customers to see their project and builders can see all
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      console.log('Project query result:', { project, error });

      if (error) {
        console.error('Error fetching project:', error);
        toast({ title: "Error", description: "Failed to load project data.", variant: "destructive" });
        return;
      }

      if (!project) {
        console.log('No project found for ID:', projectId);
        toast({ title: "Project Not Found", description: "The requested project could not be found.", variant: "destructive" });
        return;
      }

      console.log('Setting customer data:', { projectId, customerName: decodeURIComponent(customerName), project });
      const customerDataObj = { projectId, customerName: decodeURIComponent(customerName), project };
      setCustomerData(customerDataObj);
      
      // Save to sessionStorage for persistence
      sessionStorage.setItem('customerPortalData', JSON.stringify(customerDataObj));
    } catch (error) {
      console.error('Error fetching customer project:', error);
      toast({ title: "Error", description: "Failed to load project data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your project...</p>
        </div>
      </div>
    );
  }

  if (!customerData) {
    console.log('CustomerPortal: No customer data available, customerData is:', customerData);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>No project data available.</p>
          <button 
            onClick={() => {
              console.log('Retry button clicked, current searchParams:', Object.fromEntries(searchParams));
              sessionStorage.removeItem('customerPortalData'); // Clear saved data
              fetchCustomerProject();
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <EnhancedCustomerPortal 
      projectId={customerData.projectId}
      customerName={customerData.customerName}
      project={customerData.project}
    />
  );
};

export default CustomerPortal;
