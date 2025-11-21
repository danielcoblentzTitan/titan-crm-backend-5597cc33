
-- 1) Resources and availability
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid references public.team_members(id),
  type text not null check (type in ('crew','sub')),
  name text not null,
  capacity_per_day integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.resources enable row level security;

create policy "Builders can manage resources"
  on public.resources
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

create policy "Team members can view own resource"
  on public.resources
  as permissive
  for select
  to authenticated
  using (exists (
    select 1 from public.team_members tm
    where tm.id = resources.team_member_id and tm.user_id = auth.uid()
  ));

create table if not exists public.resource_blackouts (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blackout_date_range_valid check (end_date >= start_date)
);
alter table public.resource_blackouts enable row level security;

create policy "Builders can manage resource blackouts"
  on public.resource_blackouts
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- 2) Holidays / working calendar
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text,
  is_working_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.holidays enable row level security;

create policy "Builders can manage holidays"
  on public.holidays
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

create policy "Authenticated users can view holidays"
  on public.holidays
  as permissive
  for select
  to authenticated
  using (true);

-- 3) Phase templates
create table if not exists public.phase_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.phase_templates enable row level security;

create policy "Builders can manage phase templates"
  on public.phase_templates
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

create policy "Authenticated can view active templates"
  on public.phase_templates
  as permissive
  for select
  to authenticated
  using (is_active = true);

create table if not exists public.phase_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.phase_templates(id) on delete cascade,
  name text not null,
  default_duration_days integer not null default 1,
  default_color text,
  sort_order integer not null default 0,
  predecessor_item_id uuid references public.phase_template_items(id),
  lag_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.phase_template_items enable row level security;

create policy "Builders can manage template items"
  on public.phase_template_items
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

create index if not exists idx_phase_template_items_template_sort on public.phase_template_items(template_id, sort_order);

-- 4) Project phases (normalized schedule)
create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_item_id uuid references public.phase_template_items(id),
  name text not null,
  status text not null default 'Planned',
  start_date date,
  end_date date,
  duration_days integer not null default 0,
  resource_id uuid references public.resources(id),
  assignee_team_member_id uuid references public.team_members(id),
  publish_to_customer boolean not null default false,
  internal_notes text,
  customer_notes text,
  color text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_phase_duration_nonneg check (duration_days >= 0)
);
alter table public.project_phases enable row level security;

-- RLS: Builders full access
create policy "Builders can manage project phases"
  on public.project_phases
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- RLS: Customers can view published phases for their projects
create policy "Customers can view published phases of their projects"
  on public.project_phases
  as permissive
  for select
  to authenticated
  using (
    publish_to_customer = true
    and exists (
      select 1
      from public.projects p
      join public.customers c on c.id = p.customer_id
      where p.id = project_phases.project_id
        and c.user_id = auth.uid()
    )
  );

-- RLS: Team members can view assigned phases
create policy "Team members can view assigned phases"
  on public.project_phases
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and (
          project_phases.assignee_team_member_id = tm.id
          or exists (
            select 1 from public.resources r
            where r.id = project_phases.resource_id
              and r.team_member_id = tm.id
          )
        )
    )
  );

create index if not exists idx_project_phases_project on public.project_phases(project_id);
create index if not exists idx_project_phases_dates on public.project_phases(project_id, start_date, end_date);

-- 5) Phase dependencies
create table if not exists public.phase_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  predecessor_phase_id uuid not null references public.project_phases(id) on delete cascade,
  successor_phase_id uuid not null references public.project_phases(id) on delete cascade,
  type text not null default 'FS' check (type in ('FS','SS','FF','SF')),
  lag_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phase_dep_predecessor_ne_successor check (predecessor_phase_id <> successor_phase_id)
);
alter table public.phase_dependencies enable row level security;

create unique index if not exists ux_phase_dep_unique on public.phase_dependencies(project_id, predecessor_phase_id, successor_phase_id);

