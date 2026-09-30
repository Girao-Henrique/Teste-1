import { BIOMES, BOSSES, ITEMS, WEAPONS, RECIPES, MEMORIES } from '../data/content.js';
import { buildWorld, isWalkable, TILE } from '../world/world.js';

export const DAY_LENGTH = 780;
const VERSION = 1;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clone = value => JSON.parse(JSON.stringify(value));
const vector = (x, y) => { const n = Math.hypot(x, y); return n > 0.001 ? { x: x / n, y: y / n } : { x: 0, y: 1 }; };
const angleDifference = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const BASE_WEAPON = { name: 'Punhos', damage: 9, range: 33, stamina: 5, cooldown: .38, durability: 0, arc: 1.5, color: '#f5eac2' };
const COMMON = ['wood', 'stone', 'fiber', 'fruit', 'water', 'herb', 'ore', 'crystal', 'essence', 'food', 'heal'];
const UPGRADE_NAMES = { health: 'saúde', stamina: 'fôlego', regen: 'recuperação', speed: 'velocidade' };
const MEMORY_LIMIT = 300;
const ESSENTIAL_MEMORIES = new Set(['boss', 'acid', 'electric', 'rift']);
// Um replay guarda a composição visual daquele instante, sem copiar a campanha inteira.
const replaySnapshot = (state, biome = state.biome) => ({
  version: VERSION, phase: 'playing', biome, worldTime: state.worldTime, elapsed: state.elapsed || 0,
  riftClosed: state.riftClosed ?? (state.riftNodes?.length === 3),
  electricUnlocked: state.electricUnlocked ?? !!state.player?.electric,
  player: clone(state.player), boss: state.boss ? clone(state.boss) : null,
  enemies: clone(state.enemies || []), projectiles: clone(state.projectiles || []), particles: [],
  defeated: [...(state.defeated || [])], ingredients: [...(state.ingredients || [])], riftNodes: [...(state.riftNodes || [])],
  camps: { [biome]: clone(state.camps?.[biome] || []) }, targetId: state.targetId || null,
});

/** Simulação sem DOM. Menus/diálogos são pausados pela camada de apresentação. */
export class GameEngine {
  constructor() { this.state = null; this.world = null; this.events = []; this.strongHeld = false; this.spawnClock = 0; this.memoryClock = 0; this.toastClock = 0; this.discoverySets = {}; }

  start(difficulty = 'normal') {
    if (!['easy', 'normal', 'hard', 'tranquilo', 'normal', 'desafiador'].includes(difficulty)) difficulty = 'normal';
    this.events = [];
    this.discoverySets = {};
    this.state = {
      version: VERSION, phase: 'playing', difficulty, biome: 0,
      player: { x: 160, y: 576, hp: 100, maxHp: 100, hunger: 100, thirst: 100, sleep: 100, stamina: 100, maxStamina: 100,
        facing: { x: 0, y: 1 }, weapon: null, equipment: {}, moving: false, attackTimer: 0, attackCooldown: 0,
        dodgeTimer: 0, dodgeCooldown: 0, invulnerable: 0, charge: 0, electric: false },
      inventory: { wood: 3, stone: 3, fiber: 3, fruit: 3, water: 3, herb: 2 }, ingredients: [], defeated: [], supports: [0],
      checkpoint: { biome: 0, x: 160, y: 576 }, storage: {}, worldTime: DAY_LENGTH * .12, elapsed: 0,
      discoveries: {}, camps: {}, upgrades: { health: 0, stamina: 0, regen: 0, speed: 0 },
      riftNodes: [], riftClosed: false, electricUnlocked: false, memoryEvents: [],
      enemies: [], boss: null, projectiles: [], particles: [], visited: [0], collected: {}, secrets: [], bossHealth: {},
      tutorial: { opening: false, guide: false }, targetId: null, seed: 935019, deathCount: 0, acidUsed: false, acidProgress: 0,
    };
    this.enterWorld(0, false);
    this.state.checkpoint = { biome: 0, x: this.world.support.x, y: this.world.support.y };
    this.emit('dialogue', { id: 'opening' });
    return true;
  }

  emit(type, fields = {}) { this.events.push({ type, ...fields }); }
  toast(text) { this.emit('toast', { text }); }
  fail(text) { this.toast(text); return false; }
  drainEvents() { const events = this.events; this.events = []; return events; }
  random() { this.state.seed = (Math.imul(this.state.seed, 1664525) + 1013904223) >>> 0; return this.state.seed / 4294967296; }
  get difficultyScale() { return ['easy', 'tranquilo'].includes(this.state.difficulty) ? .7 : ['hard', 'desafiador'].includes(this.state.difficulty) ? 1.22 : 1; }
  get sleepPressure() { return clamp((20 - this.state.player.sleep) / 20, 0, 1); }
  get isNight() { const t = (this.state.worldTime % DAY_LENGTH) / DAY_LENGTH; return t >= 11 / 24 && t < 22 / 24; }
  get atSupport() { return this.world && distance(this.state.player, this.world.support) < 64; }

  enterWorld(biome, returning = true) {
    const s = this.state;
    if (s.boss && s.boss.hp > 0) s.bossHealth[s.boss.id] = s.boss.hp;
    s.biome = biome;
    this.world = buildWorld(biome);
    s.player.x = this.world.spawn.x; s.player.y = this.world.spawn.y;
    s.player.charge = 0; s.player.dodgeTimer = 0; s.player.moving = false;
    s.enemies = []; s.boss = null; s.projectiles = []; s.particles = []; s.targetId = null;
    this.strongHeld = false; this.spawnClock = 8; this.memoryClock = 0;
    s.discoveries[biome] ||= []; s.camps[biome] ||= []; s.collected[biome] ||= {};
    if (!s.visited.includes(biome)) s.visited.push(biome);
    for (const object of this.world.objects) {
      const collectedAt = s.collected[biome][object.id];
      if (collectedAt !== undefined) {
        // Recursos comuns se renovam ao voltar; os ingredientes de missão nunca se duplicam.
        if (returning && s.elapsed - collectedAt >= 180 && object.type !== 'ingredient') delete s.collected[biome][object.id];
        else object.depleted = true;
      }
    }
    for (const camp of s.camps[biome]) this.world.objects.push({ ...camp, type: 'camp' });
    if (this.world.ingredient && s.ingredients.includes(this.world.ingredient.id)) this.world.ingredient.collected = true;
    for (const secret of this.world.secrets || []) if (s.secrets.includes(secret.id)) secret.collected = true;
    this.discover();
  }

