import { Lead } from '../supabaseService';
import { EstimateData } from './types';
import { EstimateFormatters } from './formatters';

export class EstimateTemplates {
  // Generate written estimate HTML content
  static generateEstimateHTML(lead: Lead, estimateData: EstimateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Project Estimate - ${lead.first_name} ${lead.last_name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #003562;
            padding-bottom: 20px;
        }
        .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #003562; 
            margin-bottom: 10px;
        }
        .contact-info { 
            font-size: 14px; 
            color: #666; 
            margin-top: 10px;
        }
        .estimate-title { 
            font-size: 28px; 
            font-weight: bold; 
            color: #003562; 
            text-align: center;
            margin: 30px 0;
        }
        .section { 
            margin-bottom: 30px; 
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .section-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #003562; 
            border-bottom: 2px solid #003562;
            padding-bottom: 5px;
        }
        .customer-info { 
            background-color: white;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
        }
        .price-section { 
            background-color: #003562; 
            color: white; 
            text-align: center; 
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .price { 
            font-size: 36px; 
            font-weight: bold; 
            margin: 10px 0;
        }
        .price-label { 
            font-size: 18px; 
            margin-bottom: 10px;
        }
        .next-steps { 
            background-color: #e8f4f8;
            border-left: 5px solid #003562;
            padding: 20px;
            margin: 20px 0;
        }
        .next-steps ul { 
            margin: 10px 0; 
            padding-left: 20px;
        }
        .next-steps li { 
            margin: 10px 0; 
            line-height: 1.8;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            font-size: 12px; 
            color: #666;
        }
        .project-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin: 20px 0;
        }
        .detail-item { 
            padding: 10px; 
            background-color: white; 
            border-radius: 5px; 
            border: 1px solid #ddd;
        }
        .detail-label { 
            font-weight: bold; 
            color: #003562; 
            margin-bottom: 5px;
        }
        @media print { 
            body { padding: 0; margin: 0; }
            .section { break-inside: avoid; }
        }
        @media (max-width: 600px) {
            .project-details { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TITAN BUILDINGS LLC</div>
        <div class="contact-info">
            <strong>Professional Construction Services</strong><br>
            Phone: (555) 123-4567 | Email: info@titanbuildings.com<br>
            Licensed & Insured | Serving Texas & Surrounding Areas
        </div>
    </div>

    <div class="estimate-title">PROJECT ESTIMATE</div>

    <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="customer-info">
            <strong>${lead.first_name} ${lead.last_name}</strong><br>
            ${lead.email ? `Email: ${lead.email}<br>` : ''}
            ${lead.phone ? `Phone: ${lead.phone}<br>` : ''}
            ${lead.company ? `Company: ${lead.company}<br>` : ''}
            ${lead.address ? `Address: ${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">Project Overview</div>
        <p><strong>Building Type:</strong> ${estimateData.buildingType}</p>
        <p><strong>Description:</strong> ${estimateData.description}</p>
        
        <div class="project-details">
            ${estimateData.dimensions ? `
            <div class="detail-item">
                <div class="detail-label">Dimensions</div>
                <div>${estimateData.dimensions}</div>
            </div>` : ''}
            
            ${estimateData.wallHeight ? `
            <div class="detail-item">
                <div class="detail-label">Wall Height</div>
                <div>${estimateData.wallHeight} feet</div>
            </div>` : ''}
            
            <div class="detail-item">
                <div class="detail-label">Estimated Timeline</div>
                <div>${estimateData.timeline}</div>
            </div>
            
            <div class="detail-item">
                <div class="detail-label">Estimate Date</div>
                <div>${new Date().toLocaleDateString()}</div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Scope of Work</div>
        <p>${estimateData.scope}</p>
        ${estimateData.notes ? `<p><strong>Additional Notes:</strong> ${estimateData.notes}</p>` : ''}
    </div>

    <div class="price-section">
        <div class="price-label">Budgetary Project Estimate</div>
        <div class="price">$${estimateData.estimatedPrice.toLocaleString()}</div>
        <p style="font-size: 14px; margin-top: 15px;">
            *This is a preliminary estimate based on the information provided. 
            Final pricing will be determined after detailed engineering and site evaluation.
        </p>
    </div>

    <div class="next-steps">
        <div class="section-title" style="color: #003562; border-bottom: none; margin-bottom: 15px;">Next Steps</div>
        <ul>
            <li>Review and approve/change the initial estimate</li>
            <li>${EstimateFormatters.getNextStepsForBuildingType(estimateData.buildingType)}</li>
            <li>Arrange a site evaluation (survey, soil test, septic/well feasibility) and develop a full site plan (if required)</li>
            <li>Finalize all finish selections—paint colors, cabinetry styles, flooring, fixtures, railings, etc.—so we can lock in materials and pricing</li>
            <li>Prepare and file permit applications with the county once drawings and site plan are complete</li>
            <li>Execute the construction contract and schedule a start date</li>
        </ul>
    </div>

    <div class="footer">
        <p><strong>This estimate is valid for 30 days from the date above.</strong></p>
        <p>Thank you for considering Titan Buildings LLC for your construction project. We look forward to working with you!</p>
        <p><strong>TITAN BUILDINGS LLC</strong> | Licensed & Insured | Serving Texas & Surrounding Areas</p>
    </div>
</body>
</html>`;
  }

  // Generate quick written estimate HTML content
  static generateQuickEstimateHTML(lead: Lead, estimateData: EstimateData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Project Estimate - ${lead.first_name} ${lead.last_name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #003562;
            padding-bottom: 20px;
        }
        .logo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #003562; 
            margin-bottom: 8px;
        }
        .tagline { 
            font-size: 14px; 
            color: #666; 
            margin-bottom: 20px;
        }
        .estimate-title { 
            font-size: 24px; 
            font-weight: bold; 
            color: #003562; 
            text-align: center;
            margin: 30px 0;
        }
        .customer-section { 
            margin-bottom: 30px; 
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .project-section { 
            margin-bottom: 30px; 
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .price-section { 
            background-color: #003562; 
            color: white; 
            text-align: center; 
            padding: 30px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .price { 
            font-size: 32px; 
            font-weight: bold; 
            margin: 10px 0;
        }
        .price-label { 
            font-size: 16px; 
            margin-bottom: 10px;
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            font-size: 12px; 
            color: #666;
        }
        .section-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 15px; 
            color: #003562; 
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
        }
        .detail-label { 
            font-weight: bold; 
        }
        @media print { 
            body { padding: 0; margin: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">TITAN BUILDINGS LLC</div>
        <div class="tagline">Professional Construction Services</div>
        <div style="font-size: 12px; color: #666;">
            Licensed & Insured | Serving Texas & Surrounding Areas
        </div>
    </div>

    <div class="estimate-title">PROJECT ESTIMATE</div>

    <div class="customer-section">
        <div class="section-title">Customer Information</div>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span>${lead.first_name} ${lead.last_name}</span>
        </div>
        ${lead.email ? `<div class="detail-row"><span class="detail-label">Email:</span><span>${lead.email}</span></div>` : ''}
        ${lead.phone ? `<div class="detail-row"><span class="detail-label">Phone:</span><span>${lead.phone}</span></div>` : ''}
        ${lead.company ? `<div class="detail-row"><span class="detail-label">Company:</span><span>${lead.company}</span></div>` : ''}
    </div>

    <div class="project-section">
        <div class="section-title">Project Overview</div>
        <div class="detail-row">
            <span class="detail-label">Building Type:</span>
            <span>${estimateData.buildingType}</span>
        </div>
        ${estimateData.dimensions ? `<div class="detail-row"><span class="detail-label">Dimensions:</span><span>${estimateData.dimensions}</span></div>` : ''}
        <div class="detail-row">
            <span class="detail-label">Timeline:</span>
            <span>${estimateData.timeline}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Estimate Date:</span>
            <span>${new Date().toLocaleDateString()}</span>
        </div>
        
        
        <div style="margin-top: 20px;">
            <div class="detail-label">Project Description:</div>
            <div style="margin: 15px 0;">
                <p style="margin-bottom: 15px;">Titan Buildings will furnish the materials and perform the labor necessary for the completion of a ${estimateData.buildingType} providing the following.</p>
                
                <div style="margin: 15px 0;">
                    <p style="font-weight: bold; margin-bottom: 10px;">${estimateData.dimensions} ${estimateData.buildingType} - Titan Buildings will construct a building that will meet all local code requirements. The building will be constructed with the following standard features.</p>
                </div>

                ${EstimateFormatters.generateStandardFeatures(estimateData)}

                ${EstimateFormatters.formatDoorDetails(estimateData) ? `
                <div style="margin: 20px 0;">
                    <div style="font-weight: bold; margin-bottom: 10px;">Door Specifications</div>
                    <div style="margin-left: 15px; line-height: 1.6;">
                        ${EstimateFormatters.formatDoorDetails(estimateData)}
                    </div>
                </div>` : ''}

                ${EstimateFormatters.formatAdditionalFeatures(estimateData, estimateData.notes || '') ? `
                <div style="margin-top: 20px;">
                    <div style="font-weight: bold; margin-bottom: 10px;">Additional Features Selected:</div>
                    <div style="margin-left: 15px;">
                        ${EstimateFormatters.formatAdditionalFeatures(estimateData, estimateData.notes || '')}
                    </div>
                </div>` : ''}
            </div>
        </div>
    </div>

    <div class="price-section">
        <div class="price-label">Estimated Project Cost</div>
        <div class="price">$${estimateData.estimatedPrice.toLocaleString()}</div>
        <p style="font-size: 13px; margin-top: 15px; opacity: 0.9;">
            *This is a preliminary estimate. Final pricing subject to detailed engineering and site evaluation.
        </p>
    </div>

    <div style="margin: 30px 0; padding: 20px; background-color: #e8f4f8; border-left: 5px solid #003562; border-radius: 5px;">
        <div class="section-title">Next Steps</div>
        <ol style="margin: 10px 0; padding-left: 20px;">
            <li style="margin: 8px 0;">Review and approve this preliminary estimate</li>
            <li style="margin: 8px 0;">Submit design services deposit to begin detailed planning</li>
            <li style="margin: 8px 0;">Schedule site evaluation and finalize specifications</li>
            <li style="margin: 8px 0;">Receive detailed contract and timeline</li>
        </ol>
    </div>

    <div class="footer">
        <p><strong>This estimate is valid for 30 days from the date above.</strong></p>
        <p>Thank you for considering Titan Buildings LLC for your construction project!</p>
        <p><strong>TITAN BUILDINGS LLC</strong><br>
        Phone: (555) 123-4567 | Email: info@titanbuildings.com<br>
        Licensed & Insured</p>
    </div>
</body>
</html>`;
  }
}