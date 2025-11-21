-- Create FAQ items table for Titan Buildings Construction FAQ
CREATE TABLE public.faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  bot_short_answer TEXT NOT NULL,
  bot_long_answer TEXT,
  category TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  related_ids UUID[] DEFAULT '{}',
  escalation_hint TEXT,
  updated_at DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  feedback_helpful INTEGER DEFAULT 0,
  feedback_not_helpful INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active FAQ items"
  ON public.faq_items
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Builders can manage all FAQ items"
  ON public.faq_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'builder'
  ));

-- Create function to upsert FAQ items for seeding
CREATE OR REPLACE FUNCTION upsert_faq(
  p_question TEXT,
  p_bot_short_answer TEXT,
  p_bot_long_answer TEXT,
  p_category TEXT,
  p_keywords TEXT[],
  p_escalation_hint TEXT DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
  faq_id UUID;
BEGIN
  INSERT INTO public.faq_items (
    question, bot_short_answer, bot_long_answer, category, 
    keywords, escalation_hint, is_active
  ) VALUES (
    p_question, p_bot_short_answer, p_bot_long_answer, p_category,
    p_keywords, p_escalation_hint, p_is_active
  ) RETURNING id INTO faq_id;
  
  RETURN faq_id;
END;
$$ LANGUAGE plpgsql;

-- Seed with construction-specific FAQ data
-- Framing & Structure
SELECT upsert_faq(
  'Some of my posts aren''t installed. Is something missing?',
  'Those are usually entry door posts—installed later with the doors for a perfect fit.',
  'Entry door jamb posts are set when the doors are hung so clearances and weather seals are exact. Seeing gaps at future door locations is expected mid-build.',
  'Framing & Structure', 
  ARRAY['missing posts','entry door posts','framing sequence','door jambs'],
  'If customer is concerned about structural integrity, escalate to PM for site inspection.'
);

SELECT upsert_faq(
  'Why aren''t some bolts fully tightened yet?',
  'We snug-fit first and final-torque after the frame is plumb and square.',
  'Hardware is left hand-tight during alignment. Once trusses/purlins are braced and the frame is true, crews torque to spec.',
  'Framing & Structure', 
  ARRAY['loose bolts','torque','alignment','plumb square'],
  'If customer reports very loose connections, schedule immediate inspection.'
);

SELECT upsert_faq(
  'There''s temporary bracing on the frame—should that be there?',
  'Yes. Temporary bracing stays until the structure is fully tied in and safe to remove.',
  'Bracing keeps the frame stable during construction and is removed once sheathing/steel and permanent bracing are installed.',
  'Framing & Structure', 
  ARRAY['temporary bracing','safety','stability','framing']
);

SELECT upsert_faq(
  'I see a gap between framing and my slab edge—normal?',
  'Small gaps can be normal; we close them with closures/trim and sealant before completion.',
  'Existing slabs can vary; closure strips, trim, and sealants make it weather-tight at finishing.',
  'Framing & Structure', 
  ARRAY['gap at slab','closure strip','trim','sealant']
);

SELECT upsert_faq(
  'Do treated posts go directly into the ground?',
  'Yes—posts specified for ground contact are rated for in-ground use.',
  'We use pressure-treated posts rated for ground contact where specified; alternatives like precast piers/perma-columns are used per plan.',
  'Framing & Structure', 
  ARRAY['treated posts','in-ground','foundation','perma-column']
);

-- Roofing & Exterior
SELECT upsert_faq(
  'Why isn''t my roof ridge vent or snow guards installed yet?',
  'They''re finish items and go in near the end after roof panels are secured and inspected.',
  'Ridge vent and snow retention are installed once roof panels are complete and aligned, often with final trim and gutters.',
  'Roofing & Exterior', 
  ARRAY['ridge vent','snow guards','sequence','roof finish']
);

SELECT upsert_faq(
  'There''s condensation under the metal roof—should I worry?',
  'Early on, light condensation can happen; final insulation/vapor control fixes it.',
  'Temperature swings can cause sweating before insulation and vapor barriers are in place. Once insulated/sealed, it stops.',
  'Roofing & Exterior', 
  ARRAY['condensation','metal roof','vapor barrier','insulation']
);

SELECT upsert_faq(
  'Panels have small scratches—will they be repaired?',
  'Yes. Minor scratches are touched up; significant damage is replaced.',
  'We use manufacturer-approved touch-up paint for small blemishes and replace any damaged panels before completion.',
  'Roofing & Exterior', 
  ARRAY['scratches','touch-up','panel replacement','finish quality']
);

SELECT upsert_faq(
  'Why are there gaps at the base of wall panels?',
  'If concrete isn''t poured yet, a small gap is expected—it''s closed later with trim/seal.',
  'Skirt boards/closures and sealant finish the base once concrete or grade work is complete.',
  'Roofing & Exterior', 
  ARRAY['base gap','skirt board','closure','sealant']
);

-- Doors & Windows
SELECT upsert_faq(
  'Windows aren''t installed yet—why?',
  'We set windows after the wall steel to avoid damage and ensure alignment.',
  'Installing after panels prevents bending frames and ensures exact flashing/trim fit.',
  'Doors & Windows', 
  ARRAY['windows','install sequence','flashing','trim']
);

SELECT upsert_faq(
  'Overhead/roll-up doors are missing—when do they go in?',
  'Near the end, after rough-ins and interior work to prevent damage.',
  'Doors are installed late to avoid traffic damage and coordinate with electrical for openers.',
  'Doors & Windows', 
  ARRAY['overhead door','roll-up','sequence','motor']
);

SELECT upsert_faq(
  'My entry door opening looks unfinished.',
  'Entry doors and their jamb posts are installed together late for proper seals and reveals.',
  'This ensures correct reveals and weather seals once exterior panels are on.',
  'Doors & Windows', 
  ARRAY['entry door','jamb','reveal','weather seal']
);

-- Concrete & Site
SELECT upsert_faq(
  'Why is the frame up before the slab is poured?',
  'It''s a standard sequence for some builds—protects the slab and improves access.',
  'Erecting first can speed install and reduce slab damage; the slab/flatwork follows per schedule.',
  'Concrete & Site', 
  ARRAY['frame before slab','sequence','flatwork','slab protection']
);

SELECT upsert_faq(
  'When can I walk or park on new concrete?',
  'Walk 24–48 hours; vehicles about 7 days; full cure ~28 days.',
  'Cure times vary by mix and weather; your PM will give project-specific guidance.',
  'Concrete & Site', 
  ARRAY['concrete cure','walk on slab','drive on slab','28 days']
);

SELECT upsert_faq(
  'I see hairline cracks in the new slab—is that normal?',
  'Yes—hairline shrinkage cracks are common and don''t affect performance.',
  'Control joints and proper curing minimize cracking; we''ll review anything outside normal.',
  'Concrete & Site', 
  ARRAY['hairline cracks','shrinkage','control joints','concrete']
);

SELECT upsert_faq(
  'Will you handle site grading or gravel?',
  'Basic grading may be included if scoped; otherwise it''s a separate line item.',
  'Check your contract scope; we can quote additional grading, stone base, or drainage as needed.',
  'Concrete & Site', 
  ARRAY['site grading','gravel','scope','drainage']
);

-- Insulation & Interior
SELECT upsert_faq(
  'Only part of the building is insulated right now—why?',
  'Insulation is phased with other trades and may wait on deliveries.',
  'We insulate as areas are ready. Specialty insulation or liner panels can arrive later in the schedule.',
  'Insulation & Interior', 
  ARRAY['insulation schedule','liner panel','deliveries','phasing']
);

SELECT upsert_faq(
  'Is housewrap used behind metal siding?',
  'We use the specified moisture/air barrier for your plan; it may differ from housewrap.',
  'Depending on design, we may use vapor barriers, foam, or specialized membranes appropriate for metal buildings.',
  'Insulation & Interior', 
  ARRAY['housewrap','vapor barrier','air barrier','metal siding']
);

-- MEP
SELECT upsert_faq(
  'When do electrical and plumbing rough-ins happen?',
  'After framing and before interior finishes, then inspections.',
  'Rough-ins follow once framing is stable and openings are set; inspections occur before closing walls.',
  'MEP', 
  ARRAY['electrical rough-in','plumbing rough-in','schedule','inspections']
);

SELECT upsert_faq(
  'My overhead door opener power isn''t there yet.',
  'Opener power and controls are installed during electrical rough-in.',
  'They''re tied in after door installation timing is confirmed.',
  'MEP', 
  ARRAY['door opener','power','electrical','rough-in']
);

-- Scheduling & Weather
SELECT upsert_faq(
  'Bad weather is forecast—will my schedule change?',
  'Possibly. We build in weather days and will update you if dates move.',
  'High winds, heavy rain, or freezing temps can shift certain phases; you''ll get revised targets if needed.',
  'Scheduling & Weather', 
  ARRAY['weather delay','wind','rain','schedule change']
);

SELECT upsert_faq(
  'How will I be updated about schedule changes?',
  'Your project manager will message you with updates and revised targets.',
  'We also log changes in your project portal timeline.',
  'Scheduling & Weather', 
  ARRAY['updates','PM contact','timeline','communication']
);

-- Materials & Deliveries
SELECT upsert_faq(
  'Why are there piles of materials left on site?',
  'They''re staged for upcoming phases; deliveries arrive in bulk for efficiency.',
  'We install materials in sequence. Anything left at the end is either spare or scheduled next.',
  'Materials & Deliveries', 
  ARRAY['material piles','staging','delivery','sequence']
);

SELECT upsert_faq(
  'Some items are missing from the delivery—did we forget them?',
  'Not usually—special-order parts may ship separately and arrive later.',
  'Long-lead or custom items often come in a second delivery; your PM tracks ETAs.',
  'Materials & Deliveries', 
  ARRAY['backorder','ETA','special order','delivery']
);

-- Quality & Finish
SELECT upsert_faq(
  'The paint/finish doesn''t look perfect yet.',
  'Touch-ups and final finishing happen at the end after all trades are complete.',
  'We protect finishes during construction and do final touch-ups, cleaning, and detailing before handover.',
  'Quality & Finish', 
  ARRAY['paint touch-up','finish quality','final cleaning','handover']
);

SELECT upsert_faq(
  'When do you do the final walk-through?',
  'Once all work is complete and before final payment.',
  'We schedule the walk-through when all items are finished, allowing time for any punch-list items.',
  'Quality & Finish', 
  ARRAY['walk-through','punch list','final payment','completion']
);

-- Inspections & Permits
SELECT upsert_faq(
  'When do inspections happen?',
  'At key milestones: foundation, framing, electrical/plumbing rough-in, and final.',
  'We coordinate with local inspectors and notify you of scheduled dates. Some may require your presence.',
  'Inspections & Permits', 
  ARRAY['inspections','milestones','foundation','framing','final']
);

SELECT upsert_faq(
  'What if an inspection fails?',
  'We address the issue and reschedule. Minor items usually get quick approval.',
  'Failed inspections are corrected immediately. We handle re-inspection scheduling and fees.',
  'Inspections & Permits', 
  ARRAY['failed inspection','corrections','re-inspection','fees']
);

-- Create indexes for better search performance
CREATE INDEX idx_faq_items_category ON public.faq_items(category);
CREATE INDEX idx_faq_items_keywords ON public.faq_items USING gin(keywords);
CREATE INDEX idx_faq_items_search ON public.faq_items USING gin(to_tsvector('english', question || ' ' || bot_short_answer || ' ' || COALESCE(bot_long_answer, '')));