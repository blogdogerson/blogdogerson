-- Banners trazidos do site antigo (blogdogerson.com.br)
-- Imagens hospedadas no site antigo — manter o WordPress no ar.
-- Cada insert só roda se ainda não existir banner com a mesma imagem.

-- Rotativo do topo
insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Sicredi', 'https://blogdogerson.com.br/wp-content/uploads/2026/04/sicredi-04-2026-topo.jpg', 'https://www.sicredi.com.br/site/seja-associado/', 'top', true, 1
where not exists (select 1 from public.banners where image_url = 'https://blogdogerson.com.br/wp-content/uploads/2026/04/sicredi-04-2026-topo.jpg');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Meu Clube de Férias', 'https://blogdogerson.com.br/wp-content/uploads/2024/03/clube-ferias.jpg', 'https://meuclubedeferias.com.br/', 'top', true, 2
where not exists (select 1 from public.banners where image_url = 'https://blogdogerson.com.br/wp-content/uploads/2024/03/clube-ferias.jpg');

-- Laterais (pilha da esquerda), na ordem pedida
insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Transporte Público de Gramado', 'https://blogdogerson.com.br/wp-content/uploads/elementor/thumbs/transporte-gramado-rpfxx0vhcbzcbnqumdyuzlulvqe9uajxz5a33uhjp4.png', 'https://www.gramado.rs.gov.br/cidadao/pagina/concessao-do-sistema-de-transporte-publico-coletivo-do-municipio-de-gramadors', 'sidebar', true, 1
where not exists (select 1 from public.banners where title = 'Transporte Público de Gramado');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Câmara de Gramado', 'https://blogdogerson.com.br/wp-content/uploads/elementor/thumbs/cmvg-04-2026-rmld9cp6sv2hly84kpnkfykyevefcy5i0nug8hj5xk.png', 'https://www.instagram.com/camaragramado/', 'sidebar', true, 2
where not exists (select 1 from public.banners where title = 'Câmara de Gramado');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Longevita', 'https://blogdogerson.com.br/wp-content/uploads/2023/07/longevita.jpg', null, 'sidebar', true, 3
where not exists (select 1 from public.banners where title = 'Longevita');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Festival Internacional de Folclore', 'https://blogdogerson.com.br/wp-content/uploads/2023/07/folclore-2026.png', null, 'sidebar', true, 4
where not exists (select 1 from public.banners where title = 'Festival Internacional de Folclore');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'Festa Colonial de Canela', 'https://blogdogerson.com.br/wp-content/uploads/2023/07/festa-colonial-2026-2.png', 'https://www.instagram.com/canelaturismo', 'sidebar', true, 5
where not exists (select 1 from public.banners where title = 'Festa Colonial de Canela');

insert into public.banners (title, image_url, link_url, position, active, sort_order)
select 'IPTU 2026 — Prefeitura de Gramado', 'https://blogdogerson.com.br/wp-content/uploads/2023/07/pmg-12-2025.png', 'https://gramado.atende.net/cidadao/noticia/iptu-2026-de-gramado-sera-100-digital-e-emissao-estara-disponivel-na-primeira-quinzena-de-janeiro', 'sidebar', true, 6
where not exists (select 1 from public.banners where title = 'IPTU 2026 — Prefeitura de Gramado');
