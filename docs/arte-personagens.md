# Atelier de personagens

A arte de personagens é desenhada por `src/render/character-art.js`. Não usa sprites, modelos, animações ou personagens de bibliotecas. As quatro funções públicas recebem o renderer, o contexto Canvas e as entidades existentes, preservando as coordenadas, os estados do combate e as áreas de colisão da simulação.

O traço é construído com retângulos, elipses por linhas de pixels, polígonos por varredura e linhas de Bresenham. Todos os pontos são arredondados antes da rasterização. Não há rotação ou interpolação de bitmaps: contornos, facetas, pregas e luz permanecem definidos no pixel. A luz vem do alto à esquerda; as sombras das criaturas misturam sua própria cor com o azul profundo comum do mundo. Creme, jade e latão ligam personagens, equipamentos e interface.

O viajante usa casaco jade, capa curta de linho, gola creme assimétrica, alça de couro, bolsa lateral e bússola de latão. O cabelo castanho, a ponta da gola e os sapatos claros tornam a silhueta reconhecível sem esconder os pés. Oito direções mudam rosto, olhos, mão armada e desenho das costas. A caminhada usa oito poses econômicas, alternando pernas, braços e capa. A corrida acelera o ciclo e aumenta o movimento da capa; a velocidade é observada apenas na apresentação. A esquiva baixa o corpo e deixa três silhuetas breves. Respiração e piscadas pontuais dão vida à espera. Os registros de morte mostram uma pose de queda própria, de olhos fechados, sem sangue ou gore.

As sete armas possuem desenhos e movimentos próprios. A espada tem nervura e guarda dourada; o machado tem cabeça assimétrica e fio claro; a lança combina madeira, amarração jade e ponta de riacho; o martelo tem pedra facetada e reforço de latão; as adagas trabalham em par; o arco curva-se em quatro segmentos e recolhe a corda ao carregar; a besta acrescenta coronha e cristal central. A mão acompanha a direção e a fase do ataque. O carregamento contrai a pose antes do golpe e conserva o indicador de força. Os rastros permanecem fora do corpo para manter o alvo visível.

O Porteiro é mais largo, tem cabelo prateado, barba curta, pelerine creme, gola jade, fecho de latão e bastão floral. O Guia é mais estreito, tem cabelo médio prateado, manto jade, faixa marfim, bússola e livro cartográfico aberto com marcador dourado. Ambos respiram, piscam e movem suas vestes discretamente. Os retratos seguem essas mesmas roupas e proporções.

Os quatro invasores comuns têm silhuetas próprias: corredor com orelhas de folhas, mariposa de asas marcadas, casco-jardim coberto de pequenas flores e lince de plumas. Antecipação e ataque mudam corpo e membros, usando os estados reais da simulação. Seleção e vida continuam visíveis, e o sinal de preparação fica acima da criatura.

Os vinte chefes foram redesenhados individualmente:

| Chefe | Assinatura visual e movimento |
| --- | --- |
| Cervaluz | Galhadas ramificadas com folhas, peito de jade e manchas creme; inclina a cabeça antes de avançar. |
| Casco da Aurora | Casco segmentado, aro claro e jardim de flores; recolhe a cabeça e prepara o impacto. |
| Mariposa de Âmbar | Asas superiores angulares, ocelos de jade, asas inferiores em leque; fecha e expande os quatro planos das asas. |
| Coruja das Copas | Discos faciais creme, sobrancelhas de folhas e penas sobrepostas; fecha as asas e aproxima o rosto. |
| Carneiro Solar | Lã em cachos, chifres espirais com anéis e pequeno brilho solar; baixa a cabeça para a corrida. |
| Grifo da Colheita | Penas azuis em cinco camadas, corpo dourado, bico de latão e cauda floral; arma as asas antes da rajada. |
| Caranguejo Pérola | Pinças assimétricas, seis pernas articuladas e pérola central; levanta as pinças durante a preparação. |
| Raia das Marés | Asas largas em camadas, manchas de pérola e cauda em folha; ondula as bordas sem tapar a marcação do chão. |
| Cabra das Cascatas | Chifres claros curvos, pelos pendentes e barba lilás; alterna os cascos e reúne o corpo para o salto. |
| Serpe de Neve | Corpo segmentado em curva, crista clara e aletas laterais; escamas percorrem a ondulação. |
| Raposa das Brumas | Três caudas grandes com pontas creme, máscara triangular e orelhas altas; caudas oscilam em ritmos opostos. |
| Baleia de Algodão | Ventre canelado, nadadeira clara, cauda dividida e gotas sobre o dorso; flutua e flexiona a nadadeira. |
| Besouro Opalino | Élitros facetados em duas peças, gemas centrais, chifre e seis pernas; abre o casco antes de atacar. |
| Golem Prismático | Constelação sem rosto ou anatomia humana: cristal central e três satélites; aproxima os fragmentos na preparação e os afasta no ataque. |
| Fênix do Zéfiro | Seis camadas de penas por asa, cauda longa e crista azul; fecha o leque e o abre durante a rajada. |
| Medusa Celeste | Cúpula facetada, sete fitas claras e gemas nas pontas; contrai a cúpula e oscila os tentáculos. |
| Leão do Pórtico | Juba radial em catorze folhas, patas largas e cauda dourada; inclina o rosto antes da investida. |
| Pavão de Luz | Nove plumas com ocelos, pescoço de jade e crista de gemas; recolhe e abre a cauda em cada fase do disparo. |
| Colosso da Alvorada | Santuário quadrúpede com arcos claros e jardim nas costas; ergue o dorso antes do impacto. |
| Flor do Último Horizonte | Duas coroas de pétalas cristalinas, folhas de jade e sementes douradas; fecha e abre suas camadas, que se reduzem progressivamente após a poção. |

Os chefes têm oito quadros de movimento e três grupos de poses: repouso, preparação e ataque. As imagens são armazenadas em cache no renderer, com chaves próprias por criatura, paleta, quadro, pose, dano e estágio da dissolução. A folha existente de 128 × 112 pixels por chefe continua compatível com a exportação. As células do viajante passaram a 64 × 64 pixels no movimento e 144 × 112 no combate para preservar armas e rastros completos. Nenhum desenho introduz símbolos demoníacos, sangue ou pistas humanas que antecipem a revelação.

Esta revisão altera exclusivamente a apresentação. Dano, alcance, velocidade, stamina, dificuldade, progressão, identidade dos chefes e revelação final continuam definidos pelo Documento Mestre e pela simulação existente.
