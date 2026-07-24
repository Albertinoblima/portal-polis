-- ─────────────────────────────────────────────────────────────────────────
-- MEDIA BUCKET: limite de tamanho e tipos permitidos
-- ─────────────────────────────────────────────────────────────────────────
-- O bucket "media" (0001_init.sql) nunca teve file_size_limit/allowed_mime_types
-- explícitos, então caía no limite padrão do projeto Supabase (variável por
-- plano). Isso fixa 20MB por arquivo — dá folga para GIFs animados, que
-- costumam pesar mais que fotos estáticas — e restringe a tipos de imagem.
-- Precisa bater com MAX_MEDIA_UPLOAD_BYTES em src/lib/supabase/queries.ts.
--
-- Se o limite do projeto (Dashboard → Settings → Storage) for menor que
-- 20MB, ele ainda vence — o valor do bucket nunca destrava mais do que o
-- teto do projeto/plano, só pode restringir para menos.
update storage.buckets
set
  file_size_limit = 20971520, -- 20MB em bytes
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
where id = 'media';
