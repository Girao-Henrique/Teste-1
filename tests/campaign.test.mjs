import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GameEngine } from '../src/game/engine.js';
import { BIOMES, BOSSES, DIALOGUES, REVELATION } from '../src/data/content.js';
import { buildWorld, isWalkable, TILE } from '../src/world/world.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Assistência somente de deslocamento: nenhuma vitória injeta dano, vida ou recursos.
// A conectividade é verificada separadamente; o combate usa os comandos públicos.
function position(game, point) {
  assert.ok(isWalkable(game.world, point.x, point.y), `Posição acessível em ${BIOMES[game.state.biome].name}: ${JSON.stringify(point)}`);
  game.state.player.x = point.x;
  game.state.player.y = point.y;
}

function reachable(world, blocked = () => false) {
  const seen = new Set();
  const queue = [];
  const sx = Math.floor(world.spawn.x / TILE), sy = Math.floor(world.spawn.y / TILE);
  const center = (x, y) => ({ x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 });
  assert.ok(isWalkable(world, center(sx, sy).x, center(sx, sy).y));
  queue.push(center(sx, sy));
  seen.add(`${sx},${sy}`);
  for (let head = 0; head < queue.length; head++) {
    const point = queue[head], x = Math.floor(point.x / TILE), y = Math.floor(point.y / TILE);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = center(x + dx, y + dy), key = `${x + dx},${y + dy}`;
      if (seen.has(key) || blocked(next) || !isWalkable(world, next.x, next.y)) continue;
      if (!isWalkable(world, (point.x + next.x) / 2, (point.y + next.y) / 2)) continue;
      seen.add(key); queue.push(next);
    }
  }
  return queue;
}

function start(difficulty) {
  const game = new GameEngine();
  assert.equal(game.start(difficulty), true);
  assert.deepEqual(game.drainEvents(), [{ type: 'dialogue', id: 'opening' }]);
  game.act('dialogueEnd', 'opening');
  assert.ok(game.drainEvents().some(e => e.type === 'dialogue' && e.id === 'guide'));
  game.act('dialogueEnd', 'guide');
  return game;
}

function support(game) {
  position(game, game.world.support);
  assert.equal(game.act('interact'), true);
  assert.equal(game.state.checkpoint.biome, game.state.biome);
}

function gather(game) {
  // Visita recursos reais do mapa. Deslocar o jogador poupa a caminhada no teste,
  // enquanto a interação mantém prioridade, coleta, durabilidade e persistência reais.
  let collected = 0;
  for (const resource of game.world.objects.filter(o => o.type === 'resource')) {
    for (const [dx, dy] of [[0, 0], [0, 22], [22, 0], [-22, 0], [0, -22]]) {
      if (resource.depleted) break;
      const point = { x: resource.x + dx, y: resource.y + dy };
      if (!isWalkable(game.world, point.x, point.y)) continue;
      if (distance(point, game.world.support) < 64) continue;
      if (game.world.npcs.some(n => distance(point, n) < 48)) continue;
      if (game.world.secrets.some(n => !n.collected && distance(point, n) < 40)) continue;
      if (game.world.ingredient && !game.world.ingredient.collected && distance(point, game.world.ingredient) < 42) continue;
      position(game, point);
      game.act('interact');
    }
    if (resource.depleted) collected++;
  }
  assert.ok(collected > 20, 'A região oferece recursos efetivamente coletáveis.');
  support(game);
}

function prepare(game) {
  support(game);
  for (const id of ['axe_tool', 'pickaxe', 'sword', 'spear', 'bow']) {
    if (!game.state.player.equipment[id]) assert.equal(game.act('craft', id), true, `Receita ${id} com recursos coletados`);
  }
  assert.equal(game.act('equip', 'spear'), true);
  while ((game.state.inventory.herb || 0) >= 3 && (game.state.inventory.water || 0) >= 1) assert.equal(game.act('craft', 'heal'), true);
  while (game.state.player.equipment.spear.upgrade < 3 && game.act('upgrade', 'spear')) {}
  for (const attribute of ['health', 'stamina', 'regen']) {
    if (game.state.upgrades[attribute] < 2) game.act('upgrade', attribute);
  }
  if (game.state.player.equipment.spear.durability < game.state.player.equipment.spear.maxDurability) assert.equal(game.act('repair', 'spear'), true);
  assert.equal(game.act('sleep'), true);
  game.act('eat'); game.act('drink');
  game.drainEvents();
}

