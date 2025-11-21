import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Calendar } from 'lucide-react';
import { PunchlistItem } from '@/hooks/usePunchlist';
import { format, differenceInDays } from 'date-fns';

interface OverdueWidgetProps {
  overdueItems: PunchlistItem[];
  dueSoonItems: PunchlistItem[];
}

export function OverdueWidget({ overdueItems, dueSoonItems }: OverdueWidgetProps) {
  const getOverdueDays = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.abs(differenceInDays(today, due));
  };

  if (overdueItems.length === 0 && dueSoonItems.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Due Date Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overdue Items */}
        {overdueItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-600">
                {overdueItems.length} Overdue Item{overdueItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {overdueItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-red-50 rounded-md border border-red-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.location}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {getOverdueDays(item.due_date!)} days overdue
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {overdueItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  And {overdueItems.length - 3} more overdue items...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Due Soon Items */}
        {dueSoonItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-600">
                {dueSoonItems.length} Due Soon (Next 3 Days)
              </span>
            </div>
            <div className="space-y-2">
              {dueSoonItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-md border border-yellow-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.location}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-800">
                      Due {format(new Date(item.due_date!), 'MMM d')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.priority}
                    </Badge>
                  </div>
                </div>
              ))}
              {dueSoonItems.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  And {dueSoonItems.length - 3} more items due soon...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}