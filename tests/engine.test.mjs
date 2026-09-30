import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine, DAY_LENGTH } from '../src/game/engine.js';
import { BIOMES, BOSSES, RECIPES, WEAPONS } from '../src/data/content.js';
import { isWalkable } from '../src/world/world.js';

const start = () => { const game = new GameEngine(); game.start(); game.drainEvents(); return game; };
const stock = game => { for (const item of ['wood', 'stone', 'fiber', 'fruit', 'water', 'herb', 'ore', 'crystal', 'essence']) game.state.inventory[item] = 100; };
const at = (game, point) => Object.assign(game.state.player, { x: point.x, y: point.y });
const frames = (game, seconds, input = {}) => { for (let t = 0; t < seconds - .0001; t += .1) game.update(.1, input); };
const boss = (game, index) => { at(game, game.world.bosses[index]); game.activateBoss(); assert.ok(game.state.boss); return game.state.boss; };

test('abertura distingue Porteiro e Guia e oferece tutorial somente após recepção', () => {
  const game = new GameEngine(); game.start('easy');
  assert.deepEqual(game.drainEvents(), [{ type: 'dialogue', id: 'opening' }]);
  assert.equal(game.act('dialogueEnd', 'opening'), true);
  assert.ok(game.drainEvents().some(e => e.id === 'guide'));
  game.act('dialogueEnd', 'guide'); assert.equal(game.state.tutorial.guide, true);
});

test('crafting é transacional, armas têm identidade e charge consome stamina', () => {
  const game = start(); const before = structuredClone(game.state.inventory);
  assert.equal(game.act('craft', 'crossbow'), false); assert.deepEqual(game.state.inventory, before);
  stock(game);
  for (const id of Object.keys(WEAPONS)) assert.equal(game.act('craft', id), true);
  assert.equal(Object.keys(game.state.player.equipment).length, 7);
  const after = structuredClone(game.state.inventory); assert.equal(game.act('craft', 'sword'), false); assert.deepEqual(game.state.inventory, after);
  game.act('equip', 'sword');
  const p = game.state.player;
  game.update(.1, { strong: true }); assert.ok(p.charge > 0); assert.equal(p.attackTimer, 0);
  frames(game, .8, { strong: true }); game.update(.1, { strong: false });
  assert.ok(p.strongAttack); assert.ok(p.attackTimer > 0); assert.ok(p.stamina < p.maxStamina);
  game.act('equip', 'crossbow'); p.attackCooldown = 0; game.update(.1, { attack: true });
  assert.ok(game.state.projectiles.some(p => p.owner === 'player'));
});

test('colisão e esquiva mantêm posição válida e uma ferramenta quebrada pode ser reparada', () => {
  const game = start(); stock(game); game.act('craft', 'axe_tool');
  const p = game.state.player, startX = p.x;
  frames(game, 1, { moveX: 1, dodge: true }); assert.ok(p.x > startX); assert.ok(isWalkable(game.world, p.x, p.y));
  game.state.player.equipment.axe_tool.durability = 0;
  at(game, game.world.support); assert.equal(game.act('repair', 'all'), true);
  assert.ok(p.equipment.axe_tool.durability > 0);
});

test('acampamento descansa sem mudar checkpoint e sem emitir salvamento', () => {
  const game = start(); stock(game); game.act('craft', 'camp');
  const checkpoint = structuredClone(game.state.checkpoint);
  at(game, { x: 460, y: 580 }); game.state.player.sleep = 5; game.state.player.hunger = 65;
  game.drainEvents(); assert.equal(game.act('camp'), true); assert.equal(game.act('sleep'), true);
  assert.equal(game.state.player.sleep, 100); assert.deepEqual(game.state.checkpoint, checkpoint);
  assert.equal(game.drainEvents().some(e => e.type === 'save'), false);
  assert.ok(game.state.player.hunger < 65);
});

