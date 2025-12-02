import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lead, TeamMember } from "@/services/supabaseService";
import { Building, Calendar, DollarSign, Mail, MapPin, MoreHorizontal, Phone, Calculator, Edit, Trash2, User, Clock, FileText, TrendingUp, Archive, RotateCcw, Zap } from "lucide-react";
import CustomerInviteButton from "../CustomerInviteButton";
import { DocumentList } from "../DocumentList";
import { EstimateDialog } from "../EstimateDialog";
import { parseNotesWithEstimateLinks } from "../EstimateLink";
import { LeadDetailDialog } from "./LeadDetailDialog";
import { QuickEstimateDialog } from "../estimates/QuickEstimateDialog";
import { useState } from "react";

interface LeadCardProps {
  lead: Lead;
  teamMembers: TeamMember[];
  updating?: string | null;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onCreateEstimate: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onAddToHotlist?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  updateLeadInPlace?: (leadId: string, updates: Partial<Lead>) => void;
}

export const LeadCard = ({
  lead,
  teamMembers,
  updating,
  onEdit,
  onDelete,
  onCreateEstimate,
  onUpdateStatus,
  onAddToHotlist,
  onArchiveLead,
  updateLeadInPlace
}: LeadCardProps) => {
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [isEstimateManagerOpen, setIsEstimateManagerOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isQuickEstimateOpen, setIsQuickEstimateOpen] = useState(false);
  
  // Check if this is a barndominium lead
  const isBarndo = lead.building_type?.toLowerCase().includes('barndo') || false;
  const initialLivingSqft = (lead as any).building_specifications?.dimensions?.square_footage || 0;
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Qualified':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Proposal':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Negotiation':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Hot List':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Won':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Lost':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const assignedMember = teamMembers.find(m => m.id === lead.assigned_to);

  const getDaysSinceCreated = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSince = getDaysSinceCreated(lead.created_at);
  const isUpdating = updating === lead.id;

  return (
    <>
      {/* Mobile Layout */}
      <div 
        className="block sm:hidden p-4 border rounded-lg bg-background space-y-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsDetailDialogOpen(true)}
      >
        {/* Lead Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">
              {lead.first_name} {lead.last_name}
            </h3>
            {lead.company && (
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Building className="h-4 w-4 mr-2" />
                <span className="truncate">{lead.company}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="px-2"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateEstimate(lead)}>
                <Calculator className="h-4 w-4 mr-2" />
                Create Estimate
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(lead.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={getStatusColor(lead.status || 'New')} variant="outline">
            {lead.status || 'New'}
          </Badge>
          <Badge className={getPriorityColor(lead.priority || 'Medium')} variant="outline">
            {lead.priority || 'Medium'}
          </Badge>
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {daysSince}d
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-1">
          {lead.email && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="h-4 w-4 mr-2" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.phone && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              <span>{lead.phone}</span>
            </div>
          )}
          
          {(lead.city || lead.state) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          
          {lead.estimated_value && (
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              <span>${lead.estimated_value.toLocaleString()}</span>
            </div>
          )}

          {assignedMember && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="h-4 w-4 mr-2" />
              <span>Assigned to {assignedMember.name}</span>
            </div>
          )}
          
          {lead.next_follow_up && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Follow up: {new Date(lead.next_follow_up).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        {lead.notes && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <div className="line-clamp-2 space-y-1">
              {parseNotesWithEstimateLinks(lead.notes, (estimateId) => {
                setIsEstimateManagerOpen(true);
              })}
            </div>
          </div>
        )}

        {/* Primary Actions */}
        <div className="space-y-2">
          {(lead.status === 'New' || lead.status === 'Contacted') && (
            <>
              {isBarndo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsQuickEstimateOpen(true);
                  }}
                  className="w-full h-10 mb-2"
                  disabled={isUpdating}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Estimate
                </Button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEstimate(lead);
                  }}
                  className="h-10"
                  disabled={isUpdating}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Processing...' : 'Estimate'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateStatus(lead.id, 'Qualified');
                  }}
                  disabled={isUpdating}
                  className="text-green-600 hover:text-green-700 h-10"
                >
                  {isUpdating ? 'Updating...' : 'Qualified'}
                </Button>
              </div>
            </>
          )}
          
          {lead.status === 'Qualified' && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(lead.id, 'Proposal');
                }}
                disabled={isUpdating}
                className="text-purple-600 hover:text-purple-700 h-10"
              >
                {isUpdating ? 'Updating...' : 'Proposal'}
              </Button>
              {lead.email && lead.converted_to_customer_id && (
                <CustomerInviteButton 
                  customer={{
                    id: lead.converted_to_customer_id,
                    name: `${lead.first_name} ${lead.last_name}`,
                    email: lead.email,
                    phone: lead.phone || '',
                    address: lead.address,
                    city: lead.city,
                    state: lead.state,
                    zip: lead.zip,
                    notes: lead.notes,
                    created_at: lead.created_at,
                    updated_at: lead.updated_at,
                    signed_up_at: null,
                    user_id: null
                  }}
                  onInviteSent={() => {}}
                />
              )}
            </div>
          )}
          
          {(lead.status === 'Proposal' || lead.status === 'Negotiation') && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(lead.id, 'Won');
                }}
                disabled={isUpdating}
                className="text-green-600 hover:text-green-700 h-10"
              >
                {isUpdating ? 'Updating...' : 'Win'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(lead.id, 'Lost');
                }}
                disabled={isUpdating}
                className="text-red-600 hover:text-red-700 h-10"
              >
                {isUpdating ? 'Updating...' : 'Lose'}
              </Button>
            </div>
          )}
          
          {(lead.status === 'Lost' || lead.archived_at) && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                if (updateLeadInPlace) {
                  updateLeadInPlace(lead.id, { status: 'Proposal', archived_at: null });
                } else {
                  onUpdateStatus(lead.id, 'Proposal');
                }
              }}
              disabled={isUpdating}
              className="text-green-600 hover:text-green-700 w-full h-10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {isUpdating ? 'Reactivating...' : 'Reactivate Lead'}
            </Button>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setIsDocumentsDialogOpen(true);
            }}
            className="text-xs"
          >
            <FileText className="h-4 w-4 mr-1" />
            Documents
          </Button>
          
          {lead.status === 'Qualified' && onAddToHotlist && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddToHotlist(lead.id)}
              className="text-orange-600 hover:text-orange-700 text-xs"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Hot List
            </Button>
          )}

          {lead.status !== 'New' && lead.status !== 'Contacted' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onUpdateStatus(lead.id, 'Lost')}
              disabled={isUpdating}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              Not Qualified
            </Button>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <Card 
        className="hidden sm:flex hover:shadow-md transition-shadow h-full flex-col cursor-pointer"
        onClick={() => setIsDetailDialogOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-base">
                {lead.first_name} {lead.last_name}
              </h3>
              {lead.company && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-3 w-3 mr-1" />
                  {lead.company}
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(lead)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Lead
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateEstimate(lead)}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Create Estimate
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(lead.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Lead
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge className={getStatusColor(lead.status || 'New')} variant="outline">
              {lead.status || 'New'}
            </Badge>
            <Badge className={getPriorityColor(lead.priority || 'Medium')} variant="outline">
              {lead.priority || 'Medium'}
            </Badge>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {daysSince}d
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2 text-sm">
              {lead.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              
              {lead.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{lead.phone}</span>
                </div>
              )}
              
              {(lead.city || lead.state) && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
              
              {lead.estimated_value && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>${lead.estimated_value.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {assignedMember && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>Assigned to {assignedMember.name}</span>
              </div>
            )}
            
            {lead.next_follow_up && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Follow up: {new Date(lead.next_follow_up).toLocaleDateString()}</span>
              </div>
            )}
            
            {lead.notes && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <div className="line-clamp-2 space-y-1">
                  {parseNotesWithEstimateLinks(lead.notes, (estimateId) => {
                    setIsEstimateManagerOpen(true);
                  })}
                </div>
              </div>
            )}
          </div>
           
           {/* Buttons fixed at bottom with minimal space */}
           <div className="mt-auto pt-3 space-y-2">
             <div className="flex gap-2 mb-2">
               {/* Primary action buttons */}
               {(lead.status === 'New' || lead.status === 'Contacted') && (
                 <>
                    {isBarndo && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsQuickEstimateOpen(true);
                        }}
                        className="flex-1"
                        disabled={isUpdating}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Quick Est
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateEstimate(lead);
                      }}
                     className="flex-1"
                     disabled={isUpdating}
                   >
                     <Calculator className="h-4 w-4 mr-2" />
                     {isUpdating ? 'Processing...' : 'Create Estimate'}
                   </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(lead.id, 'Qualified');
                      }}
                     disabled={isUpdating}
                     className="text-green-600 hover:text-green-700 flex-1"
                   >
                     {isUpdating ? 'Updating...' : 'Qualified'}
                   </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(lead.id, 'Lost');
                      }}
                      disabled={isUpdating}
                      className="text-red-600 hover:text-red-700 flex-1"
                    >
                      {isUpdating ? 'Updating...' : 'Not Qualified'}
                    </Button>
                 </>
               )}
               
               {lead.status === 'Qualified' && (
                 <>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={(e) => {
                         e.stopPropagation();
                         onUpdateStatus(lead.id, 'Proposal');
                       }}
                       disabled={isUpdating}
                       className="text-purple-600 hover:text-purple-700 flex-1"
                     >
                       {isUpdating ? 'Updating...' : 'Proposal'}
                     </Button>
                   {lead.email && lead.converted_to_customer_id && (
                     <CustomerInviteButton 
                       customer={{
                         id: lead.converted_to_customer_id,
                         name: `${lead.first_name} ${lead.last_name}`,
                         email: lead.email,
                         phone: lead.phone || '',
                         address: lead.address,
                         city: lead.city,
                         state: lead.state,
                         zip: lead.zip,
                         notes: lead.notes,
                         created_at: lead.created_at,
                         updated_at: lead.updated_at,
                         signed_up_at: null,
                         user_id: null
                       }}
                       onInviteSent={() => {}}
                     />
                   )}
                 </>
               )}
               
               {(lead.status === 'Proposal' || lead.status === 'Negotiation') && (
                 <>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={(e) => {
                         e.stopPropagation();
                         onUpdateStatus(lead.id, 'Won');
                       }}
                       disabled={isUpdating}
                       className="text-green-600 hover:text-green-700 flex-1"
                     >
                       {isUpdating ? 'Updating...' : 'Win'}
                     </Button>
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={(e) => {
                         e.stopPropagation();
                         onUpdateStatus(lead.id, 'Lost');
                       }}
                       disabled={isUpdating}
                       className="text-red-600 hover:text-red-700 flex-1"
                     >
                       {isUpdating ? 'Updating...' : 'Lose'}
                     </Button>
                    {onAddToHotlist && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToHotlist(lead.id)}
                        disabled={isUpdating}
                        className="text-orange-600 hover:text-orange-700 flex-1"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Hot List
                      </Button>
                    )}
                 </>
               )}
               
               {(lead.status === 'Lost' || lead.archived_at) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (updateLeadInPlace) {
                        updateLeadInPlace(lead.id, { status: 'Proposal', archived_at: null });
                      } else {
                        onUpdateStatus(lead.id, 'Proposal');
                      }
                    }}
                    disabled={isUpdating}
                    className="text-green-600 hover:text-green-700 flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Reactivating...' : 'Reactivate Lead'}
                  </Button>
               )}
             </div>
             
              {/* Secondary action row */}
              <div className="flex gap-2">
                {/* Documents button - always visible */}
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={(e) => {
                     e.stopPropagation();
                     setIsDocumentsDialogOpen(true);
                   }}
                   className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 flex-1"
                 >
                  <FileText className="h-4 w-4 mr-2" />
                  Documents
                </Button>
                
                {/* Archive/Hot List buttons for Qualified leads */}
                {lead.status === 'Qualified' && (
                  <>
                    {onAddToHotlist && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddToHotlist(lead.id)}
                        className="text-orange-600 hover:text-orange-700 flex-1"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Hot List
                      </Button>
                    )}
                    {onArchiveLead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onArchiveLead(lead.id)}
                        className="text-gray-600 hover:text-gray-700 flex-1"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
         </CardContent>
       </Card>

       {/* Documents Dialog */}
       <Dialog open={isDocumentsDialogOpen} onOpenChange={setIsDocumentsDialogOpen}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               Documents - {lead.first_name} {lead.last_name}
             </DialogTitle>
           </DialogHeader>
           <DocumentList
             entityId={lead.id}
             entityType="lead"
             customerView={false}
           />
         </DialogContent>
        </Dialog>

        {/* Estimate Manager Dialog */}
        <EstimateDialog
          isOpen={isEstimateManagerOpen}
          onOpenChange={setIsEstimateManagerOpen}
          leadId={lead.id}
          leadName={`${lead.first_name} ${lead.last_name}`}
        />

        {/* Lead Detail Dialog */}
        <LeadDetailDialog
          lead={lead}
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          onEdit={onEdit}
          onCreateEstimate={onCreateEstimate}
        />

        {/* Quick Estimate Dialog */}
        {isBarndo && (
          <QuickEstimateDialog
            open={isQuickEstimateOpen}
            onOpenChange={setIsQuickEstimateOpen}
            leadId={lead.id}
            leadName={`${lead.first_name} ${lead.last_name}`}
            initialLivingSqft={initialLivingSqft}
          />
        )}
      </>
    );
  };