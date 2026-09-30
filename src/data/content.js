/**
 * Paradise? — conteúdo da campanha em português brasileiro.
 * Fonte primária: Paradise_Documento_Mestre_2D_Pixel_Art.pdf, na raiz.
 * Os identificadores internos não são texto de interface.
 */

export const BIOMES = [
  {
    id: 0, name: 'Jardins Celestes', subtitle: 'Onde a manhã parece durar para sempre',
    description: 'Riachos claros costuram campos de flores e pomares. Caminhos de pedra levam a pequenos refúgios entre árvores frutíferas.',
    palette: { grass: '#72bb68', grassLight: '#9bd777', grassDark: '#4c985d', path: '#e2d3a2', water: '#56bfd3', waterLight: '#a0e8e1', tree: '#3a996b', trunk: '#a07953', accent: '#ffe794', sky: '#c6eff1' },
    ingredient: 'aurora_pollen', bosses: [0, 1], landmark: 'A Árvore das Boas-Vindas',
  },
  {
    id: 1, name: 'Bosque Eterno', subtitle: 'Um teto de folhas e estrelas',
    description: 'Árvores antigas protegem lagos silenciosos. Clareiras floridas, raízes arqueadas e pequenas grutas ligam as trilhas do bosque.',
    palette: { grass: '#57a873', grassLight: '#7bc38b', grassDark: '#377e65', path: '#cbbd95', water: '#53aaa9', waterLight: '#9be0cb', tree: '#277661', trunk: '#8c6b59', accent: '#f0bc89', sky: '#bde5d7' },
    ingredient: 'eternal_sap', bosses: [2, 3], landmark: 'O Carvalho de Mil Copas',
  },
  {
    id: 2, name: 'Campos Dourados', subtitle: 'O horizonte cabe nos olhos',
    description: 'Planícies de capim dourado e flores azuis se abrem ao vento. Colinas suaves escondem hortas, ruínas baixas e trilhas de colheita.',
    palette: { grass: '#c6bc59', grassLight: '#e1d377', grassDark: '#a39944', path: '#efe0b2', water: '#67b9cc', waterLight: '#c0e7db', tree: '#8ba968', trunk: '#ad8053', accent: '#86c1ec', sky: '#d8edf4' },
    ingredient: 'golden_seed', bosses: [4, 5], landmark: 'O Moinho das Brisas',
  },
  {
    id: 3, name: 'Arquipélago Celeste', subtitle: 'Água tão clara quanto o céu',
    description: 'Praias de areia macia conectam ilhotas, lagoas e jardins de coral. Pontes leves e bancos de areia oferecem várias rotas entre as margens.',
    palette: { grass: '#8abf91', grassLight: '#b0d8a0', grassDark: '#63a180', path: '#f0dfb8', water: '#49b9d3', waterLight: '#a7eee8', tree: '#42977c', trunk: '#b48b63', accent: '#f5a8b9', sky: '#c6eff4' },
    ingredient: 'pearl_salt', bosses: [6, 7], landmark: 'A Ponte das Conchas',
  },
  {
    id: 4, name: 'Montanhas Brancas', subtitle: 'Cachoeiras acima das nuvens',
    description: 'Vales verdes atravessam escarpas de pedra branca. Escadas antigas, passagens nas rochas e mirantes revelam cachoeiras cintilantes.',
    palette: { grass: '#91bb9a', grassLight: '#b8d7b2', grassDark: '#6d9b87', path: '#e1e1d5', water: '#72bcd5', waterLight: '#c9edf3', tree: '#558d81', trunk: '#9c9280', accent: '#c6b6ef', sky: '#dcecf6' },
    ingredient: 'white_limestone', bosses: [8, 9], landmark: 'A Escadaria das Águas',
  },
  {
    id: 5, name: 'Floresta das Nuvens', subtitle: 'Folhas que tocam o branco',
    description: 'Uma floresta elevada flutua entre fios de névoa branca. Plataformas naturais, pontes cobertas de musgo e clareiras suspensas formam caminhos de alturas diferentes.',
    palette: { grass: '#83bdad', grassLight: '#b0ddc5', grassDark: '#5b9f98', path: '#d7e0c8', water: '#7bbdc7', waterLight: '#cceff0', tree: '#50988d', trunk: '#a09780', accent: '#f5d4a8', sky: '#e0f2f1' },
    ingredient: 'cloud_dew', bosses: [10, 11], landmark: 'O Jardim Suspenso',
  },
  {
    id: 6, name: 'Jardim de Cristal', subtitle: 'Cada passo encontra uma cor',
    description: 'Flores crescem entre cristais luminosos e lagos refletivos. Grutas de quartzo, jardins de prismas e passagens laterais multiplicam a luz.',
    palette: { grass: '#85b9af', grassLight: '#ace0c4', grassDark: '#599b9b', path: '#d7cced', water: '#76b9d8', waterLight: '#c6eafa', tree: '#688bb0', trunk: '#a49cba', accent: '#e8b6f2', sky: '#dee8f8' },
    ingredient: 'prism_spore', bosses: [12, 13], landmark: 'A Caverna dos Reflexos',
  },
  {
    id: 7, name: 'Ilhas do Céu', subtitle: 'O mundo aprende a flutuar',
    description: 'Grandes ilhas pairam sobre um oceano de nuvens. Arcos de vento, pontes impossíveis e cascatas suspensas conectam jardins que não deveriam existir.',
    palette: { grass: '#95c5b7', grassLight: '#c0e6ca', grassDark: '#6fa7a4', path: '#e7dccb', water: '#86c8de', waterLight: '#d2f4f1', tree: '#629a9b', trunk: '#b1a28a', accent: '#f5ca82', sky: '#d7edf8' },
    ingredient: 'sky_feather', bosses: [14, 15], landmark: 'O Arco do Zéfiro',
  },
  {
    id: 8, name: 'Santuário da Luz', subtitle: 'Jardins ao redor do impossível',
    description: 'Pórticos monumentais cercam rios mansos e pomares geométricos. Pátios, galerias abertas e jardins escondidos se aproximam do coração do paraíso.',
    palette: { grass: '#a5c582', grassLight: '#c8dfa1', grassDark: '#809e68', path: '#f2e4c7', water: '#7ec7d1', waterLight: '#d0f0e3', tree: '#75956e', trunk: '#bba477', accent: '#f6d67a', sky: '#eff2dd' },
    ingredient: 'light_nectar', bosses: [16, 17], landmark: 'O Pórtico das Nove Flores',
  },
  {
    id: 9, name: 'Limite do Paraíso', subtitle: 'A última margem da luz',
    description: 'Terraços claros e jardins silenciosos se abrem sob arcos gigantes. Além dos espelhos d’água, uma fenda luminosa aguarda no horizonte.',
    palette: { grass: '#b3c994', grassLight: '#d8e7b9', grassDark: '#8da97e', path: '#f3edda', water: '#95c9d9', waterLight: '#e0f5ec', tree: '#88aa91', trunk: '#c2b398', accent: '#ffdf91', sky: '#f1f5e9' },
    ingredient: null, bosses: [18, 19], landmark: 'O Anel do Horizonte',
  },
];

