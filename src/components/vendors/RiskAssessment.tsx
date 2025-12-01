import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Activity,
  Zap,
  Target
} from 'lucide-react';

interface RiskAssessmentProps {
  vendorId: string;
  vendorData: any;
  messages: any[];
  compliance: any[];
}

interface RiskFactor {
  category: string;
  score: number;
  weight: number;
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({
  vendorId,
  vendorData,
  messages,
  compliance
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'30d' | '90d' | '1y'>('90d');

  // Calculate individual risk factors
  const calculateFinancialRisk = () => {
    // Use real financial data from database
    const onTimePayments = 0; // Would come from actual payment records
    const creditUtilization = 0; // Would come from credit reports
    const overdueInvoices = 0; // Would come from invoice system
    
    let score = 100;
    if (onTimePayments < 85) score -= 20;
    if (creditUtilization > 80) score -= 15;
    if (overdueInvoices > 0) score -= 10;
    
    return Math.max(0, score);
  };

  const calculateComplianceRisk = () => {
    const expiredDocs = compliance.filter(doc => 
      doc.expires_on && new Date(doc.expires_on) < new Date()
    ).length;
    const expiringDocs = compliance.filter(doc => {
      if (!doc.expires_on) return false;
      const daysUntilExpiry = Math.ceil(
        (new Date(doc.expires_on).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;
    
    const totalDocs = compliance.length;
    if (totalDocs === 0) return 50; // Medium risk if no docs
    
    let score = 100;
    score -= (expiredDocs / totalDocs) * 50;
    score -= (expiringDocs / totalDocs) * 25;
    
    return Math.max(0, score);
  };

  const calculateCommunicationRisk = () => {
    const recentMessages = messages.filter(m => {
      const messageDate = new Date(m.created_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return messageDate >= thirtyDaysAgo;
    });

    const responseMessages = recentMessages.filter(m => 
      m.direction === 'inbound' && m.parsed_commands?.length > 0
    );

    if (recentMessages.length === 0) return 70; // Medium risk if no communication
    
    const responseRate = (responseMessages.length / recentMessages.length) * 100;
    return Math.min(100, responseRate + 20); // Boost base score
  };

  const calculatePerformanceRisk = () => {
    const rating = vendorData?.rating || 3;
    const status = vendorData?.status || 'Active';
    
    let score = (rating / 5) * 100;
    
    switch (status) {
      case 'Blacklisted': score = 0; break;
      case 'Inactive': score = Math.min(score, 30); break;
      case 'Probation': score = Math.min(score, 60); break;
      case 'Active': break; // No penalty
    }
    
    return score;
  };

  const riskFactors: RiskFactor[] = [
    {
      category: 'Financial Health',
      score: calculateFinancialRisk(),
      weight: 0.25,
      description: 'Payment history, credit utilization, outstanding balances',
      icon: <DollarSign className="h-4 w-4" />,
      trend: 'stable'
    },
    {
      category: 'Compliance Status',
      score: calculateComplianceRisk(),
      weight: 0.30,
      description: 'Document validity, expiration tracking, regulatory compliance',
      icon: <Shield className="h-4 w-4" />,
      trend: 'down'
    },
    {
      category: 'Communication',
      score: calculateCommunicationRisk(),
      weight: 0.20,
      description: 'Response time, command processing, engagement level',
      icon: <Activity className="h-4 w-4" />,
      trend: 'up'
    },
    {
      category: 'Performance',
      score: calculatePerformanceRisk(),
      weight: 0.25,
      description: 'Vendor rating, status, historical performance',
      icon: <Star className="h-4 w-4" />,
      trend: 'stable'
    }
  ];

  // Calculate overall risk score
  const overallRiskScore = riskFactors.reduce((total, factor) => 
    total + (factor.score * factor.weight), 0
  );

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { 
      level: 'Low Risk', 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      variant: 'default' as const,
      description: 'Vendor poses minimal risk to operations'
    };
    if (score >= 60) return { 
      level: 'Medium Risk', 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      variant: 'secondary' as const,
      description: 'Monitor closely and address identified issues'
    };
    return { 
      level: 'High Risk', 
      color: 'text-red-600', 
      bgColor: 'bg-red-50',
      variant: 'destructive' as const,
      description: 'Immediate attention required to mitigate risks'
    };
  };

  const riskInfo = getRiskLevel(overallRiskScore);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-red-600" />;
      default: return <Target className="h-3 w-3 text-gray-600" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overall Risk Score */}
      <Card className={riskInfo.bgColor}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Risk Assessment</span>
            </div>
            <Badge variant={riskInfo.variant}>{riskInfo.level}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className={`text-4xl font-bold ${riskInfo.color}`}>
                {overallRiskScore.toFixed(0)}/100
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {riskInfo.description}
              </div>
              <Progress value={overallRiskScore} className="mt-4" />
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {riskFactors.map((factor) => (
                <div key={factor.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm">
                      {factor.icon}
                      <span>{factor.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(factor.trend)}
                      <span className={`text-sm font-medium ${getScoreColor(factor.score)}`}>
                        {factor.score.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <Progress value={factor.score} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Factor Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {riskFactors.map((factor) => (
          <Card key={factor.category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {factor.icon}
                  <span>{factor.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(factor.trend)}
                  <span className={`font-bold ${getScoreColor(factor.score)}`}>
                    {factor.score.toFixed(0)}/100
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {factor.description}
              </p>
              <Progress value={factor.score} className="mb-3" />
              <div className="text-xs text-muted-foreground">
                Weight in overall score: {(factor.weight * 100).toFixed(0)}%
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Mitigation Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Risk Mitigation Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {riskFactors
              .filter(factor => factor.score < 70)
              .map((factor) => (
                <div key={factor.category} className="flex items-start space-x-3 p-3 bg-muted rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">{factor.category} Improvement</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {factor.category === 'Financial Health' && 
                        'Review payment terms, follow up on overdue invoices, and consider credit limit adjustments.'
                      }
                      {factor.category === 'Compliance Status' && 
                        'Schedule compliance document renewals and set up automated expiration reminders.'
                      }
                      {factor.category === 'Communication' && 
                        'Improve response times and encourage use of email command system for better tracking.'
                      }
                      {factor.category === 'Performance' && 
                        'Conduct performance review and develop improvement plan with clear metrics.'
                      }
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Take Action
                  </Button>
                </div>
              ))}
            
            {riskFactors.every(factor => factor.score >= 70) && (
              <div className="text-center py-6 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-2 text-green-600" />
                <p className="font-medium">All risk factors are within acceptable ranges</p>
                <p className="text-sm">Continue monitoring for any changes in vendor performance</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};