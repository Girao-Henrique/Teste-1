# Direção de arte — a janela do paraíso

O Documento Mestre da raiz continua sendo a referência. Esta revisão muda a apresentação, sem alterar os dez biomas, os vinte chefes, os sistemas ou a estrutura narrativa.

## Linguagem própria

A composição usa verde jade, sombras azuladas, marfim e pequenos acentos de dourado. Jardins, estrelas de quatro pontas, folhas e portais são os motivos que unem cenário, marca, molduras, ícones e efeitos. Cada bioma mantém sua paleta e arquitetura específicas; a monumentalidade cresce com a campanha, preservando a beleza e a fantasia.

As formas são construídas em pixels inteiros. A luz vem do alto à esquerda, com grupos de pixels que descrevem volume e materiais. Árvores têm ramos, copas articuladas e frutos reconhecíveis; caminhos, margens e elevações precisam continuar claros. Personagens têm silhuetas e roupas próprias; invasores e chefes possuem anatomias fantásticas diferenciadas.

Todos os recursos gráficos e a fonte Paradise são originais do projeto. A fonte possui um gerador editável em `scripts/art/`; os sprites, retratos, cenários e efeitos têm rotinas editáveis em `src/render/`. Electron e o WebView são meios de execução, sem bibliotecas visuais ou pacotes de arte de terceiros.

## Animação e leitura

Movimento, respiração, roupas, armas, criaturas, água, vegetação e portais usam poses e ciclos curtos. Antecipação e impacto devem distinguir as categorias de arma e os padrões de ataque. Efeitos decorativos ficam abaixo da prioridade de personagens, alvos e limites de perigo.

A interface tem entradas suaves, foco visível, respostas de botão, barras com transição e molduras desenhadas para o jogo. A opção de movimento reduzido e a preferência do sistema limitam animações e flashes. Menus e cenas continuam pausando a simulação.

## Telas e plataforma

O Canvas ocupa a área disponível; a resolução lógica e a câmera acompanham a proporção da tela. Em batalhas em paisagem com altura de até 420 pixels, o eixo curto lógico passa de 360 para 480 pixels para mostrar os dois combatentes; o foco considera a área livre do HUD e permite uma margem de céu nas arenas próximas às bordas. Não há estiramento independente dos eixos nem imposição de 16:9. A interface reorganiza faixas, cartões e controles, com rolagem interna nos painéis. O Android aceita retrato e paisagem, com áreas seguras para recortes da tela; o PC pode alternar tela cheia pelo sistema nativo.

A revisão visual é verificada em celulares pequenos, retrato, paisagem, tablets, telas quadradas e ultrawide. Botões, HUD, controles de toque e habilidades especiais são testados em conjunto; a campanha continua coberta pelos testes de sistemas e progressão.
