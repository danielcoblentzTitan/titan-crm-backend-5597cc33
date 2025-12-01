import { EstimateData } from './types';

export class EstimateFormatters {
  // Helper function to format quantity text
  static formatQuantityText(quantity: number, item: string): string {
    const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const wordNum = quantity <= 10 ? numberWords[quantity] : quantity.toString();
    return `${wordNum} (${quantity})`;
  }

  // Format door details from estimate data
  static formatDoorDetails(estimateData: EstimateData): string {
    const features = [];
    const breakdown = estimateData.detailedBreakdown || {};
    
    // Format garage doors with detailed specs
    if (breakdown.items && breakdown.items.garageDoors) {
      const garageDoors = breakdown.items.garageDoors;
      garageDoors.forEach((door: any) => {
        const qty = door.quantity || 1;
        const qtyText = this.formatQuantityText(qty, 'Garage Door');
        let doorSpec = `${qtyText} ${door.width}'x${door.height}' Insulated Garage Door${qty > 1 ? 's' : ''}`;
        
        const options = [];
        if (door.hasWindows) options.push('One Row of Glass');
        if (door.hasOpener) options.push('Garage Door Opener');
        if (door.hasCarriageHardware) options.push('Carriage Style Hardware');
        
        if (options.length > 0) {
          doorSpec += ` with ${options.join(' and ')}`;
        }
        
        features.push(`✓ ${doorSpec}`);
      });
    }
    
    // Format entry doors with detailed specs
    if (breakdown.items && breakdown.items.entryDoors) {
      const entryDoors = breakdown.items.entryDoors;
      entryDoors.forEach((door: any) => {
        const qty = door.quantity || 1;
        const qtyText = this.formatQuantityText(qty, 'Entry Door');
        
        let doorType = '';
        switch (door.type) {
          case '3x68_solid': doorType = "3'x6'8\" Solid"; break;
          case '3x68_9lite': doorType = "3'x6'8\" 9-Lite"; break;
          case '6x68_solid': doorType = "6'x6'8\" Solid"; break;
          case '6x68_9lite': doorType = "6'x6'8\" 9-Lite"; break;
          case '6_glass_sliding': doorType = "6' Glass Sliding Door"; break;
          case 'custom': doorType = door.customDescription || 'Custom'; break;
          default: doorType = door.type || 'Entry Door';
        }
        
        features.push(`✓ ${qtyText} ${doorType}${qty > 1 ? 's' : ''}`);
      });
    }
    
    return features.length > 0 ? features.join('\n                        ') : '';
  }

  // Format additional features from estimate data
  static formatAdditionalFeatures(estimateData: EstimateData, notes: string): string {
    const features = [];
    const breakdown = estimateData.detailedBreakdown || {};
    
    // Check for other features in the description
    const description = estimateData.description || '';
    
    // Look for insulation package
    if (description.toLowerCase().includes('insulation')) {
      features.push('✓ Insulation Package - R21 walls and R39 blown cellulose ceiling');
      
      // Add wall and ceiling finish under insulation package if selected
      if (breakdown.insulation_wall_finish) {
        const finishType = breakdown.insulation_wall_finish === 'drywall' ? 'drywall' : '29ga liner panel';
        features.push(`✓ Wall & Ceiling Finish - ${finishType}`);
      }
    }
    
    // Look for electrical package
    if (description.toLowerCase().includes('electrical')) {
      features.push('✓ Electrical Package - Complete electrical service');
    }
    
    // Look for concrete floor
    if (description.toLowerCase().includes('concrete') || description.toLowerCase().includes('floor')) {
      features.push('✓ Concrete Floor - 4" 3500 psi fiber mesh reinforced');
    }
    
    // Look for gutters
    if (description.toLowerCase().includes('gutter')) {
      features.push('✓ Gutters & Downspouts - 5" seamless gutters and downspouts');
    }
    
    // Look for site plan
    if (description.toLowerCase().includes('site plan')) {
      features.push('✓ Site Plan - Standard site plan or lines and grade plan');
    }
    
    // Look for windows
    if (description.toLowerCase().includes('window')) {
      features.push('✓ Windows Package - Energy efficient windows');
    }
    
    return features.length > 0 
      ? `<div style="margin: 10px 0;">${features.map(feature => `<div style="margin: 4px 0;">${feature}</div>`).join('')}</div>`
      : '';
  }

  // Get post sizing description
  static getPostSizing(postSizing?: string): string {
    switch (postSizing) {
      case '3ply_2x8': return '3 Ply 2 x 8 GluLams';
      case '4ply_2x6': return '4 Ply 2 x 6 GluLams';
      case '4ply_2x8': return '4 Ply 2 x 8 GluLams';
      default: return '3 Ply 2 x 6 GluLams';
    }
  }

