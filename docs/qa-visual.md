# Validação visual e de layout

O teste `tests/layout.mjs` verifica a apresentação pelo Chromium/Playwright. É necessário iniciar `npm start` em outro terminal. No ambiente de desenvolvimento, execute:

```bash
node tests/layout.mjs
```

Para isolar uma resolução, use `PARADISE_LAYOUT_CASE=celular-pequeno-retrato node tests/layout.mjs`. A variável `PARADISE_TEST_URL` permite usar outra porta. No ambiente da nuvem, mantenha caches e temporários dentro do projeto, por exemplo `TMPDIR="$PWD/.cache/tmp"`.

A matriz inclui celulares de 320×568 e 390×844, paisagens de 640×320 e 844×390, tablet de 768×1024, telas quadradas de 720×720 e 900×900, PC de 800×600 e 1366×768, PC em retrato de 720×1280 e ultrawide de 2560×1080 com mouse e com toque. As integrações nativas são simuladas para verificar o botão Sair e as chamadas de tela cheia no Android e no PC. Nas resoluções sem ponte nativa, o teste entra de fato em tela cheia pelo navegador.

Cada resolução exercita o título, escolha de dificuldade, introdução, movimento, mochila, fabricação, mapa, diário, pausa, configurações, controles e mudança de orientação. Também abre um ponto de apoio por interação real e inspeciona serviços, fabricação, baú e viagem rápida. A simulação deve permanecer pausada nos painéis. Nos dispositivos de toque, o direcional e o ataque são acionados juntos com eventos reais de multitoque do navegador. Retrato e paisagem precisam permanecer jogáveis.

O teste compara a proporção CSS com as dimensões internas do canvas para detectar alongamento e verifica o preenchimento da tela. Verifica limites, sobreposição e elementos encobertos nas áreas críticas do HUD e dos controles. Conteúdo abaixo da área visível só é aceito quando existe um contêiner de rolagem vertical que permanece dentro da tela.

Para testar a distribuição dos botões de poção ácida e campo elétrico e do conteúdo completo dos serviços de apoio, o teste importa salvamentos preparados exclusivamente para apresentação. O fixture de apoio inclui itens no baú e dez destinos para verificar listas longas. Esses fixtures não representam vitórias de campanha e não substituem os testes de progressão de `tests/campaign.test.mjs`.

Os screenshots e as coordenadas dos elementos são gravados em `tests/artifacts/layout/`. O arquivo `diagnostico.json` registra a resolução, a tela examinada e cada problema encontrado. Esses artefatos são locais e não fazem parte do aplicativo distribuído.

A matriz automatizada complementa a inspeção das imagens. Ela não atesta o desempenho em aparelhos físicos, certificação de plataforma ou qualidade estética por si só. A validação final deve usar as imagens do código final e os testes da campanha.

## Renderização e atlas

`node tests/render.mjs` cria fixtures de apresentação para os dez biomas, seus marcos e a iluminação noturna. Exercita os 20 chefes com poses, ataques, indicadores, partículas e projéteis. As cenas completas devem manter todos os pixels opacos; as 16 folhas de arte precisam ter pixels visíveis e arquivos PNG válidos. Quadros de movimento das quatro direções do jogador, dos dois NPCs e dos três retratos precisam apresentar mudanças reais de pixels. Os chefes e os cinco quadros da fenda também são desenhados com margens externas para detectar cortes nas células de seus atlas.

O teste também chama `Renderer.resize()` em retrato, paisagem, quadrado e ultrawide, compara as proporções, confirma a amostragem sem suavização e verifica a conversão da mira em coordenadas do mundo. Chama `exportSheets()` e guarda uma cópia dos atlas somente em `tests/artifacts/render/atlas/`, sem substituir os recursos de produção. Galerias, cenas e diagnóstico ficam em `tests/artifacts/render/` para inspeção manual.
