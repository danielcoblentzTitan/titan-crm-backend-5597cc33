import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS for web invocation
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- Types ----
interface ParcelRequest { address: string }

type ParcelResponse =
  | {
      status: "ok";
      parcel_id: string;
      map_number?: string;
      grid_number?: string;
      parcel_number?: string;
      jurisdiction_name?: string;
      viewer_url?: string;
      source: string;
      raw?: { attrs?: any };
    }
  | { status: "error"; code: string; message: string };

// ---- Enhanced Config with improved routing ----
const CONFIG = {
  GEOCODER: {
    url: "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
    benchmark: "Public_AR_Current",
    timeoutMs: 15000,
    retries: 2
  },
  
  // Delaware configuration - county-first routing
  DE: {
    statewide: {
      endpoint: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_StateParcels/FeatureServer/0/query",
      outFields: ["PIN", "COUNTY"],
      fieldMap: {
        parcel_id: ["PIN"],
        jurisdiction_name: ["COUNTY"]
      },
      label: "DE_StateParcels",
      viewer: "https://enterprise.firstmap.delaware.gov/arcgis/rest/services/PlanningCadastre/DE_StateParcels/FeatureServer/0"
    },
    counties: {
      // Kent County - Priority routing for your market
      kent: {
        endpoint: "https://maps.kentcountyde.gov/arcgis/rest/services/Parcels/MapServer/0/query",
        outFields: ["PIN", "ACCTID", "MAP", "GRID", "PARCEL", "SITUS", "COUNTY", "OWNER"],
        fieldMap: {
          parcel_id: ["PIN", "ACCTID"],
          map_number: ["MAP"],
          grid_number: ["GRID"],
          parcel_number: ["PARCEL"],
          jurisdiction_name: ["COUNTY"]
        },
        label: "Kent_County_Parcels",
        viewer: "https://maps.kentcountyde.gov/arcgis/rest/services/Parcels/MapServer/0"
      },
      // Sussex County
      sussex: {
        endpoint: "https://map.sussexcountyde.gov/trdserver/rest/services/Geographic_Information_Office/Parcels_PIN/MapServer/0/query",
        outFields: ["PIN", "PARCELID", "MAP", "GRID", "PARCEL"],
        fieldMap: {
          parcel_id: ["PIN", "PARCELID"],
          map_number: ["MAP"],
          grid_number: ["GRID"],
          parcel_number: ["PARCEL"]
        },
        label: "Sussex_Parcels_PIN",
        viewer: "https://map.sussexcountyde.gov/trdserver/rest/services/Geographic_Information_Office/Parcels_PIN/MapServer/0"
      },
      // New Castle County
      newcastle: {
        endpoint: "https://newcastlegis.nccde.org/arcgis/rest/services/Property/MapServer/0/query",
        outFields: ["PIN", "PARCEL_ID", "ACCTID", "COUNTY"],
        fieldMap: {
          parcel_id: ["PIN", "PARCEL_ID", "ACCTID"],
          jurisdiction_name: ["COUNTY"]
        },
        label: "NewCastle_Property",
        viewer: "https://newcastlegis.nccde.org/arcgis/rest/services/Property/MapServer/0"
      }
    }
  },
  
  // Maryland configuration
  MD: {
    statewide: {
      endpoint: "https://geodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer/0/query",
      outFields: ["ACCTID", "PARCELID", "MAP", "GRID", "PARCEL", "JURSCODE", "CITY", "ZIPCODE", "COUNTY"],
      fieldMap: {
        parcel_id: ["ACCTID", "PARCELID"],
        map_number: ["MAP"],
        grid_number: ["GRID"],
        parcel_number: ["PARCEL"],
        jurisdiction_name: ["JURSCODE", "CITY", "COUNTY"]
      },
      label: "MD_ParcelBoundaries",
      viewer: "https://geodata.md.gov/imap/rest/services/PlanningCadastre/MD_ParcelBoundaries/MapServer/0"
    }
  }
} as const;

// ---- Utilities ----
function normalizeAddressForCache(address: string) {
  return address.trim().replace(/\s+/g, " ").toUpperCase();
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("TIMEOUT")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 10000) {
  const res = (await withTimeout(fetch(url, init), timeoutMs)) as Response;
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json();
}

