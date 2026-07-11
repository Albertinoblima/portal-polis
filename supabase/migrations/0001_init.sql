-- Portal Pólis — schema inicial
-- Convenção: tabelas de conteúdo público ficam abertas para leitura anônima
-- (SELECT) apenas quando publicadas/ativas; toda escrita exige papel de staff.
-- "Staff" = profiles.role in ('admin','editor_chief','editor','reviewer','columnist').

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- PROFILES (1:1 com auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  avatar_url text,
  role text not null default 'user'
    check (role in ('admin', 'editor_chief', 'editor', 'reviewer', 'columnist', 'user')),
  bio text,
  socials jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de cada usuário autenticado, espelhando auth.users.';

-- Papel do usuário autenticado atual. security definer + search_path fixo
-- evita escalonamento de privilégio e permite uso direto dentro de policies.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid())
      in ('admin', 'editor_chief', 'editor', 'reviewer', 'columnist'),
    false
  );
$$;

-- Cria automaticamente um profile quando um usuário se cadastra no Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

create policy "profiles: self or staff can read"
  on public.profiles for select
  using (auth.uid() = id or public.is_staff());

create policy "profiles: self can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: admin can update any profile"
  on public.profiles for update
  using (public.current_role() = 'admin');

-- View pública e mínima (sem e-mail) usada pelo site e pelo script de build.
create view public.authors_public
  with (security_invoker = true) as
  select id, name, avatar_url, bio, role, socials
  from public.profiles
  where is_active = true;

grant select on public.authors_public to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- EDITORIAS
-- ─────────────────────────────────────────────────────────────────────────
create table public.editorias (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null,
  description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.editorias enable row level security;

create policy "editorias: public can read active"
  on public.editorias for select
  using (is_active = true or public.is_staff());

create policy "editorias: staff can write"
  on public.editorias for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  editoria_id uuid not null references public.editorias (id) on delete cascade,
  parent_id uuid references public.categories (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories: public can read"
  on public.categories for select
  using (true);

create policy "categories: staff can write"
  on public.categories for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────────────────────────────────────
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

alter table public.tags enable row level security;

create policy "tags: public can read"
  on public.tags for select
  using (true);

create policy "tags: staff can write"
  on public.tags for all
  using (public.is_staff())
  with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- ARTICLES
-- ─────────────────────────────────────────────────────────────────────────
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  subtitle text not null default '',
  content text not null default '',
  featured_image text,
  featured_image_alt text not null default '',
  editoria_id uuid not null references public.editorias (id),
  author_id uuid not null references public.profiles (id),
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'approved', 'published', 'scheduled', 'archived')),
  published_at timestamptz,
  scheduled_at timestamptz,
  seo_title text,
  seo_description text,
  reading_time_minutes integer not null default 1,
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index articles_status_published_at_idx on public.articles (status, published_at desc);
create index articles_editoria_id_idx on public.articles (editoria_id);
create index articles_author_id_idx on public.articles (author_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

create policy "articles: public can read published"
  on public.articles for select
  using (
    deleted_at is null
    and status = 'published'
    and published_at <= now()
  );

create policy "articles: staff can read all"
  on public.articles for select
  using (public.is_staff());

create policy "articles: staff can insert"
  on public.articles for insert
  with check (public.is_staff());

-- Reviewers/colunistas só editam os próprios textos e nunca conseguem, por si
-- só, colocar uma matéria em 'approved'/'published'/'scheduled' — mesmo que
-- contornem a UI e chamem a API diretamente. Só editor/editor_chief/admin
-- têm esse poder. A UI apenas reflete essa mesma regra (não é a fonte dela).
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
    )
  );

create policy "articles: only admin/editor_chief can delete"
  on public.articles for delete
  using (public.current_role() in ('admin', 'editor_chief'));

