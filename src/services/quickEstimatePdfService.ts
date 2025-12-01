import jsPDF from 'jspdf';
import { QuickEstimateInput, QuickEstimateResult } from './quickEstimateService';

export class QuickEstimatePdfService {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  generatePdf(input: QuickEstimateInput, result: QuickEstimateResult): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header - Titan Branding
    doc.setFillColor(0, 53, 98); // #003562
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('TITAN BUILDINGS', pageWidth / 2, 13, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPos = 32;

    // Title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Quick Estimate Summary', 20, yPos);
    yPos += 10;

    // Lead Information
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prepared for: ${input.leadName}`, 20, yPos);
    yPos += 5;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 12;

    // Project Details Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Details', 20, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Build Type: ${input.buildType} Barndominium`, 25, yPos);
    yPos += 5;
    doc.text(`State: ${input.state || 'Delaware'}`, 25, yPos);
    yPos += 5;
    doc.text(`Stories: ${input.stories}`, 25, yPos);
    yPos += 5;
    doc.text(`Living Area: ${input.livingSqft.toLocaleString()} sq ft`, 25, yPos);
    yPos += 5;
    
    if (input.shopSqft > 0) {
      doc.text(`Shop/Garage: ${input.shopSqft.toLocaleString()} sq ft`, 25, yPos);
      yPos += 5;
    }
    
    if (input.includeSiteUtilities) {
      doc.text('Site & Utilities: Included in estimate', 25, yPos);
      yPos += 5;
    }
    
    yPos += 8;

    // Estimated Project Cost Section Header
    doc.setFillColor(0, 53, 98);
    doc.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Estimated Project Cost', 25, yPos + 1);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Explanation paragraph
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const explanationText = 'The figures below represent our preliminary investment estimate for your barndominium, including the building shell, standard finishes, fixtures, and related design services. This estimate assumes the scope and specifications we\'ve discussed so far and is intended for budgeting purposes only. As we finalize your design, site plan, and material selections, these numbers will be adjusted to reflect the exact requirements of your project.';
    const splitText = doc.splitTextToSize(explanationText, pageWidth - 50);
    splitText.forEach((line: string) => {
      doc.text(line, 25, yPos);
      yPos += 4;
    });
    yPos += 6;

    // Cost table with border
    const tableX = 50;
    const tableWidth = pageWidth - 100;
    const rowHeight = 7;
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    
    // Calculate costs (garage is part of building costs)
    const buildingLowTotal = result.buildingLow + (input.shopSqft > 0 ? result.shopCost : 0);
    const buildingHighTotal = result.buildingHigh + (input.shopSqft > 0 ? result.shopCost : 0);
    
    // Calculate total row count
    let totalRows = 2; // Building costs + Total
    if (input.includeSiteUtilities) totalRows++;
    if (result.sprinklerLow && result.sprinklerHigh) totalRows++;
    if (result.taxAmount) totalRows++;
    
    // Header row - Building Costs Range
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(tableX, yPos, tableWidth, rowHeight);
    doc.line(tableX + tableWidth * 0.55, yPos, tableX + tableWidth * 0.55, yPos + rowHeight * (totalRows - 1));
    doc.text('Estimated Building Costs', tableX + 5, yPos + 5);
    doc.text(
      `${this.formatCurrency(buildingLowTotal)} - ${this.formatCurrency(buildingHighTotal)}`, 
      tableX + tableWidth * 0.55 + 5, 
      yPos + 5
    );
    yPos += rowHeight;
    
    // Non-home costs row (only if site utilities included)
    if (input.includeSiteUtilities) {
      doc.rect(tableX, yPos, tableWidth, rowHeight);
      doc.text('Estimated Non-Home Costs', tableX + 5, yPos + 5);
      doc.text(
        `${this.formatCurrency(result.siteUtilitiesLow)} - ${this.formatCurrency(result.siteUtilitiesHigh)}`, 
        tableX + tableWidth * 0.55 + 5, 
        yPos + 5
      );
      yPos += rowHeight;
    }
    
