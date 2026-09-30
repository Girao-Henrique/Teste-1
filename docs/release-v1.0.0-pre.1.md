# Paradise? — PC e Android

Versão para testes com campanha, interface e diálogos em português brasileiro.

## Downloads

- **Paradise-Windows-x64.exe**: Windows 10/11 de 64 bits. Executável portátil; baixe e abra. Não precisa de Node.js, servidor ou navegador instalado.
- **Paradise-Android.apk**: Android 8 ou superior, com Android System WebView 109 ou superior. Abra no celular e autorize a instalação pelo aplicativo usado para abrir o arquivo. Jogue na horizontal, com controles de toque.
- **SHA256SUMS.txt**: hashes para conferir os dois arquivos.

Os aplicativos incorporam o jogo e funcionam offline. Exportar e importar salvamentos permite transferir a mesma partida entre PC e Android. Faça um backup antes de desinstalar ou limpar os dados.

O executável Windows não tem certificado comercial de assinatura e pode exibir aviso de aplicativo não reconhecido. O APK tem assinatura local do projeto, para instalação direta; não está na Play Store.

## Validação e limites

Passaram os testes de sistemas, campanhas nas duas dificuldades, teclado, gamepad simulado, interface móvel com multitoque, pausa, salvamentos e encerramento. O aplicativo Electron abriu no ambiente Linux sem servidor; assinatura e conteúdo do APK foram verificados.

A execução do executável em Windows e a abertura do APK em Android nativo ainda não foram confirmadas. O emulador sem aceleração de hardware não concluiu a instalação. Nenhum dispositivo físico foi testado nesta sessão.

Consulte `docs/distribuicao.md` e `docs/validacao.md` no repositório para instalação, compilação e detalhes dos testes.