async function retry<T>(fn: () => Promise<T>, retries = 2, baseDelayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    const delay = baseDelayMs * Math.pow(3, 2 - retries); // 300, 900
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, baseDelayMs);
  }
}

async function geocodeAddress(address: string): Promise<{ lat: number; lon: number }> {
  console.log(`Geocoding address: ${address}`);
  
  // Try multiple address variations for better geocoding results
  const addressVariations = [
    address, // Original address
    address.replace(/\bway\b/gi, 'Way'), // Capitalize "Way"
    address.replace(/\brd\b/gi, 'Road'), // Expand "Rd" to "Road"
    address.replace(/\bdr\b/gi, 'Drive'), // Expand "Dr" to "Drive"
    address.replace(/\bst\b/gi, 'Street'), // Expand "St" to "Street"
    address.replace(/\bave\b/gi, 'Avenue'), // Expand "Ave" to "Avenue"
  ];
  
  let lastError: Error | null = null;
  
  for (const addressVariation of addressVariations) {
    try {
      console.log(`Trying address variation: ${addressVariation}`);
      const params = new URLSearchParams({
        address: addressVariation,
        benchmark: CONFIG.GEOCODER.benchmark,
        format: "json",
      });
      const url = `${CONFIG.GEOCODER.url}?${params.toString()}`;
      const data = await retry(() => fetchJson(url, undefined, CONFIG.GEOCODER.timeoutMs), 2);
      const match = data?.result?.addressMatches?.[0];
      console.log(`Geocoding result for "${addressVariation}":`, { 
        match: match ? `${match.coordinates.y}, ${match.coordinates.x}` : 'No match',
        matchedAddress: match?.matchedAddress 
      });
      
      if (match?.coordinates) {
        return { lat: match.coordinates.y, lon: match.coordinates.x };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`Geocoding failed for "${addressVariation}":`, msg);
      lastError = e instanceof Error ? e : new Error(msg);
    }
  }
  
  throw lastError || new Error("NO_GEOCODE");
}

// Enhanced route decision logic with lat/lon input support
function decideRoute(address: string, lat?: number, lon?: number): "DE" | "MD" {
  // If we have coordinates, use them for more accurate routing
  if (lat !== undefined && lon !== undefined) {
    // Delaware bounds: roughly 38.45-39.84 lat, -75.79--74.98 lon
    // Maryland (eastern shore) bounds: roughly 37.9-39.9 lat, -76.5--75.0 lon
    if (lat >= 38.45 && lat <= 39.84 && lon >= -75.79 && lon <= -74.98) {
      console.log(`Coordinates ${lat}, ${lon} are in Delaware bounds`);
      return "DE";
    }
    if (lat >= 37.9 && lat <= 39.9 && lon >= -76.5 && lon <= -75.0) {
      console.log(`Coordinates ${lat}, ${lon} are in Maryland bounds`);
      return "MD";
    }
  }

  const normalizedAddress = address.toLowerCase();
  
  // MD patterns
  if (normalizedAddress.includes(', md') || normalizedAddress.includes(' md ') || normalizedAddress.includes(' maryland')) {
    return "MD";
  }
  
  // DE patterns (explicit)
  if (normalizedAddress.includes(', de') || normalizedAddress.includes(' de ') || normalizedAddress.includes(' delaware')) {
    return "DE";
  }
  
  // Default to DE for unspecified locations (your primary market)
  return "DE";
}