    // Sprinkler system row (only for Maryland)
    if (result.sprinklerLow && result.sprinklerHigh) {
      doc.rect(tableX, yPos, tableWidth, rowHeight);
      doc.text('Sprinkler System (MD Required)', tableX + 5, yPos + 5);
      doc.text(
        `${this.formatCurrency(result.sprinklerLow)} - ${this.formatCurrency(result.sprinklerHigh)}`, 
        tableX + tableWidth * 0.55 + 5, 
        yPos + 5
      );
      yPos += rowHeight;
    }
    
    // Maryland tax row
    if (result.taxAmount) {
      doc.rect(tableX, yPos, tableWidth, rowHeight);
      doc.text('Maryland Tax (6%)', tableX + 5, yPos + 5);
      doc.text(
        this.formatCurrency(result.taxAmount), 
        tableX + tableWidth * 0.55 + 5, 
        yPos + 5
      );
      yPos += rowHeight;
    }
    
    // Total row with range
    doc.rect(tableX, yPos, tableWidth, rowHeight);
    doc.text('Estimated Total Project Build', tableX + 5, yPos + 5);
    doc.text(
      `${this.formatCurrency(result.totalLow)} - ${this.formatCurrency(result.totalHigh)}`, 
      tableX + tableWidth * 0.55 + 5, 
      yPos + 5
    );
    yPos += rowHeight + 5;

    // Disclaimer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('We anticipate your final project cost to fall within ±10% of this initial proposal', 25, yPos);
    yPos += 12;

    // Standard Building Summary
    doc.setFillColor(0, 53, 98);
    doc.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Standard Building Summary', 25, yPos + 1);
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const summaryText = 'This estimate is based on a standard building design with straightforward rooflines and standard finishes. Complex architectural features, multiple rooflines, or premium upgrades may affect final pricing.';
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 50);
    splitSummary.forEach((line: string) => {
      doc.text(line, 25, yPos);
      yPos += 4;
    });
    yPos += 8;

    // Next Steps Section
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Next Steps', 22, yPos);
    yPos += 8;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    
    const steps = [
      '1. Sit with in-house designer to determine optimal layout – Work with our design team to create the perfect floor plan for your needs.',
      '2. Design services deposit – Submit the $3,000 design deposit, which covers CAD drawings, structural engineering, and permit-ready plans. This amount is credited toward your overall project cost.',
      '3. Site evaluation – Complete survey, soil test, and septic/well feasibility, then we\'ll prepare a full site plan.',
      '4. Selections – Choose finishes such as paint colors, cabinetry, countertops, flooring, fixtures, and railings so materials and pricing can be locked in.',
      '5. Permitting – Once plans and site details are complete, we\'ll prepare and file all county permit applications.',
      '6. Construction contract – Finalize the building contract and set a start date.',
    ];

    steps.forEach((step) => {
      // Split step into label (before dash) and description (after dash)
      const dashIndex = step.indexOf(' – ');
      if (dashIndex > -1) {
        const label = step.substring(0, dashIndex);
        const description = step.substring(dashIndex + 3);
        
        // Print bold label
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPos);
        const labelWidth = doc.getTextWidth(label);
        
        // Print regular description
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(' – ' + description, pageWidth - 46 - labelWidth);
        doc.text(descLines[0], 25 + labelWidth, yPos);
        yPos += 3.5;
        
        // Print remaining lines if any
        for (let i = 1; i < descLines.length; i++) {
          doc.text(descLines[i], 25, yPos);
          yPos += 3.5;
        }
      } else {
        const lines = doc.splitTextToSize(step, pageWidth - 46);
        lines.forEach((line: string) => {
          doc.text(line, 25, yPos);
          yPos += 3.5;
        });
      }
      yPos += 1;
    });

    yPos += 5;
    
    // Final paragraph
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const finalText = 'Once these steps are underway, we\'ll provide an updated, detailed cost breakdown reflecting your confirmed selections and site specifics. You will take tour final plans and building contract to the bank for funding.';
    const finalLines = doc.splitTextToSize(finalText, pageWidth - 50);
    finalLines.forEach((line: string) => {
      doc.text(line, 25, yPos);
      yPos += 3.5;
    });

    // Save the PDF
    const fileName = `Titan_QuickEstimate_${input.leadName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}

export const quickEstimatePdfService = new QuickEstimatePdfService();
