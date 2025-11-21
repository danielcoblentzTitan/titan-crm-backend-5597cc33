interface ProjectInfo {
  name: string;
  number: string;
  customerName: string;
}

interface SelectionItem {
  label: string;
  description?: string;
  material_type?: string;
  brand?: string;
  model_or_sku?: string;
  color_name?: string;
  finish?: string;
  quantity?: number;
  unit?: string;
  notes_for_sub?: string;
  is_upgrade?: boolean;
}

export interface RoomData {
  room: {
    room_name: string;
    sort_order?: number;
  };
  items: SelectionItem[];
}

export const generateTradePDF = (
  projectInfo: ProjectInfo,
  tradeName: string,
  selectionsByRoom: RoomData[]
) => {
  const generateRoomContent = (roomData: RoomData) => {
    const itemsHtml = roomData.items.map(item => `
      <div class="selection-item">
        <div class="selection-header">
          <strong>${item.label}</strong>
          ${item.is_upgrade ? '<span class="upgrade-badge">UPGRADE</span>' : ''}
        </div>
        ${item.description ? `<p class="description">${item.description}</p>` : ''}
        <div class="selection-details">
          ${item.material_type ? `<div><span class="label">Material:</span> ${item.material_type}</div>` : ''}
          ${item.brand ? `<div><span class="label">Brand:</span> ${item.brand}</div>` : ''}
          ${item.model_or_sku ? `<div><span class="label">SKU:</span> ${item.model_or_sku}</div>` : ''}
          ${item.color_name ? `<div><span class="label">Color:</span> ${item.color_name}</div>` : ''}
          ${item.finish ? `<div><span class="label">Finish:</span> ${item.finish}</div>` : ''}
          ${item.quantity ? `<div><span class="label">Quantity:</span> ${item.quantity} ${item.unit || ''}</div>` : ''}
        </div>
        ${item.notes_for_sub ? `
          <div class="notes-for-sub">
            <strong>Notes for Sub:</strong>
            <p>${item.notes_for_sub}</p>
          </div>
        ` : ''}
      </div>
    `).join('');

    return `
      <div class="room-section">
        <h3 class="room-title">${roomData.room.room_name}</h3>
        <div class="items-container">
          ${itemsHtml}
        </div>
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${tradeName} - Trade Packet - ${projectInfo.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #003562;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .header h1 {
          color: #003562;
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .header .trade-name {
          font-size: 24px;
          color: #0066cc;
          font-weight: bold;
          margin-bottom: 15px;
        }
        
        .project-info {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 15px;
        }
        
        .info-field {
          font-size: 14px;
        }
        
        .info-field label {
          font-weight: bold;
          margin-right: 8px;
        }
        
        .room-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          background: #fafafa;
        }
        
        .room-title {
          color: #003562;
          font-size: 20px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #0066cc;
        }
        
        .items-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .selection-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 15px;
        }
        
        .selection-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .upgrade-badge {
          background: #0066cc;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .description {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }
        
        .selection-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          font-size: 14px;
          margin-top: 10px;
        }
        
        .selection-details .label {
          color: #666;
          font-weight: normal;
        }
        
        .notes-for-sub {
          margin-top: 12px;
          padding: 12px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 4px;
        }
        
        .notes-for-sub strong {
          color: #856404;
          display: block;
          margin-bottom: 5px;
        }
        
        .notes-for-sub p {
          color: #856404;
          font-size: 14px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .room-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Trade Packet</h1>
        <div class="trade-name">${tradeName}</div>
        <div class="project-info">
          <div class="info-field">
            <label>Project:</label>
            <span>${projectInfo.name}</span>
          </div>
          <div class="info-field">
            <label>Project #:</label>
            <span>${projectInfo.number}</span>
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

      ${selectionsByRoom.map(generateRoomContent).join('')}
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
