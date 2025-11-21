import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface DesignPackage {
  id: string;
  name: string;
  description?: string;
  style_category?: string;
  package_data: {
    interior?: any;
    exterior?: any;
    included_items?: string[];
  };
}

interface DesignPackagesProps {
  projectId: string;
  onApplyPackage: (packageData: any) => Promise<void>;
}

export const DesignPackages = ({
  projectId,
  onApplyPackage
}: DesignPackagesProps) => {
  const { data: packages, isLoading } = useQuery({
    queryKey: ['design_packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_packages' as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as unknown as DesignPackage[];
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-muted h-64 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Design Packages</h2>
        <p className="text-muted-foreground">
          Apply a complete design package to set all master selections at once
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages?.map(pkg => (
          <Card key={pkg.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{pkg.name}</CardTitle>
                  {pkg.style_category && (
                    <Badge variant="secondary" className="mt-2">
                      {pkg.style_category}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {pkg.package_data?.included_items && (
                  <div>
                    <p className="text-sm font-medium mb-2">Includes:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {pkg.package_data.included_items.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <Button
                className="w-full"
                onClick={() => onApplyPackage(pkg.package_data)}
              >
                Apply This Package
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No design packages available yet</p>
            <p className="text-sm text-muted-foreground">
              Design packages will be added soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
