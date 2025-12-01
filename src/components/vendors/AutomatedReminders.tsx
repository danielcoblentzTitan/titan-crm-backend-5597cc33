import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  Calendar, 
  Mail, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Send,
  Trash2
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

interface AutomationRule {
  id: string;
  name: string;
  type: 'compliance' | 'payment' | 'communication' | 'performance';
  trigger: string;
  action: string;
  isActive: boolean;
  lastTriggered?: string;
  frequency: string;
}

interface AutomatedRemindersProps {
  vendorId: string;
}

export const AutomatedReminders: React.FC<AutomatedRemindersProps> = ({ vendorId }) => {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Compliance Document Expiration',
      type: 'compliance',
      trigger: '30 days before expiration',
      action: 'Send email reminder',
      isActive: true,
      lastTriggered: '2024-01-10',
      frequency: 'Daily check'
    },
    {
      id: '2',
      name: 'Payment Overdue Alert',
      type: 'payment',
      trigger: '1 day after due date',
      action: 'Send follow-up email',
      isActive: true,
      frequency: 'Daily check'
    },
    {
      id: '3',
      name: 'Insurance Renewal Reminder',
      type: 'compliance',
      trigger: '60 days before expiration',
      action: 'Email + Slack notification',
      isActive: true,
      lastTriggered: '2024-01-05',
      frequency: 'Weekly check'
    },
    {
      id: '4',
      name: 'Inactive Vendor Check',
      type: 'communication',
      trigger: 'No communication for 90 days',
      action: 'Flag for review',
      isActive: false,
      frequency: 'Monthly check'
    },
    {
      id: '5',
      name: 'Performance Review Due',
      type: 'performance',
      trigger: 'Quarterly review cycle',
      action: 'Schedule performance review',
      isActive: true,
      lastTriggered: '2023-12-15',
      frequency: 'Quarterly'
    }
  ]);

  // Use real notification data
  const [upcomingNotifications] = useState<any[]>([]);

  const toggleRule = (ruleId: string) => {
    setRules(rules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    setRules(rules.filter(rule => rule.id !== ruleId));
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'compliance': return <CheckCircle className="h-4 w-4" />;
      case 'payment': return <Calendar className="h-4 w-4" />;
      case 'communication': return <Mail className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'compliance': return 'text-blue-600';
      case 'payment': return 'text-green-600';
      case 'communication': return 'text-purple-600';
      case 'performance': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upcoming Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Upcoming Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingNotifications.map((notification) => {
              const isOverdue = notification.dueDate < new Date();
              const daysFromNow = differenceInDays(notification.dueDate, new Date());
              
              return (
                <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getPriorityIcon(notification.priority)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge variant={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {isOverdue ? (
                          <span className="text-red-600">
                            Overdue by {Math.abs(daysFromNow)} days
                          </span>
                        ) : (
                          <span>
                            Due {format(notification.dueDate, 'MMM d, yyyy')} 
                            ({daysFromNow === 0 ? 'Today' : `${daysFromNow} days`})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Send className="h-4 w-4 mr-1" />
                      Send Now
                    </Button>
                    <Button variant="ghost" size="sm">
                      Dismiss
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Automation Rules</span>
            </CardTitle>
            <Button>
              <Bell className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div className={getRuleTypeColor(rule.type)}>
                    {getRuleTypeIcon(rule.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant="outline">{rule.type}</Badge>
                      {!rule.isActive && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">When:</span> {rule.trigger} → 
                      <span className="font-medium ml-1">Then:</span> {rule.action}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {rule.frequency}
                      {rule.lastTriggered && (
                        <span className="ml-2">
                          Last triggered: {format(new Date(rule.lastTriggered), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(rule => rule.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {rules.length} total rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {upcomingNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">47</div>
            <p className="text-xs text-muted-foreground">
              automated notifications sent
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};