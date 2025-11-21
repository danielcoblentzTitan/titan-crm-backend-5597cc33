import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  project_name: string;
  project_number: string;
  client_name: string;
  client_email: string;
  phone: string;
  site_address: string;
  city: string;
  state: string;
  zip: string;
  house_sq_ft: number;
  garage_sq_ft: number;
  total_square_footage: number;
  bedrooms: number;
  bathrooms: number;
  stories: number;
  wall_height: number;
  build_type: string;
  total_allowance_flooring: number;
  total_allowance_cabinets: number;
  total_allowance_countertops: number;
  total_allowance_plumbing: number;
  total_allowance_electrical: number;
  total_allowance_lighting: number;
  total_allowance_paint: number;
  total_allowance_windows_doors: number;
  total_allowance_misc: number;
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
  is_upgrade?: boolean;
  upgrade_cost?: number;
  total_cost_allowance?: number;
  category: {
    name: string;
    sort_order: number;
  };
}

interface RoomWithSelections {
  room_name: string;
  room_type: string;
  length_ft: number;
  width_ft: number;
  ceiling_height_ft: number;
  sort_order: number;
  selections: SelectionItem[];
}

export const generateFullProjectPDF = async (projectId: string) => {
  // Fetch project data
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError) throw projectError;

  // Fetch all rooms with selections
  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (roomsError) throw roomsError;

  // Fetch all selection items for this project
  const { data: allSelections, error: selectionsError } = await supabase
    .from("selection_items")
    .select(`
      *,
      category:selection_categories(name, sort_order)
    `)
    .eq("project_id", projectId)
    .order("room_id");

  if (selectionsError) throw selectionsError;

  // Group selections by room
  const roomsWithSelections: RoomWithSelections[] = rooms.map((room: any) => ({
    ...room,
    selections: allSelections
      .filter((sel: any) => sel.room_id === room.id)
      .sort((a: any, b: any) => (a.category?.sort_order || 0) - (b.category?.sort_order || 0)),
  }));

  // Calculate allowance summary
  const allowanceSummary = {
    flooring: {
      allowance: project.total_allowance_flooring || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('flooring'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    cabinets: {
      allowance: project.total_allowance_cabinets || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('cabinet'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    countertops: {
      allowance: project.total_allowance_countertops || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('countertop'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    plumbing: {
      allowance: project.total_allowance_plumbing || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('plumbing'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    electrical: {
      allowance: project.total_allowance_electrical || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('electrical'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    lighting: {
      allowance: project.total_allowance_lighting || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('lighting'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    paint: {
      allowance: project.total_allowance_paint || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('paint'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    windowsDoors: {
      allowance: project.total_allowance_windows_doors || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('window') || s.category?.name?.toLowerCase().includes('door'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
    misc: {
      allowance: project.total_allowance_misc || 0,
      selected: allSelections
        .filter((s: any) => s.category?.name?.toLowerCase().includes('misc'))
        .reduce((sum: number, s: any) => sum + (s.total_cost_allowance || 0), 0),
    },
  };

  const htmlContent = generateHTMLContent(project, roomsWithSelections, allowanceSummary);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

const generateHTMLContent = (
  project: Project,
  rooms: RoomWithSelections[],
  allowanceSummary: any
): string => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Project Summary - ${project.project_name}</title>
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
          max-width: 900px;
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
          margin-bottom: 15px;
        }
        
        .project-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 15px;
        }
        
        .info-field {
          font-size: 14px;
        }
        
        .info-field label {
          font-weight: bold;
          margin-right: 8px;
        }
        
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .section-title {
          color: #003562;
          font-size: 20px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 8px;
          margin-bottom: 15px;
        }
        
        .specs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .spec-item {
          padding: 10px;
          background: #f9f9f9;
          border-left: 3px solid #0066cc;
        }
        
        .spec-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .spec-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .allowance-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .allowance-table th,
        .allowance-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        .allowance-table th {
          background: #003562;
          color: white;
          font-weight: bold;
        }
        
        .allowance-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .over-budget {
          color: #dc2626;
          font-weight: bold;
        }
        
        .under-budget {
          color: #16a34a;
          font-weight: bold;
        }
        
        .room-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          background: #fafafa;
        }
        
        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .room-title {
          color: #003562;
          font-size: 18px;
          font-weight: bold;
        }
        
        .room-dimensions {
          font-size: 14px;
          color: #666;
        }
        
        .category-group {
          margin-bottom: 20px;
        }
        
        .category-title {
          font-size: 16px;
          font-weight: bold;
          color: #0066cc;
          margin-bottom: 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        
        .selection-item {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 10px;
        }
        
        .selection-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        .selection-label {
          font-weight: bold;
          font-size: 15px;
        }
        
        .upgrade-badge {
          background: #0066cc;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: bold;
        }
        
        .selection-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 8px;
          font-size: 13px;
          color: #666;
          margin-top: 8px;
        }
        
        .detail-label {
          font-weight: 600;
          color: #555;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .section,
          .room-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Project Summary</h1>
        <div class="project-info">
          <div class="info-field">
            <label>Project:</label>
            <span>${project.project_name}</span>
          </div>
          <div class="info-field">
            <label>Project #:</label>
            <span>${project.project_number || 'N/A'}</span>
          </div>
          <div class="info-field">
            <label>Customer:</label>
            <span>${project.client_name}</span>
          </div>
          <div class="info-field">
            <label>Date:</label>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Project Specifications</h2>
        <div class="specs-grid">
          <div class="spec-item">
            <div class="spec-label">Address</div>
            <div class="spec-value">${project.site_address || 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">City, State ZIP</div>
            <div class="spec-value">${project.city || ''} ${project.state || ''} ${project.zip || ''}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Build Type</div>
            <div class="spec-value">${project.build_type || 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Stories</div>
            <div class="spec-value">${project.stories || 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">House Sq Ft</div>
            <div class="spec-value">${project.house_sq_ft ? project.house_sq_ft.toLocaleString() : 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Garage Sq Ft</div>
            <div class="spec-value">${project.garage_sq_ft ? project.garage_sq_ft.toLocaleString() : 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Bedrooms</div>
            <div class="spec-value">${project.bedrooms || 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Bathrooms</div>
            <div class="spec-value">${project.bathrooms || 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Wall Height</div>
            <div class="spec-value">${project.wall_height ? project.wall_height + ' ft' : 'N/A'}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Contact</div>
            <div class="spec-value">${project.phone || project.client_email || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">Allowance Summary</h2>
        <table class="allowance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Allowance</th>
              <th>Selected</th>
              <th>Over/Under</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(allowanceSummary).map(([key, data]: [string, any]) => {
              const overUnder = data.selected - data.allowance;
              const overUnderClass = overUnder > 0 ? 'over-budget' : overUnder < 0 ? 'under-budget' : '';
              const categoryName = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
              
              return `
                <tr>
                  <td>${categoryName}</td>
                  <td>${formatCurrency(data.allowance)}</td>
                  <td>${formatCurrency(data.selected)}</td>
                  <td class="${overUnderClass}">${overUnder >= 0 ? '+' : ''}${formatCurrency(overUnder)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${rooms.map(room => {
        // Group selections by category
        const selectionsByCategory: { [key: string]: SelectionItem[] } = {};
        room.selections.forEach(sel => {
          const categoryName = sel.category?.name || 'Other';
          if (!selectionsByCategory[categoryName]) {
            selectionsByCategory[categoryName] = [];
          }
          selectionsByCategory[categoryName].push(sel);
        });

        return `
          <div class="room-section">
            <div class="room-header">
              <h3 class="room-title">${room.room_name}</h3>
              ${room.length_ft && room.width_ft ? `
                <div class="room-dimensions">
                  ${room.length_ft}' × ${room.width_ft}' ${room.ceiling_height_ft ? `× ${room.ceiling_height_ft}' ceiling` : ''}
                </div>
              ` : ''}
            </div>

            ${Object.entries(selectionsByCategory).map(([categoryName, items]) => `
              <div class="category-group">
                <h4 class="category-title">${categoryName}</h4>
                ${items.map(item => `
                  <div class="selection-item">
                    <div class="selection-header">
                      <span class="selection-label">${item.label}</span>
                      ${item.is_upgrade ? '<span class="upgrade-badge">UPGRADE</span>' : ''}
                    </div>
                    ${item.description ? `<p style="color: #666; font-size: 13px; margin-bottom: 8px;">${item.description}</p>` : ''}
                    <div class="selection-details">
                      ${item.material_type ? `<div><span class="detail-label">Material:</span> ${item.material_type}</div>` : ''}
                      ${item.brand ? `<div><span class="detail-label">Brand:</span> ${item.brand}</div>` : ''}
                      ${item.model_or_sku ? `<div><span class="detail-label">SKU:</span> ${item.model_or_sku}</div>` : ''}
                      ${item.color_name ? `<div><span class="detail-label">Color:</span> ${item.color_name}</div>` : ''}
                      ${item.finish ? `<div><span class="detail-label">Finish:</span> ${item.finish}</div>` : ''}
                      ${item.quantity ? `<div><span class="detail-label">Qty:</span> ${item.quantity} ${item.unit || ''}</div>` : ''}
                      ${item.total_cost_allowance ? `<div><span class="detail-label">Cost:</span> ${formatCurrency(item.total_cost_allowance)}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            `).join('')}
            
            ${room.selections.length === 0 ? '<p style="color: #999; text-align: center; padding: 20px;">No selections made for this room</p>' : ''}
          </div>
        `;
      }).join('')}
    </body>
    </html>
  `;
};
