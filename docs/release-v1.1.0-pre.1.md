# Paradise? — atualização visual 1.1.0

Revisão completa da apresentação em pixel art, mantendo a campanha e o Documento Mestre.

- Viajante, sete armas, Porteiro, Guia, invasores e vinte chefes redesenhados, com poses e animações individuais.
- Dez biomas com terrenos conectados, vegetação volumétrica, arquitetura e marcos próprios, água animada e efeitos acolhedores.
- Fonte, marca, retratos, ícones, botões, menus, cartografia e HUD originais; dezesseis folhas de arte editáveis.
- Layout adaptativo em retrato, paisagem, telas quadradas e ultrawide; tela cheia nativa no PC e Android, com proteção das áreas seguras.
- Câmera de combate enquadra jogador e chefe na área livre dos controles, inclusive nas arenas próximas à borda do mapa.

## Downloads

- **Paradise-Windows-x64.exe**: executável portátil, Windows 10/11 de 64 bits. Baixe e abra.
- **Paradise-Android.apk**: Android 8+ com Android System WebView atualizado. Instalação direta, controles por toque, retrato e paisagem.
- **SHA256SUMS.txt**: hashes dos dois aplicativos.

Os aplicativos funcionam offline. Exportar e importar salvamentos permite transferir sua jornada entre PC e Android. A atualização Android usa a mesma chave da versão anterior e mantém o formato dos saves.

## Verificação

Testes de sistemas e campanhas nas duas dificuldades, teclado, gamepad simulado, menus, fabricação, salvamento, multitoque, rotação e encerramento passaram. A matriz visual cobre do celular de 320×568 ao ultrawide de 2560×1080, com verificações de cortes, proporção e sobreposições.

O executável empacotado também abriu no Windows do GitHub Actions: introdução, fonte, marca, movimento, pausa e tela cheia passaram.

O APK teve assinatura e instalação verificadas. A execução Android nativa permanece pendente: o WebView do emulador falhou na inicialização interna do V8, antes de carregar os módulos do jogo. Dois aplicativos de controle sem conteúdo do jogo também não abriram. A interface por toque passou no Chromium, mas isso não comprova a execução em aparelho Android.

Os detalhes e limites são registrados em [validação](https://github.com/Girao-Henrique/Teste-1/blob/main/docs/validacao.md), [testes visuais](https://github.com/Girao-Henrique/Teste-1/blob/main/docs/qa-visual.md) e [teste Android nativo](https://github.com/Girao-Henrique/Teste-1/blob/main/docs/android-native-qa.md). Esta é uma versão para testes; desempenho e compatibilidade em aparelhos físicos ainda precisam de playtest.

O executável Windows não possui certificado comercial. O APK é assinado pelo projeto para instalação direta e não está na Play Store.
