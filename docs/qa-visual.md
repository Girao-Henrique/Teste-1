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

## Resultado da revisão 1.1.0

A matriz final foi executada em 1º de outubro de 2026, das 03:37:30 às 03:43:07 UTC, com fontes, interface e câmera de combate finais. Os 12 perfis passaram, com 220 capturas de telas, as 19 falas iniciais em cada perfil, nenhum erro de JavaScript e nenhuma solicitação a recursos externos. O diagnóstico inclui horários de início e término de cada perfil; ele resulta de uma execução completa, sem combinar ou omitir falhas de rodadas anteriores.

Passaram as verificações de limites, sobreposição, controles encobertos, proporção e preenchimento do canvas. Mochila, fabricação, diário, mapa, pausa, configurações, controles e as quatro abas de apoio permaneceram utilizáveis com rolagem interna quando necessário. Movimento real por teclado e multitoque, pausa da simulação nos painéis e chamadas de tela cheia também passaram.

A validação final de renderização passou em 288 verificações, produzindo 92 imagens e 16 folhas de arte. Confirmou sprites distintos dos 20 chefes, poses animadas, quadros do jogador/NPCs/retratos, cenas opacas, PNGs válidos, conversão da mira e ausência dos cortes identificados nos atlas da Medusa e da fenda.

Na revisão, foram corrigidas as interseções da barra do chefe com o cabeçalho, as notificações sobre os botões especiais e a margem das notificações sobre o diário em ultrawide. As capturas de combate de 640×320 e 844×390 também foram inspecionadas: jogador e chefe permanecem no centro livre da barra, da poção e dos controles. Em combate nas telas horizontais baixas, o renderer usa um eixo lógico curto de 480 pixels; na exploração usa 360. A proporção permanece uniforme nos dois casos.

Esses resultados são de Chromium com pontes nativas simuladas. A validação de execução dos aplicativos e da campanha é registrada separadamente; esta matriz não representa testes em aparelhos físicos.
