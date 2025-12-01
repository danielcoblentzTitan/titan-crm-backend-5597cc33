import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useCreateVendor, useUpdateVendor, type Vendor } from "@/integrations/supabase/hooks/useVendors";

const TRADE_OPTIONS = [
  "Builders",
  "Concrete", 
  "Drywall",
  "Electric",
  "Floor Installer",
  "Garage Doors",
  "Gutters",
  "HVAC",
  "Insulation",
  "Interior Doors and Trim",
  "Interior Framers",
  "Kitchen Installer",
  "Misc",
  "Painter",
  "Plumbers",
  "Punch Work",
  "Stone Mason"
];

interface VendorFormProps {
  vendor?: Vendor;
  onSuccess: () => void;
}

const VendorForm = ({ vendor, onSuccess }: VendorFormProps) => {
  const [formData, setFormData] = useState({
    name: vendor?.name || "",
    trade: vendor?.trade || "",
    primary_contact_name: vendor?.primary_contact_name || "",
    primary_email: vendor?.primary_email || "",
    phone: vendor?.phone || "",
    address: vendor?.address || "",
    city: vendor?.city || "",
    state: vendor?.state || "",
    zip: vendor?.zip || "",
    regions: vendor?.regions || [],
    status: vendor?.status || 'Active' as const,
    rating: vendor?.rating || 3,
    notes: vendor?.notes || "",
    email_prefs: vendor?.email_prefs || {
      format: "html",
      cc_list: [],
      blackout_hours: [],
      do_not_email: false
    }
  });

  const [newRegion, setNewRegion] = useState("");
  const [newCcEmail, setNewCcEmail] = useState("");

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      return;
    }

    if (vendor) {
      await updateVendor.mutateAsync({
        id: vendor.id,
        ...formData
      });
    } else {
      await createVendor.mutateAsync(formData);
    }
    
    onSuccess();
  };

  const addRegion = () => {
    if (newRegion && !formData.regions.includes(newRegion)) {
      setFormData(prev => ({
        ...prev,
        regions: [...prev.regions, newRegion]
      }));
      setNewRegion("");
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }));
  };

  const addCcEmail = () => {
    if (newCcEmail && !formData.email_prefs.cc_list.includes(newCcEmail)) {
      setFormData(prev => ({
        ...prev,
        email_prefs: {
          ...prev.email_prefs,
          cc_list: [...prev.email_prefs.cc_list, newCcEmail]
        }
      }));
      setNewCcEmail("");
    }
  };

  const removeCcEmail = (email: string) => {
    setFormData(prev => ({
      ...prev,
      email_prefs: {
        ...prev.email_prefs,
        cc_list: prev.email_prefs.cc_list.filter(e => e !== email)
      }
    }));
  };

  return (
    <div className="bg-background p-6 rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Company name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trade">Trade/Specialty</Label>
            <Select 
              value={formData.trade} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, trade: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a trade" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {TRADE_OPTIONS.map((trade) => (
                  <SelectItem key={trade} value={trade}>
                    {trade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Probation">Probation</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Blacklisted">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_contact_name">Primary Contact Name</Label>
            <Input
              id="primary_contact_name"
              value={formData.primary_contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_contact_name: e.target.value }))}
              placeholder="Contact person name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primary_email">Primary Email</Label>
            <Input
              id="primary_email"
              type="email"
              value={formData.primary_email}
              onChange={(e) => setFormData(prev => ({ ...prev, primary_email: e.target.value }))}
              placeholder="vendor@email.com (optional)"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Address</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            placeholder="123 Main Street"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
              placeholder="State"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={formData.zip}
              onChange={(e) => setFormData(prev => ({ ...prev, zip: e.target.value }))}
              placeholder="ZIP"
            />
          </div>
        </div>
      </div>

      {/* Service Regions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Service Regions</h3>
        <div className="flex space-x-2">
          <Input
            value={newRegion}
            onChange={(e) => setNewRegion(e.target.value)}
            placeholder="Add region (e.g., DE, MD, PA)"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
          />
          <Button type="button" onClick={addRegion}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.regions.map((region) => (
            <Badge key={region} variant="secondary" className="flex items-center gap-1">
              {region}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => removeRegion(region)}
              />
            </Badge>
          ))}
        </div>
      </div>

      {/* Email Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Email Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email_format">Email Format</Label>
            <Select 
              value={formData.email_prefs.format} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                email_prefs: { ...prev.email_prefs, format: value }
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>CC Email List</Label>
          <div className="flex space-x-2">
            <Input
              value={newCcEmail}
              onChange={(e) => setNewCcEmail(e.target.value)}
              placeholder="Add CC email"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCcEmail())}
            />
            <Button type="button" onClick={addCcEmail}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.email_prefs.cc_list.map((email) => (
              <Badge key={email} variant="outline" className="flex items-center gap-1">
                {email}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeCcEmail(email)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this vendor"
          rows={3}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createVendor.isPending || updateVendor.isPending}
        >
          {vendor ? "Update Vendor" : "Create Vendor"}
        </Button>
      </div>
      </form>
    </div>
  );
};

export default VendorForm;