  serialize() {
    if (!this.state) return null;
    const snapshot = clone(this.state);
    // Entidades temporárias não precisam ser salvas; chefes ativos mantêm a vida registrada.
    if (snapshot.boss) snapshot.bossHealth[snapshot.boss.id] = snapshot.boss.hp;
    snapshot.enemies = []; snapshot.projectiles = []; snapshot.particles = [];
    snapshot.player.charge = 0; snapshot.player.dodgeTimer = 0; snapshot.player.invulnerable = 0;
    snapshot.memoryEvents = snapshot.memoryEvents.map(event => event.snapshot ? { ...event, snapshot: replaySnapshot(event.snapshot, event.biome) } : event);
    return snapshot;
  }

  load(snapshot) {
    const previousState = this.state, previousWorld = this.world;
    try {
      if (!snapshot || snapshot.version !== VERSION || !Number.isInteger(snapshot.biome) || snapshot.biome < 0 || snapshot.biome > 9) return false;
      if (!snapshot.player || !Number.isFinite(snapshot.player.x) || !Number.isFinite(snapshot.player.y)) return false;
      if (!Number.isFinite(snapshot.player.hp) || !Number.isFinite(snapshot.player.maxHp) || snapshot.player.maxHp <= 0) return false;
      if (!snapshot.inventory || !Array.isArray(snapshot.defeated) || !Array.isArray(snapshot.ingredients)) return false;
      if (snapshot.defeated.some(id => !Number.isInteger(id) || id < 0 || id > 19)) return false;
      if (Object.values(snapshot.inventory).some(value => !Number.isFinite(value) || value < 0)) return false;
      if (snapshot.memoryEvents && (!Array.isArray(snapshot.memoryEvents) || snapshot.memoryEvents.length > 300)) return false;
      if (!['playing', 'rift', 'ending', 'finished'].includes(snapshot.phase)) return false;
      if (snapshot.checkpoint && (!Number.isInteger(snapshot.checkpoint.biome) || snapshot.checkpoint.biome < 0 || snapshot.checkpoint.biome > 9 || !Number.isFinite(snapshot.checkpoint.x) || !Number.isFinite(snapshot.checkpoint.y))) return false;
      const source = clone(snapshot);
      const defaults = {
        storage: {}, worldTime: 0, elapsed: 0, discoveries: {}, camps: {}, upgrades: { health: 0, stamina: 0, regen: 0, speed: 0 },
        riftNodes: [], riftClosed: false, electricUnlocked: source.defeated.includes(19), memoryEvents: [],
        visited: [0], collected: {}, secrets: [], bossHealth: {}, tutorial: { opening: true, guide: true }, seed: 935019, deathCount: 0,
        acidUsed: !!source.boss?.acidApplied, acidProgress: source.boss?.meltTimer || 0,
      };
      this.state = { ...defaults, ...source, enemies: [], boss: null, projectiles: [], particles: [], targetId: null };
      this.state.memoryEvents = this.state.memoryEvents.map(event => event.snapshot ? { ...event, snapshot: replaySnapshot(event.snapshot, event.biome) } : event);
      const p = this.state.player;
      p.facing ||= { x: 0, y: 1 }; p.equipment ||= {}; p.maxStamina ||= 100; p.stamina = clamp(p.stamina ?? 100, 0, p.maxStamina);
      p.hunger = clamp(p.hunger ?? 100, 0, 100); p.thirst = clamp(p.thirst ?? 100, 0, 100); p.sleep = clamp(p.sleep ?? 100, 0, 100);
      p.hp = clamp(p.hp, 1, p.maxHp); p.attackTimer = 0; p.attackCooldown = 0; p.invulnerable = 1; p.electric = this.state.electricUnlocked;
      this.state.checkpoint ||= { biome: source.biome, x: 160, y: 576 };
      this.discoverySets = {};
      const position = { x: source.player.x, y: source.player.y };
      this.enterWorld(source.biome, false);
      if (isWalkable(this.world, position.x, position.y, 6)) Object.assign(p, position);
      this.events = [];
      if (this.state.phase === 'ending') this.emit('ending');
      this.toast('Sua jornada foi retomada.');
      return true;
    } catch { this.state = previousState; this.world = previousWorld; return false; }
  }

  update(dt, input = {}) {
    if (!this.state || !['playing', 'rift'].includes(this.state.phase)) return;
    if (!Number.isFinite(dt) || dt <= 0) return;
    dt = Math.min(dt, .1);
    const s = this.state, p = s.player;
    s.elapsed += dt; s.worldTime += dt;
    p.hunger = Math.max(0, p.hunger - dt * .046); p.thirst = Math.max(0, p.thirst - dt * .064);
    p.sleep = Math.max(0, p.sleep - dt * 80 / (DAY_LENGTH * 3.5));
    if (p.hunger <= 0 || p.thirst <= 0) p.hp -= dt * .7 * this.difficultyScale;
    p.stamina = Math.min(p.maxStamina, p.stamina + dt * (20 + s.upgrades.regen * 6) * (p.charge > 0 ? .18 : 1));
    p.invulnerable = Math.max(0, p.invulnerable - dt); p.attackTimer = Math.max(0, p.attackTimer - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt); p.dodgeCooldown = Math.max(0, p.dodgeCooldown - dt);
    p.dodgeTimer = Math.max(0, p.dodgeTimer - dt); p.hurtTimer = Math.max(0, (p.hurtTimer || 0) - dt);
    this.toastClock = Math.max(0, this.toastClock - dt);
    let mx = Number(input.moveX) || 0, my = Number(input.moveY) || 0;
    const magnitude = Math.hypot(mx, my); if (magnitude > 1) { mx /= magnitude; my /= magnitude; }
    p.moving = Math.abs(mx) + Math.abs(my) > .03;
    if (p.moving) p.facing = vector(mx, my);
    if (Number.isFinite(input.aimX) && Number.isFinite(input.aimY)) p.facing = vector(input.aimX - p.x, input.aimY - p.y);
    if (input.cycleTarget) this.cycleTarget();
    if (input.dodge && p.dodgeCooldown <= 0 && p.stamina >= 19) {
      p.stamina -= 19; p.dodgeTimer = .23; p.dodgeCooldown = .62; p.invulnerable = .3;
      p.dodgeDirection = p.moving ? vector(mx, my) : { ...p.facing };
      this.emit('sound', { id: 'dodge' });
    }
    let speed = 100 + s.upgrades.speed * 9;
    if (p.dodgeTimer > 0) { speed = 335; mx = p.dodgeDirection.x; my = p.dodgeDirection.y; }
    else if (input.sprint && p.moving && p.stamina > 1 && !p.charge) { speed *= 1.55; p.stamina = Math.max(0, p.stamina - dt * 28); }
    if (p.charge > 0) speed *= .55;
    this.move(p, mx * speed * dt, my * speed * dt, 6);
    if (input.strong === true || input.strong === 'start') {
      this.strongHeld = true; p.charge = Math.min(1.3, p.charge + dt);
    } else if (this.strongHeld || input.strong === 'release') {
      this.strongHeld = false; const charge = p.charge; p.charge = 0;
      if (charge > .04 || input.strong === 'release') this.attack(input, clamp(charge / .8, .3, 1.5));
    }
    if (input.attack && !this.strongHeld) this.attack(input, 0);
    if (input.potion) this.applyAcid();
    if (input.electric) this.electricPulse();
    if (input.interact) this.interact();
    this.activateBoss();
    this.updateEnemies(dt); this.updateBoss(dt); this.updateProjectiles(dt);
    for (const particle of s.particles) { particle.life -= dt; particle.x += (particle.vx || 0) * dt; particle.y += (particle.vy || 0) * dt; }
    s.particles = s.particles.filter(particle => particle.life > 0);
    this.spawnClock -= dt;
    if (this.spawnClock <= 0 && !s.boss && s.phase === 'playing') { this.spawnEnemy(); this.spawnClock = Math.max(3.5, 13 - s.biome * .55 - this.sleepPressure * 6 - (this.isNight ? 2 : 0)); }
    this.memoryClock += dt;
    if (this.memoryClock > 220 && s.tutorial.guide) { this.memoryClock = 0; this.memory('survival'); }
    this.discover();
    if (p.hp <= 0) this.respawn();
  }

