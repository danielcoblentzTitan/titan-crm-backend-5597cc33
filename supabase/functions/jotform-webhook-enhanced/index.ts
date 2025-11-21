import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JotFormSubmission {
  rawRequest: any;
  formID: string;
  submissionID: string;
  fields: Record<string, any>;
  pretty: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('JotForm webhook received');
    console.log('Request method:', req.method);
    console.log('Content-Type:', req.headers.get('content-type'));
    console.log('User-Agent:', req.headers.get('user-agent'));

    // Parse the webhook payload
    const contentType = req.headers.get('content-type');
    let formData: Record<string, any> = {};

    console.log('Attempting to parse request body...');

    try {
      if (contentType?.includes('application/json')) {
        console.log('Parsing as JSON');
        formData = await req.json();
      } else if (contentType?.includes('multipart/form-data')) {
        console.log('Parsing as multipart form data');
        const formDataObj = await req.formData();
        
        // Look for the rawRequest field which contains the actual form submission
        const rawRequest = formDataObj.get('rawRequest');
        if (rawRequest && typeof rawRequest === 'string') {
          try {
            formData = JSON.parse(rawRequest);
            console.log('Successfully extracted form data from rawRequest');
          } catch (e) {
            console.error('Error parsing rawRequest JSON:', e);
            // Fallback to all form fields
            for (const [key, value] of formDataObj.entries()) {
              formData[key] = value;
            }
          }
        } else {
          // Fallback to all form fields
          for (const [key, value] of formDataObj.entries()) {
            formData[key] = value;
          }
        }
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        console.log('Parsing as URL encoded');
        const text = await req.text();
        const params = new URLSearchParams(text);
        
        for (const [key, value] of params.entries()) {
          if (key === 'rawRequest') {
            try {
              formData = JSON.parse(value);
            } catch (e) {
              console.error('Error parsing rawRequest:', e);
            }
          } else {
            formData[key] = value;
          }
        }
      } else {
        console.log('Unknown content type, trying formData');
        const formDataObj = await req.formData();
        for (const [key, value] of formDataObj.entries()) {
          formData[key] = value;
        }
      }
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      const message = parseError instanceof Error ? parseError.message : String(parseError);
      return new Response(
        JSON.stringify({ error: 'Failed to parse request body', details: message }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('\n========================================');
    console.log('=== JOTFORM WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================\n');
    
    console.log('=== COMPLETE JOTFORM PAYLOAD ===');
    console.log(JSON.stringify(formData, null, 2));
    console.log('=== END PAYLOAD ===\n');
    
    console.log('=== ALL FIELD NAMES (Sorted) ===');
    console.log(Object.keys(formData).sort().join(', '));
    console.log('=== END FIELD NAMES ===\n');
    
    // Log building dimension related fields specifically
    console.log('=== BUILDING DIMENSION FIELDS ===');
    Object.keys(formData).filter(key => 
      key.toLowerCase().includes('width') || 
      key.toLowerCase().includes('length') || 
      key.toLowerCase().includes('height') ||
      key.includes('27') || key.includes('28') || key.includes('38') || key.includes('39') || key.includes('40') ||
      key.includes('41') || key.includes('42') || key.includes('178') || key.includes('179') || key.includes('180')
    ).forEach(key => {
      console.log(`${key}: ${JSON.stringify(formData[key])}`);
    });
    console.log('=== BUILDING DIMENSION FIELDS END ===');
    
    // Also log door related fields
    console.log('=== DOOR FIELDS ===');
    Object.keys(formData).filter(key => 
      key.toLowerCase().includes('door') || 
      key.includes('46') || key.includes('47') || key.includes('48') || key.includes('49') || 
      key.includes('50') || key.includes('51') || key.includes('52') || key.includes('53') ||
      key.includes('54') || key.includes('55') || key.includes('56') || key.includes('57') ||
      key.includes('58') || key.includes('59') || key.includes('60') || key.includes('61') ||
      key.includes('62') || key.includes('63') || key.includes('64') || key.includes('65')
    ).forEach(key => {
      console.log(`${key}: ${JSON.stringify(formData[key])}`);
    });
    console.log('=== DOOR FIELDS END ===');

    // Extract lead information from the submission
    // JotForm sends data in different formats, so we need to be flexible
    const extractFieldValue = (data: any, possibleKeys: string[]): string | undefined => {
      for (const key of possibleKeys) {
        if (data[key] !== undefined) {
          const value = typeof data[key] === 'object' ? data[key].answer || data[key].prettyFormat : data[key];
          return value ? String(value).trim() : undefined;
        }
      }
      return undefined;
    };

    // Check if this is from the specific form (250954035633052)
    const formId = extractFieldValue(formData, ['formID', 'form_id']) || '';
    const isSpecificForm = formId === '250954035633052';

    // Map form fields based on actual JotForm structure from the test
    const firstName = formData.q3_name?.first || extractFieldValue(formData, ['first_name', 'firstName', 'name_first']);
    const lastName = formData.q3_name?.last || extractFieldValue(formData, ['last_name', 'lastName', 'name_last']);
    const email = formData.q4_email || extractFieldValue(formData, ['email', 'emailAddress']);
    const phone = formData.q5_mobileNumber?.full || extractFieldValue(formData, ['phone', 'phoneNumber', 'phone_number']);
    const company = extractFieldValue(formData, ['company', 'companyName', 'business_name']);
    
    // Address fields from q6_projectAddress
    const address = formData.q6_projectAddress?.addr_line1 || extractFieldValue(formData, ['address', 'street_address']);
    const city = formData.q6_projectAddress?.city || extractFieldValue(formData, ['city']);
    const state = formData.q6_projectAddress?.state || extractFieldValue(formData, ['state']);
    const zip = formData.q6_projectAddress?.postal || extractFieldValue(formData, ['zip', 'zipcode', 'postal_code']);
    
    // Building specifications - Enhanced extraction with multiple fallbacks
    const buildingWidth = extractFieldValue(formData, [
      'q27_buildingWidth', 'q27_buildingWidth27', 
      'building_width', 'width', 'buildingWidth'
    ]);
    
    const buildingLength = extractFieldValue(formData, [
      'q28_buildingLength', 'q28_buildingLength28', 'q39_buildingLength', 'q39_buildingLength39',
      'building_length', 'length', 'buildingLength'
    ]);
    
    const wallHeight = extractFieldValue(formData, [
      'q40_wallHeight', 'q40_wallHeight40', 'q41_wallHeight', 'q41_wallHeight41',
      'q178_wallHeight', 'q178_wallHeight178', 'q179_wallHeight', 'q179_wallHeight179',
      'wall_height', 'height', 'wallHeight'
    ]);
    
    const buildingUse = extractFieldValue(formData, [
      'q18_typeA18', 'q18_typeA', 'building_use', 'use', 'buildingUse'
    ]);
    
    const timeline = extractFieldValue(formData, [
      'q9_projectStart', 'q9_projectStart9', 'timeline', 'project_timeline', 'projectTimeline'
    ]);
    
    // Door and window specifications - Enhanced extraction with fallbacks
    const doorCount = extractFieldValue(formData, [
      'q40_howMany', 'q40_howMany40', 'q41_howMany', 'q41_howMany41',
      'q42_howMany', 'q42_howMany42', 'door_count', 'doorCount', 'overheadDoorCount'
    ]);
    
    // Door 1 specifications - try multiple field patterns
    const door1Width = extractFieldValue(formData, [
      'q46_door1', 'q46_door146', 'q47_door1', 'q47_door147',
      'door1_width', 'door1Width'
    ]);
    const door1Height = extractFieldValue(formData, [
      'q49_door149', 'q49_door1', 'q50_door1', 'q50_door150',
      'door1_height', 'door1Height'
    ]);
    
    // Door 2 specifications
    const door2Width = extractFieldValue(formData, [
      'q71_door271', 'q71_door2', 'q72_door2', 'q72_door272',
      'door2_width', 'door2Width'
    ]);
    const door2Height = extractFieldValue(formData, [
      'q73_door273', 'q73_door2', 'q74_door2', 'q74_door274',
      'door2_height', 'door2Height'
    ]);
    
    // Door 3 specifications
    const door3Width = extractFieldValue(formData, [
      'q84_door3', 'q84_door384', 'q85_door3', 'q85_door385',
      'door3_width', 'door3Width'
    ]);
    const door3Height = extractFieldValue(formData, [
      'q86_door386', 'q86_door3', 'q87_door3', 'q87_door387',
      'door3_height', 'door3Height'
    ]);
    
    // Door 4 specifications
    const door4Width = extractFieldValue(formData, [
      'q136_door6', 'q136_door4', 'q136_door6136', 'q138_door4',
      'door4_width', 'door4Width'
    ]);
    const door4Height = extractFieldValue(formData, [
      'q137_door6137', 'q137_door4', 'q137_door6', 'q139_door4',
      'door4_height', 'door4Height'
    ]);
    
    // Windows and entry doors
    const windowCount = extractFieldValue(formData, [
      'q177_howMany177', 'q177_howMany', 'window_count', 'windowCount'
    ]);
    const entryDoorCount = extractFieldValue(formData, [
      'q176_howMany176', 'q176_howMany', 'entry_door_count', 'entryDoorCount'
    ]);
    
    // Additional options and features
    const additionalOptions = Array.isArray(formData.q208_additionalOptions) ? formData.q208_additionalOptions : extractFieldValue(formData, ['q208_additionalOptions']);
    const leanTo = formData.q165_wouldYou || extractFieldValue(formData, ['lean_to']);
    const leanToOptions = Array.isArray(formData.q188_howWould) ? formData.q188_howWould : extractFieldValue(formData, ['q188_howWould']);
    const leanToNotes = formData.q189_tellUs || extractFieldValue(formData, ['q189_tellUs', 'lean_to_notes']);
    const buildingFeatures = Array.isArray(formData.q209_additionalBuilding) ? formData.q209_additionalBuilding : extractFieldValue(formData, ['q209_additionalBuilding']);
    const otherOptionsNotes = formData.q210_otherOptions || extractFieldValue(formData, ['q210_otherOptions', 'other_options']);
    
    const barndominium = formData.q186_isThis || extractFieldValue(formData, ['barndominium']);
    const interiorFinishing = formData.q185_wouldYou185 || extractFieldValue(formData, ['interior_finishing']);
    const interiorFinishingOptions = Array.isArray(formData.q204_interiorFinishing) ? formData.q204_interiorFinishing : extractFieldValue(formData, ['q204_interiorFinishing']);
    
    // Barndominium specific fields
    const hasAcquiredLand = formData.q193_haveYou || extractFieldValue(formData, ['q193_haveYou', 'acquired_land']);
    const hasPlans = formData.q194_doYou || extractFieldValue(formData, ['q194_doYou', 'has_plans']);
    const barndominiumFeatures = Array.isArray(formData.q195_featuresIn) ? formData.q195_featuresIn : extractFieldValue(formData, ['q195_featuresIn']);
    const siteNeeds = Array.isArray(formData.q196_doYou196) ? formData.q196_doYou196 : extractFieldValue(formData, ['q196_doYou196']);
    const barndominiumVision = formData.q197_tellUs197 || extractFieldValue(formData, ['q197_tellUs197', 'barndominium_vision']);
    
    // Communication and wrap-up
    const contactTime = formData.q205_whenIs || extractFieldValue(formData, ['contact_time']);
    const contactMethod = formData.q206_yourPreferred || extractFieldValue(formData, ['contact_method']);
    const additionalProjectNotes = formData.q207_whatElse || extractFieldValue(formData, ['q207_whatElse', 'additional_notes']);
    const additionalInfo = formData.q180_anyInformation || extractFieldValue(formData, ['additional_info', 'additional_information']);
    
    // Door and window additional notes
    const doorsWindowsNotes = formData.q181_anyInformation || extractFieldValue(formData, ['q181_anyInformation', 'doors_windows_notes']);
    
    // Legacy fields for backward compatibility
    const buildingType = extractFieldValue(formData, ['building_type', 'project_type', 'q11_buildingType', 'q11_buildingType11']) || buildingUse;
    const projectDescription = extractFieldValue(formData, ['description', 'project_description', 'notes', 'q12_projectDescription', 'q12_projectDescription12']) || additionalInfo;

    // Handle test submissions with minimal data
    const isTestSubmission = !firstName && !lastName && !email;
    
    if (isTestSubmission) {
      console.log('Test submission detected, returning success without creating lead');
      return new Response(
        JSON.stringify({ success: true, message: 'Test submission received' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate required fields for actual submissions
    if (!firstName || !lastName) {
      console.error('Missing required fields: firstName or lastName');
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: first name and last name are required',
          received_data: formData 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate estimated value using the actual estimate builder instead of crude sq ft calculation
    let estimatedValue = 0;
    let squareFootage = 0;
    let detailedEstimateBreakdown: any = null;
    
    if (buildingWidth && buildingLength && wallHeight) {
      const width = parseFloat(buildingWidth.replace(/[^\d.]/g, ''));
      const length = parseFloat(buildingLength.replace(/[^\d.]/g, ''));
      const height = parseFloat(wallHeight.replace(/[^\d.]/g, ''));
      
      if (!isNaN(width) && !isNaN(length) && !isNaN(height)) {
        squareFootage = width * length;
        
        try {
          // Use the actual estimate calculator from the system
          const { data: pricingItems } = await supabase
            .from('pricing_items')
            .select(`
              *,
              pricing_categories (
                id,
                name,
                description
              )
            `)
            .eq('is_active', true);

          if (pricingItems && pricingItems.length > 0) {
            // Prepare building dimensions for the calculator
            const dimensions = {
              width,
              length,
              wallHeight: height,
              roofPitch: 4, // Default roof pitch
              buildingType: buildingUse || 'Residential Workshop/Hobby Building'
            };

            // Default estimate options for basic calculation
            const options = {
              concrete_thickness: '4"',
              post_sizing: '3"x8"x10\'',
              truss_pitch: '4/12',
              truss_spacing: '4\' O.C.',
              exterior_siding_gauge: '29 Gauge',
              moisture_barrier: 'Reflective/Radiant Barrier',
              insulation_wall_finish: 'R-13 Fiberglass'
            };

            // Calculate using the actual estimate system
            const calculator = new (await import('../../../src/utils/estimateCalculations.js')).EstimateCalculator(pricingItems);
            const estimateItems = calculator.calculateCompleteEstimate(dimensions, options);
            estimatedValue = Math.round(estimateItems.reduce((total: number, item: any) => total + (item.totalPrice ?? 0), 0));
            
            // Store the detailed breakdown for later viewing
            detailedEstimateBreakdown = estimateItems;
            
            console.log(`Calculated estimate using actual pricing system: $${estimatedValue} for ${width}' x ${length}' x ${height}' building`);
          } else {
            // Fallback to basic calculation if pricing data unavailable
            estimatedValue = Math.round(squareFootage * 175);
            console.log(`Using fallback calculation: $${estimatedValue} (${squareFootage} sq ft × $175)`);
          }
        } catch (error) {
          console.error('Error calculating estimate using pricing system:', error);
          // Fallback to basic calculation
          estimatedValue = Math.round(squareFootage * 175);
          console.log(`Using fallback calculation due to error: $${estimatedValue}`);
        }
      }
    }

    // Build comprehensive notes with only provided information
    const notesSections = [];
    
    if (isSpecificForm) {
      notesSections.push('=== BUILDING SPECIFICATIONS (JotForm) ===');
      
      if (buildingWidth && buildingLength) {
        notesSections.push(`Dimensions: ${buildingWidth} x ${buildingLength} (${squareFootage.toLocaleString()} sq ft)`);
      } else if (buildingWidth || buildingLength) {
        notesSections.push(`Dimensions: ${buildingWidth || 'Not specified'} x ${buildingLength || 'Not specified'}`);
      }
      
      if (wallHeight) {
        notesSections.push(`Wall Height: ${wallHeight}`);
      }
      
      if (buildingUse) {
        notesSections.push(`Building Use: ${buildingUse}`);
      }
      
      if (timeline) {
        notesSections.push(`Timeline: ${timeline}`);
      }
      
      if (doorCount || door1Width || door1Height) {
        const doorDetails = [];
        if (doorCount) doorDetails.push(`Count: ${doorCount}`);
        if (door1Width) doorDetails.push(`Door 1 Width: ${door1Width}`);
        if (door1Height) doorDetails.push(`Door 1 Height: ${door1Height}`);
        notesSections.push(`Overhead Doors: ${doorDetails.join(', ')}`);
      }
      
      if (windowCount || entryDoorCount) {
        const details = [];
        if (windowCount) details.push(`Windows: ${windowCount}`);
        if (entryDoorCount) details.push(`Entry Doors: ${entryDoorCount}`);
        notesSections.push(`Additional Features: ${details.join(', ')}`);
      }
      
      if (additionalOptions && (Array.isArray(additionalOptions) ? additionalOptions.length > 0 : additionalOptions)) {
        const optionsText = Array.isArray(additionalOptions) ? additionalOptions.join(', ') : additionalOptions;
        notesSections.push(`Additional Options: ${optionsText}`);
      }
      
      if (leanTo && leanTo !== 'No') {
        notesSections.push(`Lean-To: ${leanTo}`);
        if (leanToOptions && (Array.isArray(leanToOptions) ? leanToOptions.length > 0 : leanToOptions)) {
          const optionsText = Array.isArray(leanToOptions) ? leanToOptions.join(', ') : leanToOptions;
          notesSections.push(`  Finishing: ${optionsText}`);
        }
        if (leanToNotes) {
          notesSections.push(`  Notes: ${leanToNotes}`);
        }
      }
      
      if (buildingFeatures && (Array.isArray(buildingFeatures) ? buildingFeatures.length > 0 : buildingFeatures)) {
        const featuresText = Array.isArray(buildingFeatures) ? buildingFeatures.join(', ') : buildingFeatures;
        notesSections.push(`Building Features: ${featuresText}`);
      }
      
      if (otherOptionsNotes) {
        notesSections.push(`Other Options: ${otherOptionsNotes}`);
      }
      
      if (barndominium && barndominium !== 'No') {
        notesSections.push(`\n=== BARNDOMINIUM DETAILS ===`);
        notesSections.push(`Is Barndominium: ${barndominium}`);
        if (hasAcquiredLand) notesSections.push(`Land Acquired: ${hasAcquiredLand}`);
        if (hasPlans) notesSections.push(`Has Plans: ${hasPlans}`);
        if (barndominiumFeatures && (Array.isArray(barndominiumFeatures) ? barndominiumFeatures.length > 0 : barndominiumFeatures)) {
          const featuresText = Array.isArray(barndominiumFeatures) ? barndominiumFeatures.join(', ') : barndominiumFeatures;
          notesSections.push(`Features: ${featuresText}`);
        }
        if (siteNeeds && (Array.isArray(siteNeeds) ? siteNeeds.length > 0 : siteNeeds)) {
          const needsText = Array.isArray(siteNeeds) ? siteNeeds.join(', ') : siteNeeds;
          notesSections.push(`Site Needs: ${needsText}`);
        }
        if (barndominiumVision) {
          notesSections.push(`Vision: ${barndominiumVision}`);
        }
      }
      
      if (interiorFinishing && interiorFinishing !== 'No') {
        notesSections.push(`Interior Finishing: ${interiorFinishing}`);
        if (interiorFinishingOptions && (Array.isArray(interiorFinishingOptions) ? interiorFinishingOptions.length > 0 : interiorFinishingOptions)) {
          const optionsText = Array.isArray(interiorFinishingOptions) ? interiorFinishingOptions.join(', ') : interiorFinishingOptions;
          notesSections.push(`  Options: ${optionsText}`);
        }
      }
      
      if (doorsWindowsNotes) {
        notesSections.push(`Doors/Windows Notes: ${doorsWindowsNotes}`);
      }
      
      if (contactTime || contactMethod) {
        const contactDetails = [];
        if (contactTime) contactDetails.push(`Best Time: ${contactTime}`);
        if (contactMethod) contactDetails.push(`Preferred Method: ${contactMethod}`);
        notesSections.push(`Contact Preferences: ${contactDetails.join(', ')}`);
      }
      
      if (additionalInfo) {
        notesSections.push(`\n=== ADDITIONAL INFORMATION ===`);
        notesSections.push(additionalInfo);
      }
      
      if (additionalProjectNotes && additionalProjectNotes !== additionalInfo) {
        notesSections.push(`\n=== PROJECT NOTES ===`);
        notesSections.push(additionalProjectNotes);
      }
      
      // Add door specifications to notes for reference
      if (door1Width && door1Height) {
        notesSections.push(`Door 1: ${door1Width}' × ${door1Height}'`);
      }
      if (door2Width && door2Height) {
        notesSections.push(`Door 2: ${door2Width}' × ${door2Height}'`);
      }
      if (door3Width && door3Height) {
        notesSections.push(`Door 3: ${door3Width}' × ${door3Height}'`);
      }
      if (door4Width && door4Height) {
        notesSections.push(`Door 4: ${door4Width}' × ${door4Height}'`);
      }
      
      // Add project description if it exists and is different from additional info
      if (projectDescription && projectDescription !== additionalInfo && projectDescription !== additionalProjectNotes) {
        notesSections.push(`Project Description: ${projectDescription}`);
      }
    } else {
      // For other forms, use legacy format
      if (projectDescription) {
        notesSections.push(`Project Description: ${projectDescription}`);
      }
    }
    
    // ALWAYS ADD DEBUG INFO - COMPREHENSIVE FIELD DEBUGGING
    notesSections.push(`\n=== FIELD CAPTURE DEBUG ===`);
    notesSections.push(`Form ID: ${formId}`);
    notesSections.push(`Submission ID: ${extractFieldValue(formData, ['submissionID', 'submission_id'])}`);
    notesSections.push(`\nDimensions Captured:`);
    notesSections.push(`- Width: ${buildingWidth || 'NOT CAPTURED'}`);
    notesSections.push(`- Length: ${buildingLength || 'NOT CAPTURED'}`);
    notesSections.push(`- Wall Height: ${wallHeight || 'NOT CAPTURED'}`);
    notesSections.push(`- Square Footage: ${squareFootage || 'NOT CALCULATED'}`);
    notesSections.push(`\nDoor Specifications:`);
    notesSections.push(`- Overhead Count: ${doorCount || 'NOT CAPTURED'}`);
    notesSections.push(`- Door 1: ${door1Width || '?'} × ${door1Height || '?'}`);
    notesSections.push(`- Door 2: ${door2Width || '?'} × ${door2Height || '?'}`);
    notesSections.push(`- Door 3: ${door3Width || '?'} × ${door3Height || '?'}`);
    notesSections.push(`- Door 4: ${door4Width || '?'} × ${door4Height || '?'}`);
    notesSections.push(`- Entry Doors: ${entryDoorCount || 'NOT CAPTURED'}`);
    notesSections.push(`\nWindows: ${windowCount || 'NOT CAPTURED'}`);
    notesSections.push(`\nMissing Critical Fields:`);
    const missingFields = [];
    if (!buildingWidth) missingFields.push('Width');
    if (!buildingLength) missingFields.push('Length');
    if (!wallHeight) missingFields.push('Wall Height');
    if (!doorCount && !door1Width) missingFields.push('Door Information');
    notesSections.push(missingFields.length > 0 ? `- ${missingFields.join(', ')}` : 'None - All critical fields captured!');
    notesSections.push(`=== END DEBUG ===`);

    // Structure building specifications as JSON
    const buildingSpecs: Record<string, any> = {};
    
    if (buildingWidth || buildingLength || wallHeight) {
      // Remove foot symbols before storing - display will add them back
      const cleanWidth = buildingWidth ? buildingWidth.toString().replace(/['"]/g, '') : null;
      const cleanLength = buildingLength ? buildingLength.toString().replace(/['"]/g, '') : null;
      const cleanHeight = wallHeight ? wallHeight.toString().replace(/['"]/g, '') : null;
      
      buildingSpecs.dimensions = {
        width: cleanWidth,
        length: cleanLength,
        height: cleanHeight,
        square_footage: squareFootage || null
      };
    }
    
    if (doorCount || door1Width || door1Height || door2Width || door2Height || door3Width || door3Height || door4Width || door4Height || entryDoorCount) {
      buildingSpecs.doors = {
        overhead_count: doorCount || null,
        entry_count: entryDoorCount || null
      };
      
      // Store overhead door specifications for all doors
      const overheadSpecs = [];
      if (door1Width || door1Height) {
        overheadSpecs.push({
          width: door1Width || null,
          height: door1Height || null
        });
      }
      if (door2Width || door2Height) {
        overheadSpecs.push({
          width: door2Width || null,
          height: door2Height || null
        });
      }
      if (door3Width || door3Height) {
        overheadSpecs.push({
          width: door3Width || null,
          height: door3Height || null
        });
      }
      if (door4Width || door4Height) {
        overheadSpecs.push({
          width: door4Width || null,
          height: door4Height || null
        });
      }
      
      if (overheadSpecs.length > 0) {
        buildingSpecs.doors.overhead_specs = overheadSpecs;
      }
    }
    
    if (windowCount) {
      buildingSpecs.windows = { count: windowCount };
    }
    
    if (additionalOptions) {
      buildingSpecs.options = Array.isArray(additionalOptions) ? additionalOptions : [additionalOptions];
    }
    
    if (buildingUse) {
      buildingSpecs.building_use = buildingUse;
    }
    
    if (leanTo && leanTo !== 'No') {
      buildingSpecs.lean_to = leanTo;
    }
    
    if (barndominium && barndominium !== 'No') {
      buildingSpecs.barndominium = barndominium;
    }
    
    if (interiorFinishing && interiorFinishing !== 'No') {
      buildingSpecs.interior_finishing = interiorFinishing;
    }
    
    if (contactTime || contactMethod) {
      buildingSpecs.contact_preferences = {
        best_time: contactTime || null,
        preferred_method: contactMethod || null
      };
    }

    // Map timeline to valid enum values
    let mappedTimeline = null;
    if (timeline) {
      const timelineMap: Record<string, string> = {
        'Within 2 Months': '0-3 Months',
        'Within 6 Months': '3-6 Months', 
        'Within a Year': '6-12 Months',
        'More than a Year': '12+ Months',
        'ASAP': '0-3 Months',
        'Immediately': '0-3 Months'
      };
      mappedTimeline = timelineMap[timeline] || timeline;
    }

    // Build door specifications array
    const doorsArray = [];
    if (door1Width || door1Height) {
      doorsArray.push({ door_number: 1, width: door1Width || null, height: door1Height || null });
    }
    if (door2Width || door2Height) {
      doorsArray.push({ door_number: 2, width: door2Width || null, height: door2Height || null });
    }
    if (door3Width || door3Height) {
      doorsArray.push({ door_number: 3, width: door3Width || null, height: door3Height || null });
    }
    if (door4Width || door4Height) {
      doorsArray.push({ door_number: 4, width: door4Width || null, height: door4Height || null });
    }

    // Create the lead object
    console.log('Creating lead data object...');
    const leadData = {
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      company: company || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      source: isSpecificForm ? 'Leads Without Design - Website Contact' : 'Leads Without Design',
      status: 'New',
      stage: 'New',
      priority: isSpecificForm ? 'High' : 'Medium',
      building_type: buildingType || (buildingUse ? buildingUse : 'Residential'),
      estimated_value: estimatedValue,
      timeline: mappedTimeline,
      deals_active: true,
      stage_entered_date: new Date().toISOString(),
      notes: notesSections.length > 0 ? notesSections.join('\n') : null,
      building_specifications: Object.keys(buildingSpecs).length > 0 ? buildingSpecs : {},
      
      // New comprehensive fields from JotForm
      project_start_timeframe: timeline || null,
      building_width: buildingWidth || null,
      building_length: buildingLength || null,
      wall_height: wallHeight || null,
      overhead_doors_count: doorCount || null,
      doors: doorsArray.length > 0 ? doorsArray : [],
      entry_doors_count: entryDoorCount || null,
      windows_count: windowCount || null,
      doors_windows_notes: doorsWindowsNotes || null,
      wants_lean_to: leanTo || null,
      lean_to_options: Array.isArray(leanToOptions) ? leanToOptions : (leanToOptions ? [leanToOptions] : []),
      lean_to_notes: leanToNotes || null,
      additional_options: Array.isArray(additionalOptions) ? additionalOptions : (additionalOptions ? [additionalOptions] : []),
      building_features: Array.isArray(buildingFeatures) ? buildingFeatures : (buildingFeatures ? [buildingFeatures] : []),
      other_options_notes: otherOptionsNotes || null,
      is_barndominium: barndominium || null,
      wants_interior_finished: interiorFinishing || null,
      interior_finishing_options: Array.isArray(interiorFinishingOptions) ? interiorFinishingOptions : (interiorFinishingOptions ? [interiorFinishingOptions] : []),
      has_acquired_land: hasAcquiredLand || null,
      has_plans: hasPlans || null,
      barndominium_features: Array.isArray(barndominiumFeatures) ? barndominiumFeatures : (barndominiumFeatures ? [barndominiumFeatures] : []),
      site_needs: Array.isArray(siteNeeds) ? siteNeeds : (siteNeeds ? [siteNeeds] : []),
      barndominium_vision: barndominiumVision || null,
      best_contact_time: contactTime || null,
      preferred_communication_method: contactMethod || null,
      additional_project_notes: additionalProjectNotes || null,
      first_contact_date: new Date().toISOString()
    };

    console.log('Creating lead with data:', leadData);

    // Insert the lead into the database
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error('Database error creating lead:', {
        error: leadError,
        code: leadError.code,
        message: leadError.message,
        details: leadError.details,
        hint: leadError.hint,
        leadData: leadData
      });
      throw leadError;
    }

    console.log('Lead created successfully:', lead.id);

    // Create estimate record with detailed breakdown if available
    if (detailedEstimateBreakdown && lead) {
      try {
        const estimateData = {
          lead_id: lead.id,
          lead_name: `${lead.first_name} ${lead.last_name}`,
          building_type: leadData.building_type || 'Residential',
          dimensions: buildingWidth && buildingLength ? `${buildingWidth} x ${buildingLength}` : null,
          wall_height: wallHeight || null,
          estimated_price: estimatedValue,
          description: `Auto-generated estimate from JotForm submission`,
          scope: 'Complete building package with standard options',
          timeline: '90-120 days from permit approval',
          notes: `Automatically generated estimate using system pricing calculator. Building: ${buildingWidth} x ${buildingLength} x ${wallHeight}`,
          detailed_breakdown: detailedEstimateBreakdown,
          status: 'Draft',
          is_written_estimate: false,
          version_name: 'Auto-Generated v1.0'
        };

        const { data: estimate, error: estimateError } = await supabase
          .from('estimates')
          .insert(estimateData)
          .select()
          .single();

        if (estimateError) {
          console.error('Error creating estimate record:', estimateError);
        } else {
          console.log('Estimate record created successfully:', estimate.id);
        }
      } catch (error) {
        console.error('Error creating estimate record:', error);
      }
    }

    // Auto-generate estimate if building specifications exist
    if (lead && Object.keys(buildingSpecs).length > 0 && buildingSpecs.dimensions) {
      try {
        console.log('Generating auto estimate for lead:', lead.id);
        
        // Call auto-estimate edge function
        const { data: estimateResult, error: estimateError } = await supabase.functions.invoke('auto-estimate', {
          body: { leadId: lead.id, lead: lead }
        });

        if (estimateError) {
          console.error('Error generating auto estimate:', estimateError);
        } else {
          console.log('Auto estimate generated successfully:', estimateResult);
        }
      } catch (error) {
        console.error('Error calling auto-estimate function:', error);
      }
    }

    // Create an initial follow-up task
    const taskData = {
      lead_id: lead.id,
      task_type: 'call',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      notes: 'Initial contact - new lead from JotForm',
      is_automated: true
    };

    const { error: taskError } = await supabase
      .from('lead_follow_up_tasks')
      .insert(taskData);

    if (taskError) {
      console.warn('Error creating follow-up task:', taskError);
      // Don't fail the whole process if task creation fails
    }

    console.log('JotForm webhook processed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead created successfully',
        lead_id: lead.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error processing JotForm webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: (error instanceof Error ? error.message : String(error)) 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);