export const BOSSES = [
  { id: 0, name: 'Cervaluz', biome: 0, hp: 170, damage: 10, speed: 55, pattern: 'charge', secondary: 'radial', shape: 'stag', color: '#a5ddc8', accent: '#fff0ad', description: 'Galhadas de folhas anunciam uma investida. Saia da linha marcada e aproveite o descanso após a corrida.', telegraphTime: 1.05, patternTime: 3.1, projectileCount: 6 },
  { id: 1, name: 'Casco da Aurora', biome: 0, hp: 200, damage: 12, speed: 29, pattern: 'slam', secondary: 'fan', shape: 'tortoise', color: '#80bba4', accent: '#ffd997', description: 'Um casco coberto de pequenas flores. Seus passos pesados criam ondas circulares, mas deixam espaço entre os ataques.', telegraphTime: 1.15, patternTime: 3.3, projectileCount: 3 },
  { id: 2, name: 'Mariposa de Âmbar', biome: 1, hp: 215, damage: 12, speed: 57, pattern: 'fan', secondary: 'orbit', shape: 'moth', color: '#e3ad6d', accent: '#fff1ba', description: 'As asas espalham pólen em leques. A abertura entre os disparos é o lugar mais seguro para se aproximar.', telegraphTime: 0.9, patternTime: 2.9, projectileCount: 5 },
  { id: 3, name: 'Coruja das Copas', biome: 1, hp: 235, damage: 14, speed: 49, pattern: 'charge', secondary: 'beam', shape: 'owl', color: '#98bbc1', accent: '#e9ddae', description: 'Fecha as asas antes de deslizar pela arena. Seus olhos indicam a direção do próximo feixe de luz.', telegraphTime: 0.95, patternTime: 2.85, projectileCount: 3 },
  { id: 4, name: 'Carneiro Solar', biome: 2, hp: 255, damage: 15, speed: 60, pattern: 'charge', secondary: 'slam', shape: 'ram', color: '#e0bd62', accent: '#fff3bb', description: 'Chifres espiralados e uma juba dourada. Faz investidas curtas seguidas de um impacto: esquive para o lado, não para trás.', telegraphTime: 0.9, patternTime: 2.8, projectileCount: 5 },
  { id: 5, name: 'Grifo da Colheita', biome: 2, hp: 280, damage: 16, speed: 56, pattern: 'fan', secondary: 'charge', shape: 'gryphon', color: '#c5a06d', accent: '#96d9ec', description: 'Um grifo de penas azuis guarda a passagem. Alterna rajadas abertas com voos rasantes, sempre avisados pelo movimento das asas.', telegraphTime: 0.85, patternTime: 2.7, projectileCount: 6 },
  { id: 6, name: 'Caranguejo Pérola', biome: 3, hp: 285, damage: 16, speed: 37, pattern: 'slam', secondary: 'radial', shape: 'crab', color: '#efb0bb', accent: '#fff3d3', description: 'Pinças enormes levantam pequenos círculos de água. Contorne os impactos e ataque entre uma pinça e outra.', telegraphTime: 1.0, patternTime: 2.7, projectileCount: 7 },
  { id: 7, name: 'Raia das Marés', biome: 3, hp: 310, damage: 17, speed: 66, pattern: 'orbit', secondary: 'fan', shape: 'ray', color: '#80cbd8', accent: '#e8f8df', description: 'Navega pelo ar como se fosse água. Dispara gotas em curvas: mantenha uma distância confortável até a volta terminar.', telegraphTime: 0.9, patternTime: 2.6, projectileCount: 6 },
  { id: 8, name: 'Cabra das Cascatas', biome: 4, hp: 320, damage: 18, speed: 64, pattern: 'charge', secondary: 'fan', shape: 'goat', color: '#d4dfe7', accent: '#b9a4e1', description: 'Suas patas deixam faíscas de água. O salto prepara uma corrida rápida; a linha iluminada revela o destino.', telegraphTime: 0.85, patternTime: 2.5, projectileCount: 5 },
  { id: 9, name: 'Serpe de Neve', biome: 4, hp: 345, damage: 19, speed: 45, pattern: 'beam', secondary: 'radial', shape: 'serpent', color: '#acd6e8', accent: '#fff2c9', description: 'Uma serpente feita de água e escamas claras. O feixe atravessa a arena em linha reta; as escamas brilham antes do disparo.', telegraphTime: 1.0, patternTime: 2.65, projectileCount: 8 },
  { id: 10, name: 'Raposa das Brumas', biome: 5, hp: 350, damage: 19, speed: 76, pattern: 'orbit', secondary: 'charge', shape: 'fox', color: '#d6b0df', accent: '#fff2df', description: 'Três caudas de névoa desenham voltas ao redor do alvo. Depois de circular, ela se firma por um instante antes de avançar.', telegraphTime: 0.8, patternTime: 2.45, projectileCount: 6 },
  { id: 11, name: 'Baleia de Algodão', biome: 5, hp: 385, damage: 21, speed: 34, pattern: 'radial', secondary: 'slam', shape: 'whale', color: '#a4d8d2', accent: '#fcf3c5', description: 'Flutua sobre o jardim, soltando anéis de gotas brilhantes. Cada anel tem intervalos; conserve stamina para atravessá-los.', telegraphTime: 1.05, patternTime: 2.8, projectileCount: 9 },
  { id: 12, name: 'Besouro Opalino', biome: 6, hp: 390, damage: 21, speed: 58, pattern: 'charge', secondary: 'beam', shape: 'beetle', color: '#88a8d8', accent: '#f0c0e9', description: 'O casco prismático abre antes de uma arrancada. Ataque o flanco durante a pausa, evitando ficar em frente ao cristal central.', telegraphTime: 0.8, patternTime: 2.4, projectileCount: 7 },
  { id: 13, name: 'Golem Prismático', biome: 6, hp: 420, damage: 22, speed: 31, pattern: 'beam', secondary: 'slam', shape: 'golem', color: '#bba6e0', accent: '#a7f0e6', description: 'Uma constelação de cristais forma braços e um corpo largo. Feixes e impactos se alternam; a luz dos braços anuncia o próximo golpe.', telegraphTime: 1.0, patternTime: 2.6, projectileCount: 8 },
  { id: 14, name: 'Fênix do Zéfiro', biome: 7, hp: 430, damage: 23, speed: 70, pattern: 'fan', secondary: 'charge', shape: 'phoenix', color: '#eebd81', accent: '#b5e3ee', description: 'Penas de luz se abrem em grandes leques. Espere a passagem da rajada para se aproximar durante o pouso.', telegraphTime: 0.8, patternTime: 2.3, projectileCount: 8 },
  { id: 15, name: 'Medusa Celeste', biome: 7, hp: 455, damage: 24, speed: 43, pattern: 'orbit', secondary: 'radial', shape: 'jellyfish', color: '#b9afe4', accent: '#c2f2ea', description: 'Tentáculos luminosos acompanham seu movimento lento. Entre os círculos de luz há corredores seguros que mudam a cada volta.', telegraphTime: 0.9, patternTime: 2.4, projectileCount: 10 },
  { id: 16, name: 'Leão do Pórtico', biome: 8, hp: 470, damage: 24, speed: 65, pattern: 'charge', secondary: 'slam', shape: 'lion', color: '#d6bd72', accent: '#fff0be', description: 'A juba forma um arco dourado. Duas pausas claras separam a investida e o impacto; use-as para atacar e recuperar o fôlego.', telegraphTime: 0.8, patternTime: 2.35, projectileCount: 8 },
  { id: 17, name: 'Pavão de Luz', biome: 8, hp: 495, damage: 25, speed: 42, pattern: 'radial', secondary: 'beam', shape: 'peacock', color: '#8ec5ba', accent: '#ffde87', description: 'Uma cauda enorme abre um mapa de pequenas estrelas. Seus disparos formam padrões amplos e legíveis, com brechas entre as penas.', telegraphTime: 0.85, patternTime: 2.35, projectileCount: 11 },
  { id: 18, name: 'Colosso da Alvorada', biome: 9, hp: 520, damage: 26, speed: 33, pattern: 'slam', secondary: 'beam', shape: 'colossus', color: '#c0d8c5', accent: '#fff0b0', description: 'Uma criatura de arcos e pedra clara sustenta um jardim nas costas. Seus grandes impactos alternam com linhas de luz anunciadas no chão.', telegraphTime: 0.95, patternTime: 2.3, projectileCount: 10 },
  { id: 19, name: 'Flor do Último Horizonte', biome: 9, hp: 630, damage: 28, speed: 47, pattern: 'radial', secondary: 'orbit', shape: 'lotus', color: '#e2bbdf', accent: '#ffedb6', description: 'Pétalas cristalinas protegem uma flor gigantesca. A poção ácida dissolve sua proteção; a última fase reúne pétalas em movimento e ondas de luz.', telegraphTime: 0.8, patternTime: 2.1, projectileCount: 12 },
];

