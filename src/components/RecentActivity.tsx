
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, MessageSquare, Calendar, CheckCircle } from "lucide-react";
import { dataService } from "@/services/dataService";

const RecentActivity = () => {
  const [activities, setActivities] = useState(dataService.getActivities());

  useEffect(() => {
    // Refresh activities periodically
    const interval = setInterval(() => {
      setActivities(dataService.getActivities());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "document":
        return "text-blue-600 bg-blue-50";
      case "message":
        return "text-orange-600 bg-orange-50";
      case "milestone":
        return "text-green-600 bg-green-50";
      case "schedule":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "document":
        return FileText;
      case "message":
        return MessageSquare;
      case "milestone":
        return CheckCircle;
      case "schedule":
        return Calendar;
      default:
        return Clock;
    }
  };

  // Show default activities if no real activities exist
  const displayActivities = activities.length > 0 ? activities.slice(0, 5) : [
    {
      id: "1",
      type: "document" as const,
      title: "System initialized",
      project: "Welcome to BarndoBuilder",
      projectId: "welcome",
      time: "Just now",
      status: "completed" as const,
      description: "Your CRM system is ready to use"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-sm sm:text-base">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity) => {
            const IconComponent = getIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getIconColor(activity.type)}`}>
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 leading-tight">{activity.title}</p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(activity.status)} flex-shrink-0`}
                    >
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">{activity.project}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activity.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Activity will appear here as you use the system</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
