export interface EstimateData {
  buildingType: string;
  dimensions: string;
  wallHeight: string;
  estimatedPrice: number;
  description: string;
  scope: string;
  timeline: string;
  notes: string;
  detailedBreakdown?: any;
}

export interface EstimateBreakdown {
  post_sizing?: string;
  truss_pitch?: string;
  truss_spacing?: string;
  exterior_siding?: {
    gauge?: string;
  };
  moisture_barrier?: string;
  concrete_thickness?: string;
  insulation_wall_finish?: string;
}