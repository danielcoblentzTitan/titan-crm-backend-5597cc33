import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  id: string;
  project_id: string;
  customer_email?: string;
  vendor_emails: any;
  notification_types: any;
  email_frequency: 'immediate' | 'daily' | 'weekly';
  is_active: boolean;
}

export function usePunchlistNotifications(projectId?: string) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('punchlist_notification_settings')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as NotificationSettings);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!projectId) return null;

    try {
      if (settings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('punchlist_notification_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as NotificationSettings);
        return data;
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('punchlist_notification_settings')
          .insert({
            project_id: projectId,
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        setSettings(data as NotificationSettings);
        return data;
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return null;
    }
  };

  const sendTestNotification = async (email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-punchlist-notification', {
        body: {
          type: 'test',
          email: email,
          project_id: projectId,
          message: 'This is a test notification from your punchlist system.'
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [projectId]);

  return {
    settings,
    loading,
    updateSettings,
    sendTestNotification,
    fetchSettings
  };
}