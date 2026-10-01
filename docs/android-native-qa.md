# Verificação nativa do APK

O teste usa o APK assinado incorporando `www/` e o WebView real do Android. Não usa o servidor de desenvolvimento nem injeta estado na campanha. Os registros, XMLs de acessibilidade e capturas ficam em `tests/artifacts/android-native/`, fora do conteúdo distribuído e do Git.

## Ambiente reproduzível

- Android 15, API 35, imagem Google APIs x86_64.
- AVD `ParadiseTest`, emulação por software sem KVM, SwiftShader, 2 núcleos e 1,5 GB de memória atribuída ao dispositivo.
- Resolução 720 × 1560, densidade 320, equivalente a 360 × 780 pixels CSS em retrato e 780 × 360 em paisagem.
- SDK, AVD, diretórios temporários e preferências dentro de `.cache/` do projeto.
- Google Play Services desativado somente no AVD de teste; o jogo não depende desse serviço.
- `watchdog_timeout_millis=600000` somente no AVD. A lentidão da emulação por software excedia o limite padrão de 60 segundos e reiniciava `system_server` durante o boot. O ajuste permitiu concluir a inicialização.

O parâmetro do watchdog corresponde a `Settings.Global.WATCHDOG_TIMEOUT_MILLIS` em [Watchdog.java do Android 15](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/android15-release/services/core/java/com/android/server/Watchdog.java). Ele não altera o APK nem as configurações de quem instala o jogo.

## Execução

Com o emulador pronto e o APK atual gerado:

```bash
node tests/android-native.mjs status
node tests/android-native.mjs install
node tests/android-native.mjs flow
```

O comando `install` aceita um caminho de APK como terceiro argumento. A instalação usa `--no-incremental -r`. O fluxo desativa Wi-Fi e dados móveis no AVD antes de abrir o jogo, confirmando o carregamento dos recursos incorporados.

O comando `flow` percorre a abertura por toque, aciona o direcional e o ataque, abre a pausa pelo botão Voltar, gira a tela, testa a pausa em retrato e verifica a retomada após ir para segundo plano. Os limites e interseções dos botões são checados usando a árvore de acessibilidade nativa.

As capturas precisam ser inspecionadas junto com os resultados automatizados para confirmar a renderização de fontes, sprites, HUD e controles. O relatório de execução é `tests/artifacts/android-native/report.json`.

## Limites

Este procedimento valida um dispositivo virtual Android e não representa teste em aparelho físico. A emulação sem KVM não fornece uma medição confiável de fluidez ou consumo de bateria. A matriz mais ampla de tamanhos, proporções e telas do jogo continua nos testes de interface no navegador.

A execução do APK da revisão visual será registrada aqui após a integração das artes finais.