export const ITEMS = {
  wood: { name: 'Madeira celestial', description: 'Madeira leve de árvores vivas. Serve para ferramentas, armas, reparos e acampamentos.', kind: 'resource' },
  stone: { name: 'Pedra clara', description: 'Pedra resistente, fácil de trabalhar. Encontrada em rochas e margens de trilhas.', kind: 'resource' },
  fiber: { name: 'Fibra vegetal', description: 'Fios flexíveis de folhas largas. Úteis para cordas, arcos e abrigos.', kind: 'resource' },
  fruit: { name: 'Fruta do jardim', description: 'Doce e refrescante. Pode ser comida na hora ou preparada em uma refeição.', kind: 'food' },
  water: { name: 'Água cristalina', description: 'Água fresca para matar a sede. Reabasteça perto de rios e fontes.', kind: 'drink' },
  herb: { name: 'Erva serena', description: 'Folhas perfumadas usadas em unguentos de cura.', kind: 'resource' },
  ore: { name: 'Minério luminoso', description: 'Um metal claro encontrado nas rochas. Dá firmeza às armas e ferramentas.', kind: 'resource' },
  crystal: { name: 'Cristal de brisa', description: 'Um cristal translúcido usado em equipamentos e melhorias permanentes.', kind: 'resource' },
  essence: { name: 'Essência cintilante', description: 'Luz condensada deixada pelos invasores. Pode fortalecer seus equipamentos.', kind: 'resource' },
  food: { name: 'Refeição do viajante', description: 'Frutas preparadas em folhas. Recupera bastante fome e um pouco de saúde.', kind: 'food' },
  heal: { name: 'Unguento de ervas', description: 'Uma mistura delicada para recuperar saúde durante a viagem.', kind: 'healing' },
  camp: { name: 'Acampamento dobrável', description: 'Abrigo temporário para dormir. Não altera seu ponto de retorno e não salva a partida.', kind: 'camp' },
  acid: { name: 'Poção ácida', description: 'Mistura dos nove ingredientes regionais. Extremamente corrosiva, dissolve a proteção da Flor do Último Horizonte.', kind: 'quest' },
  axe_tool: { name: 'Machadinha de coleta', description: 'Ferramenta de corte para recolher madeira com mais eficiência. Pode ser reparada no suporte.', kind: 'tool' },
  pickaxe: { name: 'Picareta clara', description: 'Ferramenta para extrair pedra, minério e cristais. Pode ser reparada no suporte.', kind: 'tool' },
  sword: { name: 'Espada da alvorada', description: 'Alcance e velocidade equilibrados. Um corte amplo para quem prefere versatilidade.', kind: 'weapon' },
  axe: { name: 'Machado do pomar', description: 'Golpes fortes em um arco largo. Exige mais fôlego do que a espada.', kind: 'weapon' },
  spear: { name: 'Lança de riacho', description: 'Estocadas longas e estreitas. Mantém uma distância segura de um alvo de cada vez.', kind: 'weapon' },
  hammer: { name: 'Martelo de pedra clara', description: 'Impacto pesado e amplo. O golpe é lento; escolha bem a hora de atacar.', kind: 'weapon' },
  daggers: { name: 'Adagas de folha', description: 'Cortes rápidos de curto alcance. Deixam espaço para se mover entre os golpes.', kind: 'weapon' },
  bow: { name: 'Arco de brisa', description: 'Disparos leves e frequentes. Bom para manter distância e acompanhar alvos móveis.', kind: 'weapon' },
  crossbow: { name: 'Besta de cristal', description: 'Disparo firme e poderoso, seguido de uma recarga mais lenta.', kind: 'weapon' },
  aurora_pollen: { name: 'Pólen da aurora', description: 'Ingrediente dos Jardins Celestes. Brilha nas flores perto das águas.', kind: 'quest' },
  eternal_sap: { name: 'Seiva eterna', description: 'Ingrediente do Bosque Eterno. Uma gota âmbar protegida pelas raízes antigas.', kind: 'quest' },
  golden_seed: { name: 'Semente dourada', description: 'Ingrediente dos Campos Dourados. Guarda o calor suave das grandes planícies.', kind: 'quest' },
  pearl_salt: { name: 'Sal de pérola', description: 'Ingrediente do Arquipélago Celeste. Cristais delicados encontrados junto às lagoas.', kind: 'quest' },
  white_limestone: { name: 'Calcário branco', description: 'Ingrediente das Montanhas Brancas. Um pó mineral recolhido perto das cascatas.', kind: 'quest' },
  cloud_dew: { name: 'Orvalho de nuvem', description: 'Ingrediente da Floresta das Nuvens. Gotas suspensas nas folhas mais altas.', kind: 'quest' },
  prism_spore: { name: 'Esporo de prisma', description: 'Ingrediente do Jardim de Cristal. Um pó iridescente das flores de quartzo.', kind: 'quest' },
  sky_feather: { name: 'Pluma do céu', description: 'Ingrediente das Ilhas do Céu. Uma pluma leve que parece desafiar a gravidade.', kind: 'quest' },
  light_nectar: { name: 'Néctar de luz', description: 'Ingrediente do Santuário da Luz. A última parte da mistura, guardada no jardim dos pórticos.', kind: 'quest' },
};

