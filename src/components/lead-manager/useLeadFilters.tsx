import { useState, useMemo } from "react";
import { Lead } from "@/services/supabaseService";

export const useLeadFilters = (leads: Lead[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('active');

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(lead => 
          !lead.archived_at && 
          (lead.status === 'New' || 
           lead.status === 'Contacted' || 
           lead.status === 'Qualified') &&
          lead.priority !== 'Hot' &&
          lead.priority !== 'High'
        );
        break;
      case 'decision':
        filtered = filtered.filter(lead => 
          !lead.archived_at && 
          (lead.status === 'Proposal' || lead.status === 'Negotiation')
        );
        break;
      case 'hotlist':
        filtered = filtered.filter(lead => 
          !lead.archived_at && 
          (lead.status === 'Hot List' || lead.priority === 'Hot' || lead.priority === 'High')
        );
        break;
      case 'won':
        filtered = filtered.filter(lead => lead.status === 'Won');
        break;
      case 'lost':
        filtered = filtered.filter(lead => 
          lead.status === 'Lost' || lead.archived_at
        );
        break;
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.first_name.toLowerCase().includes(searchLower) ||
        lead.last_name.toLowerCase().includes(searchLower) ||
        (lead.company && lead.company.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.phone && lead.phone.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(lead => lead.priority === priorityFilter);
    }

    // Filter by assigned team member
    if (assignedToFilter !== 'all') {
      if (assignedToFilter === 'unassigned') {
        filtered = filtered.filter(lead => !lead.assigned_to);
      } else {
        filtered = filtered.filter(lead => lead.assigned_to === assignedToFilter);
      }
    }

    return filtered;
  }, [leads, searchTerm, statusFilter, priorityFilter, assignedToFilter, activeTab]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    assignedToFilter,
    setAssignedToFilter,
    activeTab,
    setActiveTab,
    filteredLeads,
    clearFilters
  };
};