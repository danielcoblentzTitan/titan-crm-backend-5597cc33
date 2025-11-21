import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types
export interface PermitJurisdiction {
  id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  portal_url?: string;
  project_types: any[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PermitApplication {
  id: string;
  project_id?: string;
  jurisdiction_id: string;
  project_type: string;
  square_footage?: number;
  estimated_fee?: number;
  status?: string;
  application_date?: string;
  approval_date?: string;
  permit_number?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
  jurisdiction?: PermitJurisdiction;
}

export interface PermitTask {
  id: string;
  application_id: string;
  task_name: string;
  task_order?: number;
  assigned_to?: string;
  status?: string;
  due_date?: string;
  completion_date?: string;
  created_at?: string;
  updated_at?: string;
  notes?: string;
}

// Hooks for jurisdictions
export const useJurisdictions = () => {
  return useQuery({
    queryKey: ["permit-jurisdictions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_jurisdictions")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as PermitJurisdiction[];
    }
  });
};

// Hooks for applications
export const usePermitApplications = () => {
  return useQuery({
    queryKey: ["permit-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_applications")
        .select(`
          *,
          jurisdiction:permit_jurisdictions(*)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PermitApplication[];
    }
  });
};

export const usePermitApplication = (id: string) => {
  return useQuery({
    queryKey: ["permit-application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_applications")
        .select(`
          *,
          jurisdiction:permit_jurisdictions(*)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as PermitApplication;
    },
    enabled: !!id
  });
};

// Hooks for tasks
export const usePermitTasks = (applicationId: string) => {
  return useQuery({
    queryKey: ["permit-tasks", applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permit_tasks")
        .select("*")
        .eq("application_id", applicationId)
        .order("task_order");
      
      if (error) throw error;
      return data as PermitTask[];
    },
    enabled: !!applicationId
  });
};

// Mutations
export const useCreatePermitApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { jurisdiction_id: string; project_type: string; square_footage?: number; estimated_fee?: number; status?: string; notes?: string; }) => {
      const { data: application, error } = await supabase
        .from("permit_applications")
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permit-applications"] });
    }
  });
};

export const useUpdatePermitApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PermitApplication>) => {
      const { data: application, error } = await supabase
        .from("permit_applications")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return application;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["permit-applications"] });
      queryClient.invalidateQueries({ queryKey: ["permit-application", variables.id] });
    }
  });
};

export const useCreatePermitTasks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tasks: { application_id: string; task_name: string; task_order?: number; assigned_to?: string; status?: string; }[]) => {
      const { data, error } = await supabase
        .from("permit_tasks")
        .insert(tasks)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["permit-tasks", variables[0].application_id] });
      }
    }
  });
};

export const useUpdatePermitTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<PermitTask>) => {
      const { data: task, error } = await supabase
        .from("permit_tasks")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["permit-tasks", data.application_id] });
    }
  });
};

// Fee calculation utility
export const calculatePermitFee = (
  jurisdiction: PermitJurisdiction,
  projectType: string,
  squareFootage: number,
  projectValuation?: number,
  isUnincorporated?: boolean,
  isFarmBuilding?: boolean
): number => {
  const projectTypeData = jurisdiction.project_types.find(
    (pt: any) => pt.type === projectType
  );
  
  if (!projectTypeData) return 0;

  // Use provided valuation or estimate from square footage
  const valuation = projectValuation || (squareFootage * 100); // $100/sq ft default
  
  switch (projectTypeData.fee_structure) {
    case 'tiered':
      // Sussex County tiered structure
      const tierLocation = isUnincorporated ? 'unincorporated' : 'municipal';
      const tier = projectTypeData.tiers?.find((t: any) => t.location === tierLocation);
      if (tier) {
        const valuationInThousands = Math.ceil(valuation / 1000);
        if (valuationInThousands <= 1) {
          return tier.first_1000;
        }
        return tier.first_1000 + ((valuationInThousands - 1) * tier.additional_per_1000);
      }
      break;
      
    case 'tiered_with_surcharge':
      // Kent County structure
      const base = projectTypeData.base_calculation;
      const surcharge = projectTypeData.school_surcharge;
      
      let basePermitFee = 0;
      const valuationInThousands = Math.ceil(valuation / 1000);
      
      if (valuation <= 1000000) {
        basePermitFee = valuationInThousands * base.rate_per_1000;
      } else {
        const firstMillion = 1000 * base.rate_per_1000;
        const overMillion = Math.ceil((valuation - 1000000) / 1000) * base.over_1m_rate;
        basePermitFee = firstMillion + overMillion;
      }
      
      const minimum = isFarmBuilding ? (base.farm_minimum || base.minimum) : base.minimum;
      basePermitFee = Math.max(basePermitFee, minimum);
      
      const schoolSurchargeFee = valuation * (surcharge.rate / 100);
      return basePermitFee + schoolSurchargeFee;
      
    case 'multi_component':
      // New Castle County structure
      let totalFee = 0;
      let permitReviewFeeAmount = 0;
      
      for (const component of projectTypeData.components) {
        switch (component.name) {
          case 'Permit Review Fee':
            const valuationInThousands = Math.ceil(valuation / 1000);
            
            if (valuation <= 1000000) {
              permitReviewFeeAmount = valuationInThousands * component.rate_per_1000;
            } else {
              const firstMillion = 1000 * component.rate_per_1000;
              const overMillion = Math.ceil((valuation - 1000000) / 1000) * component.over_1m_rate;
              permitReviewFeeAmount = firstMillion + overMillion;
            }
            
            permitReviewFeeAmount = Math.max(permitReviewFeeAmount, component.minimum);
            totalFee += permitReviewFeeAmount;
            break;
            
          case 'Zoning Review Fee':
            let zoningFee = permitReviewFeeAmount * (component.percentage / 100);
            zoningFee = Math.max(zoningFee, component.minimum);
            zoningFee = Math.min(zoningFee, component.maximum);
            totalFee += zoningFee;
            break;
            
          case 'Volunteer Fire Assistance':
            const vfaValuation = Math.min(valuation, component.max_valuation);
            totalFee += vfaValuation * (component.percentage / 100);
            break;
            
          case 'Certificate of Occupancy':
            totalFee += component.flat_fee;
            break;
        }
      }
      
      return totalFee;
      
    default:
      // Fallback to simple calculation for Maryland counties
      return projectTypeData.base_fee + (squareFootage * projectTypeData.per_sqft);
  }
  
  return projectTypeData.base_fee + (squareFootage * projectTypeData.per_sqft);
};