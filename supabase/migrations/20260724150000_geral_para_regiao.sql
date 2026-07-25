-- A pedido do editor: o tópico "Geral" deixou de existir como editoria
-- própria (ver migração 20260724120000_categories_table.sql). Todas as
-- notícias que estavam marcadas como "Geral" passam a ser "Região", em vez
-- de ficarem apenas "órfãs" sem uma seção própria na home.

UPDATE public.articles
SET category = 'Região'
WHERE category = 'Geral';