export const WEAPONS = {
  sword: { name: 'Espada da alvorada', damage: 22, range: 39, stamina: 10, cooldown: 0.40, durability: 280, ranged: false, arc: 1.8, color: '#f3e2bb' },
  axe: { name: 'Machado do pomar', damage: 33, range: 36, stamina: 17, cooldown: 0.65, durability: 260, ranged: false, arc: 2.2, color: '#d8c691' },
  spear: { name: 'Lança de riacho', damage: 25, range: 62, stamina: 12, cooldown: 0.48, durability: 290, ranged: false, arc: 0.6, color: '#acdae0' },
  hammer: { name: 'Martelo de pedra clara', damage: 44, range: 42, stamina: 23, cooldown: 0.88, durability: 320, ranged: false, arc: 2.5, color: '#d1d9d5' },
  daggers: { name: 'Adagas de folha', damage: 13, range: 27, stamina: 6, cooldown: 0.22, durability: 360, ranged: false, arc: 1.3, color: '#b9e9b4' },
  bow: { name: 'Arco de brisa', damage: 17, range: 260, stamina: 9, cooldown: 0.46, durability: 300, ranged: true, arc: 0.12, color: '#cfa57c' },
  crossbow: { name: 'Besta de cristal', damage: 36, range: 310, stamina: 16, cooldown: 0.95, durability: 280, ranged: true, arc: 0.08, color: '#c7b8e7' },
};

export const RECIPES = [
  { id: 'axe_tool', name: 'Machadinha de coleta', description: 'Melhora a coleta de madeira. Ferramentas quebradas podem ser reparadas.', cost: { wood: 4, stone: 3, fiber: 2 }, output: { axe_tool: 1 }, support: false },
  { id: 'pickaxe', name: 'Picareta clara', description: 'Melhora a extração de rochas e cristais.', cost: { wood: 4, stone: 5, fiber: 2 }, output: { pickaxe: 1 }, support: false },
  { id: 'sword', name: 'Espada da alvorada', description: 'Uma arma equilibrada para a primeira viagem.', cost: { wood: 3, stone: 4, fiber: 2 }, output: { sword: 1 }, support: false },
  { id: 'axe', name: 'Machado do pomar', description: 'Um corte mais pesado e amplo. Fabricado na bancada do suporte.', cost: { wood: 5, ore: 4, fiber: 2 }, output: { axe: 1 }, support: true },
  { id: 'spear', name: 'Lança de riacho', description: 'Alcance longo para estocadas precisas.', cost: { wood: 6, stone: 3, fiber: 3 }, output: { spear: 1 }, support: false },
  { id: 'hammer', name: 'Martelo de pedra clara', description: 'Golpes lentos com grande impacto.', cost: { wood: 5, stone: 8, ore: 4 }, output: { hammer: 1 }, support: true },
  { id: 'daggers', name: 'Adagas de folha', description: 'Duas lâminas para ataques rápidos de perto.', cost: { stone: 4, ore: 2, fiber: 3 }, output: { daggers: 1 }, support: true },
  { id: 'bow', name: 'Arco de brisa', description: 'Disparos à distância sem uma mochila cheia de munição.', cost: { wood: 6, fiber: 6 }, output: { bow: 1 }, support: false },
  { id: 'crossbow', name: 'Besta de cristal', description: 'Troca velocidade por um disparo mais forte.', cost: { wood: 6, ore: 5, crystal: 3, fiber: 3 }, output: { crossbow: 1 }, support: true },
  { id: 'food', name: 'Refeição do viajante', description: 'Prepara frutas para uma refeição mais nutritiva.', cost: { fruit: 3, fiber: 1 }, output: { food: 1 }, support: false },
  { id: 'heal', name: 'Unguento de ervas', description: 'Amasse as folhas com água fresca para recuperar saúde.', cost: { herb: 3, water: 1 }, output: { heal: 1 }, support: false },
  { id: 'camp', name: 'Acampamento dobrável', description: 'Um abrigo temporário para dormir longe dos suportes.', cost: { wood: 6, fiber: 6, stone: 2 }, output: { camp: 1 }, support: false },
  {
    id: 'acid', name: 'Poção ácida', description: 'Combine os nove ingredientes para dissolver a proteção do último grande invasor.',
    cost: { aurora_pollen: 1, eternal_sap: 1, golden_seed: 1, pearl_salt: 1, white_limestone: 1, cloud_dew: 1, prism_spore: 1, sky_feather: 1, light_nectar: 1 },
    output: { acid: 1 }, support: true,
  },
];

