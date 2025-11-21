
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, LucideIcon, CalendarDays, DollarSign } from "lucide-react";
import CreateChangeOrderDialog from "@/components/CreateChangeOrderDialog";
import { useNavigate } from "react-router-dom";
import DocumentUpload from "@/components/DocumentUpload";
import ScheduleManager from "@/components/ScheduleManager";
import { MasterScheduleView } from "@/components/schedule/MasterScheduleView";
import { RequestPriceModal } from "@/components/pricing/RequestPriceModal";

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  link?: string;
  action?: () => void;
}

interface QuickActionsSidebarProps {
  onQuickAction: (action: string) => void;
  quickActions?: QuickAction[];
}

const QuickActionsSidebar = ({ onQuickAction, quickActions = [] }: QuickActionsSidebarProps) => {
  const navigate = useNavigate();

  const handleActionClick = (action: QuickAction) => {
    if (action.link) {
      navigate(action.link);
    } else if (action.action) {
      action.action();
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center text-sm sm:text-base">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        {quickActions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button 
              key={index}
              variant="outline" 
              className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
              onClick={() => handleActionClick(action)}
            >
              <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="truncate">{action.title}</span>
            </Button>
          );
         })}
        <CreateChangeOrderDialog />
        <DocumentUpload />
        <ScheduleManager />
        <RequestPriceModal onSuccess={() => onQuickAction('price-request-submitted')} />
        
        {/* Master Schedule */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9">
              <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="truncate">Master Schedule</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Master Schedule - All Projects</DialogTitle>
            </DialogHeader>
            <MasterScheduleView />
          </DialogContent>
        </Dialog>
        
        {/* Master Pricing */}
        <Button 
          variant="outline" 
          className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9"
          onClick={() => navigate('/master-pricing')}
        >
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="truncate">Master Pricing</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionsSidebar;
