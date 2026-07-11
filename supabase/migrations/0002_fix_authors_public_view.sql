-- A view authors_public existe justamente para expor, a usuários anônimos, um
-- subconjunto seguro de public.profiles (sem e-mail). Com security_invoker,
-- ela herda a RLS restrita de profiles ("self or staff can read"), que
-- bloqueia leitores anônimos por completo — o oposto do que a view deveria
-- fazer. O padrão correto para uma "view de exposição pública" é rodar com
-- o privilégio do owner (definer), não do chamador; a própria lista de
-- colunas da view já limita o que é exposto.
drop view if exists public.authors_public;

create view public.authors_public as
  select id, name, avatar_url, bio, role, socials
  from public.profiles
  where is_active = true;

grant select on public.authors_public to anon, authenticated;
