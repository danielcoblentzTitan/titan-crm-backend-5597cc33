import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Printer, Share, Save, Upload, History, Calculator, ArrowRight } from "lucide-react";
import { Project } from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";
import { StatementHeader } from "./fees-statement/StatementHeader";
import { CategorySection } from "./fees-statement/CategorySection";
import { StatementTotals } from "./fees-statement/StatementTotals";
import { useStatementData } from "./fees-statement/useStatementData";
import { enhancedDocumentService } from "@/services/enhancedDocumentService";
import { statementVersionService, StatementVersion } from "@/services/statementVersionService";
import { supabaseService } from "@/services/supabaseService";
import { workflowService } from "@/services/workflowService";
import jsPDF from 'jspdf';

interface BarndominiumFeesStatementProps {
  project: Project;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  readOnly?: boolean;
  onTotalChange?: (total: number) => void;
}

const BarndominiumFeesStatement = ({ 
  project, 
  isOpen = false, 
  onOpenChange, 
  readOnly = false,
  onTotalChange 
}: BarndominiumFeesStatementProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [versions, setVersions] = useState<StatementVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [isNewVersion, setIsNewVersion] = useState(true);
  const { toast } = useToast();
  const lastTotalRef = useRef<number>(0);

  const {
    items,
    projectDetails,
    profitMargin,
    setProjectDetails,
    updateProjectDetails,
    setProfitMargin,
    updateItem,
    addNewItem,
    deleteItem,
    autoCalculateQuantities,
    changeProjectType,
    calculateSubtotal,
    calculateProfit,
    calculateTotal,
    saveStatement,
    loadStatementData,
    formatNumber
  } = useStatementData(project.id, 'barndominium');

  const modalOpen = onOpenChange ? isOpen : internalOpen;
  const setModalOpen = onOpenChange ? onOpenChange : setInternalOpen;

  // Check if statement is locked - only lock for actual projects that are in progress, not lead estimates
  const isLeadEstimate = project.id.startsWith('lead-');
  const isLocked = readOnly || (!isLeadEstimate && project.status !== 'Planning');

  // Get the calculated total
  const total = calculateTotal();

  // Get actual project ID (handle case where project might be a customer object)
  const getProjectId = () => {
    // If this is a lead estimate or customer conversion, use the raw ID
    if (project.id.startsWith('customer-') || project.id.startsWith('lead-')) {
      return project.id;
    }
    return project.id;
  };

  const projectId = getProjectId();

  // Load versions on mount - only for real projects, not lead estimates
  useEffect(() => {
    const loadVersions = async () => {
      try {
        console.log('Loading versions for projectId:', projectId);
        const versionData = await statementVersionService.getVersions(projectId);
        console.log('Loaded versions:', versionData);
        setVersions(versionData);
      } catch (error) {
        console.error('Error loading versions:', error);
      }
    };
    loadVersions();
  }, [projectId]);

  // Call onTotalChange only when the total actually changes
  useEffect(() => {
    if (onTotalChange && Math.abs(total - lastTotalRef.current) > 0.01) {
      console.log('Total changed from', lastTotalRef.current, 'to', total);
      lastTotalRef.current = total;
      onTotalChange(total);
    }
  }, [total, onTotalChange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(amount.toFixed(2)));
  };

  const handleSave = async () => {
    if (isLocked) {
      toast({
        title: "Cannot Save",
        description: isLeadEstimate ? "Lead estimate could not be saved." : "Statement is locked once project begins.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save to localStorage first
      saveStatement();
      
      const statementData = {
        items,
        projectDetails,
        profitMargin
      };
      
      if (editingVersionId && !isNewVersion) {
        // Update existing version
        console.log('Updating existing version:', editingVersionId);
        await statementVersionService.updateVersion(
          editingVersionId,
          statementData,
          `${project.name} - Updated`
        );
        
        toast({
          title: "Version Updated",
          description: "Existing version has been updated successfully.",
        });
      } else {
        // Save as new version
        console.log('Saving new version for projectId:', projectId);
        await statementVersionService.saveVersion(
          projectId,
          statementData,
          project.name
        );
        
        toast({
          title: "New Version Saved",
          description: "Your changes have been saved as a new version.",
        });
      }
      
      // Reset editing state and reload versions
      setEditingVersionId(null);
      setIsNewVersion(true);
      setSelectedVersionId('');
      
      console.log('Reloading versions...');
      const versionData = await statementVersionService.getVersions(projectId);
      console.log('Reloaded versions after save:', versionData);
      setVersions(versionData);
      
    } catch (error) {
      console.error('Error saving version:', error);
      toast({
        title: "Save Error",
        description: "Failed to save statement version.",
        variant: "destructive"
      });
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handlePrint = () => {
    const printContent = document.getElementById('statement-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Statement of Fees - ${project.name}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 20px; 
                color: #333;
                line-height: 1.4;
              }
              .header { 
                text-align: center; 
                border-bottom: 2px solid #003562; 
                padding-bottom: 20px; 
                margin-bottom: 30px; 
              }
              .header h1 { 
                color: #003562; 
                margin: 0 0 10px 0; 
                font-size: 28px;
              }
              .project-info { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 30px; 
                margin-bottom: 30px; 
              }
              .info-section h3 { 
                color: #003562; 
                margin-bottom: 10px; 
                font-size: 16px;
              }
              .info-section p { 
                margin: 5px 0; 
                font-size: 14px;
              }
              .category { 
                margin-bottom: 25px; 
                page-break-inside: avoid;
              }
              .category h4 { 
                color: #003562; 
                border-bottom: 1px solid #ddd; 
                padding-bottom: 5px; 
                margin-bottom: 15px;
                font-size: 16px;
              }
              .category-total { 
                text-align: right; 
                font-weight: bold; 
                margin-top: 10px; 
                padding-top: 10px; 
                border-top: 1px solid #ddd;
                font-size: 16px;
              }
              .totals { 
                border-top: 2px solid #003562; 
                padding-top: 20px; 
                margin-top: 30px; 
              }
              .total-line { 
                display: flex; 
                justify-content: space-between; 
                margin: 10px 0;
                font-size: 16px;
              }
              .final-total { 
                font-size: 24px; 
                font-weight: bold; 
                color: #003562; 
                border-top: 1px solid #003562; 
                padding-top: 10px; 
                margin-top: 15px;
              }
              .notes { 
                margin-top: 30px; 
                font-size: 12px; 
                color: #666;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .notes ul { 
                margin: 10px 0; 
                padding-left: 20px;
              }
              .notes li { 
                margin: 5px 0;
              }
              .locked-notice {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 20px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Statement of Fees</h1>
              <p><strong>Barndominium Construction Estimate</strong></p>
              ${isLocked ? '<div class="locked-notice"><strong>FINAL ESTIMATE</strong> - Project in Progress</div>' : ''}
            </div>
            
            <div class="project-info">
              <div class="info-section">
                <h3>Project Information</h3>
                <p><strong>Project:</strong> ${project.name}</p>
                <p><strong>Customer:</strong> ${project.customerName}</p>
                <p><strong>Location:</strong> ${project.city}, ${project.state}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="info-section">
                <h3>Project Specifications</h3>
                <p><strong>Square Footage:</strong> ${projectDetails.sqft.toLocaleString()} sq ft</p>
                <p><strong>Site Size:</strong> ${formatNumber(projectDetails.acres)} acres</p>
                <p><strong>Overhead Doors:</strong> ${projectDetails.doors}</p>
                <p><strong>Walk-in Doors:</strong> ${projectDetails.walkDoors}</p>
                <p><strong>Kitchen Cabinets:</strong> ${projectDetails.kitchenCabinets} linear feet</p>
                <p><strong>Bathrooms:</strong> ${projectDetails.bathrooms}</p>
              </div>
            </div>

            ${Object.entries(groupedItems).map(([category, categoryItems]) => `
              <div class="category">
                <h4>${category}</h4>
                ${categoryItems.filter(item => item.quantity > 0).map(item => `
                  <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
                    <span>${item.description} (${formatNumber(item.quantity)} ${item.unit} @ ${formatCurrency(item.unitPrice)})</span>
                    <span style="font-weight: 500;">${formatCurrency(item.total)}</span>
                  </div>
                `).join('')}
                <div class="category-total">
                  Category Total: ${formatCurrency(categoryItems.reduce((sum, item) => sum + item.total, 0))}
                </div>
              </div>
            `).join('')}

            <div class="totals">
              <div class="total-line">
                <span>Construction Subtotal:</span>
                <span>${formatCurrency(calculateSubtotal())}</span>
              </div>
              <div class="total-line">
                <span>Profit Margin (${formatNumber(profitMargin)}%):</span>
                <span>${formatCurrency(calculateProfit())}</span>
              </div>
              <div class="total-line final-total">
                <span>Total Project Cost:</span>
                <span>${formatCurrency(total)}</span>
              </div>
            </div>

            <div class="notes">
              <p><strong>Important Notes:</strong></p>
              <ul>
                <li>Prices are estimates based on current Delaware market conditions</li>
                <li>Final costs may vary based on material selections and site conditions</li>
                <li>Permits and inspections based on Sussex County requirements</li>
                <li>Does not include well, septic installation, or utility connections</li>
                <li>Valid for 30 days from date of issue</li>
                <li>This estimate includes a ${formatNumber(profitMargin)}% profit margin</li>
                <li>Project Manager Fee includes oversight of all construction phases</li>
              </ul>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Statement of Fees - ${project.name}`,
        text: `Barndominium construction estimate for ${project.customerName}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Statement link copied to clipboard for sharing.",
      });
    }
  };

  const loadVersion = async (versionId: string) => {
    try {
      const version = await statementVersionService.getVersion(versionId);
      if (version) {
        // Load the version data into the statement
        loadStatementData(version.statement_data);
        
        // Set editing state
        setEditingVersionId(versionId);
        setIsNewVersion(false);
        
        toast({
          title: "Version Loaded",
          description: `Loaded ${version.statement_name} - You can edit and save to update this version or save as new`,
        });
      }
    } catch (error) {
      console.error('Error loading version:', error);
      toast({
        title: "Load Error",
        description: "Failed to load statement version.",
        variant: "destructive"
      });
    }
  };

  const startNewVersion = () => {
    setEditingVersionId(null);
    setIsNewVersion(true);
    setSelectedVersionId('');
    toast({
      title: "New Version Started",
      description: "You are now working on a new version",
    });
  };

  const handleUploadToCustomer = async () => {
    try {
      // Only save version to database for real projects (not leads/customers)
      if (!projectId.startsWith('customer-') && !projectId.startsWith('lead-')) {
        // First save current version with upload
        const statementData = {
          items,
          projectDetails,
          profitMargin
        };
        
        await statementVersionService.saveVersion(
          projectId,
          statementData,
          project.name
        );
      }
      
      // Generate PDF content
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Statement of Fees', pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const projectTypeLabel = projectDetails.projectType === 'barndominium' ? 'Barndominium' : 
                               projectDetails.projectType === 'residential_garage' ? 'Residential Garage' : 
                               'Commercial Building';
      doc.text(`${projectTypeLabel} Construction Estimate`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Project Information
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Information', margin, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${project.customerName} - ${projectTypeLabel}`, margin, currentY);
      currentY += 6;
      doc.text(`Customer: ${project.customerName}`, margin, currentY);
      currentY += 6;
      doc.text(`Location: ${project.city}, ${project.state}`, margin, currentY);
      currentY += 6;
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, currentY);
      currentY += 6;
      doc.text(`Total Project Size: ${projectDetails.sqft.toLocaleString()} sq ft`, margin, currentY);
      currentY += 15;

      // Calculate profit multiplier for customer-facing prices
      const profitMultiplier = 1 + (profitMargin / 100);

      // Categories and items with margin incorporated
      Object.entries(groupedItems).forEach(([category, categoryItems]) => {
        const itemsWithQuantity = categoryItems.filter(item => item.quantity > 0);
        if (itemsWithQuantity.length === 0) return;

        if (currentY > 250) {
          doc.addPage();
          currentY = margin;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(category, margin, currentY);
        currentY += 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        itemsWithQuantity.forEach(item => {
          // Apply profit margin to each line item for customer view
          const customerUnitPrice = item.unitPrice * profitMultiplier;
          const customerTotal = item.total * profitMultiplier;
          
          const itemText = `${item.description} (${formatNumber(item.quantity)} ${item.unit} @ ${formatCurrency(customerUnitPrice)})`;
          const totalText = formatCurrency(customerTotal);
          
          doc.text(itemText, margin, currentY);
          doc.text(totalText, pageWidth - margin, currentY, { align: 'right' });
          currentY += 5;
        });

        const categoryTotal = categoryItems.reduce((sum, item) => sum + (item.total * profitMultiplier), 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`Category Total: ${formatCurrency(categoryTotal)}`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 10;
        doc.setFont('helvetica', 'normal');
      });

      // Totals (hide profit margin breakdown from customer)
      if (currentY > 230) {
        doc.addPage();
        currentY = margin;
      }

      currentY += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Totals', margin, currentY);
      currentY += 10;

      // Only show final total to customer (margin already incorporated in line items)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Project Cost:', margin, currentY);
      doc.text(formatCurrency(total), pageWidth - margin, currentY, { align: 'right' });

      // Convert PDF to blob
      const pdfBlob = doc.output('blob');
      
      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5); // Remove milliseconds and replace colons/dots
      const fileName = `Statement_of_Fees_${project.customerName.replace(/\s+/g, '_')}_${timestamp}.pdf`;
      
      // For leads/customers, we need to upload to a real project or create one
      // For now, we'll handle this case by using the existing document service which can handle customer uploads
      if (projectId.startsWith('customer-')) {
        // Extract the customer ID from the prefixed ID
        const actualCustomerId = projectId.replace('customer-', '');
        await enhancedDocumentService.uploadCustomerDocument(
          actualCustomerId,
          pdfBlob,
          fileName,
          true // customer_facing = true
        );
      } else {
        // Upload to project folder for real projects
        await enhancedDocumentService.uploadProjectDocument(
          projectId,
          pdfBlob,
          fileName,
          true // customer_facing = true
        );
      }

      toast({
        title: "Statement Uploaded",
        description: `Statement has been uploaded to ${project.customerName}'s folder successfully.`,
      });
    } catch (error) {
      console.error('Error uploading statement:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload statement to customer folder.",
        variant: "destructive"
      });
    }
  };

  const handleConvertToProject = async (version: StatementVersion) => {
    try {
      let actualProjectId = project.id;
      let projectBudget = 0;
      
      // Calculate total from this specific statement version
      const statementData = version.statement_data;
      const items = statementData.items || [];
      const profitMargin = statementData.profitMargin || 0;
      
      // Calculate totals
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      const profit = subtotal * (profitMargin / 100);
      projectBudget = subtotal + profit;
      
      // Only allow converting customers to projects, not leads
      if (project.id.startsWith('customer-')) {
        console.log('Converting customer to project...');
        
        try {
          // Extract customer ID from project ID
          const customerId = project.id.replace('customer-', '');
          
          // Get existing customer
          const customers = await supabaseService.getCustomers();
          const customer = customers.find(c => c.id === customerId);
          
          if (customer) {
            // Convert to project with the calculated budget and generate contract
            const newProject = await workflowService.convertCustomerToProjectWithContract(customer, projectBudget, version);
            actualProjectId = newProject.id;
            
            toast({
              title: "Project Created",
              description: `${customer.name} converted to project with contract generated.`,
            });
            
            // Close the modal and refresh
            setModalOpen(false);
            window.location.reload();
            return;
          }
        } catch (convertError) {
          console.error('Error during conversion:', convertError);
          toast({
            title: "Conversion Failed",
            description: "Failed to convert to project. Please try again.",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Error",
        description: "This function is only available for customers, not leads.",
        variant: "destructive"
      });
    } catch (error) {
      console.error('Error converting to project:', error);
      toast({
        title: "Error",
        description: "Failed to convert to project.",
        variant: "destructive"
      });
    }
  };

  const StatementContent = () => (
    <div id="statement-content" className="space-y-6 print:space-y-4">
      {isLocked && !isLeadEstimate && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
          <p className="font-medium">This statement is locked and cannot be edited once the project has begun.</p>
        </div>
      )}

      <StatementHeader
        project={project}
        projectDetails={projectDetails}
        setProjectDetails={setProjectDetails}
        updateProjectDetails={updateProjectDetails}
        onAutoCalculate={autoCalculateQuantities}
        onProjectTypeChange={changeProjectType}
        isLocked={isLocked}
      />

      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <CategorySection
          key={category}
          category={category}
          categoryItems={categoryItems}
          onUpdateItem={updateItem}
          onAddItem={addNewItem}
          onDeleteItem={deleteItem}
          isLocked={isLocked}
          formatCurrency={formatCurrency}
        />
      ))}

      <StatementTotals
        subtotal={calculateSubtotal()}
        profitMargin={profitMargin}
        setProfitMargin={setProfitMargin}
        profit={calculateProfit()}
        total={total}
        formatCurrency={formatCurrency}
        isLocked={isLocked}
      />
    </div>
  );

  const handleCloseAttempt = () => {
    // Only allow closing if locked (read-only) or if user explicitly confirms
    if (isLocked) {
      setModalOpen(false);
      return;
    }
    
    if (window.confirm("Are you sure you want to close? Any unsaved changes will be lost.")) {
      setModalOpen(false);
    }
  };

  // If being used as a controlled component (for modal usage)
  if (onOpenChange) {
    return (
      <Dialog open={modalOpen} onOpenChange={handleCloseAttempt}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] overflow-hidden flex flex-col p-0" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader className="px-6 py-4 border-b bg-slate-50 flex-shrink-0">
             <DialogTitle className="text-2xl font-bold text-center mb-2">
                Statement of Fees
             </DialogTitle>
             <p className="text-lg text-center text-muted-foreground font-medium mb-4">
                {project.name} {isLocked && "(LOCKED)"}
             </p>
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {editingVersionId && !isNewVersion ? `Editing: ${versions.find(v => v.id === editingVersionId)?.statement_name}` : `New Version (${versions.length} saved)`}
                  </span>
                  {versions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Select value={selectedVersionId} onValueChange={(value) => {
                        setSelectedVersionId(value);
                        if (value) loadVersion(value);
                      }}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Load version..." />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((version) => (
                            <SelectItem key={version.id} value={version.id}>
                              <div className="flex items-center space-x-2">
                                <History className="h-4 w-4" />
                                <span>{version.statement_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={startNewVersion}
                        className="flex items-center space-x-1"
                      >
                        <FileText className="h-3 w-3" />
                        <span>New</span>
                      </Button>
                      {selectedVersionId && project.id.startsWith('customer-') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedVersion = versions.find(v => v.id === selectedVersionId);
                            if (selectedVersion) {
                              handleConvertToProject(selectedVersion);
                            }
                          }}
                          className="flex items-center space-x-1"
                        >
                          <ArrowRight className="h-3 w-3" />
                          <span>Convert to Project</span>
                        </Button>
                      )}
                      {project.id.startsWith('lead-') && (
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-yellow-50 rounded border">
                          Convert lead to customer first, then create project from customer
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  {!isLocked && (
                    <Button onClick={handleSave} size="sm" variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      {editingVersionId && !isNewVersion ? 'Update Version' : 'Save New Version'}
                    </Button>
                  )}
                  <Button onClick={handleUploadToCustomer} size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload to Customer
                  </Button>
                  <Button onClick={handlePrint} size="sm" variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button onClick={handleShare} size="sm" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                 </div>
              </div>
           </DialogHeader>
           <div className="flex-1 overflow-auto">
             <div className="p-6">
               <StatementContent />
             </div>
           </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Original button trigger version
  return (
    <>
      <Dialog open={modalOpen} onOpenChange={handleCloseAttempt}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-1" />
            Fees Statement {isLocked && "(View Only)"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
           <DialogHeader>
             <DialogTitle className="flex items-center justify-between">
               <div className="flex items-center space-x-4">
                 <span>Statement of Fees - {project.name} {isLocked && "(LOCKED)"}</span>
                  {versions.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Select value={selectedVersionId} onValueChange={(value) => {
                        setSelectedVersionId(value);
                        if (value) loadVersion(value);
                      }}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Load version..." />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((version) => (
                            <SelectItem key={version.id} value={version.id}>
                              <div className="flex items-center space-x-2">
                                <History className="h-4 w-4" />
                                <span>{version.statement_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedVersionId && !isLeadEstimate && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const selectedVersion = versions.find(v => v.id === selectedVersionId);
                            if (selectedVersion) {
                              handleConvertToProject(selectedVersion);
                            }
                          }}
                          className="flex items-center space-x-1"
                        >
                          <ArrowRight className="h-3 w-3" />
                          <span>Convert to Project</span>
                        </Button>
                      )}
                      {isLeadEstimate && (
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-yellow-50 rounded border">
                          Convert lead to project to create COGS
                        </div>
                      )}
                    </div>
                  )}
               </div>
                <div className="flex space-x-2">
                  {!isLocked && (
                    <Button onClick={handleSave} size="sm" variant="outline">
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  )}
                  <Button onClick={handleUploadToCustomer} size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload to Customer
                  </Button>
                  <Button onClick={handlePrint} size="sm" variant="outline">
                    <Printer className="h-4 w-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button onClick={handleShare} size="sm" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
            </DialogTitle>
          </DialogHeader>
          <StatementContent />
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #e5e7eb !important; }
          .print\\:border-0 { border: 0 !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
          .print\\:text-black { color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </>
  );
};

export default BarndominiumFeesStatement;
