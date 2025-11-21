// County + FIPS lookup from lat/lon using Census Geocoder
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CountyResponse {
  status: "ok" | "error";
  county_name?: string;
  state_name?: string;
  state_abbr?: string;
  state_fips?: string;
  county_fips?: string;
  county_geoid?: string;
  source?: string;
  code?: string;
  message?: string;
}

const STATE_ABBR: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY"
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(promise as any, { signal: controller.signal });
    return response as any;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJson(url: string, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP_${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getCountyFromCoords(lat: number, lon: number): Promise<CountyResponse> {
  const params = new URLSearchParams({
    x: String(lon),
    y: String(lat),
    benchmark: "Public_AR_Current",
    vintage: "Current_Current",
    format: "json",
  });
  
  const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${params.toString()}`;
  console.log(`Querying Census API: ${url}`);
  
  try {
    const data = await fetchJson(url, 10000);
    console.log(`Census response:`, JSON.stringify(data, null, 2));
    
    const county = data?.result?.geographies?.Counties?.[0];
    if (!county) {
      return { 
        status: "error", 
        code: "NO_COUNTY", 
        message: "No county found for these coordinates" 
      };
    }

    const geoid = String(county.GEOID || "");
    const stateFips = String(county.STATE || geoid.slice(0, 2));
    const countyFips = String(county.COUNTY || geoid.slice(2, 5));
    const countyGeoId = stateFips + countyFips;

    const fullName = String(county.NAME || "");
    let countyName = fullName;
    let stateName = "";
    
    if (fullName.includes(",")) {
      const [left, right] = fullName.split(",").map((s: string) => s.trim());
      countyName = left;
      stateName = right;
    }
    
    if (!countyName && county.BASENAME) {
      countyName = String(county.BASENAME);
    }

    const stateAbbr = STATE_ABBR[stateFips] || "";

    return {
      status: "ok",
      county_name: countyName,
      state_name: stateName,
      state_abbr: stateAbbr,
      state_fips: stateFips,
      county_fips: countyFips,
      county_geoid: countyGeoId,
      source: "CensusGeocoder",
    };
  } catch (error: any) {
    console.error(`Census API error:`, error);
    return { 
      status: "error", 
      code: "HTTP_ERROR", 
      message: error?.message || "Failed to lookup county information" 
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ status: "error", code: "METHOD", message: "Use POST method" }), 
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const body = await req.json();
    const { lat, lon } = body;

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          code: "INVALID_COORDS", 
          message: "lat and lon must be numbers" 
        }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Looking up county for coordinates: ${lat}, ${lon}`);
    const result = await getCountyFromCoords(lat, lon);
    
    return new Response(JSON.stringify(result), {
      status: result.status === "ok" ? 200 : 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        code: "BAD_REQUEST", 
        message: "Invalid request body" 
      }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});