# Portal Blog do Gerson — Plano completo

## Visão
Portal de notícias premium, claro e leve puxando azul, estilo editorial (The Verge / Apple News): tipografia forte, grid assimétrico, cards em tamanhos variados, animações suaves, muito respiro. Nada de tema escuro, nada com cara de IA.

## 1. Design e Cabeçalho
- Design system em azul claro: fundo quase branco, azul profundo como cor de marca, tipografia display marcante + fonte de leitura confortável.
- Cabeçalho como cartão-postal: logo grande e legível com animação sutil de entrada, foto do Gerson, menu com as 8 editorias (Geral, Gramado, Canela, Nova Petrópolis, Região, Política, Polícia, Câmara de Vereadores), lupa de busca funcional e botão destacado "OUÇA A RÁDIO GRAMADO NEWS" com player fixo do stream.
- **Atenção:** o zip com o logo oficial e a foto do Gerson não chegou. Vou usar versões temporárias bonitas e trocar assim que você reenviar os arquivos no chat.

## 2. Página inicial
- Banner rotativo no topo (carrossel de anúncios clicáveis).
- Destaque principal assimétrico + grade de notícias em tamanhos variados — máximo de notícias na tela inicial.
- Banners laterais e banner entre blocos de notícias, todos clicáveis para o site do anunciante.
- Seção de vídeos dividida: Podcast Cafezinho (horizontal) + colunas verticais para Gramado Visão de Futuro, TV Gramado News, Fica a Dica e Opinião.
- Bloco de newsletter (cadastro de e-mail).

## 3. Notícias
- Cada notícia abre dentro do site com URL própria (`/noticia/slug`), com preview bonita ao compartilhar no WhatsApp/Facebook (og:image = imagem da notícia).
- Botões de compartilhar: WhatsApp, Facebook, X, Instagram e copiar link.
- Sugestões de outras notícias ao final da leitura (mesma editoria + recentes).
- Páginas por editoria, busca funcional, página Quem sou eu (com sua bio completa), página Anuncie.

## 4. Migração do site antigo
- O site atual é WordPress com API aberta: vou importar TODAS as notícias existentes com título, texto, data, categoria e imagens, mantendo tudo.

## 5. Painel administrativo (com login)
- Criar, editar e publicar notícias com editor fácil e upload de imagem.
- Gerenciar banners: trocar imagem, definir link de destino e posição (topo, lateral, entre notícias).
- Ver e exportar inscritos da newsletter.
- Botão de acesso ao painel no rodapé, funcionando.

## 6. Rodapé
- Links das editorias, contato gerson@blogdogerson.com.br, redes sociais e "Todos os direitos reservados: Abimael Rodrigues @euabimael".

## Detalhes técnicos
- Lovable Cloud (banco de dados) para notícias, banners, inscritos da newsletter e login do admin.
- Importação via API pública do WordPress do site antigo.
- SSR com meta tags por notícia para as previews de compartilhamento funcionarem de verdade.

## Ordem de execução
1. Backend (banco, autenticação do admin) + importação das notícias antigas.
2. Design system + cabeçalho + home completa.
3. Página da notícia com compartilhamento e sugestões.
4. Painel administrativo.
5. Páginas Quem sou eu, Anuncie, busca, newsletter.
