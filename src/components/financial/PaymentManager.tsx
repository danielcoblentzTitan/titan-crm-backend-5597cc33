import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, CheckCircle, Clock, Check, Edit3, Save, X, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addDays, subDays, format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import type { Project } from "@/services/supabaseService";


interface PaymentManagerProps {
  project: Project;
  onUpdate?: () => void;
}

interface PaymentMilestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'due' | 'upcoming' | 'overdue';
  description: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  project_name: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  job_type: string;
  notes: string;
  paid_date?: string;
}

export const PaymentManager = ({ project }: PaymentManagerProps) => {
  const { toast } = useToast();
  
  console.log('🔧 BUILDER PaymentManager rendered with project:', project);
  console.log('🔧 This is the BUILDER component - should NOT have Pay buttons');
  console.log('Project start_date:', project.start_date);
  console.log('Project estimated_completion:', project.estimated_completion);
  console.log('Project ID:', project.id);
  
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, 'paid' | 'due' | 'upcoming' | 'overdue'>>({
    '1': 'paid',
    '2': 'due',
    '3': 'upcoming',
    '4': 'upcoming',
    '5': 'upcoming',
    '6': 'upcoming',
    '7': 'upcoming'
  });
  const [projectSchedule, setProjectSchedule] = useState<any>(null);
  const [paymentDueDates, setPaymentDueDates] = useState<Record<string, string>>({});
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [tempDueDates, setTempDueDates] = useState<Record<string, string>>({});
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  
  // Draw percentages fallback if no invoice exists for a milestone
  const DRAW_PERCENTAGES: Record<string, number> = {
    '1': 0.20,
    '2': 0.20,
    '3': 0.15,
    '4': 0.15,
    '5': 0.15,
    '6': 0.10,
    '7': 0.05,
  };

  const extractDrawNumber = (text?: string) => {
    if (!text) return undefined;
    const match = text.toLowerCase().match(/draw\s*(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  };

  const findInvoiceForDraw = (drawId: string): Invoice | undefined => {
    const drawNumber = parseInt(drawId, 10);
    
    // Create a mapping to track which invoice is assigned to which draw
    const invoiceAssignments: Record<string, Invoice[]> = {};
    
    // First pass: collect all potential matches for each draw
    allInvoices.forEach(inv => {
      const notesDrawNumber = extractDrawNumber(inv.notes);
      const invoiceDrawNumber = extractDrawNumber(inv.invoice_number);
      
      // Check invoice_number first (highest priority)
      if (invoiceDrawNumber !== undefined) {
        const key = invoiceDrawNumber.toString();
        if (!invoiceAssignments[key]) invoiceAssignments[key] = [];
        invoiceAssignments[key].push(inv);
      }
      // Only check notes if invoice_number doesn't have a draw number
      else if (notesDrawNumber !== undefined) {
        const key = notesDrawNumber.toString();
        if (!invoiceAssignments[key]) invoiceAssignments[key] = [];
        invoiceAssignments[key].push(inv);
      }
    });
    
    // Get candidates for this specific draw
    const candidates = invoiceAssignments[drawId] || [];
    
    if (candidates.length === 0) return undefined;
    
    // If multiple candidates, prefer paid invoices, then sort by due date
    const paid = candidates.find(c => c.status === 'Paid');
    if (paid) return paid;
    
    // Sort by due date and return the earliest one for this specific draw
    return candidates.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
  };

  const projectBudget = project.budget || 0;
  useEffect(() => {
    console.log('useEffect triggered - project start_date:', project.start_date);
    if (project.start_date) {
      console.log('Calling calculatePaymentDueDates immediately with project data');
      calculatePaymentDueDates(null, []);
    }
  }, [project.start_date, project.estimated_completion]);

  // Fetch project schedule, milestone data, and invoices
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!project.id) {
        console.log('No project ID, skipping data fetch');
        return;
      }

      try {
        // Fetch project schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('project_schedules')
          .select('*')
          .eq('project_id', project.id)
          .maybeSingle();

        if (scheduleError) {
          console.error('Error fetching project schedule:', scheduleError);
        }

        // Fetch project milestones
        const { data: milestonesData, error: milestonesError } = await supabase
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('target_date');

        if (milestonesError) {
          console.error('Error fetching project milestones:', milestonesError);
        }

        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .eq('project_id', project.id)
          .order('issue_date', { ascending: true });

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
        } else {
          setAllInvoices(invoicesData || []);
        }

        console.log('Fetched schedule data:', scheduleData);
        console.log('Fetched milestones data:', milestonesData);
        console.log('Fetched invoices data:', invoicesData);
        
        setProjectSchedule(scheduleData);
        
        // Calculate payment due dates using both schedule and milestones
        calculatePaymentDueDates(scheduleData, milestonesData);
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, [project.id]);

  // Calculate payment due dates based on project schedule phases only
  const calculatePaymentDueDates = (scheduleData: any, milestonesData: any[] = []) => {
    console.log('calculatePaymentDueDates called with:', { scheduleData, milestonesData, projectStartDate: project.start_date });
    
    if (!project.start_date) {
      console.log('No project start date, skipping calculation');
      return;
    }

    const projectStartDate = new Date(project.start_date.split('T')[0] + 'T12:00:00Z');
    const newDueDates: Record<string, string> = {};

    // Deposit (0): No due date - when project is created
    // Draw 1: Project start date (when permit approved button is hit)
    newDueDates['1'] = format(projectStartDate, 'yyyy-MM-dd');
    
    // Draw 2: 3 days before project start (lumber delivery)
    newDueDates['2'] = format(subDays(projectStartDate, 3), 'yyyy-MM-dd');

    // For remaining draws, use schedule data if available
    if (scheduleData?.schedule_data) {
      const schedule = scheduleData.schedule_data;
      
      // Find phases in the schedule
      const framingPhase = schedule.find((phase: any) => 
        phase.name?.toLowerCase().includes('framing crew')
      );
      
      const insulationPhase = schedule.find((phase: any) => 
        phase.name?.toLowerCase().includes('insulation')
      );
      
      const drywallPhase = schedule.find((phase: any) => 
        phase.name?.toLowerCase().includes('drywall')
      );

      // Draw 3: 4th day of framing crew phase
      if (framingPhase?.startDate) {
        const framingStart = new Date(framingPhase.startDate + 'T12:00:00Z');
        newDueDates['3'] = format(addDays(framingStart, 3), 'yyyy-MM-dd'); // 4th day (0-indexed)
      } else {
        newDueDates['3'] = format(addDays(projectStartDate, 10), 'yyyy-MM-dd');
      }

      // Draw 4: Final day of framing crew phase
      if (framingPhase?.endDate) {
        newDueDates['4'] = framingPhase.endDate;
      } else {
        newDueDates['4'] = format(addDays(projectStartDate, 21), 'yyyy-MM-dd');
      }

      // Draw 5: 1 day before insulation starts
      if (insulationPhase?.startDate) {
        const insulationStart = new Date(insulationPhase.startDate + 'T12:00:00Z');
        newDueDates['5'] = format(subDays(insulationStart, 1), 'yyyy-MM-dd');
      } else {
        newDueDates['5'] = format(addDays(projectStartDate, 34), 'yyyy-MM-dd');
      }

      // Draw 6: Final day of drywall phase
      if (drywallPhase?.endDate) {
        newDueDates['6'] = drywallPhase.endDate;
      } else {
        newDueDates['6'] = format(addDays(projectStartDate, 70), 'yyyy-MM-dd');
      }
    } else {
      // Fallback calculations when no schedule data
      newDueDates['3'] = format(addDays(projectStartDate, 10), 'yyyy-MM-dd');
      newDueDates['4'] = format(addDays(projectStartDate, 21), 'yyyy-MM-dd');
      newDueDates['5'] = format(addDays(projectStartDate, 34), 'yyyy-MM-dd');
      newDueDates['6'] = format(addDays(projectStartDate, 70), 'yyyy-MM-dd');
    }

    // Draw 7: Project completion date
    if (project.estimated_completion) {
      const completionDate = new Date(project.estimated_completion.split('T')[0] + 'T12:00:00Z');
      newDueDates['7'] = format(completionDate, 'yyyy-MM-dd');
    } else {
      newDueDates['7'] = format(addDays(projectStartDate, 90), 'yyyy-MM-dd');
    }

    console.log('Calculated due dates:', newDueDates);
    setPaymentDueDates(newDueDates);
    setTempDueDates(newDueDates);
  };

  // Handle date editing
  const startEditingDate = (paymentId: string) => {
    setEditingDateId(paymentId);
    setTempDueDates(prev => ({
      ...prev,
      [paymentId]: paymentDueDates[paymentId] || ''
    }));
  };

  const cancelEditingDate = () => {
    setEditingDateId(null);
    setTempDueDates({});
  };

  const saveEditedDate = (paymentId: string) => {
    const newDate = tempDueDates[paymentId];
    if (newDate) {
      setPaymentDueDates(prev => ({
        ...prev,
        [paymentId]: newDate
      }));
      
      toast({
        title: "Date Updated",
        description: `Payment due date has been updated to ${new Date(newDate).toLocaleDateString()}.`,
      });
      
      // In a real app, you would save this to the database here
      // await updatePaymentDueDate(project.id, paymentId, newDate);
    }
    setEditingDateId(null);
    setTempDueDates({});
  };

  const handleDateSelect = (paymentId: string, date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setTempDueDates(prev => ({
        ...prev,
        [paymentId]: formattedDate
      }));
    }
  };
  
  // Find invoices and create payment schedule with actual invoice data
  
  const getPaymentMilestoneFromInvoice = (milestoneId: string) => {
    let invoice: Invoice | undefined;
    let title = '';
    let description = '';
    let dueDate = '';

    switch (milestoneId) {
      case '0': // Deposit
        invoice = allInvoices.find(inv => {
          const notes = inv.notes?.toLowerCase() || '';
          return notes.includes('deposit') || notes.includes('contract signing');
        });
        title = 'Deposit';
        dueDate = ''; // No due date - when customer decides
        description = 'Initial deposit when project is created.';
        break;
      case '1':
        invoice = findInvoiceForDraw('1');
        title = 'Draw 1';
        dueDate = paymentDueDates['1'] || format(new Date(project.start_date || new Date()), 'yyyy-MM-dd');
        description = 'Project start date (when permit is approved).';
        break;
      case '2':
        invoice = findInvoiceForDraw('2');
        title = 'Draw 2';
        dueDate = paymentDueDates['2'] || format(subDays(new Date(project.start_date || new Date()), 3), 'yyyy-MM-dd');
        description = '3 days before project start (lumber delivery).';
        break;
      case '3':
        invoice = findInvoiceForDraw('3');
        title = 'Draw 3';
        dueDate = paymentDueDates['3'] || format(addDays(new Date(project.start_date || new Date()), 10), 'yyyy-MM-dd');
        description = '4th day of the framing crew phase.';
        break;
      case '4':
        invoice = findInvoiceForDraw('4');
        title = 'Draw 4';
        dueDate = paymentDueDates['4'] || format(addDays(new Date(project.start_date || new Date()), 21), 'yyyy-MM-dd');
        description = 'Final day of the framing crew phase (Dried-In).';
        break;
      case '5':
        invoice = findInvoiceForDraw('5');
        title = 'Draw 5';
        dueDate = paymentDueDates['5'] || format(addDays(new Date(project.start_date || new Date()), 34), 'yyyy-MM-dd');
        description = '1 day before insulation starts.';
        break;
      case '6':
        invoice = findInvoiceForDraw('6');
        title = 'Draw 6';
        dueDate = paymentDueDates['6'] || format(addDays(new Date(project.start_date || new Date()), 70), 'yyyy-MM-dd');
        description = 'Final day of drywall phase.';
        break;
      case '7':
        invoice = findInvoiceForDraw('7');
        title = 'Draw 7';
        dueDate = paymentDueDates['7'] || format(new Date(project.estimated_completion || project.start_date || new Date()), 'yyyy-MM-dd');
        description = 'Project completion date.';
        break;
    }

    const expectedAmount = Math.round((DRAW_PERCENTAGES[milestoneId] || 0) * projectBudget);
    const amount = invoice ? invoice.total : expectedAmount;

    // Determine status based on invoice or due date
    let status: 'paid' | 'due' | 'upcoming' | 'overdue' = 'upcoming';
    const today = new Date();

    if (invoice) {
      if (invoice.status === 'Paid') {
        status = 'paid';
      } else {
        const invoiceDueDate = new Date(invoice.due_date);
        if (invoiceDueDate <= today) {
          status = invoiceDueDate.toDateString() === today.toDateString() ? 'due' : 'overdue';
        }
      }
    } else if (dueDate) {
      const dd = new Date(dueDate);
      if (dd <= today) {
        status = dd.toDateString() === today.toDateString() ? 'due' : 'overdue';
      }
    }

    return {
      id: milestoneId,
      title,
      amount,
      dueDate,
      status,
      description,
      invoice
    };
  };

  // Create payment schedule reactively based on invoices
  const paymentSchedule: (PaymentMilestone & { invoice?: Invoice })[] = useMemo(() => {
    console.log('=== Creating payment schedule with invoices:', allInvoices.length);
    return [
      getPaymentMilestoneFromInvoice('0'), // Contract Signing
      getPaymentMilestoneFromInvoice('1'), // Permit Approved
      getPaymentMilestoneFromInvoice('2'), // Lumber Delivery
      getPaymentMilestoneFromInvoice('3'), // Trusses Set
      getPaymentMilestoneFromInvoice('4'), // Dried-In
      getPaymentMilestoneFromInvoice('5'), // Rough-Ins Complete
      getPaymentMilestoneFromInvoice('6'), // Drywall Installed
      getPaymentMilestoneFromInvoice('7'), // Certificate of Occupancy
    ];
  }, [allInvoices, project, paymentDueDates]); // Re-create when invoices change
  
  const markPaymentAsPaid = async (paymentId: string, paymentTitle: string) => {
    const payment = paymentSchedule.find(p => p.id === paymentId);
    if (!payment?.invoice) {
      toast({
        title: "Error",
        description: "No invoice found for this payment.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'Paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', payment.invoice.id);

      if (error) {
        console.error('Error updating invoice:', error);
        toast({
          title: "Error", 
          description: "Failed to mark payment as paid.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setAllInvoices(prev => prev.map(inv => 
        inv.id === payment.invoice?.id 
          ? { ...inv, status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }
          : inv
      ));

      toast({
        title: "Payment Marked as Paid",
        description: `${paymentTitle} has been marked as paid.`,
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to mark payment as paid.",
        variant: "destructive"
      });
    }
  };

  const markInvoiceAsPaid = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'Paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error updating invoice:', error);
        toast({
          title: "Error",
          description: "Failed to mark invoice as paid.",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setAllInvoices(prev => prev.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: 'Paid', paid_date: new Date().toISOString().split('T')[0] }
          : inv
      ));

      toast({
        title: "Invoice Marked as Paid",
        description: "Invoice has been marked as paid.",
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'due':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'due':
        return <Clock className="h-4 w-4 text-red-600" />;
      case 'upcoming':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'overdue':
        return <Clock className="h-4 w-4 text-red-800" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (status: string) => {
    return status === "Draft" ? "Pending" : status;
  };

  // For customer portal: Filter invoices to only show those due today or past due date
  // For builder: Show all invoices
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // For now, show customer view (filtered invoices) to test customer portal experience
  const availableInvoices = allInvoices.filter(invoice => {
    const dueDate = new Date(invoice.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today; // Only show invoices due today or overdue for customers
  });
  
  // Calculate invoice summary data
  const totalInvoiced = availableInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const paidInvoices = availableInvoices.filter(inv => inv.status === 'Paid');
  const upcomingInvoices = availableInvoices.filter(inv => inv.status !== 'Paid');
  const totalPaidInvoices = paidInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const outstandingAmount = totalInvoiced - totalPaidInvoices;

  const totalAmount = paymentSchedule.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = paymentSchedule
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = totalAmount - paidAmount;
  const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Invoice Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">{availableInvoices.length}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">${totalInvoiced.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Invoiced</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">${totalPaidInvoices.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold">${outstandingAmount.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600">${paidAmount.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Schedule Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">${remainingAmount.toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Schedule Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{progressPercentage.toFixed(1)}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Project Payments</span>
              <span>{progressPercentage.toFixed(1)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${paidAmount.toLocaleString()} paid</span>
              <span>${totalAmount.toLocaleString()} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {paymentSchedule.map((payment, index) => {
              // The corresponding invoice is already included in the payment object
              const correspondingInvoice = payment.invoice;

              return (
                <div key={payment.id} className="flex flex-col p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100">
                        <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-medium">{payment.title}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">{payment.description}</p>
                        <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <span className="text-xs sm:text-sm text-muted-foreground">Due:</span>
                          {editingDateId === payment.id ? (
                            <div className="flex items-center space-x-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                      "h-8 px-2 text-xs font-normal",
                                      !tempDueDates[payment.id] && "text-muted-foreground"
                                    )}
                                  >
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {tempDueDates[payment.id] 
                                      ? new Date(tempDueDates[payment.id]).toLocaleDateString()
                                      : "Pick date"
                                    }
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                                  <CalendarComponent
                                    mode="single"
                                    selected={tempDueDates[payment.id] ? new Date(tempDueDates[payment.id]) : undefined}
                                    onSelect={(date) => handleDateSelect(payment.id, date)}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                                onClick={() => saveEditedDate(payment.id)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                                onClick={cancelEditingDate}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(payment.dueDate).toLocaleDateString()}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                                onClick={() => startEditingDate(payment.id)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      <div className="text-left sm:text-right">
                        <p className="text-lg sm:text-xl font-semibold">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {((payment.amount / totalAmount) * 100).toFixed(0)}% of total
                        </p>
                        {payment.status === 'paid' && (
                          <p className="text-xs text-green-600 font-medium">PAID</p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {getStatusIcon(payment.status)}
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status === 'paid' ? 'Paid' : 
                           payment.status === 'due' ? 'Due Now' :
                           payment.status === 'upcoming' ? 'Upcoming' : 'Overdue'}
                        </Badge>
                        
                        {payment.status !== 'paid' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-3"
                              >
                                <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                <span className="hidden sm:inline">Mark Paid</span>
                                <span className="sm:hidden">Paid</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Mark Payment as Paid</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to mark this payment as paid?
                                  <div className="mt-2 p-3 bg-gray-50 rounded">
                                    <p className="font-medium">{payment.title}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Amount: ${payment.amount.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Due: {new Date(payment.dueDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => markPaymentAsPaid(payment.id, payment.title)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark as Paid
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  {correspondingInvoice && (
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-lg border-l-4 border-l-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">Invoice: {correspondingInvoice.invoice_number}</span>
                            <Badge className={getInvoiceStatusColor(correspondingInvoice.status)}>
                              {getDisplayStatus(correspondingInvoice.status)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Subtotal:</span> ${correspondingInvoice.subtotal?.toLocaleString() || '0'}
                            </div>
                            <div>
                              <span className="font-medium">Tax:</span> ${correspondingInvoice.tax?.toLocaleString() || '0'}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> ${correspondingInvoice.total?.toLocaleString() || '0'}
                            </div>
                            <div>
                              <span className="font-medium">Due:</span> {new Date(correspondingInvoice.due_date).toLocaleDateString()}
                            </div>
                          </div>
                          {correspondingInvoice.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Notes:</span> {correspondingInvoice.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Invoice
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoices overview removed per request */}
    </div>
  );
};