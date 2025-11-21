import { supabase } from "@/integrations/supabase/client";

interface RoomData {
  id: string;
  room_name: string;
  room_type: string | null;
  length_ft: number | null;
  width_ft: number | null;
  ceiling_height_ft: number | null;
  ceiling_type: string | null;
  notes_general: string | null;
}

interface SelectionItem {
  id: string;
  label: string;
  description: string | null;
  brand: string | null;
  model_or_sku: string | null;
  color_name: string | null;
  finish: string | null;
  material_type: string | null;
  quantity: number | null;
  unit: string | null;
  is_upgrade: boolean | null;
  notes_for_sub: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  trade: string;
}

export async function generateRoomPDF(projectId: string, roomId: string) {
  // Fetch project info
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("project_name, project_number, client_name")
    .eq("id", projectId)
    .single();

  if (projectError) throw projectError;

  // Fetch room data
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (roomError) throw roomError;

  // Fetch selections for this room
  const { data: selections, error: selectionsError } = await supabase
    .from("selection_items")
    .select("*, category:selection_categories(*)")
    .eq("room_id", roomId)
    .order("category_id");

  if (selectionsError) throw selectionsError;

  // Group selections by category
  const groupedSelections = new Map<string, { category: Category; items: SelectionItem[] }>();

  selections?.forEach((item: any) => {
    const categoryId = item.category_id;
    if (!groupedSelections.has(categoryId)) {
      groupedSelections.set(categoryId, {
        category: item.category,
        items: [],
      });
    }
    groupedSelections.get(categoryId)!.items.push(item);
  });

  // Calculate room area
  const area = room.length_ft && room.width_ft 
    ? (room.length_ft * room.width_ft).toFixed(1) 
    : "N/A";

  // Generate HTML content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${room.room_name} - ${project.project_name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .header {
          border-bottom: 3px solid #000;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 5px;
        }
        
        .header .project-info {
          font-size: 14px;
          color: #666;
        }
        
        .room-specs {
          background: #f5f5f5;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
        
        .room-specs h2 {
          font-size: 18px;
          margin-bottom: 10px;
        }
        
        .specs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .spec-item {
          font-size: 14px;
        }
        
        .spec-label {
          font-weight: bold;
          color: #333;
        }
        
        .spec-value {
          color: #666;
        }
        
        .notes-section {
          background: #fffbea;
          padding: 15px;
          margin-bottom: 20px;
          border-left: 4px solid #f59e0b;
          border-radius: 5px;
        }
        
        .notes-section h3 {
          font-size: 16px;
          margin-bottom: 8px;
          color: #92400e;
        }
        
        .notes-section p {
          font-size: 14px;
          color: #78350f;
          line-height: 1.5;
        }
        
        .category-section {
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        
        .category-header {
          background: #000;
          color: #fff;
          padding: 10px 15px;
          margin-bottom: 10px;
          border-radius: 5px;
        }
        
        .category-header h3 {
          font-size: 16px;
          font-weight: bold;
        }
        
        .selection-item {
          border: 1px solid #ddd;
          padding: 12px;
          margin-bottom: 10px;
          border-radius: 5px;
          background: #fff;
        }
        
        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .selection-title {
          font-size: 15px;
          font-weight: bold;
        }
        
        .upgrade-badge {
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .selection-details {
          font-size: 13px;
          color: #666;
          line-height: 1.6;
        }
        
        .selection-details div {
          margin-bottom: 3px;
        }
        
        .sub-notes {
          background: #fef3c7;
          padding: 8px;
          margin-top: 8px;
          border-radius: 3px;
          font-size: 12px;
          border-left: 3px solid #f59e0b;
        }
        
        .no-selections {
          padding: 40px;
          text-align: center;
          color: #999;
          font-style: italic;
        }
        
        @media print {
          body {
            padding: 10px;
          }
          
          .selection-item {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${room.room_name}</h1>
        <div class="project-info">
          ${project.project_number ? `${project.project_number} • ` : ""}
          ${project.project_name} • ${project.client_name}
        </div>
      </div>
      
      <div class="room-specs">
        <h2>Room Specifications</h2>
        <div class="specs-grid">
          <div class="spec-item">
            <div class="spec-label">Type:</div>
            <div class="spec-value">${room.room_type || "N/A"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Dimensions:</div>
            <div class="spec-value">
              ${room.length_ft && room.width_ft 
                ? `${room.length_ft}' × ${room.width_ft}'` 
                : "N/A"}
            </div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Area:</div>
            <div class="spec-value">${area} sq ft</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Ceiling Height:</div>
            <div class="spec-value">${room.ceiling_height_ft ? `${room.ceiling_height_ft}'` : "N/A"}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Ceiling Type:</div>
            <div class="spec-value">${room.ceiling_type || "N/A"}</div>
          </div>
        </div>
      </div>
      
      ${room.notes_general ? `
        <div class="notes-section">
          <h3>General Notes</h3>
          <p>${room.notes_general}</p>
        </div>
      ` : ""}
      
      ${groupedSelections.size > 0 ? 
        Array.from(groupedSelections.values()).map(({ category, items }) => `
          <div class="category-section">
            <div class="category-header">
              <h3>${category.name} (${category.trade})</h3>
            </div>
            ${items.map(item => `
              <div class="selection-item">
                <div class="selection-header">
                  <div class="selection-title">${item.label}</div>
                  ${item.is_upgrade ? '<span class="upgrade-badge">UPGRADE</span>' : ""}
                </div>
                <div class="selection-details">
                  ${item.description ? `<div><strong>Description:</strong> ${item.description}</div>` : ""}
                  ${item.brand ? `<div><strong>Brand:</strong> ${item.brand}</div>` : ""}
                  ${item.model_or_sku ? `<div><strong>Model/SKU:</strong> ${item.model_or_sku}</div>` : ""}
                  ${item.color_name ? `<div><strong>Color:</strong> ${item.color_name}</div>` : ""}
                  ${item.finish ? `<div><strong>Finish:</strong> ${item.finish}</div>` : ""}
                  ${item.material_type ? `<div><strong>Material:</strong> ${item.material_type}</div>` : ""}
                  ${item.quantity ? `<div><strong>Quantity:</strong> ${item.quantity}${item.unit ? ` ${item.unit}` : ""}</div>` : ""}
                </div>
                ${item.notes_for_sub ? `
                  <div class="sub-notes">
                    <strong>Notes for Subcontractor:</strong> ${item.notes_for_sub}
                  </div>
                ` : ""}
              </div>
            `).join("")}
          </div>
        `).join("")
        : '<div class="no-selections">No selections have been added to this room yet.</div>'
      }
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
