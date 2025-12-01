import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Truck, Mail, Phone, Star, Building, FileText, Calendar, AlertTriangle, MoreVertical, Edit, Trash2, ArrowLeft, TrendingUp } from "lucide-react";
import { formatPhoneNumber, getPhoneLink } from "@/utils/phone";
import { useVendors, useDeleteVendor } from "@/integrations/supabase/hooks/useVendors";
import VendorProfile from "./VendorProfile";
import VendorForm from "./VendorForm";
import { BulkEmailComposer } from "./BulkEmailComposer";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { VendorRecommendationEngine } from "./VendorRecommendationEngine";
import { PriceComparisonTool } from "./PriceComparisonTool";
import { SmartMatchingSystem } from "./SmartMatchingSystem";
import { GeographicVisualization } from "./GeographicVisualization";
import { IntegrationManager } from "./IntegrationManager";
import { AdvancedReporting } from "./AdvancedReporting";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VendorHub = () => {
  const { data: vendors = [], isLoading } = useVendors();
  const deleteVendor = useDeleteVendor();
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tradeFilter, setTradeFilter] = useState<string>("all");
  const [currentView, setCurrentView] = useState<"hub" | "analytics" | "smart-matching" | "price-comparison" | "recommendations" | "geographic" | "integrations" | "reporting">("hub");

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.trade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.primary_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.primary_contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    const matchesTrade = tradeFilter === "all" || vendor.trade === tradeFilter;
    
    return matchesSearch && matchesStatus && matchesTrade;
  });

  const uniqueTrades = [...new Set(vendors.map(v => v.trade).filter(Boolean))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'default';
      case 'Probation': return 'secondary';
      case 'Inactive': return 'outline';
      case 'Blacklisted': return 'destructive';
      default: return 'outline';
    }
  };

  const getTradeColor = (trade: string) => {
    if (!trade) return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    
    const normalizedTrade = trade.toLowerCase();
    
    // Check for keywords in trade names to handle variations
    if (normalizedTrade.includes('general') || normalizedTrade.includes('contractor')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (normalizedTrade.includes('electric')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (normalizedTrade.includes('plumb')) {
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    }
    if (normalizedTrade.includes('hvac') || normalizedTrade.includes('heating') || normalizedTrade.includes('cooling')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    if (normalizedTrade.includes('fram')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (normalizedTrade.includes('roof')) {
      return 'bg-slate-100 text-slate-800 border-slate-200';
    }
    if (normalizedTrade.includes('concrete') || normalizedTrade.includes('foundation')) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    if (normalizedTrade.includes('insulation')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (normalizedTrade.includes('drywall') || normalizedTrade.includes('sheetrock')) {
      return 'bg-violet-100 text-violet-800 border-violet-200';
    }
    if (normalizedTrade.includes('floor')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (normalizedTrade.includes('paint')) {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    }
    if (normalizedTrade.includes('landscap') || normalizedTrade.includes('garden')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (normalizedTrade.includes('mason') || normalizedTrade.includes('stone') || normalizedTrade.includes('brick')) {
      return 'bg-stone-100 text-stone-800 border-stone-200';
    }
    if (normalizedTrade.includes('tile') || normalizedTrade.includes('ceramic')) {
      return 'bg-teal-100 text-teal-800 border-teal-200';
    }
    if (normalizedTrade.includes('cabinet')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (normalizedTrade.includes('window') || normalizedTrade.includes('door')) {
      return 'bg-sky-100 text-sky-800 border-sky-200';
    }
    
    // Default color for unmatched trades
    return 'bg-neutral-100 text-neutral-800 border-neutral-200';
  };

  const handleDeleteVendor = async (vendorId: string) => {
    await deleteVendor.mutateAsync(vendorId);
  };

  if (selectedVendor) {
    return (
      <VendorProfile 
        vendorId={selectedVendor} 
        onBack={() => setSelectedVendor(null)}
        onDelete={() => setSelectedVendor(null)}
      />
    );
  }

  if (currentView === "analytics") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <PerformanceDashboard />
      </div>
    );
  }

  if (currentView === "smart-matching") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <SmartMatchingSystem />
      </div>
    );
  }

  if (currentView === "price-comparison") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <PriceComparisonTool />
      </div>
    );
  }

  if (currentView === "recommendations") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <VendorRecommendationEngine />
      </div>
    );
  }

  if (currentView === "geographic") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <GeographicVisualization />
      </div>
    );
  }

  if (currentView === "integrations") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <IntegrationManager />
      </div>
    );
  }

  if (currentView === "reporting") {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setCurrentView("hub")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Build Partners
        </Button>
        <AdvancedReporting />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vendors...</div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-First Interface - Only show on mobile */}
      <div className="block sm:hidden">
        {/* Mobile Header */}
        <div className="bg-primary text-primary-foreground p-4 rounded-lg mb-4">
          <h1 className="text-lg font-semibold">Build Partners</h1>
          <p className="text-sm opacity-90">Vendor Directory</p>
        </div>

        {/* Search Bar */}
        <div className="p-4 border rounded-lg mb-4 bg-background">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Mobile Vendor List */}
        <div className="space-y-3 pb-20">
          {filteredVendors.map((vendor) => (
            <div 
              key={vendor.id} 
              className="p-3 border rounded-lg bg-background space-y-2 cursor-pointer"
              onClick={() => setSelectedVendor(vendor.id)}
            >
              {/* Vendor Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{vendor.name}</h3>
                  {vendor.trade && (
                    <p className="text-sm text-muted-foreground">{vendor.trade}</p>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{vendor.rating || '4.5'}</span>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-1">
                {vendor.regions && vendor.regions.length > 0 && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{vendor.regions.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Last contact: Recently</span>
                </div>
              </div>

              {/* Status and Quick Actions */}
              <div className="flex items-center justify-between">
                <Badge variant={getStatusColor(vendor.status)}>
                  {vendor.status}
                </Badge>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="px-2 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (vendor.phone) {
                        window.open(getPhoneLink(vendor.phone), '_self');
                      }
                    }}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="px-2 h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (vendor.primary_email) {
                        window.open(`mailto:${vendor.primary_email}`, '_self');
                      }
                    }}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="px-2 h-7">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Bottom Actions */}
        <div className="fixed bottom-16 right-4 z-40">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full w-14 h-14 shadow-lg">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Desktop Interface - Hide on mobile */}
      <div className="hidden sm:block space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Build Partners</h1>
              <p className="text-muted-foreground">Email-native vendor management system</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setCurrentView("analytics")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("smart-matching")}>
              AI Smart Match
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("price-comparison")}>
              Price Analysis
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("recommendations")}>
              AI Recommendations
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("geographic")}>
              Geographic View
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("integrations")}>
              Integrations
            </Button>
            <Button variant="outline" onClick={() => setCurrentView("reporting")}>
              Advanced Reports
            </Button>
            <BulkEmailComposer 
              trigger={
                <Button variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Bulk Email
                </Button>
              } 
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border border-border shadow-lg">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <VendorForm onSuccess={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendors.filter(v => v.status === 'Active').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTrades.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending RFQs</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name, trade, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Probation">Probation</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Blacklisted">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {uniqueTrades.map(trade => (
                <SelectItem key={trade} value={trade || ''}>{trade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vendor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVendors.map((vendor) => (
            <Card 
              key={vendor.id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => setSelectedVendor(vendor.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate mb-2">
                      {vendor.name}
                    </CardTitle>
                    {vendor.trade && (
                      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getTradeColor(vendor.trade)}`}>
                        {vendor.trade}
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVendor(vendor.id);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Vendor
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem
                            onClick={(e) => e.stopPropagation()}
                            className="text-destructive focus:text-destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Vendor
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{vendor.name}"? This action cannot be undone and will also delete all associated RFQs, Purchase Orders, and Schedule Requests.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteVendor(vendor.id)}
                              disabled={deleteVendor.isPending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteVendor.isPending ? 'Deleting...' : 'Delete Vendor'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  {vendor.primary_contact_name && (
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {vendor.primary_contact_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{vendor.primary_contact_name}</p>
                        <p className="text-xs text-muted-foreground">Main Contact</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.primary_email && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate text-xs">{vendor.primary_email}</span>
                    </div>
                  )}
                  
                  {vendor.phone && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <a 
                        href={getPhoneLink(vendor.phone)}
                        className="hover:text-primary transition-colors text-xs md:pointer-events-none md:hover:text-current"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPhoneNumber(vendor.phone)}
                      </a>
                    </div>
                  )}
                </div>

                {/* Address */}
                {vendor.address && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {vendor.address}
                    {vendor.city && `, ${vendor.city}`}
                    {vendor.state && `, ${vendor.state}`}
                  </div>
                )}
                
                {/* Status and Rating */}
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusColor(vendor.status)} className="text-xs">
                    {vendor.status}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium">{vendor.rating}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open email composer
                    }}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVendor(vendor.id);
                    }}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No vendors found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || tradeFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Get started by adding your first vendor"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default VendorHub;