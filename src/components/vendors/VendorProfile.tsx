import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Building, 
  Users, 
  FileText, 
  DollarSign, 
  MessageSquare,
  Calendar,
  AlertTriangle,
  Plus,
  Settings,
  Trash2
} from "lucide-react";
import { useVendor, useVendorContacts, useVendorCompliance, useDeleteVendor } from "@/integrations/supabase/hooks/useVendors";
import { useVendorMessages } from '@/integrations/supabase/hooks/useVendorMessages';
import { formatPhoneNumber, getPhoneLink } from "@/utils/phone";
import VendorForm from "./VendorForm";
import RFQManager from "./RFQManager";
import PurchaseOrderManager from "./PurchaseOrderManager";
import ScheduleManager from "./ScheduleManager";
import { CommandProcessor } from './CommandProcessor';
import { VendorScorecard } from './VendorScorecard';
import { CommunicationTimeline } from './CommunicationTimeline';
import { ComplianceManager } from './ComplianceManager';
import { FinancialDashboard } from './FinancialDashboard';
import { RiskAssessment } from './RiskAssessment';
import { AutomatedReminders } from './AutomatedReminders';

interface VendorProfileProps {
  vendorId: string;
  onBack: () => void;
  onDelete?: () => void;
}

const VendorProfile = ({ vendorId, onBack, onDelete }: VendorProfileProps) => {
  const { data: vendor, isLoading } = useVendor(vendorId);
  const { data: contacts = [] } = useVendorContacts(vendorId);
  const { data: compliance = [] } = useVendorCompliance(vendorId);
  const { data: messages = [] } = useVendorMessages(undefined, undefined, vendorId);
  const deleteVendor = useDeleteVendor();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate message stats
  const messageStats = {
    total: messages.length,
    inbound: messages.filter(m => m.direction === 'inbound').length,
    outbound: messages.filter(m => m.direction === 'outbound').length,
    withCommands: messages.filter(m => m.parsed_commands && m.parsed_commands.length > 0).length
  };

  const handleDeleteVendor = async () => {
    await deleteVendor.mutateAsync(vendorId);
    if (onDelete) {
      onDelete();
    } else {
      onBack();
    }
  };

  if (isLoading || !vendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vendor profile...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Probation': return 'secondary';
      case 'Inactive': return 'outline';
      case 'Blacklisted': return 'destructive';
      default: return 'outline';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'Valid': return 'default';
      case 'Expiring': return 'secondary';
      case 'Expired': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile Header */}
      <div className="block sm:hidden">
        <div className="flex items-center space-x-3 mb-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{vendor.name}</h1>
          </div>
        </div>
        
        {/* Vendor Header Card for Mobile */}
        <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{vendor.name}</h2>
              <p className="text-sm opacity-90">{vendor.code}</p>
              {vendor.trade && (
                <p className="text-sm opacity-90 mt-1">{vendor.trade}</p>
              )}
            </div>
            <Badge variant={getStatusColor(vendor.status)} className="bg-white/20 text-white border-white/30">
              {vendor.status}
            </Badge>
          </div>
        </div>

        {/* Mobile Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button variant="outline" className="h-12">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm 
                vendor={vendor} 
                onSuccess={() => setIsEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">{vendor.code}</Badge>
              {vendor.trade && (
                <Badge variant="secondary">{vendor.trade}</Badge>
              )}
              <Badge variant={getStatusColor(vendor.status)}>{vendor.status}</Badge>
              <Badge variant="outline">{vendor.inbound_alias}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Email Vendor
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm 
                vendor={vendor} 
                onSuccess={() => setIsEditDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{vendor?.name}"? This action cannot be undone and will also delete all associated RFQs, Purchase Orders, and Schedule Requests.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteVendor}
                  disabled={deleteVendor.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteVendor.isPending ? 'Deleting...' : 'Delete Vendor'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        {/* Mobile Navigation - Only 3 tabs */}
        <TabsList className="block sm:hidden">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
        </TabsList>
        
        {/* Desktop Navigation - All tabs */}
        <TabsList className="hidden sm:flex">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="commands">Commands</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Mobile Layout */}
          <div className="block sm:hidden space-y-4">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                  <p className="text-base font-medium">{vendor.primary_contact_name || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm break-all">{vendor.primary_email || 'Not specified'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {vendor.phone ? (
                      <a 
                        href={getPhoneLink(vendor.phone)}
                        className="text-sm font-medium text-primary"
                      >
                        {formatPhoneNumber(vendor.phone)}
                      </a>
                    ) : (
                      <span className="text-sm">Not specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rating</label>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-base font-medium">{vendor.rating}/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Card */}
            {vendor.address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="font-medium">{vendor.address}</p>
                    {(vendor.city || vendor.state || vendor.zip) && (
                      <p className="text-sm text-muted-foreground">
                        {vendor.city}{vendor.city && vendor.state && ', '}{vendor.state} {vendor.zip}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Service Regions */}
            {vendor.regions && vendor.regions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Service Regions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {vendor.regions.map((region) => (
                      <Badge key={region} variant="outline" className="text-sm">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Communication Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Email Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{messageStats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{messageStats.withCommands}</div>
                    <div className="text-sm text-muted-foreground">Commands</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Vendor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Primary Contact</label>
                      <p>{vendor.primary_contact_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rating</label>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span>{vendor.rating}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{vendor.primary_email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        {vendor.phone ? (
                          <a 
                            href={getPhoneLink(vendor.phone)}
                            className="hover:text-primary transition-colors md:pointer-events-none md:hover:text-current"
                          >
                            {formatPhoneNumber(vendor.phone)}
                          </a>
                        ) : (
                          <span>Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                {vendor.address && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p>{vendor.address}</p>
                        {(vendor.city || vendor.state || vendor.zip) && (
                          <p className="text-sm text-muted-foreground">
                            {vendor.city}{vendor.city && vendor.state && ', '}{vendor.state} {vendor.zip}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {vendor.regions && vendor.regions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Service Regions</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vendor.regions.map((region) => (
                        <Badge key={region} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {vendor.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm mt-1">{vendor.notes}</p>
                  </div>
                )}
               </CardContent>
             </Card>

             {/* Quick Stats */}
             <div className="space-y-4">
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-base">Email Communications</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-2">
                   <div className="grid grid-cols-2 gap-4 text-sm">
                     <div>
                       <span className="text-muted-foreground">Total Messages:</span>
                       <span className="ml-2 font-medium">{messageStats.total}</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Commands Received:</span>
                       <span className="ml-2 font-medium">{messageStats.withCommands}</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Inbound:</span>
                       <span className="ml-2 font-medium">{messageStats.inbound}</span>
                     </div>
                     <div>
                       <span className="text-muted-foreground">Outbound:</span>
                       <span className="ml-2 font-medium">{messageStats.outbound}</span>
                     </div>
                   </div>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-base">Open POs</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">0</div>
                   <p className="text-xs text-muted-foreground">In progress</p>
                 </CardContent>
               </Card>
               
               <Card>
                 <CardHeader className="pb-3">
                   <CardTitle className="text-base">Response Time</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">--</div>
                   <p className="text-xs text-muted-foreground">Average hours</p>
                 </CardContent>
               </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scorecard" className="space-y-6">
          <VendorScorecard 
            vendorId={vendorId}
            messages={messages}
            rfqs={[]}
            pos={[]}
            schedules={[]}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <CommunicationTimeline 
            messages={messages}
            rfqs={[]}
            pos={[]}
            schedules={[]}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialDashboard 
            vendorId={vendorId}
            vendorData={vendor}
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <ComplianceManager vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskAssessment 
            vendorId={vendorId}
            vendorData={vendor}
            messages={messages}
            compliance={compliance}
          />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <AutomatedReminders vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Vendor Contacts</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
          
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{contact.name}</h4>
                          {contact.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        {contact.title && (
                          <p className="text-sm text-muted-foreground">{contact.title}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          {contact.email && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span>{contact.email}</span>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <a 
                                href={getPhoneLink(contact.phone)}
                                className="hover:text-primary transition-colors md:pointer-events-none md:hover:text-current"
                              >
                                {formatPhoneNumber(contact.phone)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {contacts.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No contacts added</h3>
                  <p className="text-muted-foreground mb-4">Add vendor contacts to manage communications</p>
                  <Button>Add First Contact</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>


        <TabsContent value="pricing" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Pricing Catalog</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Price Item
            </Button>
          </div>
          
          <Card>
            <CardContent className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No pricing items</h3>
              <p className="text-muted-foreground mb-4">Add pricing items to track vendor costs and lead times</p>
              <Button>Add First Price Item</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email History</h3>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Compose Email
            </Button>
          </div>
          
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No messages</h3>
              <p className="text-muted-foreground mb-4">Email communications will appear here</p>
              <Button>Send First Email</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Tabs defaultValue="rfq" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rfq">RFQs</TabsTrigger>
              <TabsTrigger value="po">Purchase Orders</TabsTrigger>
              <TabsTrigger value="schedule">Scheduling</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rfq">
              <RFQManager vendorId={vendorId} />
            </TabsContent>
            
            <TabsContent value="po">
              <PurchaseOrderManager vendorId={vendorId} />
            </TabsContent>
            
            <TabsContent value="schedule">
              <ScheduleManager vendorId={vendorId} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="commands">
          <CommandProcessor vendorId={vendorId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorProfile;