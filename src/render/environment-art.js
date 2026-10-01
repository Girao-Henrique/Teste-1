/**
 * Paradise? — cenários originais, pintados em pixels inteiros.
 * As ancoragens são as do mundo de colisão; nenhum desenho cria obstáculos.
 * A luz vem do alto à esquerda. Sombras usam azul/verde, nunca preto puro.
 */
import { TILE } from '../world/world.js';

const IVORY = '#fff2d1', GOLD = '#e8bf78', DEEP = '#244f58';
const floor = Math.floor, round = Math.round;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const noise = (x, y, seed = 0) => {
  let n = Math.imul(x + 1453, 374761393) ^ Math.imul(y + seed * 23, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
};
function tint(color, value) {
  const n = parseInt(color.replace('#', ''), 16);
  return '#' + [n >> 16, n >> 8 & 255, n & 255].map(v => clamp(v + value, 0, 255).toString(16).padStart(2, '0')).join('');
}
function mix(a, b, amount) {
  const an = parseInt(a.slice(1), 16), bn = parseInt(b.slice(1), 16);
  return '#' + [16, 8, 0].map(s => round((an >> s & 255) * (1 - amount) + (bn >> s & 255) * amount).toString(16).padStart(2, '0')).join('');
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color; c.fillRect(round(x), round(y), Math.max(1, round(w)), Math.max(1, round(h)));
}
function poly(c, points, color) {
  const top = Math.ceil(Math.min(...points.map(p => p[1]))), bottom = floor(Math.max(...points.map(p => p[1])));
  c.fillStyle = color;
  for (let y = top; y <= bottom; y++) {
    const cross = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) cross.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    cross.sort((a, b) => a - b);
    for (let i = 0; i + 1 < cross.length; i += 2) c.fillRect(Math.ceil(cross[i]), y, floor(cross[i + 1]) - Math.ceil(cross[i]) + 1, 1);
  }
}
function line(c, ax, ay, bx, by, color, width = 1) {
  ax = round(ax); ay = round(ay); bx = round(bx); by = round(by);
  const dx = Math.abs(bx - ax), sx = ax < bx ? 1 : -1, dy = -Math.abs(by - ay), sy = ay < by ? 1 : -1;
  let error = dx + dy;
  for (let i = 0; i < 1500; i++) {
    rect(c, ax - floor(width / 2), ay - floor(width / 2), width, width, color);
    if (ax === bx && ay === by) break;
    const e = error * 2;
    if (e >= dy) { error += dy; ax += sx; }
    if (e <= dx) { error += dx; ay += sy; }
  }
}
function oval(c, x, y, rx, ry, color) {
  x = round(x); y = round(y); rx = round(rx); ry = Math.max(1, round(ry));
  c.fillStyle = color;
  for (let row = -ry; row <= ry; row++) {
    const span = floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    c.fillRect(x - span, y + row, span * 2 + 1, 1);
  }
}
function sparkle(c, x, y, color = IVORY, size = 3) {
  line(c, x - size, y, x + size, y, color); line(c, x, y - size, x, y + size, color);
  rect(c, x - 1, y - 1, 3, 3, color);
}
function rim(c, x, y, rx, ry, color, width = 1, phase = 0) {
  const count = Math.max(36, floor(rx * 2.8));
  for (let i = 0; i < count; i++) {
    const a = i / count * Math.PI * 2 + phase;
    rect(c, x + Math.cos(a) * rx, y + Math.sin(a) * ry, width, 1, color);
  }
}
function stoneRing(c, x, y, rx, ry, depth, p) {
  // A solid pixel annulus, with separate lit and shaded halves; never a dotted circle.
  for (let row = -ry; row <= ry; row++) {
    const outer = floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    const inner = Math.abs(row) >= ry - depth ? -1 : floor((rx - depth) * Math.sqrt(Math.max(0, 1 - row * row / ((ry - depth) * (ry - depth)))));
    const leftColor = row < 18 ? p.stoneLight : p.stoneMid;
    if (inner < 0) rect(c, x - outer, y + row, outer * 2 + 1, 1, row < 0 ? p.stoneLight : p.stoneShade);
    else {
      rect(c, x - outer, y + row, outer - inner, 1, leftColor);
      rect(c, x + inner + 1, y + row, outer - inner, 1, row < -25 ? p.stoneLight : p.stoneShade);
      rect(c, x - outer, y + row, 1, 1, '#fff0cd');
      rect(c, x + inner + 1, y + row, 1, 1, p.stoneMid);
    }
  }
}
function makeCanvas(w, h) {
  const image = document.createElement('canvas'); image.width = w; image.height = h;
  return image;
}
function biome(renderer) { return renderer.world?.biome || 0; }
function artPalette(renderer) {
  const p = renderer.palette;
  if (renderer._environmentPaletteSource === p) return renderer._environmentPalette;
  renderer._environmentPaletteSource = p;
  renderer._environmentPalette = { ...p, foliageShade: mix(p.tree, '#244f67', .34), foliageDark: mix(p.tree, '#204b5a', .55), foliageLight: mix(p.tree, '#d0e7a6', .37), foliageSun: mix(p.tree, '#eef2b1', .57), barkShade: mix(p.trunk, '#3b5960', .40), stoneShade: mix(p.path, '#637d91', .43), stoneMid: mix(p.path, '#a3b9b4', .20), stoneLight: mix(p.path, '#fff4da', .65), waterShine: mix(p.waterLight, p.water, .26), waterShineMid: mix(p.waterLight, p.water, .42), waterShineDark: mix(p.waterLight, p.water, .56), waterCaustic: mix(p.waterLight, p.water, .46), fishColor: mix(p.water, '#407d98', .30), fishLight: mix(p.water, '#c9e7cd', .45) };
  return renderer._environmentPalette;
}

/** Six connected terrain families; no antialiasing or tile-shaped noise carpet. */
export function drawTerrainTile(renderer, c, world, x, y) {
  const p = artPalette(renderer), b = world.biome, tile = world.tiles[y][x], px = x * TILE, py = y * TILE;
  const value = floor(noise(x, y, b) * 8);
  const neighbors = [world.tiles[y - 1]?.[x], world.tiles[y]?.[x + 1], world.tiles[y + 1]?.[x], world.tiles[y]?.[x - 1]];
  const patch = noise(floor(x / 4), floor(y / 4), b) > .68 ? 1 : 0;
  // Every cached tile is a 16px image. Cache includes seam parity and all edges.
  renderer._environmentTiles ||= new Map();
  const key = `${b}:${tile}:${value}:${patch}:${x % 2}:${y % 2}:${neighbors.join(',')}`;
  let image = renderer._environmentTiles.get(key);
  if (!image) {
    image = makeCanvas(TILE, TILE); const tc = image.getContext('2d');
    paintTile(tc, tile, value, patch, x, y, b, p, neighbors);
    renderer._environmentTiles.set(key, image);
  }
  c.drawImage(image, px, py);
}

