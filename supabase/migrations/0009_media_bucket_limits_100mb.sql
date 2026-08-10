-- ─────────────────────────────────────────────────────────────────────────
-- MEDIA BUCKET: aumenta o limite de tamanho de 20MB para 100MB
-- ─────────────────────────────────────────────────────────────────────────
-- GIFs animados usados na área de publicidade estavam estourando o teto de
-- 20MB definido em 0007_media_bucket_limits.sql. O upload é feito direto do
-- navegador para o Supabase Storage (não passa por function serverless da
-- Vercel), então não há limite de payload de servidor no meio do caminho —
-- o único teto real é este aqui e o limite do plano do projeto Supabase.
-- Precisa bater com MAX_MEDIA_UPLOAD_BYTES em src/lib/supabase/queries.ts.
--
-- Se o limite do projeto (Dashboard → Settings → Storage) for menor que
-- 100MB, ele ainda vence — o valor do bucket nunca destrava mais do que o
-- teto do projeto/plano, só pode restringir para menos.
update storage.buckets
set
  file_size_limit = 104857600 -- 100MB em bytes
where id = 'media';
