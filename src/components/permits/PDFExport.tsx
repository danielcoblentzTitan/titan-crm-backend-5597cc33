import React from "react";
import { Button } from "@/components/ui/button";
import { PermitApplication, PermitTask } from "@/integrations/supabase/hooks/usePermits";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";

interface PDFExportProps {
  application?: PermitApplication;
  tasks?: PermitTask[];
  feeEstimate?: {
    items: { name: string; amount: number; formula: string; source?: string }[];
    total: number;
  };
  type: "checklist" | "fee_estimate" | "application_summary";
}

const PDFExport = ({ application, tasks, feeEstimate, type }: PDFExportProps) => {
  const generatePDF = () => {
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 20;
      let yPosition = margin;

      // Helper function to add text with wrapping
      const addText = (text: string, x: number, y: number, options?: any) => {
        const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
        pdf.text(lines, x, y, options);
        return y + (lines.length * 6);
      };

      // Header
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      yPosition = addText("Titan Buildings", margin, yPosition);
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      yPosition = addText("Permit Management System", margin, yPosition) + 10;

      if (type === "checklist" && application && tasks) {
        // Checklist PDF
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        yPosition = addText(`Permit Checklist - ${application.jurisdiction?.name}`, margin, yPosition) + 5;
        
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        yPosition = addText(`Project Type: ${application.project_type}`, margin, yPosition);
        if (application.square_footage) {
          yPosition = addText(`Square Footage: ${application.square_footage.toLocaleString()} sq ft`, margin, yPosition);
        }
        if (application.estimated_fee) {
          yPosition = addText(`Estimated Fee: $${application.estimated_fee.toFixed(2)}`, margin, yPosition);
        }
        yPosition += 10;

        // Tasks
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        yPosition = addText("Tasks:", margin, yPosition) + 5;

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        
        tasks.forEach((task, index) => {
          if (yPosition > 250) {
            pdf.addPage();
            yPosition = margin;
          }
          
          const status = task.status === "Completed" ? "✓" : "☐";
          const taskText = `${status} ${task.task_name} (${task.assigned_to || "Unassigned"})`;
          yPosition = addText(taskText, margin, yPosition);
          
          if (task.notes) {
            pdf.setFontSize(9);
            pdf.setTextColor(100);
            yPosition = addText(`   ${task.notes}`, margin, yPosition);
            pdf.setFontSize(11);
            pdf.setTextColor(0);
          }
          yPosition += 2;
        });

        // Requirements checklist
        const projectTypeData = application.jurisdiction?.project_types.find(
          (pt: any) => pt.type === application.project_type
        );
        
        if (projectTypeData?.checklist) {
          yPosition += 10;
          pdf.setFontSize(14);
          pdf.setFont(undefined, 'bold');
          yPosition = addText("Required Documents:", margin, yPosition) + 5;

          pdf.setFontSize(11);
          pdf.setFont(undefined, 'normal');
          
          projectTypeData.checklist.forEach((item: string) => {
            if (yPosition > 250) {
              pdf.addPage();
              yPosition = margin;
            }
            yPosition = addText(`☐ ${item}`, margin, yPosition);
          });
        }

      } else if (type === "fee_estimate" && feeEstimate) {
        // Fee Estimate PDF
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        yPosition = addText("Permit Fee Estimate", margin, yPosition) + 5;

        if (application) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'normal');
          yPosition = addText(`Jurisdiction: ${application.jurisdiction?.name}`, margin, yPosition);
          yPosition = addText(`Project Type: ${application.project_type}`, margin, yPosition);
          if (application.square_footage) {
            yPosition = addText(`Square Footage: ${application.square_footage.toLocaleString()} sq ft`, margin, yPosition);
          }
          yPosition += 10;
        }

        // Fee breakdown
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        yPosition = addText("Fee Breakdown:", margin, yPosition) + 5;

        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');

        feeEstimate.items.forEach((item) => {
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = margin;
          }
          
          yPosition = addText(`${item.name}: $${item.amount.toFixed(2)}`, margin, yPosition);
          yPosition = addText(`  Formula: ${item.formula}`, margin + 10, yPosition);
          if (item.source) {
            pdf.setFontSize(9);
            pdf.setTextColor(100);
            yPosition = addText(`  Source: ${item.source}`, margin + 10, yPosition);
            pdf.setFontSize(11);
            pdf.setTextColor(0);
          }
          yPosition += 3;
        });

        // Total
        yPosition += 10;
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        yPosition = addText(`Total Estimated Fee: $${feeEstimate.total.toFixed(2)}`, margin, yPosition);

        // Disclaimer
        yPosition += 10;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'italic');
        yPosition = addText("Note: This is an estimate based on available information. Final fees may vary based on actual review requirements and current county rates.", margin, yPosition);

      } else if (type === "application_summary" && application) {
        // Application Summary PDF
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        yPosition = addText("Permit Application Summary", margin, yPosition) + 10;

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        
        const details = [
          [`Jurisdiction:`, application.jurisdiction?.name || ""],
          [`Project Type:`, application.project_type],
          [`Square Footage:`, application.square_footage ? `${application.square_footage.toLocaleString()} sq ft` : "Not specified"],
          [`Estimated Fee:`, application.estimated_fee ? `$${application.estimated_fee.toFixed(2)}` : "Not calculated"],
          [`Status:`, application.status || "Draft"],
          [`Application Date:`, application.application_date ? new Date(application.application_date).toLocaleDateString() : "Not submitted"],
          [`Permit Number:`, application.permit_number || "Not issued"]
        ];

        details.forEach(([label, value]) => {
          yPosition = addText(`${label} ${value}`, margin, yPosition);
        });

        if (application.notes) {
          yPosition += 10;
          pdf.setFont(undefined, 'bold');
          yPosition = addText("Notes:", margin, yPosition);
          pdf.setFont(undefined, 'normal');
          yPosition = addText(application.notes, margin, yPosition);
        }

        // Contact information
        if (application.jurisdiction) {
          yPosition += 15;
          pdf.setFont(undefined, 'bold');
          yPosition = addText("Jurisdiction Contact Information:", margin, yPosition) + 5;
          
          pdf.setFont(undefined, 'normal');
          if (application.jurisdiction.contact_phone) {
            yPosition = addText(`Phone: ${application.jurisdiction.contact_phone}`, margin, yPosition);
          }
          if (application.jurisdiction.contact_email) {
            yPosition = addText(`Email: ${application.jurisdiction.contact_email}`, margin, yPosition);
          }
          if (application.jurisdiction.contact_address) {
            yPosition = addText(`Address: ${application.jurisdiction.contact_address}`, margin, yPosition);
          }
          if (application.jurisdiction.portal_url) {
            yPosition = addText(`Portal: ${application.jurisdiction.portal_url}`, margin, yPosition);
          }
        }
      }

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pdf.internal.pageSize.height - 10, { align: 'right' });
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pdf.internal.pageSize.height - 10);
      }

      // Save the PDF
      const filename = `${type}_${application?.jurisdiction?.name || 'permit'}_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      toast({
        title: "Success",
        description: "PDF generated and downloaded successfully"
      });

    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const getButtonText = () => {
    switch (type) {
      case "checklist":
        return "Export Checklist";
      case "fee_estimate":
        return "Export Fee Estimate";
      case "application_summary":
        return "Export Application";
      default:
        return "Export PDF";
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      {getButtonText()}
    </Button>
  );
};

export default PDFExport;