function paintTile(c, tile, variant, patch, x, y, b, p, n) {
  if (tile === 0) {
    const base = patch ? mix(p.grass, p.grassLight, .13) : p.grass;
    rect(c, 0, 0, 16, 16, base);
    if (variant < 4) {
      const xx = 2 + variant * 2, yy = 4 + (variant % 3) * 3;
      poly(c, [[xx, yy + 2], [xx + 2, yy], [xx + 5, yy], [xx + 6, yy + 2], [xx + 4, yy + 3], [xx + 1, yy + 3]], mix(base, p.grassLight, .26));
    }
    if (variant === 5 || variant === 2) {
      line(c, 4, 12, 3, 9, mix(p.grassDark, p.grass, .45)); line(c, 4, 12, 6, 9, mix(p.grassLight, p.grass, .35));
      rect(c, 12, 5, 2, 1, mix(p.grassLight, p.grass, .35));
    }
    // A little moss/short gold grass, not random single-pixel static.
    if (b === 2 && variant % 3 === 0) { line(c, 10, 13, 9, 8, '#d8c976'); line(c, 10, 13, 12, 10, '#e8d789'); }
    if (b === 6 && variant === 7) { rect(c, 5, 8, 3, 1, '#bdd1d9'); rect(c, 6, 7, 1, 3, '#a7c1d4'); }
    for (let side = 0; side < 4; side++) if (n[side] === 2) {
      edge(c, side, mix(p.grassDark, '#486d82', .24), 2);
      edge(c, side, mix(p.grassLight, p.path, .22), 1);
    }
  } else if (tile === 1) {
    rect(c, 0, 0, 16, 16, p.path);
    if (variant < 4) {
      rect(c, 3 + variant, 7 + variant % 2, 5, 1, tint(p.path, -7)); rect(c, 4 + variant, 6 + variant % 2, 3, 1, tint(p.path, 8));
    }
    if (b === 3) {
      if (variant === 2) { poly(c, [[10, 7], [13, 7], [14, 9], [12, 10], [10, 9]], '#e9c7bd'); rect(c, 12, 8, 1, 1, IVORY); }
      if (variant === 5) { line(c, 2, 12, 6, 12, '#dfcfad'); line(c, 8, 4, 13, 4, '#f9eccc'); }
    } else if ((b >= 4 && variant < 2) || (b < 4 && (x + y) % 5 === 0)) {
      const stone = mix(p.path, '#f4edcf', .28);
      poly(c, [[3, 5], [7, 4], [10, 5], [11, 8], [8, 10], [4, 9], [2, 7]], tint(stone, -13));
      poly(c, [[3, 5], [7, 4], [10, 5], [10, 7], [7, 8], [3, 7]], stone);
      rect(c, 4, 5, 4, 1, tint(stone, 6));
    }
    for (let side = 0; side < 4; side++) if (n[side] === 0) {
      // Inset scalloped meadow fringe preserves exactly the walkable path.
      edge(c, side, mix(p.path, p.grassDark, .44), 1);
      for (let i = 0; i < 4; i++) {
        const pos = i * 4 + (variant % 2), length = 1 + (i * 3 + variant) % 4;
        if (side === 0) rect(c, pos, 0, 2, length, p.grass);
        if (side === 2) rect(c, pos, 16 - length, 2, length, p.grass);
        if (side === 1) rect(c, 16 - length, pos, length, 2, p.grass);
        if (side === 3) rect(c, 0, pos, length, 2, p.grass);
      }
    }
  } else if (tile === 2) {
    const base = b === 7 ? '#badde8' : p.water;
    rect(c, 0, 0, 16, 16, base);
    if (b === 7) {
      // The river becomes open sky between floating islands, with cloud terraces.
      if (variant < 4) {
        poly(c, [[0, 9], [2, 7], [5, 7], [7, 5], [12, 5], [15, 8], [16, 11], [16, 13], [0, 13]], '#d2eaf0');
        rect(c, 3, 8, 9, 2, '#e4f3f2');
      }
    } else {
      if (variant < 4) { rect(c, 2, 7 + variant, 8, 1, mix(base, p.waterLight, .20)); rect(c, 7, 3, 4, 1, mix(base, p.waterLight, .12)); }
      if (variant === 7 && b === 3) { poly(c, [[6, 12], [5, 7], [8, 5], [11, 8], [10, 12]], mix(base, '#75aabc', .35)); }
    }
    for (let side = 0; side < 4; side++) if (n[side] !== 2 && n[side] !== 4 && n[side] !== undefined) {
      edge(c, side, mix(base, p.path, .33), 4);
      edge(c, side, mix(base, p.waterLight, .72), 2);
      if (side === 0 || side === 3) edge(c, side, mix(p.waterLight, '#fff4dd', .28), 1);
    }
  } else if (tile === 3) {
    const exposed = n[2] !== 3;
    rect(c, 0, 0, 16, 16, p.stoneMid);
    if (n[0] !== 3) { rect(c, 0, 0, 16, 3, p.stoneLight); rect(c, 2, 3, 10, 1, tint(p.stoneLight, -12)); }
    if (variant < 5) {
      poly(c, [[1, 5], [4, 3], [10, 4], [14, 7], [11, 11], [3, 10]], mix(p.stoneMid, p.stoneLight, .43));
      line(c, 3, 5, 8, 4, p.stoneLight);
    }
    if (exposed) {
      rect(c, 0, 7, 16, 9, p.stoneShade); rect(c, 0, 6, 16, 2, p.stoneLight);
      poly(c, [[1, 9], [5, 9], [6, 12], [4, 16], [1, 16]], mix(p.stoneShade, p.stoneMid, .52));
      rect(c, 9 + variant % 3, 9, 2, 7, mix(p.stoneShade, '#405f75', .18));
      rect(c, 6, 9, 6, 1, mix(p.stoneMid, p.stoneLight, .3));
      if (b !== 4 && variant % 2 === 0) { rect(c, 0, 6, 6, 2, mix(p.tree, p.grass, .45)); rect(c, 1, 8, 2, 3, p.grassDark); }
    }
    if (n[1] !== 3) rect(c, 15, 2, 1, 14, p.stoneShade);
    if (n[3] !== 3) rect(c, 0, 1, 1, 14, p.stoneLight);
  } else if (tile === 4) {
    // Warm timber/gold hardware, including rails only at exterior edges.
    rect(c, 0, 0, 16, 16, p.water);
    const wooden = b < 8;
    for (let row = 0; row < 4; row++) {
      rect(c, 0, row * 4, 16, 4, wooden ? '#775e55' : '#9daea9');
      rect(c, 0, row * 4, 16, 2, wooden ? (row % 2 ? '#c6aa80' : '#d8bb8d') : '#eee8d4');
      rect(c, 2 + (row + x) % 3, row * 4 + 1, 7, 1, wooden ? '#ebcda0' : '#fff5df');
      rect(c, (row + x) % 2 ? 12 : 3, row * 4 + 2, 1, 1, wooden ? '#8f775c' : GOLD);
    }
    for (const side of [0, 2]) if (n[side] !== 4) {
      const yy = side ? 13 : 0;
      rect(c, 0, yy, 16, 3, wooden ? '#9e805f' : '#bcb897'); rect(c, 0, yy, 16, 1, IVORY);
      if (x % 2 === 0) { rect(c, 1, yy - 2, 3, 5, '#756e60'); rect(c, 1, yy - 3, 3, 2, GOLD); }
    }
  } else {
    // Large marble slabs, as opposed to a dark grid around every 16px cell.
    const marble = mix(p.path, '#fff5dc', .30), seam = mix(marble, '#8da89f', .17);
    rect(c, 0, 0, 16, 16, marble);
    if (y % 2 === 1) rect(c, 0, 15, 16, 1, seam);
    if ((x + floor(y / 2)) % 2 === 1) rect(c, 15, 0, 1, 16, seam);
    if (variant === 2) { line(c, 2, 5, 7, 4, mix(marble, '#b2bfa9', .20)); line(c, 7, 4, 11, 8, mix(marble, '#b2bfa9', .16)); }
    if (variant === 7 && b >= 8) {
      poly(c, [[8, 3], [12, 8], [8, 13], [4, 8]], mix(marble, GOLD, .27));
      poly(c, [[8, 5], [10, 8], [8, 11], [6, 8]], marble);
    }
    if (n[2] === 0 || n[2] === 1) { rect(c, 0, 15, 16, 1, mix(marble, '#6a8795', .31)); rect(c, 0, 13, 16, 1, '#fff4d9'); }
  }
}
function edge(c, side, color, depth) {
  if (side === 0) rect(c, 0, 0, 16, depth, color);
  if (side === 1) rect(c, 16 - depth, 0, depth, 16, color);
  if (side === 2) rect(c, 0, 16 - depth, 16, depth, color);
  if (side === 3) rect(c, 0, 0, depth, 16, color);
}

/** Angular foliage clusters with a single readable lighting direction. */
function leafCluster(c, x, y, w, h, colors, seed = 0) {
  const [dark, mid, lit, sun] = colors;
  const shape = [[x - w, y + 2], [x - w + 2, y - h * .4], [x - w * .72, y - h * .5], [x - w * .62, y - h * .8], [x - w * .2, y - h], [x + w * .3, y - h + 1], [x + w * .72, y - h * .62], [x + w - 2, y - h * .45], [x + w, y + 2], [x + w * .8, y + h * .36], [x + w * .39, y + h * .5], [x, y + h * .42], [x - w * .3, y + h * .55], [x - w * .77, y + h * .3]];
  poly(c, shape, dark);
  poly(c, shape.map(([px, py]) => [px + (px < x ? 1 : -1), py - 2]), mid);
  poly(c, [[x - w + 3, y - h * .2], [x - w * .6, y - h * .65], [x - w * .15, y - h + 3], [x + w * .3, y - h + 3], [x + w * .6, y - h * .58], [x + w * .3, y - h * .26], [x - w * .12, y - h * .18], [x - w * .4, y + 1]], lit);
  poly(c, [[x - w * .54, y - h * .66], [x - w * .1, y - h + 3], [x + w * .22, y - h + 3], [x + w * .14, y - h * .67], [x - w * .22, y - h * .54]], sun);
  for (let i = 0; i < 7; i++) {
    const dx = round((noise(i + 41, seed) - .5) * w * 1.45), dy = round((noise(i + 23, seed) - .62) * h * 1.03);
    const color = i < 4 ? lit : dark;
    rect(c, x + dx, y + dy, 3, 1, color); rect(c, x + dx + 1, y + dy - 1, 2, 1, color);
  }
}
function trunk(c, x, y, height, width, p, ancient = false) {
  poly(c, [[x - width * .45, y - height], [x + width * .4, y - height], [x + width * .38, y - 13], [x + width, y], [x + width * .12, y - 3], [x - width * .9, y], [x - width * .45, y - 11]], p.barkShade);
  poly(c, [[x - width * .35, y - height], [x + width * .14, y - height], [x + width * .14, y - 11], [x + width * .55, y - 3], [x - width * .45, y - 2]], p.trunk);
  line(c, x - width * .2, y - height + 3, x - width * .16, y - 7, mix(p.trunk, IVORY, .28), 2);
  line(c, x + width * .17, y - height + 13, x + width * .22, y - 9, p.barkShade);
  for (let i = 0; i < 3; i++) { const yy = y - 12 - i * 9; line(c, x - 2, yy, x + 1, yy - 3, p.barkShade); }
  if (ancient) { line(c, x - 3, y - 15, x - 12, y - 1, p.trunk, 3); line(c, x + 2, y - 14, x + 14, y, p.barkShade, 3); }
}
function fruit(c, x, y, p, color = '#e6a575') {
  poly(c, [[x - 2, y - 2], [x, y - 3], [x + 3, y - 1], [x + 3, y + 2], [x, y + 4], [x - 3, y + 2], [x - 3, y]], mix(color, '#754e62', .27));
  poly(c, [[x - 2, y - 1], [x, y - 2], [x + 2, y], [x + 1, y + 3], [x - 1, y + 3], [x - 2, y + 1]], color);
  rect(c, x - 1, y - 1, 1, 2, '#ffdf9e'); line(c, x, y - 3, x + 1, y - 5, p.tree); rect(c, x + 1, y - 5, 2, 1, p.foliageLight);
}
function vine(c, x, y, length, p, flowers = false) {
  for (let i = 0; i < length; i += 3) {
    const xx = x + round(Math.sin(i * .25) * 1.2);
    rect(c, xx, y + i, 1, 3, p.foliageDark);
    if (i % 6 === 0) { rect(c, xx - 2, y + i, 2, 1, p.foliageLight); rect(c, xx + 1, y + i + 2, 2, 1, p.tree); }
    if (flowers && i % 12 === 0) rect(c, xx, y + i + 1, 2, 2, p.accent);
  }
}