  move(entity, dx, dy, radius = 7) {
    // Deslizar ao longo das bordas mantém os comandos fluidos nas passagens estreitas.
    if (isWalkable(this.world, entity.x + dx, entity.y, radius)) entity.x += dx;
    if (isWalkable(this.world, entity.x, entity.y + dy, radius)) entity.y += dy;
    entity.x = clamp(entity.x, radius, this.world.width * TILE - radius);
    entity.y = clamp(entity.y, radius, this.world.height * TILE - radius);
  }

  targets(range = 360) {
    const list = this.state.enemies.filter(e => e.hp > 0);
    if (this.state.boss?.hp > 0) list.push(this.state.boss);
    return list.filter(e => distance(e, this.state.player) < range).sort((a, b) => distance(a, this.state.player) - distance(b, this.state.player));
  }
  cycleTarget() {
    const list = this.targets(); if (!list.length) { this.state.targetId = null; return; }
    const index = list.findIndex(e => e.entityId === this.state.targetId);
    this.state.targetId = list[(index + 1) % list.length].entityId;
  }
  aim(input = {}) {
    const p = this.state.player;
    if (Number.isFinite(input.aimX) && Number.isFinite(input.aimY)) return vector(input.aimX - p.x, input.aimY - p.y);
    const targets = this.targets(390), target = targets.find(e => e.entityId === this.state.targetId) || targets[0];
    if (target) { this.state.targetId = target.entityId; return vector(target.x - p.x, target.y - p.y); }
    return p.facing;
  }

  attack(input = {}, strong = 0) {
    const s = this.state, p = s.player;
    if (p.attackCooldown > 0 || p.dodgeTimer > 0) return false;
    const weapon = WEAPONS[p.weapon] || BASE_WEAPON, equipment = p.equipment[p.weapon];
    if (equipment && equipment.durability <= 0) return this.fail('A arma quebrou. Repare-a em um ponto de apoio.');
    const stamina = weapon.stamina * (strong ? 1.7 : 1);
    if (p.stamina < stamina) { if (this.toastClock <= 0) { this.toast('Recupere o fôlego antes de atacar.'); this.toastClock = 2; } return false; }
    p.stamina -= stamina;
    const direction = this.aim(input); p.facing = direction; p.attackAngle = Math.atan2(direction.y, direction.x);
    p.strongAttack = strong > 0; p.attackTimer = strong ? .35 : .23;
    p.attackCooldown = weapon.cooldown * (strong ? 1.42 : 1);
    const damage = weapon.damage * (1 + (equipment?.upgrade || 0) * .28) * (strong ? 1.55 + strong * .55 : 1);
    if (equipment) equipment.durability = Math.max(0, equipment.durability - (strong ? 1.15 : .6));
    if (weapon.ranged) {
      const speed = p.weapon === 'crossbow' ? 410 : 335;
      s.projectiles.push({ id: `p-${s.elapsed}-${this.random()}`, x: p.x + direction.x * 12, y: p.y + direction.y * 12,
        vx: direction.x * speed, vy: direction.y * speed, owner: 'player', damage, life: 1.7, radius: strong ? 5 : 3, color: weapon.color, pierce: strong ? 2 : 0 });
    } else {
      const arc = weapon.arc || 1.7, range = weapon.range + (strong ? 9 : 0);
      for (const enemy of this.targets(range + 45)) {
        const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        if (distance(enemy, p) <= range + (enemy.radius || 10) && Math.abs(angleDifference(angle, p.attackAngle)) < arc / 2) {
          this.hit(enemy, damage, direction, strong ? 18 : 8);
        }
      }
    }
    this.emit('sound', { id: weapon.ranged ? 'bow' : 'attack' });
    return true;
  }

  hit(enemy, damage, direction = { x: 0, y: 0 }, knockback = 0) {
    if (enemy.id === 19 && enemy.isBoss && !enemy.acidApplied && enemy.hp - damage < enemy.maxHp * .22) {
      enemy.hp = enemy.maxHp * .22;
      if (!enemy.acidPrompted) { enemy.acidPrompted = true; this.toast('A carapaça se fecha. Use a poção ácida [R] para derretê-la.'); }
    } else enemy.hp -= damage;
    enemy.hurtTimer = .2;
    if (!enemy.isBoss) this.move(enemy, direction.x * knockback, direction.y * knockback, enemy.radius);
    this.burst(enemy.x, enemy.y, enemy.color || '#ffde7a', 5);
    if (enemy.hp <= 0) {
      if (enemy.isBoss) this.defeatBoss(enemy);
      else {
        this.give('essence', enemy.type === 'elite' ? 3 : 1);
        if (this.random() > .45) this.give('fruit', 1);
        this.state.enemies = this.state.enemies.filter(e => e !== enemy);
        this.state.tutorial.combat = true;
        this.emit('sound', { id: 'defeat' });
      }
    }
  }