test('cada suporte tem baú próprio e viagem rápida estabelece novo retorno', () => {
  const game = start(); stock(game); at(game, game.world.support);
  assert.equal(game.act('deposit', { item: 'wood', quantity: 17 }), true);
  game.state.supports.push(1); assert.equal(game.act('travel', 1), true);
  assert.equal(game.act('withdraw', { item: 'wood', quantity: 17 }), false);
  assert.equal(game.state.checkpoint.biome, 1);
  assert.equal(game.act('travel', 0), true);
  assert.equal(game.act('withdraw', { item: 'wood', quantity: 17 }), true);
  assert.equal(game.state.inventory.wood, 100);
});

test('morte perde recursos comuns, preserva missão/equipamento e retorna ao apoio visitado', () => {
  const game = start(); stock(game); game.act('craft', 'sword');
  at(game, game.world.ingredient); game.interact();
  const ingredient = game.world.ingredient.id, equipment = structuredClone(game.state.player.equipment);
  game.state.inventory.wood = 20; game.state.player.hp = 0; game.update(.1, {});
  assert.equal(game.state.inventory.wood, 16);
  assert.equal(game.state.inventory[ingredient], 1); assert.ok(game.state.ingredients.includes(ingredient));
  assert.deepEqual(game.state.player.equipment, equipment);
  assert.equal(game.state.player.x, game.state.checkpoint.x); assert.ok(game.state.memoryEvents.some(m => m.kind === 'death'));
});

test('coleta e save/load preservam recursos consumidos e não duplicam ingrediente', () => {
  const game = start(); const resource = game.world.objects.find(o => o.resource && o.type === 'resource');
  at(game, resource); game.collect(resource);
  at(game, game.world.ingredient); game.interact(); const ingredient = game.world.ingredient.id;
  const restored = new GameEngine(); assert.equal(restored.load(game.serialize()), true);
  assert.equal(restored.world.objects.find(o => o.id === resource.id).depleted, true);
  at(restored, restored.world.ingredient); restored.interact(); assert.equal(restored.state.inventory[ingredient], 1);
  restored.state.supports.push(1); restored.state.elapsed += 181; at(restored, restored.world.support); restored.act('travel', 1); restored.act('travel', 0);
  assert.equal(restored.world.objects.find(o => o.id === resource.id).depleted, undefined);
  assert.equal(restored.state.inventory[ingredient], 1);
});

test('dia dura treze minutos e o sono só fica crítico após três ciclos e meio', () => {
  const game = start(); assert.equal(DAY_LENGTH, 780);
  // A mesma atualização de survival usada no jogo, sem inimigos no lugar seguro.
  at(game, game.world.support); game.spawnEnemy = () => {};
  const time = game.state.worldTime;
  for (let i = 0; i < 27300; i++) { game.update(.1, {}); game.state.player.hunger = 100; game.state.player.thirst = 100; }
  assert.ok(Math.abs(game.state.worldTime - time - 2730) < .0001);
  assert.ok(Math.abs(game.state.player.sleep - 20) < .01);
  assert.equal(game.state.deathCount, 0);
  frames(game, 30); assert.ok(game.sleepPressure > 0);
});

test('o primeiro chefe pode ficar pendente; o Limite exige os dezoito e nove ingredientes', () => {
  const game = start(); game.state.defeated.push(1); at(game, game.world.exit);
  assert.equal(game.advance(), true); assert.equal(game.state.biome, 1); assert.equal(game.state.defeated.includes(0), false);
  game.enterWorld(8); game.state.defeated = [17]; assert.equal(game.advance(), false);
  game.state.defeated = Array.from({ length: 18 }, (_, i) => i); assert.equal(game.advance(), false);
  game.state.ingredients = BIOMES.slice(0, 9).map(b => b.ingredient); assert.equal(game.advance(), true); assert.equal(game.state.biome, 9);
});

