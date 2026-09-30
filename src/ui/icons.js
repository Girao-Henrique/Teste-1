// Ícones originais de Paradise?: desenhos em uma grade real de 16 × 16 pixels.
// Cada caractere é um pixel. Ponto é transparência; nenhum glifo de fonte é usado.
const PALETTE = {
  O: '#25423c', B: '#705344', b: '#a07854', w: '#d3a875',
  G: '#416849', g: '#739760', l: '#bed18e',
  T: '#397f84', t: '#68b2b3', a: '#b8e3d4',
  Y: '#a0824d', y: '#d8b86f', j: '#f2dda0', C: '#f7efd6',
  S: '#5e777b', s: '#9db0ad', c: '#e2e9d9',
  R: '#9a6154', r: '#cf8770', p: '#f2b68b',
  V: '#827c9f', v: '#b1accd', u: '#e0d8ea',
};

const PIXELS = {
  wood: [
    '......OOOO...', '....OObbwwO..', '...ObbwwwwbO.', '..ObbwwbbbbO.',
    '.ObbwwbbbBO..', 'ObbwwbbbBO...', 'ObwbbbBBO....', 'ObbbBBO......',
    '.OwwbO.......', '.OwbBO.......', '..OOO........',
  ],
  stone: [
    '.....OOOO....', '...OOccccO...', '..OccccssSO..', '.OccccsssSO..',
    '.OcccsssSSSO.', 'OcccsssSSSSO.', 'OcssssSSSSSO.', 'OssSSSSSSSO..',
    '.OOSSSSSOO...', '...OOOOO.....',
  ],
  fiber: [
    '..OO....OO...', '..OlO..OlO...', '..OglOOglO...', '.OgllOgllO...',
    '.OglgOglgO...', '.OgglOgglOO..', '..OggOgglgO..', '..OggOgggO...',
    '...OyyyyO....', '...OjjyyO....', '....ObbO.....', '....ObbO.....',
    '.....OO......',
  ],
  fruit: [
    '......OO.....', '....OOglO....', '....OglGO....', '.....ObO.....',
    '..OOOOOOOO...', '.OrpprrrrpO..', 'OrpCprrrppRO.', 'OrppprrrprRO.',
    'OrrrrrrrrrRO.', '.OrrrrrrrRO..', '.ORrrrrrRRO..', '..ORRRRRO....',
    '...OOOOO.....',
  ],
  water: [
    '......OO.....', '.....OttO....', '.....OatO....', '....OaattO...',
    '...OaaattTO..', '..OaaaattTTO.', '..OaCaattTTO.', '.OaCaaatttTO.',
    '.OaCaatttTTO.', '.OaaatttTTTO.', '..OttttTTTO..', '...OTTTTO....',
    '....OOOO.....',
  ],
  herb: [
    '.......OO....', '..OO..OllO...', '.OllOOllgO...', '.OlglOlgGO...',
    '..OglOgGO....', '...OgGGO.....', '...OggO..OO..', '..OgggOOOllO.',
    '.OllgGOlllgO.', '.OlgGGOllgGO.', '..OGGGOgGGO..', '....OgGOOO...',
    '....OGGO.....', '.....OO......',
  ],
  ore: [
    '.....OOOO....', '...OOssccO...', '..OsssccsSO..', '.OsssyjjySO..',
    '.OssyjyyySSO.', 'OssyjyySSSSO.', 'OssyySSyjSSO.', 'OSSSSSyySSSO.',
    '.OOSSSSSOO...', '...OOOOO.....',
  ],
  crystal: [
    '......OO.....', '.....OaaO....', '....OaatTO...', '....OaatTO...',
    '..OOOaatTO...', '.OatOaatTOO..', '.OatOaatTOaO.', '.OatOaatTOaO.',
    '.OttOattTOtO.', '..OtOattTtTO.', '..OtOattTTO..', '...OTTtTTO...',
    '....OOOOO....',
  ],
  essence: [
    '......C......', '.....CjC.....', '......C......', '....OOOO.....',
    '...OvuuVO....', '..OvuuuvVO...', '..OuujjvVO...', '.COuujjvVO.C.',
    '..OuvvvVVO...', '...OvVVVO....', '....OOOO.....', '.C......C....',
    '............C',
  ],
  food: [
    '.....OOOO....', '...OOjjwwO...', '..OjjCwwwbO..', '.OjjCwwwbbO..',
    '.OjCwwOOwbBO.', 'OjCwwObOwbBO.', 'OjCwwOOwbBBO.', 'OjCwwwbbBBBO.',
    '.OwwbbBBBOO..', '.ObbbBBBO....', '..OOOOOO.....',
  ],
  heal: [
    '....OOOO.....', '....OyyO.....', '....OOOO.....', '....OccO.....',
    '...OcaacO....', '..OcaaggaO...', '.OcaaagggTO..', '.OcaaCTggTO..',
    '.OcaCCCTgTO..', '.OcaCTCggTO..', '.OcatttggTO..', '..OTttttTO...',
    '...OOOOOO....',
  ],
  camp: [
    '......OO......', '.....OyyO.....', '....OjyyyO....', '....OjyyyyO...',
    '...OjyyyyyYO..', '..OjyyyOyyyYO.', '..OjyyOOOyyYO.', '.OjyyOBBBOyYO.',
    '.OjyOBbbbBOyO.', 'OjyyOBbbbBOyyO', 'OjjyOBbbbBOyyO', 'OOOOOOOOOOOOOO',
    'ObbO......ObbO',
  ],
  acid: [
    '....OOOO.....', '....ObbO.....', '....OOOO.....', '.....OcO.....',
    '....OcacO....', '....OcacO....', '...OcaagcO...', '..OcaalggcO..',
    '.OcaaljjggTO.', '.OcaljjgggTO.', '.OcalgggggTO.', '..OTggggTTO..',
    '...OOOOOOO...',
  ],
  axe_tool: [
    '......OOOO...', '....OOccssO..', '...OccccsSO..', '..OcccssSSO..',
    '..OcssSSSO...', '...OOSSOO....', '.....OybO....', '.....OwbO....',
    '.....OwbO....', '.....OwbO....', '.....ObbO....', '.....ObbO....',
    '......OO.....',
  ],
  pickaxe: [
    '..OOOOOOOO....', '.OccccccssOO..', 'OcssssssSSSSO.', '.OOOSSSOOOOO..',
    '....OybO......', '....OwbO......', '....OwbO......', '....OwbO......',
    '....OwbO......', '....ObbO......', '....ObbO......', '.....OO.......',
  ],
  sword: [
    '.........OO...', '........OccO..', '.......OccsO..', '......OccsSO..',
    '.....OccsSO...', '....OccsSO....', '...OccsSO.....', '..OOcsSO......',
    '.OyyOSO.......', '..OyOOO.......', '...OOjyO......', '..OwbOO.......',
    '.OwbO.........', '.OyO..........', '..O...........',
  ],
  axe: [
    '..OOOO.OOOO...', '.OccsOOccssO..', 'OccssOOccsSSO.', 'OcsssOOcssSSO.',
    '.OSSyjjSSSSO..', '..OOOybOOOO...', '....OwbO......', '....OwbO......',
    '....OwbO......', '....OwbO......', '....ObbO......', '....OyyO......',
    '.....OO.......',
  ],
  spear: [
    '......O......', '.....OcO.....', '....OccsO....', '....OccSO....',
    '....OccSO....', '.....OsO.....', '.....OyO.....', '.....ObO.....',
    '.....ObO.....', '.....ObO.....', '.....ObO.....', '.....ObO.....',
    '.....ObO.....', '.....OyO.....', '......O......',
  ],
  hammer: [
    '..OOOOOOOOO..', '.OccccccccsO.', '.OccssssssSO.', '.OcssssssSSO.',
    '.OSSSSSSSSSO.', '..OOOOyOOOO..', '.....OwbO....', '.....OwbO....',
    '.....OwbO....', '.....OwbO....', '.....ObbO....', '.....OyyO....',
    '......OO.....',
  ],
  daggers: [
    '..OO......OO..', '..OcO....OcO..', '..OccO..OccO..', '..OcsO..OcsO..',
    '..OcSO..OcSO..', '..OsSO..OsSO..', '..OSO....OSO..', '.OyyyO..OyyyO.',
    '..OyO....OyO..', '..ObO....ObO..', '..ObO....ObO..', '..OyO....OyO..',
    '...O......O...',
  ],
  bow: [
    '.....OO.......', '.....OybOO....', '.....OcObbO...', '.....OcOObbO..',
    '.....OcO.ObbO.', '.....OcO..ObO.', '.OOOOOOOOOOyO.', '.OjjjjjjjjjyO.',
    '..OOOOOOOOObO.', '.....OcO.ObbO.', '.....OcOObbO..', '.....OcObbO...',
    '.....OybOO....', '.....OO.......',
  ],
  crossbow: [
    '.......O......', '......OcO.....', '......OcO.....', '..OOO.OcO.OOO.',
    '.OybOOOcOOObyO', 'OybOCCcjcCCObO', 'ObO.OOyjyOO.Ob', '.OO...OwbO..OO',
    '......OwbO....', '......ObbO....', '.....ObbbO....', '.....ObbO.....',
    '......OO......',
  ],
  map: [
    '..OOOOOOOOOO..', '.OjjCCOOCCjjO.', '.OjCCCOgCCCjO.', '.OjCCggggCCjO.',
    '.OjgggglggCjO.', '.OjgCCglggCjO.', '.OjCCCgCCgCjO.', '.OjCtCCCCgCjO.',
    '.OjCttCCCCjjO.', '.OjCtttyyCCjO.', '.OjjCCtyjCCjO.', '..OOOOOOOOOO..',
  ],
  bag: [
    '.....OOOO.....', '....ObbbBO....', '....Ob..BO....', '...OOOOOOOO...',
    '..ObbwwwwbbO..', '.ObbwwwwwwbBO.', '.ObwwwywwwbBO.', '.ObwwyyywwbBO.',
    '.ObwOOOOOwbBO.', '.ObwOjjjOwbBO.', '.ObbOyyyObbBO.', '.ObbOOOOObbBO.',
    '..OBBBBBBBBO..', '...OOOOOOOO...',
  ],
  pause: [
    '..OOOO..OOOO..', '..OjjO..OjjO..', '..OjYO..OjYO..', '..OjYO..OjYO..',
    '..OjYO..OjYO..', '..OjYO..OjYO..', '..OjYO..OjYO..', '..OjYO..OjYO..',
    '..OjYO..OjYO..', '..OOOO..OOOO..',
  ],
  default: [
    '.....OO.....', '.....OjO....', '....OjjO....', '...OjjjyO...',
    '.OOjjCjjyOO.', 'OjjjCCCjjyyO', '.OOjjCjjyOO.', '...OjjjyO...',
    '....OjyO....', '.....OyO....', '.....OO.....',
  ],
};

function pixelPaths(rows) {
  const width = Math.max(...rows.map((row) => row.length));
  const ox = Math.floor((16 - width) / 2);
  const oy = Math.floor((16 - rows.length) / 2);
  const paths = new Map();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      const color = row[x];
      let run = 1;
      while (row[x + run] === color) run++;
      if (color !== '.') {
        const rectangle = `M${ox + x} ${oy + y}h${run}v1h-${run}z`;
        paths.set(color, (paths.get(color) || '') + rectangle);
      }
      x += run;
    }
  });
  return [...paths].map(([color, d]) => `<path fill="${PALETTE[color]}" d="${d}"/>`).join('');
}

const ART = Object.fromEntries(Object.entries(PIXELS).map(([id, rows]) => [id, pixelPaths(rows)]));

/** Retorna um SVG transparente seguro, pronto para HTML. Texto acessível fica no botão/item. */
export function icon(id) {
  const key = Object.hasOwn(ART, id) ? id : 'default';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pixel-icon" data-icon="${key}" width="1.5em" height="1.5em" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true" focusable="false" style="width:1.5em;height:1.5em;image-rendering:pixelated;vertical-align:middle;flex-shrink:0">${ART[key]}</svg>`;
}
