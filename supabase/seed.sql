-- Seed inicial: editorias e tags (não dependem de nenhum usuário existente).
-- Matérias e autores NÃO são semeados aqui de propósito: eles referenciam
-- public.profiles, que só existe depois que um usuário real se autentica
-- pelo menos uma vez (veja o trigger public.handle_new_user). Crie seu
-- primeiro admin seguindo o runbook do README e depois publique o
-- conteúdo pelo próprio painel — assim o fluxo real fica testado desde o dia 1.

insert into public.editorias (name, slug, color, description) values
  ('Política', 'politica', '#0A192F', 'Cobertura da política nacional: Congresso, Executivo, Judiciário e os bastidores do poder em Brasília.'),
  ('Municípios', 'municipios', '#1E5128', 'Política local nos municípios brasileiros: prefeituras, câmaras municipais e o impacto das leis no dia a dia do cidadão.'),
  ('Eleições', 'eleicoes', '#7A1F2B', 'Tudo sobre pleitos eleitorais: candidaturas, pesquisas, propaganda eleitoral e resultados.'),
  ('Editorial', 'editorial', '#C9A227', 'A posição institucional do Pólis sobre os temas mais relevantes da política nacional.'),
  ('Opinião', 'opiniao', '#4A3F6B', 'Espaço plural de colunistas convidados para análise e debate qualificado.'),
  ('Bastidores', 'bastidores', '#334155', 'O que não sai no noticiário tradicional: articulações, negociações e os bastidores do poder.'),
  ('Radar Político', 'radar-politico', '#0E7490', 'Curadoria das matérias e temas mais relevantes do momento, atualizada continuamente.')
on conflict (slug) do nothing;

insert into public.tags (name, slug) values
  ('Congresso', 'congresso'),
  ('Economia', 'economia'),
  ('Transparência', 'transparencia'),
  ('Eleições 2026', 'eleicoes-2026'),
  ('Diplomacia', 'diplomacia'),
  ('Federalismo', 'federalismo')
on conflict (slug) do nothing;