test('todos os vinte chefes possuem padrões legíveis que disparam na simulação', () => {
  const patterns = new Set();
  for (const data of BOSSES) {
    const game = start(); game.enterWorld(data.biome); if (data.id === 19) game.state.defeated.push(18);
    const b = boss(game, data.id % 2); b.cooldown = 0; game.state.player.invulnerable = 100;
    game.update(.1, {}); assert.ok(b.telegraph > 0); patterns.add(b.pattern);
    frames(game, 1.3); assert.ok(b.attackTimer > 0 || b.chargeTimer > 0 || b.cooldown > 0);
    assert.ok(Number.isFinite(b.hp));
  }
  assert.ok(patterns.size >= 6);
});

test('campanha integra nove ingredientes, vinte vitórias, derretimento e fechamento jogável', () => {
  const game = start(); stock(game); game.act('craft', 'sword');
  for (let biome = 0; biome < 9; biome++) {
    assert.equal(game.state.biome, biome);
    at(game, game.world.ingredient); assert.equal(game.interact(), true);
    for (let i = 0; i < 2; i++) { const b = boss(game, i); game.hit(b, b.maxHp + 1); assert.equal(game.state.boss, null); }
    assert.equal(game.advance(), true);
  }
  assert.equal(game.state.ingredients.length, 9); assert.equal(game.state.defeated.length, 18);
  at(game, game.world.support); assert.equal(game.act('craft', 'acid'), true);
  assert.equal(game.state.ingredients.length, 9);
  assert.ok(game.state.ingredients.every(id => game.state.inventory[id] === 0));
  const b19 = boss(game, 0); game.hit(b19, b19.maxHp + 1);
  const b20 = boss(game, 1); game.hit(b20, b20.maxHp * 2);
  assert.ok(b20.hp > 0); assert.equal(game.state.electricUnlocked, false);
  assert.equal(game.applyAcid(), true); assert.equal(b20.acidApplied, true);
  game.state.player.invulnerable = 100;
  frames(game, 4); assert.equal(game.state.phase, 'rift'); assert.equal(game.state.defeated.length, 20);
  assert.equal(game.state.electricUnlocked, true);
  const saved = game.serialize(), resume = new GameEngine(); assert.equal(resume.load(saved), true);
  for (const node of resume.riftPositions()) { at(resume, node); assert.equal(resume.electricPulse(), true); }
  assert.equal(resume.state.riftClosed, true); assert.equal(resume.state.phase, 'ending');
  assert.ok(resume.drainEvents().some(e => e.id === 'riftComplete'));
  resume.act('dialogueEnd', 'riftComplete'); assert.ok(resume.drainEvents().some(e => e.type === 'ending'));
  const acidReplay = resume.state.memoryEvents.find(m => m.kind === 'acid');
  assert.equal(acidReplay.snapshot.boss.id, 19); assert.equal(acidReplay.snapshot.boss.acidApplied, true);
  assert.equal(acidReplay.snapshot.riftClosed, false); assert.equal(acidReplay.snapshot.electricUnlocked, false);
  const electricReplay = resume.state.memoryEvents.find(m => m.kind === 'electric');
  assert.equal(electricReplay.snapshot.electricUnlocked, true); assert.equal(electricReplay.snapshot.riftClosed, false);
  assert.equal(resume.state.memoryEvents.find(m => m.kind === 'rift').snapshot.riftClosed, true);
  assert.ok(Number.isFinite(acidReplay.snapshot.elapsed));
  assert.equal(resume.state.memoryEvents.filter(m => m.kind === 'boss').length, 20);
  resume.act('finish'); const elapsed = resume.state.elapsed; resume.update(.1, {}); assert.equal(resume.state.elapsed, elapsed);
});

test('save válido retoma upgrades, mundo e missão; entrada inválida não substitui jogo atual', () => {
  const game = start(); stock(game); at(game, game.world.support); game.act('craft', 'sword'); game.act('upgrade', 'health');
  const copy = game.serialize(), restored = new GameEngine(); assert.equal(restored.load(copy), true);
  assert.equal(restored.state.player.maxHp, 125); assert.ok(restored.state.player.equipment.sword);
  const existing = restored.state;
  assert.equal(restored.load({ ...copy, biome: 10 }), false); assert.equal(restored.state, existing);
  assert.equal(restored.load({ ...copy, checkpoint: { biome: 12, x: 10, y: 10 } }), false); assert.equal(restored.state, existing);
  assert.equal(restored.load({ ...copy, inventory: { wood: -1 } }), false); assert.equal(restored.state, existing);
});

