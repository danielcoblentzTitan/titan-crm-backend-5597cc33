import { Lead } from "@/services/supabaseService";

export const generateLeadPDF = async (lead: Lead): Promise<Blob> => {
  // Create HTML content for the PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Lead Information - ${lead.first_name} ${lead.last_name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          border-bottom: 2px solid #003562;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #003562;
          margin: 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h2 {
          color: #003562;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-item {
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .value {
          margin-left: 10px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-new { background-color: #dbeafe; color: #1e40af; }
        .status-contacted { background-color: #fef3c7; color: #92400e; }
        .status-qualified { background-color: #e9d5ff; color: #7c3aed; }
        .status-proposal { background-color: #fed7aa; color: #ea580c; }
        .status-negotiation { background-color: #e0e7ff; color: #4338ca; }
        .status-won { background-color: #dcfce7; color: #166534; }
        .status-lost { background-color: #fee2e2; color: #dc2626; }
        .priority-low { background-color: #f3f4f6; color: #374151; }
        .priority-medium { background-color: #fef3c7; color: #92400e; }
        .priority-high { background-color: #fee2e2; color: #dc2626; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Lead Information</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <h2>Contact Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Name:</span>
            <span class="value">${lead.first_name} ${lead.last_name}</span>
          </div>
          <div class="info-item">
            <span class="label">Email:</span>
            <span class="value">${lead.email || 'Not provided'}</span>
          </div>
          <div class="info-item">
            <span class="label">Phone:</span>
            <span class="value">${lead.phone || 'Not provided'}</span>
          </div>
          <div class="info-item">
            <span class="label">Company:</span>
            <span class="value">${lead.company || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Address Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Address:</span>
            <span class="value">${lead.address || 'Not provided'}</span>
          </div>
          <div class="info-item">
            <span class="label">City:</span>
            <span class="value">${lead.city || 'Not provided'}</span>
          </div>
          <div class="info-item">
            <span class="label">State:</span>
            <span class="value">${lead.state || 'Not provided'}</span>
          </div>
          <div class="info-item">
            <span class="label">ZIP Code:</span>
            <span class="value">${lead.zip || 'Not provided'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Lead Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Status:</span>
            <span class="status-badge status-${(lead.status || 'new').toLowerCase()}">${lead.status || 'New'}</span>
          </div>
          <div class="info-item">
            <span class="label">Priority:</span>
            <span class="status-badge priority-${(lead.priority || 'medium').toLowerCase()}">${lead.priority || 'Medium'}</span>
          </div>
          <div class="info-item">
            <span class="label">Source:</span>
            <span class="value">${lead.source || 'Not specified'}</span>
          </div>
          <div class="info-item">
            <span class="label">Estimated Value:</span>
            <span class="value">$${(lead.estimated_value || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      ${lead.notes ? `
      <div class="section">
        <h2>Notes</h2>
        <p>${lead.notes}</p>
      </div>
      ` : ''}

      <div class="section">
        <h2>Timeline</h2>
        <div class="info-item">
          <span class="label">Created:</span>
          <span class="value">${new Date(lead.created_at).toLocaleDateString()}</span>
        </div>
        ${lead.last_contact_date ? `
        <div class="info-item">
          <span class="label">Last Contact:</span>
          <span class="value">${new Date(lead.last_contact_date).toLocaleDateString()}</span>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using the browser's print functionality
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // For now, return a simple blob - in production you'd want to use a proper PDF library
  const blob = new Blob([htmlContent], { type: 'text/html' });
  return blob;
};

export const downloadLeadPDF = async (lead: Lead) => {
  try {
    const pdfBlob = await generateLeadPDF(lead);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lead-${lead.first_name}-${lead.last_name}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const generateBlankDesignSelectionsPDF = async (): Promise<Blob> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Titan Buildings - Customer Selections Sheet</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.4;
          color: #333;
          max-width: 900px;
          margin: 0 auto;
          padding: 15px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #003562;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }
        .header h1 {
          color: #003562;
          margin: 0 0 15px 0;
          font-size: 22px;
          font-weight: bold;
        }
        .project-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .info-field {
          margin: 5px 0;
        }
        .info-field label {
          font-weight: bold;
          margin-right: 10px;
        }
        .blank-line {
          border-bottom: 1px dotted #333;
          display: inline-block;
          min-width: 120px;
          margin-left: 5px;
        }
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          background: #fafafa;
        }
        .section-title {
          color: #003562;
          border-bottom: 2px solid #003562;
          padding-bottom: 5px;
          font-size: 16px;
          margin-bottom: 15px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .subsection {
          margin-bottom: 15px;
          background: white;
          padding: 12px;
          border-radius: 5px;
          border-left: 4px solid #003562;
        }
        .subsection h4 {
          font-weight: bold;
          margin-bottom: 8px;
          color: #003562;
          font-size: 14px;
        }
        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 5px;
          margin-bottom: 10px;
        }
        .checkbox-item {
          margin: 3px 0;
          display: flex;
          align-items: center;
          font-size: 11px;
        }
        .checkbox {
          width: 12px;
          height: 12px;
          border: 2px solid #333;
          display: inline-block;
          margin-right: 8px;
          flex-shrink: 0;
        }
        .input-field {
          margin: 8px 0;
          display: flex;
          align-items: center;
        }
        .input-field label {
          display: inline-block;
          min-width: 120px;
          font-weight: bold;
          margin-right: 10px;
        }
        .text-area {
          border: 2px solid #333;
          width: 100%;
          min-height: 80px;
          margin-top: 10px;
        }
        .color-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 8px;
          margin: 10px 0;
        }
        .color-item {
          display: flex;
          align-items: center;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          margin-bottom: 5px;
        }
        .color-swatch {
          width: 20px;
          height: 20px;
          border: 1px solid #333;
          margin-right: 8px;
          flex-shrink: 0;
        }
        .hardware-showcase {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 10px 0;
        }
        .hardware-item {
          text-align: center;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 10px;
          background: white;
        }
        .hardware-finish {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          margin: 0 auto 5px;
          border: 2px solid #ccc;
        }
        .flooring-room {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin: 10px 0;
        }
        .notes-section {
          margin-top: 25px;
          background: #fff9e6;
          padding: 15px;
          border-radius: 8px;
          border: 2px solid #ffd700;
        }
        .signature-section {
          margin-top: 30px;
          padding: 20px;
          border: 2px solid #003562;
          border-radius: 8px;
          background: #f8f9ff;
        }
        .signature-line {
          border-bottom: 2px solid #333;
          width: 300px;
          height: 40px;
          margin: 10px 0;
        }
        @media print {
          body { margin: 0; padding: 10px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Titan Buildings – Customer Selections Sheet</h1>
        <div class="project-info">
          <div class="info-field">
            <label>Project Name:</label>
            <span class="blank-line"></span>
          </div>
          <div class="info-field">
            <label>Customer Name:</label>
            <span class="blank-line"></span>
          </div>
          <div class="info-field">
            <label>Date:</label>
            <span class="blank-line"></span>
          </div>
        </div>
      </div>

      <!-- EXTERIOR SELECTIONS -->
      <div class="section">
        <h2 class="section-title">🏠 EXTERIOR SELECTIONS</h2>
        
        <div class="subsection">
          <h4>Building Components - Color Selections</h4>
          <div style="margin-bottom: 15px;">
            <strong>Siding Color:</strong>
            <div class="color-grid">
              <div class="color-item"><div class="color-swatch" style="background: #6B4423;"></div> <span class="checkbox"></span> Brown (WXB1009L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D2B48C;"></div> <span class="checkbox"></span> Tan (WXD0049L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B2BEB5;"></div> <span class="checkbox"></span> Ash Gray (WXA0092L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #36454F;"></div> <span class="checkbox"></span> Charcoal (WXA0090L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D3D3C7;"></div> <span class="checkbox"></span> Light Stone (WXD0038L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #355E3B;"></div> <span class="checkbox"></span> Hunter Green (WXG0021L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #F8F8FF;"></div> <span class="checkbox"></span> Alamo White (WXW0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B7410E;"></div> <span class="checkbox"></span> Rustic Red (WXR0074L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #006994;"></div> <span class="checkbox"></span> Ocean Blue (WXL0028L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFFF;"></div> <span class="checkbox"></span> Brite White (WXW0050L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #800020;"></div> <span class="checkbox"></span> Burgundy (WXR0076L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B8B5A1;"></div> <span class="checkbox"></span> Taupe (WXD0047L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #2F2F2F;"></div> <span class="checkbox"></span> Burnished Slate (WXB1007L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4169E1;"></div> <span class="checkbox"></span> Gallery Blue (WXL0026L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #DC143C;"></div> <span class="checkbox"></span> Brite Red (WXR0084)</div>
              <div class="color-item"><div class="color-swatch" style="background: #013220;"></div> <span class="checkbox"></span> Dark Green (WXG0020L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B87333;"></div> <span class="checkbox"></span> Copper Metallic (4392637M)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFF0;"></div> <span class="checkbox"></span> Ivory (WXD0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #1C1C1C;"></div> <span class="checkbox"></span> Matte Black (WXA0117L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #96A0A0;"></div> <span class="checkbox"></span> Pewter Gray (WXA0093L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4F7942;"></div> <span class="checkbox"></span> Colony Green (WXG0029L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #C0C0C0;"></div> <span class="checkbox"></span> Galvalume (GAL)</div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Trim Color:</strong>
            <div class="color-grid">
              <div class="color-item"><div class="color-swatch" style="background: #6B4423;"></div> <span class="checkbox"></span> Brown (WXB1009L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D2B48C;"></div> <span class="checkbox"></span> Tan (WXD0049L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B2BEB5;"></div> <span class="checkbox"></span> Ash Gray (WXA0092L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #36454F;"></div> <span class="checkbox"></span> Charcoal (WXA0090L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D3D3C7;"></div> <span class="checkbox"></span> Light Stone (WXD0038L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #355E3B;"></div> <span class="checkbox"></span> Hunter Green (WXG0021L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #F8F8FF;"></div> <span class="checkbox"></span> Alamo White (WXW0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B7410E;"></div> <span class="checkbox"></span> Rustic Red (WXR0074L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #006994;"></div> <span class="checkbox"></span> Ocean Blue (WXL0028L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFFF;"></div> <span class="checkbox"></span> Brite White (WXW0050L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #800020;"></div> <span class="checkbox"></span> Burgundy (WXR0076L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B8B5A1;"></div> <span class="checkbox"></span> Taupe (WXD0047L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #2F2F2F;"></div> <span class="checkbox"></span> Burnished Slate (WXB1007L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4169E1;"></div> <span class="checkbox"></span> Gallery Blue (WXL0026L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #DC143C;"></div> <span class="checkbox"></span> Brite Red (WXR0084)</div>
              <div class="color-item"><div class="color-swatch" style="background: #013220;"></div> <span class="checkbox"></span> Dark Green (WXG0020L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B87333;"></div> <span class="checkbox"></span> Copper Metallic (4392637M)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFF0;"></div> <span class="checkbox"></span> Ivory (WXD0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #1C1C1C;"></div> <span class="checkbox"></span> Matte Black (WXA0117L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #96A0A0;"></div> <span class="checkbox"></span> Pewter Gray (WXA0093L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4F7942;"></div> <span class="checkbox"></span> Colony Green (WXG0029L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #C0C0C0;"></div> <span class="checkbox"></span> Galvalume (GAL)</div>
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <strong>Roof Color:</strong>
            <div class="color-grid">
              <div class="color-item"><div class="color-swatch" style="background: #6B4423;"></div> <span class="checkbox"></span> Brown (WXB1009L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D2B48C;"></div> <span class="checkbox"></span> Tan (WXD0049L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B2BEB5;"></div> <span class="checkbox"></span> Ash Gray (WXA0092L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #36454F;"></div> <span class="checkbox"></span> Charcoal (WXA0090L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #D3D3C7;"></div> <span class="checkbox"></span> Light Stone (WXD0038L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #355E3B;"></div> <span class="checkbox"></span> Hunter Green (WXG0021L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #F8F8FF;"></div> <span class="checkbox"></span> Alamo White (WXW0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B7410E;"></div> <span class="checkbox"></span> Rustic Red (WXR0074L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #006994;"></div> <span class="checkbox"></span> Ocean Blue (WXL0028L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFFF;"></div> <span class="checkbox"></span> Brite White (WXW0050L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #800020;"></div> <span class="checkbox"></span> Burgundy (WXR0076L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B8B5A1;"></div> <span class="checkbox"></span> Taupe (WXD0047L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #2F2F2F;"></div> <span class="checkbox"></span> Burnished Slate (WXB1007L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4169E1;"></div> <span class="checkbox"></span> Gallery Blue (WXL0026L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #DC143C;"></div> <span class="checkbox"></span> Brite Red (WXR0084)</div>
              <div class="color-item"><div class="color-swatch" style="background: #013220;"></div> <span class="checkbox"></span> Dark Green (WXG0020L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #B87333;"></div> <span class="checkbox"></span> Copper Metallic (4392637M)</div>
              <div class="color-item"><div class="color-swatch" style="background: #FFFFF0;"></div> <span class="checkbox"></span> Ivory (WXD0051L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #1C1C1C;"></div> <span class="checkbox"></span> Matte Black (WXA0117L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #96A0A0;"></div> <span class="checkbox"></span> Pewter Gray (WXA0093L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #4F7942;"></div> <span class="checkbox"></span> Colony Green (WXG0029L)</div>
              <div class="color-item"><div class="color-swatch" style="background: #C0C0C0;"></div> <span class="checkbox"></span> Galvalume (GAL)</div>
            </div>
          </div>
        </div>
      </div>

      <!-- DOORS & WINDOWS -->
      <div class="section">
        <h2 class="section-title">🚪 DOORS & WINDOWS</h2>
        
        <div class="subsection">
          <h4>Entry Doors</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Steel Entry Door - Standard</div>
            <div class="checkbox-item"><span class="checkbox"></span> Steel Entry Door - Insulated</div>
            <div class="checkbox-item"><span class="checkbox"></span> Fiberglass Entry Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Wood Entry Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Glass Panel Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Decorative Glass Insert</div>
          </div>
          
          <div class="input-field">
            <label>Custom specifications:</label>
            <div class="blank-line" style="width: 300px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Garage Doors</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Overhead Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Insulated Overhead Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Sectional Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Roll-Up Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Bi-Fold Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Sliding Door</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Size Door</div>
          </div>
          
          <div class="input-field">
            <label>Door dimensions:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          
          <div class="input-field">
            <label>Opener specifications:</label>
            <div class="blank-line" style="width: 250px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Windows</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Single Hung Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Double Hung Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Casement Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Fixed Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Sliding Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Bay Windows</div>
            <div class="checkbox-item"><span class="checkbox"></span> Skylight Windows</div>
          </div>

          <h4>Window Hardware & Finishes</h4>
          <div class="hardware-showcase">
            <div class="hardware-item">
              <div class="hardware-finish" style="background: #C0C0C0;"></div>
              <span class="checkbox"></span> Chrome
            </div>
            <div class="hardware-item">
              <div class="hardware-finish" style="background: #CD7F32;"></div>
              <span class="checkbox"></span> Bronze
            </div>
            <div class="hardware-item">
              <div class="hardware-finish" style="background: #B87333;"></div>
              <span class="checkbox"></span> Brass
            </div>
            <div class="hardware-item">
              <div class="hardware-finish" style="background: #1C1C1C;"></div>
              <span class="checkbox"></span> Black
            </div>
          </div>
        </div>
      </div>

      <!-- INTERIOR SELECTIONS -->
      <div class="section">
        <h2 class="section-title">🏠 INTERIOR SELECTIONS</h2>
        
        <div class="subsection">
          <h4>Flooring by Room</h4>
          <div class="flooring-room">
            <div>
              <strong>Living Areas:</strong>
              <div class="checkbox-grid">
                <div class="checkbox-item"><span class="checkbox"></span> Concrete - Polished</div>
                <div class="checkbox-item"><span class="checkbox"></span> Concrete - Stained</div>
                <div class="checkbox-item"><span class="checkbox"></span> Concrete - Epoxy Coated</div>
                <div class="checkbox-item"><span class="checkbox"></span> Luxury Vinyl Plank</div>
                <div class="checkbox-item"><span class="checkbox"></span> Hardwood - Oak</div>
                <div class="checkbox-item"><span class="checkbox"></span> Hardwood - Pine</div>
                <div class="checkbox-item"><span class="checkbox"></span> Tile - Ceramic</div>
                <div class="checkbox-item"><span class="checkbox"></span> Tile - Porcelain</div>
                <div class="checkbox-item"><span class="checkbox"></span> Carpet</div>
                <div class="checkbox-item"><span class="checkbox"></span> Laminate</div>
              </div>
            </div>
            
            <div>
              <strong>Bathrooms:</strong>
              <div class="checkbox-grid">
                <div class="checkbox-item"><span class="checkbox"></span> Ceramic Tile</div>
                <div class="checkbox-item"><span class="checkbox"></span> Porcelain Tile</div>
                <div class="checkbox-item"><span class="checkbox"></span> Natural Stone</div>
                <div class="checkbox-item"><span class="checkbox"></span> Luxury Vinyl</div>
                <div class="checkbox-item"><span class="checkbox"></span> Polished Concrete</div>
              </div>
            </div>
            
            <div>
              <strong>Kitchen:</strong>
              <div class="checkbox-grid">
                <div class="checkbox-item"><span class="checkbox"></span> Ceramic Tile</div>
                <div class="checkbox-item"><span class="checkbox"></span> Porcelain Tile</div>
                <div class="checkbox-item"><span class="checkbox"></span> Hardwood</div>
                <div class="checkbox-item"><span class="checkbox"></span> Luxury Vinyl</div>
                <div class="checkbox-item"><span class="checkbox"></span> Natural Stone</div>
                <div class="checkbox-item"><span class="checkbox"></span> Polished Concrete</div>
              </div>
            </div>
            
            <div>
              <strong>Bedrooms:</strong>
              <div class="checkbox-grid">
                <div class="checkbox-item"><span class="checkbox"></span> Carpet</div>
                <div class="checkbox-item"><span class="checkbox"></span> Hardwood</div>
                <div class="checkbox-item"><span class="checkbox"></span> Luxury Vinyl Plank</div>
                <div class="checkbox-item"><span class="checkbox"></span> Laminate</div>
                <div class="checkbox-item"><span class="checkbox"></span> Polished Concrete</div>
              </div>
            </div>
          </div>
        </div>

        <div class="subsection">
          <h4>Interior Doors</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Hollow Core - Paint Grade</div>
            <div class="checkbox-item"><span class="checkbox"></span> Solid Core - Paint Grade</div>
            <div class="checkbox-item"><span class="checkbox"></span> Solid Wood - Stain Grade</div>
            <div class="checkbox-item"><span class="checkbox"></span> Glass Panel Interior</div>
            <div class="checkbox-item"><span class="checkbox"></span> Barn Door Style</div>
            <div class="checkbox-item"><span class="checkbox"></span> Pocket Doors</div>
            <div class="checkbox-item"><span class="checkbox"></span> French Doors</div>
          </div>
        </div>

        <div class="subsection">
          <h4>Trim & Millwork</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Baseboard (3.5")</div>
            <div class="checkbox-item"><span class="checkbox"></span> Upgraded Baseboard (5.25")</div>
            <div class="checkbox-item"><span class="checkbox"></span> Crown Molding</div>
            <div class="checkbox-item"><span class="checkbox"></span> Chair Rail</div>
            <div class="checkbox-item"><span class="checkbox"></span> Wainscoting</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Millwork</div>
          </div>
          
          <div class="input-field">
            <label>Trim finish:</label>
            <span class="checkbox" style="margin-right: 5px;"></span> Paint Grade
            <span class="checkbox" style="margin: 0 5px 0 15px;"></span> Stain Grade
          </div>
        </div>

        <div class="subsection">
          <h4>Paint & Finishes</h4>
          <div class="input-field">
            <label>Wall Paint Color:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Trim Paint Color:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Ceiling Color:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Flat Paint</div>
            <div class="checkbox-item"><span class="checkbox"></span> Eggshell Paint</div>
            <div class="checkbox-item"><span class="checkbox"></span> Satin Paint</div>
            <div class="checkbox-item"><span class="checkbox"></span> Semi-Gloss Paint</div>
          </div>
        </div>
      </div>

      <!-- KITCHEN & BATH -->
      <div class="section">
        <h2 class="section-title">🍽️ KITCHEN & BATH SELECTIONS</h2>
        
        <div class="subsection">
          <h4>Kitchen Cabinets</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Stock Cabinets</div>
            <div class="checkbox-item"><span class="checkbox"></span> Semi-Custom Cabinets</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Built Cabinets</div>
          </div>
          
          <div class="input-field">
            <label>Cabinet Style:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Cabinet Finish:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Countertops</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Laminate</div>
            <div class="checkbox-item"><span class="checkbox"></span> Granite</div>
            <div class="checkbox-item"><span class="checkbox"></span> Quartz</div>
            <div class="checkbox-item"><span class="checkbox"></span> Marble</div>
            <div class="checkbox-item"><span class="checkbox"></span> Concrete</div>
            <div class="checkbox-item"><span class="checkbox"></span> Butcher Block</div>
          </div>
          
          <div class="input-field">
            <label>Edge Profile:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Kitchen Appliances</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> Stainless Steel Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Selection</div>
          </div>
          
          <div class="input-field">
            <label>Refrigerator:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Range/Cooktop:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Dishwasher:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Microwave:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Bathroom Fixtures</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Toilet</div>
            <div class="checkbox-item"><span class="checkbox"></span> Comfort Height Toilet</div>
            <div class="checkbox-item"><span class="checkbox"></span> One-Piece Toilet</div>
            <div class="checkbox-item"><span class="checkbox"></span> Wall-Mounted Toilet</div>
          </div>
          
          <div class="input-field">
            <label>Vanity Style:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Vanity Top:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
          <div class="input-field">
            <label>Faucet Finish:</label>
            <div class="blank-line" style="width: 200px;"></div>
          </div>
        </div>

        <div class="subsection">
          <h4>Shower/Tub</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Tub/Shower Combo</div>
            <div class="checkbox-item"><span class="checkbox"></span> Walk-in Shower</div>
            <div class="checkbox-item"><span class="checkbox"></span> Garden Tub</div>
            <div class="checkbox-item"><span class="checkbox"></span> Soaking Tub</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Tile Shower</div>
          </div>
        </div>
      </div>

      <!-- ELECTRICAL & MECHANICAL -->
      <div class="section">
        <h2 class="section-title">⚡ ELECTRICAL & MECHANICAL</h2>
        
        <div class="subsection">
          <h4>Electrical Outlets & Switches</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard White</div>
            <div class="checkbox-item"><span class="checkbox"></span> Ivory/Almond</div>
            <div class="checkbox-item"><span class="checkbox"></span> Decorative</div>
          </div>
        </div>

        <div class="subsection">
          <h4>Lighting</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Builder Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> Recessed LED Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> Custom Selection</div>
          </div>
        </div>

        <div class="subsection">
          <h4>HVAC System</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Standard Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> High Efficiency Package</div>
            <div class="checkbox-item"><span class="checkbox"></span> Zoned System</div>
          </div>
        </div>
      </div>

      <!-- SPECIAL FEATURES -->
      <div class="section">
        <h2 class="section-title">✨ SPECIAL FEATURES & UPGRADES</h2>
        
        <div class="subsection">
          <h4>Optional Features</h4>
          <div class="checkbox-grid">
            <div class="checkbox-item"><span class="checkbox"></span> Ceiling Fans</div>
            <div class="checkbox-item"><span class="checkbox"></span> Built-in Shelving</div>
            <div class="checkbox-item"><span class="checkbox"></span> Fireplace</div>
            <div class="checkbox-item"><span class="checkbox"></span> Deck/Patio</div>
            <div class="checkbox-item"><span class="checkbox"></span> Outdoor Kitchen</div>
            <div class="checkbox-item"><span class="checkbox"></span> Workshop Area</div>
            <div class="checkbox-item"><span class="checkbox"></span> Storage Loft</div>
            <div class="checkbox-item"><span class="checkbox"></span> Insulation Upgrade</div>
            <div class="checkbox-item"><span class="checkbox"></span> Security System Pre-wire</div>
            <div class="checkbox-item"><span class="checkbox"></span> Sound System Pre-wire</div>
          </div>
        </div>
      </div>

      <!-- NOTES SECTION -->
      <div class="notes-section">
        <h3 style="color: #b8860b; margin-top: 0;">📝 ADDITIONAL NOTES & SPECIAL REQUESTS</h3>
        <div class="text-area"></div>
      </div>

      <!-- SIGNATURE SECTION -->
      <div class="signature-section">
        <h3 style="color: #003562; margin-top: 0;">✍️ APPROVALS & SIGNATURES</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
          <div>
            <p><strong>Customer Signature:</strong></p>
            <div class="signature-line"></div>
            <p style="margin: 5px 0;">Print Name: ________________</p>
            <p style="margin: 5px 0;">Date: ________________</p>
          </div>
          
          <div>
            <p><strong>Titan Buildings Representative:</strong></p>
            <div class="signature-line"></div>
            <p style="margin: 5px 0;">Print Name: ________________</p>
            <p style="margin: 5px 0;">Date: ________________</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 10px; background: #fffacd; border-radius: 5px;">
          <p style="margin: 0; font-weight: bold; text-align: center;">
            Please review all selections carefully. Changes after construction begins may result in additional costs and delays.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF using the browser's print functionality
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  // Return a simple blob
  const blob = new Blob([htmlContent], { type: 'text/html' });
  return blob;
};

export const downloadBlankDesignSelectionsPDF = async () => {
  try {
    const pdfBlob = await generateBlankDesignSelectionsPDF();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `titan-buildings-selections-sheet-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating selections PDF:', error);
    throw error;
  }
};