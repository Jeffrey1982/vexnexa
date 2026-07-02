create extension if not exists pgcrypto;

create table if not exists lead_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists lead_workspace_members (
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  name text not null,
  website_url text not null,
  normalized_domain text not null,
  country_code text,
  industry text,
  company_size text,
  source_type text not null default 'csv_import',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_domain_unique_per_workspace unique (workspace_id, normalized_domain)
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  first_name text,
  last_name text,
  email text not null,
  job_title text,
  source_type text not null default 'csv_import',
  source_url text,
  is_personal_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_email_lowercase check (email = lower(email)),
  constraint contacts_unique_email_per_org unique (organization_id, email)
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  status text not null default 'permission_required' check (
    status in ('discovered','researched','qualified','permission_required','opted_in','existing_customer','draft_ready','approved','sent','unsubscribed','do_not_contact')
  ),
  score integer not null default 0 check (score between 0 and 100),
  score_explanation text,
  assigned_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_unique_org_per_workspace unique (workspace_id, organization_id)
);

create table if not exists consent_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  consent_type text not null check (consent_type in ('commercial_outreach','existing_customer_relationship')),
  status text not null check (status in ('active','withdrawn','expired','revoked')),
  lawful_basis text not null,
  source text not null,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint consent_events_evidence_object check (jsonb_typeof(evidence) = 'object')
);

create table if not exists website_scans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_url text not null,
  final_url text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  accessibility_score integer check (accessibility_score between 0 and 100),
  critical_issues integer not null default 0 check (critical_issues >= 0),
  serious_issues integer not null default 0 check (serious_issues >= 0),
  moderate_issues integer not null default 0 check (moderate_issues >= 0),
  minor_issues integer not null default 0 check (minor_issues >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists scan_findings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  website_scan_id uuid not null references website_scans(id) on delete cascade,
  rule_id text not null,
  wcag_criterion text,
  severity text not null check (severity in ('critical','serious','moderate','minor')),
  title text not null,
  description text,
  page_url text not null,
  selector text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists email_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  lead_id uuid references leads(id) on delete cascade,
  subject text not null,
  body_text text not null,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','sent','cancelled')),
  generated_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppression_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  normalized_email text,
  normalized_domain text,
  reason text not null,
  source text not null,
  created_at timestamptz not null default now(),
  constraint suppression_email_or_domain check (normalized_email is not null or normalized_domain is not null),
  constraint suppression_email_lowercase check (normalized_email is null or normalized_email = lower(normalized_email)),
  constraint suppression_unique_email unique (workspace_id, normalized_email),
  constraint suppression_unique_domain unique (workspace_id, normalized_domain)
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_workspace_members_user_idx on lead_workspace_members(user_id);
create index if not exists organizations_workspace_idx on organizations(workspace_id);
create index if not exists contacts_workspace_email_idx on contacts(workspace_id, email);
create index if not exists leads_workspace_status_idx on leads(workspace_id, status);
create index if not exists consent_events_contact_idx on consent_events(workspace_id, contact_id, consent_type, status);
create index if not exists website_scans_org_idx on website_scans(workspace_id, organization_id);
create index if not exists scan_findings_scan_idx on scan_findings(website_scan_id);
create index if not exists email_drafts_lead_idx on email_drafts(workspace_id, lead_id);
create index if not exists audit_events_workspace_created_idx on audit_events(workspace_id, created_at desc);

create or replace function is_lead_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.lead_workspace_members
    where workspace_id = target_workspace_id and user_id = auth.uid()
  );
$$;

create or replace function can_send_commercial_email(
  target_workspace_id uuid,
  target_lead_id uuid,
  target_contact_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  lead_status text;
  contact_email text;
  contact_domain text;
  org_id uuid;
begin
  if auth.uid() is not null and not is_lead_workspace_member(target_workspace_id) then
    return false;
  end if;

  select l.status, c.email, split_part(c.email, '@', 2), l.organization_id
    into lead_status, contact_email, contact_domain, org_id
  from public.leads l
  join public.contacts c on c.id = target_contact_id and c.workspace_id = l.workspace_id
  where l.id = target_lead_id
    and l.workspace_id = target_workspace_id
    and c.organization_id = l.organization_id;

  if lead_status is null or lead_status in ('unsubscribed','do_not_contact') then
    return false;
  end if;

  if exists (
    select 1 from public.suppression_entries s
    where s.workspace_id = target_workspace_id
      and (s.normalized_email = contact_email or s.normalized_domain = contact_domain)
  ) then
    return false;
  end if;

  if exists (
    select 1 from public.consent_events ce
    where ce.workspace_id = target_workspace_id
      and ce.organization_id = org_id
      and (ce.contact_id = target_contact_id or ce.contact_id is null)
      and ce.consent_type in ('commercial_outreach','existing_customer_relationship')
      and ce.status in ('withdrawn','revoked')
  ) then
    return false;
  end if;

  return exists (
    select 1 from public.consent_events ce
    where ce.workspace_id = target_workspace_id
      and ce.organization_id = org_id
      and (ce.contact_id = target_contact_id or ce.contact_id is null)
      and ce.status = 'active'
      and ce.consent_type in ('commercial_outreach','existing_customer_relationship')
      and ce.evidence <> '{}'::jsonb
      and (ce.expires_at is null or ce.expires_at > now())
  );
end;
$$;

alter table lead_workspaces enable row level security;
alter table lead_workspace_members enable row level security;
alter table organizations enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table consent_events enable row level security;
alter table website_scans enable row level security;
alter table scan_findings enable row level security;
alter table email_drafts enable row level security;
alter table suppression_entries enable row level security;
alter table audit_events enable row level security;

create policy "lead workspaces visible to members" on lead_workspaces for select using (is_lead_workspace_member(id));
create policy "lead workspace owners can update" on lead_workspaces for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "workspace memberships visible to members" on lead_workspace_members for select using (is_lead_workspace_member(workspace_id));
create policy "organizations scoped to workspace members" on organizations for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "contacts scoped to workspace members" on contacts for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "leads scoped to workspace members" on leads for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "consent events scoped to workspace members" on consent_events for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "website scans scoped to workspace members" on website_scans for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "scan findings scoped to workspace members" on scan_findings for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "email drafts scoped to workspace members" on email_drafts for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "suppressions scoped to workspace members" on suppression_entries for all using (is_lead_workspace_member(workspace_id)) with check (is_lead_workspace_member(workspace_id));
create policy "audit events visible to workspace members" on audit_events for select using (is_lead_workspace_member(workspace_id));

revoke all on function is_lead_workspace_member(uuid) from public, anon;
revoke all on function can_send_commercial_email(uuid, uuid, uuid) from public, anon;
grant execute on function is_lead_workspace_member(uuid) to authenticated, service_role;
grant execute on function can_send_commercial_email(uuid, uuid, uuid) to authenticated, service_role;

do $$
declare
  legacy_table text;
begin
  foreach legacy_table in array array[
    'outreach_companies',
    'outreach_contacts',
    'outreach_campaigns',
    'outreach_campaign_recipients',
    'outreach_unsubscribes'
  ]
  loop
    if to_regclass(legacy_table) is not null then
      execute format('revoke all on table %I from anon, authenticated', legacy_table);
      execute format('alter table %I enable row level security', legacy_table);
    end if;
  end loop;
end $$;
