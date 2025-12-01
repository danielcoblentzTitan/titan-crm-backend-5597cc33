import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PunchlistItem } from '@/hooks/usePunchlist';
import { useVendors } from '@/integrations/supabase/hooks/useVendors';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface PunchlistPrintViewProps {
  items: PunchlistItem[];
  projectName?: string;
}

interface GroupedItems {
  assignee: string;
  assigneeType: 'vendor' | 'team' | 'unassigned';
  items: PunchlistItem[];
}

export function PunchlistPrintView({ items, projectName }: PunchlistPrintViewProps) {
  const { data: vendors = [] } = useVendors();
  const { data: teamMembers = [] } = useTeamMembers();

  const groupedItems: GroupedItems[] = useMemo(() => {
    const groups: { [key: string]: GroupedItems } = {};

    items.forEach(item => {
      let assignee = 'Unassigned';
      let assigneeType: 'vendor' | 'team' | 'unassigned' = 'unassigned';

      if (item.assigned_to_vendor) {
        // Check if it's a vendor (starts with 'vendor-') or team member (starts with 'team-')
        if (item.assigned_to_vendor.startsWith('vendor-')) {
          const vendorId = item.assigned_to_vendor.replace('vendor-', '');
          const vendor = vendors.find(v => v.id === vendorId);
          assignee = vendor?.name || item.assigned_to_vendor;
          assigneeType = 'vendor';
        } else if (item.assigned_to_vendor.startsWith('team-')) {
          const teamId = item.assigned_to_vendor.replace('team-', '');
          const teamMember = teamMembers.find(t => t.id === teamId);
          assignee = teamMember?.name || item.assigned_to_vendor;
          assigneeType = 'team';
        } else {
          // Plain text assignment
          assignee = item.assigned_to_vendor;
          assigneeType = 'vendor';
        }
      }

      if (!groups[assignee]) {
        groups[assignee] = {
          assignee,
          assigneeType,
          items: []
        };
      }

      groups[assignee].items.push(item);
    });

    // Sort groups: unassigned last, others alphabetically
    return Object.values(groups).sort((a, b) => {
      if (a.assignee === 'Unassigned') return 1;
      if (b.assignee === 'Unassigned') return -1;
      return a.assignee.localeCompare(b.assignee);
    });
  }, [items, vendors, teamMembers]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Open': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-6">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }
          }
        `
      }} />

      {/* Header */}
      <div className="text-center mb-8 avoid-break">
        <h1 className="text-3xl font-bold mb-2">Punchlist Work Orders</h1>
        {projectName && <h2 className="text-xl text-gray-600 mb-2">{projectName}</h2>}
        <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
        <hr className="mt-4 border-gray-300" />
      </div>

      {/* Summary */}
      <div className="mb-8 avoid-break">
        <h3 className="text-lg font-semibold mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <strong>Total Items:</strong> {items.length}
          </div>
          <div>
            <strong>Completed:</strong> {items.filter(i => i.status === 'Completed').length}
          </div>
          <div>
            <strong>In Progress:</strong> {items.filter(i => i.status === 'In Progress').length}
          </div>
          <div>
            <strong>Open:</strong> {items.filter(i => i.status === 'Open').length}
          </div>
        </div>
        <hr className="mt-4 border-gray-300" />
      </div>

      {/* Grouped Items */}
      {groupedItems.map((group, groupIndex) => (
        <div key={group.assignee} className={`mb-8 ${groupIndex > 0 ? 'page-break' : ''} avoid-break`}>
          <div className="bg-gray-50 p-4 mb-4 rounded-lg border">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {group.assignee}
              <Badge variant="outline" className="text-xs">
                {group.assigneeType === 'vendor' ? 'Vendor' : 
                 group.assigneeType === 'team' ? 'Team Member' : 'Unassigned'}
              </Badge>
              <span className="text-sm font-normal text-gray-600">
                ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {group.items.map((item, index) => (
              <Card key={item.id} className="border border-gray-200 avoid-break">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm text-gray-600">#{index + 1}</span>
                        <Badge className={getPriorityColor(item.priority)} variant="secondary">
                          {item.priority}
                        </Badge>
                        <Badge className={getStatusColor(item.status)} variant="secondary">
                          {item.status}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-base mb-1">{item.location}</h4>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        {item.due_date && (
                          <div>
                            <strong>Due:</strong> {new Date(item.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <strong>Source:</strong> {item.source === 'customer' ? 'Customer' : 'Internal'}
                        </div>
                        <div>
                          <strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        {item.completed_at && (
                          <div>
                            <strong>Completed:</strong> {new Date(item.completed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signature line */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="border-b border-gray-400 pb-1 mb-1" style={{width: '200px'}}>
                          <span className="text-xs text-gray-500">Completed by</span>
                        </div>
                      </div>
                      <div className="flex-1 ml-8">
                        <div className="border-b border-gray-400 pb-1 mb-1" style={{width: '120px'}}>
                          <span className="text-xs text-gray-500">Date</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t border-gray-300 text-center text-sm text-gray-500">
        <p>Punchlist generated from project management system</p>
      </div>
    </div>
  );
}