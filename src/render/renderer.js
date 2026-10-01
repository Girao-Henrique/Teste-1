import { BIOMES, BOSSES, WEAPONS } from '../data/content.js';
import { TILE, buildWorld } from '../world/world.js';
import {drawTerrainTile,createTreeSprite,drawObject,drawLandmark,drawResource,drawArchitecture,drawIngredient,drawWater} from './environment-art.js';
import {drawRegionMap} from './map-art.js';
import {drawPortrait} from './portrait-art.js';
import {drawPlayer,drawNPC,drawEnemy,drawBoss} from './character-art.js';
import {drawTelegraph,drawProjectile,drawRift,drawAmbience} from './effects-art.js';

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
    this.viewport = { width: 640, height: 360 };
    this.terrain = null;
    this.world = null;
    this.sprites = new Map();
  }
  resize(width, height) {
    // A resolução lógica acompanha a tela; os pixels nunca são esticados em um só eixo.
    if (!(width > 0 && height > 0)) return;
    this.viewport = { width, height };
    const ratio = width / height;
    const short = Math.min(360, 2048 / (ratio >= 1 ? ratio : 1 / ratio));
    const logicalWidth = Math.round(ratio >= 1 ? short * ratio : short);
    const logicalHeight = Math.round(ratio >= 1 ? short : short / ratio);
    if (this.canvas.width !== logicalWidth || this.canvas.height !== logicalHeight) {
      this.canvas.width = logicalWidth; this.canvas.height = logicalHeight;
      this.ctx.imageSmoothingEnabled = false;
    }
  }
  screenToWorld(x, y) { return { x: x + this.camera.x, y: y + this.camera.y }; }
  prepare(world) {
    this.world = world;
    this.palette = { ...FALLBACK, ...BIOMES[world.biome]?.palette };
    this.sprites.clear(); this._environmentTiles?.clear();
    this.terrain = canvas(world.width * TILE, world.height * TILE);
    const c = this.terrain.getContext('2d'); c.imageSmoothingEnabled = false;
    for (let y = 0; y < world.height; y++) for (let x = 0; x < world.width; x++) drawTerrainTile(this,c,world,x,y);
  }
  treeSprite(object) { return createTreeSprite(this,object); }
  draw(state, world, time = 0) {
    if (!state || !world) return;
    this.reducedMotion = !!state.reducedMotion;
    if (this.world !== world) this.prepare(world);
    const compactFight = !!state.boss && this.viewport.height <= 420 && this.viewport.width > this.viewport.height;
    const ratio = this.viewport.width / this.viewport.height, short = Math.min(compactFight ? 480 : 360, 2048 / (ratio >= 1 ? ratio : 1 / ratio));
    const targetWidth = Math.round(ratio >= 1 ? short * ratio : short), targetHeight = Math.round(ratio >= 1 ? short : short / ratio);
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth; this.canvas.height = targetHeight; this.ctx.imageSmoothingEnabled = false;
    }
    const c = this.ctx, player = state.player || { x: 192, y: 610 };
    const p = this.palette;
    const electric = !!state.electricUnlocked, riftCount = state.riftNodes?.length || 0;
    if (electric && (!this._electrified || riftCount > (this._riftCount || 0))) this._electricFlashUntil = time + .65;
    this._electrified = electric; this._riftCount = riftCount;
    const width = this.canvas.width, height = this.canvas.height;
    const portrait = height > width;
    let focusX = player.x, cameraY = player.y - height * (portrait ? .44 : .52);
    // Enquadra os dois combatentes na área livre do HUD, inclusive em telas baixas.
    const boss = state.boss;
    const framingCombat = boss && Math.hypot(boss.x - player.x, boss.y - player.y) < 320;
    if (boss && Math.hypot(boss.x - player.x, boss.y - player.y) < 320) {
      focusX = player.x * .65 + boss.x * .35;
      const safeTop = clamp((state.cameraInsets?.top || .2) * height, 0, height * .38) + 8;
      const safeBottom = height - clamp((state.cameraInsets?.centerBottom ?? state.cameraInsets?.bottom ?? .16) * height, 0, height * .35) - 8;
      const highest = Math.min(player.y - 36, boss.y - 82), lowest = Math.max(player.y + 8, boss.y + 8);
      cameraY = (highest + lowest) / 2 - (safeTop + safeBottom) / 2;
    }
    const marginX = framingCombat ? width / 2 : 0, marginY = framingCombat ? height / 3 : 0;
    this.camera.x = Math.round(clamp(focusX - width / 2, -marginX, Math.max(0, world.width * TILE - width) + marginX));
    this.camera.y = Math.round(clamp(cameraY, -marginY, Math.max(0, world.height * TILE - height) + marginY));
    c.imageSmoothingEnabled = false;
    rect(c, 0, 0, width, height, p.sky);
    c.drawImage(this.terrain, this.camera.x, this.camera.y, width, height, 0, 0, width, height);
    c.save(); c.translate(-this.camera.x, -this.camera.y);
    const visible = o => o.x > this.camera.x - 110 && o.y > this.camera.y - 70 && o.x < this.camera.x + width + 110 && o.y < this.camera.y + height + 160;
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
        c.font = '10px Paradise'; c.textAlign = 'center'; c.fillStyle = INK; c.fillText(particle.text, Math.round(particle.x + 1), Math.round(particle.y + 1));
        c.fillStyle = particle.color || CREAM; c.fillText(particle.text, Math.round(particle.x), Math.round(particle.y));
      } else rect(c, particle.x, particle.y, particle.size || 2, particle.size || 2, particle.color || '#ffe2a5');
    }
    c.globalAlpha = 1;
    this.interactions(c, world, state, time);
    c.restore();
    const day = ((state.worldTime || 0) % 780) / 780;
    const darkness = day >= 11 / 24 && day < 22 / 24 ? Math.max(0, Math.cos((day - 16.5 / 24) * Math.PI / (11 / 24))) : 0;
    if (darkness > 0.02) { c.globalAlpha = darkness * 0.26; rect(c, 0, 0, width, height, '#264368'); c.globalAlpha = 1; }
    this.ambience(c, world, state, time, darkness);
  }
  water(world,time) { return drawWater(this,world,time); }
  object(c,o,time,state) { return drawObject(this,c,o,time,state); }
  landmark(c,o,time,state) { return drawLandmark(this,c,o,time,state); }
  resource(c,o,time) { return drawResource(this,c,o,time); }
  architecture(c,o,time) { return drawArchitecture(this,c,o,time); }
  ingredient(c,o,time) { return drawIngredient(this,c,o,time); }
  player(c,p,time,state) { return drawPlayer(this,c,p,time,state); }
  npc(c,n,time) { return drawNPC(this,c,n,time); }
  telegraph(c,e,isBoss,time) { return drawTelegraph(this,c,e,isBoss,time); }
  enemy(c,e,time,state) { return drawEnemy(this,c,e,time,state); }
  boss(c,b,time,state) { return drawBoss(this,c,b,time,state); }
  projectile(c,p,time) { return drawProjectile(this,c,p,time); }
  rift(c,w,state,time) { return drawRift(this,c,w,state,time); }
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
  ambience(c,w,state,time,darkness) { return drawAmbience(this,c,w,state,time,darkness); }
  exportSheets() {
    const original = this.world;
    if (!original) this.prepare(buildWorld(0));
    const files = {};
    const save = (path, sheet) => { files[path] = sheet.toDataURL('image/png'); };
    const player = { x: 32, y: 52, moving: true, facing: { x: 0, y: 1 }, weapon: 'sword', attackTimer: 0, hp: 100, maxHp: 100 };
    const directions = [{ x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }];
    const movement = canvas(64 * 4, 64 * 4), mc = movement.getContext('2d');
    for (let row = 0; row < 4; row++) for (let frame = 0; frame < 4; frame++) {
      mc.save(); mc.translate(frame * 64, row * 64);
      this.player(mc, { ...player, facing: directions[row] }, frame / 10 + .025, {}); mc.restore();
    }
    save('assets/animations/jogador-movimento.png', movement);
    const combat = canvas(144 * 5, 112 * 7), cc = combat.getContext('2d');
    Object.keys(WEAPONS).forEach((id, row) => {
      for (let frame = 0; frame < 5; frame++) {
        cc.save(); cc.translate(frame * 144, row * 112);
        this.player(cc, { ...player, x: 64, y: 80, moving: false, weapon: id, facing: { x: 1, y: 0 }, attackTimer: .35 * (1 - frame / 5), strongAttack: true }, frame / 10, {});
        cc.restore();
      }
    });
    save('assets/animations/jogador-combate.png', combat);
    const npcs = canvas(80 * 2, 80), nc = npcs.getContext('2d');
    this.npc(nc, { id: 'gatekeeper', x: 40, y: 69 }, 0); this.npc(nc, { id: 'guide', x: 120, y: 69 }, 0);
    save('assets/sprites/porteiro-e-guia.png', npcs);
    const npcMotion = canvas(80 * 4, 80 * 2), nmc = npcMotion.getContext('2d');
    ['gatekeeper', 'guide'].forEach((id, row) => {
      for (let frame = 0; frame < 4; frame++) {
        nmc.save(); nmc.translate(frame * 80, row * 80);
        this.npc(nmc, { id, x: 40, y: 69 }, frame * .45); nmc.restore();
      }
    });
    save('assets/animations/porteiro-e-guia.png', npcMotion);
    const portraits = canvas(96 * 4, 96 * 3), poc = portraits.getContext('2d'), face = canvas(96, 96);
    ['Viajante', 'Porteiro', 'Guia'].forEach((speaker, row) => {
      for (let frame = 0; frame < 4; frame++) {
        drawPortrait(face, speaker, frame * .8); poc.drawImage(face, frame * 96, row * 96);
      }
    });
    save('assets/animations/retratos.png', portraits);
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
    const ingredients = canvas(48 * 9, 48), igc = ingredients.getContext('2d');
    for (let region = 0; region < 9; region++) {
      this.prepare(buildWorld(region));
      this.ingredient(igc, { id: BIOMES[region].ingredient, x: region * 48 + 24, y: 43 }, 0);
    }
    save('assets/sprites/ingredientes-regionais.png', ingredients);
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
    const effects = canvas(160 * 5, 160 * 2), efc = effects.getContext('2d');
    for (let i = 0; i < 5; i++) {
      efc.save(); efc.translate(i * 160, 0);
      this.ingredient(efc, { x: 80, y: 140 }, i * .3); efc.restore();
      efc.save(); efc.translate(i * 160, 160);
      this.rift(efc, { rift: { x: 80, y: 140 }, riftNodes: [] }, { riftNodes: [], riftClosed: false }, i * .3); efc.restore();
    }
    save('assets/effects/luz-e-fenda.png', effects);
    this.prepare(original || buildWorld(0));
    return files;
  }
}

function diamond(c, x, y, size, color) {
  polygon(c, [[x, y - size], [x + size, y], [x, y + size], [x - size, y]], color);
}

export {drawRegionMap as drawMap};