create policy "Builders can manage phase dependencies"
  on public.phase_dependencies
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- 6) Change requests
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid references public.project_phases(id) on delete set null,
  requested_by uuid not null,
  requested_by_type text not null default 'customer' check (requested_by_type in ('customer','crew','sub','builder')),
  title text not null,
  description text,
  delta_days integer not null default 0,
  delta_cost numeric not null default 0,
  status text not null default 'Pending' check (status in ('Pending','Approved','Denied','Cancelled')),
  decided_by uuid,
  decided_at timestamptz,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.change_requests enable row level security;

-- Builders manage all
create policy "Builders can manage change requests"
  on public.change_requests
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- Customers can create/view their requests for own projects
create policy "Customers can insert change requests for their projects"
  on public.change_requests
  as permissive
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects p
      join public.customers c on c.id = p.customer_id
      where p.id = change_requests.project_id
        and c.user_id = auth.uid()
    )
    and requested_by = auth.uid()
  );

create policy "Customers can view their projects' change requests"
  on public.change_requests
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects p
      join public.customers c on c.id = p.customer_id
      where p.id = change_requests.project_id
        and c.user_id = auth.uid()
    )
  );

-- Team members can insert/select requests for assigned phases/projects
create policy "Team members can insert change requests for assigned work"
  on public.change_requests
  as permissive
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and (
          exists (
            select 1 from public.project_phases ph
            where ph.id = change_requests.phase_id
              and (ph.assignee_team_member_id = tm.id
                or exists (select 1 from public.resources r where r.id = ph.resource_id and r.team_member_id = tm.id))
          )
          or exists (
            select 1 from public.projects p
            join public.project_phases ph2 on ph2.project_id = p.id
            where p.id = change_requests.project_id
              and (ph2.assignee_team_member_id = tm.id
                or exists (select 1 from public.resources r2 where r2.id = ph2.resource_id and r2.team_member_id = tm.id))
          )
        )
    )
    and requested_by = auth.uid()
  );

create policy "Team members can view change requests for assigned projects"
  on public.change_requests
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members tm
      where tm.user_id = auth.uid()
        and exists (
          select 1
          from public.project_phases ph
          where ph.project_id = change_requests.project_id
            and (ph.assignee_team_member_id = tm.id
              or exists (select 1 from public.resources r where r.id = ph.resource_id and r.team_member_id = tm.id))
        )
    )
  );

-- 7) Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  to_profile_id uuid not null,
  subject text not null,
  body text,
  link text,
  sent_via text not null default 'in_app' check (sent_via in ('in_app','email','sms')),
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create policy "Users can view their own notifications"
  on public.notifications
  as permissive
  for select
  to authenticated
  using (to_profile_id = auth.uid());

create policy "Users can mark own notifications as read"
  on public.notifications
  as permissive
  for update
  to authenticated
  using (to_profile_id = auth.uid())
  with check (to_profile_id = auth.uid());

create policy "Builders can send notifications"
  on public.notifications
  as permissive
  for insert
  to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- 8) Event logs (audit)
create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before jsonb,
  after jsonb,
  project_id uuid,
  created_at timestamptz not null default now()
);
alter table public.event_logs enable row level security;

create policy "Builders can view event logs"
  on public.event_logs
  as permissive
  for select
  to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'builder'));

-- Allow inserts by any authenticated context (e.g., triggers/functions/app)
create policy "Authenticated can insert event logs"
  on public.event_logs
  as permissive
  for insert
  to authenticated
  with check (true);

-- 9) Triggers for updated_at
create trigger trg_resources_updated_at
  before update on public.resources
  for each row execute function public.update_updated_at_column();

create trigger trg_resource_blackouts_updated_at
  before update on public.resource_blackouts
  for each row execute function public.update_updated_at_column();

create trigger trg_holidays_updated_at
  before update on public.holidays
  for each row execute function public.update_updated_at_column();