function fight(game, id, { saveAfterAcid = false } = {}) {
  const marker = game.world.bosses.find(b => b.id === id);
  assert.ok(marker);
  position(game, { x: marker.x - 70, y: marker.y });
  game.update(.05, {});
  assert.equal(game.state.boss?.id, id, `Aproximar-se inicia o chefe ${id + 1}.`);
  const initialDurability = game.state.player.equipment.spear.durability;
  const deaths = game.state.deathCount;
  let telegraphs = 0, dodges = 0, previousTelegraph = false, resumed = false, attacks = 0;
  for (let frame = 0; frame < 2400 && !game.state.defeated.includes(id); frame++) {
    const b = game.state.boss, p = game.state.player;
    assert.ok(b, `O chefe ${id + 1} não deve desaparecer durante o confronto.`);
    if (b.telegraph > 0 && !previousTelegraph) telegraphs++;
    previousTelegraph = b.telegraph > 0;
    if (p.hp < p.maxHp - 45) game.act('heal');
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.max(1, Math.hypot(dx, dy));
    const targetDistance = b.telegraph > 0 && b.pattern === 'slam' ? 145 : 65;
    const radial = clamp((d - targetDistance) / 25, -1, 1);
    let moveX = -dy / d * .65 - dx / d * radial;
    let moveY = dx / d * .65 - dy / d * radial;
    const dodge = b.telegraph > 0 && b.telegraph < .22 && p.dodgeCooldown <= 0 && p.stamina > 40;
    if (dodge && ['charge', 'beam', 'fan'].includes(b.pattern)) {
      moveX = -Math.sin(b.angle); moveY = Math.cos(b.angle);
    }
    if (dodge) dodges++;
    if (p.attackCooldown <= .05 && p.stamina >= 12) attacks++;
    game.update(.05, { moveX, moveY, aimX: b.x, aimY: b.y, attack: true, dodge });
    if (id === 19 && game.state.boss && !game.state.boss.acidApplied && game.state.boss.hp <= game.state.boss.maxHp * .33) {
      assert.equal(game.state.electricUnlocked, false);
      assert.equal(game.act('acid'), true, 'A mistura dos nove ingredientes deve funcionar na fase final.');
      assert.equal(game.state.inventory.acid, 0);
      if (saveAfterAcid) {
        const saved = JSON.parse(JSON.stringify(game.serialize()));
        const restored = new GameEngine();
        assert.equal(restored.load(saved), true);
        restored.update(.05, {});
        assert.equal(restored.state.boss?.id, 19);
        assert.equal(restored.state.boss.acidApplied, true, 'Recarregar não pode ressuscitar a carapaça após consumir a poção única.');
        game = restored; resumed = true;
      }
    }
  }
  assert.ok(game.state.defeated.includes(id), `Chefe ${id + 1} deve ser vencido pelos ataques simulados.`);
  assert.ok(attacks > 0);
  assert.ok(game.state.player.equipment.spear.durability < initialDurability, 'O combate desgasta a arma usada.');
  assert.equal(game.state.deathCount, deaths, `A simulação deve sobreviver ao chefe ${id + 1}.`);
  return { game, telegraphs, dodges, resumed };
}

test('dez mapas semiabertos conectam regiões, recursos e todos os pontos importantes', () => {
  assert.equal(BIOMES.length, 10);
  assert.equal(BOSSES.length, 20);
  for (const biome of BIOMES) {
    const world = buildWorld(biome.id), open = reachable(world);
    assert.ok(open.length > world.width * world.height * .45, `${biome.name} deve permitir explorar uma região ampla.`);
    const points = [
      ['suporte', world.support, 40], ['saída', world.exit, 64],
      ...world.bosses.map(b => [`arena ${b.id + 1}`, b, 60]),
      ...world.npcs.map(n => [n.id, n, 45]), ...world.secrets.map(s => [s.id, s, 35]),
      ...world.objects.filter(o => o.resource).map(o => [`recurso ${o.id}`, o, 35]),
      ...world.riftNodes.map((n, i) => [`foco ${i + 1}`, n, 70]),
      ...(world.rift ? [['fenda', world.rift, 70]] : []),
      ...(world.ingredient ? [['ingrediente', world.ingredient, 35]] : []),
      ...world.objects.filter(o => o.variant === 'cave').map(o => ['interior da gruta', o, 20]),
    ];
    for (const [name, point, radius] of points) assert.ok(open.some(p => distance(p, point) < radius), `${biome.name}: ${name} precisa de uma rota utilizável.`);
    const withoutOptionalArena = reachable(world, p => distance(p, world.bosses[0]) < 155);
    assert.ok(withoutOptionalArena.some(p => distance(p, world.exit) < 64), 'O primeiro chefe pode ficar pendente sem transformar o mapa em corredor linear.');
    assert.equal(world.bosses.length, 2);
    assert.deepEqual(world.bosses.map(b => b.id), biome.bosses);
    assert.equal(world.ingredient?.id ?? null, biome.ingredient);
  }
});