export function createTreeSprite(renderer, object) {
  const variant = object.variant || 'fruit', seed = (object.seed || 0) % 4, b = biome(renderer);
  const key = `garden-tree-${b}-${variant}-${seed}`;
  if (renderer.sprites.has(key)) return renderer.sprites.get(key);
  const image = makeCanvas(72, 86), c = image.getContext('2d'), p = artPalette(renderer);
  const colors = [p.foliageDark, p.tree, p.foliageLight, p.foliageSun];
  trunk(c, 36, 80, 38, variant === 'ancient' ? 13 : 9, p, variant === 'ancient');
  if (variant === 'palm') {
    // Bent, ringed trunk and six broad feathered fronds.
    poly(c, [[33, 78], [32, 59], [36, 34], [39, 28], [42, 30], [40, 47], [38, 62], [39, 79]], p.barkShade);
    poly(c, [[33, 78], [34, 57], [38, 32], [40, 30], [39, 48], [36, 64], [36, 78]], p.trunk);
    for (let i = 0; i < 6; i++) line(c, 33 + (i < 3 ? 1 : 3), 72 - i * 6, 38 + (i < 3 ? 0 : 2), 71 - i * 6, mix(p.trunk, IVORY, .3));
    const fronds = [[[39, 30], [24, 12], [9, 14], [3, 28]], [[39, 30], [19, 23], [3, 38], [1, 47]], [[39, 30], [23, 34], [12, 52], [10, 60]], [[39, 30], [52, 11], [63, 15], [68, 31]], [[39, 30], [59, 27], [69, 39], [70, 47]], [[39, 30], [51, 39], [58, 51], [59, 59]]];
    fronds.forEach((points, i) => {
      const [[ax, ay], [mx, my], [nx, ny], [ex, ey]] = points;
      const length = Math.hypot(nx - mx, ny - my) || 1, tx = -(ny - my) / length, ty = (nx - mx) / length;
      poly(c, [[ax, ay], [mx + tx * 8, my + ty * 8], [nx + tx * 6, ny + ty * 6], [ex, ey], [nx - tx * 3, ny - ty * 3], [mx - tx * 3, my - ty * 3]], p.foliageDark);
      poly(c, [[ax, ay], [mx + tx * 7, my + ty * 7], [nx + tx * 5, ny + ty * 5], [ex, ey], [nx - tx * 2, ny - ty * 2], [mx - tx, my - ty]], i < 2 ? p.foliageLight : p.tree);
      line(c, ax, ay, mx, my, p.foliageSun); line(c, mx, my, nx, ny + 1, p.foliageLight);
      for (let k = 1; k < 4; k++) { const f = k / 4; const xx = mx + (nx - mx) * f, yy = my + (ny - my) * f; line(c, xx, yy, xx + tx * 5 - (nx - mx) / length * 2, yy + ty * 5 - (ny - my) / length * 2, p.foliageShade); }
    });
    fruit(c, 34, 35, p, '#ae825b'); fruit(c, 43, 36, p, '#c8a074');
  } else if (variant === 'pine') {
    // Three irregular tiers with snow-white leaf edges and a tapering silhouette.
    for (const [y, w, h] of [[54, 28, 23], [38, 22, 23], [22, 13, 18]]) {
      poly(c, [[36, y - h], [36 + w - 6, y - 3], [36 + w, y + 4], [36 + w - 8, y + 3], [36 + w - 11, y + 7], [36, y + 10], [36 - w + 9, y + 6], [36 - w, y + 5], [36 - w + 6, y - 3]], p.foliageDark);
      poly(c, [[36, y - h + 1], [36 + w - 7, y - 3], [36 + w - 3, y + 2], [36, y + 6], [36 - w + 3, y + 2], [36 - w + 7, y - 3]], p.tree);
      poly(c, [[36, y - h + 1], [35, y - 2], [36 - w + 4, y + 1], [36 - w + 8, y - 4]], p.foliageLight);
      line(c, 36 - w + 4, y + 1, 34, y - 1, '#e6ecd0', 2);
      line(c, 38, y + 2, 36 + w - 8, y + 1, '#bcdcc9');
    }
    rect(c, 36, 7, 1, 6, '#e9efd2');
  } else {
    const broad = variant === 'broad' || variant === 'ancient', silver = variant === 'silver';
    const foliage = silver ? [mix(p.tree, '#476478', .46), mix(p.tree, '#c0d5c1', .37), '#d5e4c6', '#eef0cf'] : colors;
    line(c, 35, 61, 22, 43, p.barkShade, 4); line(c, 37, 56, 52, 38, p.barkShade, 4);
    line(c, 35, 59, 22, 42, p.trunk, 2); line(c, 37, 54, 52, 37, p.trunk, 2);
    const shift = seed % 2 ? 2 : 0;
    const crowns = variant === 'round'
      ? [[22, 35, 13, 17], [49, 34, 14, 18], [35, 42, 21, 25], [34 + shift, 20, 19, 16]]
      : silver
        ? [[24, 43, 15, 19], [49, 45, 13, 19], [37, 38, 20, 25], [34, 21, 16, 16], [37, 12, 9, 8]]
        : variant === 'ancient'
          ? [[18, 44, 17, 17], [54, 43, 17, 17], [36, 45, 20, 18], [18 + shift, 31, 16, 17], [52, 26, 18, 19], [34, 23, 19, 17]]
          : variant === 'broad'
            ? [[18, 43, 17, 17], [56, 40, 14, 16], [40, 48, 20, 19], [23 + shift, 27, 18, 18], [48, 23, 18, 17], [33, 14, 16, 10]]
            : [[20, 42, 15, 20], [52, 42, 15, 21], [35, 48, 21, 21], [23 + shift, 27, 19, 17], [47, 26 + shift, 19, 19], [35, 20, 18, 15]];
    crowns.forEach(([xx, yy, w, h], i) => leafCluster(c, xx, yy, w, h, foliage, seed + i * 7 + 1));
    // Bottom leaves create readable canopy volume rather than a flat round stamp.
    const fringes = variant === 'round' ? [[20, 47], [32, 54], [48, 47]] : silver ? [[21, 51], [37, 54], [51, 53]] : [[15, 52], [30, 57], [48, 56], [60, 48]];
    for (const [xx, yy] of fringes) {
      poly(c, [[xx - 3, yy - 2], [xx + 3, yy - 3], [xx + 2, yy + 1], [xx, yy + 3], [xx - 3, yy]], foliage[0]);
      rect(c, xx - 2, yy - 3, 4, 1, foliage[1]);
    }
    if (variant === 'fruit') {
      [[15, 40], [26, 28], [48, 36], [56, 48], [34, 47]].forEach(([xx, yy]) => fruit(c, xx, yy, p, b === 6 ? '#d4add7' : '#efa777'));
    }
    if (variant === 'ancient') { vine(c, 11, 43, 25, p); vine(c, 57, 39, 29, p, true); vine(c, 22, 53, 13, p); }
    if (silver || b === 5) {
      for (const [xx, yy] of [[19, 31], [39, 17], [55, 33], [30, 44]]) flower(c, xx, yy, 0, b === 5 ? '#f4e7c9' : '#fff3cc', p, 2);
    }
    if (b === 6) { rect(c, 23, 20, 2, 2, '#e9d3ec'); rect(c, 51, 30, 2, 2, '#ccdef2'); }
  }
  renderer.sprites.set(key, image);
  return image;
}

function flower(c, x, y, time, color, p, scale = 1, seed = 0) {
  const sway = round(Math.sin(time * 1.4 + seed) * .75), xx = x + sway;
  if (scale > 1) {
    poly(c, [[xx - 4, y], [xx - 3, y - 3], [xx, y - 4], [xx + 1, y - 2], [xx + 4, y - 2], [xx + 5, y + 1], [xx + 2, y + 2], [xx + 2, y + 4], [xx - 1, y + 4], [xx - 2, y + 2], [xx - 4, y + 2]], mix(color, '#777795', .22));
    rect(c, xx - 3, y - 1, 7, 2, color); rect(c, xx - 1, y - 3, 3, 6, color); rect(c, xx, y, 2, 2, '#d8a96e'); rect(c, xx - 1, y - 2, 1, 1, IVORY);
  } else {
    rect(c, xx - 2, y, 5, 2, mix(color, '#787998', .23)); rect(c, xx - 1, y - 2, 3, 5, color);
    rect(c, xx - 2, y - 1, 5, 2, color); rect(c, xx, y, 1, 1, '#dcaa64'); rect(c, xx - 1, y - 1, 1, 1, IVORY);
  }
}

function prism(c, x, y, width, height, colors = ['#668baf', '#9bc5d9', '#d9f3ec']) {
  const [dark, mid, light] = colors;
  poly(c, [[x, y - height], [x + width, y - height * .64], [x + width - 1, y - 2], [x, y + 2], [x - width + 1, y - 2], [x - width, y - height * .64]], dark);
  poly(c, [[x, y - height + 1], [x + width - 1, y - height * .63], [x + width - 2, y - 3], [x, y]], mid);
  poly(c, [[x, y - height + 1], [x, y - 1], [x - width + 2, y - 3], [x - width + 1, y - height * .63]], light);
  line(c, x, y - height + 3, x + width - 2, y - height * .64, IVORY);
  line(c, x - width + 2, y - height * .64, x - width + 2, y - 6, mix(light, '#ffffff', .35));
}
function stone(c, x, y, w, h, p, seed = 0) {
  poly(c, [[x - w, y - 2], [x - w + 2, y - h * .55], [x - w * .25, y - h], [x + w * .5, y - h + 2], [x + w, y - h * .37], [x + w - 2, y + 1], [x - w * .35, y + 3]], p.stoneShade);
  poly(c, [[x - w + 2, y - h * .54], [x - w * .25, y - h + 1], [x + w * .48, y - h + 3], [x + w * .30, y - h * .40], [x - w * .35, y - h * .27]], p.stoneLight);
  poly(c, [[x + w * .49, y - h + 3], [x + w - 1, y - h * .37], [x + w - 3, y], [x + w * .23, y - 1], [x + w * .30, y - h * .40]], p.stoneMid);
  line(c, x - w + 3, y - h * .52, x - w * .22, y - h + 2, mix(p.stoneLight, '#ffffff', .28));
  line(c, x - 2, y - h * .45, x + 4, y - h * .30, mix(p.stoneShade, p.stoneMid, .55));
  if (seed % 3 === 0) { rect(c, x - w + 2, y - 2, 5, 2, p.grassDark); rect(c, x - w + 3, y - 3, 3, 1, p.foliageLight); }
}
function slab(c, x, y, width, depth, p) {
  const half = width / 2;
  poly(c, [[x - half, y], [x - half + 7, y - depth], [x + half - 7, y - depth], [x + half, y], [x + half - 7, y + depth], [x - half + 7, y + depth]], p.stoneShade);
  poly(c, [[x - half, y - 3], [x - half + 7, y - depth - 3], [x + half - 7, y - depth - 3], [x + half, y - 3], [x + half - 7, y + depth - 3], [x - half + 7, y + depth - 3]], p.stoneLight);
  line(c, x - half + 7, y - depth - 3, x + half - 7, y - depth - 3, '#fff5d8');
  line(c, x - half + 1, y - 2, x - half + 7, y + depth - 4, p.stoneMid);
}
function column(c, x, y, height, p, width = 10, capital = true) {
  rect(c, x - width / 2, y - height, width, height, p.stoneShade);
  rect(c, x - width / 2 + 1, y - height + 2, width - 3, height - 2, p.stoneLight);
  rect(c, x - width / 2 + 2, y - height + 6, 2, height - 11, '#fff3d6');
  rect(c, x + width / 2 - 3, y - height + 7, 1, height - 12, p.stoneMid);
  if (capital) {
    rect(c, x - width / 2 - 3, y - height - 2, width + 6, 4, GOLD);
    rect(c, x - width / 2 - 3, y - height - 3, width + 6, 2, '#fff0cc');
    for (const side of [-1, 1]) {
      poly(c, [[x + side * (width / 2), y - height + 2], [x + side * (width / 2 + 3), y - height + 2], [x + side * (width / 2 + 1), y - height + 7]], p.stoneMid);
    }
  }
  rect(c, x - width / 2 - 2, y - 3, width + 4, 5, p.stoneMid); rect(c, x - width / 2 - 3, y - 2, width + 6, 2, p.stoneLight);
  rect(c, x - width / 2 - 4, y + 2, width + 8, 2, mix(p.stoneShade, GOLD, .26));
}
function lantern(c, x, y, time, active = true, color = '#b5e9dd') {
  const bob = round(Math.sin(time * 1.8) * .6);
  line(c, x, y - 9, x, y - 5 + bob, '#b6976d');
  poly(c, [[x, y - 6 + bob], [x + 5, y - 3 + bob], [x + 3, y + 5 + bob], [x, y + 7 + bob], [x - 3, y + 5 + bob], [x - 5, y - 3 + bob]], '#537882');
  poly(c, [[x, y - 5 + bob], [x + 3, y - 2 + bob], [x + 2, y + 4 + bob], [x, y + 5 + bob], [x - 2, y + 3 + bob], [x - 3, y - 2 + bob]], active ? color : '#87aaa3');
  rect(c, x - 1, y - 2 + bob, 1, 4, active ? IVORY : '#b1c4b7');
  rect(c, x - 3, y - 5 + bob, 6, 1, GOLD); rect(c, x - 2, y + 5 + bob, 4, 1, GOLD);
}
function sunEmblem(c, x, y, size = 4, color = GOLD) {
  poly(c, [[x, y - size], [x + size, y], [x, y + size], [x - size, y]], color);
  rect(c, x - 1, y - 1, 3, 3, IVORY);
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) rect(c, x + dx * (size + 2), y + dy * (size + 2), 1, 1, color);
}

