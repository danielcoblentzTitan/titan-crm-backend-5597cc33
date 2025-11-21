import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabaseService } from "@/services/supabaseService";

interface SelectionData {
  [key: string]: any;
}

interface ProjectInfo {
  name: string;
  customerName: string;
  customerId: string;
}

export const useDesignSelections = (projectId: string) => {
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({ name: "", customerName: "", customerId: "" });
  const [selections, setSelections] = useState<SelectionData>({});
  const [customNotes, setCustomNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingDocument, setExistingDocument] = useState<any>(null);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [versions, setVersions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(true);
  const [lastSavedSelections, setLastSavedSelections] = useState<SelectionData>({});
  const [currentTab, setCurrentTab] = useState("exterior");
  
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadProjectInfo();
    loadExistingDocument();
  }, [projectId]);

  const loadProjectInfo = async () => {
    try {
      const projects = await supabaseService.getProjects();
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setProjectInfo({ 
          name: project.name, 
          customerName: project.customer_name,
          customerId: project.customer_id
        });
      }
    } catch (error) {
      console.error('Error loading project info:', error);
      toast({
        title: "Error",
        description: "Failed to load project information",
        variant: "destructive"
      });
    }
  };

  const loadExistingDocument = async () => {
    try {
      setLoading(true);
      const document = await supabaseService.getDesignSelectionDocument(projectId);
      if (document) {
        setExistingDocument(document);
        setCurrentVersion(document.current_version_number);
        setVersions(document.design_selection_versions || []);
        
        // Load the latest version's data
        const latestVersion = document.design_selection_versions
          ?.find((v: any) => v.version_number === document.current_version_number);
        
        if (latestVersion) {
          const latestSelections = (latestVersion.selections_data as SelectionData) || {};
          setSelections(latestSelections);
          setLastSavedSelections(latestSelections);
          setCustomNotes(latestVersion.notes || "");
          setIsEditing(true); // Allow editing of existing document
        }
      }
    } catch (error) {
      console.error('Error loading existing document:', error);
    } finally {
      setLoading(false);
    }
  };

  const collectFormData = (): SelectionData => {
    if (!formRef.current) return {};
    
    const formData = new FormData(formRef.current);
    const data: SelectionData = {};
    
    // Collect all form inputs
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('[]')) {
        // Handle checkbox arrays
        const arrayKey = key.slice(0, -2);
        if (!data[arrayKey]) data[arrayKey] = [];
        if (value) data[arrayKey].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // Collect checkboxes
    const checkboxes = formRef.current.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox: any) => {
      if (checkbox.name) {
        if (checkbox.name.endsWith('[]')) {
          const arrayKey = checkbox.name.slice(0, -2);
          if (!data[arrayKey]) data[arrayKey] = [];
          if (checkbox.checked) data[arrayKey].push(checkbox.value || checkbox.getAttribute('data-value'));
        } else {
          data[checkbox.name] = checkbox.checked;
        }
      }
    });
    
    return data;
  };

  const handleSaveDraft = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      const formData = collectFormData();
      const allData = { ...formData, customNotes };
      
      if (existingDocument) {
        // Create new version
        await supabaseService.createNewDesignSelectionVersion(
          existingDocument.id,
          allData,
          customNotes
        );
        setCurrentVersion(prev => prev + 1);
        
        toast({
          title: "Draft Saved",
          description: `Design selections saved as version ${currentVersion + 1}`,
        });
      } else {
        // Create new document
        const result = await supabaseService.createDesignSelectionDocument(
          projectId,
          projectInfo.customerId,
          allData,
          customNotes
        );
        setExistingDocument(result.document);
        setCurrentVersion(1);
        
        toast({
          title: "Draft Saved",
          description: "Design selections document created and saved",
        });
      }
      
      // Reload to get updated versions
      await loadExistingDocument();
      setIsEditing(false);
      setLastSavedSelections(allData);
      
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save design selections",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    // State
    projectInfo,
    selections,
    setSelections,
    customNotes,
    setCustomNotes,
    loading,
    saving,
    existingDocument,
    currentVersion,
    versions,
    isEditing,
    setIsEditing,
    lastSavedSelections,
    currentTab,
    setCurrentTab,
    formRef,
    
    // Actions
    handleSaveDraft,
    collectFormData
  };
};