test('um invasor dinâmico pode ser derrotado com combate e concede recursos, sem quota obrigatória', () => {
  const game = start('normal');
  gather(game);
  assert.equal(game.act('craft', 'spear'), true);
  position(game, { x: 500, y: 576 });
  for (let frame = 0; frame < 200 && !game.state.enemies.length; frame++) game.update(.05, {});
  assert.ok(game.state.enemies.length > 0, 'O mapa deve criar invasores fora da área protegida.');
  const enemy = game.state.enemies[0], initialEssence = game.state.inventory.essence || 0;
  assert.ok(distance(enemy, game.state.player) > 100, 'Um invasor não surge diretamente sobre o jogador.');
  const point = [-50, 50].map(dx => ({ x: enemy.x + dx, y: enemy.y })).find(p => isWalkable(game.world, p.x, p.y) && game.world.bosses.every(b => distance(b, p) > 160));
  assert.ok(point);
  position(game, point);
  for (let frame = 0; frame < 400 && game.state.enemies.includes(enemy); frame++) {
    const p = game.state.player, dx = p.x - enemy.x, dy = p.y - enemy.y, d = Math.max(1, Math.hypot(dx, dy));
    const radial = clamp((d - 45) / 25, -1, 1);
    game.update(.05, { moveX: -dy / d * .4 - dx / d * radial, moveY: dx / d * .4 - dy / d * radial,
      aimX: enemy.x, aimY: enemy.y, attack: true, dodge: enemy.telegraph > 0 && enemy.telegraph < .15 });
  }
  assert.equal(game.state.enemies.includes(enemy), false);
  assert.ok(game.state.inventory.essence > initialEssence);
  assert.equal(game.state.tutorial.combat, true);
  assert.equal(game.state.deathCount, 0);
  assert.equal(game.state.defeated.length, 0, 'Invasores comuns não são chefes de progressão.');
});

test('desgaste real quebra a arma sem apagá-la; save retoma o estado e o reparo restaura seu uso', () => {
  const game = start('normal');
  gather(game);
  assert.equal(game.act('craft', 'sword'), true);
  const wood = game.state.inventory.wood;
  assert.equal(game.act('deposit', { item: 'wood', quantity: 3 }), true);
  const weapon = game.state.player.equipment.sword;
  for (let frame = 0; frame < 10000 && weapon.durability > 0; frame++) game.update(.05, { attack: true });
  assert.equal(weapon.durability, 0, 'Ataques reais devem gastar toda a durabilidade.');
  assert.equal(game.state.inventory.sword, 1, 'Equipamento quebrado permanece no inventário.');
  assert.equal(game.act('equip', 'sword'), false);
  const restored = new GameEngine();
  assert.equal(restored.load(JSON.parse(JSON.stringify(game.serialize()))), true);
  assert.equal(restored.state.player.equipment.sword.durability, 0);
  assert.equal(restored.state.storage['support-0'].wood, 3);
  assert.equal(restored.state.inventory.wood, wood - 3);
  assert.equal(restored.act('attackStrong'), false);
  assert.equal(restored.act('repair', 'sword'), true);
  assert.equal(restored.state.player.equipment.sword.durability, restored.state.player.equipment.sword.maxDurability);
  assert.equal(restored.act('equip', 'sword'), true);
  assert.equal(restored.act('withdraw', { item: 'wood', quantity: 3 }), true);
  for (let frame = 0; frame < 20; frame++) restored.update(.05, {});
  assert.equal(restored.act('attackStrong'), true);
  assert.ok(restored.state.player.equipment.sword.durability < restored.state.player.equipment.sword.maxDurability);
});