-- ─────────────────────────────────────────────────────────────────────────
-- ARTICLE_CATEGORIES / ARTICLE_TAGS (junção)
-- ─────────────────────────────────────────────────────────────────────────
create table public.article_categories (
  article_id uuid not null references public.articles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (article_id, category_id)
);

create table public.article_tags (
  article_id uuid not null references public.articles (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (article_id, tag_id)
);

alter table public.article_categories enable row level security;
alter table public.article_tags enable row level security;

create policy "article_categories: public can read"
  on public.article_categories for select using (true);
create policy "article_categories: staff can write"
  on public.article_categories for all
  using (public.is_staff()) with check (public.is_staff());

create policy "article_tags: public can read"
  on public.article_tags for select using (true);
create policy "article_tags: staff can write"
  on public.article_tags for all
  using (public.is_staff()) with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────────────────
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  user_id uuid references public.profiles (id),
  author_name text not null,
  content text not null,
  parent_id uuid references public.comments (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "comments: public can read approved"
  on public.comments for select
  using (status = 'approved' or public.is_staff());

create policy "comments: anyone can submit a comment"
  on public.comments for insert
  with check (status = 'pending');

create policy "comments: staff can moderate"
  on public.comments for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "comments: staff can delete"
  on public.comments for delete
  using (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- MEDIA
-- ─────────────────────────────────────────────────────────────────────────
create table public.media (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  url text not null,
  mime_type text not null,
  size integer not null,
  alt_text text not null default '',
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.media enable row level security;

create policy "media: staff can read"
  on public.media for select using (public.is_staff());
create policy "media: staff can write"
  on public.media for all
  using (public.is_staff()) with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- BANNERS
-- ─────────────────────────────────────────────────────────────────────────
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text not null default '#',
  position text not null default 'home_secondary'
    check (position in ('home_hero', 'home_secondary', 'sidebar')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  is_active boolean not null default true
);

alter table public.banners enable row level security;

create policy "banners: public can read active"
  on public.banners for select
  using (is_active = true or public.is_staff());
create policy "banners: staff can write"
  on public.banners for all
  using (public.is_staff()) with check (public.is_staff());

-- ─────────────────────────────────────────────────────────────────────────
-- NEWSLETTER SUBSCRIBERS
-- ─────────────────────────────────────────────────────────────────────────
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  preferences text[] not null default '{}',
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "newsletter: anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (true);
create policy "newsletter: only admin/editor_chief can read"
  on public.newsletter_subscribers for select
  using (public.current_role() in ('admin', 'editor_chief'));
create policy "newsletter: only admin/editor_chief can manage"
  on public.newsletter_subscribers for update
  using (public.current_role() in ('admin', 'editor_chief'));
create policy "newsletter: only admin can delete"
  on public.newsletter_subscribers for delete
  using (public.current_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────
-- AUDIT LOGS
-- ─────────────────────────────────────────────────────────────────────────
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  action text not null,
  entity text not null,
  entity_id text not null,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "audit_logs: staff can insert their own actions"
  on public.audit_logs for insert
  with check (user_id = auth.uid() and public.is_staff());
create policy "audit_logs: admin/editor_chief can read"
  on public.audit_logs for select
  using (public.current_role() in ('admin', 'editor_chief'));

-- ─────────────────────────────────────────────────────────────────────────
-- SITE SETTINGS (linha única)
-- ─────────────────────────────────────────────────────────────────────────
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'Pólis',
  tagline text not null default 'Onde a política faz sentido',
  default_seo_title text not null default 'Pólis — Onde a política faz sentido',
  default_seo_description text not null default
    'Jornalismo político contextual, plural e confiável.',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

alter table public.site_settings enable row level security;

create policy "site_settings: public can read"
  on public.site_settings for select using (true);
create policy "site_settings: admin can update"
  on public.site_settings for update
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────
-- STORAGE: bucket público de mídia
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media bucket: public can read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media bucket: staff can upload"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_staff());

create policy "media bucket: staff can delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_staff());