export function drawObject(renderer, c, o, time = 0, state = {}) {
  const x = round(o.x), y = round(o.y), p = artPalette(renderer), b = biome(renderer);
  if (o.type === 'tree') {
    if (o.depleted) {
      poly(c, [[x - 6, y - 3], [x - 4, y - 7], [x + 4, y - 7], [x + 6, y - 2], [x + 5, y + 2], [x - 5, y + 2]], p.barkShade);
      oval(c, x, y - 5, 5, 2, '#d9b285'); rim(c, x, y - 5, 3, 1, p.trunk); rect(c, x - 1, y - 5, 2, 1, '#f1d5a1'); return;
    }
    const sprite = createTreeSprite(renderer, o), sway = round(Math.sin(time * .75 + (o.seed || 0) * .3) * .7);
    c.drawImage(sprite, x - 36 + sway, y - 80);
    // Two economical canopy positions keep the trunk/contact silhouette stable.
    if (b === 0 && (o.seed || 0) % 9 === 0 && Math.sin(time * .5 + o.seed) > .92) {
      rect(c, x - 13 + sway, y - 41, 2, 1, '#fff0b9');
    }
  } else if (o.type === 'flower') {
    const seed = o.seed || 0, sway = round(Math.sin(time * 1.15 + seed) * .7);
    if (o.stalk) {
      line(c, x, y, x + sway - 1, y - 11, '#9a9650');
      for (let i = 0; i < 4; i++) {
        const yy = y - 11 + i * 2;
        line(c, x + sway - 1, yy + 1, x + sway - 4, yy - 1, '#e8d184'); line(c, x + sway, yy + 1, x + sway + 2, yy - 1, '#f0dd9d');
      }
      line(c, x, y - 2, x + 3, y - 5, p.grassLight);
    } else {
      const colors = ['#fff0af', '#efb2ae', '#a9c9ed', '#eaf0ce', p.accent], stem = 6 + seed % 3;
      line(c, x, y, x + sway, y - stem, p.foliageDark);
      poly(c, [[x, y - 2], [x - 4, y - 5], [x - 4, y - 2], [x, y - 1]], p.tree);
      if (seed % 3 === 0) line(c, x, y - 2, x + 4, y - 4, p.foliageLight);
      flower(c, x, y - stem, time, colors[(o.variant || 0) % 5], p, seed % 11 === 0 ? 2 : 1, seed);
    }
  } else if (o.type === 'bush') {
    const offset = round(Math.sin(time * .85 + o.seed) * .55);
    leafCluster(c, x + offset, y - 3, 11, 8, [p.foliageDark, p.tree, p.foliageLight, p.foliageSun], o.seed || 0);
    poly(c, [[x - 5, y - 4], [x - 3, y - 7], [x, y - 4], [x + 3, y - 7], [x + 6, y - 5], [x + 2, y - 1]], p.tree);
    if (o.variant % 2) { fruit(c, x - 4, y - 5, p, '#d3a379'); fruit(c, x + 4, y - 4, p, p.accent); }
    else if (b === 3 || b >= 5) { flower(c, x - 3, y - 9, 0, '#f5dfca', p); flower(c, x + 5, y - 7, 0, p.accent, p); }
  } else if (o.type === 'rock') {
    if (!o.depleted) stone(c, x, y, 11, 15, p, o.seed || 0);
  } else if (o.type === 'crystal') {
    if (o.depleted) return;
    oval(c, x, y + 1, 14, 3, '#496d8550');
    prism(c, x - 8, y, 5, 17, ['#7179a7', '#a8bbd6', '#d1e7e8']);
    prism(c, x + 8, y + 1, 5, 19, ['#778aa5', '#a9b4db', '#e2d7ed']);
    prism(c, x, y - 1, 7, 29, ['#647aa2', '#a0c7db', '#d7f1e4']);
    if (Math.sin(time * 1.9 + (o.seed || 0)) > .82) sparkle(c, x - 2, y - 22, IVORY, 2);
  } else if (o.type === 'resource') {
    if (!o.depleted) drawResource(renderer, c, o, time);
  } else if (o.type === 'arena') {
    const radius = o.radius || 92, key = `garden-court-${b}-${radius}`;
    let image = renderer.sprites.get(key);
    if (!image) {
      image = makeCanvas(radius * 2 + 8, radius * 1.4 + 8); const ac = image.getContext('2d'), ax = radius + 4, ay = radius * .7 + 4;
      const etch = mix(p.path, p.stoneShade, .34), light = mix(p.path, '#fff8d5', .47);
      rim(ac, ax, ay, radius, radius * .65, etch); rim(ac, ax, ay, radius - 3, (radius - 3) * .65, light);
      rim(ac, ax, ay, radius - 8, (radius - 8) * .65, mix(p.path, p.grassDark, .22));
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, sx = ax + Math.cos(a) * (radius - 5), sy = ay + Math.sin(a) * (radius - 5) * .65;
        poly(ac, [[sx, sy - 3], [sx + 3, sy], [sx, sy + 3], [sx - 3, sy]], etch); rect(ac, sx, sy - 1, 1, 2, light);
      }
      renderer.sprites.set(key, image);
    }
    c.drawImage(image, round(x - radius - 4), round(y - radius * .7 - 4));
  } else if (o.type === 'support') {
    drawSupport(c, x, y, p, time, !!state.supports?.includes(state.biome ?? b));
  } else if (o.type === 'camp') {
    drawCamp(c, x, y, p, time);
  } else if (o.type === 'waterfall') {
    drawWaterfall(c, x, y, o.height || 92, time, p);
  } else if (o.type === 'ruin') drawArchitecture(renderer, c, o, time);
  else if (o.type === 'landmark') drawLandmark(renderer, c, o, time, state);
}

function drawSupport(c, x, y, p, time, active) {
  slab(c, x, y + 6, 74, 11, p); slab(c, x, y + 4, 66, 9, p);
  for (const side of [-1, 1]) column(c, x + side * 24, y + 3, 39, p, 8);
  const roofDark = mix(p.tree, '#3b6673', .42), roof = mix(p.tree, '#a6c7ad', .35), lit = mix(roof, '#d1e1b4', .5);
  poly(c, [[x - 36, y - 36], [x - 24, y - 49], [x - 7, y - 58], [x, y - 63], [x + 9, y - 58], [x + 26, y - 49], [x + 36, y - 36], [x + 30, y - 32], [x - 29, y - 32]], roofDark);
  poly(c, [[x - 34, y - 37], [x - 23, y - 48], [x, y - 60], [x + 21, y - 47], [x + 33, y - 37]], roof);
  poly(c, [[x - 32, y - 38], [x - 23, y - 47], [x, y - 60], [x - 2, y - 47], [x - 13, y - 38]], lit);
  for (let row = 0; row < 4; row++) {
    const yy = y - 39 - row * 5, width = 29 - row * 6;
    line(c, x - width, yy, x + width, yy, mix(roofDark, roof, .38));
    for (let col = -width + 3; col < width; col += 8) line(c, x + col + row % 2 * 3, yy, x + col + row % 2 * 3 + 2, yy - 3, lit);
  }
  line(c, x - 35, y - 35, x + 35, y - 35, GOLD, 2); line(c, x - 33, y - 34, x + 33, y - 34, IVORY);
  poly(c, [[x - 5, y - 61], [x, y - 68], [x + 5, y - 61], [x, y - 58]], GOLD); rect(c, x - 1, y - 63, 3, 2, IVORY);
  rect(c, x - 27, y - 30, 5, 12, '#608ca1'); rect(c, x + 22, y - 30, 5, 12, '#608ca1');
  for (const side of [-1, 1]) { rect(c, x + side * 24 - 1, y - 29, 2, 7, '#bddecb'); poly(c, [[x + side * 24 - 2, y - 19], [x + side * 24, y - 16], [x + side * 24 + 2, y - 19]], GOLD); }
  // Dedicated supplies: bedroll, chest and lit workbench stay visually distinct.
  rect(c, x - 18, y - 7, 16, 8, '#568c89'); rect(c, x - 18, y - 8, 16, 3, '#a9ceae'); rect(c, x - 17, y - 8, 4, 3, '#f0e7c7');
  rect(c, x + 5, y - 11, 14, 10, '#6c7762'); rect(c, x + 6, y - 13, 12, 5, '#c7a579'); rect(c, x + 7, y - 12, 10, 2, '#e5c58d');
  rect(c, x + 7, y - 10, 1, 8, GOLD); rect(c, x + 15, y - 10, 1, 8, GOLD); rect(c, x + 11, y - 8, 3, 3, '#f4dda4'); rect(c, x + 12, y - 7, 1, 1, DEEP);
  lantern(c, x, y - 24, time, active);
  if (active && Math.sin(time * 1.5) > .5) { rect(c, x - 5, y - 26, 1, 1, '#f7e6b8'); rect(c, x + 5, y - 21, 1, 1, '#f7e6b8'); }
}
function drawCamp(c, x, y, p, time) {
  oval(c, x + 1, y + 4, 23, 5, '#456b7650');
  const cloth = '#bbcba9', shade = '#527d7e';
  poly(c, [[x - 23, y + 2], [x - 6, y - 27], [x + 14, y - 21], [x + 24, y + 3]], shade);
  poly(c, [[x - 22, y], [x - 6, y - 26], [x + 10, y - 21], [x + 4, y + 1]], cloth);
  poly(c, [[x + 5, y + 1], [x + 13, y - 20], [x + 23, y + 1]], '#769b8e');
  line(c, x - 6, y - 26, x + 13, y - 21, IVORY, 2);
  line(c, x - 22, y, x - 6, y - 25, '#e6e8c1');
  poly(c, [[x + 9, y + 1], [x + 14, y - 13], [x + 19, y + 1]], '#365f68');
  rect(c, x + 11, y - 1, 6, 2, '#e7d7ac');
  line(c, x - 28, y + 4, x - 15, y - 15, '#cbbb99'); line(c, x + 31, y + 4, x + 18, y - 12, '#cbbb99');
  rect(c, x - 29, y + 3, 2, 3, '#856c55'); rect(c, x + 30, y + 3, 2, 3, '#856c55');
  rect(c, x - 10, y - 12, 8, 3, '#749b89'); rect(c, x - 9, y - 12, 6, 1, '#dee4bc');
  for (const [dx, dy] of [[23, 6], [28, 8], [33, 6], [27, 3]]) stone(c, x + dx, y + dy, 3, 3, p);
  line(c, x + 24, y + 5, x + 31, y + 6, '#9b7352', 2); line(c, x + 25, y + 7, x + 31, y + 3, '#ac8760', 2);
  const frame = floor(time * 5) % 4;
  poly(c, [[x + 24, y + 4], [x + 24, y - 2], [x + 27, y - 8 - frame % 2 * 2], [x + 28, y - 2], [x + 31, y - 5], [x + 32, y + 4]], '#e5b975');
  poly(c, [[x + 26, y + 4], [x + 27, y - 4], [x + 29, y - 1], [x + 30, y + 4]], '#fff0ba');
  if (frame % 2 === 0) rect(c, x + 28 + frame % 3, y - 13, 1, 1, '#f4d89c');
}
function drawWaterfall(c, x, y, height, time, p) {
  const top = y - height;
  poly(c, [[x - 21, top], [x + 19, top], [x + 21, y - 4], [x + 16, y + 2], [x - 17, y + 2]], '#5b9da6');
  for (let i = 0; i < 8; i++) {
    const xx = x - 18 + i * 5, phase = floor(time * (19 + i % 3 * 4) + i * 11) % height;
    rect(c, xx, top, 4, height, ['#a1d9d6', '#d4f0e7', '#bee6e1', '#eef5e8'][i % 4]);
    rect(c, xx + 1, top + phase, 2, Math.min(11, height - phase), '#fbfff0');
    if (phase > 30) rect(c, xx, top + phase - 27, 1, 6, '#97d2d5');
  }
  oval(c, x, y + 2, 27, 6, '#b4e5dc'); rim(c, x, y + 2, 24, 5, '#e9f6e6');
  for (let i = 0; i < 4; i++) {
    const phase = (time * 1.2 + i / 4) % 1, xx = x - 19 + i * 12;
    rect(c, xx, y - 2 - Math.sin(phase * Math.PI) * 8, 2, 2, '#f5fae9');
  }
}

