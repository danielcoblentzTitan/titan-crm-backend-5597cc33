-- Add Maryland Eastern Shore counties to permits system
-- Using same schema as Delaware with MDOT SHA districts and OSFM regional offices

-- Add Maryland jurisdictions
INSERT INTO permit_jurisdictions (name, contact_phone, contact_email, contact_address, portal_url, project_types, is_active) VALUES
('Queen Anne''s County', '410-758-1255', NULL, NULL, 'https://www.qac.org/1455/PZ-Citizen-Self-Service-Portal', '[
  {"type": "Pole Building", "base_fee": 150, "per_sqft": 0.10},
  {"type": "Detached Garage", "base_fee": 175, "per_sqft": 0.12},
  {"type": "Barndominium/Residential", "base_fee": 250, "per_sqft": 0.15},
  {"type": "Commercial Office/Warehouse", "base_fee": 400, "per_sqft": 0.20}
]'::jsonb, true),

('Talbot County', '410-770-6840', NULL, 'Permits & Inspections, 215 Bay St, Suite 3, Easton, MD 21601', 'https://www.talbotcountymd.gov/permits', '[
  {"type": "Pole Building", "base_fee": 160, "per_sqft": 0.11},
  {"type": "Detached Garage", "base_fee": 180, "per_sqft": 0.13},
  {"type": "Barndominium/Residential", "base_fee": 275, "per_sqft": 0.16},
  {"type": "Commercial Office/Warehouse", "base_fee": 425, "per_sqft": 0.22}
]'::jsonb, true),

('Kent County (MD)', '410-778-4600', 'kentcounty@kentgov.org', '400 High St, Chestertown, MD 21620', 'https://www.kentcounty.com/planning/building-permits', '[
  {"type": "Pole Building", "base_fee": 140, "per_sqft": 0.09},
  {"type": "Detached Garage", "base_fee": 165, "per_sqft": 0.11},
  {"type": "Barndominium/Residential", "base_fee": 240, "per_sqft": 0.14},
  {"type": "Commercial Office/Warehouse", "base_fee": 380, "per_sqft": 0.19}
]'::jsonb, true),

('Cecil County', '410-996-5235', 'DLUDS@cecilcountymd.gov', '200 Chesapeake Blvd, Suite 2200, Elkton, MD 21921', 'https://www.ccgov.org/government/land-use-development-services/permits-and-inspections-division', '[
  {"type": "Pole Building", "base_fee": 170, "per_sqft": 0.12},
  {"type": "Detached Garage", "base_fee": 190, "per_sqft": 0.14},
  {"type": "Barndominium/Residential", "base_fee": 290, "per_sqft": 0.17},
  {"type": "Commercial Office/Warehouse", "base_fee": 450, "per_sqft": 0.23}
]'::jsonb, true),

('Dorchester County', '410-228-3234', NULL, 'Dept. of Planning & Zoning, P.O. Box 107, Cambridge, MD 21613', 'https://evolvepublic.infovisionsoftware.com/Dorchester/', '[
  {"type": "Pole Building", "base_fee": 155, "per_sqft": 0.10},
  {"type": "Detached Garage", "base_fee": 175, "per_sqft": 0.12},
  {"type": "Barndominium/Residential", "base_fee": 260, "per_sqft": 0.15},
  {"type": "Commercial Office/Warehouse", "base_fee": 410, "per_sqft": 0.21}
]'::jsonb, true),

('Caroline County', NULL, NULL, NULL, 'https://caroline.onlama.com/', '[
  {"type": "Pole Building", "base_fee": 145, "per_sqft": 0.09},
  {"type": "Detached Garage", "base_fee": 170, "per_sqft": 0.11},
  {"type": "Barndominium/Residential", "base_fee": 245, "per_sqft": 0.14},
  {"type": "Commercial Office/Warehouse", "base_fee": 385, "per_sqft": 0.19}
]'::jsonb, true),

('Wicomico County', '410-548-4810', 'permits@wicomicocounty.org', 'Government Office Bldg, 125 N. Division St, Room 201, Salisbury, MD 21801', 'https://www.wicomicocounty.org/316/Apply', '[
  {"type": "Pole Building", "base_fee": 165, "per_sqft": 0.11},
  {"type": "Detached Garage", "base_fee": 185, "per_sqft": 0.13},
  {"type": "Barndominium/Residential", "base_fee": 280, "per_sqft": 0.16},
  {"type": "Commercial Office/Warehouse", "base_fee": 440, "per_sqft": 0.22}
]'::jsonb, true),

('Worcester County', '410-632-1200', NULL, 'DRP, One West Market St, Room 1201, Snow Hill, MD 21863', 'https://www.co.worcester.md.us/departments/drp/permit', '[
  {"type": "Pole Building", "base_fee": 150, "per_sqft": 0.10},
  {"type": "Detached Garage", "base_fee": 175, "per_sqft": 0.12},
  {"type": "Barndominium/Residential", "base_fee": 250, "per_sqft": 0.15},
  {"type": "Commercial Office/Warehouse", "base_fee": 400, "per_sqft": 0.20}
]'::jsonb, true),

('Somerset County (MD)', '410-651-1424', NULL, 'Somerset County Office Complex, 11916 Somerset Ave, Room 211, Princess Anne, MD 21853', 'https://www.somersetmd.us/departments/departments_-_n_-_z/planning_and_zoning/building_and_permitting.php', '[
  {"type": "Pole Building", "base_fee": 140, "per_sqft": 0.09},
  {"type": "Detached Garage", "base_fee": 165, "per_sqft": 0.11},
  {"type": "Barndominium/Residential", "base_fee": 240, "per_sqft": 0.14},
  {"type": "Commercial Office/Warehouse", "base_fee": 380, "per_sqft": 0.19}
]'::jsonb, true)
ON CONFLICT (name) DO UPDATE SET
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  contact_address = EXCLUDED.contact_address,
  portal_url = EXCLUDED.portal_url,
  project_types = EXCLUDED.project_types;