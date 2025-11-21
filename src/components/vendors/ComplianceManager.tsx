import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Calendar,
  Bell,
  Shield,
  DollarSign,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useVendorCompliance } from '@/integrations/supabase/hooks/useVendors';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

interface ComplianceManagerProps {
  vendorId: string;
}

export const ComplianceManager: React.FC<ComplianceManagerProps> = ({ vendorId }) => {
  const { data: compliance = [] } = useVendorCompliance(vendorId);
  const [showExpired, setShowExpired] = useState(true);

  // Calculate compliance metrics
  const now = new Date();
  const expiredDocs = compliance.filter(doc => 
    doc.expires_on && isBefore(new Date(doc.expires_on), now)
  );
  const expiringDocs = compliance.filter(doc => 
    doc.expires_on && 
    isAfter(new Date(doc.expires_on), now) && 
    differenceInDays(new Date(doc.expires_on), now) <= 30
  );
  const validDocs = compliance.filter(doc => 
    !doc.expires_on || 
    (doc.expires_on && differenceInDays(new Date(doc.expires_on), now) > 30)
  );

  // Risk calculation
  const calculateComplianceRisk = () => {
    const totalDocs = compliance.length;
    if (totalDocs === 0) return 100; // High risk if no docs

    const expiredWeight = expiredDocs.length * 3;
    const expiringWeight = expiringDocs.length * 1.5;
    const validWeight = validDocs.length * 0;

    const riskScore = ((expiredWeight + expiringWeight + validWeight) / totalDocs) * 100;
    return Math.min(riskScore, 100);
  };

  const complianceRisk = calculateComplianceRisk();
  const complianceScore = 100 - complianceRisk;

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Low', color: 'text-green-600', variant: 'default' as const };
    if (score >= 60) return { level: 'Medium', color: 'text-yellow-600', variant: 'secondary' as const };
    return { level: 'High', color: 'text-red-600', variant: 'destructive' as const };
  };

  const riskInfo = getRiskLevel(complianceScore);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'COI': return <Shield className="h-4 w-4" />;
      case 'License': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (doc: any) => {
    if (!doc.expires_on) return 'default';
    
    const daysUntilExpiry = differenceInDays(new Date(doc.expires_on), now);
    if (daysUntilExpiry < 0) return 'destructive';
    if (daysUntilExpiry <= 30) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Valid</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{validDocs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>Expiring Soon</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{expiringDocs.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span>Expired</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{expiredDocs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskInfo.color}`}>
              {complianceScore.toFixed(0)}/100
            </div>
            <Badge variant={riskInfo.variant} className="mt-1">
              {riskInfo.level} Risk
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Compliance Health</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Compliance Score</span>
                <span className={riskInfo.color}>{complianceScore.toFixed(0)}%</span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-600 font-bold">{validDocs.length}</div>
                <div className="text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-bold">{expiringDocs.length}</div>
                <div className="text-muted-foreground">Expiring</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-bold">{expiredDocs.length}</div>
                <div className="text-muted-foreground">Expired</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Compliance Documents</CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowExpired(!showExpired)}
              >
                {showExpired ? 'Hide' : 'Show'} Expired
              </Button>
              <Button size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Set Reminders
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {compliance
              .filter(doc => showExpired || !expiredDocs.includes(doc))
              .sort((a, b) => {
                // Sort by urgency: expired first, then expiring, then valid
                const aExpired = expiredDocs.includes(a);
                const bExpired = expiredDocs.includes(b);
                const aExpiring = expiringDocs.includes(a);
                const bExpiring = expiringDocs.includes(b);
                
                if (aExpired && !bExpired) return -1;
                if (!aExpired && bExpired) return 1;
                if (aExpiring && !bExpiring) return -1;
                if (!aExpiring && bExpiring) return 1;
                
                // Sort by expiry date
                if (a.expires_on && b.expires_on) {
                  return new Date(a.expires_on).getTime() - new Date(b.expires_on).getTime();
                }
                
                return 0;
              })
              .map((doc) => {
                const isExpired = expiredDocs.includes(doc);
                const isExpiring = expiringDocs.includes(doc);
                const daysUntilExpiry = doc.expires_on ? 
                  differenceInDays(new Date(doc.expires_on), now) : null;

                return (
                  <div 
                    key={doc.id} 
                    className={`p-4 rounded-lg border ${
                      isExpired ? 'border-red-200 bg-red-50' : 
                      isExpiring ? 'border-yellow-200 bg-yellow-50' : 
                      'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`${
                          isExpired ? 'text-red-600' : 
                          isExpiring ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{doc.type}</h4>
                            <Badge variant={getStatusColor(doc)}>
                              {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid'}
                            </Badge>
                          </div>
                          {doc.expires_on && (
                            <div className="text-sm text-muted-foreground flex items-center space-x-2">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Expires: {format(new Date(doc.expires_on), 'MMM d, yyyy')}
                                {daysUntilExpiry !== null && (
                                  <span className={`ml-2 ${
                                    isExpired ? 'text-red-600' : 
                                    isExpiring ? 'text-yellow-600' : 
                                    'text-muted-foreground'
                                  }`}>
                                    ({isExpired ? 
                                      `${Math.abs(daysUntilExpiry)} days ago` : 
                                      `${daysUntilExpiry} days`
                                    })
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                          {doc.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {isExpired && (
                          <Button variant="outline" size="sm" className="text-red-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Renew
                          </Button>
                        )}
                        {isExpiring && (
                          <Button variant="outline" size="sm" className="text-yellow-600">
                            <Clock className="h-4 w-4 mr-1" />
                            Remind
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {compliance.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No compliance documents on file</p>
                <p className="text-sm">Add compliance documents to track expiration dates</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};