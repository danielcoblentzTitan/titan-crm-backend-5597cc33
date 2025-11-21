-- Create permit jurisdictions table
CREATE TABLE IF NOT EXISTS permit_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  portal_url TEXT,
  project_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create permit applications table
CREATE TABLE IF NOT EXISTS permit_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  jurisdiction_id UUID NOT NULL REFERENCES permit_jurisdictions(id),
  project_type TEXT NOT NULL,
  square_footage INTEGER,
  estimated_fee NUMERIC(10,2),
  status TEXT CHECK (status IN ('Draft','Submitted','Under Review','Approved','Rejected')) DEFAULT 'Draft',
  application_date DATE,
  approval_date DATE,
  permit_number TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Create permit tasks table
CREATE TABLE IF NOT EXISTS permit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES permit_applications(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  task_order INTEGER DEFAULT 0,
  assigned_to TEXT,
  status TEXT CHECK (status IN ('Pending','In Progress','Completed','Blocked')) DEFAULT 'Pending',
  due_date DATE,
  completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE permit_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permit_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Builders can manage permit jurisdictions" 
ON permit_jurisdictions FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Builders can manage permit applications" 
ON permit_applications FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

CREATE POLICY "Builders can manage permit tasks" 
ON permit_tasks FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'builder'));

-- Create updated_at triggers
CREATE TRIGGER update_permit_jurisdictions_updated_at
  BEFORE UPDATE ON permit_jurisdictions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permit_applications_updated_at
  BEFORE UPDATE ON permit_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permit_tasks_updated_at
  BEFORE UPDATE ON permit_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed Delaware counties data
INSERT INTO permit_jurisdictions (name, contact_phone, contact_email, contact_address, portal_url, project_types) VALUES
('Kent County, DE', '302-744-2451', 'inspections@kentcountyde.gov', '555 Bay Rd, Dover, DE 19901', 'https://www.mygovernmentonline.org', '[
  {
    "type": "Pole Building / Detached Garage",
    "checklist": [
      "Online application via MyGovernmentOnline",
      "Current plot/site plan",
      "Construction plans",
      "Stamped truss drawings (if applicable)",
      "Septic/well approvals (if required)",
      "DelDOT entrance permit (if driveway is added/modified)"
    ],
    "fees": {
      "base_fee": 50,
      "sqft_rate": 0.35
    }
  },
  {
    "type": "Barndominium / Single-Family",
    "checklist": [
      "Online application via MyGovernmentOnline",
      "Stamped building plans",
      "Energy code compliance documentation",
      "Plot/site plan",
      "Septic/well approvals",
      "DelDOT entrance permit"
    ],
    "fees": {
      "base_fee": 150,
      "sqft_rate": 0.40
    }
  },
  {
    "type": "Commercial (Office/Warehouse)",
    "checklist": [
      "County building permit application",
      "Stamped construction plans",
      "Site plan",
      "State Fire Marshal plan review/permit",
      "DelDOT entrance permit (if needed)"
    ],
    "fees": {
      "base_fee": 250,
      "sqft_rate": 0.50
    }
  }
]'),
('Sussex County, DE', '302-855-7720', 'PandZ@sussexcountyde.gov', '2 The Circle, Georgetown, DE 19947', 'https://sussexcountyde.gov/building-permits', '[
  {
    "type": "Pole Building / Detached Garage",
    "checklist": [
      "County building permit application",
      "Pole Buildings Requirements sheet",
      "Stamped truss drawings",
      "Site plan",
      "Zoning setback verification"
    ],
    "fees": {
      "base_fee": 60,
      "sqft_rate": 0.32
    }
  },
  {
    "type": "Barndominium / Single-Family",
    "checklist": [
      "County building permit application",
      "Stamped plans",
      "Energy code compliance",
      "Septic/well approvals",
      "Sussex Conservation District stormwater plan (if applicable)"
    ],
    "fees": {
      "base_fee": 175,
      "sqft_rate": 0.38
    }
  },
  {
    "type": "Commercial (Office/Warehouse)",
    "checklist": [
      "County building permit application",
      "Stamped construction plans",
      "Site plan",
      "State Fire Marshal review",
      "Sussex Conservation District stormwater plan"
    ],
    "fees": {
      "base_fee": 275,
      "sqft_rate": 0.55
    }
  }
]'),
('New Castle County, DE', '302-395-5400', 'via web form', '87 Reads Way, New Castle, DE 19720', 'https://nccde.org/permits', '[
  {
    "type": "Pole Building / Detached Garage",
    "checklist": [
      "Permit application",
      "Plot plan/lines & grades (if >480 sf)",
      "Stamped truss drawings",
      "DelDOT entrance permit (if needed)"
    ],
    "fees": {
      "base_fee": 65,
      "sqft_rate": 0.36
    }
  },
  {
    "type": "Barndominium / Single-Family",
    "checklist": [
      "Permit application",
      "Stamped building plans",
      "Energy code compliance",
      "Plot plan/lines & grades",
      "Septic/well approvals"
    ],
    "fees": {
      "base_fee": 180,
      "sqft_rate": 0.42
    }
  },
  {
    "type": "Commercial (Office/Warehouse)",
    "checklist": [
      "Permit application",
      "Stamped plans",
      "Site plan",
      "State Fire Marshal plan review",
      "DelDOT entrance permit"
    ],
    "fees": {
      "base_fee": 300,
      "sqft_rate": 0.60
    }
  }
]');