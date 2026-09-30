import { BIOMES, BOSSES, WEAPONS } from '../data/content.js';
import { TILE, buildWorld } from '../world/world.js';

const FALLBACK = { grass: '#78b97b', grassLight: '#92cf89', grassDark: '#55926d', path: '#dfcf9d', water: '#64bcc7', waterLight: '#b0eadb', tree: '#458978', trunk: '#87694f', accent: '#ffce80', sky: '#d7f5ec' };
const INK = '#253f50';
const CREAM = '#fff0cd';
const GOLD = '#edbd71';
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const noise = (x, y, seed = 0) => {
  let n = Math.imul(x + 1453, 374761393) ^ Math.imul(y + seed * 23, 668265263);
  n = Math.imul(n ^ n >>> 13, 1274126177);
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
};
function shade(color, amount) {
  if (!/^#[\da-f]{6}$/i.test(color || '')) return color || '#ffffff';
  const n = parseInt(color.slice(1), 16);
  return `#${[n >> 16, n >> 8 & 255, n & 255].map(v => clamp(v + amount, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  x = Math.round(x); y = Math.round(y); rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
  for (let row = -ry; row <= ry; row++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    c.fillRect(x - span, y + row, span * 2 + 1, 1);
  }
}
function polygon(c, points, color) {
  const top = Math.ceil(Math.min(...points.map(p => p[1]))), bottom = Math.floor(Math.max(...points.map(p => p[1])));
  c.fillStyle = color;
  for (let y = top; y <= bottom; y++) {
    const crossings = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) crossings.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i < crossings.length; i += 2) c.fillRect(Math.ceil(crossings[i]), y, Math.floor(crossings[i + 1]) - Math.ceil(crossings[i]) + 1, 1);
  }
}
function line(c, x1, y1, x2, y2, color, width = 1) {
  x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
  const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1, dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  for (let steps = 0; steps < 2000; steps++) {
    rect(c, x1 - Math.floor(width / 2), y1 - Math.floor(width / 2), width, width, color);
    if (x1 === x2 && y1 === y2) break;
    const e2 = err * 2;
    if (e2 >= dy) { err += dy; x1 += sx; }
    if (e2 <= dx) { err += dx; y1 += sy; }
  }
}
function ring(c, x, y, rx, ry, color, broken = false, time = 0) {
  for (let i = 0; i < 60; i++) {
    if (broken && i % 15 > 7) continue;
    const a = i / 60 * Math.PI * 2 + time;
    rect(c, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 2, 1, color);
  }
}
function star(c, x, y, color, size = 4) {
  line(c, x - size, y, x + size, y, color);
  line(c, x, y - size, x, y + size, color);
  rect(c, x - 1, y - 1, 3, 3, color);
}
function canvas(width, height) {
  const element = document.createElement('canvas'); element.width = width; element.height = height;
  return element;
}

/** Original, palette-specific pixel sprites are painted on integer coordinates. */
export class Renderer {
  constructor(element) {
    this.canvas = element;
    this.canvas.width = 640; this.canvas.height = 360;
    this.ctx = element.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.camera = { x: 0, y: 0 };
    this.terrain = null;
    this.world = null;
    this.sprites = new Map();
  }
  screenToWorld(x, y) { return { x: x + this.camera.x, y: y + this.camera.y }; }
  prepare(world) {
    this.world = world;
    this.palette = { ...FALLBACK, ...BIOMES[world.biome]?.palette };
    this.sprites.clear();
    this.terrain = canvas(world.width * TILE, world.height * TILE);
    const c = this.terrain.getContext('2d'); c.imageSmoothingEnabled = false;
    const p = this.palette;
    for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) {
      const tile = world.tiles[y][x], px = x * TILE, py = y * TILE;
      const variant = Math.floor(noise(x, y, world.biome) * 6);
      if (tile === 0) {
        rect(c, px, py, 16, 16, p.grass);
        for (let i = 0; i < 5; i++) {
          const dx = Math.floor(noise(x * 11 + i, y) * 15), dy = Math.floor(noise(y * 9 + i, x) * 15);
          rect(c, px + dx, py + dy, i % 2 ? 2 : 1, i % 3 ? 1 : 2, i % 2 ? p.grassLight : shade(p.grass, -8));
        }
        if (variant === 1) { rect(c, px + 4, py + 9, 1, 3, p.grassDark); rect(c, px + 5, py + 8, 1, 3, p.grassLight); }
      } else if (tile === 1) {
        rect(c, px, py, 16, 16, p.path);
        for (let i = 0; i < 4; i++) rect(c, px + Math.floor(noise(x + i, y + 51) * 14), py + Math.floor(noise(y + i, x + 21) * 14), 2, 1, shade(p.path, i % 2 ? 10 : -10));
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (world.tiles[y + dy]?.[x + dx] !== 0) continue;
          const edgeX = px + (dx > 0 ? 14 : dx < 0 ? 0 : variant % 12), edgeY = py + (dy > 0 ? 14 : dy < 0 ? 0 : variant % 12);
          rect(c, edgeX, edgeY, dx ? 2 : 5, dy ? 2 : 5, p.grass);
          rect(c, edgeX + (dx > 0 ? -1 : 1), edgeY + (dy > 0 ? -1 : 1), 1, 1, p.grassLight);
        }
      } else if (tile === 2) {
        rect(c, px, py, 16, 16, world.biome === 7 ? '#c7e8ee' : p.water);
        if (variant < 3) rect(c, px + 3, py + 7, 7, 1, shade(p.water, 7));
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const neighbor = world.tiles[y + dy]?.[x + dx];
          if (neighbor !== 0 && neighbor !== 1 && neighbor !== 5) continue;
          rect(c, px + (dx > 0 ? 13 : 0), py + (dy > 0 ? 13 : 0), dx ? 3 : 16, dy ? 3 : 16, shade(p.water, 20));
          rect(c, px + (dx > 0 ? 15 : 0), py + (dy > 0 ? 15 : 0), dx ? 1 : 16, dy ? 1 : 16, p.waterLight);
        }
      } else if (tile === 3) {
        rect(c, px, py, 16, 16, shade(p.path, -26));
        rect(c, px + 1, py + 1, 14, 10, shade(p.path, 8));
        rect(c, px + 3, py + 2, 8, 2, shade(p.path, 22));
        line(c, px + 2, py + 11, px + 13, py + 11, shade(p.path, -7));
        if (world.tiles[y + 1]?.[x] !== 3) {
          rect(c, px, py + 8, 16, 8, shade(p.path, -38));
          rect(c, px + 2, py + 9, 12, 3, shade(p.path, -13));
          rect(c, px + 4, py + 13, 2, 3, shade(p.path, -22));
        }
      } else if (tile === 4) {
        rect(c, px, py, 16, 16, p.water);
        rect(c, px, py + 1, 16, 14, '#a78566');
        for (let row = 0; row < 4; row++) { rect(c, px, py + row * 4 + 1, 16, 2, '#d2b18b'); rect(c, px + 3 + row % 2 * 7, py + row * 4 + 2, 1, 1, '#82624f'); }
        if (world.tiles[y - 1]?.[x] !== 4) { rect(c, px, py, 16, 2, '#f0d5a4'); rect(c, px + 1, py - 3, 2, 5, '#856447'); }
        if (world.tiles[y + 1]?.[x] !== 4) { rect(c, px, py + 14, 16, 2, '#f0d5a4'); rect(c, px + 13, py + 12, 2, 6, '#856447'); }
      } else {
        const marble = shade(p.path, 15);
        rect(c, px, py, 16, 16, marble);
        line(c, px, py + 15, px + 15, py + 15, shade(marble, -14));
        line(c, px + 15, py, px + 15, py + 15, shade(marble, -14));
        rect(c, px + 2, py + 2, 11, 1, shade(marble, 8));
        if (variant === 3) { line(c, px + 3, py + 8, px + 7, py + 4, shade(marble, -7)); line(c, px + 7, py + 4, px + 10, py + 8, shade(marble, -7)); }
      }
    }
  }
  treeSprite(object) {
    const key = `tree-${object.variant}-${object.seed % 4}`;
    if (this.sprites.has(key)) return this.sprites.get(key);
    const image = canvas(72, 86), c = image.getContext('2d'), p = this.palette;
    const dark = shade(p.tree, -21), light = shade(p.tree, 22), highlight = shade(p.tree, 43);
    const variant = object.variant;
    rect(c, 32, 50, 9, 29, shade(p.trunk, -18));
    rect(c, 34, 49, 5, 28, p.trunk); rect(c, 35, 55, 2, 21, shade(p.trunk, 24));
    line(c, 33, 69, 28, 80, p.trunk, 2); line(c, 38, 70, 45, 79, shade(p.trunk, -14), 2);
    if (variant === 'palm') {
      rect(c, 35, 25, 5, 42, p.trunk);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3, ex = 36 + Math.cos(a) * 29, ey = 31 + Math.sin(a) * 18;
        polygon(c, [[36, 29], [ex, ey], [ex + 3, ey + 8], [37, 34]], dark);
        line(c, 36, 30, ex, ey + 3, light, 2);
      }
      ellipse(c, 32, 36, 3, 4, '#bd9161'); ellipse(c, 40, 35, 3, 4, '#e4b481');
    } else if (variant === 'pine') {
      polygon(c, [[36, 5], [57, 39], [47, 37], [65, 58], [7, 58], [23, 37], [15, 39]], dark);
      polygon(c, [[36, 6], [52, 34], [39, 30], [58, 53], [17, 53], [30, 31], [23, 35]], p.tree);
      polygon(c, [[36, 6], [38, 12], [30, 27], [43, 27], [39, 33], [26, 44], [50, 44], [54, 50], [19, 50]], light);
      line(c, 29, 27, 42, 27, '#edf5d8', 2); line(c, 20, 48, 52, 48, '#edf5d8', 2);
    } else {
      const isRound = variant === 'round';
      ellipse(c, 36, 35, isRound ? 27 : 31, isRound ? 24 : 26, dark);
      ellipse(c, 21, 37, 17, 18, dark); ellipse(c, 50, 36, 18, 18, dark);
      ellipse(c, 36, 29, 27, 21, p.tree); ellipse(c, 19, 32, 13, 14, p.tree); ellipse(c, 54, 30, 12, 15, p.tree);
      ellipse(c, 28, 23, 19, 13, light); ellipse(c, 44, 22, 16, 14, light);
      ellipse(c, 29, 15, 12, 5, highlight); ellipse(c, 46, 19, 9, 5, highlight);
      for (let i = 0; i < 28; i++) {
        const x = 12 + Math.floor(noise(i, object.seed) * 49), y = 14 + Math.floor(noise(i + 17, object.seed) * 34);
        if ((x - 36) ** 2 / 29 ** 2 + (y - 32) ** 2 / 22 ** 2 > 0.87) continue;
        rect(c, x, y, 3, 1, i % 3 ? light : dark); rect(c, x + 1, y - 1, 1, 1, i % 3 ? light : dark);
      }
      if (variant === 'fruit') for (const [x, y] of [[18, 37], [44, 35], [55, 28], [31, 24]]) {
        ellipse(c, x, y, 2, 3, '#e29961'); rect(c, x, y - 3, 1, 2, '#657549'); rect(c, x - 1, y - 1, 1, 1, '#ffe8ac');
      }
      if (variant === 'silver') {
        for (const [x, y] of [[18, 30], [43, 24], [54, 35], [29, 38]]) ellipse(c, x, y, 3, 3, '#e9f0d4');
      }
      if (variant === 'ancient') { line(c, 27, 51, 24, 65, light); line(c, 49, 49, 48, 65, light); }
    }
    this.sprites.set(key, image);
    return image;
  }
  draw(state, world, time = 0) {
    if (!state || !world) return;
    if (this.world !== world) this.prepare(world);
    const c = this.ctx, player = state.player || { x: 192, y: 610 };
    const p = this.palette;
    const electric = !!state.electricUnlocked, riftCount = state.riftNodes?.length || 0;
    if (electric && (!this._electrified || riftCount > (this._riftCount || 0))) this._electricFlashUntil = time + .65;
    this._electrified = electric; this._riftCount = riftCount;
    this.camera.x = Math.round(clamp(player.x - 320, 0, world.width * TILE - 640));
    this.camera.y = Math.round(clamp(player.y - 180, 0, world.height * TILE - 360));
    c.imageSmoothingEnabled = false;
    rect(c, 0, 0, 640, 360, p.sky);
    c.drawImage(this.terrain, this.camera.x, this.camera.y, 640, 360, 0, 0, 640, 360);
    c.save(); c.translate(-this.camera.x, -this.camera.y);
    const visible = o => o.x > this.camera.x - 110 && o.y > this.camera.y - 70 && o.x < this.camera.x + 750 && o.y < this.camera.y + 470;
    this.water(world, time);
    const objectList = world.objects.filter(o => visible(o) && !o.hidden);
    for (const object of objectList) if (['flower', 'bush', 'arena', 'resource'].includes(object.type)) this.object(c, object, time, state);
    for (const object of objectList) {
      if (!['tree', 'rock', 'crystal', 'support', 'ruin'].includes(object.type)) continue;
      if (object.type === 'tree' && object.depleted) continue;
      ellipse(c, object.x + 4, object.y + 2, object.type === 'tree' ? 22 : object.type === 'support' ? 27 : 12, object.type === 'tree' ? 8 : 4, '#497e7350');
    }
    if (world.ingredient && !state.ingredients?.includes(world.ingredient.id)) this.ingredient(c, world.ingredient, time);
    for (const secret of world.secrets || []) {
      const found = secret.collected || state.secrets?.includes(secret.id);
      if (!found) { ellipse(c, secret.x, secret.y, 6, 3, '#e7c788'); star(c, secret.x, secret.y - 9, CREAM, 3); }
    }
    for (const spot of world.bosses) {
      if (state.defeated?.includes(spot.id) || state.boss?.id === spot.id) continue;
      ring(c, spot.x, spot.y, 30, 12, GOLD, true, time * 0.15);
      star(c, spot.x, spot.y - 12 + Math.sin(time * 2) * 2, CREAM, 5);
      rect(c, spot.x - 2, spot.y - 26, 5, 6, GOLD);
      polygon(c, [[spot.x, spot.y - 31], [spot.x + 5, spot.y - 24], [spot.x, spot.y - 17], [spot.x - 5, spot.y - 24]], CREAM);
    }
    if (world.rift) this.rift(c, world, state, time);
    for (const enemy of state.enemies || []) if (visible(enemy)) this.telegraph(c, enemy, false, time);
    if (state.boss) this.telegraph(c, state.boss, true, time);
    const sorted = [];
    for (const object of objectList) if (!['flower', 'bush', 'arena', 'resource'].includes(object.type)) sorted.push({ y: object.y, object });
    for (const npc of world.npcs || []) sorted.push({ y: npc.y, npc });
    for (const camp of state.camps?.[state.biome] || []) sorted.push({ y: camp.y, object: { ...camp, type: 'camp' } });
    for (const enemy of state.enemies || []) if (visible(enemy)) sorted.push({ y: enemy.y, enemy });
    if (state.boss) sorted.push({ y: state.boss.y, boss: state.boss });
    sorted.push({ y: player.y, player });
    sorted.sort((a, b) => a.y - b.y);
    const actors = [player, ...(state.enemies || []), ...(state.boss ? [state.boss] : [])];
    for (const entry of sorted) {
      if (entry.object) {
        const o = entry.object;
        const coversActor = (o.type === 'tree' || o.type === 'landmark') && actors.some(actor => actor.y < o.y - 9 && actor.y > o.y - (o.type === 'tree' ? 73 : 126) && Math.abs(actor.x - o.x) < (o.type === 'tree' ? 34 : 55));
        c.globalAlpha = coversActor ? 0.46 : 1;
        this.object(c, o, time, state); c.globalAlpha = 1;
      } else if (entry.npc) this.npc(c, entry.npc, time);
      else if (entry.player) this.player(c, entry.player, time, state);
      else if (entry.boss) this.boss(c, entry.boss, time, state);
      else this.enemy(c, entry.enemy, time, state);
    }
    for (const projectile of state.projectiles || []) this.projectile(c, projectile, time);
    for (const particle of state.particles || []) {
      c.globalAlpha = clamp(particle.life * 2, 0, 1);
      if (particle.text) {
        c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(particle.text, Math.round(particle.x + 1), Math.round(particle.y + 1));
        c.fillStyle = particle.color || CREAM; c.fillText(particle.text, Math.round(particle.x), Math.round(particle.y));
      } else rect(c, particle.x, particle.y, particle.size || 2, particle.size || 2, particle.color || '#ffe2a5');
    }
    c.globalAlpha = 1;
    this.interactions(c, world, state, time);
    c.restore();
    const day = ((state.worldTime || 0) % 780) / 780;
    const darkness = day >= 11 / 24 && day < 22 / 24 ? Math.max(0, Math.cos((day - 16.5 / 24) * Math.PI / (11 / 24))) : 0;
    if (darkness > 0.02) { c.globalAlpha = darkness * 0.26; rect(c, 0, 0, 640, 360, '#264368'); c.globalAlpha = 1; }
    this.ambience(c, world, state, time, darkness);
  }
  water(world, time) {
    const c = this.ctx, p = this.palette;
    const left = Math.floor(this.camera.x / TILE), right = Math.ceil((this.camera.x + 640) / TILE);
    const top = Math.floor(this.camera.y / TILE), bottom = Math.ceil((this.camera.y + 360) / TILE);
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      if (world.tiles[y]?.[x] !== 2) continue;
      const phase = Math.floor(time * 2 + noise(x, y) * 4) % 4;
      if ((x + y) % 3 === 0) {
        const py = y * TILE + 4 + phase * 2;
        rect(c, x * TILE + 4, py, 7, 1, world.biome === 7 ? '#eef8f6' : p.waterLight);
        rect(c, x * TILE + 2, py + 1, 2, 1, world.biome === 7 ? '#e2f6f2' : shade(p.waterLight, -12));
      }
      if ((x * 13 + y * 7) % 67 === 0 && world.biome !== 7) {
        const fx = x * TILE + 7 + Math.round(Math.sin(time * 0.5 + y) * 3), fy = y * TILE + 9;
        rect(c, fx, fy, 4, 2, shade(p.water, -18)); rect(c, fx + 4, fy - 1, 2, 4, shade(p.water, -18));
      }
    }
  }
  object(c, o, time, state) {
    const x = Math.round(o.x), y = Math.round(o.y), p = this.palette;
    if (o.type === 'tree') {
      if (o.depleted) { ellipse(c, x, y, 6, 3, p.trunk); rect(c, x - 4, y - 4, 8, 4, shade(p.trunk, 25)); return; }
      const sprite = this.treeSprite(o);
      c.drawImage(sprite, x - 36 + Math.round(Math.sin(time * 0.6 + o.seed) * 0.6), y - 80);
    } else if (o.type === 'flower') {
      const sway = Math.round(Math.sin(time + o.seed) * 0.7), stem = o.stalk ? 8 : 4;
      rect(c, x, y - stem, 1, stem, shade(p.tree, 6)); rect(c, x + 1, y - 2, 2, 1, p.grassDark);
      if (o.stalk) { for (let i = 0; i < 3; i++) { rect(c, x - 1 + sway, y - stem + i * 2, 3, 1, '#f7d887'); } }
      else { const color = ['#fbdd9d', '#efb0ad', '#c5d4fa', '#f1f2cb', p.accent][o.variant]; rect(c, x - 1 + sway, y - 6, 3, 3, color); rect(c, x + sway, y - 5, 1, 1, '#ffe8aa'); }
    } else if (o.type === 'bush') {
      ellipse(c, x, y - 4, 9, 6, p.grassDark); ellipse(c, x - 2, y - 7, 6, 4, p.tree); rect(c, x - 4, y - 8, 3, 1, shade(p.tree, 30));
      if (o.variant % 2) { rect(c, x + 2, y - 5, 2, 2, p.accent); rect(c, x - 4, y - 4, 2, 2, p.accent); }
    } else if (o.type === 'rock') {
      if (o.depleted) return;
      polygon(c, [[x - 11, y], [x - 9, y - 8], [x - 3, y - 13], [x + 7, y - 11], [x + 11, y - 3], [x + 8, y + 2]], '#7e9791');
      polygon(c, [[x - 9, y - 7], [x - 3, y - 12], [x + 6, y - 10], [x + 5, y - 5]], '#d1d8be');
      line(c, x - 4, y - 6, x + 4, y - 3, '#aabaac');
    } else if (o.type === 'crystal') {
      if (o.depleted) return;
      for (let i = -1; i <= 1; i++) {
        const px = x + i * 7, high = i === 0 ? 23 : 14;
        polygon(c, [[px, y - high], [px + 5, y - high + 7], [px + 4, y], [px - 4, y + 1], [px - 5, y - high + 6]], '#71acb5');
        polygon(c, [[px, y - high], [px, y - 2], [px - 4, y], [px - 4, y - high + 6]], '#c4eeee');
        line(c, px, y - high + 2, px + 2, y - high + 7, '#ffffff');
      }
      if (Math.sin(time * 2 + o.seed) > 0.8) star(c, x + 3, y - 17, CREAM, 2);
    } else if (o.type === 'resource') {
      if (!o.depleted) this.resource(c, o, time);
    } else if (o.type === 'arena') {
      ring(c, x, y, o.radius, o.radius * 0.65, shade(p.path, -16));
      ring(c, x, y, o.radius - 7, (o.radius - 7) * 0.65, shade(p.path, 18));
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; star(c, x + Math.cos(a) * (o.radius - 4), y + Math.sin(a) * (o.radius - 4) * 0.65, shade(p.path, -10), 2); }
    } else if (o.type === 'support') {
      ellipse(c, x, y + 8, 36, 12, '#9bab9a'); ellipse(c, x, y + 5, 33, 10, '#eadfc0');
      for (const side of [-1, 1]) {
        rect(c, x + side * 22 - 3, y - 32, 6, 38, '#a6b4a2'); rect(c, x + side * 22 - 1, y - 30, 2, 34, '#f3e7c8');
        rect(c, x + side * 22 - 5, y - 34, 10, 3, '#f5dfb0'); rect(c, x + side * 22 - 5, y + 4, 10, 3, '#d8c7a0');
      }
      polygon(c, [[x - 35, y - 34], [x - 21, y - 48], [x, y - 58], [x + 21, y - 48], [x + 35, y - 34]], '#668b84');
      polygon(c, [[x - 32, y - 37], [x - 19, y - 47], [x, y - 55], [x + 18, y - 46], [x + 31, y - 37]], '#a9ceba');
      line(c, x - 32, y - 36, x + 32, y - 36, '#e5d3a5', 2); star(c, x, y - 58, '#f8e8b3', 3);
      rect(c, x - 13, y - 5, 26, 8, '#8eaa94'); rect(c, x - 15, y - 9, 30, 5, '#ead9ae');
      rect(c, x - 9, y - 21, 7, 12, '#608b8e'); rect(c, x - 8, y - 20, 5, 8, '#b4e5dc');
      rect(c, x + 3, y - 14, 8, 5, '#c19660'); line(c, x + 7, y - 15, x + 7, y - 10, '#edd2a3');
      if (state.supports?.includes(state.biome) || state.supports?.includes(o.id)) star(c, x, y - 22 + Math.sin(time * 2), '#f7e8bd', 3);
    } else if (o.type === 'camp') {
      polygon(c, [[x - 18, y + 2], [x, y - 24], [x + 19, y + 2]], '#466d79');
      polygon(c, [[x - 16, y], [x, y - 22], [x + 12, y]], '#adc7aa');
      polygon(c, [[x - 4, y], [x + 1, y - 15], [x + 7, y]], '#557975');
      line(c, x - 23, y + 3, x - 12, y - 9, '#e7d8b1');
      ellipse(c, x + 24, y + 2, 7, 3, '#849a92');
      polygon(c, [[x + 20, y], [x + 23, y - 10 - Math.floor(time * 5) % 3], [x + 26, y - 4], [x + 27, y]], '#e8bd75');
    } else if (o.type === 'waterfall') {
      for (let i = 0; i < 5; i++) {
        rect(c, x - 16 + i * 7, y - o.height, 5, o.height, i % 2 ? '#a9e6e0' : '#e4f4e9');
        rect(c, x - 16 + i * 7, y - ((time * 27 + i * 13) % o.height), 4, 8, '#ffffff');
      }
      ellipse(c, x, y + 2, 28, 6, '#dff6e8');
    } else if (o.type === 'ruin') this.architecture(c, o, time);
    else if (o.type === 'landmark') this.landmark(c, o, time);
  }
  landmark(c, o, time) {
    const x = Math.round(o.x), y = Math.round(o.y), p = this.palette;
    c.save(); c.translate(x, y);
    ellipse(c, 0, 5, 54, 15, '#42696035');
    if (o.variant <= 1) {
      const dark = shade(p.tree, -25), light = shade(p.tree, 29);
      for (const side of [-1, 1]) { line(c, side * 4, -15, side * 23, 7, p.trunk, 6); line(c, side * 22, 7, side * 35, 7, shade(p.trunk, -20), 3); }
      polygon(c, [[-14, 1], [-12, -52], [-20, -67], [-12, -76], [-3, -55], [4, -86], [13, -85], [8, -51], [17, -39], [14, 1]], shade(p.trunk, -23));
      polygon(c, [[-10, -1], [-8, -49], [-16, -68], [-12, -72], [-1, -49], [7, -81], [10, -79], [4, -43], [10, -28], [9, -1]], p.trunk);
      line(c, -2, -2, -1, -46, shade(p.trunk, 23), 3);
      for (const [dx, dy, rx, ry] of [[-34, -67, 25, 24], [34, -69, 28, 26], [-15, -95, 29, 26], [18, -98, 29, 27], [0, -69, 34, 26]]) {
        ellipse(c, dx, dy, rx + 1, ry + 2, dark); ellipse(c, dx, dy - 4, rx, ry - 2, p.tree); ellipse(c, dx - 7, dy - 12, rx - 8, ry - 13, light);
      }
      for (let i = 0; i < 30; i++) {
        const dx = noise(i, 47) * 92 - 46, dy = -55 - noise(i, 53) * 61;
        rect(c, dx, dy, 4, 2, i % 3 ? light : dark);
        if (o.variant === 0 && i % 4 === 0) { ellipse(c, dx, dy + 4, 3, 4, '#e8af75'); rect(c, dx, dy, 1, 2, dark); }
      }
      if (o.variant === 0) {
        line(c, 32, -52, 32, -5, '#dac28e'); line(c, 46, -54, 46, -5, '#dac28e'); rect(c, 28, -5, 23, 3, '#c19d6e');
      } else {
        for (let i = 0; i < 4; i++) { line(c, -42 + i * 26, -48, -40 + i * 26, -20 - i % 2 * 9, light); rect(c, -40 + i * 26, -29, 4, 2, light); }
        ellipse(c, 0, -31, 5, 8, '#63776a'); star(c, 0, -31, '#d6efc9', 2);
      }
    } else if (o.variant === 2) {
      ellipse(c, 0, 4, 35, 10, '#d8ca99');
      polygon(c, [[-23, 1], [-16, -54], [15, -54], [24, 1]], '#a8926c');
      polygon(c, [[-19, -1], [-13, -54], [12, -54], [18, -1]], '#eeddb4');
      rect(c, -6, -18, 12, 19, '#6f8e83'); rect(c, -5, -17, 10, 17, '#a7b69b');
      polygon(c, [[-20, -54], [0, -72], [20, -54]], '#7c9ea0');
      const a = Math.floor(time * 3) % 16 * Math.PI / 8;
      for (let i = 0; i < 4; i++) {
        const aa = a + i * Math.PI / 2, dx = Math.cos(aa), dy = Math.sin(aa);
        line(c, 0, -46, dx * 38, -46 + dy * 38, '#7d8b76', 2);
        polygon(c, [[dx * 13, -46 + dy * 13], [dx * 38, -46 + dy * 38], [dx * 38 - dy * 9, -46 + dy * 38 + dx * 9], [dx * 13 - dy * 7, -46 + dy * 13 + dx * 7]], '#eee3b8');
        for (let slat = 16; slat < 38; slat += 6) line(c, dx * slat, -46 + dy * slat, dx * slat - dy * 8, -46 + dy * slat + dx * 8, '#b4b395');
      }
      ellipse(c, 0, -46, 4, 4, GOLD);
    } else if (o.variant === 3) {
      ellipse(c, 0, 1, 56, 12, '#a5d7cf');
      for (let i = -4; i <= 4; i++) { const yy = -7 - (4 - Math.abs(i)) * 4; rect(c, i * 12 - 5, yy, 11, 10, '#dac6a3'); rect(c, i * 12 - 5, yy, 11, 3, '#f8e9c4'); }
      for (const side of [-1, 1]) {
        rect(c, side * 46 - 3, -36, 6, 33, '#e6d6b4');
        ellipse(c, side * 46, -38, 11, 9, '#ecd4c2');
        for (let i = -2; i <= 2; i++) line(c, side * 46, -31, side * 46 + i * 4, -42, '#fff0dc');
      }
      line(c, -44, -26, 44, -26, '#e5d4ad', 2);
    } else if (o.variant === 4) {
      for (let i = 0; i < 7; i++) {
        const yy = -i * 8, width = 48 - i * 4;
        rect(c, -width, yy - 5, width * 2, 7, '#a1b5ac'); rect(c, -width, yy - 7, width * 2, 3, '#eef0db');
      }
      for (const side of [-1, 1]) { rect(c, side * 49 - 3, -54, 6, 54, '#bccabb'); line(c, side * 50, -56, side * 25, -61, '#f7f1d7', 3); }
      rect(c, -14, -83, 28, 32, '#c8ded4');
      for (let i = 0; i < 5; i++) { rect(c, -12 + i * 5, -83, 3, 37, i % 2 ? '#e1f2e5' : '#a9dedb'); rect(c, -12 + i * 5, -80 + ((time * 20 + i * 11) % 30), 2, 4, '#ffffff'); }
      ellipse(c, 0, -49, 23, 5, '#eaf6e6');
    } else if (o.variant === 5) {
      for (const side of [-1, 1]) { line(c, side * 30, -92, side * 30, -35, '#c6bea1', 2); rect(c, side * 30 - 3, -92, 6, 8, '#eee8c8'); }
      ellipse(c, 0, -29, 46, 11, '#8fae9d'); ellipse(c, 0, -33, 44, 10, '#e7e5c6'); ellipse(c, 0, -35, 39, 8, '#9bc5a0');
      for (let i = -3; i <= 3; i++) { line(c, i * 10, -36, i * 10, -47 - i % 2 * 3, p.tree); ellipse(c, i * 10, -50 - i % 2 * 3, 4, 4, i % 2 ? '#f1d1b0' : '#f7ebc5'); }
      c.globalAlpha *= .35; ellipse(c, -14, -4, 36, 8, '#ffffff'); ellipse(c, 19, 1, 39, 9, '#ffffff'); c.globalAlpha /= .35;
    } else if (o.variant === 6) {
      this.architecture(c, { variant: 'cave', x: 0, y: 0 }, time);
      for (let i = -2; i <= 2; i++) {
        const high = 29 + (2 - Math.abs(i)) * 11, dx = i * 17;
        polygon(c, [[dx, -high], [dx + 8, -high + 14], [dx + 6, -12], [dx - 6, -12], [dx - 8, -high + 14]], i % 2 ? '#a9c7e2' : '#bdabd9');
        polygon(c, [[dx, -high], [dx, -14], [dx - 6, -12], [dx - 7, -high + 14]], '#e5e4f2');
        line(c, dx, -high + 5, dx + 3, -high + 12, '#ffffff');
      }
    } else if (o.variant === 7) {
      this.architecture(c, { variant: 'arch', x: 0, y: 0 }, time);
      for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
        polygon(c, [[side * 31, -43 + i * 8], [side * (58 - i * 5), -56 + i * 8], [side * (54 - i * 5), -45 + i * 8], [side * 31, -36 + i * 8]], i % 2 ? '#eee5c7' : '#c8e5dc');
      }
      star(c, 0, -93, '#fae6b2', 7);
    } else if (o.variant === 8) {
      this.architecture(c, { variant: 'arch', x: 0, y: 0 }, time);
      for (const side of [-1, 1]) this.architecture(c, { variant: 'column', x: side * 48, y: 4 }, time);
      for (let i = 0; i < 9; i++) { const dx = -32 + i * 8, yy = -79 - Math.sin(i / 8 * Math.PI) * 12; ellipse(c, dx, yy, 4, 4, i % 2 ? '#e3c693' : '#f8edc7'); rect(c, dx, yy, 1, 1, '#c4ab7d'); }
    } else {
      ellipse(c, 0, 4, 56, 18, '#c7d6be'); ellipse(c, 0, 1, 53, 16, '#e6edd4');
      ring(c, 0, -49, 46, 54, '#b4cdbb'); ring(c, 0, -49, 40, 48, '#e4e6c4');
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; star(c, Math.cos(a) * 43, -49 + Math.sin(a) * 51, '#f5e8b6', 3); }
      for (const side of [-1, 1]) { rect(c, side * 23 - 4, -18, 8, 21, '#cad7bd'); rect(c, side * 23 - 7, 1, 14, 4, '#f1eed0'); }
      star(c, 0, -48 + Math.sin(time) * 2, '#f8efd0', 6);
    }
    c.restore();
  }
  resource(c, o, time) {
    const x = Math.round(o.x), y = Math.round(o.y), p = this.palette;
    ellipse(c, x + 1, y + 1, 6, 2, '#4f8c7050');
    if (o.resource === 'wood') { line(c, x - 6, y, x + 5, y - 7, '#7d6851', 4); line(c, x - 6, y - 1, x + 4, y - 8, '#c0a071', 2); line(c, x, y - 4, x - 1, y - 9, '#937350', 2); }
    else if (o.resource === 'stone' || o.resource === 'ore') {
      polygon(c, [[x - 7, y], [x - 5, y - 6], [x + 1, y - 9], [x + 7, y - 3], [x + 5, y + 1]], o.resource === 'ore' ? '#8394a0' : '#b2c2b2');
      rect(c, x - 3, y - 6, 4, 2, o.resource === 'ore' ? GOLD : '#e9e9cf');
    } else if (o.resource === 'fruit') {
      for (let i = -1; i <= 1; i++) { ellipse(c, x + i * 4, y - 3 - (i === 0 ? 3 : 0), 3, 3, i === 0 ? '#eac47e' : '#edab79'); rect(c, x + i * 4, y - 7 - (i === 0 ? 3 : 0), 1, 2, p.tree); }
    } else if (o.resource === 'water') {
      ellipse(c, x, y - 2, 8, 3, '#d0e6d2'); ellipse(c, x, y - 3, 6, 2, '#7fcfd0');
      polygon(c, [[x, y - 16], [x - 3, y - 10], [x - 3, y - 8], [x, y - 6], [x + 3, y - 8], [x + 3, y - 10]], '#ceefed');
      rect(c, x - 1, y - 10, 1, 2, '#ffffff');
    } else if (o.resource === 'crystal' || o.resource === 'essence') {
      polygon(c, [[x, y - 14], [x + 5, y - 7], [x + 3, y], [x - 4, y], [x - 5, y - 7]], '#81b9c1');
      polygon(c, [[x, y - 14], [x, y - 1], [x - 4, y], [x - 4, y - 6]], '#d8f6e6');
    } else {
      line(c, x, y, x, y - 9, p.tree, 2);
      polygon(c, [[x, y - 3], [x - 7, y - 6], [x - 5, y - 10], [x, y - 7]], p.tree);
      polygon(c, [[x, y - 5], [x + 6, y - 11], [x + 7, y - 7]], p.grassLight);
      if (o.resource === 'herb') { rect(c, x - 2, y - 13, 4, 3, '#dcc2ec'); rect(c, x - 1, y - 12, 1, 1, CREAM); }
    }
    if (Math.sin(time * 1.8 + o.seed) > 0.95) rect(c, x + 5, y - 12, 2, 2, '#f5efc3');
  }
  architecture(c, o, time) {
    const x = Math.round(o.x), y = Math.round(o.y), p = this.palette;
    const marble = '#ebe5cd', shadow = '#92a99f';
    if (o.variant === 'cave') {
      ellipse(c, x, y - 5, 25, 23, '#8caba1'); ellipse(c, x, y - 4, 16, 18, '#466f73');
      rect(c, x - 11, y - 3, 22, 6, '#afbfad');
      polygon(c, [[x - 23, y - 5], [x - 21, y - 23], [x - 5, y - 30], [x + 6, y - 27], [x + 23, y - 14], [x + 25, y - 3], [x + 15, y - 2], [x + 12, y - 16], [x, y - 22], [x - 12, y - 14], [x - 13, y - 2]], '#cbd5bd');
      rect(c, x - 18, y - 17, 6, 3, p.tree); rect(c, x + 10, y - 23, 7, 2, p.grassLight);
      star(c, x, y - 10, '#adf0e4', 2);
    } else if (o.variant === 'arch' || o.variant === 'gate') {
      for (const side of [-1, 1]) {
        rect(c, x + side * 25 - 6, y - 57, 12, 58, shadow); rect(c, x + side * 25 - 4, y - 54, 8, 53, marble);
        rect(c, x + side * 25 - 8, y - 6, 16, 8, '#d6ccaf'); rect(c, x + side * 25 - 7, y - 56, 14, 5, '#f8efcf');
        rect(c, x + side * 25 - 1, y - 50, 2, 40, '#b8c2ac');
      }
      polygon(c, [[x - 32, y - 53], [x - 26, y - 67], [x - 12, y - 77], [x + 12, y - 77], [x + 26, y - 67], [x + 32, y - 53], [x + 22, y - 53], [x + 16, y - 63], [x + 8, y - 68], [x - 8, y - 68], [x - 16, y - 63], [x - 22, y - 53]], marble);
      line(c, x - 11, y - 77, x + 11, y - 77, GOLD, 2); star(c, x, y - 73, GOLD, 3);
      for (const side of [-1, 1]) { line(c, x + side * 29, y - 54, x + side * 29, y - 20, p.tree, 2); rect(c, x + side * 31 - 1, y - 39, 4, 3, p.tree); rect(c, x + side * 28, y - 25, 3, 2, p.accent); }
    } else if (o.variant === 'column' || o.variant === 'marker') {
      const height = o.variant === 'column' ? 57 : 24;
      rect(c, x - 8, y - height, 16, height, shadow); rect(c, x - 6, y - height + 2, 10, height - 3, marble);
      rect(c, x - 10, y - height, 20, 4, '#f6e9c6'); rect(c, x - 11, y - 3, 22, 6, '#d7d1b6');
      rect(c, x, y - height + 8, 2, height - 12, '#b2c1ac');
      if (o.variant === 'marker') star(c, x, y - height - 6 + Math.sin(time), '#f6dca9', 4);
    } else if (o.variant === 'fountain') {
      ellipse(c, x, y + 1, 26, 10, '#a5b7a3'); ellipse(c, x, y - 2, 23, 8, '#ece6cb'); ellipse(c, x, y - 4, 19, 6, p.waterLight);
      rect(c, x - 4, y - 26, 8, 22, '#d8dcc2'); ellipse(c, x, y - 26, 13, 4, marble);
      rect(c, x - 1, y - 38, 2, 11, '#c4f0e6');
      for (let i = 0; i < 6; i++) { const dx = Math.sin(i + time * 0.5) * 17; rect(c, x + dx, y - 6 - ((time * 14 + i * 6) % 20), 1, 3, '#dbf7ed'); }
    } else if (o.variant === 'pedestal') {
      ellipse(c, x, y + 1, 15, 5, shadow); rect(c, x - 8, y - 15, 16, 15, marble); ellipse(c, x, y - 15, 11, 4, '#f6e7be');
      rect(c, x - 2, y - 10, 4, 6, GOLD);
    } else if (o.variant === 'observatory') {
      ellipse(c, x, y + 1, 24, 7, '#c6d1bb');
      rect(c, x - 4, y - 30, 8, 30, '#a6b8ac'); rect(c, x - 2, y - 30, 3, 30, '#f5e7c6');
      ring(c, x, y - 34, 19, 13, '#d7b77b'); ring(c, x, y - 34, 9, 21, '#d7b77b');
      star(c, x, y - 34, '#ffffff', 4);
    }
  }
  ingredient(c, ingredient, time) {
    const { x, y } = ingredient, bob = Math.round(Math.sin(time * 2) * 2);
    ring(c, x, y, 15, 6, '#f3dfb0', true, time * 0.3);
    line(c, x, y - 4, x, y - 21 + bob, '#90b691', 2);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      ellipse(c, x + Math.cos(a) * 5, y - 23 + bob + Math.sin(a) * 5, 3, 3, '#fff2c1');
    }
    ellipse(c, x, y - 23 + bob, 2, 2, '#e8b573');
    star(c, x + 13, y - 30 + bob, '#fff4d0', 2);
  }
  player(c, player, time, state) {
    const x = Math.round(player.x), y = Math.round(player.y);
    const direction = player.facing || { x: 0, y: 1 }, moving = player.moving;
    const frame = moving ? Math.floor(time * 10) % 4 : 0;
    const step = moving ? [0, 2, 0, -2][frame] : 0;
    const bob = moving && frame % 2 ? -1 : 0;
    ellipse(c, x + 1, y + 1, 10, 4, '#35596560');
    if (player.dodgeTimer > 0) {
      for (let i = 3; i > 0; i--) {
        c.globalAlpha = 0.08 + (3 - i) * 0.06;
        ellipse(c, x - direction.x * i * 8, y - direction.y * i * 8 - 14, 7, 10, '#e2eac0');
      }
      c.globalAlpha = 1;
    }
    c.save(); c.translate(x, y + bob);
    if (player.invulnerable > 0 && Math.floor(time * 16) % 2) c.globalAlpha = 0.58;
    rect(c, -6, -7, 5, 7 + step / 2, INK); rect(c, 2, -7, 5, 7 - step / 2, INK);
    rect(c, -6, -2 + step / 2, 5, 3, '#735c49'); rect(c, 2, -2 - step / 2, 5, 3, '#735c49');
    polygon(c, [[-8, -19], [-5, -24], [5, -24], [9, -15], [7, -5], [-7, -5]], INK);
    polygon(c, [[-6, -19], [-3, -22], [4, -21], [7, -15], [5, -8], [-5, -8]], '#567d99');
    rect(c, -4, -16, 7, 8, '#79a4b0'); rect(c, 3, -15, 2, 7, '#a2c6c0');
    rect(c, -5, -8, 11, 2, '#ded3aa'); rect(c, 0, -8, 2, 2, GOLD);
    polygon(c, [[-6, -19], [-10, -17], [-9, -10], [-6, -9], [-4, -16]], '#e7c4a2');
    rect(c, 7, -17, 3, 7, '#e7c4a2'); rect(c, -9, -15, 3, 2, '#bfd0c0');
    // The copper scarf and swept hair remain recognizable at every angle.
    polygon(c, [[-6, -20], [-2, -18], [6, -19], [8, -22], [1, -24], [-7, -23]], '#cf9364');
    polygon(c, [[-5, -20], [-10, -15], [-12 - (frame % 2 ? 2 : 0), -10], [-8, -11], [-4, -17]], '#e9bb7e');
    rect(c, -6, -31, 13, 11, INK); rect(c, -5, -30, 11, 10, '#edc8a4');
    rect(c, -6, -32, 11, 4, '#69544a'); rect(c, -7, -30, 4, 5, '#69544a'); rect(c, 3, -31, 5, 6, '#69544a');
    rect(c, -4, -33, 8, 2, '#8c6b4e'); rect(c, 4, -34, 3, 4, '#8c6b4e');
    if (direction.y < -0.45) { rect(c, -5, -29, 11, 6, '#735b49'); rect(c, -3, -29, 4, 1, '#aa805b'); }
    else {
      const shift = direction.x > .4 ? 2 : direction.x < -.4 ? -2 : 0;
      rect(c, -3 + shift, -25, 1, 2, INK); rect(c, 2 + shift, -25, 1, 2, INK); rect(c, -1 + shift, -21, 3, 1, '#b38773');
    }
    if (player.weapon) this.weapon(c, player, time);
    c.restore();
    if (player.charge > 0) {
      ring(c, x, y, 15, 6, '#d4e6e3', true, time * 2);
      const charge = clamp(player.charge / 1.1, 0, 1);
      rect(c, x - 10, y + 7, 20, 3, INK); rect(c, x - 9, y + 8, 18 * charge, 1, GOLD);
    }
    if (player.electric && Math.sin(time * 4) > .88) {
      line(c, x - 10, y - 18, x - 6, y - 23, '#c7f6ef'); line(c, x - 6, y - 23, x - 9, y - 27, '#c7f6ef');
    }
    if (player.electric && this._electricFlashUntil > time) {
      const progress = 1 - (this._electricFlashUntil - time) / .65;
      ring(c, x, y - 12, 18 + progress * 41, 9 + progress * 20, '#ddfff1', true, time * 3);
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 + time * .7;
        const dx = Math.cos(a), dy = Math.sin(a);
        line(c, x + dx * 12, y - 12 + dy * 12, x + dx * 24 - dy * 5, y - 12 + dy * 24 + dx * 5, '#b9f5ed', 2);
        line(c, x + dx * 24 - dy * 5, y - 12 + dy * 24 + dx * 5, x + dx * 38, y - 12 + dy * 38, '#fff8d5', 2);
        star(c, x + dx * 38, y - 12 + dy * 38, '#e5fff1', 2);
      }
    }
    if (player.attackTimer > 0 && player.weapon) {
      const weapon = WEAPONS[player.weapon] || WEAPONS.sword;
      const strong = player.strongAttack, a = Math.atan2(direction.y, direction.x);
      if (!weapon.ranged) {
        const radius = weapon.range * (strong ? 1.2 : 1), spread = weapon.arc || 1.8;
        if (player.weapon === 'spear') {
          line(c, x + direction.x * 15, y - 9 + direction.y * 15, x + direction.x * radius, y - 9 + direction.y * radius, '#e4f8e2', strong ? 3 : 2);
          star(c, x + direction.x * radius, y - 9 + direction.y * radius, '#fff8d9', 3);
        } else {
          const progress = 1 - player.attackTimer / (strong ? .35 : .23);
          for (let i = 0; i < 16; i++) {
            const aa = a - spread / 2 + spread * (i / 16 + progress * .1);
            const rr = radius * (.86 + i % 3 * .03);
            rect(c, x + Math.cos(aa) * rr, y - 9 + Math.sin(aa) * rr, strong ? 3 : 2, strong ? 3 : 2, i < 10 ? '#e4f2d6' : '#fff4c7');
          }
          if (player.weapon === 'hammer') ring(c, x + direction.x * 28, y + direction.y * 28, 18 + progress * 8, 8 + progress * 4, GOLD, true);
        }
      }
    }
  }
  weapon(c, player, time) {
    const id = player.weapon, facing = player.facing || { x: 0, y: 1 };
    let angle = Math.atan2(facing.y, facing.x);
    if (player.attackTimer > 0 && !WEAPONS[id]?.ranged) angle += (1 - player.attackTimer / (player.strongAttack ? .35 : .23) - .5) * (id === 'spear' ? .1 : 1.8);
    const ux = Math.cos(angle), uy = Math.sin(angle), handX = 8, handY = -13;
    const length = id === 'spear' ? 28 : id === 'daggers' ? 10 : id === 'hammer' ? 17 : 19;
    const endX = handX + ux * length, endY = handY + uy * length;
    if (id === 'bow' || id === 'crossbow') {
      const vx = -uy, vy = ux;
      line(c, handX + vx * 9, handY + vy * 9, handX + ux * 6 + vx * 6, handY + uy * 6 + vy * 6, '#c1a07a', 2);
      line(c, handX + ux * 6 + vx * 6, handY + uy * 6 + vy * 6, handX + ux * 6 - vx * 6, handY + uy * 6 - vy * 6, '#c1a07a', 2);
      line(c, handX + ux * 6 - vx * 6, handY + uy * 6 - vy * 6, handX - vx * 9, handY - vy * 9, '#c1a07a', 2);
      line(c, handX + vx * 9, handY + vy * 9, handX - vx * 9, handY - vy * 9, '#edf0ca');
      if (id === 'crossbow') line(c, handX - ux * 5, handY - uy * 5, handX + ux * 12, handY + uy * 12, '#b8a9d5', 3);
    } else {
      line(c, handX, handY, endX, endY, '#7c725f', 3);
      line(c, handX + ux * 5, handY + uy * 5, endX, endY, WEAPONS[id]?.color || CREAM, 2);
      line(c, handX + ux * 4 - uy * 4, handY + uy * 4 + ux * 4, handX + ux * 4 + uy * 4, handY + uy * 4 - ux * 4, GOLD, 2);
      if (id === 'hammer') { rect(c, endX - 6, endY - 4, 13, 8, '#98aca7'); rect(c, endX - 5, endY - 4, 11, 3, '#e0e6ce'); }
      if (id === 'axe') polygon(c, [[endX - uy * 6, endY + ux * 6], [endX + ux * 7, endY + uy * 7], [endX + uy * 6, endY - ux * 6], [endX - ux * 3, endY - uy * 3]], '#d3d9c7');
      if (id === 'spear') polygon(c, [[endX + ux * 7, endY + uy * 7], [endX - uy * 3, endY + ux * 3], [endX + uy * 3, endY - ux * 3]], '#e5f3d5');
      if (id === 'daggers') { line(c, -8, -12, -8 + ux * 12, -12 + uy * 12, '#c6e6ba', 2); }
    }
  }
  npc(c, npc, time) {
    const x = Math.round(npc.x), y = Math.round(npc.y), bob = Math.round(Math.sin(time * 1.6) * .7);
    ellipse(c, x, y + 1, 12, 4, '#466a6650');
    c.save(); c.translate(x, y + bob);
    if (npc.id === 'gatekeeper') {
      // Broad ivory cape, halo crest and a floral staff belong only to the Gatekeeper.
      polygon(c, [[-6, -29], [6, -29], [12, -5], [7, 0], [-8, 0], [-12, -5]], '#778f87');
      polygon(c, [[-5, -28], [5, -28], [9, -4], [4, -1], [-8, -3]], '#e6e6cb');
      rect(c, -2, -24, 4, 21, '#c6af7c'); rect(c, -8, -21, 5, 3, '#fff1c4');
      ellipse(c, 0, -32, 7, 8, '#e8c4a3'); rect(c, -7, -36, 14, 4, '#f2ead2');
      polygon(c, [[-5, -26], [5, -26], [3, -20], [-2, -21]], '#f1e8d1');
      rect(c, -3, -31, 1, 2, INK); rect(c, 3, -31, 1, 2, INK);
      ring(c, 0, -43, 9, 3, GOLD);
      line(c, -15, 0, -15, -41, '#c5a26d', 2); star(c, -15, -43, '#f8e6b4', 4);
      rect(c, -17, -32, 4, 4, '#b2c99b'); rect(c, -18, -26, 5, 2, '#b2c99b');
    } else {
      // Asymmetric mint mantle, book satchel and a crescent crown identify the Guide.
      polygon(c, [[-6, -27], [6, -27], [9, -2], [-10, -2]], '#466e79');
      polygon(c, [[-6, -26], [4, -27], [8, -5], [1, -3], [-9, -7]], '#87b8a4');
      line(c, -3, -26, 6, -6, '#f3ddb0', 2); rect(c, -4, -3, 3, 3, '#596774'); rect(c, 3, -3, 3, 3, '#596774');
      ellipse(c, 0, -32, 6, 7, '#d7b696'); rect(c, -6, -37, 13, 5, '#596674');
      rect(c, -5, -36, 3, 9, '#d2d4bb'); rect(c, 4, -36, 3, 8, '#d2d4bb');
      rect(c, -2, -31, 1, 2, INK); rect(c, 3, -31, 1, 2, INK);
      rect(c, 7, -18, 9, 11, '#937858'); rect(c, 8, -18, 7, 2, '#e7ddbe'); rect(c, 10, -15, 3, 5, GOLD);
      ring(c, 0, -41, 7, 3, '#e9cf9a', true);
    }
    c.restore();
  }
  telegraph(c, enemy, isBoss, time) {
    if (!(enemy.telegraph > 0) && !(enemy.attackTimer > 0 && (enemy.pattern === 'slam' || enemy.type === 'heavy'))) return;
    const x = enemy.x, y = enemy.y, radius = enemy.attackRadius || (isBoss ? 85 : 30);
    const attacking = enemy.telegraph <= 0, color = attacking ? '#fff6c4' : '#eead69';
    const a = enemy.angle || 0, pattern = isBoss ? enemy.pattern : enemy.type === 'ranged' ? 'fan' : 'slam';
    if (pattern === 'charge' || pattern === 'beam') {
      const length = pattern === 'charge' ? 265 * (.8 + (enemy.id % 3) * .08) + (enemy.radius || 25) : 320;
      const spread = pattern === 'charge' ? (enemy.radius || 25) + 9 : 17 + (enemy.phase || 1) * 3;
      for (const side of [-1, 1]) line(c, x - Math.sin(a) * spread * side, y + Math.cos(a) * spread * side, x + Math.cos(a) * length - Math.sin(a) * spread * side, y + Math.sin(a) * length + Math.cos(a) * spread * side, color);
      for (let i = 30; i < length; i += 22) {
        const px = x + Math.cos(a) * i, py = y + Math.sin(a) * i;
        line(c, px - Math.cos(a) * 5 - Math.sin(a) * 4, py - Math.sin(a) * 5 + Math.cos(a) * 4, px, py, color);
        line(c, px - Math.cos(a) * 5 + Math.sin(a) * 4, py - Math.sin(a) * 5 - Math.cos(a) * 4, px, py, color);
      }
    } else if (pattern === 'fan') {
      for (const offset of [-.6, 0, .6]) for (let d = 20; d < (isBoss ? 135 : 100); d += 12) rect(c, x + Math.cos(a + offset) * d, y + Math.sin(a + offset) * d, 2, 2, color);
    } else {
      ring(c, x, y, radius, radius, color, false);
      ring(c, x, y, radius - 3, radius - 3, color, true, time * .5);
      for (let i = 0; i < 8; i++) { const aa = i * Math.PI / 4; rect(c, x + Math.cos(aa) * radius * .7, y + Math.sin(aa) * radius * .7, 2, 2, color); }
    }
  }
  enemy(c, enemy, time, state) {
    const x = Math.round(enemy.x), y = Math.round(enemy.y), hover = Math.round(Math.sin(time * 5 + x) * 2);
    const selected = state.targetId != null && (state.targetId === enemy.entityId || state.targetId === enemy.id);
    if (selected) ring(c, x, y, 18, 7, '#fff3b6', true, time * .5);
    ellipse(c, x, y + 1, enemy.type === 'heavy' ? 15 : 10, 4, '#4a6e694f');
    c.save(); c.translate(x, y);
    let color = enemy.color || this.palette.accent;
    if (enemy.hurtTimer > 0 && Math.floor(time * 20) % 2) color = '#fff1ca';
    const dark = shade(color, -38), light = shade(color, 25);
    if (enemy.type === 'ranged') {
      polygon(c, [[-2, -18], [-17, -27 - hover], [-13, -10], [-3, -7]], dark);
      polygon(c, [[2, -18], [17, -27 - hover], [13, -10], [3, -7]], dark);
      polygon(c, [[-3, -18], [-14, -24 - hover], [-11, -13], [-3, -10]], color);
      polygon(c, [[3, -18], [14, -24 - hover], [11, -13], [3, -10]], color);
      ellipse(c, 0, -15, 4, 8, '#627c87'); ellipse(c, 0, -23, 5, 4, light);
      rect(c, -3, -24, 1, 2, INK); rect(c, 2, -24, 1, 2, INK); star(c, 0, -15, CREAM, 2);
      line(c, -2, -27, -5, -30, color); line(c, 2, -27, 5, -30, color);
    } else if (enemy.type === 'heavy') {
      for (const dx of [-10, 7]) { rect(c, dx, -7, 5, 8, dark); rect(c, dx - 1, -1, 7, 3, light); }
      ellipse(c, 0, -14, 17, 13, dark); ellipse(c, 0, -17, 15, 10, color);
      polygon(c, [[0, -27], [9, -20], [6, -9], [-6, -9], [-9, -20]], light);
      line(c, 0, -27, 0, -10, shade(color, -12)); line(c, -13, -19, 13, -19, shade(color, -12));
      ellipse(c, 0, -5, 7, 5, '#e5d3a7'); rect(c, -4, -7, 2, 2, INK); rect(c, 3, -7, 2, 2, INK);
      polygon(c, [[-5, -28], [-3, -35], [0, -29], [3, -36], [6, -28]], '#bce2d8');
    } else {
      const elite = enemy.type === 'elite';
      polygon(c, [[-7, -4], [-9, -16], [-4, -24], [5, -24], [10, -16], [6, -4]], dark);
      ellipse(c, 0, -14, 8, 10, color); ellipse(c, 0, -17, 6, 6, light);
      rect(c, -6, -5, 4, 6, '#63756b'); rect(c, 3, -5, 4, 6, '#63756b');
      polygon(c, [[-5, -23], [-11, -30], [-10, -20]], color); polygon(c, [[5, -23], [11, -30], [10, -20]], color);
      rect(c, -4, -18, 2, 3, INK); rect(c, 3, -18, 2, 3, INK); ellipse(c, 0, -12, 3, 2, '#f7e8bc');
      line(c, -8, -9, -12, -7 + hover, dark, 2); line(c, 8, -9, 12, -7 - hover, dark, 2);
      if (elite) { star(c, 0, -28, GOLD, 4); line(c, -4, -26, -7, -34, GOLD, 2); line(c, 4, -26, 7, -34, GOLD, 2); }
    }
    c.restore();
    if (enemy.hp < enemy.maxHp || selected) {
      rect(c, x - 12, y - 40, 24, 3, '#385769'); rect(c, x - 11, y - 39, 22 * clamp(enemy.hp / enemy.maxHp, 0, 1), 1, '#ffd195');
    }
  }
  boss(c, boss, time, state) {
    const data = BOSSES[boss.id] || boss;
    const x = Math.round(boss.x), y = Math.round(boss.y);
    const pulse = Math.sin(time * 3 + boss.id), wing = Math.round(Math.sin(time * 4) * 5);
    const floating = ['moth', 'ray', 'whale', 'phoenix', 'jellyfish', 'lotus'].includes(data.shape);
    const bob = floating ? Math.round(pulse * 3) : boss.telegraph > 0 ? 2 : Math.round(Math.sin(time * 5) * 1);
    const selected = state.targetId != null && (state.targetId === boss.entityId || state.targetId === `boss-${boss.id}`);
    if (selected) ring(c, x, y, (boss.radius || 25) + 8, 12, '#fff2ad', true, time * .35);
    ellipse(c, x, y + 2, data.shape === 'colossus' ? 47 : data.shape === 'lotus' ? 39 : 29, 10, '#365c6750');
    let color = data.color || '#b9dbbe', accent = data.accent || '#ffe4ad';
    if (boss.hurtTimer > 0 && Math.floor(time * 22) % 2) color = '#fff8d9';
    const dark = shade(color, -43), light = shade(color, 25);
    c.save(); c.translate(x, y + bob);
    const leg = (lx, ly = -6) => { rect(c, lx - 3, ly - 9, 6, 14, dark); rect(c, lx - 4, ly + 1, 8, 4, accent); };
    const eyes = (ex = 0, ey = -37, gap = 6) => { rect(c, ex - gap, ey, 3, 3, INK); rect(c, ex + gap - 2, ey, 3, 3, INK); rect(c, ex - gap, ey, 1, 1, CREAM); rect(c, ex + gap - 2, ey, 1, 1, CREAM); };
    const diamond = (dx, dy, rx, ry, col) => polygon(c, [[dx, dy - ry], [dx + rx, dy], [dx, dy + ry], [dx - rx, dy]], col);
    switch (data.shape) {
      case 'stag': {
        for (const lx of [-18, -7, 8, 19]) leg(lx);
        ellipse(c, 0, -21, 25, 15, dark); ellipse(c, 0, -24, 23, 13, color); ellipse(c, 0, -34, 12, 19, light);
        ellipse(c, 0, -40, 11, 11, color); ellipse(c, 0, -32, 6, 4, accent); eyes(0, -43);
        for (const side of [-1, 1]) {
          line(c, side * 7, -48, side * 16, -69, accent, 3);
          line(c, side * 13, -60, side * 28, -67, accent, 2); line(c, side * 13, -59, side * 6, -67, accent, 2);
          line(c, side * 21, -64, side * 23, -74, accent, 2);
          ellipse(c, side * 16, -72, 3, 2, color); ellipse(c, side * 30, -67, 4, 2, light);
          polygon(c, [[side * 9, -43], [side * 22, -48], [side * 17, -36]], color);
        }
        for (let i = 0; i < 5; i++) rect(c, -15 + i * 7, -25 + i % 2 * 4, 3, 2, accent);
        break;
      }
      case 'tortoise': {
        for (const lx of [-23, 22]) { ellipse(c, lx, -4, 8, 6, color); ellipse(c, lx, -31, 7, 5, color); }
        ellipse(c, 0, -21, 33, 27, dark); ellipse(c, 0, -24, 29, 23, color);
        polygon(c, [[0, -46], [18, -35], [20, -16], [0, -5], [-20, -16], [-18, -35]], light);
        for (const [ax, ay] of [[0, -46], [20, -35], [25, -18], [0, -5], [-25, -18], [-20, -35]]) line(c, 0, -25, ax, ay, shade(color, -16), 2);
        ellipse(c, 0, 0, 12, 9, color); ellipse(c, 0, 2, 9, 5, accent); eyes(0, -3, 7);
        for (const [fx, fy] of [[-14, -33], [15, -27], [0, -40], [-18, -14], [10, -11]]) { rect(c, fx - 2, fy - 2, 5, 5, accent); rect(c, fx, fy, 1, 1, '#d8977b'); }
        break;
      }
      case 'moth': {
        for (const side of [-1, 1]) {
          polygon(c, [[side * 3, -29], [side * 34, -65 + wing], [side * 47, -47], [side * 40, -24], [side * 22, -19]], dark);
          polygon(c, [[side * 5, -28], [side * 34, -60 + wing], [side * 41, -44], [side * 36, -27]], color);
          ellipse(c, side * 23, -15, 20, 13, dark); ellipse(c, side * 23, -17, 17, 10, color);
          ellipse(c, side * 29, -40, 7, 8, accent); ellipse(c, side * 29, -40, 3, 4, '#8ba49b');
          line(c, side * 3, -41, side * 11, -53, accent, 2);
          ellipse(c, side * 25, -14, 6, 4, accent);
        }
        ellipse(c, 0, -24, 5, 20, '#7e7363'); ellipse(c, 0, -40, 7, 7, light); eyes(0, -42, 4);
        for (let i = 0; i < 4; i++) rect(c, -3, -28 + i * 6, 6, 2, accent);
        break;
      }
      case 'owl': {
        polygon(c, [[-7, -35], [-34, -34 - wing], [-30, -6], [-8, 1]], dark);
        polygon(c, [[7, -35], [34, -34 - wing], [30, -6], [8, 1]], dark);
        ellipse(c, 0, -23, 24, 26, dark); ellipse(c, 0, -27, 22, 23, color);
        polygon(c, [[-20, -39], [-25, -57], [-6, -46], [8, -46], [25, -57], [20, -39]], color);
        ellipse(c, -10, -34, 10, 12, accent); ellipse(c, 10, -34, 10, 12, accent);
        ellipse(c, -10, -35, 5, 6, '#7b969c'); ellipse(c, 10, -35, 5, 6, '#7b969c'); eyes(0, -37, 11);
        polygon(c, [[-4, -28], [4, -28], [0, -21]], GOLD);
        for (let i = 0; i < 3; i++) { line(c, -12 + i * 8, -18, -8 + i * 8, -11, light, 2); }
        rect(c, -12, -1, 7, 3, GOLD); rect(c, 5, -1, 7, 3, GOLD);
        break;
      }
      case 'ram': {
        leg(-16); leg(16); leg(-7, -10); leg(7, -10);
        for (let i = 0; i < 7; i++) ellipse(c, -23 + i * 8, -24 + Math.sin(i) * 4, 9, 14, i % 2 ? color : light);
        ellipse(c, 0, -34, 12, 14, dark); ellipse(c, 0, -38, 10, 12, color);
        for (const side of [-1, 1]) {
          ellipse(c, side * 17, -41, 10, 13, dark); ellipse(c, side * 17, -43, 8, 10, accent); ellipse(c, side * 17, -43, 4, 6, dark); ellipse(c, side * 17, -43, 2, 3, color);
        }
        ellipse(c, 0, -30, 6, 4, accent); eyes(0, -40);
        star(c, 0, -50, accent, 4);
        break;
      }
      case 'gryphon': {
        leg(-18); leg(18); ellipse(c, 0, -20, 22, 15, color);
        for (const side of [-1, 1]) {
          polygon(c, [[side * 10, -24], [side * 26, -57 - wing], [side * 48, -42], [side * 36, -38], [side * 44, -29], [side * 30, -26], [side * 35, -19]], dark);
          polygon(c, [[side * 12, -26], [side * 27, -52 - wing], [side * 42, -42], [side * 30, -35], [side * 36, -28], [side * 21, -21]], accent);
        }
        ellipse(c, 0, -39, 11, 15, light); polygon(c, [[-6, -34], [6, -34], [0, -24]], GOLD); eyes(0, -41);
        polygon(c, [[-6, -48], [0, -62], [7, -50]], accent);
        line(c, 20, -20, 32, -7, dark, 3); ellipse(c, 33, -6, 4, 4, accent);
        break;
      }
      case 'crab': {
        for (const side of [-1, 1]) {
          for (let i = 0; i < 3; i++) { line(c, side * 19, -16 + i * 6, side * (32 + i * 3), -12 + i * 7, dark, 3); line(c, side * (32 + i * 3), -12 + i * 7, side * (38 + i * 3), -4 + i * 4, color, 3); }
          line(c, side * 20, -24, side * 37, -37, dark, 5);
          ellipse(c, side * 40, -43, 13, 16, dark); ellipse(c, side * 40, -45, 10, 13, color);
          polygon(c, [[side * 34, -58], [side * 45, -54], [side * 37, -44]], accent);
          polygon(c, [[side * 46, -60], [side * 52, -49], [side * 42, -42]], light);
        }
        ellipse(c, 0, -20, 26, 16, dark); ellipse(c, 0, -24, 24, 14, color); ellipse(c, 0, -26, 17, 8, light);
        for (const side of [-1, 1]) { line(c, side * 9, -31, side * 10, -40, accent, 3); ellipse(c, side * 10, -40, 3, 3, INK); rect(c, side * 10, -41, 1, 1, CREAM); }
        star(c, 0, -23, accent, 4);
        break;
      }
      case 'ray': {
        line(c, 0, -4, 18, 15, dark, 3); line(c, 18, 15, 34, 17 + wing, color, 2);
        polygon(c, [[0, -50], [50, -23 + wing], [31, -3], [0, -8], [-31, -3], [-50, -23 + wing]], dark);
        polygon(c, [[0, -46], [45, -23 + wing], [29, -7], [0, -11], [-29, -7], [-45, -23 + wing]], color);
        polygon(c, [[0, -45], [15, -28], [0, -9], [-15, -28]], light);
        for (const side of [-1, 1]) { line(c, side * 9, -27, side * 35, -22 + wing, accent); ellipse(c, side * 8, -34, 2, 3, INK); }
        star(c, 0, -26, accent, 3);
        break;
      }
      case 'goat': {
        leg(-17); leg(17); leg(-7, -8); leg(7, -8);
        ellipse(c, 0, -25, 22, 15, color); ellipse(c, 0, -41, 10, 17, light);
        for (const side of [-1, 1]) { line(c, side * 6, -53, side * 15, -75, dark, 4); line(c, side * 15, -75, side * 12, -78, accent, 3); polygon(c, [[side * 7, -44], [side * 20, -47], [side * 15, -36]], accent); }
        polygon(c, [[-4, -29], [4, -29], [0, -17]], accent); eyes(0, -45, 5);
        for (const lx of [-17, 17]) { ring(c, lx, 3, 8, 3, '#cceff4'); }
        break;
      }
      case 'serpent': {
        for (let i = 9; i >= 0; i--) {
          const sx = Math.sin(i * .65 + time * .7) * (i * 2.4), sy = -8 - i * 4;
          ellipse(c, sx, sy, 15 - i * .8, 9 - i * .3, dark); ellipse(c, sx, sy - 2, 12 - i * .6, 7 - i * .2, color);
          rect(c, sx - 2, sy - 7, 4, 2, accent);
        }
        ellipse(c, 0, -8, 16, 13, light); ellipse(c, 0, -2, 11, 6, color); eyes(0, -12, 8);
        for (const side of [-1, 1]) polygon(c, [[side * 10, -17], [side * 21, -33], [side * 16, -13]], accent);
        break;
      }
      case 'fox': {
        for (const side of [-1, 0, 1]) {
          const dx = side * 25;
          polygon(c, [[side * 5, -13], [dx - 18, -31], [dx - 5, -64 + wing], [dx + 16, -45], [dx + 16, -26]], dark);
          polygon(c, [[side * 6, -17], [dx - 12, -33], [dx - 4, -60 + wing], [dx + 11, -44], [dx + 11, -29]], color);
          polygon(c, [[dx - 12, -33], [dx - 4, -60 + wing], [dx + 11, -44], [dx + 7, -41]], accent);
        }
        leg(-12); leg(12); ellipse(c, 0, -17, 17, 16, color); ellipse(c, 0, -23, 14, 12, light);
        polygon(c, [[-14, -24], [-13, -45], [-3, -31], [3, -31], [13, -45], [14, -24]], color);
        polygon(c, [[-10, -22], [10, -22], [0, -9]], accent); eyes(0, -25, 7); ellipse(c, 0, -14, 3, 2, INK);
        break;
      }
      case 'whale': {
        polygon(c, [[25, -22], [47, -38], [54, -20], [47, -18], [55, -6], [41, -5]], dark);
        polygon(c, [[25, -22], [46, -34], [50, -22], [43, -19], [51, -9], [40, -8]], color);
        ellipse(c, -8, -23, 38, 23, dark); ellipse(c, -10, -26, 35, 20, color); ellipse(c, -12, -14, 29, 9, accent);
        polygon(c, [[-7, -20], [4, -4 + wing], [14, -11], [4, -23]], light);
        ellipse(c, -30, -24, 3, 3, INK); rect(c, -31, -25, 1, 1, CREAM);
        line(c, -42, -15, -20, -11, shade(color, -25));
        for (let i = 0; i < 4; i++) { const yy = -48 - ((time * 12 + i * 7) % 22); rect(c, -14 + i * 6, yy, 2, 4, accent); }
        break;
      }
      case 'beetle': {
        for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { line(c, side * 15, -29 + i * 11, side * 28, -36 + i * 15, dark, 3); line(c, side * 28, -36 + i * 15, side * 33, -28 + i * 15, light, 2); }
        ellipse(c, 0, -24, 23, 28, dark); ellipse(c, 0, -27, 20, 24, color);
        diamond(-8, -25, 11, 21, light); diamond(8, -25, 11, 21, accent); line(c, 0, -50, 0, -5, dark, 2);
        ellipse(c, 0, -47, 10, 9, dark); ellipse(c, 0, -49, 8, 7, color); eyes(0, -51, 5);
        polygon(c, [[-3, -53], [-4, -70], [5, -75], [2, -66], [4, -54]], accent);
        star(c, -8, -28, CREAM, 3); break;
      }
      case 'golem': {
        for (const side of [-1, 1]) {
          diamond(side * 32, -17 + wing, 13, 18, dark); diamond(side * 32, -20 + wing, 10, 15, color); diamond(side * 26, -41, 10, 13, accent);
          diamond(side * 13, -1, 11, 10, color);
        }
        polygon(c, [[0, -62], [22, -43], [26, -20], [12, -4], [-12, -4], [-26, -20], [-22, -43]], dark);
        polygon(c, [[0, -58], [18, -42], [21, -22], [10, -9], [-10, -9], [-20, -22], [-18, -41]], color);
        diamond(0, -30, 12, 20, accent); diamond(0, -30, 7, 13, light);
        rect(c, -11, -45, 5, 3, CREAM); rect(c, 7, -45, 5, 3, CREAM); star(c, 0, -30, '#ffffff', 3);
        break;
      }
      case 'phoenix': {
        for (let i = -2; i <= 2; i++) {
          polygon(c, [[i * 5, -19], [i * 12 + Math.sin(time * 3) * 3, 24 - Math.abs(i) * 6], [i * 10 + 8, -2], [i * 4 + 4, -26]], i % 2 ? accent : color);
        }
        for (const side of [-1, 1]) {
          polygon(c, [[side * 5, -28], [side * 30, -65 - wing], [side * 55, -33], [side * 44, -32], [side * 46, -20], [side * 33, -22], [side * 31, -8], [side * 11, -16]], dark);
          polygon(c, [[side * 6, -29], [side * 30, -59 - wing], [side * 48, -35], [side * 34, -31], [side * 38, -22], [side * 23, -20], [side * 26, -13], [side * 12, -20]], color);
          line(c, side * 14, -30, side * 33, -49 - wing, accent, 3);
        }
        ellipse(c, 0, -30, 9, 19, light); ellipse(c, 0, -47, 8, 8, color); eyes(0, -49, 4);
        polygon(c, [[-3, -43], [3, -43], [0, -36]], GOLD); polygon(c, [[-5, -52], [0, -70], [7, -53]], accent);
        break;
      }
      case 'jellyfish': {
        for (let i = -3; i <= 3; i++) {
          const sx = i * 7, sway = Math.sin(time * 3 + i) * 5;
          line(c, sx, -18, sx + sway, -3, accent, 3); line(c, sx + sway, -3, sx - sway, 12 + Math.abs(i) * 2, color, 2);
          star(c, sx - sway, 12 + Math.abs(i) * 2, accent, 2);
        }
        ellipse(c, 0, -30, 31, 24, dark); ellipse(c, 0, -34, 28, 21, color); rect(c, -28, -24, 57, 8, color);
        ellipse(c, -5, -39, 16, 9, light); line(c, -26, -23, 26, -23, accent, 3);
        for (let i = -2; i <= 2; i++) ellipse(c, i * 11, -23, 5, 4, accent);
        eyes(0, -30, 7); star(c, 5, -47, CREAM, 3);
        break;
      }
      case 'lion': {
        leg(-19); leg(19); ellipse(c, 0, -18, 25, 14, dark); ellipse(c, 0, -22, 23, 13, color);
        line(c, 20, -15, 35, -6, color, 3); line(c, 35, -6, 42, -15, color, 3); ellipse(c, 42, -16, 5, 5, accent);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; diamond(Math.cos(a) * 18, -39 + Math.sin(a) * 18, 8, 9, i % 2 ? accent : dark); }
        ellipse(c, 0, -38, 15, 16, color); ellipse(c, 0, -29, 9, 6, light); eyes(0, -41, 8); ellipse(c, 0, -32, 4, 2, INK);
        rect(c, -2, -29, 4, 4, accent); star(c, 0, -54, accent, 3);
        break;
      }
      case 'peacock': {
        for (let i = -4; i <= 4; i++) {
          const a = -Math.PI / 2 + i * .23, dx = Math.cos(a) * 46, dy = Math.sin(a) * 49 - 12;
          ellipse(c, dx, dy, 11, 18, dark); ellipse(c, dx, dy - 2, 9, 15, color);
          ellipse(c, dx, dy - 6, 6, 7, accent); ellipse(c, dx, dy - 6, 3, 4, '#729eab'); rect(c, dx, dy - 7, 2, 2, '#d9f4e2');
          line(c, 0, -11, dx, dy + 5, shade(color, 17));
        }
        ellipse(c, 0, -12, 12, 12, dark); ellipse(c, 0, -14, 10, 10, color); rect(c, -4, -42, 8, 25, color);
        ellipse(c, 0, -43, 8, 9, light); eyes(0, -45, 4); polygon(c, [[-3, -38], [3, -38], [0, -32]], GOLD);
        for (let i = -1; i <= 1; i++) { line(c, 0, -51, i * 6, -60, accent); ellipse(c, i * 6, -60, 2, 2, accent); }
        rect(c, -7, -1, 4, 5, GOLD); rect(c, 3, -1, 4, 5, GOLD);
        break;
      }
      case 'colossus': {
        for (const side of [-1, 1]) {
          rect(c, side * 24 - 9, -20, 18, 23, dark); rect(c, side * 24 - 6, -20, 12, 19, color);
          ellipse(c, side * 24, 1, 14, 6, accent);
          polygon(c, [[side * 23, -47], [side * 43, -40], [side * 47, -12], [side * 34, -7], [side * 27, -24]], dark);
          rect(c, side * 39 - 5, -29, 10, 18, color);
        }
        polygon(c, [[-32, -40], [-24, -59], [24, -59], [33, -40], [28, -18], [-28, -18]], dark);
        polygon(c, [[-29, -39], [-22, -55], [22, -55], [29, -39], [24, -23], [-24, -23]], color);
        rect(c, -22, -39, 44, 4, accent); rect(c, -8, -50, 16, 27, dark); ellipse(c, 0, -49, 8, 7, dark);
        rect(c, -4, -46, 8, 15, '#e7f4d7'); star(c, 0, -42, accent, 4);
        rect(c, -28, -59, 56, 5, accent); ellipse(c, 0, -61, 24, 4, '#8dad91');
        for (let i = -2; i <= 2; i++) { rect(c, i * 9, -70, 1, 8, '#6d9c87'); ellipse(c, i * 9, -72, 4, 4, i % 2 ? '#dce8b6' : '#a5cbb0'); }
        break;
      }
      case 'lotus': {
        const melted = boss.acidApplied, melt = clamp((boss.meltTimer || 0) / 12, 0, 1);
        const size = melted ? 1 - melt * .35 : 1;
        const petalCount = melted ? Math.max(5, 10 - Math.floor(melt * 5)) : 12;
        for (let layer = 1; layer >= 0; layer--) for (let i = 0; i < petalCount; i++) {
          const count = petalCount, a = i * Math.PI * 2 / count + layer * .23 + Math.sin(time * .6) * .05;
          const rr = (layer ? 30 : 21) * size, dx = Math.cos(a) * rr, dy = -28 + Math.sin(a) * rr * .78;
          const ex = Math.cos(a) * (layer ? 50 : 37) * size, ey = -28 + Math.sin(a) * (layer ? 50 : 37) * .78;
          polygon(c, [[Math.cos(a - .6) * 9, -28 + Math.sin(a - .6) * 9], [dx - Math.sin(a) * 10, dy + Math.cos(a) * 10], [ex, ey], [dx + Math.sin(a) * 10, dy - Math.cos(a) * 10]], layer ? dark : color);
          line(c, dx, dy, ex * .95, ey + 1, layer ? color : light, 2);
        }
        ellipse(c, 0, -28, 17, 14, accent); ellipse(c, 0, -31, 13, 10, '#f7efd0');
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + time * .2; star(c, Math.cos(a) * 8, -31 + Math.sin(a) * 6, '#d2a766', 2); }
        star(c, 0, -31, '#ffffff', 4);
        if (melted) for (let i = 0; i < 8; i++) { const yy = -20 + (time * 13 + i * 7) % 26; rect(c, Math.sin(i * 2.3) * 32, yy, 2, 4, '#b4e6ce'); }
        break;
      }
      default: ellipse(c, 0, -20, 25, 26, color); eyes(0, -26, 9);
    }
    if (boss.telegraph > 0) star(c, 0, -82 + Math.sin(time * 8), '#fff2ba', 5);
    c.restore();
    if (selected || boss.hp < boss.maxHp) {
      const yy = y - (['stag', 'goat', 'beetle'].includes(data.shape) ? 86 : 77);
      rect(c, x - 22, yy, 44, 4, INK); rect(c, x - 21, yy + 1, 42 * clamp(boss.hp / boss.maxHp, 0, 1), 2, GOLD);
    }
  }
  projectile(c, projectile, time) {
    const x = projectile.x, y = projectile.y, player = projectile.owner === 'player';
    if (player) {
      const a = Math.atan2(projectile.vy || 0, projectile.vx || 1);
      line(c, x - Math.cos(a) * 8, y - Math.sin(a) * 8, x + Math.cos(a) * 2, y + Math.sin(a) * 2, '#fff1c5', 2);
      rect(c, x, y, 2, 2, '#ffffff');
    } else {
      const color = projectile.color || '#f7d992';
      ellipse(c, x, y, (projectile.radius || 4) + 2, (projectile.radius || 4) + 2, '#709aa870');
      diamond(c, x, y, projectile.radius || 4, color);
      rect(c, x - 1, y - 1, 2, 2, CREAM);
    }
  }
  rift(c, world, state, time) {
    const { x, y } = world.rift;
    const closed = state.riftClosed;
    ring(c, x, y, 53, 14, '#b4caba');
    if (!closed) {
      ring(c, x, y - 42, 26 + Math.sin(time) * 2, 51, '#c7f2ea');
      ring(c, x, y - 42, 20, 46, '#f8f1c5');
      polygon(c, [[x, y - 94], [x + 11, y - 52], [x + 6, y - 20], [x, y + 1], [x - 11, y - 44]], '#dcefeb');
      line(c, x, y - 82, x + 5, y - 50, '#ffffff', 3); line(c, x + 5, y - 50, x - 3, y - 23, '#ffffff', 3);
      for (let i = 0; i < 8; i++) { const a = time * .6 + i * Math.PI / 4; star(c, x + Math.cos(a) * 33, y - 45 + Math.sin(a) * 52, '#ffedb3', 2); }
    } else { star(c, x, y - 42, '#f9f4d2', 9); }
    for (let i = 0; i < world.riftNodes.length; i++) {
      const node = world.riftNodes[i], active = state.riftNodes?.includes(i);
      ellipse(c, node.x, node.y + 2, 13, 5, '#a6bdab'); rect(c, node.x - 7, node.y - 22, 14, 24, '#dae1c9');
      rect(c, node.x - 5, node.y - 20, 3, 20, '#f4eed4');
      polygon(c, [[node.x, node.y - 37], [node.x + 8, node.y - 26], [node.x, node.y - 17], [node.x - 8, node.y - 26]], active ? '#c6f4e7' : '#e5c589');
      if (active) { star(c, node.x, node.y - 26, '#ffffff', 4); for (let j = 0; j < 12; j++) { const f = j / 12; rect(c, node.x + (x - node.x) * f, node.y - 22 + (y - 45 - node.y) * f + Math.sin(j + time * 7) * 3, 2, 2, '#dcf5e7'); } }
    }
  }
  interactions(c, world, state, time) {
    if (state.cinematic) return;
    if (state.boss) return;
    const player = state.player;
    const points = [{ ...world.support, offset: 67 }, ...(world.npcs || []).map(n => ({ ...n, offset: 47 })), ...world.bosses.filter(b => !state.defeated?.includes(b.id)).map(b => ({ ...b, offset: 40 })), ...world.objects.filter(o => o.resource && !o.depleted && !o.hidden).map(o => ({ ...o, offset: o.type === 'tree' ? 85 : 21 }))];
    if (world.ingredient && !state.ingredients?.includes(world.ingredient.id)) points.push({ ...world.ingredient, offset: 39 });
    if (state.electricUnlocked) points.push(...(world.riftNodes || []).map(n => ({ ...n, offset: 46 })));
    const nearest = points.filter(o => Math.hypot(o.x - player.x, o.y - player.y) < 45).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
    if (!nearest) return;
    const x = Math.round(nearest.x), y = Math.round(nearest.y - nearest.offset - Math.sin(time * 2));
    rect(c, x - 5, y - 5, 11, 12, INK); rect(c, x - 4, y - 4, 9, 10, '#f4eacb');
    if (state.touchControls) { rect(c, x, y - 2, 1, 6, INK); rect(c, x - 2, y, 5, 2, INK); }
    else { rect(c, x - 2, y - 2, 1, 6, INK); rect(c, x - 1, y - 2, 4, 1, INK); rect(c, x - 1, y, 3, 1, INK); rect(c, x - 1, y + 3, 4, 1, INK); }
  }
  ambience(c, world, state, time, darkness) {
    // Small petals, fireflies and white clouds never obscure combat.
    for (let i = 0; i < 17; i++) {
      const x = ((i * 89 + time * (world.biome === 2 ? 9 : 3) - this.camera.x * .15) % 670 + 670) % 670 - 15;
      const y = ((i * 47 + Math.sin(time * .5 + i) * 11 - this.camera.y * .12) % 380 + 380) % 380 - 10;
      const visible = Math.sin(time * .7 + i) > -.5;
      if (!visible) continue;
      const col = darkness > .2 ? '#f1e7ad' : world.biome === 6 ? '#ecd7f6' : '#f7e9b4';
      c.globalAlpha = darkness > .2 ? .65 : .38;
      rect(c, x, y, 2, i % 3 ? 1 : 2, col);
    }
    c.globalAlpha = 1;
    if ([5, 7, 9].includes(world.biome)) {
      c.globalAlpha = .1;
      for (let i = 0; i < 4; i++) {
        const x = ((i * 230 + time * 4 - this.camera.x * .12) % 1000 + 1000) % 1000 - 180;
        const y = 40 + i * 79 - this.camera.y * .05;
        ellipse(c, x, y, 70, 13, '#ffffff'); ellipse(c, x + 50, y + 4, 43, 9, '#ffffff');
      }
      c.globalAlpha = 1;
    }
  }
  /** Lossless production sheets. The game uses the exact same drawing routines. */
  exportSheets() {
    const original = this.world;
    if (!original) this.prepare(buildWorld(0));
    const files = {};
    const save = (path, sheet) => { files[path] = sheet.toDataURL('image/png'); };
    const player = { x: 24, y: 48, moving: true, facing: { x: 0, y: 1 }, weapon: 'sword', attackTimer: 0, hp: 100, maxHp: 100 };
    const directions = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }];
    const movement = canvas(48 * 4, 56 * 4), mc = movement.getContext('2d');
    for (let row = 0; row < 4; row++) for (let frame = 0; frame < 4; frame++) {
      mc.save(); mc.translate(frame * 48, row * 56);
      this.player(mc, { ...player, facing: directions[row] }, frame / 10 + .025, {}); mc.restore();
    }
    save('assets/animations/jogador-movimento.png', movement);
    const combat = canvas(96 * 5, 96 * 7), cc = combat.getContext('2d');
    Object.keys(WEAPONS).forEach((id, row) => {
      for (let frame = 0; frame < 5; frame++) {
        cc.save(); cc.translate(frame * 96, row * 96);
        this.player(cc, { ...player, x: 40, y: 59, moving: false, weapon: id, facing: { x: 1, y: 0 }, attackTimer: .35 * (1 - frame / 5), strongAttack: true }, frame / 10, {});
        cc.restore();
      }
    });
    save('assets/animations/jogador-combate.png', combat);
    const npcs = canvas(80 * 2, 80), nc = npcs.getContext('2d');
    this.npc(nc, { id: 'gatekeeper', x: 40, y: 69 }, 0); this.npc(nc, { id: 'guide', x: 120, y: 69 }, 0);
    save('assets/sprites/porteiro-e-guia.png', npcs);
    const enemies = canvas(64 * 4, 64 * 4), ec = enemies.getContext('2d');
    ['melee', 'ranged', 'heavy', 'elite'].forEach((type, row) => {
      for (let frame = 0; frame < 4; frame++) {
        ec.save(); ec.translate(frame * 64, row * 64);
        this.enemy(ec, { type, x: 32, y: 51, hp: 50, maxHp: 50, color: this.palette.accent }, frame * .2, {}); ec.restore();
      }
    });
    save('assets/animations/invasores.png', enemies);
    const bosses = canvas(128 * 5, 112 * 4), bc = bosses.getContext('2d');
    const bossFrames = canvas(128 * 4, 112 * 20), bfc = bossFrames.getContext('2d');
    for (const data of BOSSES) {
      const boss = { ...data, x: 64, y: 88, hp: data.hp, maxHp: data.hp, radius: 30 };
      bc.save(); bc.translate(data.id % 5 * 128, Math.floor(data.id / 5) * 112); this.boss(bc, boss, 0, {}); bc.restore();
      for (let frame = 0; frame < 4; frame++) {
        bfc.save(); bfc.translate(frame * 128, data.id * 112); this.boss(bfc, boss, frame * .25, {}); bfc.restore();
      }
    }
    save('assets/sprites/vinte-chefes.png', bosses);
    save('assets/animations/chefe-movimento.png', bossFrames);
    const foliage = canvas(72 * 7, 86 * 10), fc = foliage.getContext('2d');
    const landmarks = canvas(160 * 5, 160 * 2), lc = landmarks.getContext('2d');
    const terrain = canvas(16 * 6 * 4, 16 * 10), tc = terrain.getContext('2d');
    const palettes = canvas(16 * 11, 16 * 10), pc = palettes.getContext('2d');
    for (let region = 0; region < 10; region++) {
      this.prepare(buildWorld(region));
      this.landmark(lc, { variant: region, x: region % 5 * 160 + 80, y: Math.floor(region / 5) * 160 + 146 }, 0);
      ['fruit', 'broad', 'ancient', 'round', 'palm', 'pine', 'silver'].forEach((variant, col) => {
        fc.drawImage(this.treeSprite({ variant, seed: col }), col * 72, region * 86);
      });
      ['grass', 'grassLight', 'grassDark', 'path', 'water', 'waterLight', 'tree', 'trunk', 'accent', 'sky'].forEach((key, col) => rect(pc, col * 16, region * 16, 16, 16, this.palette[key]));
      rect(pc, 10 * 16, region * 16, 16, 16, INK);
      for (let tile = 0; tile < 6; tile++) {
        const examples = [];
        for (let yy = 2; yy < this.world.height - 2 && examples.length < 4; yy++) {
          for (let xx = 2; xx < this.world.width - 2 && examples.length < 4; xx++) if (this.world.tiles[yy][xx] === tile) examples.push([xx, yy]);
        }
        examples.forEach(([xx, yy], frame) => tc.drawImage(this.terrain, xx * 16, yy * 16, 16, 16, (tile * 4 + frame) * 16, region * 16, 16, 16));
      }
    }
    save('assets/sprites/vegetacao.png', foliage);
    save('assets/sprites/marcos-das-regioes.png', landmarks);
    save('assets/tilesets/terrenos-dez-regioes.png', terrain);
    save('assets/tilesets/paletas.png', palettes);
    this.prepare(buildWorld(0));
    const props = canvas(80 * 6, 96 * 2), prc = props.getContext('2d');
    ['gate', 'arch', 'cave', 'column', 'pedestal', 'observatory', 'fountain'].forEach((variant, i) => {
      prc.save(); prc.translate(i % 6 * 80, Math.floor(i / 6) * 96);
      this.architecture(prc, { type: 'ruin', variant, x: 40, y: 88 }, 0); prc.restore();
    });
    this.object(prc, { type: 'support', x: 120, y: 184 }, 0, { supports: [0] });
    this.object(prc, { type: 'camp', x: 200, y: 184 }, 0, {});
    save('assets/sprites/estruturas.png', props);
    const items = canvas(32 * 9, 32), ic = items.getContext('2d');
    ['wood', 'stone', 'fiber', 'fruit', 'water', 'herb', 'ore', 'crystal', 'essence'].forEach((resource, i) => this.resource(ic, { x: i * 32 + 16, y: 26, resource, seed: i }, 0));
    save('assets/sprites/recursos.png', items);
    const effects = canvas(96 * 5, 112 * 2), efc = effects.getContext('2d');
    for (let i = 0; i < 5; i++) {
      efc.save(); efc.translate(i * 96, 0);
      this.ingredient(efc, { x: 48, y: 87 }, i * .3); efc.restore();
      efc.save(); efc.translate(i * 96, 112);
      this.rift(efc, { rift: { x: 48, y: 104 }, riftNodes: [] }, { riftNodes: [], riftClosed: false }, i * .3); efc.restore();
    }
    save('assets/effects/luz-e-fenda.png', effects);
    this.prepare(original || buildWorld(0));
    return files;
  }
}

function diamond(c, x, y, size, color) {
  polygon(c, [[x, y - size], [x + size, y], [x, y + size], [x - size, y]], color);
}

/** Discovery-aware overview, shared by the pause map and the compact HUD map. */
export function drawMap(ctx, world, state, width = 360, height = 270) {
  const p = { ...FALLBACK, ...BIOMES[world.biome]?.palette };
  const scale = Math.min(width / world.width, height / world.height);
  const offX = Math.round((width - world.width * scale) / 2), offY = Math.round((height - world.height * scale) / 2);
  rect(ctx, 0, 0, width, height, '#203d47');
  const known = new Set(state.discoveries?.[world.biome] || []);
  const pois = new Set(state.pointsOfInterest?.[world.biome] || []);
  for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) {
    if (!known.has(`${x},${y}`)) continue;
    const t = world.tiles[y][x], col = t === 2 ? p.water : t === 3 ? shade(p.path, -30) : t === 0 ? p.grass : p.path;
    rect(ctx, offX + x * scale, offY + y * scale, Math.ceil(scale), Math.ceil(scale), col);
  }
  const position = point => [offX + point.x / TILE * scale, offY + point.y / TILE * scale];
  const discovered = point => known.has(`${Math.floor(point.x / TILE)},${Math.floor(point.y / TILE)}`) || pois.has(point.id);
  if (discovered(world.support)) { const [x, y] = position(world.support); rect(ctx, x - 3, y - 3, 7, 7, '#f7eccb'); rect(ctx, x - 1, y - 1, 3, 3, '#7ba59f'); }
  for (const boss of world.bosses) if (discovered(boss)) {
    const [x, y] = position(boss); diamond(ctx, x, y, 4, state.defeated?.includes(boss.id) ? '#72a99b' : '#f4c273');
  }
  if (world.ingredient && discovered(world.ingredient)) { const [x, y] = position(world.ingredient); star(ctx, x, y, state.ingredients?.includes(world.ingredient.id) ? '#7fa691' : '#fff5c7', 3); }
  if (world.landmark && discovered(world.landmark)) { const [x, y] = position(world.landmark); ring(ctx, x, y, 4, 4, '#f5eed0'); }
  if (discovered(world.exit)) { const [x, y] = position(world.exit); rect(ctx, x - 2, y - 4, 4, 8, '#f1e9c6'); }
  const [px, py] = position(state.player); rect(ctx, px - 3, py - 3, 7, 7, INK); rect(ctx, px - 2, py - 2, 5, 5, '#ffffff'); rect(ctx, px - 1, py - 1, 3, 3, '#729fc0');
}