for (const difficulty of ['normal', 'easy']) {
  test(`campanha completa em ${difficulty}: coleta, preparo, vinte combates e encerramento real`, () => {
    let game = start(difficulty);
    let telegraphs = 0, dodges = 0;
    const beforeAcid = structuredClone(game.state.inventory);
    assert.equal(game.act('craft', 'acid'), false);
    assert.deepEqual(game.state.inventory, beforeAcid);
    assert.ok(!game.state.pointsOfInterest[0].includes(`${game.world.exit.x},${game.world.exit.y}`), 'A saída não aparece descoberta no começo.');

    // Deixa o primeiro chefe e o ingrediente dos Jardins para voltar depois.
    gather(game); prepare(game);
    let result = fight(game, 1); game = result.game; telegraphs += result.telegraphs; dodges += result.dodges;
    assert.equal(game.state.defeated.includes(0), false);
    position(game, game.world.exit); assert.equal(game.act('interact'), true); assert.equal(game.state.biome, 1);
    support(game);
    const wood = game.state.inventory.wood;
    assert.ok(wood >= 4);
    assert.equal(game.act('deposit', { item: 'wood', quantity: 4 }), true);
    assert.equal(game.act('travel', 0), true);
    assert.equal(game.act('withdraw', { item: 'wood', quantity: 4 }), false, 'O baú do Bosque não aparece nos Jardins.');
    assert.equal(game.act('travel', 1), true);
    assert.equal(game.act('withdraw', { item: 'wood', quantity: 4 }), true);
    assert.equal(game.state.inventory.wood, wood);

    for (let biome = 1; biome < 9; biome++) {
      assert.equal(game.state.biome, biome);
      gather(game); prepare(game);
      position(game, game.world.ingredient); assert.equal(game.act('interact'), true);
      for (const marker of game.world.bosses) {
        result = fight(game, marker.id); game = result.game; telegraphs += result.telegraphs; dodges += result.dodges;
      }
      position(game, game.world.exit);
      if (biome < 8) assert.equal(game.act('interact'), true);
    }
    assert.equal(game.state.defeated.length, 17);
    assert.equal(game.state.ingredients.length, 8);
    assert.equal(game.act('interact'), false, 'O décimo bioma precisa aguardar as pendências.');
    assert.equal(game.state.biome, 8);
    support(game); assert.equal(game.act('travel', 0), true);
    prepare(game); result = fight(game, 0); game = result.game;
    position(game, game.world.ingredient); assert.equal(game.act('interact'), true);
    assert.equal(game.state.defeated.length, 18); assert.equal(game.state.ingredients.length, 9);
    support(game); assert.equal(game.act('travel', 8), true);
    position(game, game.world.exit); assert.equal(game.act('interact'), true); assert.equal(game.state.biome, 9);
    gather(game); prepare(game);
    assert.equal(game.act('craft', 'acid'), true);
    assert.ok(game.state.ingredients.every(id => game.state.inventory[id] === 0), 'Os ingredientes são consumidos, preservando o registro da coleta.');
    result = fight(game, 18); game = result.game; telegraphs += result.telegraphs; dodges += result.dodges;
    result = fight(game, 19, { saveAfterAcid: true }); game = result.game;
    assert.equal(result.resumed, true);
    assert.equal(game.state.defeated.length, 20);
    assert.equal(game.state.phase, 'rift'); assert.equal(game.state.electricUnlocked, true);
    assert.ok(telegraphs >= 10, 'A campanha precisa exercitar sinais dos padrões de combate.');
    assert.ok(dodges > 0, 'A defesa precisa exercitar esquivas reais.');
    assert.equal(game.act('electric'), false, 'O poder não fecha a fenda longe dos seus nós.');
    for (const node of game.riftPositions()) {
      position(game, node); game.update(.05, { electric: true });
    }
    assert.equal(game.state.riftClosed, true); assert.equal(game.state.phase, 'ending');
    const finalEvents = game.drainEvents();
    assert.ok(finalEvents.some(e => e.type === 'dialogue' && e.id === 'riftComplete'));
    game.act('dialogueEnd', 'riftComplete');
    assert.ok(game.drainEvents().some(e => e.type === 'ending'));
    const restored = new GameEngine(); assert.equal(restored.load(JSON.parse(JSON.stringify(game.serialize()))), true);
    assert.ok(restored.drainEvents().some(e => e.type === 'ending'), 'Retomar durante a revelação deve voltar à cena.');
    assert.equal(restored.state.memoryEvents.filter(m => m.kind === 'boss').length, 20);
    assert.ok(restored.state.memoryEvents.some(m => m.kind === 'acid' && m.snapshot.boss.id === 19));
    assert.ok(restored.state.memoryEvents.some(m => m.kind === 'rift'));
    assert.equal(REVELATION[0].speaker, 'Guia'); assert.match(REVELATION[0].text, /^Parabéns/);
    assert.ok(REVELATION.findIndex(r => r.visual === 'erase') < REVELATION.findLastIndex(r => r.visual === 'opening'));
    assert.deepEqual(REVELATION.at(-1), { speaker: 'Porteiro', text: DIALOGUES.opening[0].text, visual: 'opening' });
    assert.equal(REVELATION.at(-1).text, 'SEJA BEM-VINDO AO PARAÍSO!');
    if (difficulty === 'normal' && process.env.EXPORT_CAMPAIGN) {
      mkdirSync(new URL('./artifacts/', import.meta.url), { recursive: true });
      writeFileSync(new URL('./artifacts/campanha-final.json', import.meta.url), JSON.stringify(restored.serialize(), null, 2));
    }
    assert.equal(restored.act('finish'), true);
    const elapsed = restored.state.elapsed;
    restored.update(.1, { attack: true, electric: true, interact: true });
    assert.equal(restored.state.phase, 'finished'); assert.equal(restored.state.elapsed, elapsed);
  });
}
