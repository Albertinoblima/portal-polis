-- ─────────────────────────────────────────────────────────────────────────
-- GAME PLAYERS (cadastro de jogadores da sessão de entretenimento, ex.: Jogo da Velha)
-- ─────────────────────────────────────────────────────────────────────────
create table public.game_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  game text not null default 'jogo-da-velha',
  wants_newsletter boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.game_players enable row level security;

create policy "game_players: anyone can register"
  on public.game_players for insert
  with check (true);
create policy "game_players: only admin/editor_chief can read"
  on public.game_players for select
  using (public.current_role() in ('admin', 'editor_chief'));
create policy "game_players: only admin can delete"
  on public.game_players for delete
  using (public.current_role() = 'admin');
