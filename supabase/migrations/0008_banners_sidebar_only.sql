-- Mantem apenas banners de publicidade (sidebar) e elimina posições legadas.
-- Isso evita registros fora do fluxo atual do site/painel.

set search_path
= "public";

update public.banners
set position = 'sidebar'
where position <> 'sidebar';

alter table public.banners
    drop constraint if exists banners_position_check;

alter table public.banners
    add constraint banners_position_check
    check (position = 'sidebar');
