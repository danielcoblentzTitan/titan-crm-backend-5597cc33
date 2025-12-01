import React from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, DollarSign, Eye } from "lucide-react";
import type { Project } from "@/services/supabaseService";

interface PaymentData {
  projectId: string;
  totalPaid: number;
  totalBudget: number;
  remainingBalance: number;
  paymentProgress: number;
}

interface ActiveProjectRowProps {
  project: Project;
  payment?: PaymentData;
  onProjectClick: (projectId: string) => void;
  onViewPortal: (e: React.MouseEvent, projectId: string) => void;
}

export const ActiveProjectRow: React.FC<ActiveProjectRowProps> = ({
  project,
  payment,
  onProjectClick,
  onViewPortal,
}) => {

  const formatDate = (dateString: string) => {
    return new Date(dateString.split('T')[0] + 'T12:00:00Z').toLocaleDateString();
  };

  const getProjectTypeDisplay = (description: string) => {
    if (description?.toLowerCase().includes('barndominium')) return 'Barndominium';
    if (description?.toLowerCase().includes('warehouse')) return 'Warehouse';
    if (description?.toLowerCase().includes('garage')) return 'Garage';
    if (description?.toLowerCase().includes('shop')) return 'Shop';
    return 'Building Project';
  };

  return (
    <div
      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onProjectClick(project.id)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-primary hover:text-primary/80 transition-colors truncate">
                  {project.customer_name}
                </h3>
                <button
                  onClick={(e) => onViewPortal(e, project.id)}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                  title="View Customer Portal"
                >
                  <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
                </button>
              </div>
              <Badge variant="secondary" className="self-start">
                {getProjectTypeDisplay(project.description || '')}
              </Badge>
            </div>
          </div>

          {/* Dates */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Start: {formatDate(project.start_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>End: {formatDate(project.estimated_completion)}</span>
            </div>
          </div>
        </div>

        {/* Progress - Payments Only */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 min-w-0 sm:min-w-[200px]">
          {payment && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">Payments</span>
                <span className="text-xs font-medium"> {Math.round(payment.paymentProgress)}%</span>
              </div>
              <Progress value={payment.paymentProgress} className="h-2" />
            </div>
          )}

          {project.budget && payment && (
            <div
              className="flex flex-col gap-1 p-2 rounded border bg-green-50/50 hover:bg-green-100/50 transition-colors cursor-pointer min-w-[140px]"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to payments section via URL query
                window.location.href = '/dashboard?tab=projects&project=' + project.id + '&section=payments';
              }}
            >
              <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>Budget</span>
              </div>
              <div className="text-sm font-semibold text-green-800">
                ${payment.totalBudget.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                Paid: ${payment.totalPaid.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">
                Remaining: ${payment.remainingBalance.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
