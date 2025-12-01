import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VendorMessage {
  id: string;
  object_id: string;
  vendor_id: string;
  object_type: string;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  from_email: string | null;
  to_emails: string[];
  cc_emails: string[];
  message_id: string | null;
  in_reply_to: string | null;
  status: string | null;
  attachments: any[];
  delivered_at: string | null;
  parsed_commands: any[];
  created_at: string;
}

export function useVendorMessages(objectType?: string, objectId?: string, vendorId?: string) {
  return useQuery({
    queryKey: ['vendor_messages', objectType, objectId, vendorId],
    queryFn: async () => {
      let query = supabase.from('vendor_messages').select('*');
      
      if (objectType && objectId) {
        query = query.eq('object_type', objectType).eq('object_id', objectId);
      }
      
      if (vendorId) {
        query = query.eq('vendor_id', vendorId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as VendorMessage[];
    },
    enabled: !!(objectType && objectId) || !!vendorId
  });
}

export function useVendorMessagesByThread(objectType: string, objectId: string) {
  return useQuery({
    queryKey: ['vendor_messages_thread', objectType, objectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_messages')
        .select(`
          *,
          vendor:vendors_new(name, code, primary_email)
        `)
        .eq('object_type', objectType)
        .eq('object_id', objectId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateObjectStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      objectType, 
      objectId, 
      status, 
      extraFields = {} 
    }: { 
      objectType: string; 
      objectId: string; 
      status: string; 
      extraFields?: Record<string, any> 
    }) => {
      const tableName = getTableName(objectType);
      
      const { data, error } = await supabase
        .from(tableName)
        .update({
          status,
          ...extraFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', objectId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_requests'] });
      queryClient.invalidateQueries({ queryKey: ['vendor_messages'] });
      
      toast({
        title: "Status Updated",
        description: `${variables.objectType.toUpperCase()} status updated to ${variables.status}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });
}

export function useProcessVendorCommand() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({
      messageId,
      objectType,
      objectId,
      commands
    }: {
      messageId: string;
      objectType: string;
      objectId: string;
      commands: any[];
    }) => {
      // Process each command
      for (const cmd of commands) {
        const tableName = getTableName(objectType);
        let updateData: Record<string, any> = {};
        
        switch (cmd.command) {
          case 'ACK':
            updateData.status = 'Acknowledged';
            break;
          case 'QUOTE':
            if (objectType === 'rfq' && cmd.value) {
              updateData.status = 'Quoted';
              updateData.quote_amount = parseFloat(cmd.value);
            }
            break;
          case 'DATE':
            if (cmd.value) {
              if (objectType === 'schedule_request') {
                updateData.status = 'Confirmed';
                updateData.confirmed_date = cmd.value;
              } else if (objectType === 'purchase_order') {
                updateData.actual_delivery = cmd.value;
                updateData.status = 'Delivered';
              }
            }
            break;
          case 'COST':
            if (objectType === 'purchase_order' && cmd.value) {
              updateData.total = parseFloat(cmd.value);
            }
            break;
          case 'YES':
            updateData.status = 'Confirmed';
            break;
          case 'NO':
            updateData.status = 'Declined';
            break;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          
          const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', objectId);
            
          if (error) throw error;
        }
      }
      
      return { processed: commands.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      queryClient.invalidateQueries({ queryKey: ['purchase_orders'] });
      queryClient.invalidateQueries({ queryKey: ['schedule_requests'] });
      
      toast({
        title: "Commands Processed",
        description: `Processed ${data.processed} command(s) from vendor email.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process vendor commands.",
        variant: "destructive",
      });
    },
  });
}

function getTableName(objectType: string): 'rfqs' | 'purchase_orders' | 'schedule_requests' {
  switch (objectType) {
    case 'rfq':
      return 'rfqs';
    case 'purchase_order':
      return 'purchase_orders';
    case 'schedule_request':
      return 'schedule_requests';
    default:
      throw new Error(`Unknown object type: ${objectType}`);
  }
}