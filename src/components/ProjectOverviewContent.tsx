
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, DollarSign, Clock } from "lucide-react";

const ProjectOverviewContent = () => {
  return (
    <div className="space-y-6">
      {/* Project Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Johnson Family Barndominium</CardTitle>
            <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>1234 Country Road, Austin, TX 78701</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">65%</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Project Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Start Date</span>
              <span className="text-sm font-medium">March 15, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Estimated Completion</span>
              <span className="text-sm font-medium">September 30, 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Phase</span>
              <span className="text-sm font-medium">Framing & Roofing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Budget</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Budget</span>
              <span className="text-sm font-medium">$285,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Spent to Date</span>
              <span className="text-sm font-medium">$185,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Remaining</span>
              <span className="text-sm font-medium text-green-600">$100,000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Updates</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-l-blue-500 pl-4">
              <p className="font-medium">Framing Completed</p>
              <p className="text-sm text-gray-600">All structural framing has been completed ahead of schedule.</p>
              <p className="text-xs text-gray-500 mt-1">2 days ago</p>
            </div>
            <div className="border-l-4 border-l-green-500 pl-4">
              <p className="font-medium">Roofing Materials Delivered</p>
              <p className="text-sm text-gray-600">All roofing materials have arrived and are ready for installation.</p>
              <p className="text-xs text-gray-500 mt-1">1 week ago</p>
            </div>
            <div className="border-l-4 border-l-yellow-500 pl-4">
              <p className="font-medium">Electrical Permit Approved</p>
              <p className="text-sm text-gray-600">Electrical permit has been approved and work can begin next week.</p>
              <p className="text-xs text-gray-500 mt-1">2 weeks ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectOverviewContent;
