import { jsPDF } from 'jspdf';

interface ProjectInfo {
  name: string;
  customerName: string;
}

interface ProjectData {
  [key: string]: any;
}

export const generateProjectSummaryPDF = async (
  projectInfo: ProjectInfo, 
  projectData: ProjectData, 
  colorSelections: any,
  notes: string[],
  printMode: boolean = false
): Promise<void> => {
  if (printMode) {
    // Print mode - open in new window and show print dialog
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window');
    }

    const htmlContent = generateHTMLContent(projectInfo, projectData, colorSelections, notes);
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } else {
    // Download mode - create actual PDF
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Summary', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Project: ${projectInfo.name}`, 20, 35);
    doc.text(`Customer: ${projectInfo.customerName}`, 20, 45);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
    
    // Line under header
    doc.line(20, 65, 190, 65);
    
    let yPosition = 80;
    
    // Project Specifications Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Specifications', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(projectData).forEach(([key, value]) => {
      const label = formatFieldLabel(key);
      const text = `${label}: ${value || 'Not specified'}`;
      
      // Handle text wrapping
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 2;
      
      // Add new page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    yPosition += 10;
    
    // Color Selections Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Color Selections', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(colorSelections).forEach(([key, value]) => {
      const label = formatFieldLabel(key);
      const text = `${label}: ${value}`;
      
      const lines = doc.splitTextToSize(text, 170);
      doc.text(lines, 20, yPosition);
      yPosition += lines.length * 5 + 2;
      
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
    
    // Project Notes Section
    if (notes.length > 0) {
      yPosition += 10;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Project Notes', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      notes.forEach((note, index) => {
        const noteText = `• ${note}`;
        const lines = doc.splitTextToSize(noteText, 170);
        doc.text(lines, 20, yPosition);
        yPosition += lines.length * 5 + 5;
        
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });
    }
    
    // Save the PDF
    doc.save(`${projectInfo.name}_Summary.pdf`);
  }
};

const generateHTMLContent = (
  projectInfo: ProjectInfo,
  projectData: ProjectData,
  colorSelections: any,
  notes: string[]
): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Summary - ${projectInfo.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          margin: 0.5in;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          background: white;
          margin: 0;
          padding: 0;
        }
        
        .container {
          margin: 0;
          padding: 10px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 15px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        
        .header h1 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #333;
        }
        
        .header p {
          font-size: 16px;
          color: #666;
          margin-bottom: 2px;
        }
        
        .section {
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        
        .field {
          margin-bottom: 10px;
        }
        
        .field-label {
          font-weight: bold;
          margin-bottom: 5px;
          color: #555;
        }
        
        .field-value {
          color: #333;
          padding: 5px 10px;
          background-color: #f9f9f9;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }
        
        .color-section {
          margin-bottom: 20px;
        }
        
        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .color-item {
          display: flex;
          align-items: center;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: #f9f9f9;
        }
        
        .color-swatch {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-right: 10px;
          border: 1px solid #ccc;
        }
        
        .notes-section ul {
          list-style-type: disc;
          margin-left: 20px;
        }
        
        .notes-section li {
          margin-bottom: 5px;
          padding: 2px 0;
        }
        
        @media print {
          body { print-color-adjust: exact; }
          .container { max-width: none; margin: 0; padding: 15px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Project Summary</h1>
          <p><strong>Project:</strong> ${projectInfo.name}</p>
          <p><strong>Customer:</strong> ${projectInfo.customerName}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <h2 class="section-title">Project Specifications</h2>
          <div class="grid">
            ${Object.entries(projectData).map(([key, value]) => `
              <div class="field">
                <div class="field-label">${formatFieldLabel(key)}</div>
                <div class="field-value">${value || 'Not specified'}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Color Selections</h2>
          <div class="color-grid">
            ${Object.entries(colorSelections).map(([key, value]) => `
              <div class="color-item">
                <div class="color-swatch" style="background-color: ${getColorHex(value as string)};"></div>
                <div>
                  <div style="font-weight: bold;">${formatFieldLabel(key)}</div>
                  <div>${value}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        ${notes.length > 0 ? `
          <div class="section notes-section">
            <h2 class="section-title">Project Notes</h2>
            <ul>
              ${notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

const formatFieldLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const getColorHex = (colorSelection: string): string => {
  // Import color mapping from titanColors
  const titanColorMap: { [key: string]: string } = {
    "Brown": "#6B4423",
    "Tan": "#D2B48C", 
    "Ash Gray": "#B2BEB5",
    "Charcoal": "#36454F",
    "Light Stone": "#D3D3C7",
    "Hunter Green": "#355E3B",
    "Alamo White": "#F8F8FF",
    "Rustic Red": "#B7410E",
    "Ocean Blue": "#006994",
    "Brite White": "#FFFFFF",
    "Burgundy": "#800020",
    "Taupe": "#B8B5A1",
    "Burnished Slate": "#2F2F2F",
    "Gallery Blue": "#4169E1",
    "Brite Red": "#DC143C",
    "Dark Green": "#013220",
    "Copper Metallic": "#B87333",
    "Ivory": "#FFFFF0",
    "Matte Black": "#1C1C1C",
    "Pewter Gray": "#96A0A0",
    "Colony Green": "#4F7942",
    "Galvalume": "#C0C0C0"
  };
  
  // Legacy color mapping for specific selections
  const legacyColorMap: { [key: string]: string } = {
    'Black': '#000000',
    'Wood Design': '#8B4513',
    'Wood Finish to Match Garage Doors': '#8B4513',
    'No Wainscoting': '#f5f5f5'
  };
  
  // Extract color name from selection string like "Brown (WXB1009L)"
  const colorName = colorSelection.split(' (')[0];
  
  return titanColorMap[colorName] || legacyColorMap[colorSelection] || '#f5f5f5';
};