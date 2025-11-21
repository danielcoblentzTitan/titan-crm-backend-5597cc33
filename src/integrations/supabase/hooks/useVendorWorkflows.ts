import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RFQ {
  id: string;
  code: string;
  vendor_id: string;
  project_id: string | null;
  subject: string;
  body: string | null;
  status: 'Draft' | 'Sent' | 'Acknowledged' | 'Quoted' | 'Declined' | 'Expired';
  due_date: string | null;
  quote_amount: number | null;
  quote_notes: string | null;
  attachments: any[];
  object_alias: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  vendor_id: string;
  project_id: string | null;
  rfq_id: string | null;
  subject: string;
  body: string | null;
  status: 'Draft' | 'Sent' | 'Acknowledged' | 'In Progress' | 'Delivered' | 'Completed';
  subtotal: number;
  tax: number;
  total: number;
  target_delivery: string | null;
  actual_delivery: string | null;
  attachments: any[];
  object_alias: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleRequest {
  id: string;
  code: string;
  vendor_id: string;
  project_id: string | null;
  subject: string;
  body: string | null;
  status: 'Sent' | 'Acknowledged' | 'Confirmed' | 'Declined' | 'Completed';
  window_start: string | null;
  window_end: string | null;
  confirmed_date: string | null;
  crew_notes: string | null;
  object_alias: string | null;
  created_at: string;
  updated_at: string;
}

// RFQ Hooks
export function useRFQs(vendorId?: string) {
  return useQuery({
    queryKey: ['rfqs', vendorId],
    queryFn: async () => {
      let query = supabase.from('rfqs').select(`
        *,
        vendor:vendors_new(name, code),
        project:projects(name, code)
      `);
      
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rfq: Omit<RFQ, 'id' | 'code' | 'object_alias' | 'created_at' | 'updated_at'>) => {
      // Generate RFQ code using direct query since the function doesn't exist yet
      const { data: existingRfqs } = await supabase.from('rfqs').select('code').order('code', { ascending: false }).limit(1);
      let nextNumber = 1;
      if (existingRfqs && existingRfqs.length > 0) {
        const lastCode = existingRfqs[0].code;
        const match = lastCode.match(/RFQ-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const rfqCode = `RFQ-${nextNumber.toString().padStart(3, '0')}`;
      const objectAlias = `rfq+${rfqCode}@titanbuildings.com`;
      
      const { data, error } = await supabase
        .from('rfqs')
        .insert({
          ...rfq,
          code: rfqCode,
          object_alias: objectAlias,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast({
        title: "Success",
        description: "RFQ created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create RFQ.",
        variant: "destructive",
      });
    },
  });
}

// Purchase Order Hooks
export function usePurchaseOrders(vendorId?: string) {
  return useQuery({
    queryKey: ['purchase_orders', vendorId],
    queryFn: async () => {
      let query = supabase.from('purchase_orders').select(`
        *,
        vendor:vendors_new(name, code),
        project:projects(name, code),
        rfq:rfqs(code, subject)
      `);
      
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (po: Omit<PurchaseOrder, 'id' | 'code' | 'object_alias' | 'created_at' | 'updated_at'>) => {
      // Generate PO code using direct query
      const { data: existingPos } = await supabase.from('purchase_orders').select('code').order('code', { ascending: false }).limit(1);
      let nextNumber = 1;
      if (existingPos && existingPos.length > 0) {
        const lastCode = existingPos[0].code;
        const match = lastCode.match(/PO-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const poCode = `PO-${nextNumber.toString().padStart(3, '0')}`;
      const objectAlias = `po+${poCode}@titanbuildings.com`;
      
      const { data, error } = await supabase
        .from('purchase_orders')
        .insert({
          ...po,
          code: poCode,
          object_alias: objectAlias,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      toast({
        title: "Success",
        description: "Purchase Order created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Purchase Order.",
        variant: "destructive",
      });
    },
  });
}

// Schedule Request Hooks
export function useScheduleRequests(vendorId?: string) {
  return useQuery({
    queryKey: ['schedule_requests', vendorId],
    queryFn: async () => {
      let query = supabase.from('schedule_requests').select(`
        *,
        vendor:vendors_new(name, code),
        project:projects(name, code)
      `);
      
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateScheduleRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (schedule: Omit<ScheduleRequest, 'id' | 'code' | 'object_alias' | 'created_at' | 'updated_at'>) => {
      // Generate Schedule code using direct query  
      const { data: existingSchedules } = await supabase.from('schedule_requests').select('code').order('code', { ascending: false }).limit(1);
      let nextNumber = 1;
      if (existingSchedules && existingSchedules.length > 0) {
        const lastCode = existingSchedules[0].code;
        const match = lastCode.match(/SCH-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      const scheduleCode = `SCH-${nextNumber.toString().padStart(3, '0')}`;
      const objectAlias = `sched+${scheduleCode}@titanbuildings.com`;
      
      const { data, error } = await supabase
        .from('schedule_requests')
        .insert({
          ...schedule,
          code: scheduleCode,
          object_alias: objectAlias,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule_requests'] });
      toast({
        title: "Success",
        description: "Schedule Request created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Schedule Request.",
        variant: "destructive",
      });
    },
  });
}

// Email sending hook
export function useSendVendorEmail() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailData: {
      vendor_id: string;
      object_type: string;
      object_id: string;
      subject: string;
      body_html: string;
      body_text: string;
      to_emails: string[];
      cc_emails?: string[];
      merge_data?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-vendor-email', {
        body: emailData
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email.",
        variant: "destructive",
      });
    },
  });
}