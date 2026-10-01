# Aplicativos para PC e Android

## Arquivos para jogar

- `builds/windows/Paradise-Windows-x64.exe`: executável portátil para Windows 10/11 de 64 bits. Baixe e abra; não precisa de Node.js, servidor nem navegador instalado. Os arquivos do jogo são incorporados ao aplicativo.
- `builds/android/Paradise-Android.apk`: APK universal para Android 8 ou superior. Transfira para o celular, abra e autorize a instalação pelo aplicativo usado para abrir o arquivo. Requer Android System WebView 109 ou superior; mantenha esse componente atualizado pela Play Store. O jogo aceita retrato e paisagem, com controles reorganizados e respeito à área segura da tela.

Ambos funcionam offline. O APK não solicita permissão de internet nem acesso amplo ao armazenamento. A seleção de backups usa o seletor de arquivos do sistema.

O executável Windows não tem certificado comercial de assinatura; o Windows pode mostrar um aviso de aplicativo não reconhecido. O APK é assinado com a chave local do projeto, para instalação direta, e ainda não foi publicado na Play Store.

## Controles e salvamentos

PC: teclado, mouse e gamepad. F11 alterna tela cheia. Android: direcional virtual, botões de ataque, carregamento, esquiva, corrida, interação e troca de alvo; provisões no centro inferior e mochila, mapa e pausa no canto superior. Ataque e movimento aceitam multitoque. Gamepad permanece disponível quando reconhecido pelo dispositivo.

A partida fica guardada no próprio aplicativo. Ir para segundo plano no Android pausa e salva a partida. O botão Voltar pausa ou fecha o painel atual; no menu inicial, fecha o aplicativo. Exporte um backup pelo menu de pausa antes de limpar dados ou desinstalar. Use Importar salvamento para migrar entre PC e Android. Uma nova versão portátil no Windows mantém os dados do mesmo usuário.

## Gerar novas versões

A raiz do projeto deve permanecer como diretório de trabalho. Não inclua Documento Mestre, saves pessoais ou chaves de assinatura no pacote do jogo.

```bash
npm ci
node node_modules/electron/install.js
npm run build:windows
```

O pacote Windows usa Electron e electron-builder, com recursos estáticos em `www/` e protocolo local `paradise://`. Node.js não é exposto ao conteúdo da janela. O build requer Node.js 22.12 ou superior, ou Node.js 24.

Para Android, o script atual foi implementado para um ambiente Linux com JDK, `zip` e Android SDK: plataforma 35 e build-tools 35.0.0. Defina `JAVA_HOME` e `ANDROID_SDK_ROOT` quando usar instalações externas; neste ambiente, as ferramentas estão em `.cache/`, dentro do projeto.

```bash
npm run build:android
```

A compilação usa `aapt2`, `javac`, `d8`, `zipalign` e `apksigner`, sem dependência de Gradle. O APK contém o mesmo jogo e uma Activity Android com WebView que serve exclusivamente os arquivos incorporados.

Preserve `android/signing/paradise.p12` e `android/signing/local.json` em um backup privado: são necessários para assinar atualizações que mantenham a instalação e os dados. Esses arquivos são ignorados pelo Git e não entram no APK. Aumente `versionCode` em `android/version.json` e a versão em `package.json` antes de distribuir uma atualização Android.

## Validação

`npm run check` e `npm test` verificam sintaxe, sistemas e campanhas completas nas duas dificuldades. Com o servidor de desenvolvimento ativo e Playwright instalado, `node tests/browser.mjs` verifica teclado, gamepad, menus, salvamento e encerramento; `npm run test:mobile` verifica menus de celular, multitoque, pausa, salvamento, rotação e encerramento por toque. Gere antes o save de teste com `EXPORT_CAMPAIGN=1 npm test`.

O aplicativo Electron foi aberto no ambiente Linux com os recursos incorporados, sem servidor HTTP. A geração do executável Windows foi validada, mas sua execução precisa ser confirmada em um PC Windows. A assinatura do APK foi verificada com `apksigner`; testes em dispositivo físico permanecem necessários para avaliar desempenho, áudio e compatibilidade de fabricantes.

A instalação no emulador desta nuvem não concluiu devido à inicialização sem aceleração de hardware. A abertura do APK em Android nativo ainda precisa ser confirmada; os testes de toque foram executados em Chromium móvel.

## Publicação pelo GitHub Actions

O workflow manual `Publicar aplicativos Paradise?` gera o executável em Windows e publica os anexos de uma release de teste já preparada. O APK assinado fica em `distribution/android/`; sua chave não entra no repositório. O workflow confere o hash antes de enviar e mantém a release como prévia. A opção `publicar=false` anexa os arquivos mantendo o rascunho enquanto terminam as demais validações; depois a release pode ser publicada pelo GitHub. Atualizações Android exigem substituir o APK e seu hash após compilação com a mesma chave local.