export function drawResource(renderer, c, o, time = 0) {
  const x = round(o.x), y = round(o.y), p = artPalette(renderer);
  oval(c, x + 1, y + 1, 8, 2, '#365f7550');
  if (o.resource === 'wood') {
    line(c, x - 6, y - 1, x + 5, y - 8, p.barkShade, 5);
    line(c, x - 6, y - 2, x + 5, y - 9, '#bf9a70', 3);
    line(c, x - 5, y - 3, x + 5, y - 10, '#e0bf8a');
    line(c, x - 1, y - 5, x - 4, y - 10, '#b9936a', 2);
    oval(c, x - 6, y - 1, 2, 2, '#e5c898'); rect(c, x - 6, y - 1, 1, 1, '#aa8060');
    poly(c, [[x + 3, y - 8], [x + 5, y - 13], [x + 8, y - 14], [x + 8, y - 10]], p.tree); rect(c, x + 6, y - 12, 1, 2, p.foliageLight);
  } else if (o.resource === 'stone' || o.resource === 'ore') {
    stone(c, x, y, 8, 11, p, o.seed || 0);
    if (o.resource === 'ore') {
      poly(c, [[x - 4, y - 4], [x - 3, y - 7], [x, y - 8], [x + 2, y - 5], [x, y - 3]], '#c1a77f');
      rect(c, x - 3, y - 7, 3, 2, '#f4d093'); rect(c, x + 3, y - 3, 2, 2, '#e1c899');
    }
  } else if (o.resource === 'fruit') {
    poly(c, [[x - 9, y - 2], [x - 6, y - 8], [x + 5, y - 8], [x + 9, y - 2], [x + 6, y + 2], [x - 5, y + 2]], '#558772');
    line(c, x - 7, y - 2, x + 7, y - 2, '#a4ba80');
    fruit(c, x - 4, y - 3, p, '#efa477'); fruit(c, x + 3, y - 4, p, '#e8c777'); fruit(c, x, y - 8, p, '#e5a381');
  } else if (o.resource === 'water') {
    // A little carved spring; recognisable even far from a river bank.
    slab(c, x, y, 20, 4, p); oval(c, x, y - 3, 7, 2, '#61b9c7');
    rim(c, x, y - 3, 5 + floor(time * 2) % 2, 2, '#b7e7d9');
    poly(c, [[x, y - 17], [x + 4, y - 10], [x + 3, y - 6], [x, y - 4], [x - 3, y - 6], [x - 4, y - 10]], '#62adbb');
    poly(c, [[x, y - 15], [x + 2, y - 10], [x + 1, y - 6], [x - 2, y - 7], [x - 2, y - 10]], '#ccefe3'); rect(c, x - 1, y - 10, 1, 3, '#ffffff');
  } else if (o.resource === 'crystal') {
    prism(c, x - 4, y, 3, 10, ['#6d7b9b', '#a0c0d3', '#cceadd']); prism(c, x + 2, y - 1, 5, 18);
  } else if (o.resource === 'essence') {
    const bob = round(Math.sin(time * 2) * 1.3);
    poly(c, [[x, y - 17 + bob], [x + 6, y - 9 + bob], [x + 3, y - 3 + bob], [x - 3, y - 3 + bob], [x - 6, y - 9 + bob]], '#7b9aaf');
    poly(c, [[x, y - 16 + bob], [x + 3, y - 9 + bob], [x, y - 4 + bob], [x - 4, y - 8 + bob]], '#b8dfca');
    sparkle(c, x, y - 9 + bob, '#fff4b9', 3); rect(c, x + 6, y - 5 - floor(time * 3) % 5, 1, 1, GOLD);
  } else {
    const sway = round(Math.sin(time * 1.2 + (o.seed || 0)) * .6);
    line(c, x, y, x + sway, y - 12, p.foliageDark, 2);
    poly(c, [[x, y - 3], [x - 7, y - 6], [x - 7, y - 10], [x - 3, y - 9], [x + sway, y - 5]], p.tree);
    poly(c, [[x, y - 5], [x + 3, y - 12], [x + 7, y - 14], [x + 8, y - 10], [x + 3, y - 6]], p.foliageLight);
    line(c, x - 1, y - 5, x - 5, y - 8, p.foliageLight); line(c, x + 2, y - 7, x + 6, y - 11, p.tree);
    if (o.resource === 'herb') { flower(c, x + sway, y - 14, 0, '#d8b3df', p, 1); flower(c, x - 6, y - 8, 0, '#edf2ca', p); }
    else { poly(c, [[x + 1, y - 8], [x + 1, y - 16], [x + 3, y - 18], [x + 4, y - 11]], '#c7d99a'); rect(c, x + 2, y - 16, 1, 6, '#edf0b8'); }
  }
  if (Math.sin(time * 1.4 + (o.seed || 0)) > .96) sparkle(c, x + 7, y - 13, '#f9efbd', 1);
}

export function drawArchitecture(renderer, c, o, time = 0) {
  const x = round(o.x), y = round(o.y), p = artPalette(renderer), b = biome(renderer);
  if (o.variant === 'cave') {
    poly(c, [[x - 27, y], [x - 24, y - 22], [x - 11, y - 33], [x + 6, y - 36], [x + 22, y - 23], [x + 29, y - 2], [x + 19, y + 4], [x - 19, y + 4]], p.stoneShade);
    poly(c, [[x - 15, y + 1], [x - 14, y - 17], [x - 4, y - 25], [x + 7, y - 24], [x + 17, y - 15], [x + 18, y + 1]], '#446979');
    poly(c, [[x - 24, y - 2], [x - 23, y - 20], [x - 10, y - 32], [x + 5, y - 34], [x + 20, y - 23], [x + 10, y - 21], [x + 1, y - 27], [x - 11, y - 20], [x - 16, y - 10], [x - 16, y]], p.stoneLight);
    poly(c, [[x + 9, y - 22], [x + 20, y - 24], [x + 28, y - 3], [x + 19, y], [x + 17, y - 12]], p.stoneMid);
    line(c, x - 22, y - 21, x - 10, y - 31, IVORY); line(c, x + 20, y - 23, x + 24, y - 9, p.stoneLight);
    slab(c, x, y + 3, 30, 3, p); rect(c, x - 9, y - 1, 18, 2, '#8eaca3');
    vine(c, x - 21, y - 17, 15, p, true); vine(c, x + 14, y - 27, 11, p);
    if (b === 6 || b === 7) { prism(c, x - 21, y + 1, 4, 14); prism(c, x + 20, y + 1, 3, 11); }
    sparkle(c, x + round(Math.sin(time * .9)), y - 14, '#cdeed7', 2);
  } else if (o.variant === 'arch' || o.variant === 'gate') {
    drawArch(c, x, y, 30, 74, p, time, o.variant === 'gate');
  } else if (o.variant === 'column' || o.variant === 'marker') {
    const height = o.variant === 'column' ? 55 : 25;
    column(c, x, y, height, p, o.variant === 'column' ? 12 : 9);
    if (o.variant === 'marker') {
      poly(c, [[x, y - 39], [x + 6, y - 30], [x, y - 23], [x - 6, y - 30]], '#c6c3a1');
      poly(c, [[x, y - 37], [x + 3, y - 30], [x, y - 26], [x - 3, y - 30]], '#fff0b9');
      if (Math.sin(time * 1.4) > .6) sparkle(c, x, y - 31, '#ffffff', 2);
    } else sunEmblem(c, x, y - height + 14, 3);
  } else if (o.variant === 'fountain') {
    slab(c, x, y + 5, 60, 10, p);
    oval(c, x, y, 25, 7, p.stoneShade); oval(c, x, y - 3, 24, 7, p.stoneLight);
    oval(c, x, y - 5, 20, 5, p.water); rim(c, x, y - 5, 18, 4, p.waterLight);
    column(c, x, y - 6, 19, p, 7, false);
    oval(c, x, y - 28, 13, 4, p.stoneShade); oval(c, x, y - 30, 13, 3, '#f6eccf');
    sunEmblem(c, x, y - 40, 5);
    for (let i = 0; i < 5; i++) {
      const phase = (time * .8 + i * .19) % 1, dx = (i - 2) * 6;
      const yy = y - 28 + phase * 24;
      line(c, x + dx * .35, y - 29, x + dx, y - 10, '#b9e3db');
      rect(c, x + dx * (.35 + phase * .65), yy, 1, 3, '#f2f9e8');
    }
  } else if (o.variant === 'pedestal') {
    slab(c, x, y + 2, 33, 5, p); column(c, x, y - 2, 17, p, 15);
    sunEmblem(c, x, y - 11, 3); poly(c, [[x - 8, y - 24], [x + 8, y - 24], [x + 5, y - 19], [x - 5, y - 19]], '#bad1bc');
  } else if (o.variant === 'observatory') {
    slab(c, x, y + 3, 49, 7, p); column(c, x, y, 27, p, 8, false);
    const angle = floor(time * 2) / 16;
    rim(c, x, y - 38, 20, 15, '#8c916f', 2, angle); rim(c, x, y - 38, 19, 14, GOLD, 1, angle);
    rim(c, x, y - 38, 9, 24, GOLD, 1, -angle); line(c, x - 17, y - 44, x + 17, y - 31, '#f4d49b');
    for (const [dx, dy] of [[-17, -8], [14, 9], [1, -22]]) rect(c, x + dx, y - 38 + dy, 3, 3, '#fff2d0');
    sparkle(c, x, y - 38, '#fff6d2', 4);
  }
}
function drawArch(c, x, y, width, height, p, time, welcome = false) {
  // Columns border a genuinely open doorway; no solid filled ellipse.
  slab(c, x, y + 4, width * 2 + 14, 5, p);
  for (const side of [-1, 1]) column(c, x + side * (width - 5), y, height - 23, p, 11);
  const top = y - height;
  poly(c, [[x - width - 4, y - height + 27], [x - width + 1, top + 13], [x - 15, top + 2], [x - 7, top - 2], [x + 8, top - 2], [x + 18, top + 4], [x + width - 1, top + 14], [x + width + 4, top + 27], [x + width - 8, top + 27], [x + 13, top + 15], [x + 5, top + 10], [x - 5, top + 10], [x - 13, top + 15], [x - width + 8, top + 27]], p.stoneShade);
  poly(c, [[x - width - 3, top + 24], [x - width + 2, top + 13], [x - 14, top + 2], [x - 6, top - 1], [x + 7, top - 1], [x + 17, top + 5], [x + width - 2, top + 15], [x + width + 2, top + 24], [x + width - 7, top + 24], [x + 13, top + 13], [x + 5, top + 9], [x - 5, top + 9], [x - 13, top + 14], [x - width + 7, top + 24]], p.stoneLight);
  line(c, x - width + 2, top + 13, x - 14, top + 2, IVORY); line(c, x - 14, top + 2, x - 6, top - 1, IVORY);
  for (const side of [-1, 1]) { line(c, x + side * 11, top + 4, x + side * 8, top + 10, p.stoneMid); line(c, x + side * 24, top + 12, x + side * 18, top + 17, p.stoneMid); }
  poly(c, [[x - 5, top - 2], [x + 5, top - 2], [x + 4, top + 9], [x, top + 12], [x - 4, top + 9]], GOLD);
  sunEmblem(c, x, top + 4, 3);
  for (const side of [-1, 1]) { vine(c, x + side * (width + 1), y - height + 24, welcome ? 30 : 20, p, welcome); }
  if (welcome) { lantern(c, x - 25, y - 31, time, true); lantern(c, x + 25, y - 31, time + .8, true); }
}

