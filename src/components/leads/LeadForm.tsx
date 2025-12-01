import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Lead, TeamMember } from "@/services/supabaseService";

interface LeadFormProps {
  lead?: Lead;
  teamMembers: TeamMember[];
  onSubmit: (data: Partial<Lead>) => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const INITIAL_FORM_DATA = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  status: "New",
  assigned_to: "unassigned",
  notes: "",
  source: "Website",
  estimated_value: 0,
  building_type: "Residential",
  address: "",
  city: "",
  state: "",
  zip: "",
  county: ""
};

export const LeadForm = ({ lead, teamMembers, onSubmit, onCancel, isEdit }: LeadFormProps) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const leadIdRef = useRef<string | undefined>();

  // Format currency with dollar sign and commas
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Update form data when lead changes, including estimated_value updates
  useEffect(() => {
    if (lead) {
      setFormData(prev => ({
        ...prev,
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        status: lead.status || "New",
        assigned_to: lead.assigned_to || "unassigned",
        notes: lead.notes || "",
        source: lead.source || "Website",
        estimated_value: lead.estimated_value || 0,
        building_type: lead.building_type || "Residential",
        address: lead.address || "",
        city: lead.city || "",
        state: lead.state || "",
        zip: lead.zip || "",
        county: lead.county || ""
      }));
    } else {
      setFormData(INITIAL_FORM_DATA);
    }
  }, [lead?.id, lead?.estimated_value]);

  const handleInputChange = useCallback((field: string, value: string | number) => {
    // Don't allow manual changes to estimated_value
    if (field === 'estimated_value') return;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      console.error('First name and last name are required');
      return;
    }
    
    const cleanData = {
      ...formData,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      company: formData.company.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      zip: formData.zip.trim() || null,
      county: formData.county.trim() || null,
      notes: formData.notes.trim() || null,
      assigned_to: formData.assigned_to === "unassigned" || !formData.assigned_to ? null : formData.assigned_to,
      estimated_value: Number(formData.estimated_value) || 0
    };
    
    onSubmit(cleanData);
  }, [formData, onSubmit]);

  const formatPhoneNumber = useCallback((value: string) => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return cleaned;
    }
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleInputChange('phone', formatted);
  }, [formatPhoneNumber, handleInputChange]);

  // Handle address autocomplete selection
  const handleAddressSelect = useCallback((addressData: {
    address: string;
    lat: number;
    lon: number;
    county: string | null;
  }) => {
    setFormData(prev => ({
      ...prev,
      address: addressData.address,
      county: addressData.county || ""
    }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            maxLength={14}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => handleInputChange('company', e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimated_value">Estimated Value</Label>
          <div className="relative">
            <Input
              id="estimated_value"
              type="text"
              value={formatCurrency(formData.estimated_value)}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Auto-calculated from fees statement"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-xs text-gray-500">Auto</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            This value is automatically calculated from the fees statement
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <AddressAutocomplete
          value={formData.address}
          onValueChange={(value) => handleInputChange('address', value)}
          onSelect={handleAddressSelect}
          placeholder="Start typing an address..."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="county">County</Label>
          <Input
            id="county"
            value={formData.county}
            onChange={(e) => handleInputChange('county', e.target.value)}
            placeholder="Auto-populated from address"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={formData.zip}
            onChange={(e) => handleInputChange('zip', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Phone">Phone</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Social Media">Social Media</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="building_type">Project Type</Label>
          <Select value={formData.building_type} onValueChange={(value) => handleInputChange('building_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Residential">Residential</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
              <SelectItem value="Barndominium">Barndominium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Proposal">Proposal</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Won">Won</SelectItem>
              <SelectItem value="Lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Assigned To</Label>
           <Select value={formData.assigned_to || "unassigned"} onValueChange={(value) => handleInputChange('assigned_to', value === "unassigned" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          placeholder="Additional notes about this lead..."
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#003562] hover:bg-[#003562]/90">
          {isEdit ? "Update Lead" : "Add Lead"}
        </Button>
      </div>
    </form>
  );
};
