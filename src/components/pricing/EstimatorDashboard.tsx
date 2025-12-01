import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, FileText, Clock, User, Filter, Upload, Plus, Search, Edit, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PriceRequest {
  id: string;
  project_id: string;
  requested_by_user_id: string;
  scope_summary: string;
  status: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  project: {
    name: string;
    customer_name: string;
  } | null;
  lead: {
    first_name: string;
    last_name: string;
    company: string;
  } | null;
  assigned_estimator: {
    name: string;
    email: string;
  } | null;
  requested_by: {
    first_name: string;
  } | null;
}

interface MasterPricingItem {
  id: string;
  name: string;
  description: string | null;
  unit_type: string;
  base_price: number;
  category_id: string;
  sort_order: number;
  is_active: boolean;
  has_formula: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    description: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
  };
}

interface PricingLine {
  id: string;
  item_label: string;
  qty: number;
  uom: string;
  unit_cost: number;
  lead_time_days: number;
  notes: string | null;
  master_item_id: string | null;
}

export const EstimatorDashboard = () => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [pricingLines, setPricingLines] = useState<PricingLine[]>([]);
  const [masterItems, setMasterItems] = useState<MasterPricingItem[]>([]);
  const [pricingCategories, setPricingCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddToMasterOpen, setIsAddToMasterOpen] = useState(false);
  const [selectedLineForMaster, setSelectedLineForMaster] = useState<PricingLine | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completingRequest, setCompletingRequest] = useState<PriceRequest | null>(null);
  const [isCategorySelectionOpen, setIsCategorySelectionOpen] = useState(false);
  const [pricingLinesForMaster, setPricingLinesForMaster] = useState<(PricingLine & { selectedCategory: string })[]>([]);
  const [newMasterItem, setNewMasterItem] = useState({
    category: '',
    subcategory: '',
    item_name: '',
    vendor: '',
    uom: 'Each',
    base_cost: 0,
    lead_time_days: 0,
    warranty: ''
  });
  const [newPricingLine, setNewPricingLine] = useState({
    item_label: '',
    qty: 1,
    uom: 'Each',
    unit_cost: 0,
    lead_time_days: 0,
    notes: ''
  });
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEstimatorRequests();
    loadMasterItems();
    loadPricingCategories();
  }, [activeTab]);

  const loadEstimatorRequests = async () => {
    try {
      let query = supabase
        .from('price_requests')
        .select(`
          *,
          project:projects(name, customer_name),
          lead:leads(first_name, last_name, company),
          assigned_estimator:team_members(name, email)
        `);

      if (activeTab === "active") {
        query = query.in('status', ['New', 'In Review', 'Need Info']);
      } else if (activeTab === "archived") {
        query = query.eq('status', 'Completed');
      }

      const { data: estimatorRequestsData, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      if (estimatorRequestsData) {
        // Get user details for each request
        const requestsWithUsers = await Promise.all(
          estimatorRequestsData.map(async (request) => {
            if (request.requested_by_user_id) {
              const { data: userProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', request.requested_by_user_id)
                .single();
              
              return {
                ...request,
                requested_by: userProfile ? {
                  first_name: userProfile.full_name?.split(' ')[0] || 'Unknown'
                } : null
              };
            }
            return {
              ...request,
              requested_by: null
            };
          })
        );
        
        setRequests(requestsWithUsers);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      toast({
        title: "Error",
        description: "Failed to load price requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMasterItems = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_items')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Master items loaded:', data);
      setMasterItems(data || []);
    } catch (error) {
      console.error('Error loading master items:', error);
    }
  };

  const loadPricingCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_categories')
        .select('name')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      setPricingCategories(data?.map(cat => cat.name) || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadPricingLines = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('pricing_lines')
        .select('*')
        .eq('price_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPricingLines(data || []);
    } catch (error) {
      console.error('Error loading pricing lines:', error);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      if (newStatus === "Completed") {
        // Open completion dialog instead of directly updating
        const request = requests.find(r => r.id === requestId);
        if (request) {
          setCompletingRequest(request);
          setIsCompletionDialogOpen(true);
        }
        return;
      }
      
      const { error } = await supabase
        .from('price_requests')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request status updated",
      });

      loadEstimatorRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const reactivateRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('price_requests')
        .update({ 
          status: 'New',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request reactivated and moved to active",
      });

      loadEstimatorRequests();
    } catch (error) {
      console.error('Error reactivating request:', error);
      toast({
        title: "Error",
        description: "Failed to reactivate request",
        variant: "destructive",
      });
    }
  };

  const completeRequest = async (addToMaster: boolean) => {
    if (!completingRequest) return;

    if (addToMaster) {
      // Load pricing lines and show category selection
      const { data: pricingLinesData, error: linesError } = await supabase
        .from('pricing_lines')
        .select('*')
        .eq('price_request_id', completingRequest.id);

      if (linesError) {
        console.error('Pricing lines error:', linesError);
        toast({
          title: "Error",
          description: `Failed to load pricing lines: ${linesError.message}`,
          variant: "destructive",
        });
        return;
      }

      if (pricingLinesData && pricingLinesData.length > 0) {
        // Set up pricing lines with default category and show selection dialog
        setPricingLinesForMaster(
          pricingLinesData.map(line => ({
            ...line,
            selectedCategory: pricingCategories[0] || 'Building Shell Addons' // Default to first category
          }))
        );
        setIsCategorySelectionOpen(true);
        setIsCompletionDialogOpen(false);
        return;
      }
    }

    // Complete without adding to master pricing
    await finalizeCompletion(false, []);
  };

  const finalizeCompletion = async (addToMaster: boolean, categorizedLines: (PricingLine & { selectedCategory: string })[]) => {
    if (!completingRequest) return;

    try {
      // Update status to Completed
      const { error: statusError } = await supabase
        .from('price_requests')
        .update({ 
          status: 'Completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', completingRequest.id);

      if (statusError) {
        console.error('Status update error:', statusError);
        throw statusError;
      }

      // If adding to master pricing, add the categorized lines
      if (addToMaster && categorizedLines.length > 0) {
        for (const line of categorizedLines) {
          // First, find or create the category
          let categoryId: string;
          
          const { data: existingCategory } = await supabase
            .from('pricing_categories')
            .select('id')
            .eq('name', line.selectedCategory)
            .maybeSingle();

          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            // Create new category
            const { data: newCategory, error: categoryError } = await supabase
              .from('pricing_categories')
              .insert({
                name: line.selectedCategory,
                description: `${line.selectedCategory} items`,
                sort_order: 999,
                is_active: true
              })
              .select('id')
              .single();

            if (categoryError) throw categoryError;
            categoryId = newCategory.id;
          }

          // Now create the pricing item
          const { error: insertError } = await supabase
            .from('pricing_items')
            .insert({
              category_id: categoryId,
              name: line.item_label,
              unit_type: line.uom || 'each',
              base_price: line.unit_cost || 0,
              is_active: true,
              sort_order: 999,
              has_formula: false
            });

          if (insertError) {
            console.error('Master pricing insert error:', insertError);
            // Continue with other lines even if one fails
          }
        }
      }

      toast({
        title: "Success",
        description: addToMaster ? "Request completed and items added to master pricing" : "Request completed",
      });

      setIsCompletionDialogOpen(false);
      setIsCategorySelectionOpen(false);
      setCompletingRequest(null);
      setPricingLinesForMaster([]);
      loadEstimatorRequests();
      loadMasterItems(); // Refresh master items after adding
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: "Error",
        description: `Failed to complete request: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('price_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Price request deleted",
      });

      loadEstimatorRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    }
  };

  const editRequest = (request: PriceRequest) => {
    setSelectedRequest(request);
    loadPricingLines(request.id);
    setIsRequestDetailOpen(true);
  };

  const addPricingLine = async () => {
    if (!selectedRequest || !newPricingLine.item_label.trim()) {
      toast({
        title: "Error",
        description: "Please enter an item description",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingLineId) {
        // Update existing line
        const { error } = await supabase
          .from('pricing_lines')
          .update({
            item_label: newPricingLine.item_label,
            qty: newPricingLine.qty,
            uom: newPricingLine.uom,
            unit_cost: newPricingLine.unit_cost,
            lead_time_days: newPricingLine.lead_time_days,
            notes: newPricingLine.notes || null
          })
          .eq('id', editingLineId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing line updated",
        });
      } else {
        // Add new line
        const { error } = await supabase
          .from('pricing_lines')
          .insert([
            {
              price_request_id: selectedRequest.id,
              item_label: newPricingLine.item_label,
              qty: newPricingLine.qty,
              uom: newPricingLine.uom,
              unit_cost: newPricingLine.unit_cost,
              lead_time_days: newPricingLine.lead_time_days,
              notes: newPricingLine.notes || null
            }
          ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Pricing line added",
        });
      }

      // Reset form and reload pricing lines
      setNewPricingLine({
        item_label: '',
        qty: 1,
        uom: 'Each',
        unit_cost: 0,
        lead_time_days: 0,
        notes: ''
      });
      setEditingLineId(null);
      setIsAddItemOpen(false);
      loadPricingLines(selectedRequest.id);
    } catch (error) {
      console.error('Error saving pricing line:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing line",
        variant: "destructive",
      });
    }
  };

  const editPricingLine = (line: PricingLine) => {
    setNewPricingLine({
      item_label: line.item_label,
      qty: line.qty,
      uom: line.uom,
      unit_cost: line.unit_cost,
      lead_time_days: line.lead_time_days,
      notes: line.notes || ''
    });
    // Store the line ID to update instead of creating new
    setEditingLineId(line.id);
    setIsAddItemOpen(true);
  };

  const deletePricingLine = async (lineId: string) => {
    try {
      const { error } = await supabase
        .from('pricing_lines')
        .delete()
        .eq('id', lineId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing line deleted",
      });

      // Reload pricing lines
      if (selectedRequest) {
        loadPricingLines(selectedRequest.id);
      }
    } catch (error) {
      console.error('Error deleting pricing line:', error);
      toast({
        title: "Error",
        description: "Failed to delete pricing line",
        variant: "destructive",
      });
    }
  };

  const addToMasterPricing = async () => {
    if (!newMasterItem.item_name.trim() || !newMasterItem.category.trim()) {
      toast({
        title: "Error",
        description: "Please enter item name and category",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, find or create the category
      let categoryId: string;
      
      const { data: existingCategory } = await supabase
        .from('pricing_categories')
        .select('id')
        .eq('name', newMasterItem.category)
        .maybeSingle();

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        // Create new category
        const { data: newCategory, error: categoryError } = await supabase
          .from('pricing_categories')
          .insert({
            name: newMasterItem.category,
            description: `${newMasterItem.category} items`,
            sort_order: 999,
            is_active: true
          })
          .select('id')
          .single();

        if (categoryError) throw categoryError;
        categoryId = newCategory.id;
      }

      // Now create the pricing item
      const { error } = await supabase
        .from('pricing_items')
        .insert([{
          category_id: categoryId,
          name: newMasterItem.item_name,
          description: newMasterItem.subcategory || null,
          unit_type: newMasterItem.uom || 'each',
          base_price: Number(newMasterItem.base_cost) || 0,
          is_active: true,
          sort_order: 999,
          has_formula: false
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item added to master pricing",
      });

      // Reset form and close modal
      setNewMasterItem({
        category: '',
        subcategory: '',
        item_name: '',
        vendor: '',
        uom: 'Each',
        base_cost: 0,
        lead_time_days: 0,
        warranty: ''
      });
      setIsAddToMasterOpen(false);
      setSelectedLineForMaster(null);
      loadMasterItems();
    } catch (error) {
      console.error('Error adding to master pricing:', error);
      toast({
        title: "Error",
        description: "Failed to add item to master pricing",
        variant: "destructive",
      });
    }
  };

  const addLineToMaster = (line: PricingLine) => {
    setSelectedLineForMaster(line);
    setNewMasterItem({
      category: '',
      subcategory: '',
      item_name: line.item_label,
      vendor: '',
      uom: line.uom,
      base_cost: line.unit_cost,
      lead_time_days: line.lead_time_days,
      warranty: ''
    });
    setIsAddToMasterOpen(true);
  };


  const openRequestDetail = (request: PriceRequest) => {
    setSelectedRequest(request);
    loadPricingLines(request.id);
    setIsRequestDetailOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'In Review': return 'bg-yellow-100 text-yellow-800';
      case 'Need Info': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    const projectName = request.project?.name || '';
    const customerName = request.project?.customer_name || '';
    const leadName = request.lead ? `${request.lead.first_name} ${request.lead.last_name}` : '';
    const company = request.lead?.company || '';
    const requesterName = request.requested_by?.first_name || '';
    const estimatorFirstName = request.assigned_estimator?.name?.split(' ')[0] || '';
    
    return projectName.toLowerCase().includes(searchLower) ||
           request.scope_summary.toLowerCase().includes(searchLower) ||
           customerName.toLowerCase().includes(searchLower) ||
           leadName.toLowerCase().includes(searchLower) ||
           company.toLowerCase().includes(searchLower) ||
           requesterName.toLowerCase().includes(searchLower) ||
           estimatorFirstName.toLowerCase().includes(searchLower);
  });

  const getAgeInDays = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estimator Dashboard</h2>
          <p className="text-muted-foreground">Manage price requests and estimates</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Requests */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Price Requests</TabsTrigger>
          <TabsTrigger value="archived">Archived Price Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Price Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Scope Summary</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Assigned Estimator</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          {request.project ? (
                            <>
                              <div className="font-medium">{request.project.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.project.customer_name}
                              </div>
                            </>
                          ) : request.lead ? (
                            <>
                              <div className="font-medium">Lead: {request.lead.first_name} {request.lead.last_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.lead.company}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">No project/lead</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{request.scope_summary}</div>
                      </TableCell>
                      <TableCell>
                        {request.due_date ? (
                          <div className={isOverdue(request.due_date) ? "text-red-600 font-medium" : ""}>
                            {format(new Date(request.due_date), 'MMM dd, yyyy')}
                            {isOverdue(request.due_date) && (
                              <div className="text-xs">OVERDUE</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No deadline</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.requested_by?.first_name || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>{request.assigned_estimator?.name?.split(' ')[0] || 'Not Assigned'}</TableCell>
                      <TableCell>{getAgeInDays(request.created_at)} days</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editRequest(request)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRequest(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openRequestDetail(request)}
                          >
                            View Details
                          </Button>
                          <Select
                            onValueChange={(value) => updateRequestStatus(request.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="In Review">In Review</SelectItem>
                              <SelectItem value="Need Info">Need Info</SelectItem>
                              <SelectItem value="Completed">Complete</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No active price requests found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archived Price Requests ({filteredRequests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Scope Summary</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Assigned Estimator</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          {request.project ? (
                            <>
                              <div className="font-medium">{request.project.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.project.customer_name}
                              </div>
                            </>
                          ) : request.lead ? (
                            <>
                              <div className="font-medium">Lead: {request.lead.first_name} {request.lead.last_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {request.lead.company}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">No project/lead</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{request.scope_summary}</div>
                      </TableCell>
                      <TableCell>
                        {request.due_date ? format(new Date(request.due_date), 'MMM dd, yyyy') : 'No deadline'}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{request.requested_by?.first_name || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>{request.assigned_estimator?.name?.split(' ')[0] || 'Not Assigned'}</TableCell>
                      <TableCell>
                        {format(new Date(request.updated_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => openRequestDetail(request)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateRequest(request.id)}
                          >
                            Reactivate
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRequests.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No archived price requests found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Detail Modal */}
      <Dialog open={isRequestDetailOpen} onOpenChange={setIsRequestDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Price Request Details - {selectedRequest?.project?.name || `Lead: ${selectedRequest?.lead?.first_name} ${selectedRequest?.lead?.last_name}`}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{selectedRequest.project ? 'Project' : 'Lead'}</Label>
                  {selectedRequest.project ? (
                    <>
                      <p className="font-medium">{selectedRequest.project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.project.customer_name}
                      </p>
                    </>
                  ) : selectedRequest.lead ? (
                    <>
                      <p className="font-medium">{selectedRequest.lead.first_name} {selectedRequest.lead.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.lead.company}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">No project/lead assigned</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Scope Summary</Label>
                <p className="mt-1">{selectedRequest.scope_summary}</p>
              </div>

              {/* Pricing Lines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Estimate Lines</h3>
                  <Button onClick={() => setIsAddItemOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>UOM</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Lead Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.item_label}</TableCell>
                        <TableCell>{line.qty}</TableCell>
                        <TableCell>{line.uom}</TableCell>
                        <TableCell>${(line.unit_cost || 0).toFixed(2)}</TableCell>
                        <TableCell>{line.lead_time_days} days</TableCell>
                         <TableCell>
                           <div className="flex gap-2">
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => editPricingLine(line)}
                               className="text-xs"
                             >
                               <Edit className="h-3 w-3" />
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => deletePricingLine(line.id)}
                               className="text-xs text-destructive hover:text-destructive"
                             >
                               <Trash2 className="h-3 w-3" />
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {pricingLines.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pricing lines added yet
                  </div>
                )}

                {/* Total Cost */}
                {pricingLines.length > 0 && (
                  <div className="flex justify-end">
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        Total Cost: ${pricingLines.reduce((sum, line) => {
                          const unitCost = line.unit_cost || 0;
                          const qty = line.qty || 0;
                          return sum + (unitCost * qty);
                        }, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

       {/* Add Line Modal */}
       <Dialog open={isAddItemOpen} onOpenChange={(open) => {
         if (!open) {
           setEditingLineId(null);
           setNewPricingLine({
             item_label: '',
             qty: 1,
             uom: 'Each',
             unit_cost: 0,
             lead_time_days: 0,
             notes: ''
           });
         }
         setIsAddItemOpen(open);
       }}>
        <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>{editingLineId ? 'Edit Pricing Line' : 'Add Pricing Line'}</DialogTitle>
           </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Item Description</Label>
                <Input
                  value={newPricingLine.item_label}
                  onChange={(e) => setNewPricingLine(prev => ({ ...prev, item_label: e.target.value }))}
                  placeholder="Enter item description"
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newPricingLine.qty}
                  onChange={(e) => setNewPricingLine(prev => ({ ...prev, qty: Number(e.target.value) }))}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit of Measure</Label>
                <Select
                  value={newPricingLine.uom}
                  onValueChange={(value) => setNewPricingLine(prev => ({ ...prev, uom: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Each">Each</SelectItem>
                    <SelectItem value="Square Foot">Square Foot</SelectItem>
                    <SelectItem value="Linear Foot">Linear Foot</SelectItem>
                    <SelectItem value="Hour">Hour</SelectItem>
                    <SelectItem value="Pound">Pound</SelectItem>
                    <SelectItem value="Yard">Yard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newPricingLine.unit_cost}
                  onChange={(e) => setNewPricingLine(prev => ({ ...prev, unit_cost: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <div>
                <Label>Lead Time (Days)</Label>
                <Input
                  type="number"
                  value={newPricingLine.lead_time_days}
                  onChange={(e) => setNewPricingLine(prev => ({ ...prev, lead_time_days: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={newPricingLine.notes}
                onChange={(e) => setNewPricingLine(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>
                Cancel
              </Button>
               <Button onClick={addPricingLine}>
                 {editingLineId ? 'Update Line' : 'Add Line'}
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Master Pricing Modal */}
      <Dialog open={isAddToMasterOpen} onOpenChange={setIsAddToMasterOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Item to Master Pricing</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select
                  value={newMasterItem.category}
                  onValueChange={(value) => setNewMasterItem(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or type category" />
                  </SelectTrigger>
                  <SelectContent>
                    {pricingCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subcategory</Label>
                <Input
                  value={newMasterItem.subcategory}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, subcategory: e.target.value }))}
                  placeholder="Enter subcategory"
                />
              </div>
            </div>

            <div>
              <div>
                <Label>Item Name *</Label>
                <Input
                  value={newMasterItem.item_name}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, item_name: e.target.value }))}
                  placeholder="Enter item name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
                <Input
                  value={newMasterItem.vendor}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, vendor: e.target.value }))}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label>Unit of Measure</Label>
                <Select
                  value={newMasterItem.uom}
                  onValueChange={(value) => setNewMasterItem(prev => ({ ...prev, uom: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Each">Each</SelectItem>
                    <SelectItem value="Square Foot">Square Foot</SelectItem>
                    <SelectItem value="Linear Foot">Linear Foot</SelectItem>
                    <SelectItem value="Hour">Hour</SelectItem>
                    <SelectItem value="Pound">Pound</SelectItem>
                    <SelectItem value="Yard">Yard</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div>
                <Label>Base Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newMasterItem.base_cost}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, base_cost: Number(e.target.value) }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Time (Days)</Label>
                <Input
                  type="number"
                  value={newMasterItem.lead_time_days}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, lead_time_days: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Warranty</Label>
                <Input
                  value={newMasterItem.warranty}
                  onChange={(e) => setNewMasterItem(prev => ({ ...prev, warranty: e.target.value }))}
                  placeholder="e.g., 1 Year"
                />
              </div>
            </div>


            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddToMasterOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addToMasterPricing}>
                Add to Master Pricing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Price Request</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This price request will be marked as completed and moved to the completed tab. 
              Do you want to add the pricing lines to master pricing?
            </p>
            
            <div className="flex flex-col gap-2">
              <Button onClick={() => completeRequest(true)} className="w-full">
                Complete & Add to Master Pricing
              </Button>
              <Button onClick={() => completeRequest(false)} variant="outline" className="w-full">
                Complete Only
              </Button>
              <Button onClick={() => setIsCompletionDialogOpen(false)} variant="ghost" className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Selection Dialog */}
      <Dialog open={isCategorySelectionOpen} onOpenChange={setIsCategorySelectionOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Categories for Master Pricing Items</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the appropriate category for each item before adding to master pricing:
            </p>
            
            <div className="space-y-4">
              {pricingLinesForMaster.map((line, index) => (
                <div key={line.id} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div>
                      <h4 className="font-medium">{line.item_label}</h4>
                      <p className="text-sm text-muted-foreground">
                        {line.qty} {line.uom} @ ${(line.unit_cost || 0).toFixed(2)} each
                      </p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={line.selectedCategory}
                        onValueChange={(value) => {
                          const updatedLines = [...pricingLinesForMaster];
                          updatedLines[index] = { ...line, selectedCategory: value };
                          setPricingLinesForMaster(updatedLines);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pricingCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCategorySelectionOpen(false);
                  setIsCompletionDialogOpen(true);
                }}
              >
                Back
              </Button>
              <Button 
                onClick={() => finalizeCompletion(true, pricingLinesForMaster)}
              >
                Add to Master Pricing
              </Button>
              <Button 
                variant="ghost"
                onClick={() => finalizeCompletion(false, [])}
              >
                Complete Without Adding
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
