import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BarChart3, Home, User, Calendar, DollarSign, Edit2, Check, X, Plus, FileText, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabaseService, type Project } from "@/services/supabaseService";
import { useDesignSelections } from "@/hooks/useDesignSelections";
import { COLOR_HEX_MAP } from "@/constants/titanColors";
import { generateProjectSummaryPDF } from "@/utils/projectSummaryPdfGenerator";
import DesignSelections from "@/components/DesignSelections";

const Summary = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editable fields state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editableValues, setEditableValues] = useState<{ [key: string]: string }>({});
  const [projectNotes, setProjectNotes] = useState<{text: string; date: string}[]>([]);
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  
  // Fetch design selections data
  const {
    selections,
    loading: selectionsLoading,
    existingDocument
  } = useDesignSelections(id || "");

  // Initialize editable values when project loads
  useEffect(() => {
    if (project && id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea') {
      setEditableValues({
        buildingSize: '44 x 115 x 18',
        ltSize: "12' Wraparound",
        footerType: 'Poured Footers',
        postSize: '4Ply 2x6 Greenposts',
        overhangSize: '12" E & G',
        roofPitch: '6/12',
        atticTruss: 'No',
        concreteThickness: '4" House and LT and 6" Shop',
        metalGauge: '26 Ga. Textured',
        wainscotingSize: 'None',
        entryDoors: 'Thermatru',
        garageDoors: 'Clopay Custom Design',
        windows: 'Marvin Black Ext White Int Windows',
        shutters: 'No Shutters',
        electricPackage: 'Whole House',
        insulationPackage: 'Custom Package',
        linerPanelPackage: 'None',
        gutters: '5" Black Gutters and Downspouts',
        cupola: 'No Cupola',
        garageOpeners: '3 openers',
        // Color selections
        roofColor: 'Black',
        wallColor: 'Charcoal',
        trimColor: 'Black',
        wainscotingColor: 'No Wainscoting',
        garageDoorColor: 'Wood Design',
        ltCeilingColor: 'Black',
        ltWrappedHeadersColor: 'Black',
        wrappedPostsColor: 'Wood Finish to Match Garage Doors'
      });
      setProjectNotes([
        { text: 'Customer requested extra insulation and was priced by Jesse at Accurate Insulation.', date: new Date().toLocaleDateString() },
        { text: 'The Garage Doors were quoted by Dennis at Hickman Overhead Door.', date: new Date().toLocaleDateString() },
        { text: 'We are installing a wood stove kit provided by the customer and will include a pipe going through the roof that will require a special boot for heat.', date: new Date().toLocaleDateString() },
        { text: "There is also a 5'x18' Stonewall behind the stove.", date: new Date().toLocaleDateString() }
      ]);
    } else {
      setProjectNotes([{ text: 'No additional notes at this time.', date: new Date().toLocaleDateString() }]);
    }
  }, [project, id]);

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const projects = await supabaseService.getProjects();
      const foundProject = projects.find(p => p.id === id);
      
      if (foundProject) {
        setProject(foundProject);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast({
        title: "Error",
        description: "Failed to load project data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Editing functions
  const handleEditField = (fieldKey: string) => {
    setEditingField(fieldKey);
  };

  const handleSaveField = (fieldKey: string) => {
    // Here you would typically save to database
    setEditingField(null);
    toast({
      title: "Updated",
      description: "Field has been updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditingNoteIndex(null);
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditableValues(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  // Note editing functions
  const handleEditNote = (index: number) => {
    setEditingNoteIndex(index);
  };

  const handleSaveNote = (index: number, value: string) => {
    const updatedNotes = projectNotes.map((note, i) => 
      i === index ? { ...note, text: value } : note
    );
    setProjectNotes(updatedNotes);
    setEditingNoteIndex(null);
    toast({
      title: "Updated",
      description: "Note has been updated successfully.",
    });
  };

  // PDF generation function
  const handleGeneratePDF = async () => {
    if (!project) return;
    
    try {
      await generateProjectSummaryPDF(
        {
          name: project.name,
          customerName: project.customer_name
        },
        editableValues,
        {
          roof: editableValues.roofColor || 'Black',
          wall: editableValues.wallColor || 'Charcoal', 
          trim: editableValues.trimColor || 'Black',
          wainscoting: editableValues.wainscotingColor || 'No Wainscoting',
          garageDoors: editableValues.garageDoorsColor || 'Wood Design',
          ltCeiling: editableValues.ltCeilingColor || 'Black',
          ltWrappedHeaders: editableValues.ltWrappedHeadersColor || 'Black',
          wrappedPosts: editableValues.wrappedPostsColor || 'Wood Finish to Match Garage Doors'
        },
        projectNotes.map(note => note.text)
      );
      toast({
        title: "PDF Generated",
        description: "Project summary PDF has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Print function
  const handlePrint = async () => {
    if (!project) return;
    
    try {
      await generateProjectSummaryPDF(
        {
          name: project.name,
          customerName: project.customer_name
        },
        editableValues,
        {
          roof: editableValues.roofColor || 'Black',
          wall: editableValues.wallColor || 'Charcoal', 
          trim: editableValues.trimColor || 'Black',
          wainscoting: editableValues.wainscotingColor || 'No Wainscoting',
          garageDoors: editableValues.garageDoorsColor || 'Wood Design',
          ltCeiling: editableValues.ltCeilingColor || 'Black',
          ltWrappedHeaders: editableValues.ltWrappedHeadersColor || 'Black',
          wrappedPosts: editableValues.wrappedPostsColor || 'Wood Finish to Match Garage Doors'
        },
        projectNotes.map(note => note.text),
        true // print mode
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open print dialog. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = (index: number) => {
    if (projectNotes.length > 1) {
      const updatedNotes = projectNotes.filter((_, i) => i !== index);
      setProjectNotes(updatedNotes);
      toast({
        title: "Deleted",
        description: "Note has been deleted successfully.",
      });
    }
  };

  const handleAddNote = () => {
    const newNote = { text: '', date: new Date().toLocaleDateString() };
    setProjectNotes([...projectNotes, newNote]);
    setEditingNoteIndex(projectNotes.length);
  };

  // Component for editable field
  const EditableField = ({ fieldKey, value, label, isTextarea = false }: { 
    fieldKey: string; 
    value: string; 
    label: string; 
    isTextarea?: boolean;
  }) => {
    const isEditing = editingField === fieldKey;
    const [localValue, setLocalValue] = useState(value);
    
    // Update local value when the component first enters edit mode
    useEffect(() => {
      if (isEditing) {
        setLocalValue(editableValues[fieldKey] || value);
      }
    }, [isEditing, fieldKey, value, editableValues]);

    const handleSave = () => {
      handleFieldChange(fieldKey, localValue);
      handleSaveField(fieldKey);
    };

    const handleCancel = () => {
      setLocalValue(editableValues[fieldKey] || value);
      handleCancelEdit();
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {isTextarea ? (
            <Textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1 min-h-[80px]"
              rows={3}
              autoFocus
            />
          ) : (
            <Input
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="flex-1"
              autoFocus
            />
          )}
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    const displayValue = editableValues[fieldKey] || value;

    return (
      <div className="flex items-center justify-between group">
        <div className="text-foreground flex-1">{displayValue}</div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEditField(fieldKey)}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  // Component for individual note editing
  const EditableNote = ({ note, index }: { note: {text: string; date: string}; index: number }) => {
    const [noteValue, setNoteValue] = useState(note.text);
    const isEditing = editingNoteIndex === index;

    // Only update local state when not editing to prevent losing focus
    useEffect(() => {
      if (!isEditing) {
        setNoteValue(note.text);
      }
    }, [note.text, isEditing]);

    const handleSave = () => {
      handleSaveNote(index, noteValue);
    };

    const handleCancel = () => {
      setNoteValue(note.text);
      setEditingNoteIndex(null);
    };

    if (isEditing) {
      return (
        <li className="flex items-start gap-2 py-2">
          <span className="text-foreground mt-1">•</span>
          <Input
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </li>
      );
    }

    return (
      <li className="flex items-start justify-between group py-2 hover:bg-muted/30 rounded px-2 -mx-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-foreground mt-1">•</span>
          <div className="flex-1">
            <span className="text-foreground">{note.text}</span>
            <div className="text-xs text-muted-foreground mt-1">{note.date}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditNote(index)}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          {projectNotes.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteNote(index)}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </li>
    );
  };

  // Helper function to get color display with swatch
  const getColorDisplay = (colorKey: string) => {
    const colorValue = selections[colorKey];
    if (!colorValue) return <span className="text-muted-foreground">Not selected</span>;
    
    const colorName = colorValue.split(' (')[0];
    const hexColor = COLOR_HEX_MAP[colorName];
    
    return (
      <div className="flex items-center gap-2">
        {hexColor && (
          <div 
            className="w-3 h-3 rounded-full border border-gray-300" 
            style={{ backgroundColor: hexColor }}
          />
        )}
        <span className="text-sm">{colorValue}</span>
      </div>
    );
  };

  // Helper function to get selection display
  const getSelectionDisplay = (key: string) => {
    const value = selections[key];
    return value ? <span className="text-sm">{value}</span> : <span className="text-muted-foreground">Not selected</span>;
  };

  // Helper function to get selection value as string
  const getSelectionValue = (key: string) => {
    const value = selections[key];
    return value || 'Not selected';
  };

  if (loading || selectionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading project summary...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold">Project Summary</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Project Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{project.name}</CardTitle>
            <p className="text-muted-foreground">{project.customer_name}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">{new Date(project.start_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Est. Completion</p>
                  <p className="text-sm text-muted-foreground">{new Date(project.estimated_completion).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-sm text-muted-foreground">${project.budget?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <p className="text-sm text-muted-foreground">{project.progress}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="summary" className="w-full">
              <div className="border-b px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Project Summary
                  </TabsTrigger>
                  <TabsTrigger value="design" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Design Summary
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="summary" className="mt-0">
                  <div className="space-y-8">
                    {/* Enhanced Project Overview */}
                    <div className="max-w-5xl mx-auto">
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">PROJECT SUMMARY</h2>
                        <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
                      </div>
                      
                       {/* PDF and Print Buttons */}
                       <div className="flex justify-start gap-3 mb-6">
                         <Button onClick={handleGeneratePDF} variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300">
                           <FileText className="h-4 w-4 mr-2" />
                           Download PDF
                         </Button>
                         <Button onClick={handlePrint} variant="outline" className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300">
                           <Printer className="h-4 w-4 mr-2" />
                           Print
                         </Button>
                       </div>
                       
                       {/* Enhanced Contact Information */}
                      <div className="bg-card rounded-lg p-6 shadow-sm border mb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground">Project Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Customer Name</label>
                                <div className="text-base font-medium text-foreground">{project.customer_name}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Project Address</label>
                                <div className="text-base text-foreground">
                                  {project.address ? `${project.address}, ${project.city}, ${project.state} ${project.zip}` : 'Not specified'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Project Value</label>
                                <div className="text-base font-semibold text-foreground">${project.budget?.toLocaleString()}</div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Start Date</label>
                                <div className="text-base text-foreground">{new Date(project.start_date).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Est. Completion</label>
                                <div className="text-base text-foreground">{new Date(project.estimated_completion).toLocaleDateString()}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1">
                                <label className="text-sm font-medium text-muted-foreground block mb-1">Progress</label>
                                <div className="text-base font-medium text-foreground">{project.progress}%</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                       {/* Building Size - Clean display */}
                      <div className="mb-8">
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-xl font-semibold mb-4 text-foreground">Building Specifications</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground block mb-2">Building Size</label>
                              <EditableField 
                                fieldKey="buildingSize" 
                                value={id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '44 x 115 x 18' : 'Not specified'} 
                                label="Building Size"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground block mb-2">LT Size</label>
                              <EditableField 
                                fieldKey="ltSize" 
                                value={id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? "12' Wraparound" : 'To be determined'} 
                                label="LT Size"
                              />
                            </div>
                          </div>
                        </div>
                        {/* TODO: In future, pull building dimensions from customer estimate data */}
                      </div>

                      {/* Building Features Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Building Options */}
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Building Options
                          </h3>
                           <div className="space-y-4">
                            {[
                              { label: 'Footer Type', fieldKey: 'footerType', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Poured Footers' : getSelectionValue('foundation_type') },
                              { label: 'Post Size', fieldKey: 'postSize', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '4Ply 2x6 Greenposts' : getSelectionValue('post_size') },
                              { label: 'Overhang Size', fieldKey: 'overhangSize', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '12" E & G' : getSelectionValue('overhang_size') },
                              { label: 'Roof Pitch', fieldKey: 'roofPitch', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '6/12' : getSelectionValue('roof_pitch') },
                              { label: 'Attic Truss', fieldKey: 'atticTruss', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'No' : getSelectionValue('attic_truss') },
                              { label: 'Concrete Thickness', fieldKey: 'concreteThickness', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '4" House and LT and 6" Shop' : getSelectionValue('concrete_thickness') },
                              { label: 'Metal Gauge', fieldKey: 'metalGauge', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '26 Ga. Textured' : getSelectionValue('metal_gauge') },
                              { label: 'Wainscoting Size', fieldKey: 'wainscotingSize', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'None' : getSelectionValue('wainscoting_size') }
                            ].map((option) => (
                              <div key={option.label} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                                <label className="font-medium text-foreground">{option.label}</label>
                                <EditableField 
                                  fieldKey={option.fieldKey} 
                                  value={option.value} 
                                  label={option.label}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Color Selections */}
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
                            Color Selections
                          </h3>
                           <div className="space-y-4">
                            {[
                              { label: 'Roof Color', fieldKey: 'roofColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Black' : getColorDisplay('roof_color') },
                              { label: 'Wall Color', fieldKey: 'wallColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Charcoal' : getColorDisplay('siding_color') },
                              { label: 'Trim Color', fieldKey: 'trimColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Black' : getColorDisplay('trim_color') },
                              { label: 'Wainscoting', fieldKey: 'wainscotingColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'No Wainscoting' : getColorDisplay('wainscoting_color') },
                              { label: 'Garage Door Color', fieldKey: 'garageDoorColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Wood Design' : getColorDisplay('garage_door_color') },
                              { label: 'LT Ceiling Color', fieldKey: 'ltCeilingColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Black' : 'Not specified' },
                              { label: 'LT Wrapped Headers Color', fieldKey: 'ltWrappedHeadersColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Black' : 'Not specified' },
                              { label: 'Wrapped Posts Color', fieldKey: 'wrappedPostsColor', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Wood Finish to Match Garage Doors' : 'Not specified' }
                            ].map((color) => (
                              <div key={color.label} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                                <label className="font-medium text-foreground">{color.label}</label>
                                {typeof color.value === 'string' ? (
                                  <EditableField 
                                    fieldKey={color.fieldKey} 
                                    value={color.value} 
                                    label={color.label}
                                  />
                                ) : (
                                  <div className="text-foreground">{color.value}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Additional Features Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Doors & Windows */}
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-xl font-semibold mb-6 text-foreground">Doors & Windows</h3>
                          <div className="space-y-4">
                            {[
                              { label: 'Entry Doors', fieldKey: 'entryDoors', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Thermatru' : getSelectionValue('entry_doors') },
                              { label: 'Garage Doors', fieldKey: 'garageDoors', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Clopay Custom Design' : getSelectionValue('garage_doors') },
                              { label: 'Windows', fieldKey: 'windows', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Marvin Black Ext White Int Windows' : getSelectionValue('windows') },
                              { label: 'Shutters', fieldKey: 'shutters', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'No Shutters' : getSelectionValue('shutters') }
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                                <label className="font-medium text-foreground">{item.label}</label>
                                <EditableField 
                                  fieldKey={item.fieldKey} 
                                  value={item.value} 
                                  label={item.label}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Systems & Packages */}
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-xl font-semibold mb-6 text-foreground">Systems & Packages</h3>
                          <div className="space-y-4">
                            {[
                              { label: 'Electric Package', fieldKey: 'electricPackage', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Whole House' : getSelectionValue('electric_package') },
                              { label: 'Insulation Package', fieldKey: 'insulationPackage', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'Custom Package' : getSelectionValue('insulation_package') },
                              { label: 'Liner Panel Package', fieldKey: 'linerPanelPackage', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'None' : getSelectionValue('liner_panel_package') },
                              { label: 'Gutters', fieldKey: 'gutters', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '5" Black Gutters and Downspouts' : getSelectionValue('gutters') },
                              { label: 'Cupola', fieldKey: 'cupola', value: id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? 'No Cupola' : getSelectionValue('cupola_size') }
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                                <label className="font-medium text-foreground">{item.label}</label>
                                <EditableField 
                                  fieldKey={item.fieldKey} 
                                  value={item.value} 
                                  label={item.label}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                       {/* Garage Door Details */}
                      <div className="bg-card rounded-lg p-6 shadow-sm border mb-8">
                        <h3 className="text-xl font-semibold mb-6 text-foreground">Garage Door Specifications</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b-2 border-border">
                                <th className="text-left py-3 px-4 font-semibold text-foreground">Quantity</th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">Type</th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">Width</th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">Height</th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? (
                                <>
                                  <tr className="border-b border-border">
                                    <td className="py-3 px-4 text-foreground">2</td>
                                    <td className="py-3 px-4 text-foreground">Clopay Custom</td>
                                    <td className="py-3 px-4 text-foreground">14'</td>
                                    <td className="py-3 px-4 text-foreground">14'</td>
                                    <td className="py-3 px-4 text-foreground">One row of glass</td>
                                  </tr>
                                  <tr className="border-b border-border">
                                    <td className="py-3 px-4 text-foreground">1</td>
                                    <td className="py-3 px-4 text-foreground">Clopay Custom</td>
                                    <td className="py-3 px-4 text-foreground">10'</td>
                                    <td className="py-3 px-4 text-foreground">10'</td>
                                    <td className="py-3 px-4 text-foreground">One row of glass</td>
                                  </tr>
                                </>
                              ) : (
                                [1, 2, 3].map((row) => (
                                  <tr key={row} className="border-b border-border">
                                    <td className="py-3 px-4 text-muted-foreground">—</td>
                                    <td className="py-3 px-4 text-muted-foreground">—</td>
                                    <td className="py-3 px-4 text-muted-foreground">—</td>
                                    <td className="py-3 px-4 text-muted-foreground">—</td>
                                    <td className="py-3 px-4 text-muted-foreground">—</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                          <label className="font-semibold text-foreground">Garage Door Openers:</label>
                          <EditableField 
                            fieldKey="garageOpeners" 
                            value={id === 'c0d89370-cdfa-4cd8-9ecf-2eb2413429ea' ? '3 openers' : 'Not specified'} 
                            label="Garage Door Openers"
                          />
                        </div>
                      </div>

                        {/* Notes Section */}
                       <div className="bg-card rounded-lg p-6 shadow-sm border">
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-xl font-semibold text-foreground">Project Notes</h3>
                           <Button
                             size="sm"
                             onClick={handleAddNote}
                             className="flex items-center gap-2"
                           >
                             <Plus className="h-4 w-4" />
                             Add Note
                           </Button>
                         </div>
                         <div className="min-h-[120px]">
                           <ul className="space-y-1">
                             {projectNotes.map((note, index) => (
                               <EditableNote key={index} note={note} index={index} />
                             ))}
                           </ul>
                         </div>
                        </div>
                     </div>
                   </div>
                 </TabsContent>

                <TabsContent value="design" className="mt-0">
                  <div className="space-y-6">
                    {/* Sign-off Status */}
                    {existingDocument && (
                      <div className="bg-accent/50 border border-accent rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-accent-foreground" />
                            <span className="text-sm font-medium">Design Selections Status</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {existingDocument.design_selection_versions?.length > 0 ? (
                              <>
                                Last updated: {new Date(
                                  existingDocument.design_selection_versions
                                    .find((v: any) => v.version_number === existingDocument.current_version_number)
                                    ?.created_at || existingDocument.updated_at
                                ).toLocaleDateString()}
                                {existingDocument.current_version_number > 1 && (
                                  <span className="ml-2 text-xs">
                                    (Version {existingDocument.current_version_number})
                                  </span>
                                )}
                              </>
                            ) : (
                              "Draft - Not yet finalized"
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-6">
                      <Home className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Design Selections Summary</h3>
                    </div>
                    
                    {/* Exterior Selections */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Exterior Selections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Metal & Siding</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Metal Type:</span>
                                {getSelectionDisplay('metal_type')}
                              </div>
                              <div className="flex justify-between">
                                <span>Roof Type:</span>
                                {getSelectionDisplay('roof_type')}
                              </div>
                              <div className="flex justify-between">
                                <span>Siding Type:</span>
                                {getSelectionDisplay('siding_type')}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Color Scheme</h4>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span>Roof Color:</span>
                                {getColorDisplay('roof_color')}
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Siding Color:</span>
                                {getColorDisplay('siding_color')}
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Trim Color:</span>
                                {getColorDisplay('trim_color')}
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Wainscoting Color:</span>
                                {getColorDisplay('wainscoting_color')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Garage & Entry */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Garage Doors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Door Style:</span>
                              {getSelectionDisplay('garage_door_style')}
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Door Color:</span>
                              {getColorDisplay('garage_door_color')}
                            </div>
                            <div className="flex justify-between">
                              <span>Panel Type:</span>
                              {getSelectionDisplay('garage_door_panel')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Entry Doors</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Door Style:</span>
                              {getSelectionDisplay('entry_door_style')}
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Door Color:</span>
                              {getColorDisplay('entry_door_color')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Interior Selections */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Interior Selections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Interior Doors & Trim</h4>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>Door Style:</span>
                                  {getSelectionDisplay('interior_door_style')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Door Color:</span>
                                  {getColorDisplay('interior_door_color')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Trim Style:</span>
                                  {getSelectionDisplay('interior_trim_style')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Trim Color:</span>
                                  {getColorDisplay('interior_trim_color')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Room Flooring</h4>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span>Living Room:</span>
                                  {getSelectionDisplay('living_room_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Kitchen:</span>
                                  {getSelectionDisplay('kitchen_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Master Bedroom:</span>
                                  {getSelectionDisplay('master_bedroom_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Bedroom 2:</span>
                                  {getSelectionDisplay('bedroom_2_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Bedroom 3:</span>
                                  {getSelectionDisplay('bedroom_3_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Bathroom:</span>
                                  {getSelectionDisplay('bathroom_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Hallway:</span>
                                  {getSelectionDisplay('hallway_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Office:</span>
                                  {getSelectionDisplay('office_flooring')}
                                </div>
                                <div className="flex justify-between">
                                  <span>Mudroom:</span>
                                  {getSelectionDisplay('mudroom_flooring')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Kitchen & Bathrooms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Kitchen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Cabinet Style:</span>
                              {getSelectionDisplay('kitchen_cabinet_style')}
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Cabinet Color:</span>
                              {getColorDisplay('kitchen_cabinet_color')}
                            </div>
                            <div className="flex justify-between">
                              <span>Countertop:</span>
                              {getSelectionDisplay('kitchen_countertop')}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Bathrooms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <h5 className="font-medium text-xs mb-1">Master Bath</h5>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Vanity Style:</span>
                                {getSelectionDisplay('master_bath_vanity_style')}
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Vanity Color:</span>
                                {getColorDisplay('master_bath_vanity_color')}
                              </div>
                              <div className="flex justify-between">
                                <span>Tub/Shower:</span>
                                {getSelectionDisplay('master_bath_tub_shower')}
                              </div>
                            </div>
                          </div>
                          <div>
                            <h5 className="font-medium text-xs mb-1">Guest Bath</h5>
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>Vanity Style:</span>
                                {getSelectionDisplay('guest_bath_vanity_style')}
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Vanity Color:</span>
                                {getColorDisplay('guest_bath_vanity_color')}
                              </div>
                              <div className="flex justify-between">
                                <span>Tub/Shower:</span>
                                {getSelectionDisplay('guest_bath_tub_shower')}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Mudroom */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Mudroom</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Storage Style:</span>
                            {getSelectionDisplay('mudroom_storage_style')}
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Storage Color:</span>
                            {getColorDisplay('mudroom_storage_color')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Room-by-Room Paint & Flooring Colors */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Room-by-Room Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Paint Colors by Room</h4>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span>Living Room:</span>
                                  {getColorDisplay('living_room_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Kitchen:</span>
                                  {getColorDisplay('kitchen_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Master Bedroom:</span>
                                  {getColorDisplay('master_bedroom_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bedroom 2:</span>
                                  {getColorDisplay('bedroom_2_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bedroom 3:</span>
                                  {getColorDisplay('bedroom_3_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bathroom:</span>
                                  {getColorDisplay('bathroom_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Hallway:</span>
                                  {getColorDisplay('hallway_paint_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Office:</span>
                                  {getColorDisplay('office_paint_color')}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm mb-2">Flooring Colors by Room</h4>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between items-center">
                                  <span>Living Room:</span>
                                  {getColorDisplay('living_room_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Kitchen:</span>
                                  {getColorDisplay('kitchen_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Master Bedroom:</span>
                                  {getColorDisplay('master_bedroom_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bedroom 2:</span>
                                  {getColorDisplay('bedroom_2_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bedroom 3:</span>
                                  {getColorDisplay('bedroom_3_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Bathroom:</span>
                                  {getColorDisplay('bathroom_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Hallway:</span>
                                  {getColorDisplay('hallway_flooring_color')}
                                </div>
                                <div className="flex justify-between items-center">
                                  <span>Office:</span>
                                  {getColorDisplay('office_flooring_color')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground text-center">
                        Design selections will appear here once the customer has finalized their choices.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Summary;