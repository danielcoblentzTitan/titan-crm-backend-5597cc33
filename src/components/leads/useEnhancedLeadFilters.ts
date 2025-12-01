import { useMemo, useState, useEffect } from "react";
import { Lead } from "@/services/supabaseService";
import { estimatesService } from "@/services/estimatesService";

export const useEnhancedLeadFilters = (leads: Lead[]) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [leadsWithEstimates, setLeadsWithEstimates] = useState<Set<string>>(new Set());

  // Fetch estimates for all leads to determine which have actual estimates
  useEffect(() => {
    const checkEstimates = async () => {
      const leadIds = leads.map(lead => lead.id);
      const leadsWithEstimateSet = new Set<string>();
      
      // Check each lead for existing manual estimates (not auto-generated)
      await Promise.all(leadIds.map(async (leadId) => {
        try {
          const estimates = await estimatesService.getEstimatesByLead(leadId);
          // Only consider manual estimates (not auto-generated) for moving to contacts
          if (estimates && estimates.some(estimate => !estimate.is_auto_generated)) {
            leadsWithEstimateSet.add(leadId);
          }
        } catch (error) {
          console.error(`Error fetching estimates for lead ${leadId}:`, error);
        }
      }));
      
      setLeadsWithEstimates(leadsWithEstimateSet);
    };

    if (leads.length > 0) {
      checkEstimates();
    }
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let filtered = leads.filter((lead) => {
      // Search filter
      const searchMatch = !searchTerm || 
        lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.includes(searchTerm);

      return searchMatch;
    });

    return filtered;
  }, [leads, searchTerm, sortField, sortDirection]);

  // Separate active leads (no actual estimates) from contacts (have actual estimates)
  const activeLeads = useMemo(() => {
    let active = filteredLeads.filter(lead => !leadsWithEstimates.has(lead.id));

    // Apply sorting for active leads
    if (sortField) {
      active.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
            bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
            break;
          case 'timeline':
            const timelineOrder = { '0-3 Months': 1, '3-6 Months': 2, '6-12 Months': 3, '12+ Months': 4 };
            aValue = timelineOrder[a.timeline as keyof typeof timelineOrder] || 99;
            bValue = timelineOrder[b.timeline as keyof typeof timelineOrder] || 99;
            break;
          case 'assigned_to':
            aValue = a.assigned_to || 'zzz';
            bValue = b.assigned_to || 'zzz';
            break;
          case 'estimated_value':
            aValue = a.estimated_value || 0;
            bValue = b.estimated_value || 0;
            break;
          case 'days_since_catch':
            const getDaysSinceCatch = (createdAt: string, firstContactDate?: string) => {
              const referenceDate = firstContactDate ? new Date(firstContactDate) : new Date(createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
              return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };
            aValue = getDaysSinceCatch(a.created_at, a.first_contact_date);
            bValue = getDaysSinceCatch(b.created_at, b.first_contact_date);
            break;
          case 'building_type':
            aValue = a.building_type || 'zzz';
            bValue = b.building_type || 'zzz';
            break;
          case 'city':
            aValue = a.city || 'zzz';
            bValue = b.city || 'zzz';
            break;
          case 'state':
            aValue = a.state || 'zzz';
            bValue = b.state || 'zzz';
            break;
          case 'county':
            aValue = a.county || 'zzz';
            bValue = b.county || 'zzz';
            break;
          case 'zip':
            aValue = a.zip || 'zzz';
            bValue = b.zip || 'zzz';
            break;
          case 'phone':
            aValue = a.phone || 'zzz';
            bValue = b.phone || 'zzz';
            break;
          case 'email':
            aValue = a.email || 'zzz';
            bValue = b.email || 'zzz';
            break;
          case 'width':
            aValue = a.building_specifications?.dimensions?.width || 0;
            bValue = b.building_specifications?.dimensions?.width || 0;
            break;
          case 'length':
            aValue = a.building_specifications?.dimensions?.length || 0;
            bValue = b.building_specifications?.dimensions?.length || 0;
            break;
          case 'height':
            aValue = a.building_specifications?.dimensions?.height || 0;
            bValue = b.building_specifications?.dimensions?.height || 0;
            break;
          case 'created_at':
            aValue = new Date(a.created_at || 0).getTime();
            bValue = new Date(b.created_at || 0).getTime();
            break;
          default:
            aValue = a[sortField as keyof Lead] || '';
            bValue = b[sortField as keyof Lead] || '';
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return active;
  }, [filteredLeads, sortField, sortDirection, leadsWithEstimates]);

  const contactLeads = useMemo(() => {
    let contacts = filteredLeads.filter(lead => leadsWithEstimates.has(lead.id));

    // Apply sorting for contacts
    if (sortField) {
      contacts.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'name':
            aValue = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
            bValue = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
            break;
          case 'timeline':
            const timelineOrder = { '0-3 Months': 1, '3-6 Months': 2, '6-12 Months': 3, '12+ Months': 4 };
            aValue = timelineOrder[a.timeline as keyof typeof timelineOrder] || 99;
            bValue = timelineOrder[b.timeline as keyof typeof timelineOrder] || 99;
            break;
          case 'assigned_to':
            aValue = a.assigned_to || 'zzz'; // Put unassigned at the end
            bValue = b.assigned_to || 'zzz';
            break;
          case 'estimated_value':
            aValue = a.estimated_value || 0;
            bValue = b.estimated_value || 0;
            break;
          case 'days_since_contact':
            // Calculate days since contact for sorting
            const getDaysSinceCreated = (createdAt: string, firstContactDate?: string) => {
              const referenceDate = firstContactDate ? new Date(firstContactDate) : new Date(createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - referenceDate.getTime());
              return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            };
            aValue = getDaysSinceCreated(a.created_at, a.first_contact_date);
            bValue = getDaysSinceCreated(b.created_at, b.first_contact_date);
            break;
          case 'building_type':
            aValue = a.building_type || 'zzz';
            bValue = b.building_type || 'zzz';
            break;
          case 'city':
            aValue = a.city || 'zzz';
            bValue = b.city || 'zzz';
            break;
          case 'state':
            aValue = a.state || 'zzz';
            bValue = b.state || 'zzz';
            break;
          case 'county':
            aValue = a.county || 'zzz';
            bValue = b.county || 'zzz';
            break;
          case 'zip':
            aValue = a.zip || 'zzz';
            bValue = b.zip || 'zzz';
            break;
          case 'phone':
            aValue = a.phone || 'zzz';
            bValue = b.phone || 'zzz';
            break;
          case 'email':
            aValue = a.email || 'zzz';
            bValue = b.email || 'zzz';
            break;
          case 'width':
            aValue = a.building_specifications?.dimensions?.width || 0;
            bValue = b.building_specifications?.dimensions?.width || 0;
            break;
          case 'length':
            aValue = a.building_specifications?.dimensions?.length || 0;
            bValue = b.building_specifications?.dimensions?.length || 0;
            break;
          case 'height':
            aValue = a.building_specifications?.dimensions?.height || 0;
            bValue = b.building_specifications?.dimensions?.height || 0;
            break;
          case 'created_at':
            aValue = new Date(a.created_at || 0).getTime();
            bValue = new Date(b.created_at || 0).getTime();
            break;
          default:
            aValue = a[sortField as keyof Lead] || '';
            bValue = b[sortField as keyof Lead] || '';
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return contacts;
  }, [filteredLeads, sortField, sortDirection, leadsWithEstimates]);

  const clearFilters = () => {
    setSearchTerm("");
    setSortField(null);
    setSortDirection('asc');
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    return count;
  }, [searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredLeads,
    activeLeads,
    contactLeads,
    clearFilters,
    activeFiltersCount,
    sortField,
    sortDirection,
    handleSort
  };
};