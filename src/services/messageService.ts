import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  project_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'builder' | 'customer';
  content: string;
  message_type: 'text' | 'image' | 'file';
  file_path?: string;
  file_name?: string;
  is_customer_facing: boolean;
  parent_message_id?: string;
  created_at: string;
  updated_at: string;
  read_by: string[];
  replies?: Message[];
}

export const messageService = {
  async getProjectMessages(projectId: string, customerFacing?: boolean): Promise<Message[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (customerFacing !== undefined) {
      query = query.eq('is_customer_facing', customerFacing);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    // Organize messages with replies
    const messageMap = new Map<string, Message>();
    const rootMessages: Message[] = [];

    // First pass: create all message objects
    data?.forEach((msg) => {
      const message: Message = {
        ...msg,
        sender_type: msg.sender_type as 'builder' | 'customer',
        message_type: msg.message_type as 'text' | 'image' | 'file',
        read_by: Array.isArray(msg.read_by) ? msg.read_by.map(String) : [],
        replies: []
      };
      messageMap.set(msg.id, message);
    });

    // Second pass: organize into tree structure
    data?.forEach((msg) => {
      const message = messageMap.get(msg.id)!;
      if (msg.parent_message_id) {
        const parent = messageMap.get(msg.parent_message_id);
        if (parent) {
          parent.replies!.push(message);
        }
      } else {
        rootMessages.push(message);
      }
    });

    return rootMessages;
  },

  async sendMessage(
    projectId: string,
    content: string,
    senderName: string,
    senderType: 'builder' | 'customer',
    isCustomerFacing: boolean,
    parentMessageId?: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    filePath?: string,
    fileName?: string
  ): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const messageData = {
      project_id: projectId,
      sender_id: user.id,
      sender_name: senderName,
      sender_type: senderType,
      content,
      message_type: messageType,
      file_path: filePath,
      file_name: fileName,
      is_customer_facing: isCustomerFacing,
      parent_message_id: parentMessageId,
      read_by: [user.id]
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return { 
      ...data, 
      sender_type: data.sender_type as 'builder' | 'customer',
      message_type: data.message_type as 'text' | 'image' | 'file',
      read_by: Array.isArray(data.read_by) ? data.read_by.map(String) : [],
      replies: [] 
    };
  },

  async uploadMessageImage(file: File, projectId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `messages/${projectId}/${fileName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading image:', error);
      throw error;
    }

    return filePath;
  },

  async getImageUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async markAsRead(messageId: string, userId: string): Promise<void> {
    // Get current message to update read_by array
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('read_by')
      .eq('id', messageId)
      .single();

    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      return;
    }

    const readBy = Array.isArray(message.read_by) ? message.read_by.map(String) : [];
    
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      
      const { error } = await supabase
        .from('messages')
        .update({ read_by: readBy })
        .eq('id', messageId);

      if (error) {
        console.error('Error marking message as read:', error);
      }
    }
  },

  async editMessage(messageId: string, newContent: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ 
        content: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  canEditMessage(message: Message, currentUserId?: string): boolean {
    if (!currentUserId || message.sender_id !== currentUserId) return false;
    
    const messageTime = new Date(message.created_at).getTime();
    const now = new Date().getTime();
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    return (now - messageTime) < tenMinutes;
  },

  subscribeToMessages(projectId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const message: Message = {
            ...(payload.new as any),
            sender_type: (payload.new as any).sender_type as 'builder' | 'customer',
            message_type: (payload.new as any).message_type as 'text' | 'image' | 'file',
            read_by: Array.isArray((payload.new as any).read_by) ? (payload.new as any).read_by.map(String) : [],
            replies: []
          };
          callback(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const message: Message = {
            ...(payload.new as any),
            sender_type: (payload.new as any).sender_type as 'builder' | 'customer',
            message_type: (payload.new as any).message_type as 'text' | 'image' | 'file',
            read_by: Array.isArray((payload.new as any).read_by) ? (payload.new as any).read_by.map(String) : [],
            replies: [],
            updated: true
          };
          callback(message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          // Handle message deletion in the UI
          if (payload.old) {
            callback({ ...payload.old as any, deleted: true });
          }
        }
      )
      .subscribe();
  }
};