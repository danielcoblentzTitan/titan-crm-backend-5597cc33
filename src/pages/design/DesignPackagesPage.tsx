import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { DesignPackages } from "@/components/design/DesignPackages";
import { masterSelectionsService } from "@/services/masterSelectionsService";

export default function DesignPackagesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('project_name')
        .eq('id', projectId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId
  });

  const handleApplyPackage = async (packageData: any) => {
    try {
      // Apply interior selections
      if (packageData.interior) {
        await masterSelectionsService.updateMasterInterior(projectId!, packageData.interior);
        
        // Propagate to existing non-overridden rooms
        await masterSelectionsService.propagateDefaultsToRooms(projectId!, {
          onlyNonOverridden: true
        });
      }

      // Apply exterior selections
      if (packageData.exterior) {
        await masterSelectionsService.updateMasterExterior(projectId!, packageData.exterior);
      }

      toast({
        title: "Success",
        description: "Design package applied successfully and propagated to existing rooms"
      });

      navigate(`/dashboard/${projectId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply design package",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/dashboard/${projectId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Design Packages</h1>
          <p className="text-muted-foreground">{project?.project_name}</p>
        </div>
      </div>

      <DesignPackages
        projectId={projectId!}
        onApplyPackage={handleApplyPackage}
      />
    </div>
  );
}
