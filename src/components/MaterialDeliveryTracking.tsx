import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Truck, Package, MapPin, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaterialDeliveryTrackingProps {
  projectId: string;
}

interface MaterialDelivery {
  id: string;
  orderNumber: string;
  supplier: string;
  items: MaterialItem[];
  status: 'ordered' | 'in-transit' | 'delivered' | 'delayed';
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingNumber?: string;
  deliveryAddress: string;
  specialInstructions?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
}

const MaterialDeliveryTracking = ({ projectId }: MaterialDeliveryTrackingProps) => {
  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveries();
  }, [projectId]);

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockDeliveries: MaterialDelivery[] = [
        {
          id: '1',
          orderNumber: 'TB-001-2024',
          supplier: 'Metal Masters Supply',
          items: [
            { name: '26ga Standing Seam Panels', quantity: 45, unit: 'sheets', category: 'Roofing' },
            { name: 'Ridge Cap Trim', quantity: 120, unit: 'ft', category: 'Roofing' },
            { name: 'Flashing Material', quantity: 8, unit: 'rolls', category: 'Roofing' }
          ],
          status: 'delivered',
          estimatedDelivery: '2024-01-15',
          actualDelivery: '2024-01-14',
          trackingNumber: 'MM2024001567',
          deliveryAddress: '123 Main St, Dover, DE 19901',
          priority: 'high'
        },
        {
          id: '2',
          orderNumber: 'TB-002-2024',
          supplier: 'Delaware Lumber Co.',
          items: [
            { name: '2x10 Pressure Treated Lumber', quantity: 24, unit: 'pieces', category: 'Framing' },
            { name: '2x6 Pressure Treated Lumber', quantity: 48, unit: 'pieces', category: 'Framing' },
            { name: 'Construction Adhesive', quantity: 12, unit: 'tubes', category: 'Hardware' }
          ],
          status: 'in-transit',
          estimatedDelivery: '2024-01-20',
          trackingNumber: 'DLC789456123',
          deliveryAddress: '123 Main St, Dover, DE 19901',
          specialInstructions: 'Deliver to rear of property, stack near shed',
          priority: 'medium'
        },
        {
          id: '3',
          orderNumber: 'TB-003-2024',
          supplier: 'Pro Concrete Solutions',
          items: [
            { name: 'Ready Mix Concrete', quantity: 15, unit: 'cubic yards', category: 'Foundation' },
            { name: 'Rebar #4', quantity: 200, unit: 'feet', category: 'Foundation' }
          ],
          status: 'delayed',
          estimatedDelivery: '2024-01-22',
          deliveryAddress: '123 Main St, Dover, DE 19901',
          specialInstructions: 'Weather dependent - will reschedule if rain forecasted',
          priority: 'critical'
        },
        {
          id: '4',
          orderNumber: 'TB-004-2024',
          supplier: 'Electrical Supply Depot',
          items: [
            { name: 'Electrical Panel - 200A', quantity: 1, unit: 'unit', category: 'Electrical' },
            { name: '12 AWG Romex Wire', quantity: 500, unit: 'feet', category: 'Electrical' },
            { name: 'GFCI Outlets', quantity: 8, unit: 'units', category: 'Electrical' }
          ],
          status: 'ordered',
          estimatedDelivery: '2024-01-25',
          deliveryAddress: '123 Main St, Dover, DE 19901',
          priority: 'medium'
        }
      ];

      setDeliveries(mockDeliveries);
    } catch (error) {
      console.error('Error loading deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load delivery information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-transit':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'delayed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Package className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getOverallProgress = () => {
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    return deliveries.length > 0 ? Math.round((delivered / deliveries.length) * 100) : 0;
  };

  const getStatusCounts = () => {
    return {
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      inTransit: deliveries.filter(d => d.status === 'in-transit').length,
      delayed: deliveries.filter(d => d.status === 'delayed').length,
      ordered: deliveries.filter(d => d.status === 'ordered').length
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading delivery information...</p>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{statusCounts.delivered}</div>
            <div className="text-xs text-muted-foreground">Delivered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Truck className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{statusCounts.inTransit}</div>
            <div className="text-xs text-muted-foreground">In Transit</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-600">{statusCounts.delayed}</div>
            <div className="text-xs text-muted-foreground">Delayed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.ordered}</div>
            <div className="text-xs text-muted-foreground">Ordered</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            Material Delivery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Delivery Progress</span>
              <span className="text-sm text-muted-foreground">
                {statusCounts.delivered} of {deliveries.length} deliveries completed
              </span>
            </div>
            <Progress value={getOverallProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      <div className="space-y-4">
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(delivery.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">Order #{delivery.orderNumber}</h4>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getPriorityColor(delivery.priority)}>
                        {delivery.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Supplier:</strong> {delivery.supplier}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-4">
                <h5 className="font-medium mb-2 text-sm">Items Included:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {delivery.items.map((item, index) => (
                    <div key={index} className="text-sm p-2 bg-muted/50 rounded">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.quantity} {item.unit} • {item.category}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      <strong>Est. Delivery:</strong> {new Date(delivery.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                  {delivery.actualDelivery && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>Delivered:</strong> {new Date(delivery.actualDelivery).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{delivery.deliveryAddress}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {delivery.trackingNumber && (
                    <div>
                      <strong>Tracking:</strong> {delivery.trackingNumber}
                    </div>
                  )}
                  {delivery.specialInstructions && (
                    <div>
                      <strong>Instructions:</strong> 
                      <p className="text-muted-foreground mt-1">{delivery.specialInstructions}</p>
                    </div>
                  )}
                </div>
              </div>

              {delivery.status === 'delayed' && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Delivery Delayed</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    This delivery has been delayed. Our team will contact you with an updated timeline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {deliveries.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">No material deliveries scheduled yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaterialDeliveryTracking;