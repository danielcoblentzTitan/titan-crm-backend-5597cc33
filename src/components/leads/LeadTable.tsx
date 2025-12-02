import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lead, TeamMember } from "@/services/supabaseService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  MoreHorizontal, 
  Edit, 
  Calculator, 
  Trash2, 
  TrendingUp, 
  Archive,
  RotateCcw,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { LeadDetailDialog } from "./LeadDetailDialog";
import { EstimateBreakdownModal } from "./EstimateBreakdownModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LeadTableProps {
  activeLeads: Lead[];
  contactLeads: Lead[];
  teamMembers: TeamMember[];
  updating?: string | null;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
  onCreateEstimate: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, status: string) => void;
  onAddToHotlist?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  updateLeadInPlace?: (leadId: string, updates: Partial<Lead>) => void;
  onAssignLead?: (leadId: string, assignedTo: string | null) => void;
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export const LeadTable = ({
  activeLeads,
  contactLeads,
  teamMembers,
  updating,
  onEdit,
  onDelete,
  onCreateEstimate,
  onUpdateStatus,
  onAddToHotlist,
  onArchiveLead,
  updateLeadInPlace,
  onAssignLead,
  sortField,
  sortDirection,
  onSort
}: LeadTableProps) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<any>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  // Sticky bottom horizontal scrollbar syncing (global, always visible)
  const scrollContainerRefs = useRef<HTMLDivElement[]>([]);
  const attachedSet = useRef(new WeakSet<HTMLDivElement>());
  const cleanupRef = useRef<(() => void)[]>([]);
  const bottomScrollerRef = useRef<HTMLDivElement>(null);
  const bottomInnerRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);
  const [bottomWidth, setBottomWidth] = useState(0);

  const computeBottomWidth = () => {
    const widths = scrollContainerRefs.current.map((el) => el?.scrollWidth || 0);
    const max = widths.length ? Math.max(...widths) : 0;
    setBottomWidth(max);
  };

  const syncAllFromBottom = () => {
    const bottom = bottomScrollerRef.current;
    if (!bottom || isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    const scrollLeft = bottom.scrollLeft;
    
    scrollContainerRefs.current.forEach((el) => {
      if (el && el.scrollLeft !== scrollLeft) {
        el.scrollLeft = scrollLeft;
      }
    });
    
    isSyncingRef.current = false;
  };

  const attachListeners = (el: HTMLDivElement) => {
    if (attachedSet.current.has(el)) return;
    attachedSet.current.add(el);

    const syncFromContainer = () => {
      const bottom = bottomScrollerRef.current;
      if (!bottom || isSyncingRef.current) return;
      
      isSyncingRef.current = true;
      bottom.scrollLeft = el.scrollLeft;
      
      // Also sync other containers
      scrollContainerRefs.current.forEach((otherEl) => {
        if (otherEl !== el && otherEl.scrollLeft !== el.scrollLeft) {
          otherEl.scrollLeft = el.scrollLeft;
        }
      });
      
      isSyncingRef.current = false;
    };

    el.addEventListener('scroll', syncFromContainer, { passive: true });

    const ro = new ResizeObserver(() => computeBottomWidth());
    ro.observe(el);

    cleanupRef.current.push(() => {
      el.removeEventListener('scroll', syncFromContainer);
      ro.disconnect();
    });
  };

  const registerScrollContainer = (el: HTMLDivElement | null) => {
    if (el && !scrollContainerRefs.current.includes(el)) {
      scrollContainerRefs.current.push(el);
      attachListeners(el);
      computeBottomWidth();
      
      // Force initial sync after a brief delay to ensure DOM is ready
      setTimeout(() => {
        const bottom = bottomScrollerRef.current;
        if (bottom && el.scrollLeft !== bottom.scrollLeft) {
          bottom.scrollLeft = el.scrollLeft;
        }
      }, 100);
    }
  };

  useEffect(() => {
    computeBottomWidth();

    const onResize = () => computeBottomWidth();
    window.addEventListener('resize', onResize);

    const bottom = bottomScrollerRef.current;
    const onBottomScroll = () => syncAllFromBottom();
    bottom?.addEventListener('scroll', onBottomScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      bottom?.removeEventListener('scroll', onBottomScroll);
      cleanupRef.current.forEach((fn) => fn());
      cleanupRef.current = [];
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'Contacted':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Qualified':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'Proposal':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'Negotiation':
        return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
      case 'Hot List':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'Won':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Lost':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case '0-3 Months':
        return 'bg-red-50 text-red-700 border-red-200';
      case '3-6 Months':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case '6-12 Months':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '12+ Months':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDaysSinceCreated = (createdAt: string, firstContactDate?: string) => {
    try {
      // Handle invalid or missing dates
      if (!createdAt) {
        return 0;
      }
      
      const referenceDate = firstContactDate ? new Date(firstContactDate) : new Date(createdAt);
      const now = new Date();
      
      // Check if dates are valid
      if (isNaN(referenceDate.getTime()) || isNaN(now.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('Error calculating days since created:', error);
      return 0;
    }
  };

  const handleSelectAll = (checked: boolean) => {
    const allLeads = [...activeLeads, ...contactLeads];
    if (checked) {
      setSelectedLeads(allLeads.map(lead => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  const getAssignedMemberName = (assignedTo: string | null) => {
    if (!assignedTo) return "Unassigned";
    const member = teamMembers.find(m => m.id === assignedTo);
    return member ? member.name : "Unknown";
  };

  const getAssignedMemberInitials = (assignedTo: string | null) => {
    const name = getAssignedMemberName(assignedTo);
    if (name === "Unassigned" || name === "Unknown") return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isUpdating = (leadId: string) => updating === leadId;

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  };

  const handleViewEstimate = async (lead: Lead) => {
    if (!lead.estimated_value) {
      toast.error("No estimate available for this lead");
      return;
    }

    setLoadingEstimate(true);
    try {
      // Fetch the estimate associated with this lead
      const { data: estimates, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching estimate:', error);
        toast.error("Failed to load estimate details");
        return;
      }

      if (!estimates || estimates.length === 0) {
        toast.error("No detailed estimate found for this lead");
        return;
      }

      const estimate = estimates[0];
      
      // More flexible check for detailed_breakdown
      const hasBreakdown = estimate.detailed_breakdown && (
        Array.isArray(estimate.detailed_breakdown) || 
        (typeof estimate.detailed_breakdown === 'object' && 
          ((estimate.detailed_breakdown as any).items || Object.keys(estimate.detailed_breakdown).length > 0)
        )
      );
      
      if (!hasBreakdown) {
        toast.error("No detailed breakdown available for this estimate");
        return;
      }

      setSelectedEstimate(estimate);
      setEstimateModalOpen(true);
    } catch (error) {
      console.error('Error loading estimate:', error);
      toast.error("Failed to load estimate details");
    } finally {
      setLoadingEstimate(false);
    }
  };

  // Group leads by time periods
  const groupLeadsByTime = (leads: Lead[]) => {
    const groups = {
      '0-30': { title: 'Quoted Within 30 Days', leads: [] as Lead[] },
      '30-180': { title: '30-180 Days After Quote', leads: [] as Lead[] },
      '180+': { title: '180+ Days After Quote', leads: [] as Lead[] }
    };

    // Handle case where leads array is null or undefined
    if (!leads || !Array.isArray(leads)) {
      return groups;
    }

    leads.forEach(lead => {
      try {
        // Ensure lead has required properties
        if (!lead || !lead.created_at) {
          return;
        }
        
        const days = getDaysSinceCreated(lead.created_at, lead.first_contact_date);
        if (days <= 30) {
          groups['0-30'].leads.push(lead);
        } else if (days <= 180) {
          groups['30-180'].leads.push(lead);
        } else {
          groups['180+'].leads.push(lead);
        }
      } catch (error) {
        console.error('Error processing lead in grouping:', lead, error);
      }
    });

    return groups;
  };

  const contactGroups = groupLeadsByTime(contactLeads || []);

  const renderLeadRow = (lead: Lead) => (
    <TableRow 
      key={lead.id} 
      className="group cursor-pointer hover:bg-transparent"
      onClick={() => handleRowClick(lead)}
    >
      <TableCell 
        onClick={(e) => e.stopPropagation()}
        className="sticky left-0 z-10 bg-[#2c3e50] w-12 pl-0 pr-0"
      >
        <div className="flex items-center justify-center h-full">
          <Checkbox
            checked={selectedLeads.includes(lead.id)}
            onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
            className="border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
        </div>
      </TableCell>
      
      <TableCell className="font-medium sticky left-12 z-10 bg-[#2c3e50] min-w-[180px] max-w-[180px] pl-2 pr-4 text-white">
        <span className="truncate block">{lead.first_name} {lead.last_name}</span>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white min-w-[130px] max-w-[130px] pl-4">
        {lead.estimated_value ? (
          <span className="text-sm font-medium">
            ${Math.round(lead.estimated_value).toLocaleString()}
          </span>
        ) : (
          <span className="text-white/60">—</span>
        )}
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">
        <Badge 
          variant="outline" 
          className={lead.source?.includes('With Design') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
        >
          {lead.source?.includes('With Design') ? '3D Design' : 'No Design'}
        </Badge>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white min-w-[160px] max-w-[160px]">
        <Select
          value={lead.assigned_to || "unassigned"}
          onValueChange={(value) => {
            if (onAssignLead) {
              onAssignLead(lead.id, value === "unassigned" ? null : value);
            }
          }}
        >
          <SelectTrigger className="w-full h-8 text-sm border-0 bg-white/10 hover:bg-white/20 text-white">
            <SelectValue placeholder="Unassigned">
              <span className="text-sm text-white truncate block">
                {getAssignedMemberName(lead.assigned_to)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="unassigned" className="cursor-pointer">
              <span>Unassigned</span>
            </SelectItem>
             {teamMembers.map((member) => (
               <SelectItem key={member.id} value={member.id} className="cursor-pointer">
                 <span>{member.name}</span>
               </SelectItem>
             ))}
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[100px] max-w-[100px] text-center">
        <span className="text-sm">
          {getDaysSinceCreated(lead.created_at, lead.first_contact_date)}
        </span>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">
        <Badge 
          variant="outline" 
          className={`${getStatusColor(lead.status || 'New')} cursor-pointer transition-colors`}
          onClick={() => {
            if (lead.status === 'New') onUpdateStatus(lead.id, 'Contacted');
            else if (lead.status === 'Contacted') onUpdateStatus(lead.id, 'Qualified');
            else if (lead.status === 'Qualified') onUpdateStatus(lead.id, 'Proposal');
          }}
        >
          {lead.status || 'New'}
        </Badge>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[180px] max-w-[180px]">
        <span className="text-sm truncate block">
          {lead.building_type || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[130px] max-w-[130px]">
        {lead.timeline ? (
          <Badge 
            variant="outline" 
            className={getTimelineColor(lead.timeline)}
          >
            {lead.timeline}
          </Badge>
        ) : (
          <span className="text-white/60">—</span>
        )}
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[200px] max-w-[200px]">
        <span className="text-sm truncate block">
          {lead.address ? lead.address.split(',')[0].trim() : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[130px] max-w-[130px]">
        <span className="text-sm truncate block">
          {lead.city || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[80px] max-w-[80px] text-center">
        <span className="text-sm">
          {lead.state || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[130px] max-w-[130px]">
        <span className="text-sm truncate block">
          {lead.county || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[90px] max-w-[90px]">
        <span className="text-sm">
          {lead.zip || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[140px] max-w-[140px]">
        <span className="text-sm">
          {lead.phone || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[220px] max-w-[220px]">
        <span className="text-sm truncate block">
          {lead.email && !lead.email.toLowerCase().includes('noemail') ? lead.email : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[80px] max-w-[80px] text-center">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.width ? `${lead.building_specifications.dimensions.width}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[80px] max-w-[80px] text-center">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.length ? `${lead.building_specifications.dimensions.length}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[80px] max-w-[80px] text-center">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.height ? `${lead.building_specifications.dimensions.height}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white min-w-[110px] max-w-[110px]">
        <span className="text-sm">
          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
        </span>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white min-w-[80px] max-w-[80px]">
        {lead.estimated_value ? (
          <span className="text-sm font-medium">
            ${Math.round(lead.estimated_value).toLocaleString()}
          </span>
        ) : (
          <span className="text-white/60">—</span>
        )}
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <Badge 
          variant="outline" 
          className={lead.source?.includes('With Design') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
        >
          {lead.source?.includes('With Design') ? '3D Design' : 'No Design'}
        </Badge>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white">
        <Select
          value={lead.assigned_to || "unassigned"}
          onValueChange={(value) => {
            if (onAssignLead) {
              onAssignLead(lead.id, value === "unassigned" ? null : value);
            }
          }}
        >
          <SelectTrigger className="w-[140px] h-8 text-sm border-0 bg-white/10 hover:bg-white/20 text-white">
            <SelectValue placeholder="Unassigned">
              <span className="text-sm text-white">
                {getAssignedMemberName(lead.assigned_to)}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            <SelectItem value="unassigned" className="cursor-pointer">
              <span>Unassigned</span>
            </SelectItem>
             {teamMembers.map((member) => (
               <SelectItem key={member.id} value={member.id} className="cursor-pointer">
                 <span>{member.name}</span>
               </SelectItem>
             ))}
          </SelectContent>
        </Select>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {getDaysSinceCreated(lead.created_at, lead.first_contact_date)}
        </span>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white">
        <Badge 
          variant="outline" 
          className={`${getStatusColor(lead.status || 'New')} cursor-pointer transition-colors`}
          onClick={() => {
            if (lead.status === 'New') onUpdateStatus(lead.id, 'Contacted');
            else if (lead.status === 'Contacted') onUpdateStatus(lead.id, 'Qualified');
            else if (lead.status === 'Qualified') onUpdateStatus(lead.id, 'Proposal');
          }}
        >
          {lead.status || 'New'}
        </Badge>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.building_type || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        {lead.timeline ? (
          <Badge 
            variant="outline" 
            className={getTimelineColor(lead.timeline)}
          >
            {lead.timeline}
          </Badge>
        ) : (
          <span className="text-white/60">—</span>
        )}
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.address ? lead.address.split(',')[0].trim() : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.city || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.state || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.county || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.zip || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.phone || '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.email && !lead.email.toLowerCase().includes('noemail') ? lead.email : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.width ? `${lead.building_specifications.dimensions.width}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.length ? `${lead.building_specifications.dimensions.length}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.building_specifications?.dimensions?.height ? `${lead.building_specifications.dimensions.height}'` : '—'}
        </span>
      </TableCell>
      
      <TableCell className="bg-[#2c3e50] text-white">
        <span className="text-sm">
          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
        </span>
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white">
        {lead.estimated_value ? (
          <span className="text-sm font-medium">
            ${Math.round(lead.estimated_value).toLocaleString()}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      
      <TableCell onClick={(e) => e.stopPropagation()} className="bg-[#2c3e50] text-white">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-white/10"
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
            
            {lead.status === 'Qualified' && onAddToHotlist && (
              <DropdownMenuItem onClick={() => onAddToHotlist(lead.id)}>
                <TrendingUp className="h-4 w-4 mr-2" />
                Add to Hot List
              </DropdownMenuItem>
            )}
            
            {(lead.status === 'Lost' || lead.archived_at) ? (
              <DropdownMenuItem 
                onClick={() => {
                  if (updateLeadInPlace) {
                    updateLeadInPlace(lead.id, { status: 'Proposal', archived_at: null });
                  } else {
                    onUpdateStatus(lead.id, 'Proposal');
                  }
                }}
                disabled={isUpdating(lead.id)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reactivate
              </DropdownMenuItem>
            ) : (
              onArchiveLead && (
                <DropdownMenuItem onClick={() => onArchiveLead(lead.id)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )
            )}
            
            <DropdownMenuItem 
              onClick={() => onDelete(lead.id)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  const SortableHeader = ({ field, children, className = "" }: { field: string, children: React.ReactNode, className?: string }) => (
    <TableHead 
      className={`cursor-pointer bg-[#2c3e50] text-white ${className}`}
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1 line-clamp-2">
        {children}
        {onSort && (
          sortField === field ? (
            sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-50" />
          )
        )}
      </div>
    </TableHead>
  );

  const renderActiveLeadsSection = () => {
    if (activeLeads.length === 0) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-4">
          <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-primary bg-muted/50 px-3 py-1 rounded-md">Active Leads</h2>
          <span className="text-sm text-muted-foreground">({activeLeads.length})</span>
        </div>
        
        <div ref={registerScrollContainer} className="rounded-md border overflow-x-auto overflow-y-visible bg-[#2c3e50]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#2c3e50]">
                <TableHead className="w-12 sticky left-0 z-20 bg-[#2c3e50] pl-0 pr-0 text-white">
                  <div className="flex items-center justify-center h-full">
                    <Checkbox
                      checked={activeLeads.every(lead => selectedLeads.includes(lead.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLeads(prev => [...new Set([...prev, ...activeLeads.map(l => l.id)])]);
                        } else {
                          setSelectedLeads(prev => prev.filter(id => !activeLeads.some(l => l.id === id)));
                        }
                      }}
                      className="border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                  </div>
                 </TableHead>
                 <SortableHeader field="name" className="sticky left-12 z-20 min-w-[180px] max-w-[180px] pl-2 pr-4">
                   Lead
                 </SortableHeader>
                 <SortableHeader field="estimated_value" className="min-w-[130px] max-w-[130px] pl-4">
                  Estimated Value
                </SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">Source</TableHead>
                <SortableHeader field="assigned_to" className="min-w-[160px] max-w-[160px]">Assigned To</SortableHeader>
                <SortableHeader field="days_since_catch" className="min-w-[100px] max-w-[100px]">Days Since Catch</SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">Status</TableHead>
                <SortableHeader field="building_type" className="min-w-[180px] max-w-[180px]">Usage</SortableHeader>
                <SortableHeader field="timeline" className="min-w-[130px] max-w-[130px]">Timeline</SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[200px] max-w-[200px]">Project Address</TableHead>
                <SortableHeader field="city" className="min-w-[130px] max-w-[130px]">Project Town</SortableHeader>
                <SortableHeader field="state" className="min-w-[80px] max-w-[80px]">State</SortableHeader>
                <SortableHeader field="county" className="min-w-[130px] max-w-[130px]">County</SortableHeader>
                <SortableHeader field="zip" className="min-w-[90px] max-w-[90px]">Zip</SortableHeader>
                <SortableHeader field="phone" className="min-w-[140px] max-w-[140px]">Phone</SortableHeader>
                <SortableHeader field="email" className="min-w-[220px] max-w-[220px]">Email</SortableHeader>
                <SortableHeader field="width" className="min-w-[80px] max-w-[80px]">Width</SortableHeader>
                <SortableHeader field="length" className="min-w-[80px] max-w-[80px]">Length</SortableHeader>
                <SortableHeader field="height" className="min-w-[80px] max-w-[80px]">Height</SortableHeader>
                <SortableHeader field="created_at" className="min-w-[110px] max-w-[110px]">Catch Date</SortableHeader>
                <TableHead className="w-12 bg-[#2c3e50] text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeLeads.map(renderLeadRow)}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderContactGroup = (groupKey: string, group: { title: string, leads: Lead[] }) => {
    if (group.leads.length === 0) return null;

    return (
      <div key={groupKey} className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-4">
          <div className="h-2 w-2 bg-primary rounded-full"></div>
          <h3 className="text-sm font-medium text-foreground">{group.title}</h3>
          <span className="text-xs text-muted-foreground">({group.leads.length})</span>
        </div>
        
        <div ref={registerScrollContainer} className="rounded-md border overflow-x-auto overflow-y-visible bg-[#2c3e50]">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-[#2c3e50]">
                <TableHead className="w-12 sticky left-0 z-20 bg-[#2c3e50] pl-0 pr-0 text-white">
                  <div className="flex items-center justify-center h-full">
                    <Checkbox
                      checked={group.leads.every(lead => selectedLeads.includes(lead.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLeads(prev => [...new Set([...prev, ...group.leads.map(l => l.id)])]);
                        } else {
                          setSelectedLeads(prev => prev.filter(id => !group.leads.some(l => l.id === id)));
                        }
                      }}
                      className="border-white/40 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                    />
                  </div>
                </TableHead>
                 <SortableHeader field="name" className="sticky left-12 z-20 min-w-[180px] max-w-[180px] pl-2 pr-4">
                   Lead
                 </SortableHeader>
                 <SortableHeader field="estimated_value" className="min-w-[130px] max-w-[130px] pl-4">
                  Estimated Value
                </SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">Source</TableHead>
                <SortableHeader field="assigned_to" className="min-w-[160px] max-w-[160px]">Assigned To</SortableHeader>
                <SortableHeader field="days_since_contact" className="min-w-[100px] max-w-[100px]">Days Since Quote</SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[120px] max-w-[120px]">Status</TableHead>
                <SortableHeader field="building_type" className="min-w-[180px] max-w-[180px]">Usage</SortableHeader>
                <SortableHeader field="timeline" className="min-w-[130px] max-w-[130px]">Timeline</SortableHeader>
                <TableHead className="bg-[#2c3e50] text-white min-w-[200px] max-w-[200px]">Project Address</TableHead>
                <SortableHeader field="city" className="min-w-[130px] max-w-[130px]">Project Town</SortableHeader>
                <SortableHeader field="state" className="min-w-[80px] max-w-[80px]">State</SortableHeader>
                <SortableHeader field="county" className="min-w-[130px] max-w-[130px]">County</SortableHeader>
                <SortableHeader field="zip" className="min-w-[90px] max-w-[90px]">Zip</SortableHeader>
                <SortableHeader field="phone" className="min-w-[140px] max-w-[140px]">Phone</SortableHeader>
                <SortableHeader field="email" className="min-w-[220px] max-w-[220px]">Email</SortableHeader>
                <SortableHeader field="width" className="min-w-[80px] max-w-[80px]">Width</SortableHeader>
                <SortableHeader field="length" className="min-w-[80px] max-w-[80px]">Length</SortableHeader>
                <SortableHeader field="height" className="min-w-[80px] max-w-[80px]">Height</SortableHeader>
                <SortableHeader field="created_at" className="min-w-[110px] max-w-[110px]">Quote Date</SortableHeader>
                <TableHead className="w-12 bg-[#2c3e50] text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.leads.map(renderLeadRow)}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Active Leads Section */}
      {renderActiveLeadsSection()}
      
      {/* Contacts Section */}
      {contactLeads.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-4">
            <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            <h2 className="text-xl font-bold text-primary bg-muted/50 px-3 py-1 rounded-md">Contacts</h2>
            <span className="text-sm text-muted-foreground">({contactLeads.length})</span>
          </div>
          {Object.entries(contactGroups).map(([key, group]) => renderContactGroup(key, group))}
        </div>
      )}
      
      {activeLeads.length === 0 && contactLeads.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No leads found matching your criteria.
        </div>
      )}

      {selectedLead && (
        <LeadDetailDialog
          lead={selectedLead}
          isOpen={isDetailDialogOpen}
          onClose={() => {
            setIsDetailDialogOpen(false);
            setSelectedLead(null);
          }}
          onEdit={onEdit}
          onCreateEstimate={onCreateEstimate}
        />
      )}

      {selectedEstimate && (
        <EstimateBreakdownModal
          isOpen={estimateModalOpen}
          onClose={() => {
            setEstimateModalOpen(false);
            setSelectedEstimate(null);
          }}
          estimate={selectedEstimate}
        />
      )}
      
      {/* Render scrollbar via portal to ensure it's at viewport level */}
      {typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-[#1a252f] bg-[#2c3e50] shadow-[0_-2px_10px_rgba(0,0,0,0.3)] pointer-events-none">
          <div
            ref={bottomScrollerRef}
            className="overflow-x-scroll h-6 pointer-events-auto [&::-webkit-scrollbar]:h-4 [&::-webkit-scrollbar-track]:bg-[#1a252f] [&::-webkit-scrollbar-thumb]:bg-[#4a5f7f] [&::-webkit-scrollbar-thumb]:rounded-md hover:[&::-webkit-scrollbar-thumb]:bg-[#5a7fa0]"
          >
            <div ref={bottomInnerRef} style={{ width: bottomWidth }} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};