  // Get moisture barrier description
  static getMoistureBarrierDescription(moistureBarrier?: string): string {
    if (moistureBarrier === 'premium') {
      return 'Premium DripX Moisture Barrier Insulation under Roof Steel';
    }
    return 'Standard 5/16" R-foil Reflective Moisture Barrier Insulation under Roof Steel';
  }

  // Get moisture barrier specification (just the bold part)
  static getMoistureBarrierSpecification(moistureBarrier?: string): string {
    if (moistureBarrier === 'premium') {
      return 'Premium DripX';
    }
    return 'Standard 5/16" R-foil Reflective';
  }

  // Generate standard features based on estimate data
  static generateStandardFeatures(estimateData: EstimateData): string {
    const breakdown = estimateData.detailedBreakdown || {};
    
    // Get dynamic values from breakdown
    const postSizing = this.getPostSizing(breakdown.post_sizing);
    const trussPitch = breakdown.truss_pitch || '4/12';
    const trussSpacing = breakdown.truss_spacing || '4';
    const metalGauge = breakdown.exterior_siding?.gauge || '29';
    const moistureBarrier = this.getMoistureBarrierDescription(breakdown.moisture_barrier);
    const concreteThickness = breakdown.concrete_thickness || '4';

    let features = `
                <div style="margin: 20px 0;">
                    <div style="font-weight: bold; margin-bottom: 10px;">Standard Building Features</div>
                    <div style="margin-left: 15px; line-height: 1.6;">
                        <div>✓ Footers - 160 lb. Sakrete @ 3500 p.s.i.</div>
                        <div>✓ Posts - <strong>${postSizing}</strong> with Gable Posts Extended to Top of Truss</div>
                        <div>✓ Skirt Board- Foundation grade treated 2 x 8</div>
                        <div>✓ Carriers - 2 x 12 Yellow Pine #1 on Each Side of Post and/or Engineered Carriers as Specified in Plans</div>
                        <div>✓ Trusses - <strong>${trussPitch}</strong> Pitch Engineered Trusses, <strong>${trussSpacing}'</strong> o/c</div>
                        <div>✓ Side Girts and Roof Purlins - 2 x 4, 2' o/c</div>
                        <div>✓ Roof/Side Steel – <strong>${metalGauge} Gauge</strong> cold rolled metal ribbed panels using Sherwin Williams® coil coatings with galvalume paint protection. (40 Year Warranty)</div>
                        <div>✓ Vented Ridge - Vented Ridge Cap to cover the length of roof.</div>
                        <div>✓ Hurricane Ties- Simpson ties installed on each truss</div>
                        <div>✓ Overhang - 12" Overhang on Eaves & Gables - Enclosed w/ Vinyl Soffit & Covered with Fascia</div>
                        <div>✓ Moisture Barrier - <strong>${this.getMoistureBarrierSpecification(breakdown.moisture_barrier)}</strong> Moisture Barrier Insulation under Roof Steel</div>
                        <div>✓ Clean-Up - Trash and Extra Material Will Be Removed Upon Completion.</div>
                        <div>✓ Drawings – CAD Drawings provided by Titan Buildings</div>
                        <div>✓ Permit – Titan Buildings to file for permit, Cost invoiced Separate to customer.</div>`;

    // Add concrete floor if selected
    if (estimateData.scope?.toLowerCase().includes('concrete') || estimateData.description?.toLowerCase().includes('concrete')) {
      features += `
                        <div>✓ Concrete Floor - ${concreteThickness}" 3500 psi fiber mesh reinforced</div>`;
    }

    features += `
                    </div>
                </div>`;

    return features;
  }

  // Get next steps based on building type
  static getNextStepsForBuildingType(buildingType: string): string {
    switch (buildingType.toLowerCase()) {
      case 'barndominium':
        return `• For Barndominiums: Submit the $3,000 design services deposit. That covers CAD drawings, structural engineering review, and permit ready plans—and it'll be applied to your overall project cost. This is required to continue design services for your Barndominium`;
      case 'residential':
      case 'residential building':
        return `• For Residential Buildings: Submit the $3,000 design services deposit. That covers CAD drawings, structural engineering review, and permit ready plans—and it'll be applied to your overall project cost. This is required to continue design services for your new Residential Building`;
      case 'commercial':
      case 'commercial building':
        return `• For Commercial: Submit the $6,000 design services deposit. That covers Architectural drawings, structural engineering review, and permit ready plans—and it'll be applied to your overall project cost. This is required to continue design services for your Commercial Project`;
      default:
        return `• Submit the $3,000 design services deposit. That covers CAD drawings, structural engineering review, and permit ready plans—and it'll be applied to your overall project cost. This is required to continue design services for your project`;
    }
  }
}