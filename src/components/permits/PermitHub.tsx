import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useJurisdictions, usePermitApplications } from "@/integrations/supabase/hooks/usePermits";
import { Building, Phone, Mail, ExternalLink, Plus, Calculator, FileText, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PermitApplicationForm from "./PermitApplicationForm";
import TaskPackGenerator from "./TaskPackGenerator";
import AdvancedFeeCalculator from "./AdvancedFeeCalculator";
import PermitApplicationsList from "./PermitApplicationsList";
import AdminVerificationTracker from "./AdminVerificationTracker";

const PermitHub = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showFeeCalculator, setShowFeeCalculator] = useState(false);
  const [showTaskGenerator, setShowTaskGenerator] = useState(false);
  
  const { data: jurisdictions = [], isLoading: jurisdictionsLoading } = useJurisdictions();
  const { data: applications = [], isLoading: applicationsLoading } = usePermitApplications();

  const filteredJurisdictions = jurisdictions.filter(jurisdiction => {
    const matchesSearch = jurisdiction.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Delaware counties: have ", DE" suffix
    const delawareCounties = ["Kent County, DE", "New Castle County, DE", "Sussex County, DE"];
    
    // Maryland counties: all the new ones we added + any with "(MD)" suffix
    const marylandCounties = [
      "Queen Anne's County", "Talbot County", "Kent County (MD)", "Cecil County", 
      "Dorchester County", "Caroline County", "Wicomico County", "Worcester County", "Somerset County (MD)"
    ];
    
    let matchesState = true;
    if (selectedState === "DE") {
      matchesState = delawareCounties.includes(jurisdiction.name);
    } else if (selectedState === "MD") {
      matchesState = marylandCounties.includes(jurisdiction.name);
    }
    
    return matchesSearch && matchesState;
  });

  if (jurisdictionsLoading || applicationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Permits Management</h1>
          <p className="text-muted-foreground">
            Manage permit applications across Delaware counties
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFeeCalculator} onOpenChange={setShowFeeCalculator}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Fee Calculator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Advanced Permit Fee Calculator</DialogTitle>
              </DialogHeader>
              <AdvancedFeeCalculator />
            </DialogContent>
          </Dialog>

          <Dialog open={showTaskGenerator} onOpenChange={setShowTaskGenerator}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Task Pack Generator
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Generate Permit Task Pack</DialogTitle>
              </DialogHeader>
              <TaskPackGenerator onSuccess={() => setShowTaskGenerator(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={showApplicationForm} onOpenChange={setShowApplicationForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Create Permit Application</DialogTitle>
              </DialogHeader>
              <PermitApplicationForm onSuccess={() => setShowApplicationForm(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="jurisdictions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="task-packs">Task Packs</TabsTrigger>
          <TabsTrigger value="admin">Admin Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jurisdictions" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search jurisdictions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="max-w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="DE">Delaware</SelectItem>
                <SelectItem value="MD">Maryland</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJurisdictions.map((jurisdiction) => (
              <Card key={jurisdiction.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {jurisdiction.name}
                  </CardTitle>
                  <CardDescription>
                    {jurisdiction.project_types.length} project types available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {jurisdiction.contact_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4" />
                      <span>{jurisdiction.contact_phone}</span>
                    </div>
                  )}
                  
                  {jurisdiction.contact_email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4" />
                      <span>{jurisdiction.contact_email}</span>
                    </div>
                  )}
                  
                  {jurisdiction.portal_url && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full"
                      >
                        <a 
                          href={jurisdiction.portal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open Portal
                        </a>
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Project Types:</p>
                    {jurisdiction.project_types.map((projectType: any, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {projectType.type}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="applications">
          <PermitApplicationsList applications={applications} />
        </TabsContent>
        
        <TabsContent value="task-packs">
          <TaskPackGenerator onSuccess={() => {}} />
        </TabsContent>
        
        <TabsContent value="admin">
          <AdminVerificationTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermitHub;