interface ProjectInfo {
  name: string;
  customerName: string;
}

interface SelectionData {
  [key: string]: any;
}

export const generateSelectionsSummaryPDF = async (
  projectInfo: ProjectInfo,
  selections: SelectionData,
  customNotes: string
) => {
  const generateSectionContent = (sectionPrefix: string) => {
    const sectionSelections = Object.entries(selections)
      .filter(([key]) => key.startsWith(sectionPrefix))
      .map(([key, value]) => {
        const label = key.replace(sectionPrefix + '_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'Not selected');
        return `<div class="selection-item"><span class="label">${label}:</span> <span class="value">${displayValue}</span></div>`;
      });
    
    return sectionSelections.length > 0 ? sectionSelections.join('') : '<p>No selections made for this section.</p>';
  };

  const generateBathroomContent = () => {
    const bathrooms = ['master_bath', 'bath2', 'bath3'];
    return bathrooms.map(bath => {
      const bathName = bath === 'master_bath' ? 'Master Bathroom' : 
                      bath === 'bath2' ? 'Bathroom 2' : 'Bathroom 3';
      const bathSelections = Object.entries(selections)
        .filter(([key]) => key.startsWith(bath))
        .map(([key, value]) => {
          const label = key.replace(bath + '_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'Not selected');
          return `<div class="selection-item"><span class="label">${label}:</span> <span class="value">${displayValue}</span></div>`;
        });
      
      if (bathSelections.length > 0) {
        return `<div class="subsection"><h4>${bathName}</h4>${bathSelections.join('')}</div>`;
      }
      return '';
    }).join('');
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Design Selections Summary - ${projectInfo.name}</title>
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
          text-align: center;
          border-bottom: 2px solid #003562;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #003562;
          margin: 0 0 20px 0;
          font-size: 24px;
        }
        .project-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .info-field {
          margin: 5px 0;
        }
        .info-field label {
          font-weight: bold;
          margin-right: 10px;
        }
        .section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section-title {
          color: #003562;
          border-bottom: 1px solid #ddd;
          padding-bottom: 5px;
          font-size: 18px;
          margin-bottom: 15px;
        }
        .subsection {
          margin-bottom: 20px;
        }
        .subsection h4 {
          font-weight: bold;
          margin-bottom: 10px;
          color: #555;
        }
        .selection-item {
          margin: 8px 0;
          padding: 5px 0;
          border-bottom: 1px dotted #ccc;
        }
        .label {
          font-weight: bold;
          display: inline-block;
          min-width: 150px;
        }
        .value {
          color: #0066cc;
          font-weight: 500;
        }
        .notes-section {
          margin-top: 30px;
          padding: 15px;
          background-color: #f9f9f9;
          border-left: 4px solid #003562;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Design Selections Summary</h1>
        <div class="project-info">
          <div class="info-field">
            <label>Project:</label>
            <span>${projectInfo.name}</span>
          </div>
          <div class="info-field">
            <label>Customer:</label>
            <span>${projectInfo.customerName}</span>
          </div>
          <div class="info-field">
            <label>Date:</label>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">EXTERIOR SELECTIONS</h2>
        ${generateSectionContent('exterior')}
      </div>

      <div class="section">
        <h2 class="section-title">GARAGE SELECTIONS</h2>
        ${generateSectionContent('garage')}
      </div>

      <div class="section">
        <h2 class="section-title">ENTRY DOORS</h2>
        ${generateSectionContent('entry')}
      </div>

      <div class="section">
        <h2 class="section-title">INTERIOR SELECTIONS</h2>
        ${generateSectionContent('interior')}
      </div>

      <div class="section">
        <h2 class="section-title">KITCHEN SELECTIONS</h2>
        ${generateSectionContent('kitchen')}
      </div>

      <div class="section">
        <h2 class="section-title">BATHROOM SELECTIONS</h2>
        ${generateBathroomContent()}
      </div>

      <div class="section">
        <h2 class="section-title">MUDROOM SELECTIONS</h2>
        ${generateSectionContent('mudroom')}
      </div>

      <div class="section">
        <h2 class="section-title">FLOORING SELECTIONS</h2>
        ${generateSectionContent('flooring')}
      </div>

      ${customNotes ? `
      <div class="notes-section">
        <h2 class="section-title">CUSTOM NOTES</h2>
        <p>${customNotes}</p>
      </div>
      ` : ''}
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};