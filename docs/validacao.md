# Validação da atualização visual 1.1.0

O Documento Mestre foi lido diretamente da raiz. A revisão preserva os dez biomas, os vinte chefes, os nove ingredientes, os sistemas de sobrevivência e a ordem da sequência final.

## Sistemas e campanha

`npm test` verifica sobrevivência, crafting transacional, armas, desgaste e reparos, armazenamento regional, acampamentos, salvamento e campanhas normal e tranquila. Os percursos usam interações, ataques, movimento e esquivas da simulação; deslocamentos entre pontos de interesse são assistidos. Vida, dano, fôlego e inventário não são alterados para forçar vitórias.

Os testes verificam conectividade dos mapas, retorno a chefes e ingredientes pendentes, acampamento sem checkpoint, ciclo de 780 segundos, sono crítico, poção obrigatória, retomada do ácido após save/fuga/morte, três nós da fenda, sequência final e preservação dos registros de replay.

## Interface e controles

`tests/browser.mjs` passou com 19 falas iniciais, movimento por teclado, coleta, fabricação pela interface, pausa, mapa, configurações, reload/save, gamepad pela API simulada do navegador e 25 entradas finais. O save final foi produzido pela campanha automatizada. O jogo encerrou na fala exata do Porteiro, sem botão ou notificação restante e sem erros JavaScript.

`tests/mobile.mjs` passou com menu nativo simulado, movimento e ataque multitoque, interrupção ao soltar, carga e liberação do golpe, pausa/salvamento em segundo plano, rotação com retrato jogável e 24 avanços de botão até o encerramento. Teclado, mouse, gamepad e toque continuam alimentando a mesma simulação.

## Artes e telas

A arte foi redesenhada em módulos próprios: personagens, vinte chefes, sete armas, terrenos, árvores, estruturas, dez marcos, recursos, ingredientes, retratos, efeitos, fonte, marca e ícones. Dezesseis folhas PNG foram exportadas das mesmas rotinas usadas no jogo.

A matriz `tests/layout.mjs` cobre 12 formatos, de 320×568 a 2560×1080, com retrato, paisagem, quadrados, tablet e ultrawide. Verifica proporção/preenchimento do canvas, limites de painéis, rolagem interna, botões encobertos, interseções do HUD, controles, habilidades e notificações. Menus pausam a simulação. Abertura, mochila, fabricação, mapa, diário, pausa, configurações, controles, ponto de apoio, baú, viagem e habilidades são exercitados.

`tests/render.mjs` passou em 288 verificações, com 92 imagens e 16 folhas PNG: dez biomas de dia/noite, marcos, vinte chefes, poses, quadros de movimento, NPCs, retratos, fenda sem corte, transparência dos atlas, cenas opacas, resize e mira. As imagens também foram inspecionadas; os fixtures visuais não representam vitórias de campanha.

Nas batalhas em paisagem baixa, a câmera usa eixo lógico de 480 pixels, considera o espaço livre do HUD e enquadra os atores nas arenas próximas às bordas. O botão da poção permanece à direita, liberando o centro.

## Aplicativos offline

O APK 1.1.0/code2 foi compilado com a mesma chave local da versão anterior e passou na verificação v2/v3. O conteúdo incorporado inclui os módulos e recursos finais; documentos, saves pessoais, ferramentas e chaves privadas são excluídos. O APK instala diretamente e não solicita permissão de internet.

O aplicativo Electron abriu em Linux por `paradise://game/index.html`, sem servidor, com marca, fonte, 19 falas, movimento e pausa. O modo Linux sem monitor não permite atestar fullscreen nativo.

O executável portátil foi compilado e **executado no runner Windows do GitHub Actions**. O teste abriu o aplicativo empacotado, carregou marca/fonte, percorreu 19 falas, moveu o jogador, pausou o tempo e alternou tela cheia. Node.js não ficou exposto ao conteúdo. Pipeline aprovado: [execução 36811488393](https://github.com/Girao-Henrique/Teste-1/actions/runs/36811488393).

O APK instalou no Android virtual, mas o fluxo nativo não foi aprovado. O WebView falhou ao verificar seu snapshot interno do V8 antes de executar os módulos do jogo; dois controles sem conteúdo do jogo também não abriram. A execução em aparelho Android permanece pendente. O diagnóstico completo fica em [android-native-qa.md](android-native-qa.md). Instalação e comandos de geração estão em [distribuicao.md](distribuicao.md).

## Limites práticos

As verificações automatizadas cobrem integração e conclusão, mas não substituem playtest humano para dificuldade, ritmo e desempenho. Nenhum aparelho físico ou controle físico foi usado nesta sessão. A emulação Android por software não fornece uma medição confiável de fluidez ou bateria; testes em aparelhos reais continuam necessários para compatibilidade de fabricantes.
