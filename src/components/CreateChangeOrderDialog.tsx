import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";

interface PaymentPlan {
  payment_number: number;
  amount: number;
  due_date: string;
}

interface CreateChangeOrderDialogProps {
  projectId?: string;
  onSuccess?: () => void;
}

const CreateChangeOrderDialog = ({ projectId, onSuccess }: CreateChangeOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string; customer_name: string }>>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cost_impact: "",
    schedule_impact_days: "",
    requested_by: "",
    notes: "",
    project_id: projectId || ""
  });
  
  const [paymentPlanType, setPaymentPlanType] = useState<'one_payment' | 'two_payments' | 'three_payments'>('one_payment');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan[]>([
    { payment_number: 1, amount: 0, due_date: '' }
  ]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && !projectId) {
      fetchProjects();
    }
  }, [open, projectId]);

  const fetchProjects = async () => {
    try {
      const projectsData = await supabaseService.getProjects();
      setProjects(projectsData.map(p => ({ 
        id: p.id, 
        name: p.name, 
        customer_name: p.customer_name 
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects.",
        variant: "destructive"
      });
    }
  };

  const updatePaymentPlanType = (type: 'one_payment' | 'two_payments' | 'three_payments') => {
    setPaymentPlanType(type);
    const numPayments = type === 'one_payment' ? 1 : type === 'two_payments' ? 2 : 3;
    const total = parseFloat(formData.cost_impact || '0') || 0;
    const amountPer = Math.round((total / numPayments) * 100) / 100;
    const plan = Array.from({ length: numPayments }, (_, i) => ({
      payment_number: i + 1,
      amount: i === numPayments - 1 ? total - amountPer * (numPayments - 1) : amountPer,
      due_date: ''
    }));
    setPaymentPlan(plan);
  };

  const updatePaymentPlanItem = (index: number, field: keyof PaymentPlan, value: string | number) => {
    const updated = [...paymentPlan];
    // @ts-expect-error dynamic
    updated[index][field] = value as any;
    setPaymentPlan(updated);
  };

  const totalAmount = paymentPlan.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id) {
      toast({
        title: "Error",
        description: "Please select a project.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a title for the change order.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const changeOrderData = {
        project_id: formData.project_id,
        title: formData.title,
        description: formData.description || null,
        cost_impact: formData.cost_impact ? parseFloat(formData.cost_impact) : 0,
        schedule_impact_days: formData.schedule_impact_days ? parseInt(formData.schedule_impact_days) : 0,
        notes: formData.notes || null,
        status: 'Pending',
        requested_by: (formData.requested_by || '').trim() || 'Builder',
        payment_plan_type: paymentPlanType,
        payment_plan_data: JSON.stringify(paymentPlan)
      };

      await supabaseService.createChangeOrder(changeOrderData);
      
      toast({
        title: "Success",
        description: "Change order created successfully."
      });
      
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        cost_impact: "",
        schedule_impact_days: "",
        requested_by: "",
        notes: "",
        project_id: projectId || ""
      });
      setPaymentPlanType('one_payment');
      setPaymentPlan([{ payment_number: 1, amount: 0, due_date: '' }]);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating change order:', error);
      toast({
        title: "Error",
        description: "Failed to create change order.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-xs sm:text-sm h-8 sm:h-9">
          <ArrowRightLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
          <span className="truncate">Create Change Order</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Change Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!projectId && (
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter change order title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the requested changes"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_impact">Cost Impact ($)</Label>
              <Input
                id="cost_impact"
                type="number"
                step="0.01"
                value={formData.cost_impact}
                onChange={(e) => setFormData({ ...formData, cost_impact: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule_impact">Schedule Impact (Days)</Label>
              <Input
                id="schedule_impact"
                type="number"
                value={formData.schedule_impact_days}
                onChange={(e) => setFormData({ ...formData, schedule_impact_days: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requested_by">Requested By</Label>
            <Input
              id="requested_by"
              value={formData.requested_by}
              onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
              placeholder="Name of requester"
            />
          </div>
          
          {/* Payment Plan */}
          <div className="space-y-2">
            <Label htmlFor="payment_plan">Payment Plan</Label>
            <Select value={paymentPlanType} onValueChange={updatePaymentPlanType}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment plan" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
                <SelectItem value="one_payment">One Payment</SelectItem>
                <SelectItem value="two_payments">Two Payments</SelectItem>
                <SelectItem value="three_payments">Three Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-3">
            <Label>Payment Schedule</Label>
            {paymentPlan.map((p, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-4 p-3 border rounded">
                <div className="space-y-2">
                  <Label htmlFor={`payment_${idx}_amount`}>Payment {p.payment_number} Amount ($)</Label>
                  <Input
                    id={`payment_${idx}_amount`}
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) => updatePaymentPlanItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`payment_${idx}_date`}>Due Date</Label>
                  <Input
                    id={`payment_${idx}_date`}
                    type="date"
                    value={p.due_date}
                    onChange={(e) => updatePaymentPlanItem(idx, 'due_date', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <div className="text-sm text-muted-foreground">Total: ${totalAmount.toLocaleString()}</div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or comments"
              className="min-h-[60px]"
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Change Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChangeOrderDialog;