# Paradise?

Leia o `Paradise_Documento_Mestre_2D_Pixel_Art.pdf` na raiz antes de decisões importantes. Ele é a fonte primária. A extração integral está em `docs/documento-mestre.txt`; não a substitua por um resumo.

Todo o texto visível no jogo e toda comunicação com o usuário devem usar pt-BR. Preserve o mundo bonito e paradisíaco, a arte desenhada em pixels, a perspectiva top-down e o combate arcade. Mantenha as relações narrativas e a ordem final do documento. Alterações explícitas posteriores do usuário têm prioridade.

Trabalhe somente nesta pasta e em seus subdiretórios. Não publique o jogo ou envie mensagens externas sem autorização pertinente.

Arquitetura: Canvas 2D + ES modules, execução local sem dependências. Contratos em `docs/arquitetura.md`, implementação em `src/`, arte em `assets/`, testes em `tests/`. PNGs exportados têm fontes editáveis em src/render/ e exportação pelo renderer; catálogo em `assets/sprites/catalogo.json`.

Comandos:

- `npm start`: servidor local, porta 5173.
- `npm run check`: sintaxe.
- `npm test`: sistemas e campanhas completas.
- `EXPORT_CAMPAIGN=1 npm test`: também gera o fixture final em `tests/artifacts/`.
- `node tests/browser.mjs`: integração visual/interface, exige servidor ativo e Playwright no ambiente de desenvolvimento.
- `node scripts/export-art.mjs`: atualiza as folhas de arte, exige servidor e Playwright.

Não considere criação de arquivos como conclusão. Preserve a campanha do início ao encerramento, a retomada de saves e a integridade das ações que alimentam os replays. Teste conforme o impacto das mudanças; os limites da validação atual estão em `docs/validacao.md`.
