import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Edit, Trash2, DollarSign, Briefcase } from "lucide-react";
import { dataService, Proposal, Customer, ProposalItem } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

const ProposalManager = () => {
  const [proposals, setProposals] = useState<Proposal[]>(dataService.getProposals());
  const [customers, setCustomers] = useState<Customer[]>(dataService.getCustomers());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    jobType: "Residential" as "Residential" | "Barndominium" | "Commercial",
    title: "",
    description: "",
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tax: 0,
    notes: ""
  });
  const [items, setItems] = useState<Omit<ProposalItem, 'id' | 'totalPrice'>[]>([
    { description: "", quantity: 1, unitPrice: 0 }
  ]);
  const { toast } = useToast();

  const refreshProposals = () => {
    setProposals(dataService.getProposals());
  };

  const calculateItemTotal = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unitPrice), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (subtotal * formData.tax / 100);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Omit<ProposalItem, 'id' | 'totalPrice'>, value: string | number) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.title || !formData.validUntil) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedCustomer = customers.find(c => c.id === formData.customerId);
    if (!selectedCustomer) return;

    const subtotal = calculateSubtotal();
    const total = calculateTotal();

    const proposalItems: ProposalItem[] = items.map((item, index) => ({
      id: `item-${index}`,
      ...item,
      totalPrice: calculateItemTotal(item.quantity, item.unitPrice)
    }));

    const proposalData = {
      ...formData,
      customerName: selectedCustomer.name,
      projectName: formData.title, // Use title as project name
      items: proposalItems,
      subtotal,
      tax: subtotal * formData.tax / 100,
      total,
      status: "Draft" as const,
      proposalNumber: `PROP-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    try {
      if (editingProposal) {
        const updated = dataService.updateProposal(editingProposal.id, proposalData);
        if (updated) {
          refreshProposals();
          toast({
            title: "Success",
            description: "Proposal updated successfully.",
          });
        }
        setEditingProposal(null);
      } else {
        dataService.addProposal(proposalData);
        refreshProposals();
        toast({
          title: "Success",
          description: "Proposal created successfully.",
        });
        setIsAddDialogOpen(false);
      }
      
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save proposal.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: "",
      customerName: "",
      jobType: "Residential",
      title: "",
      description: "",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax: 0,
      notes: ""
    });
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormData({
      customerId: proposal.customerId,
      customerName: proposal.customerName,
      jobType: proposal.jobType || "Residential",
      title: proposal.title || "",
      description: proposal.description || "",
      validUntil: proposal.validUntil,
      tax: (proposal.tax / proposal.subtotal) * 100,
      notes: proposal.notes || ""
    });
    setItems(proposal.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    })));
  };

  const handleDelete = (proposalId: string) => {
    if (window.confirm("Are you sure you want to delete this proposal?")) {
      const success = dataService.deleteProposal(proposalId);
      if (success) {
        refreshProposals();
        toast({
          title: "Success",
          description: "Proposal deleted successfully.",
        });
      }
    }
  };

  const handleConvertToJob = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    if (proposal.status !== 'Accepted') {
      toast({
        title: "Error",
        description: "Only accepted proposals can be converted to jobs.",
        variant: "destructive",
      });
      return;
    }

    const newProject = dataService.convertProposalToJob(proposalId);
    if (newProject) {
      refreshProposals();
      toast({
        title: "Success",
        description: `Proposal converted to job: ${newProject.name}`,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "Sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "Expired":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <FileText className="h-6 w-6 mr-2" />
          Proposal Management
        </h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Proposal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobType">Job Type *</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => setFormData({ ...formData, jobType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Barndominium">Barndominium</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Proposal Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Proposal title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Proposal description"
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Proposal Items</Label>
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                              className="w-32"
                            />
                          </TableCell>
                          <TableCell>
                            ${calculateItemTotal(item.quantity, item.unitPrice).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax Rate (%)</Label>
                    <Input
                      id="tax"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                      placeholder="8.25"
                    />
                  </div>
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({formData.tax}%):</span>
                        <span>${(calculateSubtotal() * formData.tax / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingProposal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProposal ? "Update Proposal" : "Create Proposal"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{proposal.proposalNumber}</CardTitle>
                  <p className="text-sm text-gray-600">{proposal.customerName}</p>
                  <p className="text-sm font-medium">{proposal.title}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                  <Badge variant="outline">
                    {proposal.jobType}
                  </Badge>
                  {proposal.status === 'Accepted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConvertToJob(proposal.id)}
                    >
                      <Briefcase className="h-4 w-4 mr-1" />
                      Convert to Job
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(proposal)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(proposal.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">Total Amount</p>
                    <p className="text-gray-600">${proposal.total.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="font-medium">Valid Until</p>
                  <p className="text-gray-600">{new Date(proposal.validUntil).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="font-medium">Created</p>
                  <p className="text-gray-600">{new Date(proposal.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              {proposal.description && (
                <div className="mt-4 text-sm text-gray-600">
                  <p className="font-medium">Description:</p>
                  <p>{proposal.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingProposal} onOpenChange={() => setEditingProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Proposal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Same form content as create dialog */}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalManager;
