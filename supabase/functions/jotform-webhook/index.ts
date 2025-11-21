import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Webhook triggered, method:', req.method)
    console.log('URL:', req.url)
    console.log('Headers:', Object.fromEntries(req.headers.entries()))
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      console.log('Processing POST request')
      
      // Get content type
      const contentType = req.headers.get('content-type') || ''
      console.log('Content-Type:', contentType)
      
      let formData: any = {}
      
      try {
        if (contentType.includes('application/json')) {
          // Handle JSON data
          const jsonData = await req.json()
          console.log('Received JSON data:', JSON.stringify(jsonData, null, 2))
          formData = jsonData
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          // Handle form-encoded data
          const text = await req.text()
          console.log('Received form data as text:', text)
          const urlParams = new URLSearchParams(text)
          formData = Object.fromEntries(urlParams.entries())
        } else {
          // Try form data
          const formDataObj = await req.formData()
          console.log('Received form data')
          formData = Object.fromEntries(formDataObj.entries())
        }
        
        console.log('Parsed form data:', JSON.stringify(formData, null, 2))
        
      } catch (parseError) {
        console.error('Error parsing request data:', parseError)
        return new Response(
          JSON.stringify({ error: 'Invalid request format' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      // Extract form data from JotForm submission - handle both direct keys and nested objects
      const getValue = (key: string) => {
        if (formData[key]) return formData[key]
        // Handle nested object notation like q3_name[first]
        for (const [k, v] of Object.entries(formData)) {
          if (k.includes(key)) return v
        }
        return ''
      }
      
      // Contact Information
      const firstName = getValue('first') || getValue('q3_name[first]') || getValue('first_name') || getValue('firstName') || ''
      const lastName = getValue('last') || getValue('q3_name[last]') || getValue('last_name') || getValue('lastName') || ''
      const email = getValue('email') || getValue('q4_email') || getValue('emailAddress') || ''
      const phone = getValue('mobile') || getValue('phone') || getValue('q5_mobile') || getValue('phoneNumber') || ''
      const company = getValue('company') || getValue('companyName') || ''
      
      // Project Address
      const address = getValue('addr_line1') || getValue('address') || getValue('q6_project[addr_line1]') || getValue('projectAddress') || ''
      const city = getValue('city') || getValue('q6_project[city]') || getValue('projectCity') || ''
      const state = getValue('state') || getValue('q6_project[state]') || getValue('projectState') || ''
      const zip = getValue('postal') || getValue('zip') || getValue('q6_project[postal]') || getValue('projectZip') || ''
      
      // Building Specifications
      const buildingUse = getValue('building') || getValue('q8_building') || getValue('buildingUse') || ''
      const width = getValue('q10_building10') || getValue('width') || getValue('buildingWidth') || ''
      const length = getValue('q11_building11') || getValue('length') || getValue('buildingLength') || ''
      const wallHeight = getValue('wall') || getValue('q12_wall') || getValue('wallHeight') || getValue('height') || ''
      const timeframe = getValue('q7_project7') || getValue('timeframe') || getValue('projectTimeframe') || ''
      
      // Doors and Windows
      const doors = getValue('q13_how') || getValue('doors') || getValue('doorCount') || ''
      const windows = getValue('windows') || getValue('windowCount') || ''
      const garageDoors = getValue('garageDoors') || getValue('garageDoorsCount') || ''
      
      // Additional Features
      const roofing = getValue('roofing') || getValue('roofingType') || ''
      const siding = getValue('siding') || getValue('sidingType') || ''
      const insulation = getValue('insulation') || getValue('insulationType') || ''
      const flooring = getValue('flooring') || getValue('flooringType') || ''
      const electrical = getValue('electrical') || getValue('electricalPackage') || ''
      const plumbing = getValue('plumbing') || getValue('plumbingPackage') || ''
      const hvac = getValue('hvac') || getValue('hvacSystem') || ''
      const concrete = getValue('concrete') || getValue('concreteWork') || ''
      const finishes = getValue('finishes') || getValue('interiorFinishes') || ''
      
      // Additional Options
      const additionalFeatures = getValue('additionalFeatures') || getValue('extras') || ''
      const specialRequests = getValue('specialRequests') || getValue('customRequests') || ''
      const budget = getValue('budget') || getValue('estimatedBudget') || ''
      
      // Build structured building specifications
      const buildingSpecs = {
        buildingUse,
        dimensions: {
          width: width.toString(),
          length: length.toString(),
          wallHeight: wallHeight.toString()
        },
        timeframe,
        doors: {
          entry: doors.toString(),
          garage: garageDoors.toString(),
          windows: windows.toString()
        },
        materials: {
          roofing,
          siding,
          insulation,
          flooring
        },
        systems: {
          electrical,
          plumbing,
          hvac
        },
        concrete,
        finishes,
        additionalFeatures,
        specialRequests,
        estimatedBudget: budget
      }
      
      // Combine building specs into comprehensive notes
      const notes = [
        buildingUse ? `Building Use: ${buildingUse}` : '',
        (width && length) ? `Dimensions: ${width} x ${length}` : '',
        wallHeight ? `Wall Height: ${wallHeight}` : '',
        timeframe ? `Timeframe: ${timeframe}` : '',
        doors ? `Doors: ${doors}` : '',
        windows ? `Windows: ${windows}` : '',
        garageDoors ? `Garage Doors: ${garageDoors}` : '',
        roofing ? `Roofing: ${roofing}` : '',
        siding ? `Siding: ${siding}` : '',
        insulation ? `Insulation: ${insulation}` : '',
        flooring ? `Flooring: ${flooring}` : '',
        electrical ? `Electrical: ${electrical}` : '',
        plumbing ? `Plumbing: ${plumbing}` : '',
        hvac ? `HVAC: ${hvac}` : '',
        concrete ? `Concrete: ${concrete}` : '',
        finishes ? `Interior Finishes: ${finishes}` : '',
        additionalFeatures ? `Additional Features: ${additionalFeatures}` : '',
        specialRequests ? `Special Requests: ${specialRequests}` : '',
        budget ? `Budget: ${budget}` : ''
      ].filter(Boolean).join(', ')

      // Check if this is a test request (empty or minimal data)
      const isTestRequest = !firstName && !lastName && Object.keys(formData).length <= 2
      
      if (isTestRequest) {
        console.log('Test request detected, returning success')
        return new Response(
          JSON.stringify({ success: true, message: 'Webhook endpoint is working' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Validate required fields for actual submissions
      if (!firstName || !lastName) {
        console.error('Missing required fields:', { firstName, lastName })
        return new Response(
          JSON.stringify({ error: 'First name and last name are required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create lead in database
      const { data: lead, error } = await supabase
        .from('leads')
        .insert({
          first_name: firstName.toString(),
          last_name: lastName.toString(),
          email: email.toString() || null,
          phone: phone.toString() || null,
          company: company.toString() || null,
          address: address.toString() || null,
          city: city.toString() || null,
          state: state.toString() || null,
          zip: zip.toString() || null,
          notes: notes.toString() || null,
          building_specifications: buildingSpecs,
          source: 'Website',
          status: 'New',
          priority: 'Medium'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to create lead' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Lead created successfully:', lead)

      return new Response(
        JSON.stringify({ success: true, lead_id: lead.id }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})