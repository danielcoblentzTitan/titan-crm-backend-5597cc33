import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import { BudgetTracker } from "./BudgetTracker";
import { ChangeOrderManager } from "./ChangeOrderManager";
import { InvoiceManager } from "./InvoiceManager";
import type { Project } from "@/services/supabaseService";

interface FinancialDashboardProps {
  project: Project;
  onUpdate?: () => void;
}

export const FinancialDashboard = ({ project, onUpdate }: FinancialDashboardProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
        >
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="hidden sm:inline">Financial</span>
          <span className="sm:hidden">Finance</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            Financial Dashboard - {project.name}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="budget" className="w-full h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="budget">Budget Tracker</TabsTrigger>
            <TabsTrigger value="change-orders">Change Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>
          
          <div className="mt-4 overflow-y-auto max-h-[70vh]">
            <TabsContent value="budget" className="space-y-4">
              <BudgetTracker project={project} onUpdate={onUpdate} />
            </TabsContent>
            
            <TabsContent value="change-orders" className="space-y-4">
              <ChangeOrderManager project={project} onUpdate={onUpdate} />
            </TabsContent>
            
            <TabsContent value="invoices" className="space-y-4">
              <InvoiceManager project={project} onUpdate={onUpdate} />
            </TabsContent>
            
            
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};