/** Individually authored landmarks; cached architecture and living overlays. */
export function drawLandmark(renderer, c, o, time = 0, state = {}) {
  const x = round(o.x), y = round(o.y), p = artPalette(renderer), variant = Number(o.variant) || 0;
  const key = `paradise-landmark-${biome(renderer)}-${variant}`;
  let image = renderer.sprites.get(key);
  if (!image) {
    image = makeCanvas(160, 170); const lc = image.getContext('2d'); lc.translate(80, 154);
    paintLandmark(renderer, lc, variant, p);
    renderer.sprites.set(key, image);
  }
  c.drawImage(image, x - 80, y - 154);
  c.save(); c.translate(x, y);
  if (variant === 0) {
    const shift = round(Math.sin(time * .75) * 2);
    line(c, 28, -53, 29 + shift, -11, '#c4ae83'); line(c, 45, -53, 46 + shift, -11, '#c4ae83');
    rect(c, 26 + shift, -11, 24, 3, '#926e55'); rect(c, 26 + shift, -12, 24, 1, '#e7c691');
    drawBird(c, -25 + round(Math.sin(time * .38) * 2), -91, time, '#c0dbeb');
    if (Math.sin(time * 1.4) > .7) sparkle(c, 13, -65, '#ffe8a7', 2);
  } else if (variant === 1) {
    lantern(c, -34, -39, time, true, '#f5e2ab'); lantern(c, 39, -60, time + .8, true, '#c3ebd6');
    if (floor(time * 3) % 10 === 0) rect(c, 6, -61, 2, 1, '#e2edbf');
  } else if (variant === 2) {
    const angle = floor(time * 6) * Math.PI / 36;
    drawWindmillBlades(c, 0, -66, angle);
    const shift = round(Math.sin(time * 1.8) * 2);
    poly(c, [[22, -93], [35, -92 + shift], [31, -85 + shift], [22, -87]], '#93bed1');
  } else if (variant === 3) {
    const phase = floor(time * 2) % 3;
    rim(c, 0, 8, 43 + phase * 2, 5 + phase, '#c9e8d7');
    if (Math.sin(time * 1.2) > .8) sparkle(c, -43, -38, '#fff4d9', 2);
  } else if (variant === 4) {
    drawWaterfall(c, 0, -53, 42, time, p);
    for (let i = 0; i < 3; i++) { const yy = -42 + floor(time * 19 + i * 13) % 40; rect(c, -10 + i * 9, yy, 2, 5, '#f3fcf1'); }
  } else if (variant === 5) {
    const sway = round(Math.sin(time * .9) * 1);
    flower(c, -25 + sway, -63, time, '#f3d2b1', p, 2); flower(c, 22 + sway, -63, time, '#fff0ca', p, 2);
    // Small clouds behind the suspended bowl preserve the base/contact area.
    c.globalAlpha *= .38;
    oval(c, -24 + round(Math.sin(time * .25) * 5), -9, 25, 4, '#ecf7ed');
    oval(c, 27 - round(Math.sin(time * .25) * 5), -3, 23, 4, '#f4faf0'); c.globalAlpha /= .38;
  } else if (variant === 6) {
    const shiny = floor(time * 2) % 4;
    sparkle(c, [-34, -12, 27, 44][shiny], [-67, -109, -77, -46][shiny], '#fff8dd', 2);
    rim(c, 0, 5, 31 + shiny * 2, 4, '#bed9e4');
  } else if (variant === 7) {
    const float = round(Math.sin(time * 1.1) * 2);
    sunEmblem(c, 0, -112 + float, 6);
    for (let i = 0; i < 4; i++) {
      const dx = -20 + i * 13, yy = 7 + floor((time * 5 + i * 3) % 11);
      rect(c, dx, yy, i % 2 ? 2 : 3, 1, i % 2 ? '#efe6ba' : '#c2d9c4');
    }
  } else if (variant === 8) {
    lantern(c, -47, -68, time, true, '#fff0b8'); lantern(c, 47, -68, time + .5, true, '#fff0b8');
    if (Math.sin(time * 1.4) > .6) sparkle(c, 0, -111, '#fff9dc', 3);
  } else {
    const angle = floor(time * 3) * Math.PI / 90;
    rim(c, 0, -59, 23, 36, '#e5cf92', 1, angle);
    sparkle(c, 0, -59 + round(Math.sin(time) * 1), '#fff3c8', 5);
    for (let i = 0; i < 3; i++) {
      const a = time * .17 + i * Math.PI * 2 / 3;
      rect(c, Math.cos(a) * 33, -59 + Math.sin(a) * 46, 2, 2, '#fff2c0');
    }
  }
  c.restore();
}
function paintLandmark(renderer, c, variant, p) {
  oval(c, 4, 7, 52, 11, '#345e7538');
  if (variant === 0 || variant === 1) {
    // Each tree is a little inhabited garden: orchard swing / ancient reading nook.
    const ancient = variant === 1, foliage = ancient ? [p.foliageDark, p.tree, p.foliageLight, p.foliageSun] : [mix(p.tree, '#254f68', .42), p.tree, mix(p.tree, '#b9df8e', .49), '#c3e394'];
    for (const side of [-1, 1]) {
      poly(c, [[side * 5, -19], [side * 13, -11], [side * 31, 5], [side * 46, 9], [side * 27, 9], [side * 7, -1]], p.barkShade);
      line(c, side * 6, -12, side * 31, 5, p.trunk, 4);
    }
    trunk(c, 0, 6, ancient ? 91 : 87, ancient ? 25 : 20, p, true);
    line(c, -2, -41, -28, -79, p.barkShade, 11); line(c, -2, -43, -29, -81, p.trunk, 7);
    line(c, 4, -49, 29, -92, p.barkShade, 10); line(c, 4, -50, 27, -94, p.trunk, 6);
    line(c, 10, -52, 50, -59, p.barkShade, 7); line(c, 11, -54, 49, -61, p.trunk, 4);
    leafCluster(c, -40, -78, 25, 27, foliage, 1); leafCluster(c, 39, -77, 25, 28, foliage, 6);
    leafCluster(c, -17, -108, 28, 26, foliage, 8); leafCluster(c, 25, -109, 26, 25, foliage, 3);
    leafCluster(c, 3, -79, 33, 28, foliage, 11);
    leafCluster(c, -5, -120, 22, 20, foliage, 14);
    if (!ancient) {
      [[-41, -75], [-17, -107], [40, -76], [18, -111], [12, -76], [-18, -60]].forEach(([x, y]) => fruit(c, x, y, p, '#eeae70'));
      flower(c, -22, 2, 0, '#f7e1a3', p, 2); flower(c, 11, 0, 0, '#eabcb8', p); flower(c, -37, 7, 0, '#afcdea', p);
    } else {
      vine(c, -49, -74, 33, p, true); vine(c, 48, -73, 30, p); vine(c, -22, -58, 20, p); vine(c, 16, -60, 17, p, true);
      poly(c, [[-6, -24], [-7, -33], [-4, -39], [2, -41], [7, -35], [7, -24]], p.barkShade);
      line(c, -4, -37, 1, -39, p.trunk); rect(c, -4, -26, 9, 2, '#acd0a7');
      rect(c, -33, 0, 19, 6, '#766f58'); rect(c, -35, -3, 23, 4, '#c7b58c');
      poly(c, [[-30, -4], [-25, -7], [-22, -5], [-17, -7], [-13, -4], [-21, -1]], '#f2e4ba'); line(c, -22, -5, -21, -1, '#bda478');
      flower(c, 29, 4, 0, '#efce99', p, 2);
    }
  } else if (variant === 2) {
    slab(c, 0, 7, 58, 8, p);
    poly(c, [[-22, 2], [-15, -63], [14, -63], [23, 2]], p.stoneShade);
    poly(c, [[-19, 0], [-13, -61], [5, -61], [12, 0]], p.stoneLight);
    poly(c, [[5, -61], [14, -61], [20, 0], [12, 0]], p.stoneMid);
    for (let i = 0; i < 5; i++) { const yy = -9 - i * 10; line(c, -19 + i, yy, 18 - i, yy, mix(p.stoneMid, p.stoneLight, .5)); }
    poly(c, [[-5, 1], [-5, -17], [-2, -21], [3, -21], [7, -16], [7, 1]], '#466d78'); rect(c, -3, -17, 8, 16, '#81a092');
    line(c, 1, -17, 1, -1, '#ccd4a9'); rect(c, 3, -9, 1, 1, GOLD);
    rect(c, -4, -41, 9, 9, '#537989'); rect(c, -3, -40, 7, 3, '#aacfc7'); rect(c, 0, -40, 1, 7, '#eddfac');
    poly(c, [[-22, -63], [-16, -77], [0, -87], [16, -77], [22, -63]], '#487c83');
    poly(c, [[-21, -65], [-15, -77], [0, -85], [0, -64]], '#99c3ab'); line(c, -22, -63, 22, -63, GOLD, 2);
    line(c, 22, -82, 22, -95, '#c3a273');
    for (const side of [-1, 1]) { poly(c, [[side * 24, 5], [side * 23, -8], [side * 34, -9], [side * 38, 1], [side * 35, 5]], '#ac9b6c'); line(c, side * 25, -7, side * 34, -8, '#f1d89a'); }
    flower(c, -35, -11, 0, '#a1c2df', p); flower(c, 33, -11, 0, '#b8d2e6', p);
  } else if (variant === 3) {
    // A raised shell bridge: stair flights, two side piers and a pearl crest.
    slab(c, 0, 6, 119, 10, p);
    for (let i = -4; i <= 4; i++) {
      const yy = -3 - (4 - Math.abs(i)) * 4, xx = i * 12;
      rect(c, xx - 6, yy, 12, 7, p.stoneMid); rect(c, xx - 6, yy - 2, 12, 3, '#f8e6c6');
      line(c, xx - 4, yy - 1, xx + 5, yy - 1, '#fff1d8');
    }
    for (const side of [-1, 1]) {
      column(c, side * 46, -3, 31, p, 8);
      shell(c, side * 46, -40, 12, '#e9bec4');
      line(c, side * 46, -28, side * 8, -42, '#d5cba4', 2);
      line(c, side * 43, -27, side * 8, -40, '#fff0d3');
      for (let i = 0; i < 4; i++) { const xx = side * (12 + i * 8), yy = -39 + i * 3; line(c, xx, yy, xx, yy + 11, '#c9c5a4'); }
      flower(c, side * 58, 4, 0, '#e2b6c5', p, 2);
    }
    oval(c, 0, -43, 9, 7, '#91c5c1'); oval(c, -1, -46, 6, 5, '#f3f1d9'); rect(c, -3, -48, 3, 2, '#ffffff');
    sunEmblem(c, 0, -56, 4);
  } else if (variant === 4) {
    for (let i = 0; i < 8; i++) {
      const yy = -i * 7, width = 49 - i * 3;
      rect(c, -width, yy - 5, width * 2, 7, p.stoneShade); rect(c, -width, yy - 7, width * 2, 3, p.stoneLight);
      rect(c, -width + 2, yy - 6, width * 2 - 4, 1, '#faf7e5');
      rect(c, -13, yy - 4, 26, 4, '#a5d9d4');
    }
    for (const side of [-1, 1]) {
      column(c, side * 49, 1, 55, p, 8); column(c, side * 26, -48, 35, p, 8);
      line(c, side * 49, -54, side * 26, -82, p.stoneMid, 4); line(c, side * 49, -56, side * 26, -84, IVORY, 2);
    }
    slab(c, 0, -97, 47, 6, p); oval(c, 0, -99, 18, 4, p.water); rim(c, 0, -99, 17, 4, '#cbeade');
    sunEmblem(c, 0, -115, 7);
    for (const side of [-1, 1]) stone(c, side * 56, 7, 10, 17, p);
  } else if (variant === 5) {
    // A garden bowl genuinely suspended by two ornamental chains.
    for (const side of [-1, 1]) {
      column(c, side * 45, 4, 105, p, 9);
      line(c, side * 45, -99, side * 26, -104, GOLD, 3);
      line(c, side * 26, -103, side * 26, -43, '#a4aa87');
      for (let i = 0; i < 10; i++) rect(c, side * 26 - 1, -100 + i * 6, 3, 2, '#e6d4a2');
    }
    poly(c, [[-43, -45], [43, -45], [34, -26], [14, -18], [-16, -18], [-35, -27]], p.stoneShade);
    poly(c, [[-40, -45], [40, -45], [32, -29], [14, -23], [-15, -23], [-32, -31]], p.stoneLight);
    slab(c, 0, -44, 92, 10, p); oval(c, 0, -47, 38, 6, '#91b795');
    for (let i = 0; i < 7; i++) {
      const xx = -30 + i * 10, yy = -56 - i % 3 * 7;
      line(c, xx, -46, xx + (i % 2 ? 2 : -2), yy, p.foliageDark, 2);
      poly(c, [[xx, -50], [xx - 6, -58], [xx - 8, -55], [xx - 2, -48]], p.tree);
      flower(c, xx, yy, 0, ['#f0d6b9', '#d9e5c2', '#ead2d9'][i % 3], p, 2);
    }
    vine(c, -30, -35, 24, p, true); vine(c, 29, -35, 21, p); vine(c, 11, -24, 12, p);
    sunEmblem(c, 0, -34, 4);
  } else if (variant === 6) {
    // A crystal geode framing a luminous interior, not a generic pile of diamonds.
    drawArchitecture(renderer, c, { variant: 'cave', x: 0, y: -4 }, 0);
    const crystals = [[-48, 1, 7, 42], [-35, -12, 10, 68], [-17, -15, 11, 101], [5, -17, 9, 114], [24, -11, 10, 86], [42, -2, 8, 60], [54, 5, 5, 34]];
    crystals.forEach(([x, y, w, h], i) => prism(c, x, y, w, h, i % 2 ? ['#7b85af', '#b1add4', '#e0d6ec'] : ['#6686ae', '#a0c4d6', '#d4ece3']));
    slab(c, 0, 10, 91, 9, p); oval(c, 0, 6, 35, 5, '#82b5cf'); rim(c, 0, 6, 32, 4, '#c7e8e6');
    flower(c, -53, 9, 0, '#f0c4e7', p, 2); flower(c, 50, 8, 0, '#cfd9ec', p, 2);
  } else if (variant === 7) {
    slab(c, 0, 6, 88, 9, p); drawArch(c, 0, -3, 28, 83, p, 0);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const yy = -60 + i * 10, wing = 64 - i * 7;
        poly(c, [[side * 27, yy + 7], [side * (wing - 4), yy - 14], [side * wing, yy - 22], [side * (wing - 1), yy - 8], [side * 35, yy + 11]], p.stoneShade);
        poly(c, [[side * 28, yy + 4], [side * (wing - 5), yy - 15], [side * (wing - 1), yy - 21], [side * (wing - 3), yy - 9], [side * 34, yy + 7]], '#e3ead0');
        line(c, side * 32, yy + 3, side * (wing - 4), yy - 13, '#fff1c7');
      }
      vine(c, side * 35, -8, 18, p);
    }
    sunEmblem(c, 0, -99, 4);
  } else if (variant === 8) {
    slab(c, 0, 8, 133, 11, p); slab(c, 0, 4, 117, 8, p);
    drawArch(c, 0, 0, 28, 91, p, 0);
    for (const side of [-1, 1]) {
      column(c, side * 48, 2, 83, p, 12);
      rect(c, side < 0 ? -54 : 25, -87, 30, 7, p.stoneShade);
      rect(c, side < 0 ? -54 : 25, -88, 30, 3, '#fff0ce');
      sunEmblem(c, side * 48, -71, 3);
      vine(c, side * 57, -72, 30, p, true);
    }
    poly(c, [[-55, -89], [-39, -95], [-13, -106], [0, -114], [15, -106], [40, -95], [56, -89]], '#94b8a7');
    line(c, -54, -90, 0, -114, '#fff1c8', 2); line(c, 0, -114, 55, -90, GOLD, 2);
    for (let i = 0; i < 9; i++) {
      const xx = -40 + i * 10, yy = -89 - round(Math.sin(i / 8 * Math.PI) * 12);
      flower(c, xx, yy, 0, i % 2 ? '#e7c58b' : '#fff1c9', p, 2);
    }
  } else {
    slab(c, 0, 7, 124, 13, p); slab(c, 0, 3, 112, 10, p);
    for (const side of [-1, 1]) column(c, side * 33, 0, 26, p, 12);
    // Multi-layer stone annulus with sunlit edge and carved radial segments.
    stoneRing(c, 0, -59, 52, 62, 9, p);
    rim(c, 0, -59, 48, 58, '#eee2b1');
    for (let i = 0; i < 12; i++) {
      const angle = i / 12 * Math.PI * 2, xx = Math.cos(angle) * 49, yy = -59 + Math.sin(angle) * 59;
      poly(c, [[xx, yy - 2], [xx + 2, yy], [xx, yy + 2], [xx - 2, yy]], '#d9bd84');
      line(c, Math.cos(angle) * 44, -59 + Math.sin(angle) * 54, Math.cos(angle) * 51, -59 + Math.sin(angle) * 61, p.stoneShade);
    }
    line(c, -22, -59, 22, -59, '#c3d5bc'); line(c, 0, -95, 0, -22, '#d4dbc0');
    for (const side of [-1, 1]) flower(c, side * 52, 5, 0, '#e9e5c2', p, 2);
  }
}
function shell(c, x, y, size, color) {
  const dark = mix(color, '#6c8099', .35);
  poly(c, [[x - size, y + 5], [x - size, y - 3], [x - size * .7, y - 10], [x - 3, y - 13], [x + 4, y - 13], [x + size * .8, y - 9], [x + size, y - 2], [x + size - 1, y + 5], [x, y + 9]], dark);
  poly(c, [[x - size + 2, y + 3], [x - size + 2, y - 3], [x - 6, y - 9], [x - 2, y - 11], [x + 4, y - 11], [x + size - 2, y - 5], [x + size - 2, y + 3], [x, y + 7]], color);
  for (let i = -2; i <= 2; i++) line(c, x, y + 6, x + i * 4, y - 9 + Math.abs(i) * 2, '#fff0d5');
  rect(c, x - 2, y + 6, 5, 2, '#e3c99f');
}
function drawWindmillBlades(c, x, y, angle) {
  for (let i = 0; i < 4; i++) {
    const a = angle + i * Math.PI / 2, dx = Math.cos(a), dy = Math.sin(a), tx = -dy, ty = dx;
    line(c, x - dx * 3, y - dy * 3, x + dx * 38, y + dy * 38, '#718580', 2);
    poly(c, [[x + dx * 13, y + dy * 13], [x + dx * 38, y + dy * 38], [x + dx * 38 + tx * 9, y + dy * 38 + ty * 9], [x + dx * 13 + tx * 7, y + dy * 13 + ty * 7]], '#e7deb5');
    line(c, x + dx * 13, y + dy * 13, x + dx * 38, y + dy * 38, '#fff2c7');
    for (let k = 15; k < 39; k += 5) line(c, x + dx * k, y + dy * k, x + dx * k + tx * 8, y + dy * k + ty * 8, '#a1b19b');
  }
  oval(c, x, y, 4, 4, '#947b5d'); oval(c, x - 1, y - 1, 2, 2, GOLD);
}
function drawBird(c, x, y, time, color) {
  const flap = floor(time * 5) % 4;
  poly(c, [[x - 4, y], [x - 3, y - 4], [x + 1, y - 5], [x + 4, y - 2], [x + 4, y + 1], [x, y + 3]], '#527e96');
  poly(c, [[x - 3, y], [x - 2, y - 3], [x + 1, y - 4], [x + 3, y - 1], [x + 1, y + 2]], color);
  poly(c, [[x - 2, y - 1], [x - 9, y - 5 + flap], [x - 6, y + 1], [x - 1, y + 2]], '#a2c6d9');
  rect(c, x + 2, y - 3, 1, 1, DEEP); rect(c, x + 4, y - 2, 2, 1, GOLD); line(c, x - 1, y + 3, x - 1, y + 5, '#846f59');
}

