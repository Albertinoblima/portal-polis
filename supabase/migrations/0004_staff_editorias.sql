-- ─────────────────────────────────────────────────────────────────────────
-- STAFF_EDITORIAS (permissão granular por editoria para reviewer/columnist)
-- ─────────────────────────────────────────────────────────────────────────
-- Reviewers e colunistas SEM nenhuma linha aqui continuam podendo escrever em
-- qualquer editoria — exatamente o comportamento anterior a esta migration.
-- Só passam a ficar restritos quando um admin/editor_chief explicitamente
-- atribui uma ou mais editorias a eles. admin/editor_chief/editor nunca são
-- afetados por esta tabela.
create table public.staff_editorias (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  editoria_id uuid not null references public.editorias (id) on delete cascade,
  primary key (profile_id, editoria_id)
);

alter table public.staff_editorias enable row level security;

create policy "staff_editorias: self or staff can read"
  on public.staff_editorias for select
  using (profile_id = auth.uid() or public.is_staff());

create policy "staff_editorias: admin/editor_chief can write"
  on public.staff_editorias for all
  using (public.current_role() in ('admin', 'editor_chief'))
  with check (public.current_role() in ('admin', 'editor_chief'));

create or replace function public.can_write_editoria(target_editoria_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    public.current_role() in ('admin', 'editor_chief', 'editor')
    or (
      public.current_role() in ('reviewer', 'columnist')
      and (
        not exists (select 1 from public.staff_editorias where profile_id = auth.uid())
        or exists (
          select 1 from public.staff_editorias
          where profile_id = auth.uid() and editoria_id = target_editoria_id
        )
      )
    );
$$;

drop policy "articles: staff can insert" on public.articles;
create policy "articles: staff can insert"
  on public.articles for insert
  with check (public.is_staff() and public.can_write_editoria(editoria_id));

drop policy "articles: editors can update any, columnists only their own drafts" on public.articles;
create policy "articles: editors can update any, columnists only their own drafts"
  on public.articles for update
  using (
    public.current_role() in ('admin', 'editor_chief', 'editor')
    or (public.current_role() in ('reviewer', 'columnist') and author_id = auth.uid())
  )
  with check (
    public.current_role() in ('admin', 'editor_chief', 'editor')
    or (
      public.current_role() in ('reviewer', 'columnist')
      and author_id = auth.uid()
      and status in ('draft', 'in_review')
      and public.can_write_editoria(editoria_id)
    )
  );
