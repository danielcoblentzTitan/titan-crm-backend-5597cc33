-- Update Delaware county fees to match official sources
-- First, update Sussex County with correct tiered fee structure

UPDATE permit_jurisdictions 
SET project_types = '[
  {
    "type": "Pole Building", 
    "base_fee": 7.50, 
    "per_sqft": 0.003,
    "notes": "Unincorporated: $7.50 first $1k + $3/$1k additional. Municipal: $5 first $1k + $2/$1k additional",
    "fee_structure": "tiered",
    "tiers": [
      {"location": "unincorporated", "first_1000": 7.50, "additional_per_1000": 3.00},
      {"location": "municipal", "first_1000": 5.00, "additional_per_1000": 2.00}
    ]
  },
  {
    "type": "Detached Garage", 
    "base_fee": 7.50, 
    "per_sqft": 0.003,
    "notes": "Same tiered structure as pole building",
    "fee_structure": "tiered",
    "tiers": [
      {"location": "unincorporated", "first_1000": 7.50, "additional_per_1000": 3.00},
      {"location": "municipal", "first_1000": 5.00, "additional_per_1000": 2.00}
    ]
  },
  {
    "type": "Barndominium/Residential", 
    "base_fee": 7.50, 
    "per_sqft": 0.003,
    "notes": "Same tiered structure as pole building",
    "fee_structure": "tiered",
    "tiers": [
      {"location": "unincorporated", "first_1000": 7.50, "additional_per_1000": 3.00},
      {"location": "municipal", "first_1000": 5.00, "additional_per_1000": 2.00}
    ]
  },
  {
    "type": "Commercial Office/Warehouse", 
    "base_fee": 7.50, 
    "per_sqft": 0.003,
    "notes": "Same tiered structure as pole building", 
    "fee_structure": "tiered",
    "tiers": [
      {"location": "unincorporated", "first_1000": 7.50, "additional_per_1000": 3.00},
      {"location": "municipal", "first_1000": 5.00, "additional_per_1000": 2.00}
    ]
  }
]'::jsonb
WHERE name = 'Sussex County';

-- Update New Castle County with detailed fee breakdown
UPDATE permit_jurisdictions 
SET project_types = '[
  {
    "type": "Pole Building", 
    "base_fee": 60, 
    "per_sqft": 0.012,
    "notes": "Complex fee structure: Permit Review ($12/$1k up to $1M, $5.25/$1k over, min $60) + Zoning Review (10% of permit, min $21/max $145) + VFA (0.5% first $1M) + C/O ($60)",
    "fee_structure": "multi_component",
    "components": [
      {"name": "Permit Review Fee", "rate_per_1000": 12.00, "over_1m_rate": 5.25, "minimum": 60},
      {"name": "Zoning Review Fee", "percentage": 10, "minimum": 21, "maximum": 145, "applies_to": "permit_review"},
      {"name": "Volunteer Fire Assistance", "percentage": 0.5, "max_valuation": 1000000},
      {"name": "Certificate of Occupancy", "flat_fee": 60}
    ]
  },
  {
    "type": "Detached Garage", 
    "base_fee": 60, 
    "per_sqft": 0.012,
    "notes": "Same multi-component structure",
    "fee_structure": "multi_component",
    "components": [
      {"name": "Permit Review Fee", "rate_per_1000": 12.00, "over_1m_rate": 5.25, "minimum": 60},
      {"name": "Zoning Review Fee", "percentage": 10, "minimum": 21, "maximum": 145, "applies_to": "permit_review"},
      {"name": "Volunteer Fire Assistance", "percentage": 0.5, "max_valuation": 1000000},
      {"name": "Certificate of Occupancy", "flat_fee": 60}
    ]
  },
  {
    "type": "Barndominium/Residential", 
    "base_fee": 60, 
    "per_sqft": 0.012,
    "notes": "Same multi-component structure",
    "fee_structure": "multi_component", 
    "components": [
      {"name": "Permit Review Fee", "rate_per_1000": 12.00, "over_1m_rate": 5.25, "minimum": 60},
      {"name": "Zoning Review Fee", "percentage": 10, "minimum": 21, "maximum": 145, "applies_to": "permit_review"},
      {"name": "Volunteer Fire Assistance", "percentage": 0.5, "max_valuation": 1000000},
      {"name": "Certificate of Occupancy", "flat_fee": 60}
    ]
  },
  {
    "type": "Commercial Office/Warehouse", 
    "base_fee": 60, 
    "per_sqft": 0.012,
    "notes": "Same multi-component structure",
    "fee_structure": "multi_component",
    "components": [
      {"name": "Permit Review Fee", "rate_per_1000": 12.00, "over_1m_rate": 5.25, "minimum": 60},
      {"name": "Zoning Review Fee", "percentage": 10, "minimum": 21, "maximum": 145, "applies_to": "permit_review"},
      {"name": "Volunteer Fire Assistance", "percentage": 0.5, "max_valuation": 1000000},
      {"name": "Certificate of Occupancy", "flat_fee": 60}
    ]
  }
]'::jsonb
WHERE name = 'New Castle County';

-- Update Kent County to include school surcharge details
UPDATE permit_jurisdictions 
SET project_types = '[
  {
    "type": "Pole Building", 
    "base_fee": 50, 
    "per_sqft": 0.010,
    "notes": "Base: $10/$1k up to $1M, then $3/$1k over. Min $50 (farm $30). School surcharge: 1.25% (1.16% + 0.09% POLYTECH)",
    "fee_structure": "tiered_with_surcharge",
    "base_calculation": {"rate_per_1000": 10.00, "over_1m_rate": 3.00, "minimum": 50, "farm_minimum": 30},
    "school_surcharge": {"rate": 1.25, "components": [{"name": "Base", "rate": 1.16}, {"name": "POLYTECH", "rate": 0.09}]}
  },
  {
    "type": "Detached Garage", 
    "base_fee": 50, 
    "per_sqft": 0.010,
    "notes": "Same structure as pole building",
    "fee_structure": "tiered_with_surcharge",
    "base_calculation": {"rate_per_1000": 10.00, "over_1m_rate": 3.00, "minimum": 50},
    "school_surcharge": {"rate": 1.25, "components": [{"name": "Base", "rate": 1.16}, {"name": "POLYTECH", "rate": 0.09}]}
  },
  {
    "type": "Barndominium/Residential", 
    "base_fee": 50, 
    "per_sqft": 0.010,
    "notes": "Same structure as pole building",
    "fee_structure": "tiered_with_surcharge",
    "base_calculation": {"rate_per_1000": 10.00, "over_1m_rate": 3.00, "minimum": 50},
    "school_surcharge": {"rate": 1.25, "components": [{"name": "Base", "rate": 1.16}, {"name": "POLYTECH", "rate": 0.09}]}
  },
  {
    "type": "Commercial Office/Warehouse", 
    "base_fee": 50, 
    "per_sqft": 0.010,
    "notes": "Same structure as pole building",
    "fee_structure": "tiered_with_surcharge", 
    "base_calculation": {"rate_per_1000": 10.00, "over_1m_rate": 3.00, "minimum": 50},
    "school_surcharge": {"rate": 1.25, "components": [{"name": "Base", "rate": 1.16}, {"name": "POLYTECH", "rate": 0.09}]}
  }
]'::jsonb
WHERE name = 'Kent County';