const INGREDIENT_IDS = ['aurora_pollen', 'eternal_sap', 'golden_seed', 'pearl_salt', 'white_limestone', 'cloud_dew', 'prism_spore', 'sky_feather', 'light_nectar'];
export function drawIngredient(renderer, c, o, time = 0) {
  const x = round(o.x), y = round(o.y), p = artPalette(renderer), fromId = INGREDIENT_IDS.indexOf(o.id);
  const variant = fromId < 0 ? Math.min(8, biome(renderer)) : fromId;
  const bob = round(Math.sin(time * 1.7) * 1.1), yy = y - 5 + bob;
  slab(c, x, y + 2, 23, 4, p); sunEmblem(c, x, y - 1, 2);
  // Quiet ornamental halo, no overwhelming glow that hides the pickup.
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + time * .12;
    rect(c, x + Math.cos(a) * 16, y + Math.sin(a) * 5, 2, 1, '#eadab0');
  }
  if (variant === 0) {
    line(c, x, yy, x - 1, yy - 20, '#557e68', 2);
    poly(c, [[x, yy - 8], [x - 8, yy - 14], [x - 9, yy - 10], [x - 2, yy - 6]], '#68a477');
    poly(c, [[x, yy - 11], [x + 7, yy - 19], [x + 9, yy - 16], [x + 2, yy - 8]], '#a9cb87');
    flower(c, x - 1, yy - 23, time, '#fff0b8', p, 2);
    rect(c, x + 6, yy - 26, 1, 1, GOLD); rect(c, x - 8, yy - 29, 1, 1, '#fff1c5');
  } else if (variant === 1) {
    // Amber sap held by an old living bough and a leaf cup.
    line(c, x - 7, yy, x - 5, yy - 23, '#896b5b', 5); line(c, x - 7, yy - 1, x - 6, yy - 23, '#c1a079', 2);
    line(c, x - 5, yy - 18, x + 3, yy - 24, '#896b5b', 3);
    poly(c, [[x + 2, yy - 18], [x + 7, yy - 10], [x + 6, yy - 7], [x + 2, yy - 5], [x - 1, yy - 9]], '#cba15f');
    poly(c, [[x + 2, yy - 17], [x + 4, yy - 10], [x + 2, yy - 7], [x, yy - 9]], '#f7d786');
    poly(c, [[x - 3, yy - 3], [x + 8, yy - 4], [x + 5, yy + 1], [x, yy + 1]], '#7ea98d');
    rect(c, x + 2, yy - 11, 1, 2, '#fff3b7'); vine(c, x - 4, yy - 21, 13, p);
  } else if (variant === 2) {
    for (const side of [-1, 0, 1]) {
      const xx = x + side * 5, top = yy - 18 - (side === 0 ? 6 : 0);
      line(c, xx, yy, xx + side, top, '#8b9252');
      for (let k = 0; k < 4; k++) { poly(c, [[xx + side, top + k * 3], [xx + side - 4, top + k * 3 - 2], [xx + side - 3, top + k * 3 + 2]], '#e9c777'); poly(c, [[xx + side, top + k * 3], [xx + side + 4, top + k * 3 - 2], [xx + side + 3, top + k * 3 + 2]], '#f7dea0'); }
    }
    rect(c, x - 4, yy - 6, 8, 2, '#96a26b');
  } else if (variant === 3) {
    shell(c, x, yy - 11, 11, '#edc5c7');
    oval(c, x, yy - 8, 4, 3, '#a7bdc2'); oval(c, x - 1, yy - 10, 3, 3, '#fff1d6'); rect(c, x - 2, yy - 11, 2, 1, '#ffffff');
  } else if (variant === 4) {
    stone(c, x, yy, 10, 18, { ...p, stoneShade: '#839fae', stoneMid: '#bfd4d2', stoneLight: '#edf2de' });
    poly(c, [[x - 4, yy - 12], [x, yy - 20], [x + 4, yy - 14], [x + 1, yy - 8]], '#f3f6e4');
    rect(c, x - 1, yy - 15, 2, 1, '#ffffff'); flower(c, x + 9, yy - 5, 0, '#d4c5e7', p);
  } else if (variant === 5) {
    poly(c, [[x - 10, yy - 3], [x - 5, yy - 9], [x, yy - 5], [x + 7, yy - 10], [x + 11, yy - 4], [x + 7, yy], [x - 5, yy]], '#88b8a9');
    line(c, x - 7, yy - 4, x + 8, yy - 4, '#d2e9bd');
    poly(c, [[x, yy - 25], [x + 6, yy - 14], [x + 4, yy - 8], [x, yy - 5], [x - 4, yy - 8], [x - 6, yy - 14]], '#76adba');
    poly(c, [[x, yy - 23], [x + 3, yy - 14], [x, yy - 7], [x - 3, yy - 10], [x - 3, yy - 15]], '#dbf3e6'); rect(c, x - 2, yy - 14, 1, 4, '#ffffff');
  } else if (variant === 6) {
    prism(c, x - 5, yy, 4, 18, ['#827da8', '#bbaed5', '#e6d9ef']); prism(c, x + 3, yy - 1, 6, 27, ['#6d85ad', '#b3c7e2', '#e0f1e9']);
    flower(c, x - 5, yy - 18, 0, '#e7bfe5', p, 1); rect(c, x + 3, yy - 17, 2, 2, '#fff0c4');
  } else if (variant === 7) {
    line(c, x - 6, yy, x + 7, yy - 28, '#c2a879', 2);
    for (let i = 0; i < 6; i++) {
      const xx = x - 4 + i * 2, py = yy - 4 - i * 4;
      poly(c, [[xx, py], [xx - 8 + i, py - 4], [xx - 7 + i, py - 8], [xx + 2, py - 3]], i % 2 ? '#d3e6df' : '#f1edd5');
      poly(c, [[xx, py], [xx + 7 - i / 2, py - 2], [xx + 9 - i / 2, py - 7], [xx + 2, py - 4]], '#aecbd6');
    }
    line(c, x - 5, yy - 1, x + 7, yy - 27, '#fff3ce');
  } else {
    line(c, x, yy, x, yy - 24, '#869864', 2);
    flower(c, x, yy - 26, time, '#fff0ba', p, 2);
    poly(c, [[x - 8, yy - 8], [x - 4, yy - 14], [x, yy - 11], [x + 7, yy - 16], [x + 10, yy - 9], [x + 4, yy - 3], [x - 3, yy - 3]], '#a4be7e');
    line(c, x - 6, yy - 8, x + 8, yy - 9, '#dde5a6');
    poly(c, [[x, yy - 20], [x + 3, yy - 13], [x, yy - 10], [x - 3, yy - 13]], '#efd18e'); rect(c, x - 1, yy - 14, 1, 2, '#fff7ce');
  }
  if (Math.sin(time * 1.3 + variant) > .6) sparkle(c, x + 14, yy - 26, '#fff1c4', 2);
}

