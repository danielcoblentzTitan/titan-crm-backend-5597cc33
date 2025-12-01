import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileEdit, Plus, DollarSign, Calendar, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChangeOrderRequestsProps {
  projectId: string;
}

interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedCost: number;
  timeImpact: number; // days
  status: 'draft' | 'submitted' | 'under-review' | 'approved' | 'rejected';
  submittedDate?: string;
  responseDate?: string;
  notes?: string;
  attachments?: string[];
}

const ChangeOrderRequests = ({ projectId }: ChangeOrderRequestsProps) => {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimatedBudget: '',
    reasoning: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const changeOrderCategories = [
    { value: 'addition', label: 'Room/Space Addition' },
    { value: 'upgrade', label: 'Material/Finish Upgrade' },
    { value: 'modification', label: 'Design Modification' },
    { value: 'electrical', label: 'Electrical Changes' },
    { value: 'plumbing', label: 'Plumbing Changes' },
    { value: 'structural', label: 'Structural Changes' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadChangeOrders();
  }, [projectId]);

  const loadChangeOrders = async () => {
    try {
      // Mock data for demonstration
      const mockChangeOrders: ChangeOrder[] = [
        {
          id: '1',
          title: 'Add Covered Patio',
          description: 'Request to add a 12x16 covered patio area with concrete flooring and electrical outlets',
          category: 'addition',
          estimatedCost: 3200,
          timeImpact: 5,
          status: 'approved',
          submittedDate: '2024-01-10',
          responseDate: '2024-01-12',
          notes: 'Approved with minor modifications to electrical layout'
        },
        {
          id: '2',
          title: 'Upgrade Kitchen Countertops',
          description: 'Change from laminate to quartz countertops in kitchen area',
          category: 'upgrade',
          estimatedCost: 1800,
          timeImpact: 2,
          status: 'under-review',
          submittedDate: '2024-01-15'
        },
        {
          id: '3',
          title: 'Additional Electrical Outlets',
          description: 'Add 4 additional GFCI outlets in garage area for workshop use',
          category: 'electrical',
          estimatedCost: 450,
          timeImpact: 1,
          status: 'rejected',
          submittedDate: '2024-01-08',
          responseDate: '2024-01-10',
          notes: 'Cannot be accommodated due to electrical panel capacity limitations'
        }
      ];

      setChangeOrders(mockChangeOrders);
    } catch (error) {
      console.error('Error loading change orders:', error);
    }
  };

  const handleSubmitChangeOrder = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const newChangeOrder: ChangeOrder = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        category: formData.category,
        estimatedCost: parseFloat(formData.estimatedBudget) || 0,
        timeImpact: 0, // Will be estimated by team
        status: 'submitted',
        submittedDate: new Date().toISOString().split('T')[0]
      };

      setChangeOrders(prev => [newChangeOrder, ...prev]);

      toast({
        title: "Change Order Submitted",
        description: "Your change order request has been submitted for review. You'll be notified of the status update.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        estimatedBudget: '',
        reasoning: ''
      });
      setShowNewForm(false);

    } catch (error) {
      console.error('Error submitting change order:', error);
      toast({
        title: "Error",
        description: "Failed to submit change order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under-review':
        return 'bg-blue-100 text-blue-800';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4" />;
      case 'under-review':
        return <Eye className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    return changeOrderCategories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileEdit className="h-6 w-6 text-primary" />
            Change Order Requests
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Request modifications to your project scope and track their progress
          </p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* New Change Order Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit New Change Order Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Request Title *</label>
                <Input
                  placeholder="Brief description of the change"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {changeOrderCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Detailed Description *</label>
              <Textarea
                placeholder="Provide a detailed description of the requested change..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Estimated Budget Impact</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.estimatedBudget}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Optional - if you have an idea of cost</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Reasoning</label>
                <Textarea
                  placeholder="Why is this change important to you?"
                  value={formData.reasoning}
                  onChange={(e) => setFormData(prev => ({ ...prev, reasoning: e.target.value }))}
                  className="min-h-20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmitChangeOrder} disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Orders List */}
      <div className="space-y-4">
        {changeOrders.map((changeOrder) => (
          <Card key={changeOrder.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{changeOrder.title}</h4>
                    <Badge className={getStatusColor(changeOrder.status)}>
                      {getStatusIcon(changeOrder.status)}
                      <span className="ml-1 capitalize">{changeOrder.status.replace('-', ' ')}</span>
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{changeOrder.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span><strong>Category:</strong> {getCategoryLabel(changeOrder.category)}</span>
                    <span><strong>Submitted:</strong> {changeOrder.submittedDate ? new Date(changeOrder.submittedDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Cost Impact</div>
                    <div className="text-lg font-bold text-green-600">
                      {changeOrder.estimatedCost > 0 ? `+$${changeOrder.estimatedCost.toLocaleString()}` : 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Time Impact</div>
                    <div className="text-lg font-bold text-blue-600">
                      {changeOrder.timeImpact > 0 ? `+${changeOrder.timeImpact} days` : 'TBD'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Response Date</div>
                    <div className="text-sm">
                      {changeOrder.responseDate ? new Date(changeOrder.responseDate).toLocaleDateString() : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>

              {changeOrder.notes && (
                <>
                  <Separator className="my-4" />
                  <div className="p-3 bg-muted/50 rounded">
                    <div className="text-sm font-medium mb-1">Team Notes:</div>
                    <p className="text-sm text-muted-foreground">{changeOrder.notes}</p>
                  </div>
                </>
              )}

              {changeOrder.status === 'approved' && (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Change Order Approved</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    This change has been approved and will be incorporated into your project.
                  </p>
                </div>
              )}

              {changeOrder.status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Change Order Not Approved</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    This change request was not approved. Please see team notes above for details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {changeOrders.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileEdit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No change orders submitted yet.</p>
            <p className="text-sm text-muted-foreground">
              Click "New Request" above to submit your first change order request.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>Change orders may impact project timeline and budget</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>All requests are reviewed by our project management team</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>Approved changes require updated contracts and payment schedules</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>Response time is typically 2-3 business days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChangeOrderRequests;