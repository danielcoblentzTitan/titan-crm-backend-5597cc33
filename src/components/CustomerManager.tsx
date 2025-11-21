
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Edit, Trash2, Phone, Mail, MapPin, Search, ArrowRight, FileText, Calculator, Grid3X3 } from "lucide-react";
import { supabaseService } from "@/services/supabaseService";
import type { Customer } from "@/services/supabaseService";
import type { Project } from "@/services/dataService";
import { workflowService } from "@/services/workflowService";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomerInviteButton from "./CustomerInviteButton";
import BarndominiumFeesStatement from "./BarndominiumFeesStatement";
import { ProjectType } from "./fees-statement/useStatementData";
import { DocumentList } from "./DocumentList";
import ContractGenerator from "./ContractGenerator";
import { BuildingLayoutDesignerEnhanced as BuildingLayoutDesigner } from "./layout-designer/BuildingLayoutDesignerEnhanced";


const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const [documentsCustomer, setDocumentsCustomer] = useState<Customer | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [contractCustomer, setContractCustomer] = useState<Customer | null>(null);
  const [isLayoutDialogOpen, setIsLayoutDialogOpen] = useState(false);
  const [layoutCustomer, setLayoutCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    notes: ""
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      console.log("Loading customers...");
      const customersData = await supabaseService.getCustomers();
      console.log("Customers loaded:", customersData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      notes: ""
    });
  };

  const handleEdit = (customer: Customer) => {
    console.log("Editing customer:", customer);
    try {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zip: customer.zip || "",
        notes: customer.notes || ""
      });
      console.log("Form data set:", formData);
    } catch (error) {
      console.error("Error setting up edit form:", error);
      toast({
        title: "Error",
        description: "Failed to open customer for editing.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form:", formData);
    
    try {
      if (editingCustomer) {
        console.log("Updating customer:", editingCustomer.id);
        await supabaseService.updateCustomer(editingCustomer.id, formData);
        toast({
          title: "Success",
          description: "Customer updated successfully.",
        });
        setEditingCustomer(null);
      } else {
        console.log("Adding new customer");
        await supabaseService.addCustomer(formData);
        toast({
          title: "Success",
          description: "Customer added successfully.",
        });
        setIsAddDialogOpen(false);
      }
      
      resetForm();
      await loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await supabaseService.deleteCustomer(customerId);
        toast({
          title: "Success",
          description: "Customer deleted successfully.",
        });
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast({
          title: "Error",
          description: "Failed to delete customer.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCancel = () => {
    console.log("Canceling edit/add");
    setEditingCustomer(null);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDocuments = (customer: Customer) => {
    setDocumentsCustomer(customer);
    setIsDocumentsDialogOpen(true);
  };

  const handleContract = (customer: Customer) => {
    setContractCustomer(customer);
    setIsContractDialogOpen(true);
  };

  const handleBuildingLayout = (customer: Customer) => {
    setLayoutCustomer(customer);
    setIsLayoutDialogOpen(true);
  };

  const createMockProject = (customer: Customer): Project => ({
    id: `customer-${customer.id}`,
    name: `${customer.name} - Statement`,
    customerId: customer.id,
    customerName: customer.name,
    status: 'Planning' as const,
    progress: 0,
    startDate: new Date().toISOString().split('T')[0],
    estimatedCompletion: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    budget: 0,
    phase: 'Planning & Permits',
    description: `Statement for ${customer.name}`,
    address: customer.address || '',
    city: customer.city || '',
    state: customer.state || '',
    zip: customer.zip || ''
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading customers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="block sm:hidden">
        <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
          <h1 className="text-lg font-semibold">Customers</h1>
          <p className="text-sm opacity-90">Customer Management</p>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-start justify-between gap-4">
        <h2 className="text-2xl font-bold flex items-center">
          <Users className="h-6 w-6 mr-2" />
          Customer Management
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#003562] hover:bg-[#003562]/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
                  Add Customer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="p-4 border rounded-lg bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Mobile Customer List */}
      <div className="block sm:hidden space-y-3 pb-20">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="p-4 border rounded-lg bg-background space-y-3">
            {/* Customer Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{customer.name}</h3>
                <div className="space-y-1 mt-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{customer.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {(customer.address || customer.city || customer.state) && (
              <div className="flex items-start text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}
                  {customer.zip && ` ${customer.zip}`}
                </span>
              </div>
            )}

            {/* Notes */}
            {customer.notes && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {customer.notes}
              </div>
            )}

            {/* Action Buttons - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2">
              <CustomerInviteButton 
                customer={customer} 
                onInviteSent={loadCustomers}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDocuments(customer)}
                className="h-10 text-xs"
              >
                <FileText className="h-4 w-4 mr-2" />
                Docs
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 text-xs"
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Stmt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Fees Statement - {customer.name}</DialogTitle>
                  </DialogHeader>
                  <BarndominiumFeesStatement
                    project={createMockProject(customer)}
                    isOpen={true}
                    readOnly={false}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleContract(customer)}
                className="h-10 text-xs"
              >
                Contract
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(customer)}
                className="px-3"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(customer.id)}
                className="px-3 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Customer List */}
      <div className="hidden sm:grid gap-4">
        {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="bg-gray-50 border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg truncate">{customer.name}</CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                    <div className="flex items-center min-w-0">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <CustomerInviteButton 
                    customer={customer} 
                    onInviteSent={loadCustomers}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDocuments(customer)}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 text-xs h-7 px-2"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">Documents</span>
                    <span className="sm:hidden">Docs</span>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 text-xs h-7 px-2"
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Statement</span>
                        <span className="sm:hidden">Stmt</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Fees Statement - {customer.name}</DialogTitle>
                      </DialogHeader>
                      <BarndominiumFeesStatement
                        project={createMockProject(customer)}
                        isOpen={true}
                        readOnly={false}
                      />
                    </DialogContent>
                  </Dialog>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleBuildingLayout(customer)}
                     className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 text-xs h-7 px-2"
                   >
                     <Grid3X3 className="h-3 w-3 mr-1" />
                     <span className="hidden sm:inline">Building Layout</span>
                     <span className="sm:hidden">Layout</span>
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleContract(customer)}
                     className="bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700 text-xs h-7 px-2"
                   >
                     <span className="hidden sm:inline">Contract</span>
                     <span className="sm:hidden">Cont</span>
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleEdit(customer)}
                     className="h-7 w-7 p-0"
                   >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {(customer.address || customer.city || customer.state) && (
                <div className="flex items-start text-xs sm:text-sm text-gray-600 mb-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 mt-0.5 flex-shrink-0" />
                  <span className="break-words">
                    {[customer.address, customer.city, customer.state].filter(Boolean).join(', ')}
                    {customer.zip && ` ${customer.zip}`}
                  </span>
                </div>
              )}
              {customer.notes && (
                <div className="text-xs sm:text-sm text-gray-600 bg-gray-100 p-2 rounded break-words">
                  {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Add Button */}
      <div className="block sm:hidden fixed bottom-16 right-4 z-40">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full w-14 h-14 shadow-lg bg-[#003562] hover:bg-[#003562]/90">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="mobile-name">Name *</Label>
                  <Input
                    id="mobile-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-email">Email *</Label>
                  <Input
                    id="mobile-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-phone">Phone *</Label>
                  <Input
                    id="mobile-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-address">Address</Label>
                  <Input
                    id="mobile-address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-city">City</Label>
                  <Input
                    id="mobile-city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-state">State</Label>
                  <Input
                    id="mobile-state"
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="mobile-zip">ZIP Code</Label>
                  <Input
                    id="mobile-zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mobile-notes">Notes</Label>
                <Textarea
                  id="mobile-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
                  Add Customer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone *</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-state">State</Label>
                <Input
                  id="edit-state"
                  value={formData.state}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-zip">ZIP Code</Label>
                <Input
                  id="edit-zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({...formData, zip: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
                Update Customer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={isDocumentsDialogOpen} onOpenChange={(open) => {
        setIsDocumentsDialogOpen(open);
        if (!open) {
          setDocumentsCustomer(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Documents - {documentsCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {documentsCustomer && (
            <DocumentList
              entityId={documentsCustomer.id}
              entityType="customer"
              customerView={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Contract Generator Dialog */}
      {contractCustomer && (
        <ContractGenerator
          customer={contractCustomer}
          isOpen={isContractDialogOpen}
          onOpenChange={(open) => {
            setIsContractDialogOpen(open);
            if (!open) {
              setContractCustomer(null);
            }
          }}
        />
      )}

      {/* Building Layout Designer */}
      {layoutCustomer && (
        <BuildingLayoutDesigner
          customer={layoutCustomer}
          isOpen={isLayoutDialogOpen}
          onClose={() => setIsLayoutDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerManager;
