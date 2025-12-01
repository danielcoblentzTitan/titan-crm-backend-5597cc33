import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, DollarSign, FileText, Download, Printer } from "lucide-react";
import { supabaseService, Project, ProjectCosts } from "@/services/supabaseService";

const ReportsManager = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectCosts, setProjectCosts] = useState<Record<string, ProjectCosts>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    // Set up an interval to refresh data every 30 seconds to catch budget updates
    const interval = setInterval(loadData, 30000);
    
    // Listen for budget updates
    const handleCostsUpdate = () => {
      loadData();
    };
    
    window.addEventListener('projectCostsUpdated', handleCostsUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('projectCostsUpdated', handleCostsUpdate);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, costsData] = await Promise.all([
        supabaseService.getProjects(),
        supabaseService.getProjectCosts()
      ]);
      
      setProjects(projectsData);
      
      // Convert costs array to a record keyed by project_id
      const costsRecord: Record<string, ProjectCosts> = {};
      costsData.forEach(cost => {
        costsRecord[cost.project_id] = cost;
      });
      setProjectCosts(costsRecord);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTotalCosts = (costs: ProjectCosts | undefined) => {
    if (!costs) return 0;
    
    // Calculate COGS total
    const cogsTotal = (costs.metal || 0) +
                     (costs.lumber || 0) +
                     (costs.doors_windows || 0) +
                     (costs.garage_doors || 0) +
                     (costs.flooring || 0) +
                     (costs.drywall || 0) +
                     (costs.paint || 0) +
                     (costs.fixtures || 0) +
                     (costs.trim || 0);
    
    // Calculate Subcontractors total
    const subcontractorsTotal = (costs.building_crew || 0) +
                              (costs.concrete || 0) +
                              (costs.electric || 0) +
                              (costs.plumbing || 0) +
                              (costs.hvac || 0) +
                              (costs.drywall_sub || 0) +
                              (costs.painter || 0);
    
    return cogsTotal +
           subcontractorsTotal +
           (costs.additional_cogs || 0) +
           (costs.miscellaneous || 0) +
           (costs.materials || 0) +
           (costs.permits || 0) +
           (costs.equipment || 0);
  };

  const jobCostingData = useMemo(() => {
    return projects.map(project => {
      const costs = projectCosts[project.id] || {} as ProjectCosts;
      
      // Calculate COGS total
      const cogsTotal = (costs.metal || 0) +
                       (costs.lumber || 0) +
                       (costs.doors_windows || 0) +
                       (costs.garage_doors || 0) +
                       (costs.flooring || 0) +
                       (costs.drywall || 0) +
                       (costs.paint || 0) +
                       (costs.fixtures || 0) +
                       (costs.trim || 0);
      
      // Calculate Subcontractors total
      const subcontractorsTotal = (costs.building_crew || 0) +
                                (costs.concrete || 0) +
                                (costs.electric || 0) +
                                (costs.plumbing || 0) +
                                (costs.hvac || 0) +
                                (costs.drywall_sub || 0) +
                                (costs.painter || 0);
      
      const totalCosts = calculateTotalCosts(costs);
      const profit = (project.budget || 0) - totalCosts;
      const profitMargin = project.budget && project.budget > 0 ? (profit / project.budget) * 100 : 0;
      
      return {
        id: project.id,
        name: project.name,
        customerName: project.customer_name,
        status: project.status || 'Planning',
        budget: project.budget || 0,
        cogsTotal,
        subcontractorsTotal,
        otherCosts: (costs.additional_cogs || 0) + (costs.miscellaneous || 0) + (costs.materials || 0) + (costs.permits || 0) + (costs.equipment || 0),
        totalCosts,
        profit,
        profitMargin,
        startDate: project.start_date,
        estimatedCompletion: project.estimated_completion,
        actualCompletion: project.end_date
      };
    });
  }, [projects, projectCosts]);

  const profitabilityData = useMemo(() => {
    return projects.map(project => {
      const costs = projectCosts[project.id];
      const totalCosts = calculateTotalCosts(costs);
      const profit = (project.budget || 0) - totalCosts;
      const profitMargin = project.budget && project.budget > 0 ? (profit / project.budget) * 100 : 0;
      
      return {
        name: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
        budget: project.budget || 0,
        costs: totalCosts,
        profit: profit,
        profitMargin: profitMargin
      };
    });
  }, [projects, projectCosts]);

  const financialSummary = useMemo(() => {
    const totalRevenue = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    const totalCosts = projects.reduce((sum, project) => {
      const costs = projectCosts[project.id];
      return sum + calculateTotalCosts(costs);
    }, 0);
    const totalProfit = totalRevenue - totalCosts;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalProfit,
      averageMargin
    };
  }, [projects, projectCosts]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const printProjectCompletionReport = (project: any) => {
    const costs = projectCosts[project.id] || {} as ProjectCosts;
    const totalCosts = calculateTotalCosts(costs);
    const profit = (project.budget || 0) - totalCosts;
    const profitMargin = project.budget && project.budget > 0 ? (profit / project.budget) * 100 : 0;
    
    // Calculate COGS and subcategory totals
    const cogsTotal = (costs.metal || 0) + (costs.lumber || 0) + (costs.doors_windows || 0) + 
                     (costs.garage_doors || 0) + (costs.flooring || 0) + (costs.drywall || 0) + 
                     (costs.paint || 0) + (costs.fixtures || 0) + (costs.trim || 0);
    
    const subcontractorsTotal = (costs.building_crew || 0) + (costs.concrete || 0) + (costs.electric || 0) + 
                               (costs.plumbing || 0) + (costs.hvac || 0) + (costs.drywall_sub || 0) + 
                               (costs.painter || 0);
    
    const otherCosts = (costs.additional_cogs || 0) + (costs.miscellaneous || 0) + (costs.materials || 0) + 
                      (costs.permits || 0) + (costs.equipment || 0);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Project Completion Report - ${project.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              color: #333;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #003562; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { 
              color: #003562; 
              margin: 0 0 10px 0; 
              font-size: 32px;
            }
            .project-info { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 30px; 
              margin-bottom: 30px; 
            }
            .info-section h3 { 
              color: #003562; 
              margin-bottom: 15px; 
              font-size: 18px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-section p { 
              margin: 8px 0; 
              font-size: 14px;
            }
            .financial-summary {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .cost-breakdown {
              margin: 20px 0;
            }
            .cost-category {
              margin-bottom: 15px;
              padding: 10px;
              border-left: 4px solid #003562;
              background: #f8f9fa;
            }
            .cost-category h4 {
              color: #003562;
              margin: 0 0 10px 0;
              font-size: 16px;
            }
            .cost-item {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 14px;
            }
            .totals { 
              border-top: 3px solid #003562; 
              padding-top: 20px; 
              margin-top: 30px; 
            }
            .total-line { 
              display: flex; 
              justify-content: space-between; 
              margin: 15px 0;
              font-size: 16px;
              padding: 5px 0;
            }
            .final-total { 
              font-size: 24px; 
              font-weight: bold; 
              color: #003562; 
              border-top: 2px solid #003562; 
              padding-top: 15px; 
              margin-top: 20px;
            }
            .profit-positive { color: #28a745; }
            .profit-negative { color: #dc3545; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Project Completion Report</h1>
            <p><strong>${project.name}</strong></p>
            <p>Final Financial Summary</p>
          </div>
          
          <div class="project-info">
            <div class="info-section">
              <h3>Project Details</h3>
              <p><strong>Customer:</strong> ${project.customerName}</p>
              <p><strong>Status:</strong> ${project.status}</p>
              <p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>
              <p><strong>Completion Date:</strong> ${project.actualCompletion ? new Date(project.actualCompletion).toLocaleDateString() : 'In Progress'}</p>
            </div>
            <div class="info-section">
              <h3>Financial Overview</h3>
              <p><strong>Original Budget:</strong> $${project.budget.toLocaleString()}</p>
              <p><strong>Total Costs:</strong> $${totalCosts.toLocaleString()}</p>
              <p><strong>Final Profit:</strong> <span class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${profit.toLocaleString()}</span></p>
              <p><strong>Profit Margin:</strong> <span class="${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${profitMargin.toFixed(1)}%</span></p>
            </div>
          </div>

          <div class="cost-breakdown">
            <h3 style="color: #003562; margin-bottom: 20px; font-size: 20px;">Cost Breakdown</h3>
            
            <div class="cost-category">
              <h4>COGS (Cost of Goods Sold) - $${cogsTotal.toLocaleString()}</h4>
              <div class="cost-item"><span>Metal & Steel:</span><span>$${(costs.metal || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Lumber:</span><span>$${(costs.lumber || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Doors & Windows:</span><span>$${(costs.doors_windows || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Garage Doors:</span><span>$${(costs.garage_doors || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Flooring:</span><span>$${(costs.flooring || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Drywall:</span><span>$${(costs.drywall || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Paint:</span><span>$${(costs.paint || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Fixtures:</span><span>$${(costs.fixtures || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Trim:</span><span>$${(costs.trim || 0).toLocaleString()}</span></div>
            </div>

            <div class="cost-category">
              <h4>Subcontractors - $${subcontractorsTotal.toLocaleString()}</h4>
              <div class="cost-item"><span>Building Crew:</span><span>$${(costs.building_crew || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Concrete:</span><span>$${(costs.concrete || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Electrical:</span><span>$${(costs.electric || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Plumbing:</span><span>$${(costs.plumbing || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>HVAC:</span><span>$${(costs.hvac || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Drywall Subcontractor:</span><span>$${(costs.drywall_sub || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Painter:</span><span>$${(costs.painter || 0).toLocaleString()}</span></div>
            </div>

            <div class="cost-category">
              <h4>Other Costs - $${otherCosts.toLocaleString()}</h4>
              <div class="cost-item"><span>Additional COGS:</span><span>$${(costs.additional_cogs || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Materials:</span><span>$${(costs.materials || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Permits & Fees:</span><span>$${(costs.permits || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Equipment Rental:</span><span>$${(costs.equipment || 0).toLocaleString()}</span></div>
              <div class="cost-item"><span>Miscellaneous:</span><span>$${(costs.miscellaneous || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div class="totals">
            <div class="total-line">
              <span>Project Budget:</span>
              <span>$${project.budget.toLocaleString()}</span>
            </div>
            <div class="total-line">
              <span>Total Project Costs:</span>
              <span>$${totalCosts.toLocaleString()}</span>
            </div>
            <div class="total-line final-total ${profit >= 0 ? 'profit-positive' : 'profit-negative'}">
              <span>Final Profit:</span>
              <span>$${profit.toLocaleString()} (${profitMargin.toFixed(1)}%)</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p><em>Titan Barndominium Construction - Project Completion Summary</em></p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      'Planning': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'On Hold': 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg font-medium">Loading financial reports...</div>
          <div className="text-sm text-gray-500 mt-2">Analyzing project costs and profitability</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="h-6 w-6 mr-2" />
          Financial Reports
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData}>
            Refresh Data
          </Button>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="h-4 w-4 mr-2" /> Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${financialSummary.totalRevenue.toLocaleString()}</div>
            <p className="text-sm text-gray-500">Total Revenue Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><DollarSign className="h-4 w-4 mr-2" /> Profit Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${financialSummary.totalProfit.toLocaleString()}</div>
            <p className="text-sm text-gray-500">Total Profit</p>
            <div className="text-xl font-semibold mt-2">Margin: {financialSummary.averageMargin.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Costing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Costing Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">COGS</TableHead>
                  <TableHead className="text-right">Subcontractors</TableHead>
                  <TableHead className="text-right">Other</TableHead>
                  <TableHead className="text-right">Total Costs</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobCostingData.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.customerName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">${project.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${project.cogsTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${project.subcontractorsTotal.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${project.otherCosts.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-medium">${project.totalCosts.toLocaleString()}</TableCell>
                    <TableCell className={`text-right font-medium ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${project.profit.toLocaleString()}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${project.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {project.profitMargin.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {project.status === 'Completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printProjectCompletionReport(project)}
                          className="text-xs"
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print Report
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Project Profitability</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Bar dataKey="budget" fill="#82ca9d" name="Budget" />
                <Bar dataKey="costs" fill="#e48080" name="Costs" />
                <Bar dataKey="profit" fill="#8884d8" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="costs"
                  isAnimationActive={false}
                  data={profitabilityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={renderCustomizedLabel}
                >
                  {
                    profitabilityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))
                  }
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Cost Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={profitabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="budget" stroke="#82ca9d" name="Budget" />
                <Line type="monotone" dataKey="costs" stroke="#e48080" name="Costs" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportsManager;