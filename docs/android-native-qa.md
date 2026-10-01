# Verificação nativa do APK

O teste usa o APK assinado incorporando `www/` e o WebView real do Android. Não usa o servidor de desenvolvimento nem injeta estado na campanha. Os registros, XMLs de acessibilidade e capturas ficam em `tests/artifacts/android-native/`, fora do conteúdo distribuído e do Git.

## Ambientes usados

- Android 15, API 35, imagem Google APIs x86_64.
- AVD `ParadiseTest`, emulação por software sem KVM, SwiftShader, 2 núcleos e 2,5 GB de memória atribuída ao dispositivo. O emulador elevou a solicitação de 1536 MB para seu mínimo de 2560 MB.
- Resolução 720 × 1560, densidade 320, equivalente a 360 × 780 pixels CSS em retrato e 780 × 360 em paisagem.
- SDK, AVD, diretórios temporários e preferências dentro de `.cache/` do projeto.
- WebView 124.0.6367.219 no AVD Google APIs.
- Google Play Services desativado somente no AVD de teste durante o diagnóstico; o jogo não depende desse serviço.
- `watchdog_timeout_millis=600000` somente no AVD. A lentidão da emulação por software excedia o limite padrão de 60 segundos e reiniciava `system_server` durante o boot. O ajuste permitiu concluir a inicialização.

Uma segunda tentativa usou o AVD `ParadiseATD`, com a imagem oficial AOSP ATD API 35/x86_64. Ele usa a mesma resolução, densidade e memória, e a porta ADB `emulator-5556`. O boot também concluiu (`sys.boot_completed=1`, Android 15), em aproximadamente 6 minutos. O AVD Google foi encerrado para liberar recursos.

O parâmetro do watchdog corresponde a `Settings.Global.WATCHDOG_TIMEOUT_MILLIS` em [Watchdog.java do Android 15](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/android15-release/services/core/java/com/android/server/Watchdog.java). Ele não altera o APK nem as configurações de quem instala o jogo.

## Execução

Com o emulador pronto e o APK atual gerado:

```bash
node tests/android-native.mjs status
node tests/android-native.mjs install
node tests/android-native.mjs flow
```

Para o AVD ATD, acrescente `PARADISE_ANDROID_SERIAL=emulator-5556` antes de cada comando.

O comando `install` aceita um caminho de APK como terceiro argumento. A instalação usa `--no-incremental -r`. O fluxo desativa Wi-Fi e dados móveis no AVD antes de abrir o jogo, confirmando o carregamento dos recursos incorporados.

O fluxo previsto pelo comando `flow` percorre a abertura por toque, aciona o direcional e o ataque, abre o inventário e o mapa, abre a pausa pelo botão Voltar, gira a tela, testa o inventário e a pausa em retrato e verifica a retomada após ir para segundo plano. Os limites e interseções dos botões são checados usando a árvore de acessibilidade nativa. A sintaxe do script foi verificada; isso não equivale a aprovação de todo o fluxo.

As capturas precisam ser inspecionadas junto com os resultados automatizados para confirmar a renderização de fontes, sprites, HUD e controles. O relatório de execução é `tests/artifacts/android-native/report.json`.

## Limites

Este procedimento valida um dispositivo virtual Android e não representa teste em aparelho físico. A emulação sem KVM não fornece uma medição confiável de fluidez ou consumo de bateria. A matriz mais ampla de tamanhos, proporções e telas do jogo continua nos testes de interface no navegador.

## Resultado da revisão visual 1.1.0

O APK final foi instalado com `--no-incremental -r` no Android virtual e o instalador retornou `Performing Streamed Install / Success`.

SHA-256 do pacote instalado:

```text
e55d42f6d4bc5799e76b91441b3a3c7948c07964fec94ea7c681692dcc658a48
```

No AVD Google APIs, a primeira abertura mostrou o splash do Android com o ícone personalizado do jogo. O dispositivo passou a exibir o diálogo `Pixel Launcher isn't responding`. A conexão do UiAutomation também falhou com `TimeoutException`, impedindo obter a árvore de acessibilidade e concluir o fluxo. Os erros encontrados pertencem à infraestrutura do dispositivo virtual; não fornecem aprovação nem diagnóstico completo da experiência do APK.

A instalação está comprovada. O menu do jogo, o fluxo de abertura por toque, a rotação, o inventário, o mapa e a retomada não foram aprovados em Android nativo nesta etapa.

No ATD, o APK final instalou novamente, mas a abertura também terminou sem mostrar o menu. O log completo permitiu identificar a primeira queda no processo isolado do WebView: `CrRendererMain`, PID 2364, recebeu `SIGTRAP` no endereço relativo `0x17971cc` de `libwebviewchromium.so`, versão 124.0.6367.219. A biblioteca tem BuildId `68dabd72c6088238cbfc9a5fbfe211f916771df5`.

A sequência de instruções desse endereço corresponde ao `CHECK(VerifyChecksum(blob))` em `v8::internal::Snapshot::Initialize`. O verificador retornou falso e a biblioteca executou a instrução de interrupção fatal. A sequência foi comparada com [snapshot.cc do V8 12.4](https://chromium.googlesource.com/v8/v8/+/refs/branch-heads/12.4/src/snapshot/snapshot.cc), incluindo o verificador e o texto de medição do checksum. Essa inicialização pertence ao snapshot interno do V8 fornecido pelo WebView e ocorre antes da execução dos módulos do jogo.

O snapshot de 64 bits extraído do APK do provider contém 74.109 bytes. Seu checksum Adler-32, com valor inicial 0 e cobrindo o conteúdo a partir do byte 12, confere no host: valor armazenado e valor calculado são `0x882b7eae`. O snapshot de 32 bits também confere (`0x51dbfb01`). Portanto, os arquivos extraídos do provider são internamente coerentes fora da execução emulada; o relatório não isola qual etapa da execução emulada causou a divergência.

Após a queda do renderer, o aplicativo recebeu uma segunda interrupção fatal porque o WebView não teve `onRenderProcessGone` tratado. O `tombstone_00` corresponde a essa queda secundária do aplicativo, e não à primeira divergência do checksum.

Um controle com o mesmo wrapper e apenas HTML estático também não exibiu a página. Esse controle não contém módulos, fonte, sprites, canvas nem áudio do jogo, isolando a queda desses conteúdos. Os controles são temporários e ficam apenas em `tests/artifacts/native-probe/`; o APK distribuído mantém os arquivos da revisão visual e o hash acima.

Um segundo controle reduziu o código Java a uma `Activity`, `new WebView(this)`, `setContentView` e `loadData` com HTML simples. Ele não usa bridge, clientes do WebView, origem HTTPS local, ajustes de insets, JavaScript nem código do jogo. A captura `stock.png` também ficou preta e `stock.xml` mostrou apenas `com.android.fakesystemapp`. Esse controle afasta o wrapper de produção e os recursos do Paradise? como condições necessárias para reproduzir a falha observada nesse dispositivo virtual. A origem exata da divergência durante a inicialização do V8 ainda não foi isolada.

A matriz de tamanhos e proporções no Chromium, incluindo controles por toque e retrato/paisagem, passou nos testes de interface da revisão. A execução do aplicativo Windows também passou no runner Windows do GitHub. Esses resultados são separados da validação Android nativa.

Os registros relevantes desta tentativa ficam em `installation.txt`, `installation.json`, `runtime-diagnostics.txt`, `open-latest.png`, `emulator-first.log`, `emulator-atd.log`, `atd-logcat-full.txt`, `atd-tombstone_00.txt`, `atd-renderer.dmp`, `atd-fatal-disasm.txt`, `atd-snapshot-checksums.json` e `atd-final.xml`, dentro de `tests/artifacts/android-native/`. As capturas e XMLs dos controles ficam em `tests/artifacts/native-probe/`.

O APK é uma prévia com instalação e assinatura verificadas, matriz de interface no Chromium aprovada e validação de execução em aparelho Android ainda pendente. O resultado desta sessão não permite declarar o fluxo Android nativo aprovado.