export const DIALOGUES = {
  opening: [
    { speaker: 'Porteiro', text: 'SEJA BEM-VINDO AO PARAÍSO!' },
    { speaker: 'Viajante', text: 'Eu... onde estou? Não consigo lembrar como cheguei aqui.' },
    { speaker: 'Porteiro', text: 'Sua vida terminou. Esta é sua nova morada. Respire: os jardins estão esperando por você.' },
    { speaker: 'Viajante', text: 'Minha vida terminou? Eu nem lembro meu próprio nome.' },
    { speaker: 'Porteiro', text: 'Uma coisa de cada vez. Siga a trilha até o abrigo. O Guia vai receber você por lá.' },
  ],
  guide: [
    { speaker: 'Guia', text: 'Ah, o novo viajante. Seja bem-vindo aos Jardins Celestes. Sou o Guia.' },
    { speaker: 'Viajante', text: 'O Porteiro disse que eu morri. Mas minhas lembranças... não encontro nenhuma.' },
    { speaker: 'Guia', text: 'Vamos começar pelo que está diante de você. Aqui, cada pessoa recebe uma missão de acordo com as habilidades que tinha em vida.' },
    { speaker: 'Guia', text: 'Sua missão é proteger este lugar. Um desequilíbrio com o submundo abriu uma fenda. Os invasores atravessaram e precisam ser contidos.' },
    { speaker: 'Viajante', text: 'Por que eu? Que habilidade eu tinha para isso?' },
    { speaker: 'Guia', text: 'O corpo se lembra de algumas coisas antes da cabeça. Você vai perceber quando precisar agir.' },
    { speaker: 'Guia', text: 'Primeiro, recolha madeira, pedra e fibras. Fabrique uma machadinha e uma arma. A espada é uma boa companhia para começar.' },
    { speaker: 'Guia', text: 'As frutas matam a fome. A água dos rios mata a sede. Prepare comida e unguentos para os caminhos mais longos.' },
    { speaker: 'Guia', text: 'Os suportes são lugares seguros: você pode descansar, fabricar, reparar e guardar seus recursos. Cada um tem seu próprio baú.' },
    { speaker: 'Guia', text: 'Ao visitar um suporte, ele se torna seu ponto de retorno. Você também poderá viajar para os suportes que já conhece.' },
    { speaker: 'Guia', text: 'Acampamentos servem para dormir durante a exploração. Eles não substituem um suporte e não registram seu ponto de retorno.' },
    { speaker: 'Guia', text: 'Não passe noites demais acordado. O cansaço torna o caminho mais difícil. Caminhe para recuperar o fôlego e use a esquiva quando um ataque for anunciado.' },
    { speaker: 'Guia', text: 'Existem dez regiões e vinte grandes invasores. Nos primeiros nove lugares, procure também um ingrediente especial. Guarde todos para uma única mistura.' },
    { speaker: 'Guia', text: 'Não precisa enfrentar cada criatura que encontrar. Explore, prepare-se e escolha seus caminhos. Eu volto a encontrar você mais adiante.' },
  ],
  guideReturn: [
    { speaker: 'Guia', text: 'Você chegou longe. Os jardins continuam lindos, não acha?' },
    { speaker: 'Viajante', text: 'Às vezes alguma coisa parece familiar. Uma palavra, um som... e logo desaparece.' },
    { speaker: 'Guia', text: 'Você ainda está se acostumando. Concentre-se no que pode fazer agora.' },
    { speaker: 'Guia', text: 'O Limite do Paraíso só estará pronto quando os dezoito grandes invasores das outras regiões forem vencidos e os nove ingredientes estiverem reunidos.' },
    { speaker: 'Guia', text: 'Pode ter deixado uma trilha ou um confronto para depois. Use os suportes para voltar e cuidar dessas pendências.' },
    { speaker: 'Guia', text: 'Prepare a poção ácida na bancada. A Flor do Último Horizonte tem uma proteção que só essa mistura consegue dissolver.' },
    { speaker: 'Guia', text: 'Depois, a energia que ela guarda será sua. Use-a nos três nós ao redor da fenda. Você está perto de terminar sua missão.' },
  ],
  riftComplete: [
    { speaker: 'Viajante', text: 'A fenda se fechou. Consegui... os jardins estão seguros.' },
    { speaker: 'Guia', text: 'Parabéns. Você concluiu sua missão.' },
    { speaker: 'Guia', text: 'Obrigado por todo o trabalho.' },
  ],
};

