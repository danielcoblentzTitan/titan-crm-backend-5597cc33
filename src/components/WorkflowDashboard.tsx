
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, UserCheck, Building2, CheckCircle } from 'lucide-react';
import { Lead, Customer, Project, supabaseService } from '@/services/supabaseService';
import { workflowService } from '@/services/workflowService';
import { useToast } from '@/hooks/use-toast';
import { CustomerPortalViewButton } from './CustomerPortalViewButton';

interface WorkflowStats {
  leads: Lead[];
  customers: Customer[];
  projects: Project[];
}

const WorkflowDashboard = () => {
  const [stats, setStats] = useState<WorkflowStats>({ leads: [], customers: [], projects: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [leads, customers, projects] = await Promise.all([
        supabaseService.getLeads(),
        supabaseService.getCustomers(),
        supabaseService.getProjects()
      ]);
      setStats({ leads, customers, projects });
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertLeadToCustomer = async (lead: Lead) => {
    try {
      await workflowService.convertLeadToCustomer(lead);
      toast({
        title: "Success",
        description: `${lead.first_name} ${lead.last_name} converted to customer`
      });
      loadData();
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: "Error",
        description: "Failed to convert lead to customer",
        variant: "destructive"
      });
    }
  };

  const handleConvertCustomerToProject = async (customer: Customer) => {
    try {
      // Find the original lead's estimated value if available
      const relatedLead = stats.leads.find(l => 
        l.converted_to_customer_id === customer.id
      );
      const estimatedValue = relatedLead?.estimated_value || 0;
      
      await workflowService.convertCustomerToProject(customer, estimatedValue);
      toast({
        title: "Success",
        description: `Project created for ${customer.name}`
      });
      loadData();
    } catch (error) {
      console.error('Error converting customer:', error);
      toast({
        title: "Error",
        description: "Failed to convert customer to project",
        variant: "destructive"
      });
    }
  };

  const createMockData = async () => {
    try {
      await workflowService.createMockWorkflowData();
      toast({
        title: "Success",
        description: "Mock workflow data created successfully"
      });
      loadData();
    } catch (error) {
      console.error('Error creating mock data:', error);
      toast({
        title: "Error",
        description: "Failed to create mock data",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading workflow data...</div>;
  }

  const qualifiedLeads = stats.leads.filter(l => ['Qualified', 'Proposal', 'Negotiation'].includes(l.status || ''));
  const activeProjects = stats.projects.filter(p => p.status !== 'Completed');

  return (
    <div className="container-mobile space-mobile">
      <div className="flex-mobile items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Workflow Dashboard</h2>
        <Button onClick={createMockData} variant="outline" className="w-full sm:w-auto touch-target">
          Create Mock Data
        </Button>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads.length}</div>
            <p className="text-xs text-muted-foreground">
              {qualifiedLeads.length} qualified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects.length}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.projects.reduce((sum, p) => sum + (p.budget || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Project pipeline
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Qualified Leads Ready for Conversion */}
      {qualifiedLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Qualified Leads Ready for Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {qualifiedLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium truncate">
                        {lead.first_name} {lead.last_name}
                      </span>
                      <Badge variant={lead.status === 'Qualified' ? 'default' : 'secondary'}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {lead.company && <span>{lead.company} • </span>}
                      <span>{formatCurrency(lead.estimated_value || 0)}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleConvertLeadToCustomer(lead)}
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Convert to Customer
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customers Ready for Project Creation */}
      {stats.customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Customers Ready for Project Creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.customers.map((customer) => {
                const hasProject = stats.projects.some(p => p.customer_id === customer.id);
                const relatedLead = stats.leads.find(l => l.converted_to_customer_id === customer.id);
                
                return (
                  <div key={customer.id} className="card-mobile">
                    <div className="flex-mobile items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="font-medium truncate">{customer.name}</span>
                          {hasProject && <Badge variant="outline" className="w-fit">Has Project</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span className="truncate">{customer.email}</span>
                          {relatedLead && (
                            <span className="block sm:inline"> • Est. Value: {formatCurrency(relatedLead.estimated_value || 0)}</span>
                          )}
                        </div>
                      </div>
                      {!hasProject && (
                        <Button 
                          onClick={() => handleConvertCustomerToProject(customer)}
                          size="sm"
                          className="w-full sm:w-auto touch-target"
                        >
                          Create Project
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium truncate">{project.name}</span>
                      <Badge variant="secondary">{project.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span>Progress: {project.progress || 0}%</span>
                      <span> • Budget: {formatCurrency(project.budget || 0)}</span>
                      {project.phase && <span> • Phase: {project.phase}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CustomerPortalViewButton project={project} />
                    <div className="text-right">
                      <div className="text-sm font-medium">{project.customer_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Due: {new Date(project.estimated_completion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.leads.length === 0 && stats.customers.length === 0 && stats.projects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No workflow data found.</p>
            <Button onClick={createMockData}>
              Create Mock Data to Get Started
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkflowDashboard;
