import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Users, ToggleLeft, Package } from "lucide-react";
import { ProjectTabConfiguration } from "./project-management/ProjectTabConfiguration";
import { ProjectTypeConfiguration } from "./project-management/ProjectTypeConfiguration";
import CustomerInviteButton from "./CustomerInviteButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { Project, Customer } from "@/services/supabaseService";

interface ProjectSettingsDialogProps {
  project: Project;
  onUpdate?: () => void;
  trigger?: React.ReactNode;
}

export const ProjectSettingsDialog = ({ project, onUpdate, trigger }: ProjectSettingsDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !customer) {
      loadCustomer();
    }
  }, [isOpen]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, email, phone, signed_up_at, created_at, updated_at')
        .eq('id', project.customer_id)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error('Error loading customer:', error);
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ? (
          <button className="flex items-center justify-center">
            {trigger}
          </button>
        ) : (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Project Settings - {project.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tabs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tabs" className="flex items-center gap-2">
              <ToggleLeft className="h-4 w-4" />
              Tab Configuration
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Project Type
            </TabsTrigger>
            <TabsTrigger value="customer" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tabs" className="space-y-4">
            <ProjectTabConfiguration 
              projectId={project.id} 
              projectName={project.name}
            />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <ProjectTypeConfiguration 
              projectId={project.id} 
              projectName={project.name}
            />
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Portal Access</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send an invitation to the customer to access their project portal
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : customer ? (
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{customer.name}</h4>
                      <p className="text-sm text-muted-foreground">{customer.email}</p>
                      {customer.signed_up_at && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Portal access active since {new Date(customer.signed_up_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <CustomerInviteButton 
                      customer={customer} 
                      onInviteSent={() => {
                        loadCustomer();
                        onUpdate?.();
                      }}
                    />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h5 className="font-medium mb-2">Portal Features Available:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• View project progress and timeline</li>
                      <li>• Access project documents and photos</li>
                      <li>• Communicate with the project team</li>
                      <li>• Make design selections (if enabled)</li>
                      <li>• Review and approve change orders</li>
                      <li>• Track financial information and invoices</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Unable to load customer information for this project.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};