test('ácido continua derretendo o chefe após fuga, morte e recarregamento sem exigir ingredientes repetidos', () => {
  const game = start(); game.enterWorld(9); game.state.defeated = Array.from({ length: 19 }, (_, i) => i);
  game.state.inventory.acid = 1; const b = boss(game, 1); game.hit(b, b.maxHp * 2);
  assert.equal(game.applyAcid(), true); game.state.player.invulnerable = 100; frames(game, .5);
  const progress = game.state.acidProgress;
  at(game, game.world.support); game.update(.1, {}); assert.equal(game.state.boss, null);
  const revived = boss(game, 1); assert.equal(revived.acidApplied, true); assert.ok(revived.meltTimer >= progress);
  game.state.player.hp = 0; game.update(.1, {}); assert.equal(game.state.inventory.acid, 0);
  const resumed = new GameEngine(); assert.equal(resumed.load(game.serialize()), true);
  // O checkpoint pode ser de região anterior; voltar ao Limite mantém o efeito de missão.
  resumed.enterWorld(9); const final = boss(resumed, 1); assert.equal(final.acidApplied, true);
  resumed.state.player.invulnerable = 100; frames(resumed, 4);
  assert.ok(resumed.state.defeated.includes(19)); assert.equal(resumed.state.phase, 'rift');
});

test('replays de campanha completa cabem com o backup na quota usual de armazenamento', () => {
  const game = start();
  // Caso pior: dez regiões inteiras descobertas e muitos eventos reais gravados.
  for (let biome = 0; biome < 10; biome++) {
    game.state.discoveries[biome] = Array.from({ length: 96 * 72 }, (_, i) => `${i % 96},${Math.floor(i / 96)}`);
  }
  for (let i = 0; i < 80; i++) {
    const x = 200 + i, y = 590;
    at(game, { x, y }); game.record(i % 2 ? 'craft' : 'survival');
  }
  const serialized = game.serialize();
  const bytes = Buffer.byteLength(JSON.stringify(serialized), 'utf8');
  assert.ok(bytes * 2 < 3 * 1024 * 1024, `Salvamento e backup usam ${bytes * 2} bytes`);
  assert.equal(serialized.memoryEvents[79].snapshot.player.x, 279);
  const loaded = new GameEngine(); assert.equal(loaded.load(serialized), true);
  assert.equal(loaded.state.memoryEvents.length, 80);
  assert.equal(loaded.state.memoryEvents[79].snapshot.player.y, 590);
});

test('muita fabricação mantém as vinte batalhas, o ácido e a fenda disponíveis para a revelação', () => {
  const game = start();
  for (let i = 0; i < 200; i++) game.record('craft', { recipeId: 'food' });
  for (let bossId = 0; bossId < 20; bossId++) game.record('boss', { bossId });
  game.record('acid', { bossId: 19 }); game.record('electric'); game.record('rift');
  for (let i = 0; i < 350; i++) game.record(i % 2 ? 'craft' : 'survival');
  assert.equal(game.state.memoryEvents.length, 300);
  assert.equal(game.state.memoryEvents.filter(event => event.kind === 'boss').length, 20);
  for (const kind of ['acid', 'electric', 'rift']) assert.ok(game.state.memoryEvents.some(event => event.kind === kind && event.snapshot));
  const loaded = new GameEngine(); assert.equal(loaded.load(game.serialize()), true);
  assert.equal(loaded.state.memoryEvents.filter(event => event.kind === 'boss').length, 20);
  assert.ok(loaded.state.memoryEvents.some(event => event.kind === 'rift'));
});
