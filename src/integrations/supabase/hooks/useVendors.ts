import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  trade: string | null;
  regions: string[];
  status: 'Active' | 'Probation' | 'Inactive' | 'Blacklisted';
  rating: number;
  notes: string | null;
  primary_contact_name: string | null;
  primary_email: string | null;
  phone: string | null;
  inbound_alias: string | null;
  email_prefs: {
    format: string;
    cc_list: string[];
    blackout_hours: string[];
    do_not_email: boolean;
  };
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}

export interface VendorCompliance {
  id: string;
  vendor_id: string;
  type: 'W9' | 'COI' | 'License' | 'NDA' | 'Other';
  file_url: string | null;
  expires_on: string | null;
  status: 'Valid' | 'Expiring' | 'Expired';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors_new')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Vendor[];
    },
  });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors_new')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!id,
  });
}

export function useVendorContacts(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-contacts', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_contacts')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('is_primary', { ascending: false });
      
      if (error) throw error;
      return data as VendorContact[];
    },
    enabled: !!vendorId,
  });
}

export function useVendorCompliance(vendorId: string) {
  return useQuery({
    queryKey: ['vendor-compliance', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_compliance')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('expires_on');
      
      if (error) throw error;
      return data as VendorCompliance[];
    },
    enabled: !!vendorId,
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('vendors_new')
        .delete()
        .eq('id', vendorId);
      
      if (error) throw error;
      return vendorId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (vendor: Omit<Vendor, 'id' | 'code' | 'inbound_alias' | 'created_at' | 'updated_at'>) => {
      // Generate vendor code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_vendor_code');
      if (codeError) throw codeError;
      
      const vendorCode = codeData;
      const inboundAlias = `vendor+${vendorCode}@titanbuildings.com`;
      
      const { data, error } = await supabase
        .from('vendors_new')
        .insert([{
          ...vendor,
          code: vendorCode,
          inbound_alias: inboundAlias,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast({
        title: "Success",
        description: "Vendor created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Vendor> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendors_new')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Vendor;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', data.id] });
      toast({
        title: "Success",
        description: "Vendor updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor.",
        variant: "destructive",
      });
    },
  });
}
