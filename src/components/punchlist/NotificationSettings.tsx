import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Plus, X, Send } from 'lucide-react';
import { usePunchlistNotifications } from '@/hooks/usePunchlistNotifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  projectId: string;
}

export function NotificationSettings({ projectId }: NotificationSettingsProps) {
  const { settings, loading, updateSettings, sendTestNotification } = usePunchlistNotifications(projectId);
  const { toast } = useToast();
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const handleToggleNotificationType = async (type: string) => {
    if (!settings) return;

    const currentTypes = (settings.notification_types || []) as string[];
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];

    await updateSettings({ notification_types: updatedTypes });
    toast({
      title: 'Settings Updated',
      description: 'Notification preferences have been saved.',
    });
  };

  const handleAddVendorEmail = async () => {
    if (!newVendorEmail.trim() || !settings) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newVendorEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    const currentEmails = (settings.vendor_emails || []) as string[];
    if (currentEmails.includes(newVendorEmail)) {
      toast({
        title: 'Email Already Added',
        description: 'This email is already in the vendor list.',
        variant: 'destructive',
      });
      return;
    }

    await updateSettings({ 
      vendor_emails: [...currentEmails, newVendorEmail]
    });
    setNewVendorEmail('');
    toast({
      title: 'Email Added',
      description: 'Vendor email has been added to notifications.',
    });
  };

  const handleRemoveVendorEmail = async (email: string) => {
    if (!settings) return;

    const updatedEmails = ((settings.vendor_emails || []) as string[]).filter(e => e !== email);
    await updateSettings({ vendor_emails: updatedEmails });
    toast({
      title: 'Email Removed',
      description: 'Vendor email has been removed from notifications.',
    });
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) return;

    setSendingTest(true);
    const success = await sendTestNotification(testEmail);
    setSendingTest(false);

    if (success) {
      toast({
        title: 'Test Sent',
        description: 'Test notification has been sent successfully.',
      });
      setTestEmail('');
    } else {
      toast({
        title: 'Test Failed',
        description: 'Failed to send test notification. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const notificationTypes = [
    { id: 'item_created', label: 'New Item Created', description: 'When a new punchlist item is added' },
    { id: 'item_completed', label: 'Item Completed', description: 'When an item is marked as complete' },
    { id: 'item_overdue', label: 'Overdue Items', description: 'When items become overdue' },
    { id: 'status_changed', label: 'Status Changes', description: 'When item status is updated' },
    { id: 'comment_added', label: 'New Comments', description: 'When comments are added to items' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on or off all punchlist notifications
              </p>
            </div>
            <Switch
              checked={settings?.is_active || false}
              onCheckedChange={(checked) => updateSettings({ is_active: checked })}
            />
          </div>

          {settings?.is_active && (
            <>
              {/* Customer Email */}
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={settings?.customer_email || ''}
                  onChange={(e) => updateSettings({ customer_email: e.target.value })}
                  placeholder="customer@example.com"
                />
                <p className="text-sm text-muted-foreground">
                  Primary email for customer notifications
                </p>
              </div>

              {/* Email Frequency */}
              <div className="space-y-2">
                <Label>Email Frequency</Label>
                <Select
                  value={settings?.email_frequency || 'immediate'}
                  onValueChange={(value: 'immediate' | 'daily' | 'weekly') => 
                    updateSettings({ email_frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Notification Types</Label>
                <div className="space-y-3">
                  {notificationTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                      <Switch
                        checked={((settings?.notification_types || []) as string[]).includes(type.id)}
                        onCheckedChange={() => handleToggleNotificationType(type.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Emails */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Vendor Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Add vendor emails to receive relevant notifications
                </p>
                
                <div className="flex gap-2">
                  <Input
                    value={newVendorEmail}
                    onChange={(e) => setNewVendorEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddVendorEmail()}
                  />
                  <Button onClick={handleAddVendorEmail} size="sm">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {settings?.vendor_emails && (settings.vendor_emails as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(settings.vendor_emails as string[]).map((email) => (
                      <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {email}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleRemoveVendorEmail(email)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Test Notifications */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-medium">Test Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send a test notification to verify your settings
                </p>
                
                <div className="flex gap-2">
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    onKeyPress={(e) => e.key === 'Enter' && handleSendTest()}
                  />
                  <Button 
                    onClick={handleSendTest} 
                    size="sm" 
                    disabled={sendingTest || !testEmail.trim()}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    {sendingTest ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}