
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Plus, Trash2, Send } from "lucide-react";
import { dataService, Vendor, Project, POItem } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderCreatorProps {
  vendor: Vendor;
  onUpdate: () => void;
}

const PurchaseOrderCreator = ({ vendor, onUpdate }: PurchaseOrderCreatorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projects] = useState<Project[]>(dataService.getProjects());
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [items, setItems] = useState<POItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addItem = () => {
    const newItem: POItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof POItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleCreatePO = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.quantity > 0 && item.unitPrice > 0);
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid item.",
        variant: "destructive",
      });
      return;
    }

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    if (!selectedProject) return;

    setIsLoading(true);

    try {
      const newPO = dataService.addPurchaseOrder({
        vendorId: vendor.id,
        vendorName: vendor.name,
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        items: validItems,
        totalAmount: getTotalAmount(),
        status: 'Draft',
        notes
      });

      toast({
        title: "Success",
        description: `Purchase Order ${newPO.poNumber} created successfully.`,
      });

      // Add activity
      dataService.addActivity({
        type: 'document',
        title: `PO ${newPO.poNumber} created`,
        project: selectedProject.name,
        projectId: selectedProject.id,
        time: 'Just now',
        status: 'new',
        description: `Purchase Order created for ${vendor.name} - $${getTotalAmount().toLocaleString()}`
      });

      resetForm();
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create purchase order.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPO = async () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Please create the PO first by selecting a project.",
        variant: "destructive",
      });
      return;
    }

    // Simulate email sending
    setIsLoading(true);
    
    setTimeout(() => {
      toast({
        title: "Email Sent",
        description: `Purchase Order has been emailed to ${vendor.email}`,
      });
      setIsLoading(false);
    }, 2000);
  };

  const resetForm = () => {
    setSelectedProjectId("");
    setItems([{ id: "1", description: "", quantity: 1, unitPrice: 0, total: 0 }]);
    setNotes("");
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Create PO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order - {vendor.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <Input value={vendor.name} disabled />
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        value={`$${item.total.toFixed(2)}`}
                        disabled
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Total: ${getTotalAmount().toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or special instructions"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleEmailPO}
              disabled={isLoading || !selectedProjectId}
            >
              <Send className="h-4 w-4 mr-2" />
              Email PO
            </Button>
            <Button
              onClick={handleCreatePO}
              disabled={isLoading}
            >
              Create Purchase Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseOrderCreator;