async function queryArcGISPoint(opts: {
  endpoint: string;
  viewer: string;
  lon: number;
  lat: number;
  outFields: readonly string[];
}) {
  const { endpoint, viewer, lon, lat, outFields } = opts;

  // Helper: WGS84 -> WebMercator
  const toWebMercator = (lon: number, lat: number) => {
    const x = (lon * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    return { x, y: (y * 20037508.34) / 180 };
  };

  // Helper: envelope around a point (meters). Supports 4326 (approx) and 102100 (exact meters)
  const buildEnvelope = (wkid: 4326 | 102100, lon: number, lat: number, meters: number) => {
    if (wkid === 102100) {
      const { x, y } = toWebMercator(lon, lat);
      return { xmin: x - meters, ymin: y - meters, xmax: x + meters, ymax: y + meters };
    }
    const metersPerDegLat = 111320; // approx
    const metersPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);
    const dLat = meters / metersPerDegLat;
    const dLon = meters / metersPerDegLon;
    return { xmin: lon - dLon, ymin: lat - dLat, xmax: lon + dLon, ymax: lat + dLat };
  };

  const srsOptions = [
    { wkid: 4326 as const, coords: { x: lon, y: lat } },
    { wkid: 102100 as const, coords: toWebMercator(lon, lat) },
  ];

  // MUCH more aggressive search - try really wide buffers
  const strategies = [
    { distance: "25", spatialRel: "esriSpatialRelIntersects" },
    { distance: "50", spatialRel: "esriSpatialRelIntersects" },
    { distance: "100", spatialRel: "esriSpatialRelIntersects" },
    { distance: "200", spatialRel: "esriSpatialRelIntersects" },
    { distance: "500", spatialRel: "esriSpatialRelIntersects" }, // Much wider
    { distance: "1000", spatialRel: "esriSpatialRelIntersects" }, // Very wide
    { distance: "50", spatialRel: "esriSpatialRelContains" },
    { distance: "100", spatialRel: "esriSpatialRelWithin" },
    { distance: "200", spatialRel: "esriSpatialRelOverlaps" },
  ];

  console.log(`=== Starting ArcGIS query at ${lat}, ${lon} for endpoint: ${endpoint} ===`);

  // First: point queries with varying buffers and spatial relationships
  for (const srs of srsOptions) {
    for (const strategy of strategies) {
      try {
        const params = new URLSearchParams({
          f: "json",
          geometry: JSON.stringify({ ...srs.coords, spatialReference: { wkid: srs.wkid } }),
          geometryType: "esriGeometryPoint",
          inSR: String(srs.wkid),
          spatialRel: strategy.spatialRel,
          outFields: outFields.join(","),
          returnGeometry: "false",
          where: "1=1",
          resultRecordCount: "10", // Get more results
          distance: strategy.distance,
          units: "esriSRUnit_Meter",
        });
        const url = `${endpoint}?${params.toString()}`;
        console.log(`Point query: SRS ${srs.wkid}, ${strategy.distance}m, ${strategy.spatialRel}`);
        console.log(`Full URL: ${url}`);
        
        const data = await retry(() => fetchJson(url), 2);
        console.log(`Response:`, JSON.stringify(data, null, 2));
        
        const feat = data?.features?.[0];
        if (feat?.attributes) {
          console.log(`✅ POINT SUCCESS: SRS ${srs.wkid}, ${strategy.distance}m, ${strategy.spatialRel}`);
          console.log(`Found parcel:`, JSON.stringify(feat.attributes, null, 2));
          return { attrs: feat.attributes, viewerBase: viewer };
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`❌ Point strategy failed (SRS ${srs.wkid}, ${strategy.distance}m, ${strategy.spatialRel}):`, msg);
      }
    }
  }

  // Second: envelope queries for services that ignore point distance
  const envelopeDistances = [25, 50, 100, 200, 500, 1000, 2000]; // Even wider envelopes
  for (const srs of srsOptions) {
    for (const d of envelopeDistances) {
      try {
        const env = buildEnvelope(srs.wkid, lon, lat, d);
        const params = new URLSearchParams({
          f: "json",
          geometry: JSON.stringify({ ...env, spatialReference: { wkid: srs.wkid } }),
          geometryType: "esriGeometryEnvelope",
          inSR: String(srs.wkid),
          spatialRel: "esriSpatialRelIntersects",
          outFields: outFields.join(","),
          returnGeometry: "false",
          where: "1=1",
          resultRecordCount: "10",
        });
        const url = `${endpoint}?${params.toString()}`;
        console.log(`Envelope query: SRS ${srs.wkid}, ${d}m`);
        console.log(`Full URL: ${url}`);
        
        const data = await retry(() => fetchJson(url), 2);
        console.log(`Response:`, JSON.stringify(data, null, 2));
        
        const feat = data?.features?.[0];
        if (feat?.attributes) {
          console.log(`✅ ENVELOPE SUCCESS: SRS ${srs.wkid}, ${d}m`);
          console.log(`Found parcel:`, JSON.stringify(feat.attributes, null, 2));
          return { attrs: feat.attributes, viewerBase: viewer };
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.log(`❌ Envelope strategy failed (SRS ${srs.wkid}, ${d}m):`, msg);
      }
    }
  }

  // Third: try a broad search without geometry filters
  try {
    console.log(`Attempting broad search without geometry...`);
    const params = new URLSearchParams({
      f: "json",
      where: "1=1",
      outFields: outFields.join(","),
      returnGeometry: "false",
      resultRecordCount: "5",
      orderByFields: outFields[0] || "OBJECTID",
    });
    const url = `${endpoint}?${params.toString()}`;
    console.log(`Broad search URL: ${url}`);
    
    const data = await retry(() => fetchJson(url), 2);
    console.log(`Broad search response:`, JSON.stringify(data, null, 2));
    
    if (data?.features?.length > 0) {
      console.log(`✅ Endpoint is working and has ${data.features.length} parcels, but none at our coordinates`);
    } else {
      console.log(`❌ Endpoint returned no parcels at all`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log(`❌ Broad search failed:`, msg);
  }

  console.log(`=== No parcel found at coordinates ${lat}, ${lon} ===`);
  return { attrs: null, viewerBase: viewer };
}

function pickFirst(attrs: any, keys?: readonly string[]) {
  if (!keys) return undefined;
  for (const k of keys) {
    if (attrs?.[k] !== undefined && attrs[k] !== null && attrs[k] !== "") {
      return String(attrs[k]);
    }
  }
  return undefined;
}

function normalizeAttrs(
  attrs: any,
  fieldMap: Record<string, readonly string[] | undefined>,
  routeLabel: string,
  viewerBase: string,
) {
  if (!attrs) return null;
  const parcel_id = pickFirst(attrs, fieldMap.parcel_id);
  if (!parcel_id) return null;
  const jurisdiction_name = pickFirst(attrs, fieldMap.jurisdiction_name);
  const map_number = pickFirst(attrs, fieldMap.map_number);
  const grid_number = pickFirst(attrs, fieldMap.grid_number);
  const parcel_number = pickFirst(attrs, fieldMap.parcel_number);
  const viewer_url = `${viewerBase}?f=pjson`;
  return {
    status: "ok" as const,
    parcel_id,
    map_number,
    grid_number,
    parcel_number,
    jurisdiction_name,
    viewer_url,
    source: routeLabel,
    raw: { attrs },
  };
}

// In-memory micro cache
const cache = new Map<string, ParcelResponse>();
const MAX_CACHE = 100;

// Enhanced Delaware county detection
function detectDECounty(address: string, lat?: number, lon?: number): "kent" | "sussex" | "newcastle" | null {
  const normalizedAddress = address.toLowerCase();
  
  // Address-based detection (city names)
  const kentCities = ['dover', 'milford', 'harrington', 'frederica', 'magnolia', 'clayton', 'smyrna', 'cheswold'];
  const sussexCities = ['georgetown', 'lewes', 'rehoboth', 'bethany', 'fenwick', 'millsboro', 'seaford', 'laurel', 'delmar'];
  const newcastleCities = ['wilmington', 'newark', 'new castle', 'bear', 'middletown', 'glasgow'];
  
  for (const city of kentCities) {
    if (normalizedAddress.includes(city)) {
      console.log(`Detected Kent County from city: ${city}`);
      return "kent";
    }
  }
  
  for (const city of sussexCities) {
    if (normalizedAddress.includes(city)) {
      console.log(`Detected Sussex County from city: ${city}`);
      return "sussex";
    }
  }
  
  for (const city of newcastleCities) {
    if (normalizedAddress.includes(city)) {
      console.log(`Detected New Castle County from city: ${city}`);
      return "newcastle";
    }
  }
  
  // ZIP code based detection (comprehensive Kent County ZIPs)
  const kentZips = ['19901', '19902', '19903', '19904', '19905', '19906', '19934', '19936', '19939', '19941', '19943', '19947', '19952', '19953', '19954', '19955', '19956', '19962', '19963', '19964', '19966', '19967', '19968', '19970', '19977'];
  const sussexZips = ['19930', '19931', '19933', '19940', '19944', '19945', '19946', '19948', '19950', '19951', '19958', '19960', '19969', '19971', '19973', '19975', '19979', '19980'];
  const newcastleZips = ['19701', '19702', '19703', '19706', '19707', '19708', '19709', '19710', '19711', '19712', '19713', '19714', '19715', '19716', '19717', '19718', '19720', '19721', '19725', '19726', '19728', '19730', '19731', '19732', '19733', '19734', '19735', '19736', '19801', '19802', '19803', '19804', '19805', '19806', '19807', '19808', '19809', '19810', '19850', '19880', '19884', '19885', '19886', '19890', '19891', '19892', '19893', '19894', '19895', '19896', '19897', '19898', '19899'];

  const zipMatches = address.match(/\b(19[0-9]{3})\b/);
  if (zipMatches) {
    const zip = zipMatches[1];
    if (kentZips.includes(zip)) {
      console.log(`Detected Kent County from ZIP: ${zip}`);
      return "kent";
    }
    if (sussexZips.includes(zip)) {
      console.log(`Detected Sussex County from ZIP: ${zip}`);
      return "sussex";
    }
    if (newcastleZips.includes(zip)) {
      console.log(`Detected New Castle County from ZIP: ${zip}`);
      return "newcastle";
    }
  }
  
  // Coordinate-based detection for Delaware
  if (lat !== undefined && lon !== undefined) {
    // Rough county boundaries within Delaware
    if (lat >= 39.0 && lat <= 39.84) return "newcastle"; // Northern DE
    if (lat >= 38.7 && lat < 39.0) return "kent";       // Central DE  
    if (lat >= 38.45 && lat < 38.7) return "sussex";    // Southern DE
  }
  
  return null;
}

// Enhanced getParcel function with flexible input support
async function getParcel(input: string | { address?: string; lat?: number; lon?: number }): Promise<ParcelResponse> {
  let address = "";
  let lat: number | undefined;
  let lon: number | undefined;
  
  // Handle both string address and object input
  if (typeof input === "string") {
    address = input;
  } else {
    address = input.address || "";
    lat = input.lat;
    lon = input.lon;
  }
  
  console.log(`Starting parcel lookup for: ${address}`, lat && lon ? `at coords: ${lat}, ${lon}` : '');
  
  const key = normalizeAddressForCache(address + (lat && lon ? `_${lat}_${lon}` : ''));
  if (cache.has(key)) {
    console.log(`Cache hit for: ${address}`);
    return cache.get(key)!;
  }

  try {
    // Geocode if we don't have coordinates
    if (lat === undefined || lon === undefined) {
      console.log(`Geocoding address: ${address}`);
      const coords = await geocodeAddress(address);
      lat = coords.lat;
      lon = coords.lon;
    }
    console.log(`Using coordinates: ${lat}, ${lon}`);

    const route = decideRoute(address, lat, lon);
    console.log(`Routing to: ${route}`);

    let result: ParcelResponse | null = null;

    if (route === "DE") {
      const county = detectDECounty(address, lat, lon);
      console.log(`Detected DE county: ${county || 'unknown'}`);

      // Try county-specific endpoint first if detected
      if (county === "kent") {
        console.log("Trying Kent County endpoint");
        const config = CONFIG.DE.counties.kent;
        const queryResult = await queryArcGISPoint({
          endpoint: config.endpoint,
          viewer: config.viewer,
          outFields: config.outFields,
          lat,
          lon
        });
        if (queryResult?.attrs) {
          result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
          console.log("Kent County query successful");
        }
      } else if (county === "sussex") {
        console.log("Trying Sussex County endpoint");
        const config = CONFIG.DE.counties.sussex;
        const queryResult = await queryArcGISPoint({
          endpoint: config.endpoint,
          viewer: config.viewer,
          outFields: config.outFields,
          lat,
          lon
        });
        if (queryResult?.attrs) {
          result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
          console.log("Sussex County query successful");
        }
      } else if (county === "newcastle") {
        console.log("Trying New Castle County endpoint");
        const config = CONFIG.DE.counties.newcastle;
        const queryResult = await queryArcGISPoint({
          endpoint: config.endpoint,
          viewer: config.viewer,
          outFields: config.outFields,
          lat,
          lon
        });
        if (queryResult?.attrs) {
          result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
          console.log("New Castle County query successful");
        }
      }

      // Fallback to statewide if county-specific failed or not detected
      if (!result) {
        console.log("Trying DE statewide endpoint as fallback");
        const config = CONFIG.DE.statewide;
        const queryResult = await queryArcGISPoint({
          endpoint: config.endpoint,
          viewer: config.viewer,
          outFields: config.outFields,
          lat,
          lon
        });
        if (queryResult?.attrs) {
          result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
          console.log("DE statewide query successful");
        }
      }
    } else if (route === "MD") {
      console.log("Querying MD statewide endpoint");
      const config = CONFIG.MD.statewide;
      const queryResult = await queryArcGISPoint({
        endpoint: config.endpoint,
        viewer: config.viewer,
        outFields: config.outFields,
        lat,
        lon
      });
      if (queryResult?.attrs) {
        result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
        console.log("MD statewide query successful");
      }
    }

    // Cross-state fallback if nothing found
    if (!result) {
      if (route === "DE") {
        console.log("DE search failed; trying MD statewide as cross-border fallback...");
        const config = CONFIG.MD.statewide;
        try {
          const queryResult = await queryArcGISPoint({
            endpoint: config.endpoint,
            viewer: config.viewer,
            outFields: config.outFields,
            lat,
            lon
          });
          if (queryResult?.attrs) {
            result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
            console.log("MD cross-fallback successful");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log("MD cross-fallback failed:", msg);
        }
      } else if (route === "MD") {
        console.log("MD search failed; trying DE statewide as cross-border fallback...");
        const config = CONFIG.DE.statewide;
        try {
          const queryResult = await queryArcGISPoint({
            endpoint: config.endpoint,
            viewer: config.viewer,
            outFields: config.outFields,
            lat,
            lon
          });
          if (queryResult?.attrs) {
            result = normalizeAttrs(queryResult.attrs, config.fieldMap, config.label, queryResult.viewerBase);
            console.log("DE cross-fallback successful");
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          console.log("DE cross-fallback failed:", msg);
        }
      }
    }

    if (!result) {
      console.log("❌ No parcel found at these coordinates");
      result = {
        status: "error",
        code: "NO_PARCEL",
        message: `No parcel found at coordinates ${lat}, ${lon}`
      };
    } else {
      console.log(`✅ Found parcel: ${result.parcel_id} from ${result.source || 'unknown source'}`);
    }

    cache.set(key, result);
    return result;

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error during parcel lookup: ${message}`);
    const errorResult: ParcelResponse = {
      status: "error",
      code: "GEOCODE_ERROR",
      message: message || "Failed to lookup parcel"
    };
    cache.set(key, errorResult);
    return errorResult;
  }
}

// ---- HTTP handler ----
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ status: "error", code: "METHOD", message: "Use POST" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Validate and extract input from request body
  let input: string | { address?: string; lat?: number; lon?: number };
  try {
    const body = await req.json() as ParcelRequest | { address?: string; lat?: number; lon?: number };
    
    // Support both old format (just address) and new format (address and/or coordinates)
    if ('address' in body && typeof body.address === 'string') {
      if ('lat' in body && 'lon' in body && typeof body.lat === 'number' && typeof body.lon === 'number') {
        // New format with coordinates
        input = {
          address: body.address?.trim(),
          lat: body.lat,
          lon: body.lon
        };
      } else {
        // Old format, just address
        input = body.address?.trim() || "";
      }
    } else {
      throw new Error("Invalid request format");
    }
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return new Response(JSON.stringify({
      status: "error",
      code: "BAD_REQUEST",
      message: "Invalid request body. Provide {address: string} or {address?: string, lat: number, lon: number}"
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Validate we have either address or coordinates
  const hasAddress = typeof input === 'string' ? input.length > 0 : (input.address && input.address.length > 0);
  const hasCoords = typeof input === 'object' && typeof input.lat === 'number' && typeof input.lon === 'number';
  
  if (!hasAddress && !hasCoords) {
    console.log('No address or coordinates provided in request');
    return new Response(JSON.stringify({
      status: "error",
      code: "MISSING_INPUT",
      message: "Either address or coordinates (lat/lon) are required"
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const requestSummary = typeof input === 'string' ? 
    `address: ${input}` : 
    `address: ${input.address || 'none'}, coords: ${input.lat || 'none'}/${input.lon || 'none'}`;
  console.log(`Processing parcel request for: ${requestSummary}`);
  
  try {
    const result = await getParcel(input);
    
    console.log(`Returning result for ${requestSummary}:`, result.status);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(`Unexpected error processing ${requestSummary}:`, error);
    return new Response(JSON.stringify({
      status: "error",
      code: "INTERNAL_ERROR",  
      message: "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
