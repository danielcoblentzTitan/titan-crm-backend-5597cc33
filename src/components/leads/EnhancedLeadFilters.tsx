import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Filter, Calendar, MapPin, TrendingUp } from "lucide-react";
import { TeamMember } from "@/services/supabaseService";

interface EnhancedLeadFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  stageFilter: string;
  setStageFilter: (stage: string) => void;
  subStatusFilter: string;
  setSubStatusFilter: (status: string) => void;
  assignedToFilter: string;
  setAssignedToFilter: (assigned: string) => void;
  timelineFilter: string;
  setTimelineFilter: (timeline: string) => void;
  countyFilter: string;
  setCountyFilter: (county: string) => void;
  dealsActiveFilter: string;
  setDealsActiveFilter: (active: string) => void;
  teamMembers: TeamMember[];
  clearFilters: () => void;
  activeFiltersCount: number;
}

const stages = [
  'New',
  'Working', 
  'Quoted',
  'Negotiating',
  'Committed', 
  'Won',
  'Lost'
];

const subStatuses = [
  'Recently Quoted',
  'Follow Up',
  'In Decision Making',
  'Pending Land/Budget',
  'Current Customer',
  'Move to Lost',
  'Not Qualified'
];

const timelines = [
  '0-3 Months',
  '3-6 Months', 
  '6-12 Months',
  '12+ Months'
];

export const EnhancedLeadFilters = ({
  searchTerm,
  setSearchTerm,
  stageFilter,
  setStageFilter,
  subStatusFilter,
  setSubStatusFilter,
  assignedToFilter,
  setAssignedToFilter,
  timelineFilter,
  setTimelineFilter,
  countyFilter,
  setCountyFilter,
  dealsActiveFilter,
  setDealsActiveFilter,
  teamMembers,
  clearFilters,
  activeFiltersCount
}: EnhancedLeadFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <h3 className="font-medium">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search leads by name, company, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Stage Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="h-3 w-3" />
                Stage
              </Label>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sub-Status</Label>
              <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All sub-statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sub-statuses</SelectItem>
                  {subStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assigned To</Label>
              <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reps</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeline Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <Calendar className="h-3 w-3" />
                Timeline
              </Label>
              <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All timelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All timelines</SelectItem>
                  {timelines.map((timeline) => (
                    <SelectItem key={timeline} value={timeline}>
                      {timeline}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* County Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="h-3 w-3" />
                County
              </Label>
              <Input
                placeholder="Filter by county"
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Deals Active Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deals Active</Label>
              <Select value={dealsActiveFilter} onValueChange={setDealsActiveFilter}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All deals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All deals</SelectItem>
                  <SelectItem value="true">Active only</SelectItem>
                  <SelectItem value="false">Inactive only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};