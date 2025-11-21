import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import jsPDF from 'https://esm.sh/jspdf@2.5.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  projectId: string;
  projectName: string;
  exportType: 'pdf' | 'excel' | 'print';
  items: any[];
  filters: any;
  includePhotos: boolean;
  includeComments: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { 
      projectId, 
      projectName, 
      exportType, 
      items, 
      filters,
      includePhotos,
      includeComments 
    }: ExportRequest = await req.json();

    console.log(`Exporting ${items.length} items as ${exportType} for project ${projectName}`);

    if (exportType === 'pdf') {
      // Create PDF
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text(`${projectName} - Punchlist`, 20, 20);
      
      // Add export date
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);
      
      // Add summary
      doc.text(`Total Items: ${items.length}`, 20, 45);
      doc.text(`Filters Applied: Status: ${filters.statuses.join(', ')}, Priority: ${filters.priorities.join(', ')}`, 20, 55);
      
      let yPosition = 70;
      
      // Add items
      items.forEach((item, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`${index + 1}. ${item.description}`, 20, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.text(`Location: ${item.location}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Priority: ${item.priority} | Status: ${item.status}`, 25, yPosition);
        yPosition += 7;
        if (item.due_date) {
          doc.text(`Due: ${new Date(item.due_date).toLocaleDateString()}`, 25, yPosition);
          yPosition += 7;
        }
        if (item.assigned_to_vendor) {
          doc.text(`Assigned to: ${item.assigned_to_vendor}`, 25, yPosition);
          yPosition += 7;
        }
        
        yPosition += 5; // Space between items
      });
      
      const pdfBuffer = doc.output('arraybuffer');
      
      // Upload to storage
      const fileName = `punchlist_${projectId}_${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      return new Response(JSON.stringify({ 
        fileUrl: publicUrlData.publicUrl,
        fileName: fileName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (exportType === 'excel') {
      // Create Excel-like CSV data
      const csvHeaders = [
        'Item #',
        'Description', 
        'Location',
        'Priority',
        'Status',
        'Due Date',
        'Assigned To',
        'Created Date',
        'Source'
      ];
      
      const csvRows = items.map((item, index) => [
        index + 1,
        `"${item.description.replace(/"/g, '""')}"`,
        `"${item.location.replace(/"/g, '""')}"`,
        item.priority,
        item.status,
        item.due_date ? new Date(item.due_date).toLocaleDateString() : '',
        item.assigned_to_vendor || '',
        new Date(item.created_at).toLocaleDateString(),
        item.source
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      // Upload to storage
      const fileName = `punchlist_${projectId}_${Date.now()}.csv`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, csvContent, {
          contentType: 'text/csv',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      return new Response(JSON.stringify({ 
        fileUrl: publicUrlData.publicUrl,
        fileName: fileName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (exportType === 'print') {
      // Create HTML for printing
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${projectName} - Punchlist</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .item { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .priority-high { border-left: 5px solid #ef4444; }
            .priority-medium { border-left: 5px solid #f59e0b; }
            .priority-low { border-left: 5px solid #10b981; }
            .status { font-weight: bold; }
            .status-completed { color: #10b981; }
            .status-in-progress { color: #f59e0b; }
            .status-open { color: #ef4444; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectName} - Punchlist</h1>
            <p>Generated: ${new Date().toLocaleDateString()}</p>
            <p>Total Items: ${items.length}</p>
          </div>
          
          ${items.map((item, index) => `
            <div class="item priority-${item.priority.toLowerCase()}">
              <h3>${index + 1}. ${item.description}</h3>
              <p><strong>Location:</strong> ${item.location}</p>
              <p><strong>Priority:</strong> ${item.priority} | <strong>Status:</strong> <span class="status status-${item.status.toLowerCase().replace(' ', '-')}">${item.status}</span></p>
              ${item.due_date ? `<p><strong>Due:</strong> ${new Date(item.due_date).toLocaleDateString()}</p>` : ''}
              ${item.assigned_to_vendor ? `<p><strong>Assigned to:</strong> ${item.assigned_to_vendor}</p>` : ''}
              ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      // Upload HTML to storage
      const fileName = `punchlist_print_${projectId}_${Date.now()}.html`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, htmlContent, {
          contentType: 'text/html',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      return new Response(JSON.stringify({ 
        fileUrl: publicUrlData.publicUrl,
        fileName: fileName
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unsupported export type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});