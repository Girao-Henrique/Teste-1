# Validação da versão integrada

O Documento Mestre foi lido integralmente na raiz antes da arquitetura. A revisão preservou biomas, personagens, 20 chefes/vítimas, nove ingredientes, survival e sequência final.

## Sistemas e campanha

`npm test` verifica os sistemas e as campanhas normal e tranquila. Os testes de campanha coletam recursos por interação, fabricam e melhoram equipamentos, administram provisões, enfrentam invasores comuns e vencem os vinte chefes com ataques, movimento e esquivas da simulação. Os testes não alteram vida, dano, fôlego ou inventário para forçar vitórias; apenas aceleram o deslocamento entre pontos de interesse.

Foram verificados:

- Conectividade dos dez mapas, incluindo recursos, caminhos opcionais, cavernas, arenas, ingredientes e nós da fenda.
- Possibilidade de deixar chefe e ingrediente pendentes e voltar por viagem rápida antes do décimo bioma.
- Separação dos baús, desgaste até quebra, reparos e preservação do equipamento no save.
- Pausa, ciclo de 780 segundos e sono crítico após cerca de 3,5 ciclos.
- Acampamento sem checkpoint ou salvamento manual.
- Poção obrigatória e retomada do derretimento após save, fuga ou morte.
- Três nós elétricos, fechamento da fenda e sequência final correta.
- Compactação dos registros de replay e preservação das ações essenciais mesmo depois de muitas fabricações.

## Navegador

`tests/browser.mjs` usa Chromium e Playwright. Verifica menu, 19 falas iniciais, movimento real pelo teclado, coleta, fabricação pela interface, pausa do tempo no inventário, mapa, configurações, reload/save, gamepad pela API padrão do navegador e as 25 entradas finais. A importação final usa um save produzido pelos combates reais da campanha automatizada. O teste exige ausência de erros JavaScript e termina sem botão ou notificação, na fala exata do Porteiro.

A revisão visual verificou menu, gameplay, crafting, mapa, chefes e encerramento. As imagens ficam em `tests/artifacts/` e não entram no Git. `EXPORT_CAMPAIGN=1 npm test` recria o fixture usado no teste do navegador.

Esta validação automatizada cobre integração e conclusão; não substitui uma rodada extensa de playtest humano para ajuste fino de dificuldade e ritmo. Não foi usado um controle físico nesta sessão: o teste de gamepad simula a API do navegador.

## Correções encontradas durante a integração

O estado do ácido passou a persistir para evitar bloqueio irreversível no chefe final. Replays foram compactados para caber no armazenamento local e agora preservam os estados históricos da fenda, do poder e da dissolução. Recursos isolados foram convertidos em decoração. Telégrafos foram alinhados ao alcance real do dano; porcentagens de durabilidade, eventos de áudio, navegação de teclado e notificações finais foram corrigidos.

## Aplicativos offline e celular

Foram gerados um executável portátil Windows x64 e um APK Android universal. O aplicativo Electron abriu diretamente em `paradise://game/index.html`, com Canvas e interface carregados, sem servidor e sem exposição de Node.js à janela. O APK passou na verificação de assinatura v2/v3. Os arquivos de conteúdo incorporados foram comparados com a versão atual; Documento Mestre, saves e chaves não são distribuídos.

O teste `tests/mobile.mjs` simula um celular de 844 × 390 com toque e ponte nativa. Verifica que todos os botões iniciais cabem na tela, as 19 falas iniciais, movimento e ataque simultâneos com dois pontos de toque, interrupção do movimento ao soltar, carregamento e liberação do golpe, pausa e salvamento ao ir para segundo plano, rotação para retrato e avanço das cenas finais por toque. Não ocorreram erros JavaScript. A interface de PC foi testada novamente após as adaptações.

Os testes de interface móveis usam Chromium, não um celular físico. O executável Windows foi produzido em Linux e ainda precisa de teste de execução em Windows. Instalação, avisos de assinatura e comandos de geração estão em `docs/distribuicao.md`.

A tentativa adicional de instalar o APK em emulador Android 15 não concluiu: sem `/dev/kvm`, o sistema permaneceu na compilação inicial de componentes Google com `dex2oat` por vários minutos, bloqueando a instalação. O emulador foi encerrado. Não foi obtida confirmação de abertura do APK em Android nativo nesta sessão; a assinatura, estrutura, conteúdo e controles em navegador móvel foram verificados separadamente.
