-- ─────────────────────────────────────────────────────────────────────────
-- CONTACT MESSAGES (formulário público de contato)
-- ─────────────────────────────────────────────────────────────────────────
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "contact_messages: anyone can send"
  on public.contact_messages for insert
  with check (true);
create policy "contact_messages: only admin/editor_chief can read"
  on public.contact_messages for select
  using (public.current_role() in ('admin', 'editor_chief'));
create policy "contact_messages: only admin/editor_chief can mark handled"
  on public.contact_messages for update
  using (public.current_role() in ('admin', 'editor_chief'))
  with check (public.current_role() in ('admin', 'editor_chief'));
create policy "contact_messages: only admin can delete"
  on public.contact_messages for delete
  using (public.current_role() = 'admin');
