# Recursos originais de Paradise?

A arte é criada diretamente em pixels por `src/render/renderer.js`, que também a utiliza em execução: sprites de personagens e criaturas, animações econômicas, vegetação, arquitetura, terrenos, marcos, efeitos e partículas. Não há imagens filtradas ou dependências de bancos de arte externos.

Treze folhas PNG transparentes e sem perdas estão em `sprites/`, `animations/`, `tilesets/` e `effects/`. A ordem das células, as dimensões e as poses estão documentadas em `sprites/catalogo.json`. Os ícones originais em pixel art estão em `interface/icons.svg` e são usados pela interface através de `src/ui/icons.js`.

Os mapas e objetos interativos ficam em `src/world/world.js`; as paletas e identidades das criaturas ficam em `src/data/content.js`. A fonte editável da arte permanece no renderer. Com o servidor local ativo e Playwright disponível, `node scripts/export-art.mjs` atualiza as folhas PNG.

A música, a ambiência e os efeitos são sintetizados em `src/audio/audio.js`, sem arquivos ou serviços externos.