// Nenhum lapso deve antecipar a identidade do viajante ou a natureza da sentença.
export const MEMORIES = [
  'Por um instante, o cheiro das flores parece o de uma cozinha. A lembrança vai embora antes de ganhar forma.',
  'Uma porta entreaberta. Luz do lado de dentro. Você tenta lembrar quem esperava ali, mas só encontra silêncio.',
  'O vento parece dizer seu nome. Quando você para para ouvir, já é apenas vento.',
  'Suas mãos conhecem esse movimento. Você não sabe de onde.',
  'Uma xícara clara, duas cadeiras, o som de alguém rindo. O rosto não aparece.',
  'Um corredor comprido. Você sente que já esteve lá, mas não reconhece nenhuma das portas.',
  'Um zumbido breve atravessa o ar. Parece antigo. A brisa o leva embora.',
  'Você quase consegue lembrar de uma promessa. As palavras se desfazem quando tenta dizê-las.',
  'Por um instante, há outro reflexo na água. Quando você pisca, está sozinho de novo.',
];

/**
 * A UI inicia esta sequência somente depois do fechamento jogável da fenda.
 * visual é uma chave de montagem: as cenas usam registros reais de memoryEvents.
 * Não acrescentar diálogo após a última entrada.
 */
export const REVELATION = [
  { speaker: 'Guia', text: 'Parabéns. Você concluiu sua missão.', visual: 'rift' },
  { speaker: 'Guia', text: 'Obrigado por todo o trabalho. Cada etapa saiu exatamente como precisava sair.', visual: 'rift' },
  { speaker: 'Viajante', text: 'Então acabou? Eu posso descansar agora?', visual: 'rift' },
  { speaker: 'Guia', text: 'A missão acabou. Agora falta lembrar por que ela foi feita para você.', visual: 'bosses' },
  { speaker: 'Guia', text: 'Você não era um herói em vida. Era um assassino em série. Matou vinte pessoas.', visual: 'bosses' },
  { speaker: 'Viajante', text: 'Não... eu só enfrentei criaturas. Eu estava protegendo este lugar.', visual: 'bosses' },
  { speaker: 'Guia', text: 'Vinte grandes invasores. Vinte vítimas. Cada combate fez você repetir, simbolicamente, um assassinato que cometeu.', visual: 'bosses' },
  { speaker: 'Guia', text: 'Os gestos que suas mãos conheciam, os lugares que pareciam familiares... eram pedaços da sua vida tentando voltar.', visual: 'bosses' },
  { speaker: 'Guia', text: 'A última delas era sua namorada. Você a amava. Ela descobriu quem você era e decidiu denunciar seus crimes.', visual: 'acid' },
  { speaker: 'Guia', text: 'Você escolheu silenciá-la. Hesitou, sentiu tristeza e, mesmo assim, colocou veneno no que ela beberia.', visual: 'acid' },
  { speaker: 'Viajante', text: 'A xícara... a voz que eu quase lembrava...', visual: 'acid' },
  { speaker: 'Guia', text: 'Por isso o último confronto foi o mais difícil. E por isso você percorreu nove regiões para fabricar a poção que derreteu aquela criatura. A mistura refez o envenenamento.', visual: 'acid' },
  { speaker: 'Guia', text: 'Seus crimes foram descobertos. Você foi preso, condenado à morte e executado na cadeira elétrica.', visual: 'electric' },
  { speaker: 'Guia', text: 'A energia elétrica e magnética que recebeu no fim é a lembrança da sua própria execução. Com ela, você terminou a última etapa da falsa missão.', visual: 'electric' },
  { speaker: 'Viajante', text: 'Se este é o paraíso... por que eu ainda tenho fome? Por que eu sinto sede, cansaço, dor?', visual: 'survival' },
  { speaker: 'Guia', text: 'Porque você nunca esteve no paraíso. Quem chega ao paraíso conserva a identidade e as lembranças. Este lugar é o inferno, construído para a sua sentença.', visual: 'survival' },
  { speaker: 'Guia', text: 'Não houve invasão. Não há desequilíbrio entre os mundos. A fenda também era parte da ilusão. Comer, fabricar, lutar e reparar eram o trabalho que você aprendeu a chamar de missão.', visual: 'survival' },
  { speaker: 'Guia', text: 'Eu não sou seu mentor. Sou o administrador da sua punição. Ensinei você a executá-la e acompanhei cada passo.', visual: 'respawn' },
  { speaker: 'Viajante', text: 'E se eu me recusar? E se eu morrer?', visual: 'respawn' },
  { speaker: 'Guia', text: 'Aqui, a morte só devolve você ao caminho. Não existe fuga por ela. Não existe libertação como recompensa, nem redenção ao terminar.', visual: 'respawn' },
  { speaker: 'Guia', text: 'Sua sentença é esquecer, acreditar, matar de novo, repetir sua própria morte e descobrir a verdade. Depois, esquecer outra vez. O ciclo não termina.', visual: 'respawn' },
  { speaker: 'Viajante', text: 'Eu lembro dela agora. Não tire isso de mim. Por favor...', visual: 'erase' },
  { speaker: 'Narrador', text: 'A xícara perde a cor. Os rostos se desfazem. As palavras escapam uma a uma. Até a certeza do que aconteceu desaparece.', visual: 'erase' },
  { speaker: 'Narrador', text: 'O mesmo jardim. A mesma manhã. Um homem desperta sem saber como chegou ali.', visual: 'opening' },
  { speaker: 'Porteiro', text: 'SEJA BEM-VINDO AO PARAÍSO!', visual: 'opening' },
];
