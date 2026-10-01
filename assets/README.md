# Recursos originais de Paradise?

Todos os desenhos são construídos diretamente em pixels inteiros. Não há sprites, fontes, ícones ou imagens de bancos de arte externos. A marca, molduras, botões e efeitos seguem a mesma identidade de jade, marfim, dourado e motivos botânicos.

As fontes editáveis estão organizadas em `src/render/`: `character-art.js` desenha jogador, armas, NPCs, invasores e vinte chefes; `environment-art.js` desenha terrenos, árvores, arquitetura, marcos, recursos e ingredientes; `effects-art.js` desenha telégrafos, projéteis, ambiência e fenda; `portrait-art.js` desenha os retratos animados; `map-art.js` desenha a cartografia. `renderer.js` organiza as camadas, a câmera e a exportação.

Dezesseis folhas PNG estão em `sprites/`, `animations/`, `tilesets/` e `effects/`. O catálogo `sprites/catalogo.json` documenta dimensões, ordem e poses. Com o servidor local ativo e Playwright disponível, `node scripts/export-art.mjs` atualiza todos os atlas a partir das rotinas usadas no próprio jogo.

`interface/icons.svg`, `favicon.svg` e `wordmark.svg` são desenhos próprios. A fonte `interface/paradise.woff2` possui 280 glifos e foi desenhada pixel por pixel, incluindo os acentos do português. `scripts/art/generate-font.py` permite regenerá-la e exportar a marca; sua ferramenta de produção é FontTools com suporte WOFF2. Não é uma fonte de biblioteca.

Os ícones Windows e Android reutilizam o mesmo pórtico botânico da interface. A música, a ambiência e os efeitos sonoros são sintetizados em `src/audio/audio.js`, sem serviços externos.
