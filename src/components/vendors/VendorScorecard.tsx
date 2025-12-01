import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign,
  MessageSquare,
  Star,
  Calendar
} from 'lucide-react';

interface VendorScorecardProps {
  vendorId: string;
  messages: any[];
  rfqs: any[];
  pos: any[];
  schedules: any[];
}

export const VendorScorecard: React.FC<VendorScorecardProps> = ({ 
  vendorId, 
  messages, 
  rfqs, 
  pos, 
  schedules 
}) => {
  // Calculate performance metrics
  const calculateResponseTime = () => {
    const responseTimes = messages
      .filter(m => m.direction === 'inbound' && m.created_at)
      .map(m => {
        // Find the previous outbound message
        const outboundIndex = messages.findIndex(om => 
          om.direction === 'outbound' && 
          new Date(om.created_at) < new Date(m.created_at)
        );
        if (outboundIndex !== -1) {
          const timeDiff = new Date(m.created_at).getTime() - new Date(messages[outboundIndex].created_at).getTime();
          return timeDiff / (1000 * 60 * 60); // Convert to hours
        }
        return null;
      })
      .filter(time => time !== null && time < 168); // Filter out responses > 1 week

    return responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
  };

  const calculateOnTimeDelivery = () => {
    const completedPOs = pos.filter(po => po.actual_delivery && po.target_delivery);
    if (completedPOs.length === 0) return 100;
    
    const onTime = completedPOs.filter(po => 
      new Date(po.actual_delivery) <= new Date(po.target_delivery)
    ).length;
    
    return (onTime / completedPOs.length) * 100;
  };

  const calculateCommunicationScore = () => {
    const totalMessages = messages.length;
    const commandMessages = messages.filter(m => m.parsed_commands?.length > 0).length;
    const responsiveScore = totalMessages > 0 ? (commandMessages / totalMessages) * 100 : 0;
    return Math.min(responsiveScore * 2, 100); // Boost for command usage
  };

  const calculateQualityScore = () => {
    // Based on RFQ acceptance rate and PO completion
    const sentRFQs = rfqs.filter(r => r.status !== 'Draft').length;
    const acceptedRFQs = rfqs.filter(r => ['Accepted', 'Quoted'].includes(r.status)).length;
    const acceptanceRate = sentRFQs > 0 ? (acceptedRFQs / sentRFQs) * 100 : 0;
    
    const completedPOs = pos.filter(p => p.status === 'Completed').length;
    const totalPOs = pos.length;
    const completionRate = totalPOs > 0 ? (completedPOs / totalPOs) * 100 : 0;
    
    return (acceptanceRate + completionRate) / 2;
  };

  const avgResponseTime = calculateResponseTime();
  const onTimeDelivery = calculateOnTimeDelivery();
  const communicationScore = calculateCommunicationScore();
  const qualityScore = calculateQualityScore();
  
  // Overall score calculation
  const overallScore = Math.round((
    (avgResponseTime <= 24 ? 100 : Math.max(0, 100 - (avgResponseTime - 24) * 2)) * 0.3 +
    onTimeDelivery * 0.3 +
    communicationScore * 0.2 +
    qualityScore * 0.2
  ));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Score */}
      <Card className="lg:col-span-1">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Vendor Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}/100
          </div>
          <Badge variant={getScoreBadgeVariant(overallScore)} className="mt-2">
            {overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Good' : 'Needs Improvement'}
          </Badge>
          <Progress value={overallScore} className="mt-4" />
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Avg Response Time</span>
                </div>
                <span className={`font-bold ${getScoreColor(avgResponseTime <= 24 ? 100 : 50)}`}>
                  {avgResponseTime > 0 ? `${avgResponseTime.toFixed(1)}h` : 'N/A'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">On-Time Delivery</span>
                </div>
                <span className={`font-bold ${getScoreColor(onTimeDelivery)}`}>
                  {onTimeDelivery.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Communication</span>
                </div>
                <span className={`font-bold ${getScoreColor(communicationScore)}`}>
                  {communicationScore.toFixed(0)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Quality Score</span>
                </div>
                <span className={`font-bold ${getScoreColor(qualityScore)}`}>
                  {qualityScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Activity Summary (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-primary">{messages.length}</div>
              <div className="text-sm text-muted-foreground">Messages</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-blue-600">{rfqs.length}</div>
              <div className="text-sm text-muted-foreground">RFQs</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-green-600">{pos.length}</div>
              <div className="text-sm text-muted-foreground">Purchase Orders</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted">
              <div className="text-2xl font-bold text-orange-600">{schedules.length}</div>
              <div className="text-sm text-muted-foreground">Schedules</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};