/** Discrete caustics, shoreline ripples, fish and sky-current frames. */
export function drawWater(renderer, world, time = 0) {
  const c = renderer.ctx, p = artPalette(renderer), width = renderer.canvas.width, height = renderer.canvas.height;
  const left = Math.max(0, floor(renderer.camera.x / TILE)), top = Math.max(0, floor(renderer.camera.y / TILE));
  const right = Math.min(world.width - 1, Math.ceil((renderer.camera.x + width) / TILE)), bottom = Math.min(world.height - 1, Math.ceil((renderer.camera.y + height) / TILE));
  const frame = floor(time * 6), phase = frame % 8;
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    if (world.tiles[y][x] !== 2) continue;
    const px = x * TILE, py = y * TILE;
    if (world.biome === 7) {
      if ((x + y) % 4 === 0) { rect(c, px + 1 + phase / 3, py + 5, 9, 1, '#e1f2f2'); rect(c, px + 5 + phase / 3, py + 6, 8, 1, '#d4e9ef'); }
      continue;
    }
    if ((x + y * 3) % 4 === 0) {
      const row = 3 + (phase + y) % 9;
      rect(c, px + 2, py + row, 7, 1, p.waterShine); rect(c, px + 8, py + row + 1, 4, 1, p.waterShineMid);
      rect(c, px + 1, py + row - 1, 2, 1, p.waterShineDark);
    }
    if ((x * 7 + y * 11) % 29 === 0) {
      const xx = px + 7 + round(Math.sin(time * .6 + y) * 2), yy = py + 5;
      line(c, xx - 3, yy + 2, xx, yy, p.waterCaustic); line(c, xx, yy, xx + 4, yy + 1, p.waterShineMid);
      rect(c, xx + 2, yy + 3, 3, 1, p.waterShine);
    }
    const topLand = world.tiles[y - 1]?.[x], bottomLand = world.tiles[y + 1]?.[x];
    if (topLand !== undefined && topLand !== 2 && topLand !== 4 && (x + phase) % 3 === 0) rect(c, px + 3, py + 2 + phase % 2, 7, 1, '#d8f0de');
    if (bottomLand !== undefined && bottomLand !== 2 && bottomLand !== 4 && (x + phase) % 3 === 1) rect(c, px + 2, py + 12 - phase % 2, 8, 1, '#bde6dc');
    if ((x * 13 + y * 7) % 79 === 0) {
      const fx = px + 7 + round(Math.sin(time * .55 + y) * 3), fy = py + 10, dark = p.fishColor;
      poly(c, [[fx - 4, fy], [fx, fy - 2], [fx + 4, fy], [fx, fy + 2]], dark);
      line(c, fx + 4, fy, fx + 6, fy - (phase % 2 ? 1 : 2), dark); line(c, fx + 4, fy, fx + 6, fy + (phase % 2 ? 2 : 1), dark);
      rect(c, fx - 2, fy, 1, 1, p.fishLight);
    }
  }
}