create trigger trg_phase_templates_updated_at
  before update on public.phase_templates
  for each row execute function public.update_updated_at_column();

create trigger trg_phase_template_items_updated_at
  before update on public.phase_template_items
  for each row execute function public.update_updated_at_column();

create trigger trg_project_phases_updated_at
  before update on public.project_phases
  for each row execute function public.update_updated_at_column();

create trigger trg_phase_dependencies_updated_at
  before update on public.phase_dependencies
  for each row execute function public.update_updated_at_column();

create trigger trg_change_requests_updated_at
  before update on public.change_requests
  for each row execute function public.update_updated_at_column();

create trigger trg_notifications_updated_at
  before update on public.notifications
  for each row execute function public.update_updated_at_column();

-- 10) Trigger to audit project_phase changes
create or replace function public.log_project_phase_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.event_logs(actor, action, entity_type, entity_id, after, project_id)
      values (auth.uid(), 'INSERT', 'project_phase', new.id, to_jsonb(new), new.project_id);
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.event_logs(actor, action, entity_type, entity_id, before, after, project_id)
      values (auth.uid(), 'UPDATE', 'project_phase', new.id, to_jsonb(old), to_jsonb(new), new.project_id);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.event_logs(actor, action, entity_type, entity_id, before, project_id)
      values (auth.uid(), 'DELETE', 'project_phase', old.id, to_jsonb(old), old.project_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_log_project_phase_changes on public.project_phases;
create trigger trg_log_project_phase_changes
  after insert or update or delete on public.project_phases
  for each row execute function public.log_project_phase_changes();

-- 11) Seed: Barndo Standard (20 phases) template
insert into public.phase_templates (name, description, is_active)
values ('Barndo Standard (20 phases)', 'Default Titan barndo phases with FS dependencies', true)
on conflict do nothing;

-- Capture the template id into a CTE-friendly table to avoid dependency on RETURNING in some environments
-- We try to find it after insert
with t as (
  select id from public.phase_templates where name = 'Barndo Standard (20 phases)' limit 1
)
insert into public.phase_template_items (template_id, name, default_duration_days, default_color, sort_order)
select id, name, dur, color, ord from t, (values
  ('Framing Crew', 5, '#ef4444', 1),
  ('Plumbing Underground', 2, '#3b82f6', 2),
  ('Concrete Crew', 3, '#6b7280', 3),
  ('Interior Framing', 4, '#f59e0b', 4),
  ('Plumbing Rough In', 3, '#3b82f6', 5),
  ('HVAC Rough In', 3, '#10b981', 6),
  ('Electric Rough In', 3, '#fbbf24', 7),
  ('Insulation', 2, '#8b5cf6', 8),
  ('Drywall', 5, '#4b5563', 9),
  ('Paint', 4, '#ec4899', 10),
  ('Flooring', 4, '#92400e', 11),
  ('Doors and Trim', 3, '#059669', 12),
  ('Garage Doors and Gutters', 2, '#dc2626', 13),
  ('Garage Finish', 2, '#7c3aed', 14),
  ('Plumbing Final', 2, '#3b82f6', 15),
  ('HVAC Final', 2, '#10b981', 16),
  ('Electric Final', 2, '#fbbf24', 17),
  ('Kitchen Install', 3, '#f97316', 18),
  ('Interior Finishes', 4, '#06b6d4', 19),
  ('Final', 2, '#65a30d', 20)
) as items(name, dur, color, ord)
on conflict do nothing;

-- Link each item to its predecessor to form linear FS dependencies inside the template
with t as (
  select id as template_id from public.phase_templates where name = 'Barndo Standard (20 phases)' limit 1
),
items as (
  select pti.*, row_number() over(order by sort_order) as rn
  from public.phase_template_items pti
  join t on t.template_id = pti.template_id
)
update public.phase_template_items pti
set predecessor_item_id = p.id
from items i
left join items p on p.rn = i.rn - 1 and p.template_id = i.template_id
where pti.id = i.id;

