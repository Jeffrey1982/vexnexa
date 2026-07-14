create table if not exists lead_consent_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  token_hash text not null unique,
  consent_type text not null default 'commercial_outreach' check (consent_type = 'commercial_outreach'),
  status text not null default 'pending' check (status in ('pending','confirmed','expired','cancelled')),
  source text not null,
  evidence jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists lead_nurture_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references lead_workspaces(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  sequence_step integer not null check (sequence_step between 1 and 3),
  status text not null default 'reserved' check (status in ('reserved','sent','failed','cancelled')),
  subject text not null,
  body_text text not null,
  unsubscribe_token_hash text not null unique,
  provider_message_id text,
  error_message text,
  reserved_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_nurture_step_once unique (workspace_id, contact_id, sequence_step)
);

create index if not exists lead_consent_requests_pending_idx
  on lead_consent_requests(status, expires_at);
create index if not exists lead_nurture_deliveries_contact_idx
  on lead_nurture_deliveries(workspace_id, contact_id, sequence_step);

alter table lead_consent_requests enable row level security;
alter table lead_nurture_deliveries enable row level security;

create policy "consent requests scoped to workspace members"
  on lead_consent_requests for select
  using (is_lead_workspace_member(workspace_id));
create policy "nurture deliveries scoped to workspace members"
  on lead_nurture_deliveries for select
  using (is_lead_workspace_member(workspace_id));

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
      and ce.status in ('withdrawn','revoked')
      and (
        (ce.consent_type = 'commercial_outreach' and ce.contact_id = target_contact_id)
        or (ce.consent_type = 'existing_customer_relationship' and (ce.contact_id = target_contact_id or ce.contact_id is null))
      )
  ) then
    return false;
  end if;

  return exists (
    select 1 from public.consent_events ce
    where ce.workspace_id = target_workspace_id
      and ce.organization_id = org_id
      and ce.status = 'active'
      and ce.evidence <> '{}'::jsonb
      and (ce.expires_at is null or ce.expires_at > now())
      and (
        (ce.consent_type = 'commercial_outreach' and ce.contact_id = target_contact_id)
        or (ce.consent_type = 'existing_customer_relationship' and (ce.contact_id = target_contact_id or ce.contact_id is null))
      )
  );
end;
$$;

