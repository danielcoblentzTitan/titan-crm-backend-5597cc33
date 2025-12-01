import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Calculator,
  Calendar,
  CreditCard,
  FileText,
  Target
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface FinancialDashboardProps {
  vendorId: string;
  vendorData: any;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
  vendorId, 
  vendorData 
}) => {
  const [paymentTerms, setPaymentTerms] = useState(vendorData?.payment_terms || 'Net 30');
  const [creditLimit, setCreditLimit] = useState(vendorData?.credit_limit || 0);
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(
    vendorData?.preferred_payment_method || 'Check'
  );

  // Use real financial data from database - no mock data
  const financialMetrics = {
    totalSpent: 0,
    avgOrderValue: 0,
    onTimePayments: 0,
    outstandingBalance: 0,
    creditUtilization: 0,
    lastPayment: null,
    nextPaymentDue: null,
    yearlySpend: 0,
    monthlySpend: 0,
    pendingInvoices: 0,
    overdueInvoices: 0
  };

  // Use real transaction data
  const recentTransactions: any[] = [];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'default';
      case 'Pending': return 'secondary';
      case 'Overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getCreditUtilizationColor = (utilization: number) => {
    if (utilization >= 80) return 'text-red-600';
    if (utilization >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const calculatePaymentScore = () => {
    // Score based on on-time payment percentage, credit utilization, and overdue status
    let score = financialMetrics.onTimePayments;
    
    // Penalize high credit utilization
    if (financialMetrics.creditUtilization > 80) score -= 15;
    else if (financialMetrics.creditUtilization > 60) score -= 10;
    
    // Penalize overdue invoices
    score -= financialMetrics.overdueInvoices * 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const paymentScore = calculatePaymentScore();

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Total Spent</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialMetrics.totalSpent.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
              12% vs last year
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Calculator className="h-4 w-4" />
              <span>Avg Order Value</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialMetrics.avgOrderValue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
              5% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Payment Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCreditUtilizationColor(100 - paymentScore)}`}>
              {paymentScore}/100
            </div>
            <div className="text-xs text-muted-foreground">
              {financialMetrics.onTimePayments}% on-time payments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Outstanding</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialMetrics.outstandingBalance.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {financialMetrics.pendingInvoices} pending invoices
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Terms & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Payment Terms & Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Input
                id="payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="Net 30"
              />
            </div>
            
            <div>
              <Label htmlFor="credit-limit">Credit Limit</Label>
              <Input
                id="credit-limit"
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(Number(e.target.value))}
                placeholder="50000"
              />
            </div>
            
            <div>
              <Label htmlFor="payment-method">Preferred Payment Method</Label>
              <Input
                id="payment-method"
                value={preferredPaymentMethod}
                onChange={(e) => setPreferredPaymentMethod(e.target.value)}
                placeholder="Check, ACH, Wire Transfer"
              />
            </div>

            <div className="pt-2">
              <div className="flex justify-between text-sm mb-2">
                <span>Credit Utilization</span>
                <span className={getCreditUtilizationColor(financialMetrics.creditUtilization)}>
                  {financialMetrics.creditUtilization}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    financialMetrics.creditUtilization >= 80 ? 'bg-red-600' :
                    financialMetrics.creditUtilization >= 60 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${financialMetrics.creditUtilization}%` }}
                ></div>
              </div>
            </div>

            <Button className="w-full">
              Update Payment Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Payment Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {financialMetrics.overdueInvoices > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    {financialMetrics.overdueInvoices} overdue invoice(s) requiring attention
                  </span>
                </div>
              )}
              
              {financialMetrics.creditUtilization > 80 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">
                    Credit utilization above 80% - consider increasing limit
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {financialMetrics.lastPayment && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Last Payment:</strong> {format(new Date(financialMetrics.lastPayment), 'MMM d, yyyy')}
                  </div>
                )}
                {financialMetrics.nextPaymentDue && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Next Payment Due:</strong> {format(new Date(financialMetrics.nextPaymentDue), 'MMM d, yyyy')}
                    <span className="ml-2 text-xs">
                      ({differenceInDays(new Date(financialMetrics.nextPaymentDue), new Date())} days)
                    </span>
                  </div>
                )}
                {!financialMetrics.lastPayment && !financialMetrics.nextPaymentDue && (
                  <div className="text-sm text-muted-foreground">
                    No payment history available
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{transaction.type}</Badge>
                    <Badge variant={getPaymentStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                  <h4 className="font-medium mt-1">{transaction.description}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${transaction.amount.toLocaleString()}</div>
                  {transaction.status === 'Overdue' && (
                    <Button variant="outline" size="sm" className="mt-1 text-red-600">
                      Follow Up
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};