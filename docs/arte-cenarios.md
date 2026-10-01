# Cenários de Paradise?

O Documento Mestre da raiz define o mundo: bonito, acolhedor, colorido e progressivamente mais fantástico. A nova arte conserva os dez biomas, suas rotas, recursos, pontos de suporte, arenas e marcos. Não altera colisões nem a progressão.

Toda a arte de cenário tem fonte editável em `src/render/environment-art.js`. As formas são rasterizadas em coordenadas inteiras, sem filtros fotográficos, bibliotecas de sprites ou imagens externas. Os sprites exportados pelo renderer usam essas mesmas rotinas.

## Identidade visual

A luz vem do alto à esquerda. Folhas têm quatro planos de cor: sombra azul-esverdeada, cor local, jade iluminado e reflexo amarelo suave. Pedra clara usa facetas de marfim e sombras frias; ferragens e inscrições usam ouro. Texturas são agrupadas em pequenos conjuntos de pixels, evitando ruído distribuído aleatoriamente sobre toda a superfície.

As copas combinam volumes angulares de diferentes alturas, folhas recortadas, galhos e raízes visíveis. Pomares possuem frutos próprios. Árvores antigas têm troncos largos e vinhas. Palmeiras têm troncos curvados, anéis e seis frondes distintas. Pinheiros usam três camadas de folhagem com bordas claras. Árvores prateadas possuem flores claras e folhas de jade pálido. O tamanho-base permanece em 72 × 86 pixels, com o contato no solo preservado.

Os terrenos usam transições conectadas. Trilhas têm bordas irregulares de vegetação, água possui faixas rasas e margens claras, pontes têm tábuas e ferragens, escarpas comunicam a face vertical com pedra facetada e jardins monumentais usam lajes maiores. Nas Ilhas do Céu, a água aparente se torna uma passagem de nuvens abaixo das ilhas. Os caminhos e o centro das arenas permanecem livres para ler o combate.

## Marcos das dez regiões

| Região | Marco e tratamento |
| --- | --- |
| Jardins Celestes | Árvore frutífera monumental com balanço, pássaro e flores na base. |
| Bosque Eterno | Carvalho antigo com raízes largas, vinhas, lanternas e pequeno recanto de leitura. |
| Campos Dourados | Moinho de pedra com telhado verde-azulado, quatro pás de treliça, bandeirola e canteiros. |
| Arquipélago Celeste | Ponte elevada com degraus, balaustradas, pilares de concha e pérola central. |
| Montanhas Brancas | Escadaria branca com canal central, fonte superior e cachoeira animada. |
| Floresta das Nuvens | Jardim suspenso por correntes ornamentais, flores grandes e vinhas sob a bacia. |
| Jardim de Cristal | Gruta enquadrada por uma geoda monumental de prismas com três facetas e espelho d’água. |
| Ilhas do Céu | Pórtico alado com penas de pedra, emblema suspenso e pequenos fragmentos flutuantes. |
| Santuário da Luz | Pórtico de quatro colunas, frontão verde-jade, nove flores e lanternas douradas. |
| Limite do Paraíso | Anel monumental de pedra com segmentos esculpidos, instrumento orbital e luz central. |

Refúgios são pavilhões com telhas, brasão solar, estandartes, cama, baú e lanterna. Acampamentos são tendas de tecido com entrada legível, cordas, suprimentos e pequena fogueira. Grutas, pórticos, colunas, pedestais, fontes e observatórios possuem arte própria.

Os nove ingredientes regionais têm silhuetas diferentes: flor de pólen, seiva âmbar, espigas douradas, concha com pérola, calcário branco, gota de orvalho, prisma florido, pena celeste e flor de néctar. Recursos comuns também se distinguem por forma e material.

## Movimento e desempenho

As animações são econômicas: copas e folhas têm duas posições de vento; flores e espigas oscilam em fase; fogo usa quatro poses; peixes movem a cauda; água combina faixas, reflexos e ondulações em seis atualizações por segundo. O moinho gira por poses discretas. Lanternas, balanço, pássaro, cachoeiras, instrumentos orbitais e luzes dos marcos possuem movimentos próprios.

O terreno é composto uma única vez por região com tiles em cache. Árvores, contornos das arenas e partes estáticas dos dez marcos são armazenados em canvases. Só os elementos vivos são repintados a cada quadro. A câmera usa as dimensões reais do canvas e suporta formatos de tela diferentes.

As copas e os marcos continuam permitindo a transparência de oclusão aplicada pelo renderer quando cobrem personagens. Nenhum detalhe decorativo introduz um obstáculo ou uma coleta inacessível.

## Revisão realizada

Foram geradas e inspecionadas galerias dos sete tipos de árvore nas dez paletas, dos dez marcos, das estruturas, recursos e ingredientes. No renderer integrado, a revisão cobriu uma entrada e um marco em cada região. Os dez biomas renderizaram sem erros; comparações entre dois instantes registraram mudanças reais de pixels em todas as regiões. Capturas e medições locais ficam em `tests/artifacts/environment-*.png` e `tests/artifacts/environment-runtime.json`.

O desenho em cache teve média de 2 a 7 ms por quadro em uma rodada de referência a 640 × 360 na máquina da nuvem. A execução paralela de outros testes aumentou a variação das medições. Esses valores descrevem o ambiente de desenvolvimento e não certificam FPS em celulares ou PCs físicos.

Os ícones dos aplicativos compartilham o pórtico, estrela e ramos do favicon original: PNG de 512 × 512, ICO com sete resoluções e vetor Android centralizado na área segura de um fundo jade. Os tamanhos do ICO conservam as seis cores sólidas do desenho, sem suavização.