  hurt(damage) {
    const p = this.state.player;
    if (p.invulnerable > 0 || p.hp <= 0) return false;
    p.hp -= damage * this.difficultyScale; p.invulnerable = .65; p.hurtTimer = .28;
    this.burst(p.x, p.y, '#ffd596', 5); this.emit('sound', { id: 'hurt' });
    return true;
  }
  burst(x, y, color, count = 9) {
    for (let i = 0; i < count; i++) { const a = this.random() * Math.PI * 2, speed = 15 + this.random() * 45;
      this.state.particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, color, life: .35 + this.random() * .4, size: 2 }); }
  }

  spawnEnemy() {
    const s = this.state, p = s.player;
    const max = 4 + Math.floor(s.biome / 3) + Math.ceil(this.sleepPressure * 3);
    if (s.enemies.length >= max || distance(p, this.world.support) < 95) return;
    for (let tries = 0; tries < 18; tries++) {
      const angle = this.random() * Math.PI * 2, range = 220 + this.random() * 110;
      const x = p.x + Math.cos(angle) * range, y = p.y + Math.sin(angle) * range;
      if (!isWalkable(this.world, x, y, 12) || distance({ x, y }, this.world.support) < 105) continue;
      const roll = this.random(), type = s.biome > 4 && roll > .92 ? 'elite' : roll < .5 ? 'melee' : roll < .78 ? 'ranged' : 'heavy';
      const hp = (type === 'heavy' ? 53 : type === 'elite' ? 64 : 27) + s.biome * 3;
      s.enemies.push({ id: `inv-${s.seed}`, entityId: `inv-${s.seed}`, type, x, y, hp, maxHp: hp, radius: type === 'heavy' ? 12 : 9,
        damage: (type === 'heavy' ? 14 : 8) + s.biome, speed: type === 'heavy' ? 31 : type === 'ranged' ? 43 : 56,
        telegraph: 0, cooldown: 1.2, angle: 0, attackRadius: type === 'heavy' ? 49 : 28, color: BIOMES[s.biome].palette.accent,
        strength: 1 + this.sleepPressure * .65 });
      return;
    }
  }

  updateEnemies(dt) {
    const s = this.state, p = s.player;
    for (const enemy of [...s.enemies]) {
      enemy.hurtTimer = Math.max(0, (enemy.hurtTimer || 0) - dt); enemy.cooldown -= dt;
      if (distance(enemy, p) > 670) { s.enemies = s.enemies.filter(e => e !== enemy); continue; }
      const d = distance(enemy, p), direction = vector(p.x - enemy.x, p.y - enemy.y);
      enemy.angle = Math.atan2(direction.y, direction.x);
      if (enemy.telegraph > 0) {
        enemy.telegraph -= dt;
        if (enemy.telegraph <= 0) {
          if (enemy.type === 'ranged') this.projectile(enemy, enemy.angle, 135, enemy.damage * enemy.strength);
          else if (d < enemy.attackRadius + 7) this.hurt(enemy.damage * enemy.strength);
          enemy.attackTimer = .25; enemy.cooldown = enemy.type === 'heavy' ? 1.6 : 1.2;
        }
      } else if (enemy.cooldown <= 0 && d < (enemy.type === 'ranged' ? 245 : enemy.attackRadius + 9)) {
        enemy.telegraph = enemy.type === 'heavy' ? .72 : enemy.type === 'ranged' ? .6 : .38;
      } else {
        const wanted = enemy.type === 'ranged' ? 160 : 17;
        const sign = d > wanted ? 1 : enemy.type === 'ranged' && d < 105 ? -1 : 0;
        this.move(enemy, direction.x * enemy.speed * dt * sign, direction.y * enemy.speed * dt * sign, enemy.radius);
        // Separação leve impede pilhas de sprites na mesma posição.
        for (const other of s.enemies) if (other !== enemy && distance(enemy, other) < 20) {
          const away = vector(enemy.x - other.x, enemy.y - other.y); this.move(enemy, away.x * dt * 18, away.y * dt * 18, enemy.radius);
        }
      }
      enemy.attackTimer = Math.max(0, (enemy.attackTimer || 0) - dt);
    }
  }

  activateBoss() {
    const s = this.state;
    if (s.boss || s.phase !== 'playing') return;
    for (const marker of this.world.bosses) {
      if (s.defeated.includes(marker.id) || distance(s.player, marker) > 155) continue;
      if (marker.id === 19 && !s.defeated.includes(18)) { if (this.toastClock <= 0) { this.toast('O primeiro guardião protege a entrada desta arena.'); this.toastClock = 5; } continue; }
      const data = BOSSES.find(b => b.id === marker.id);
      if (!data) continue;
      const maxHp = data.hp || (170 + marker.id * 14);
      s.boss = { ...data, x: marker.x, y: marker.y, homeX: marker.x, homeY: marker.y, entityId: `boss-${marker.id}`, isBoss: true,
        hp: s.bossHealth[marker.id] || maxHp, maxHp, radius: marker.id === 19 ? 33 : 22 + marker.id % 4 * 3,
        phase: 1, telegraph: 0, cooldown: 1.6, patternIndex: 0, attackTimer: 0, chargeTimer: 0, angle: 0, attackRadius: 85,
        acidApplied: marker.id === 19 && !!s.acidUsed, meltTimer: marker.id === 19 ? s.acidProgress || 0 : 0,
        pattern: data.pattern || 'charge', primary: data.pattern || 'charge', secondary: data.secondary || 'radial' };
      s.enemies = []; s.projectiles = [];
      this.toast(`${data.name}: observe os sinais e preserve seu fôlego.`); this.emit('sound', { id: 'boss' });
      break;
    }
  }

  updateBoss(dt) {
    const b = this.state.boss, p = this.state.player;
    if (!b || b.hp <= 0) return;
    b.hurtTimer = Math.max(0, (b.hurtTimer || 0) - dt); b.attackTimer = Math.max(0, b.attackTimer - dt);
    b.phase = b.hp < b.maxHp * .32 ? 3 : b.hp < b.maxHp * .66 ? 2 : 1;
    if (b.acidApplied) {
      b.meltTimer += dt; this.state.acidProgress = b.meltTimer; b.hp -= dt * b.maxHp * .07;
      if (this.random() < dt * 12) this.burst(b.x, b.y, '#bbf3bf', 2);
      if (b.hp <= 0) { this.defeatBoss(b); return; }
    }
    if (distance(b, p) > 670) {
      this.state.bossHealth[b.id] = b.hp; this.state.boss = null; this.state.projectiles = [];
      this.toast('O invasor permanece em sua arena. Você pode se preparar e voltar.'); return;
    }
    if (b.chargeTimer > 0) {
      b.chargeTimer -= dt; this.move(b, Math.cos(b.angle) * 265 * dt, Math.sin(b.angle) * 265 * dt, b.radius * .7);
      if (distance(b, p) < b.radius + 9) this.hurt((b.damage || 15) * 1.1);
      return;
    }
    if (b.telegraph > 0) {
      b.telegraph -= dt;
      if (b.telegraph <= 0) { this.bossPattern(b); b.cooldown = Math.max(.85, (b.patternTime || 2.7) - b.phase * .24); b.attackTimer = .42; }
      return;
    }
    b.cooldown -= dt;
    if (b.cooldown <= 0) {
      b.pattern = b.patternIndex++ % (b.phase > 1 ? 2 : 3) === 0 ? b.primary : b.secondary;
      b.telegraph = b.telegraphTime || (b.pattern === 'beam' ? 1.0 : b.pattern === 'charge' ? .85 : .67 + (b.id % 3) * .05);
      b.angle = Math.atan2(p.y - b.y, p.x - b.x);
      b.attackRadius = b.pattern === 'slam' ? 90 + b.phase * 10 : b.pattern === 'beam' ? 260 : b.radius + 22;
      b.targetX = p.x; b.targetY = p.y;
    } else {
      const dir = vector(p.x - b.x, p.y - b.y), d = distance(b, p);
      if (d > (b.primary === 'slam' ? 65 : 110)) this.move(b, dir.x * (b.speed || 38) * dt, dir.y * (b.speed || 38) * dt, b.radius * .6);
      if (d < b.radius + 8 && b.attackTimer > 0) this.hurt(b.damage || 16);
    }
  }

  bossPattern(b) {
    const damage = (b.damage || 15) * (1 + (b.phase - 1) * .12), speed = 110 + b.id * 2;
    const count = (b.projectileCount || 6 + b.id % 4) + (b.phase - 1) * 2;
    if (b.pattern === 'charge') { b.chargeTimer = .8 + b.id % 3 * .08; }
    else if (b.pattern === 'radial') {
      for (let i = 0; i < count; i++) this.projectile(b, i / count * Math.PI * 2 + (b.id % 5) * .18, speed, damage);
    } else if (b.pattern === 'fan') {
      const count = 3 + b.phase * 2;
      for (let i = 0; i < count; i++) this.projectile(b, b.angle + (i - (count - 1) / 2) * .19, speed + 45, damage);
    } else if (b.pattern === 'orbit') {
      for (let i = 0; i < count; i++) this.projectile(b, i / count * Math.PI * 2 + b.angle, speed * .8, damage, { curve: (b.id % 2 ? -1 : 1) * .9, radius: 5 });
    } else if (b.pattern === 'slam') {
      this.burst(b.x, b.y, b.accent || '#ffefb4', 30);
      if (distance(this.state.player, b) < b.attackRadius) this.hurt(damage * 1.22);
      for (let i = 0; i < 4 + b.phase; i++) this.projectile(b, i / (4 + b.phase) * Math.PI * 2, speed * .65, damage * .6, { radius: 6 });
    } else if (b.pattern === 'beam') {
      const dir = { x: Math.cos(b.angle), y: Math.sin(b.angle) }, p = this.state.player;
      const longitudinal = (p.x - b.x) * dir.x + (p.y - b.y) * dir.y;
      const side = Math.abs((p.x - b.x) * dir.y - (p.y - b.y) * dir.x);
      if (longitudinal > 0 && longitudinal < 320 && side < 17 + b.phase * 3) this.hurt(damage * 1.15);
      for (let n = 0; n < 12; n++) this.burst(b.x + dir.x * n * 24, b.y + dir.y * n * 24, b.accent || '#ffffdb', 2);
      for (let i = -1; i <= 1; i++) this.projectile(b, b.angle + i * .35, speed, damage * .7);
    }
  }

  projectile(owner, angle, speed, damage, extras = {}) {
    this.state.projectiles.push({ x: owner.x + Math.cos(angle) * (owner.radius || 9), y: owner.y + Math.sin(angle) * (owner.radius || 9),
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, owner: 'enemy', damage, radius: 4, life: 3.6, color: owner.accent || '#f7c7a4', ...extras });
  }
  updateProjectiles(dt) {
    const s = this.state;
    for (const projectile of [...s.projectiles]) {
      if (projectile.curve) { const angle = Math.atan2(projectile.vy, projectile.vx) + projectile.curve * dt, speed = Math.hypot(projectile.vx, projectile.vy);
        projectile.vx = Math.cos(angle) * speed; projectile.vy = Math.sin(angle) * speed; }
      projectile.x += projectile.vx * dt; projectile.y += projectile.vy * dt; projectile.life -= dt;
      if (!isWalkable(this.world, projectile.x, projectile.y, 2)) projectile.life = 0;
      if (projectile.owner === 'player') {
        for (const target of this.targets(700)) {
          if (projectile.hitIds?.includes(target.entityId)) continue;
          if (distance(projectile, target) < (target.radius || 10) + projectile.radius) {
            this.hit(target, projectile.damage); projectile.hitIds ||= []; projectile.hitIds.push(target.entityId);
            if (projectile.pierce > 0) projectile.pierce--; else { projectile.life = 0; break; }
          }
        }
      } else if (distance(projectile, s.player) < projectile.radius + 7) { this.hurt(projectile.damage); projectile.life = 0; }
    }
    s.projectiles = s.projectiles.filter(p => p.life > 0);
  }

  defeatBoss(boss) {
    const s = this.state;
    if (s.defeated.includes(boss.id)) return;
    this.record('boss', { bossId: boss.id });
    s.defeated.push(boss.id); delete s.bossHealth[boss.id];
    this.give('essence', 6 + Math.floor(boss.id / 3)); this.give('crystal', 2); this.give('ore', 3);
    this.burst(boss.x, boss.y, boss.accent || '#fff2bb', 35);
    s.boss = null; s.projectiles = []; s.player.hp = Math.min(s.player.maxHp, s.player.hp + 20);
    this.toast(`${boss.name} foi vencido. A passagem se abre.`); this.emit('sound', { id: 'bossDefeat' });
    this.memory('boss', false);
    if (boss.id === 19) {
      s.electricUnlocked = true; s.player.electric = true; s.phase = 'rift';
      this.toast('Um campo elétrico desperta. Ative os três focos da fenda com [C].');
      this.record('electric'); this.emit('save');
    } else this.emit('save');
  }

  applyAcid() {
    const b = this.state.boss;
    if (!b || b.id !== 19) return this.fail('Guarde a poção ácida para o último invasor.');
    if (b.acidApplied) return this.fail('A poção já está dissolvendo a carapaça.');
    if (!(this.state.inventory.acid > 0)) return this.fail('Fabrique a poção ácida com os nove ingredientes em um ponto de apoio.');
    if (distance(b, this.state.player) > 210) return this.fail('Aproxime-se do invasor para usar a poção.');
    if (b.hp > b.maxHp * .33) return this.fail('Enfraqueça a criatura primeiro. A poção funciona quando as pétalas se fecham na última fase.');
    this.state.inventory.acid--; this.state.acidUsed = true;
    b.acidApplied = true; b.meltTimer = 0; b.hp = Math.min(b.hp, b.maxHp * .55);
    this.record('acid', { bossId: 19 });
    this.burst(b.x, b.y, '#b6f2ae', 30); this.toast('A poção corrói a carapaça. A criatura começa a se desfazer.'); this.emit('sound', { id: 'acid' }); this.emit('save');
    return true;
  }

  riftPositions() { return this.world.riftNodes || [{ id: 0, x: 1080, y: 400 }, { id: 1, x: 1240, y: 272 }, { id: 2, x: 1408, y: 384 }]; }
  electricPulse() {
    const s = this.state;
    if (!s.electricUnlocked) return this.fail('Você ainda não possui esse poder.');
    if (s.biome !== 9 || s.phase !== 'rift') return this.fail('O campo reage aos focos junto à fenda.');
    const nodes = this.riftPositions(), node = nodes.find((n, i) => !s.riftNodes.includes(n.id ?? i) && distance(n, s.player) < 80);
    if (!node) return this.fail('Aproxime-se de um foco luminoso ainda apagado.');
    const id = node.id ?? nodes.indexOf(node); s.riftNodes.push(id); this.burst(node.x, node.y, '#b7eaff', 30);
    this.toast(`Foco energizado (${s.riftNodes.length}/3).`); this.emit('sound', { id: 'electric' });
    if (s.riftNodes.length === 3) {
      s.riftClosed = true; s.phase = 'ending'; this.record('rift');
      this.toast('A fenda se fecha. O Guia se aproxima.'); this.emit('dialogue', { id: 'riftComplete' }); this.emit('save');
    }
    return true;
  }

  interact() {
    const s = this.state, p = s.player;
    if (this.atSupport) {
      const first = !s.supports.includes(s.biome); if (first) s.supports.push(s.biome);
      s.checkpoint = { biome: s.biome, x: this.world.support.x, y: this.world.support.y };
      s.storage[this.world.support.id] ||= {};
      this.emit('save'); this.emit('panel', { panel: 'support', supportId: this.world.support.id, biome: s.biome });
      if (first) this.toast('Ponto de apoio descoberto: descanso, reparo e viagem rápida disponíveis.');
      return true;
    }
    for (const npc of this.world.npcs || []) if (distance(npc, p) < 48) {
      const id = npc.id === 'gatekeeper' || npc.id === 'porteiro' ? 'opening' : s.tutorial.guide ? 'guideReturn' : 'guide';
      this.emit('dialogue', { id }); return true;
    }
    for (const camp of s.camps[s.biome] || []) if (distance(camp, p) < 40) return this.sleep();
    const ingredient = this.world.ingredient;
    if (ingredient && !s.ingredients.includes(ingredient.id) && distance(ingredient, p) < 42) {
      s.ingredients.push(ingredient.id); this.give(ingredient.id, 1); ingredient.collected = true;
      this.toast(`Ingrediente encontrado: ${ITEMS[ingredient.id]?.name || 'essência da região'} (${s.ingredients.length}/9).`);
      this.memory('ingredient'); this.emit('save'); return true;
    }
    for (const secret of this.world.secrets || []) if (!s.secrets.includes(secret.id) && distance(secret, p) < 40) {
      s.secrets.push(secret.id); secret.collected = true; this.give('crystal', 5); this.give('ore', 4); this.give('essence', 3);
      this.toast('Uma passagem escondida guarda cristais, minério e um eco distante.'); this.memory('secret'); return true;
    }
    const resources = this.world.objects.filter(o => !o.depleted && o.resource && distance(o, p) < 36).sort((a, b) => distance(a, p) - distance(b, p));
    if (resources.length) return this.collect(resources[0]);
    if (distance(p, this.world.exit) < 72) return this.advance();
    // Água é coletável nas margens, sem exigir recipiente fabricado continuamente.
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
      const tx = Math.floor((p.x + Math.cos(angle) * 24) / TILE), ty = Math.floor((p.y + Math.sin(angle) * 24) / TILE);
      if (this.world.tiles[ty]?.[tx] === 2) { this.give('water', 2); this.toast('Água cristalina coletada.'); return true; }
    }
    return this.fail('Aproxime-se de um recurso, personagem ou ponto de interesse.');
  }

  collect(object) {
    const s = this.state, p = s.player;
    let quantity = object.quantity || 2;
    const tool = ['wood'].includes(object.resource) ? 'axe_tool' : ['stone', 'ore', 'crystal'].includes(object.resource) ? 'pickaxe' : null;
    const equipment = tool && p.equipment[tool];
    if (equipment && equipment.durability > 0) { quantity += 1 + equipment.upgrade; equipment.durability = Math.max(0, equipment.durability - .6); }
    else if (tool) quantity = Math.max(1, Math.ceil(quantity * .65));
    this.give(object.resource, quantity); object.depleted = true; s.collected[s.biome][object.id] = Math.max(.000001, s.elapsed);
    s.tutorial.collected = true;
    this.burst(object.x, object.y, BIOMES[s.biome].palette.accent, 5);
    this.toast(`+${quantity} ${ITEMS[object.resource]?.name || object.resource}`); this.emit('sound', { id: 'collect' });
    return true;
  }
  give(item, quantity) { this.state.inventory[item] = (this.state.inventory[item] || 0) + quantity; }

  advance() {
    const s = this.state;
    if (s.biome === 9) return this.fail(s.electricUnlocked ? 'Os focos da fenda aguardam sua energia.' : 'A missão termina nas duas arenas desta região.');
    const guardian = this.world.bosses[1];
    if (guardian && !s.defeated.includes(guardian.id)) return this.fail('O grande invasor ainda ocupa a passagem. Contorne seus golpes e vença a arena.');
    if (s.biome === 8 && (s.defeated.filter(id => id < 18).length < 18 || s.ingredients.length < 9)) {
      return this.fail(`O acesso ao Limite pede os 18 grandes invasores e os 9 ingredientes. Pendências: ${18 - s.defeated.filter(id => id < 18).length} invasores, ${9 - s.ingredients.length} ingredientes. Use viagem rápida nos apoios.`);
    }
    this.enterWorld(s.biome + 1); this.toast(BIOMES[s.biome].name); this.emit('save');
    return true;
  }

  discover() {
    const s = this.state, p = s.player;
    s.discoveries[s.biome] ||= [];
    const discovered = s.discoveries[s.biome];
    const known = this.discoverySets[s.biome] ||= new Set(discovered);
    const tx = Math.floor(p.x / TILE), ty = Math.floor(p.y / TILE);
    for (let y = Math.max(0, ty - 7); y <= Math.min(this.world.height - 1, ty + 7); y++) {
      for (let x = Math.max(0, tx - 7); x <= Math.min(this.world.width - 1, tx + 7); x++) {
        if ((x - tx) ** 2 + (y - ty) ** 2 <= 49) { const id = `${x},${y}`; if (!known.has(id)) { discovered.push(id); known.add(id); } }
      }
    }
    const points = [this.world.support, this.world.exit, ...this.world.bosses, ...(this.world.secrets || []), this.world.ingredient].filter(Boolean);
    s.pointsOfInterest ||= {}; s.pointsOfInterest[s.biome] ||= [];
    for (const point of points) if (distance(p, point) < 135) {
      const id = point.id ?? `${point.x},${point.y}`;
      if (!s.pointsOfInterest[s.biome].includes(id)) s.pointsOfInterest[s.biome].push(id);
    }
  }

  record(kind, fields = {}) {
    const s = this.state;
    if (s.memoryEvents.length >= MEMORY_LIMIT) {
      // Eventos cotidianos cedem lugar às ações que serão reinterpretadas no desfecho.
      const disposable = s.memoryEvents.findIndex(event => !ESSENTIAL_MEMORIES.has(event.kind));
      if (disposable >= 0) s.memoryEvents.splice(disposable, 1);
      else {
        if (!ESSENTIAL_MEMORIES.has(kind)) return;
        const duplicate = s.memoryEvents.findIndex(event => event.kind === kind && event.bossId === fields.bossId);
        if (duplicate >= 0) s.memoryEvents.splice(duplicate, 1);
        else return; // Uma campanha válida possui somente 23 registros essenciais distintos.
      }
    }
    const snapshot = replaySnapshot(s);
    s.memoryEvents.push({ kind, biome: s.biome, time: s.elapsed, ...fields, snapshot });
  }
  memory(kind, record = true) {
    if (record) this.record(kind);
    const index = (this.state.defeated.length + this.state.ingredients.length + this.state.secrets.length) % Math.max(1, MEMORIES.length);
    this.emit('memory', { index });
  }

  respawn() {
    const s = this.state;
    this.record('death'); s.deathCount++;
    for (const item of COMMON) if (s.inventory[item] > 0) s.inventory[item] = Math.ceil(s.inventory[item] * .8);
    const checkpoint = { ...s.checkpoint }; this.enterWorld(checkpoint.biome, false);
    s.player.x = checkpoint.x; s.player.y = checkpoint.y; s.player.hp = s.player.maxHp;
    s.player.hunger = Math.max(45, s.player.hunger); s.player.thirst = Math.max(45, s.player.thirst); s.player.sleep = Math.max(30, s.player.sleep);
    s.player.stamina = s.player.maxStamina; s.player.invulnerable = 3;
    this.toast('Você desperta no último apoio. Parte dos recursos se perdeu; equipamentos e ingredientes permanecem.');
    this.emit('save'); this.emit('sound', { id: 'respawn' });
  }

  act(action, payload) {
    if (!this.state) return false;
    if (action === 'dialogueEnd') {
      const id = typeof payload === 'string' ? payload : payload?.id;
      if (id === 'opening') { this.state.tutorial.opening = true; if (!this.state.tutorial.guide) this.emit('dialogue', { id: 'guide' }); }
      else if (id === 'guide') { this.state.tutorial.guide = true; this.toast('Explore os arredores, colete materiais e prepare sua primeira ferramenta no inventário [I].'); }
      else if (id === 'riftComplete') this.emit('ending');
      return true;
    }
    if (action === 'finish') { this.state.phase = 'finished'; this.state.player.charge = 0; return true; }
    if (!['playing', 'rift'].includes(this.state.phase)) return false;
    if (action === 'craft') return this.craft(typeof payload === 'string' ? payload : payload?.id);
    if (action === 'equip') return this.equip(typeof payload === 'string' ? payload : payload?.id);
    if (action === 'eat') return this.consume('food', 'fruit', 'hunger', 42, 24, 'Você recuperou as forças com uma refeição.');
    if (action === 'drink') return this.consume('water', null, 'thirst', 55, 0, 'A água cristalina mata sua sede.');
    if (action === 'heal') return this.consume('heal', null, 'hp', 50, 0, 'Seu ferimento foi cuidado.');
    if (action === 'camp') return this.placeCamp();
    if (action === 'sleep') return this.sleep();
    if (action === 'repair') return this.repair(typeof payload === 'string' ? payload : payload?.id);
    if (action === 'upgrade') return this.upgrade(typeof payload === 'string' ? payload : payload?.id || payload?.attribute);
    if (action === 'travel') return this.travel(typeof payload === 'number' ? payload : payload?.biome);
    if (action === 'deposit') return this.transfer(payload, false);
    if (action === 'withdraw') return this.transfer(payload, true);
    if (action === 'acid') return this.applyAcid();
    if (action === 'electric') return this.electricPulse();
    if (action === 'interact') return this.interact();
    if (action === 'attackStrong') return this.attack({}, 1);
    if (action === 'save') { if (!this.atSupport) return this.fail('O salvamento manual está disponível nos pontos fixos de apoio.'); this.emit('save'); return true; }
    return false;
  }

  craft(id) {
    const s = this.state, recipe = RECIPES.find(r => r.id === id);
    if (!recipe) return this.fail('Essa receita não está disponível.');
    if (recipe.support && !this.atSupport) return this.fail('Esta receita precisa de um ponto de apoio.');
    const output = recipe.output || {};
    if ((WEAPONS[id] || ['axe_tool', 'pickaxe'].includes(id)) && s.player.equipment[id]) return this.fail('Você já tem este equipamento. Repare ou melhore no apoio.');
    if (id === 'acid' && (s.inventory.acid > 0 || s.acidUsed)) return this.fail('A poção de missão já foi preparada.');
    if (id === 'acid' && s.ingredients.length < 9) return this.fail('Encontre o ingrediente especial de cada um dos nove primeiros biomas.');
    for (const [item, qty] of Object.entries(recipe.cost || {})) if ((s.inventory[item] || 0) < qty) return this.fail(`Falta ${ITEMS[item]?.name || item}: ${qty - (s.inventory[item] || 0)}.`);
    for (const [item, qty] of Object.entries(recipe.cost || {})) s.inventory[item] -= qty;
    for (const [item, qty] of Object.entries(output)) {
      if (WEAPONS[item] || ['axe_tool', 'pickaxe'].includes(item)) {
        const durability = WEAPONS[item]?.durability || 130;
        s.player.equipment[item] = { durability, maxDurability: durability, upgrade: 0 };
        this.give(item, qty); if (WEAPONS[item] && !s.player.weapon) { s.player.weapon = item; s.tutorial.weapon = true; }
        if (['axe_tool', 'pickaxe'].includes(item)) s.tutorial.tool = true;
      } else this.give(item, qty);
    }
    this.record('craft', { recipeId: id }); this.toast(`${recipe.name} preparado.`); this.emit('sound', { id: 'craft' });
    return true;
  }
  equip(id) {
    if (!WEAPONS[id] || !this.state.player.equipment[id]) return this.fail('Fabrique esta arma antes de equipá-la.');
    if (this.state.player.equipment[id].durability <= 0) return this.fail('Esta arma está quebrada. Repare-a em um ponto de apoio.');
    this.state.player.weapon = id; this.toast(`${WEAPONS[id].name} equipado.`); return true;
  }
  consume(primary, secondary, stat, primaryValue, secondaryValue, text) {
    const s = this.state, p = s.player, max = stat === 'hp' ? p.maxHp : 100;
    if (p[stat] >= max) return this.fail(stat === 'hp' ? 'Sua saúde está completa.' : stat === 'thirst' ? 'Você já está hidratado.' : 'Você está satisfeito.');
    let item = primary, amount = primaryValue;
    if (!(s.inventory[item] > 0)) { if (secondary && s.inventory[secondary] > 0) { item = secondary; amount = secondaryValue; } else return this.fail(`Você não tem ${ITEMS[primary]?.name || primary}.`); }
    s.inventory[item]--; p[stat] = Math.min(max, p[stat] + amount);
    if (item === 'food') p.hp = Math.min(p.maxHp, p.hp + 8);
    s.tutorial[stat === 'thirst' ? 'water' : stat === 'hunger' ? 'food' : 'heal'] = true;
    this.toast(text); this.emit('sound', { id: 'consume' }); return true;
  }
  placeCamp() {
    const s = this.state, p = s.player;
    if (!(s.inventory.camp > 0)) return this.fail('Fabrique um acampamento no inventário antes de montá-lo.');
    if (s.boss || s.enemies.some(e => distance(e, p) < 180)) return this.fail('Afaste-se dos invasores para montar o acampamento.');
    if (this.atSupport || s.camps[s.biome].some(c => distance(c, p) < 60)) return this.fail('Já existe um lugar de descanso próximo.');
    s.inventory.camp--;
    const camp = { id: `camp-${s.biome}-${s.elapsed}`, x: p.x + 16, y: p.y, type: 'camp' };
    s.camps[s.biome].push(camp); this.world.objects.push(camp);
    this.toast('Acampamento montado. Interaja para dormir. Ele não altera seu ponto de retorno.');
    return true;
  }
  sleep() {
    const s = this.state, p = s.player;
    const camp = s.camps[s.biome].find(c => distance(c, p) < 60);
    if (!this.atSupport && !camp) return this.fail('Descanse em um ponto de apoio ou acampamento.');
    if (s.boss || s.enemies.some(e => distance(e, p) < 170)) return this.fail('Há invasores próximos. Encontre um lugar seguro para descansar.');
    p.sleep = 100; p.stamina = p.maxStamina; p.hp = Math.min(p.maxHp, p.hp + 35);
    p.hunger = Math.max(10, p.hunger - 12); p.thirst = Math.max(10, p.thirst - 16);
    s.worldTime += DAY_LENGTH * .3; s.tutorial.sleep = true; s.enemies = []; this.spawnClock = 12;
    this.toast('Você descansa. A brisa anuncia um novo momento do dia.');
    if (this.atSupport) this.emit('save');
    return true;
  }
  repair(id) {
    if (!this.atSupport) return this.fail('Reparos precisam de um ponto fixo de apoio.');
    const p = this.state.player;
    const entries = id && id !== 'all' ? [[id, p.equipment[id]]] : Object.entries(p.equipment).filter(([key, e]) => e.durability < (e.maxDurability || WEAPONS[key]?.durability || 130));
    if (!entries.length || entries.some(([, e]) => !e)) return this.fail('Não há equipamento para reparar.');
    const damaged = entries.filter(([key, e]) => e.durability < (e.maxDurability || WEAPONS[key]?.durability || 130));
    if (!damaged.length) return this.fail('Esse equipamento já está em boas condições.');
    const cost = damaged.length * 2;
    if ((this.state.inventory.stone || 0) < cost || (this.state.inventory.wood || 0) < cost) return this.fail(`O reparo pede ${cost} madeiras e ${cost} pedras.`);
    this.state.inventory.stone -= cost; this.state.inventory.wood -= cost;
    for (const [key, equipment] of damaged) equipment.durability = equipment.maxDurability || WEAPONS[key]?.durability || 130;
    this.toast('Equipamentos reparados.'); this.emit('save'); return true;
  }
  upgrade(attribute) {
    const s = this.state, p = s.player;
    if (!this.atSupport) return this.fail('Melhorias precisam de um ponto fixo de apoio.');
    const equipment = p.equipment[attribute];
    const level = equipment ? equipment.upgrade : s.upgrades[attribute];
    if (!Number.isInteger(level)) return this.fail('Escolha um atributo ou equipamento disponível.');
    const max = equipment ? 3 : 4;
    if (level >= max) return this.fail('Esta melhoria já atingiu o limite.');
    const cost = { essence: 4 + level * 4, crystal: 2 + level * 2, ore: 3 + level * 2 };
    for (const [item, qty] of Object.entries(cost)) if ((s.inventory[item] || 0) < qty) return this.fail(`A melhoria pede ${qty} ${ITEMS[item]?.name || item}.`);
    for (const [item, qty] of Object.entries(cost)) s.inventory[item] -= qty;
    if (equipment) { equipment.upgrade++; equipment.maxDurability = (WEAPONS[attribute]?.durability || 130) * (1 + equipment.upgrade * .2); equipment.durability = equipment.maxDurability; }
    else { s.upgrades[attribute]++; if (attribute === 'health') { p.maxHp += 25; p.hp += 25; } if (attribute === 'stamina') { p.maxStamina += 20; p.stamina += 20; } }
    this.toast(`Melhoria de ${UPGRADE_NAMES[attribute] || ITEMS[attribute]?.name || WEAPONS[attribute]?.name || 'equipamento'} concluída.`);
    this.emit('save'); return true;
  }
  travel(biome) {
    const s = this.state;
    if (!this.atSupport) return this.fail('Use um ponto fixo de apoio para viajar.');
    if (!Number.isInteger(biome) || biome < 0 || biome > 9 || !s.supports.includes(biome)) return this.fail('Descubra o ponto de apoio desse bioma antes de viajar.');
    if (s.boss) return this.fail('Conclua o confronto ou afaste-se da arena antes de viajar.');
    this.enterWorld(biome); s.player.x = this.world.support.x; s.player.y = this.world.support.y;
    s.checkpoint = { biome, x: s.player.x, y: s.player.y }; this.emit('save'); this.toast(`Chegada: ${BIOMES[biome].name}.`); return true;
  }
  transfer(payload, withdraw) {
    if (!this.atSupport) return this.fail('O armazenamento pertence ao ponto fixo de apoio desta região.');
    if (!payload || typeof payload.item !== 'string' || !Number.isFinite(payload.quantity) || payload.quantity <= 0) return this.fail('Escolha uma quantidade válida.');
    const item = payload.item;
    if (this.state.ingredients.includes(item) || WEAPONS[item] || ['axe_tool', 'pickaxe', 'acid'].includes(item)) return this.fail('Equipamentos e itens da missão ficam com você.');
    const storage = this.state.storage[this.world.support.id] ||= {}, inventory = this.state.inventory;
    const source = withdraw ? storage : inventory, destination = withdraw ? inventory : storage;
    const qty = Math.min(Math.floor(payload.quantity), source[item] || 0);
    if (qty <= 0) return this.fail('Não há esse item disponível.');
    source[item] -= qty; destination[item] = (destination[item] || 0) + qty;
    this.toast(`${qty} ${ITEMS[item]?.name || item} ${withdraw ? 'retirado' : 'guardado'}.`); this.emit('save'); return true;
  }
}
