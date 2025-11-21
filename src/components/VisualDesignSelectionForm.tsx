import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Download, Save, Palette, Home, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DesignOption {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  image_url?: string;
  description?: string;
  file_path?: string;
}

interface DesignSelections {
  // Project Information
  projectName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;

  // Design Selections (only categories with actual images)
  sidingMaterial: string;
  roofingMaterial: string;
  flooringOption: string;
  cabinetStyle: string;
  countertopMaterial: string;
  tileOption: string;
  windowStyle: string;
  doorStyle: string;
  hardwareFinish: string;
  lightFixture: string;
  
  // Additional Notes
  specialRequests: string;
  notes: string;
}

interface VisualOptionSelectorProps {
  title: string;
  description?: string;
  options: DesignOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

function VisualOptionSelector({ title, description, options, selectedValue, onSelect }: VisualOptionSelectorProps) {
  const getImageUrl = (option: DesignOption) => {
    if (option.image_url) return option.image_url;
    if (option.file_path) {
      // Convert file path to Supabase storage URL
      return `${supabase.storage.from('documents').getPublicUrl(option.file_path).data.publicUrl}`;
    }
    return null;
  };

  // Only show options that have valid images
  const validOptions = options.filter(option => getImageUrl(option));
  
  if (validOptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-lg font-semibold">{title}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <RadioGroup value={selectedValue} onValueChange={onSelect}>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {validOptions.map((option) => {
            const imageUrl = getImageUrl(option);
            return (
              <div key={option.id} className="relative group flex">
                <RadioGroupItem 
                  value={option.name} 
                  id={option.id}
                  className="sr-only"
                />
                <Label 
                  htmlFor={option.id}
                  className={`cursor-pointer flex flex-col w-full border-3 rounded-xl p-3 transition-all duration-200 hover:shadow-lg min-h-fit ${
                    selectedValue === option.name 
                      ? 'border-primary bg-primary/10 shadow-md' 
                      : 'border-muted hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {imageUrl && (
                    <div className="aspect-square relative mb-3 overflow-hidden rounded-lg bg-muted flex-shrink-0">
                      <img 
                        src={imageUrl} 
                        alt={option.name}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      {selectedValue === option.name && (
                        <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-center flex-grow">
                    <p className="text-sm font-medium leading-relaxed break-words hyphens-auto whitespace-normal">{option.name}</p>
                    {option.description && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words whitespace-normal">{option.description}</p>
                    )}
                    {option.subcategory && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {option.subcategory}
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}

export function VisualDesignSelectionForm() {
  const { toast } = useToast();
  const [designOptions, setDesignOptions] = useState<DesignOption[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<DesignSelections>({
    // Project Information
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],

    // Design Selections
    sidingMaterial: '',
    roofingMaterial: '',
    flooringOption: '',
    cabinetStyle: '',
    countertopMaterial: '',
    tileOption: '',
    windowStyle: '',
    doorStyle: '',
    hardwareFinish: '',
    lightFixture: '',
    
    // Additional Notes
    specialRequests: '',
    notes: ''
  });

  useEffect(() => {
    fetchDesignOptions();
  }, []);

  const fetchDesignOptions = async () => {
    try {
      // Fetch design options from the dedicated design_options table
      const { data: options, error } = await supabase
        .from('design_options')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching design options:', error);
        return;
      }

      // Transform the data to match our interface
      const designOptions: DesignOption[] = options?.map(option => ({
        id: option.id,
        name: option.name,
        category: option.category,
        subcategory: option.subcategory || undefined,
        description: option.description || undefined,
        file_path: option.file_path
      })) || [];

      setDesignOptions(designOptions);

      // Get unique categories that have options
      const categories = [...new Set(designOptions.map(option => option.category))];
      setAvailableCategories(categories);

    } catch (error) {
      console.error('Error loading design options:', error);
      toast({
        title: "Error Loading Design Options",
        description: "Could not load design images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getOptionsByCategory = (category: string): DesignOption[] => {
    return designOptions.filter(option => option.category === category);
  };

  const handleInputChange = (field: keyof DesignSelections, value: string) => {
    setSelections(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePDF = () => {
    const content = `
VISUAL DESIGN SELECTION FORM

Project Information:
- Project Name: ${selections.projectName}
- Customer Name: ${selections.customerName}
- Email: ${selections.customerEmail}
- Phone: ${selections.customerPhone}
- Date: ${selections.date}

DESIGN SELECTIONS:
${availableCategories.includes('siding') ? `- Siding Material: ${selections.sidingMaterial}` : ''}
${availableCategories.includes('roofing') ? `- Roofing Material: ${selections.roofingMaterial}` : ''}
${availableCategories.includes('flooring') ? `- Flooring Option: ${selections.flooringOption}` : ''}
${availableCategories.includes('cabinets') ? `- Cabinet Style: ${selections.cabinetStyle}` : ''}
${availableCategories.includes('countertops') ? `- Countertop Material: ${selections.countertopMaterial}` : ''}
${availableCategories.includes('tile') ? `- Tile Option: ${selections.tileOption}` : ''}
${availableCategories.includes('windows') ? `- Window Style: ${selections.windowStyle}` : ''}
${availableCategories.includes('doors') ? `- Door Style: ${selections.doorStyle}` : ''}
${availableCategories.includes('hardware') ? `- Hardware Finish: ${selections.hardwareFinish}` : ''}
${availableCategories.includes('fixtures') ? `- Light Fixture: ${selections.lightFixture}` : ''}

ADDITIONAL NOTES:
- Special Requests: ${selections.specialRequests}
- Notes: ${selections.notes}

This form was generated from your visual design portal selections.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Design_Selections_${selections.customerName || 'Customer'}_${selections.date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Design Selections Downloaded",
      description: "Your visual design selections have been downloaded.",
    });
  };

  const saveSelections = async () => {
    try {
      localStorage.setItem('visualDesignSelections', JSON.stringify(selections));
      
      toast({
        title: "Selections Saved",
        description: "Your visual design selections have been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Error",
        description: "Could not save your selections. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your design options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-primary">Visual Design Selection</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Browse through your available design options below. Each image shows the actual materials 
          and finishes we have available for your project. Select your preferences by clicking on the options.
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={saveSelections} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Save Progress
          </Button>
          <Button onClick={generatePDF}>
            <Download className="h-4 w-4 mr-2" />
            Download Selections
          </Button>
        </div>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Project Information
          </CardTitle>
          <CardDescription>
            Please provide your project details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={selections.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selections.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="customerName">Your Name</Label>
              <Input
                id="customerName"
                value={selections.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                type="email"
                value={selections.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={selections.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Design Categories - Only show categories that have actual images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Design Selections
          </CardTitle>
          <CardDescription>
            Choose from your available design options. Only categories with available options are shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {availableCategories.includes('siding') && (
            <>
              <VisualOptionSelector
                title="Siding Materials"
                description="Choose your exterior siding material and color"
                options={getOptionsByCategory('siding')}
                selectedValue={selections.sidingMaterial}
                onSelect={(value) => handleInputChange('sidingMaterial', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('roofing') && (
            <>
              <VisualOptionSelector
                title="Roofing Materials"
                description="Select your roofing material and color"
                options={getOptionsByCategory('roofing')}
                selectedValue={selections.roofingMaterial}
                onSelect={(value) => handleInputChange('roofingMaterial', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('flooring') && (
            <>
              <VisualOptionSelector
                title="Flooring Options"
                description="Choose your interior flooring materials"
                options={getOptionsByCategory('flooring')}
                selectedValue={selections.flooringOption}
                onSelect={(value) => handleInputChange('flooringOption', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('cabinets') && (
            <>
              <VisualOptionSelector
                title="Cabinet Styles"
                description="Select your kitchen and bathroom cabinet style and color"
                options={getOptionsByCategory('cabinets')}
                selectedValue={selections.cabinetStyle}
                onSelect={(value) => handleInputChange('cabinetStyle', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('countertops') && (
            <>
              <VisualOptionSelector
                title="Countertop Materials"
                description="Choose your countertop material and pattern"
                options={getOptionsByCategory('countertops')}
                selectedValue={selections.countertopMaterial}
                onSelect={(value) => handleInputChange('countertopMaterial', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('tile') && (
            <>
              <VisualOptionSelector
                title="Tile Options"
                description="Select tile for bathrooms, backsplashes, and other areas"
                options={getOptionsByCategory('tile')}
                selectedValue={selections.tileOption}
                onSelect={(value) => handleInputChange('tileOption', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('windows') && (
            <>
              <VisualOptionSelector
                title="Window Styles"
                description="Choose your window style and color"
                options={getOptionsByCategory('windows')}
                selectedValue={selections.windowStyle}
                onSelect={(value) => handleInputChange('windowStyle', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('doors') && (
            <>
              <VisualOptionSelector
                title="Door Styles"
                description="Select your interior and exterior door styles"
                options={getOptionsByCategory('doors')}
                selectedValue={selections.doorStyle}
                onSelect={(value) => handleInputChange('doorStyle', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('hardware') && (
            <>
              <VisualOptionSelector
                title="Hardware Finishes"
                description="Choose your door handles, hinges, and cabinet hardware finish"
                options={getOptionsByCategory('hardware')}
                selectedValue={selections.hardwareFinish}
                onSelect={(value) => handleInputChange('hardwareFinish', value)}
              />
              <Separator />
            </>
          )}

          {availableCategories.includes('fixtures') && (
            <>
              <VisualOptionSelector
                title="Light Fixtures"
                description="Select your lighting fixtures and finishes"
                options={getOptionsByCategory('fixtures')}
                selectedValue={selections.lightFixture}
                onSelect={(value) => handleInputChange('lightFixture', value)}
              />
            </>
          )}

          {availableCategories.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Design Options Available</h3>
              <p className="mt-2 text-muted-foreground">
                Design options are being updated. Please check back soon or contact us for assistance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes & Special Requests</CardTitle>
          <CardDescription>
            Please share any special requests or additional information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={selections.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              placeholder="Any specific requirements, custom modifications, or special requests..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={selections.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any other comments, questions, or information you'd like to share..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Final Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <Button onClick={saveSelections} variant="outline" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Progress
        </Button>
        <Button onClick={generatePDF} size="lg">
          <Download className="h-4 w-4 mr-2" />
          Download Selections
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground border-t pt-4">
        <p>
          This form displays your actual available design options with real product images. 
          Your selections will be used to create your custom design specification.
        </p>
        <p className="mt-2">
          <Badge variant="outline">
            All images show actual available materials and finishes
          </Badge>
        </p>
      </div>
    </div>
  );
}