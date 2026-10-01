import { BOSSES, WEAPONS } from '../data/content.js';

/*
 * Atelier de personagens de Paradise?. Todo o traço é autoral e rasterizado
 * em coordenadas inteiras. As poses usam os estados reais do combate; não há
 * rotação de bitmaps, filtros, sprites de bibliotecas ou suavização de bordas.
 */
const INK = '#294650', IVORY = '#fff1ce', GOLD = '#e9bd75';
const JADE = '#438f85', JADE_LIGHT = '#7ac3ad', LEATHER = '#946e51';
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const sides = [-1, 1];
const movement = new WeakMap();
const colorCache = new Map();

function mix(color, other, amount) {
  const key = `${color}:${other}:${amount}`;
  if (colorCache.has(key)) return colorCache.get(key);
  const parse = value => /^#[\da-f]{6}$/i.test(value || '') ? parseInt(value.slice(1), 16) : 0xd1ddb9;
  const a = parse(color), b = parse(other);
  const result = `#${[16, 8, 0].map(shift => Math.round(((a >> shift) & 255) * (1 - amount) + ((b >> shift) & 255) * amount).toString(16).padStart(2, '0')).join('')}`;
  if (colorCache.size > 350) colorCache.clear();
  colorCache.set(key, result);
  return result;
}
function rect(c, x, y, w, h, color) {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  x = Math.round(x); y = Math.round(y); rx = Math.max(1, Math.round(rx)); ry = Math.max(1, Math.round(ry));
  for (let row = -ry; row <= ry; row++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
    c.fillRect(x - span, y + row, span * 2 + 1, 1);
  }
}
function polygon(c, rawPoints, color) {
  const points = rawPoints.map(([x, y]) => [Math.round(x), Math.round(y)]);
  const top = Math.min(...points.map(p => p[1])), bottom = Math.max(...points.map(p => p[1]));
  c.fillStyle = color;
  for (let y = top; y <= bottom; y++) {
    const crossings = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) crossings.push(x1 + (y - y1) / (y2 - y1) * (x2 - x1));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const x = Math.ceil(crossings[i]), width = Math.floor(crossings[i + 1]) - x + 1;
      if (width > 0) c.fillRect(x, y, width, 1);
    }
  }
}
function line(c, x1, y1, x2, y2, color, width = 1) {
  x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
  const dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1, dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
  let error = dx + dy;
  c.fillStyle = color;
  for (let step = 0; step < 512; step++) {
    c.fillRect(x1 - (width >> 1), y1 - (width >> 1), width, width);
    if (x1 === x2 && y1 === y2) break;
    const twice = error * 2;
    if (twice >= dy) { error += dy; x1 += sx; }
    if (twice <= dx) { error += dx; y1 += sy; }
  }
}
function shape(c, points, color, border = INK) {
  polygon(c, points, color);
  if (!border) return;
  for (let i = 0; i < points.length; i++) line(c, ...points[i], ...points[(i + 1) % points.length], border);
}
function jewel(c, x, y, rx, ry, color, accent = IVORY, border = INK) {
  const points = [[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]];
  shape(c, points, color, border);
  polygon(c, [[x, y - ry + 2], [x - rx + 2, y], [x, y + ry - 2]], mix(color, accent, .45));
  polygon(c, [[x + 1, y - ry + 3], [x + rx - 2, y], [x + 1, y + ry - 2]], mix(color, INK, .25));
  line(c, x, y - ry + 2, x, y + ry - 2, accent);
  rect(c, x - 1, y - ry + 3, 2, 2, IVORY);
}
function orb(c, x, y, rx, ry, color, dark = mix(color, INK, .4), light = mix(color, IVORY, .35)) {
  ellipse(c, x, y, rx, ry, dark);
  ellipse(c, x - 1, y - 1, Math.max(1, rx - 1), Math.max(1, ry - 1), color);
  if (rx > 3 && ry > 3) ellipse(c, x - Math.round(rx * .25), y - Math.round(ry * .4), Math.max(1, rx * .5), Math.max(1, ry * .25), light);
}
function ring(c, x, y, rx, ry, color, time = 0, broken = false) {
  for (let i = 0; i < 64; i++) {
    if (broken && i % 16 > 8) continue;
    const a = i / 64 * Math.PI * 2 + time;
    rect(c, x + Math.cos(a) * rx, y + Math.sin(a) * ry, 2, 1, color);
  }
}
function glint(c, x, y, color = IVORY, size = 3) {
  line(c, x - size, y, x + size, y, color);
  line(c, x, y - size, x, y + size, color);
  rect(c, x - 1, y - 1, 3, 3, color);
}
function leaf(c, x, y, angle, length, width, color, highlight = IVORY) {
  const ux = Math.cos(angle), uy = Math.sin(angle), vx = -uy, vy = ux;
  const tip = [x + ux * length, y + uy * length], middle = [x + ux * length * .52, y + uy * length * .52];
  shape(c, [[x, y], [middle[0] + vx * width, middle[1] + vy * width], tip, [middle[0] - vx * width, middle[1] - vy * width]], color, mix(color, INK, .35));
  polygon(c, [[x + ux, y + uy], [middle[0] - vx * width * .7, middle[1] - vy * width * .7], tip], mix(color, highlight, .25));
  line(c, x, y, tip[0] - ux * 2, tip[1] - uy * 2, mix(color, highlight, .5));
}
function flower(c, x, y, color, radius = 3, center = GOLD) {
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    ellipse(c, x + Math.cos(a) * radius, y + Math.sin(a) * radius, radius * .7, radius * .7, color);
  }
  rect(c, x - 1, y - 1, 3, 3, center); rect(c, x - 1, y - 1, 1, 1, IVORY);
}
function eyes(c, x, y, gap, phase, scale = 1, iris = '#537f7e') {
  for (const side of sides) {
    const ex = x + side * gap;
    if (phase === 7) { line(c, ex - scale, y + 1, ex + scale, y + 1, INK); continue; }
    ellipse(c, ex, y, scale + 1, scale + 1, mix(iris, INK, .5));
    rect(c, ex - scale, y - scale, scale * 2, scale * 2, iris);
    rect(c, ex - 1, y - 1, 2, 2, INK); rect(c, ex - 1, y - 1, 1, 1, IVORY);
  }
}
function markSelection(c, x, y, radius, time) {
  ring(c, x, y + 1, radius, Math.max(6, radius * .33), IVORY, time * .3, true);
  for (const side of sides) {
    line(c, x + side * radius, y - 5, x + side * (radius + 4), y - 9, GOLD);
    rect(c, x + side * (radius + 4), y - 11, 2, 3, GOLD);
  }
}
function healthBar(c, x, y, width, hp, maxHp) {
  if (!(maxHp > 0)) return;
  rect(c, x - width / 2 - 1, y - 1, width + 2, 6, INK);
  rect(c, x - width / 2, y, width, 4, '#658378');
  const length = Math.round(width * clamp(hp / maxHp, 0, 1));
  if (length) { rect(c, x - width / 2, y, length, 3, GOLD); rect(c, x - width / 2, y, length, 1, IVORY); }
}
function entityMotion(entity, time) {
  const old = movement.get(entity);
  let speed = old?.speed || 0;
  if (old && time > old.time && time - old.time < .25) {
    const sampled = Math.hypot(entity.x - old.x, entity.y - old.y) / (time - old.time);
    speed = speed * .55 + sampled * .45;
  }
  movement.set(entity, { x: entity.x, y: entity.y, time, speed });
  return speed;
}

/** Viajante: casaco jade, gola creme, capa assimétrica e bússola de latão. */
export function drawPlayer(renderer, c, player, time = 0, state = {}) {
  const x = Math.round(player.x || 0), y = Math.round(player.y || 0);
  const facing = player.facing || { x: 0, y: 1 }, back = facing.y < -.55;
  const side = facing.x > .35 ? 1 : facing.x < -.35 ? -1 : 0;
  const sprint = entityMotion(player, time) > 125 || player.sprinting;
  const frame = Math.floor(time * (sprint ? 15 : 10)) % 8;
  const walk = player.moving ? [0, 1, 2, 1, 0, -1, -2, -1][frame] : 0;
  const idle = player.moving ? 0 : Math.round(Math.sin(time * 2) * .6);
  const dodge = player.dodgeTimer > 0, attack = player.attackTimer > 0;
  const charge = clamp((player.charge || 0) / 1.1, 0, 1);
  const blink = Math.floor(time * 4) % 23 === 22;
  const bob = player.moving && (frame === 2 || frame === 6) ? -1 : idle;
  ellipse(c, x + 1, y + 1, dodge ? 13 : 10, 4, '#365b625a');
  if (player.hp <= 0) {
    drawFallenPlayer(c, x, y);
    return;
  }
  if (dodge) {
    const dir = player.dodgeDirection || facing;
    for (let i = 3; i > 0; i--) {
      c.save(); c.globalAlpha *= .09 + (3 - i) * .04;
      shape(c, [[x - dir.x * i * 7 - 7, y - dir.y * i * 7 - 22], [x - dir.x * i * 7 + 6, y - dir.y * i * 7 - 27], [x - dir.x * i * 7 + 11, y - dir.y * i * 7 - 7], [x - dir.x * i * 7 - 8, y - dir.y * i * 7 - 5]], IVORY, null);
      c.restore();
    }
  }
  c.save(); c.translate(x, y + bob + (dodge ? 4 : 0));
  if (player.invulnerable > 0 && Math.floor(time * 16) % 2) c.globalAlpha *= .68;
  const lean = dodge ? side * 3 : charge ? -side : 0;
  c.translate(lean, 0);
  const flap = movingFlap(player.moving, sprint, frame, time);
  // A capa deixa os pés livres para manter legível o contato com o chão.
  shape(c, [[-7, -25], [5, -25], [9 + flap, -10], [5 + flap, -5], [-5, -9], [-10, -7], [-10 - flap, -15]], '#b9d6ba');
  polygon(c, [[-7, -24], [3, -24], [6 + flap, -11], [-3, -13], [-8, -9]], '#efe9c7');
  line(c, -8, -20, -8 - flap, -11, IVORY);
  line(c, 1, -21, 5 + flap, -8, '#8da999');
  const legStep = dodge ? 1 : walk;
  rect(c, -6 - side, -8 + legStep * .5, 5, 8, '#355e68');
  rect(c, 2 - side, -8 - legStep * .5, 5, 8, '#294b59');
  rect(c, -6 - side, -3 + legStep * .5, 5, 4, '#775842');
  rect(c, 2 - side, -3 - legStep * .5, 5, 4, '#674c3d');
  rect(c, -6 - side, -2 + legStep * .5, 4, 1, '#bc9971');
  rect(c, 2 - side, -2 - legStep * .5, 4, 1, '#ab8565');
  shape(c, [[-6, -22], [5, -23], [8, -17], [6, -7], [-6, -7], [-8, -17]], JADE);
  polygon(c, [[-5, -22], [0, -22], [0, -9], [-5, -9], [-7, -17]], JADE_LIGHT);
  polygon(c, [[4, -22], [7, -17], [5, -9], [2, -9], [3, -17]], '#32786f');
  rect(c, -5, -9, 11, 2, '#826345'); rect(c, -1, -9, 3, 2, GOLD); rect(c, 0, -9, 1, 1, IVORY);
  if (back) {
    shape(c, [[-6, -22], [5, -22], [7, -9], [-7, -9]], '#f0e5c2');
    line(c, -5, -12, 5, -12, '#bea87a');
    rect(c, -3, -19, 6, 6, JADE); jewel(c, 0, -16, 2, 2, GOLD);
    line(c, -7, -20, -3, -7, LEATHER);
    rect(c, -7, -9, 4, 4, LEATHER); rect(c, -6, -8, 2, 1, GOLD);
  } else {
    line(c, -5, -22, 6, -9, '#a17952', 2);
    rect(c, 5, -13, 5, 6, '#835e43'); rect(c, 6, -13, 3, 2, '#c5a075');
    rect(c, 7, -10, 1, 1, GOLD);
  }
  const armSwing = attack || charge ? 0 : walk;
  line(c, -7, -19, -8 - side, -12 + armSwing, '#306b68', 4);
  rect(c, -9 - side, -13 + armSwing, 4, 4, '#ecc39c');
  rect(c, -9 - side, -15 + armSwing, 4, 2, IVORY);
  // A mão armada percorre a trajetória real, inclusive nas diagonais.
  const weaponPose = weaponHand(player, facing);
  line(c, 6, -19, weaponPose.x, weaponPose.y, '#377d75', 4);
  rect(c, weaponPose.x - 2, weaponPose.y - 2, 4, 4, '#edc79f');
  if (player.weapon && back) drawWeapon(c, player, facing, weaponPose);
  shape(c, [[-6 + side, -31], [5 + side, -31], [7 + side, -26], [5 + side, -22], [-4 + side, -22], [-7 + side, -27]], '#edc69f');
  polygon(c, [[2 + side, -30], [5 + side, -30], [6 + side, -25], [3 + side, -23]], '#c99b80');
  rect(c, -5 + side, -30, 4, 2, '#ffddaf');
  if (back) {
    polygon(c, [[-7, -31], [-5, -34], [3, -34], [7, -30], [6, -24], [-5, -24]], '#65584c');
    rect(c, -4, -32, 5, 2, '#9d8363'); rect(c, -5, -26, 9, 2, '#514c47');
  } else {
    shape(c, [[-7 + side, -30], [-5 + side, -34], [0 + side, -35], [5 + side, -34], [8 + side, -30], [5 + side, -28], [0 + side, -31], [-3 + side, -29], [-5 + side, -25], [-7 + side, -26]], '#63574d');
    line(c, -3 + side, -33, 3 + side, -33, '#947b5f'); rect(c, 2 + side, -34, 3, 1, '#baa179');
    const shift = side * 2;
    rect(c, -3 + shift, -26, 2, blink ? 1 : 2, INK); rect(c, 2 + shift, -26, 2, blink ? 1 : 2, INK);
    if (!blink) { rect(c, -3 + shift, -26, 1, 1, '#5f8280'); rect(c, 2 + shift, -26, 1, 1, '#5f8280'); }
    rect(c, side === -1 ? -5 : side === 1 ? 5 : 0, -24, 1, 1, '#bb866a');
    rect(c, -1 + shift, -22, 3, 1, '#a87562');
  }
  // Gola e ponta longa são a assinatura que se mantém em todas as direções.
  shape(c, [[-6, -24], [-1, -22], [6, -24], [7, -21], [0, -19], [-6, -21]], IVORY, '#afa78d');
  polygon(c, [[-5, -21], [-7 - flap, -17], [-9 - flap, -14], [-6 - flap, -12], [-2, -19]], '#ead9a6');
  line(c, -6 - flap, -15, -4, -20, '#fff5d8'); rect(c, -8 - flap, -13, 3, 1, '#927f62');
  jewel(c, 3, -21, 2, 2, GOLD, IVORY, '#94764d');
  if (player.weapon && !back) drawWeapon(c, player, facing, weaponPose);
  if (player.hurtTimer > 0) { rect(c, -4, -18, 3, 1, IVORY); rect(c, 2, -16, 2, 1, IVORY); }
  c.restore();
  if (charge > 0) {
    ring(c, x, y + 1, 14 + charge * 2, 6, charge >= .7 ? GOLD : '#b6dfca', time * 2, true);
    healthBar(c, x, y + 9, 19, charge, 1);
    if (charge >= .75) glint(c, x + facing.x * 16, y - 13 + facing.y * 16, IVORY, 2);
  }
  if (player.electric && Math.floor(time * 7) % 17 === 0) {
    line(c, x - 10, y - 18, x - 6, y - 22, '#c7f7df');
    line(c, x - 6, y - 22, x - 9, y - 26, IVORY);
  }
  if (player.electric && renderer?._electricFlashUntil > time) {
    const p = clamp(1 - (renderer._electricFlashUntil - time) / .65, 0, 1);
    ring(c, x, y - 12, 18 + p * 40, 9 + p * 19, '#daffed', time * 3, true);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 + time * .7, dx = Math.cos(a), dy = Math.sin(a);
      line(c, x + dx * 12, y - 12 + dy * 12, x + dx * 24 - dy * 4, y - 12 + dy * 24 + dx * 4, '#c1f9e9', 2);
      line(c, x + dx * 24 - dy * 4, y - 12 + dy * 24 + dx * 4, x + dx * 38, y - 12 + dy * 38, IVORY);
    }
  }
  drawAttack(c, player, x, y, facing);
}
function drawFallenPlayer(c, x, y) {
  // Também usado nos registros da campanha: queda serena, sem sangue ou gore.
  c.save(); c.translate(x, y - 3);
  shape(c, [[-11, -6], [5, -9], [12, -5], [10, 1], [-12, 1]], '#d8ddbe');
  polygon(c, [[-8, -5], [4, -7], [9, -4], [5, -1], [-8, 0]], IVORY);
  shape(c, [[-4, -7], [9, -6], [11, -2], [3, 1], [-4, -1]], JADE);
  line(c, -2, -5, 6, -5, JADE_LIGHT, 2);
  rect(c, 8, -5, 7, 3, '#345762'); rect(c, 8, -1, 7, 3, '#294b59');
  rect(c, 14, -5, 4, 3, LEATHER); rect(c, 14, -1, 4, 3, '#71503d');
  rect(c, 14, -5, 3, 1, '#c6a178'); rect(c, 14, -1, 3, 1, '#b88b66');
  orb(c, -9, -5, 6, 5, '#edc69f', INK, '#ffdcab');
  shape(c, [[-15, -7], [-12, -11], [-6, -10], [-3, -6], [-7, -7], [-13, -5]], '#63574d');
  line(c, -12, -9, -7, -9, '#947b5f'); line(c, -12, -4, -10, -4, INK);
  rect(c, -7, -2, 2, 1, '#b3876c');
  polygon(c, [[-3, -7], [0, -5], [0, 1], [-4, 0]], IVORY);
  rect(c, 1, -4, 6, 2, '#edc69f'); jewel(c, -1, -5, 2, 2, GOLD);
  c.restore();
}
function movingFlap(moving, sprint, frame, time) {
  return moving ? [0, 1, 2, 1, 0, -1, -2, -1][frame] * (sprint ? 1.5 : 1) : Math.round(Math.sin(time * 1.5));
}
function weaponHand(player, facing) {
  const charged = clamp((player.charge || 0) / 1.1, 0, 1);
  const attack = clamp(1 - (player.attackTimer || 0) / (player.strongAttack ? .35 : .23), 0, 1);
  const extend = player.attackTimer > 0 ? Math.sin(attack * Math.PI) * 4 : -charged * 2;
  return { x: facing.x < -.35 ? -7 + facing.x * extend : 8 + facing.x * extend, y: -13 + facing.y * extend - charged * 3 };
}
function drawWeapon(c, player, facing, hand) {
  const id = player.weapon, data = WEAPONS[id];
  if (!data) return;
  const timer = player.attackTimer || 0, strong = player.strongAttack;
  let angle = Math.atan2(facing.y, facing.x);
  const progress = clamp(1 - timer / (strong ? .35 : .23), 0, 1);
  if (timer > 0 && !data.ranged) angle += (progress - .5) * (id === 'spear' ? .08 : id === 'daggers' ? 2.5 : id === 'hammer' ? 2.1 : 1.8);
  else if (player.charge > 0 && !data.ranged) angle -= clamp(player.charge, 0, 1) * .5;
  const ux = Math.cos(angle), uy = Math.sin(angle), vx = -uy, vy = ux;
  const at = (d, v = 0) => [hand.x + ux * d + vx * v, hand.y + uy * d + vy * v];
  const segment = (a, b, color, width = 1) => line(c, ...a, ...b, color, width);
  const blade = (base, length, breadth, color) => {
    shape(c, [at(base, -breadth), at(base + length * .78, -breadth * .6), at(base + length), at(base + length * .78, breadth * .6), at(base, breadth)], color);
    segment(at(base + 1, -breadth * .4), at(base + length - 2), IVORY);
    segment(at(base + 2, breadth * .5), at(base + length * .7, breadth * .4), mix(color, INK, .4));
  };
  if (id === 'bow' || id === 'crossbow') {
    segment(at(0, -10), at(6, -6), '#715943', 3); segment(at(6, -6), at(8), '#715943', 3);
    segment(at(8), at(6, 6), '#715943', 3); segment(at(6, 6), at(0, 10), '#715943', 3);
    segment(at(1, -9), at(6, -5), '#dcba80'); segment(at(6, 5), at(1, 9), '#dcba80');
    const pull = -clamp(player.charge || 0, 0, 1) * 5;
    segment(at(0, -10), at(pull), IVORY); segment(at(pull), at(0, 10), IVORY);
    if (id === 'crossbow') {
      segment(at(-6), at(13), '#556c70', 4); segment(at(-4, -1), at(11, -1), '#c3b7df', 2);
      jewel(c, ...at(5), 3, 3, '#acb6d6', IVORY); segment(at(-5, 2), at(-8, 3), LEATHER, 3);
    } else if (player.charge || timer <= 0) {
      segment(at(pull - 3), at(12), '#cadac8');
      shape(c, [at(15), at(10, -2), at(10, 2)], '#daeedd');
    }
    return;
  }
  if (id === 'spear') {
    segment(at(-7), at(25), '#775c49', 3); segment(at(-5, -1), at(24, -1), '#d3b481');
    segment(at(22, -3), at(22, 3), GOLD, 2); blade(25, 9, 3, '#a4d1cf');
    segment(at(18), at(21), '#528a8c', 3); return;
  }
  segment(at(-3), at(id === 'hammer' ? 17 : id === 'axe' ? 18 : 5), '#725846', 3);
  segment(at(-2, -1), at(id === 'hammer' ? 16 : id === 'axe' ? 17 : 4, -1), '#caa378');
  if (id === 'hammer') {
    shape(c, [at(14, -8), at(21, -8), at(24, -5), at(24, 5), at(21, 8), at(14, 8)], '#a9bcad');
    polygon(c, [at(15, -7), at(21, -7), at(22, -4), at(16, -3)], '#edf0d5');
    segment(at(16, 6), at(22, 4), '#617e79'); segment(at(18, -6), at(18, 6), GOLD);
  } else if (id === 'axe') {
    shape(c, [at(11, -3), at(17, -9), at(25, -7), at(29, -2), at(25, 4), at(20, 7), at(16, 3)], '#b9d0bd');
    segment(at(24, -6), at(27, -2), IVORY, 2); segment(at(27, -2), at(24, 3), IVORY, 2);
    segment(at(15, -1), at(19, -1), GOLD, 3);
  } else {
    const length = id === 'daggers' ? 10 : 19;
    segment(at(4, -4), at(4, 4), GOLD, 2); blade(5, length, id === 'daggers' ? 2 : 2.5, data.color);
    if (id === 'daggers') {
      line(c, -8, -11, -8 + ux * 10 - vx * 4, -11 + uy * 10 - vy * 4, INK, 3);
      line(c, -8, -12, -8 + ux * 10 - vx * 4, -12 + uy * 10 - vy * 4, '#bde7b7', 2);
      rect(c, -9, -11, 3, 2, GOLD);
    }
  }
}
function drawAttack(c, player, x, y, facing) {
  const data = WEAPONS[player.weapon];
  if (!(player.attackTimer > 0) || !data || data.ranged) return;
  const strong = player.strongAttack, progress = clamp(1 - player.attackTimer / (strong ? .35 : .23), 0, 1);
  const radius = data.range * (strong ? 1.2 : 1), angle = Math.atan2(facing.y, facing.x);
  if (player.weapon === 'spear') {
    const end = radius * (.65 + progress * .35);
    line(c, x + facing.x * 14, y - 9 + facing.y * 14, x + facing.x * end, y - 9 + facing.y * end, '#c6eadb', strong ? 3 : 2);
    glint(c, x + facing.x * end, y - 9 + facing.y * end, IVORY, strong ? 3 : 2);
    return;
  }
  const spread = data.arc || 1.8;
  // Rastro curto: a arma e o alvo continuam visíveis no centro do combate.
  for (let i = 0; i < 16; i++) {
    const a = angle - spread / 2 + spread * (i / 16 + progress * .1), r = radius * (.87 + i % 3 * .025);
    rect(c, x + Math.cos(a) * r, y - 9 + Math.sin(a) * r, strong ? 3 : 2, strong ? 2 : 1, i < 11 ? '#cfebd7' : IVORY);
    if (strong && i % 3 === 0) rect(c, x + Math.cos(a) * (r - 5), y - 9 + Math.sin(a) * (r - 5), 2, 1, GOLD);
  }
  if (player.weapon === 'hammer') ring(c, x + facing.x * 28, y + facing.y * 28, 16 + progress * 12, 7 + progress * 5, GOLD, 0, true);
}

/** Duas silhuetas próprias: pelerine floral e manto cartográfico. */
export function drawNPC(renderer, c, npc, time = 0) {
  const x = Math.round(npc.x || 0), y = Math.round(npc.y || 0);
  const bob = Math.round(Math.sin(time * 1.65) * .7), blink = Math.floor(time * 3) % 17 === 16;
  const sway = Math.round(Math.sin(time * 1.4));
  ellipse(c, x + 1, y + 1, 13, 4, '#355d6055');
  c.save(); c.translate(x, y + bob);
  if (npc.id === 'gatekeeper') {
    shape(c, [[-7, -30], [7, -30], [13 + sway, -5], [8, 0], [-9, 0], [-14 + sway, -6]], '#b9c8b0');
    polygon(c, [[-6, -29], [5, -29], [10, -5], [5, -2], [-10, -4]], '#f1eacb');
    polygon(c, [[2, -28], [7, -29], [12, -7], [7, -4]], '#d0d7ba');
    line(c, -8, -21, -11, -5, IVORY); line(c, 6, -23, 10, -7, '#92aa98');
    rect(c, -4, -4, 4, 5, '#6e6c59'); rect(c, 3, -4, 4, 5, '#6e6c59');
    rect(c, -2, -26, 4, 22, '#b4a475'); line(c, -1, -24, -1, -6, GOLD);
    for (const side of sides) leaf(c, side * 4, -14, side < 0 ? -2.5 : -.7, 6, 2, '#80a790');
    shape(c, [[-8, -27], [8, -27], [10, -20], [4, -18], [0, -22], [-4, -18], [-11, -21]], '#55968b');
    line(c, -9, -22, -4, -20, GOLD); line(c, 4, -20, 9, -22, GOLD);
    jewel(c, 0, -23, 3, 3, GOLD);
    orb(c, 0, -34, 7, 8, '#e5c5a5', '#9d9b81', '#f7d9b1');
    shape(c, [[-7, -36], [-5, -42], [2, -43], [7, -40], [8, -33], [5, -33], [4, -38], [-4, -37], [-6, -32]], '#ebedda');
    rect(c, -5, -39, 7, 1, '#ffffff'); rect(c, 5, -35, 2, 4, '#c9d9c7');
    rect(c, -3, -33, 1, blink ? 1 : 2, INK); rect(c, 3, -33, 1, blink ? 1 : 2, INK);
    shape(c, [[-5, -29], [5, -29], [4, -24], [0, -21], [-4, -25]], '#f5f1d7', '#b9c5a5');
    rect(c, -2, -29, 4, 1, '#9e9274'); line(c, -1, -26, 1, -26, '#ffffff');
    line(c, -16, 0, -16 + sway, -43, '#786349', 3); line(c, -16, -2, -16 + sway, -42, '#d3b984');
    ring(c, -16 + sway, -46, 6, 5, GOLD);
    leaf(c, -16 + sway, -43, -2.2, 8, 2, JADE_LIGHT); leaf(c, -16 + sway, -43, -.9, 8, 2, JADE_LIGHT);
    flower(c, -16 + sway, -48, IVORY, 3, '#f1c788');
    line(c, -9, -19, -16, -21, '#e8c4a0', 3);
    glint(c, 0, -48, '#efe4b4', 2); ring(c, 0, -48, 10, 3, '#d7bd7b');
  } else {
    rect(c, -5, -7, 4, 8, '#465365'); rect(c, 3, -7, 4, 8, '#465365');
    rect(c, -6, -2, 5, 3, '#7d6a53'); rect(c, 3, -2, 5, 3, '#7d6a53');
    shape(c, [[-7, -29], [6, -29], [11 + sway, -7], [4, -2], [-12 + sway, -6]], '#366e75');
    polygon(c, [[-6, -28], [3, -27], [7, -10], [0, -5], [-9, -8]], '#8cc4af');
    polygon(c, [[5, -27], [10 + sway, -8], [5, -5], [0, -23]], '#569b91');
    line(c, -9, -10, 0, -6, GOLD); line(c, 0, -6, 5, -10, GOLD);
    shape(c, [[-7, -27], [7, -28], [9, -22], [-3, -17], [-8, -19]], '#e9e6c4');
    line(c, -6, -25, 4, -23, IVORY); jewel(c, 4, -24, 2, 3, GOLD);
    line(c, -6, -26, 9, -9, '#a98d60', 2);
    orb(c, 0, -35, 6, 7, '#dcb797', '#8e8b7d', '#f5d1a7');
    shape(c, [[-7, -37], [-5, -42], [3, -43], [7, -39], [8, -30], [5, -29], [4, -36], [-3, -38], [-5, -28], [-8, -30]], '#a6bcb7');
    line(c, -5, -37, -6, -31, '#d9e2c8', 2); line(c, 6, -37, 6, -31, '#d9e2c8');
    rect(c, -2, -34, 1, blink ? 1 : 2, INK); rect(c, 3, -34, 1, blink ? 1 : 2, INK);
    rect(c, -1, -30, 3, 1, '#aa7b64');
    line(c, -4, -40, 4, -40, GOLD); jewel(c, 0, -42, 2, 3, '#a9dfcc');
    // Livro aberto: lombada jade, páginas creme e marcador de latão.
    shape(c, [[8, -21], [15, -23], [19, -20], [19, -9], [15, -11], [8, -9]], '#536d63');
    polygon(c, [[9, -20], [14, -21], [14, -12], [9, -11]], IVORY);
    polygon(c, [[15, -21], [18, -19], [18, -11], [15, -13]], '#d9dcb9');
    line(c, 14, -21, 14, -12, '#ba9b67'); line(c, 10, -17, 12, -18, '#abb593'); line(c, 16, -17, 17, -16, '#93a58e');
    rect(c, 15, -11, 1, 5, GOLD); rect(c, 7, -13, 4, 3, '#e6c09c');
    orb(c, -8, -13, 3, 4, LEATHER); jewel(c, -8, -13, 2, 2, GOLD);
  }
  c.restore();
}

/** Famílias comuns: broto corredor, mariposa, casco-jardim e lince de plumas. */
export function drawEnemy(renderer, c, enemy, time = 0, state = {}) {
  const x = Math.round(enemy.x || 0), y = Math.round(enemy.y || 0);
  const selected = state.targetId != null && (state.targetId === enemy.entityId || state.targetId === enemy.id);
  const base = enemy.color || renderer?.palette?.accent || '#ddbd86';
  const color = enemy.hurtTimer > 0 && Math.floor(time * 20) % 2 ? IVORY : base;
  const dark = mix(color, INK, .46), light = mix(color, IVORY, .48), green = '#81b49c';
  const frame = Math.floor(time * 8 + (x % 11)) % 8, step = [0, 1, 2, 1, 0, -1, -2, -1][frame];
  const winding = enemy.telegraph > 0, attacking = enemy.attackTimer > 0;
  const pose = winding ? -3 : attacking ? 3 : 0;
  const lift = enemy.type === 'ranged' ? Math.round(Math.sin(frame * Math.PI / 4) * 2) : 0;
  if (selected) markSelection(c, x, y, enemy.type === 'heavy' ? 21 : 16, time);
  ellipse(c, x + 1, y + 1, enemy.type === 'heavy' ? 16 : 10, 4, '#365c6252');
  c.save(); c.translate(x, y + lift);
  switch (enemy.type) {
    case 'ranged': {
      const flap = winding ? -4 : attacking ? 5 : step * 2;
      for (const side of sides) {
        shape(c, [[side * 3, -20], [side * 16, -31 - flap], [side * 23, -23], [side * 19, -12], [side * 5, -8]], dark);
        polygon(c, [[side * 4, -21], [side * 16, -28 - flap], [side * 20, -22], [side * 16, -15], [side * 6, -10]], color);
        leaf(c, side * 5, -21, side < 0 ? -2.6 : -.55, 14, 3, light, IVORY);
        orb(c, side * 15, -21, 3, 4, '#79a899', dark, IVORY); rect(c, side * 15, -22, 1, 1, GOLD);
        shape(c, [[side * 3, -14], [side * 16, -9 + flap], [side * 13, -4], [side * 4, -7]], color, dark);
        line(c, side * 3, -27, side * 7, -33, GOLD); orb(c, side * 7, -33, 1, 2, light);
      }
      orb(c, 0, -16 + pose, 4, 9, '#55786c', INK, green);
      for (let i = 0; i < 3; i++) rect(c, -2, -19 + i * 4 + pose, 4, 1, GOLD);
      orb(c, 0, -25 + pose, 5, 5, light, dark, IVORY);
      eyes(c, 0, -25 + pose, 2, frame, 1, '#578f81');
      jewel(c, 0, -14 + pose, 2, 3, winding ? GOLD : '#cfdfb9');
      break;
    }
    case 'heavy': {
      for (const side of sides) {
        line(c, side * 10, -9, side * 14, -3 + side * step, dark, 5);
        orb(c, side * 14, -1 + side * step, 5, 3, color, dark, light);
        line(c, side * 9, -23, side * 15, -24 - side * step, green, 4);
      }
      orb(c, 0, -18 + pose, 18, 15, color, dark, light);
      shape(c, [[0, -31 + pose], [12, -25 + pose], [13, -15 + pose], [0, -7 + pose], [-13, -15 + pose], [-12, -25 + pose]], light, dark);
      line(c, 0, -30 + pose, 0, -9 + pose, dark);
      line(c, -12, -20 + pose, 12, -20 + pose, mix(color, INK, .3));
      for (const side of sides) leaf(c, side * 3, -27 + pose, side < 0 ? -2.15 : -1.1, 10, 3, green);
      flower(c, -7, -27 + pose, IVORY, 2); flower(c, 8, -24 + pose, '#eed19d', 2);
      orb(c, 0, -5 + pose, 8, 6, '#e6d5a5', dark, IVORY);
      eyes(c, 0, -6 + pose, 4, frame, 1, '#708c70');
      rect(c, -2, -1 + pose, 4, 1, '#a29370');
      break;
    }
    case 'elite': {
      for (let i = 0; i < 3; i++) leaf(c, 4 + i * 2, -14, -.65 + i * .25 + step * .05, 18, 3, i % 2 ? light : color);
      for (const side of sides) {
        rect(c, side * 5 - 2, -6 + side * step, 5, 7, dark); rect(c, side * 5 - 2, side * step - 1, 5, 2, GOLD);
        leaf(c, side * 5, -21, side < 0 ? -2.0 : -1.15, 15, 3, color);
        leaf(c, side * 6, -21, side < 0 ? -2.0 : -1.15, 10, 1.5, light);
      }
      orb(c, 0, -14 + pose, 11, 11, color, dark, light);
      orb(c, 0, -22 + pose, 9, 8, light, dark, IVORY);
      shape(c, [[-7, -22 + pose], [0, -18 + pose], [7, -22 + pose], [0, -12 + pose]], '#fff0cc', null);
      eyes(c, 0, -23 + pose, 5, frame, 1, '#749d98'); rect(c, -1, -17 + pose, 3, 2, INK);
      for (let i = -1; i <= 1; i++) leaf(c, i * 3, -28 + pose, -Math.PI / 2 + i * .35, 9, 2, GOLD);
      jewel(c, 0, -29 + pose, 2, 3, '#a1d7c4');
      break;
    }
    default: {
      // Um corredor de jardim: folhas nas orelhas e patas, sem armas humanas.
      leaf(c, 5, -10, -.25 + step * .08, 14, 3, green);
      for (const side of sides) {
        line(c, side * 4, -9, side * 5, -2 + side * step, dark, 4);
        rect(c, side * 5 - 2, -1 + side * step, 5, 2, light);
        leaf(c, side * 4, -21 + pose, side < 0 ? -2.0 : -1.15, 11, 3, green, '#e0e3b3');
      }
      orb(c, 0, -13 + pose, 9, 10, color, dark, light);
      ellipse(c, 0, -8 + pose, 5, 5, '#ece5bd');
      orb(c, 0, -21 + pose, 8, 7, color, dark, light);
      eyes(c, 0, -22 + pose, 4, frame, 1, '#6c9c84');
      ellipse(c, 0, -17 + pose, 3, 2, '#f6edc7'); rect(c, -1, -18 + pose, 2, 1, '#557269');
      line(c, -8, -13, -11, -8 - step, dark, 2); line(c, 8, -13, 11, -8 + step, dark, 2);
      rect(c, -12, -9 - step, 2, 2, light); rect(c, 10, -9 + step, 2, 2, light);
    }
  }
  if (winding) glint(c, 0, enemy.type === 'heavy' ? -42 : -37, GOLD, 2);
  c.restore();
  if (selected || enemy.hp < enemy.maxHp) healthBar(c, x, y - (enemy.type === 'heavy' ? 47 : 42), 22, enemy.hp, enemy.maxHp);
}

function palette(data, hurt = false) {
  const color = hurt ? '#f8ecc7' : data.color || '#bad5bd';
  return { color, dark: mix(color, INK, .4), deep: mix(color, INK, .68), light: mix(color, IVORY, .42), shine: mix(color, '#ffffff', .67), accent: data.accent || GOLD, cream: IVORY };
}
function foot(c, x, y, width, p, step = 0, hoof = true) {
  shape(c, [[x - width * .55, y - 10], [x + width * .45, y - 10], [x + width * .55, y + step], [x - width * .55, y + step]], p.dark, p.deep);
  rect(c, x - width * .4, y - 8, Math.max(2, width * .4), 7 + step, p.color);
  orb(c, x, y + step, width * .68, 2, hoof ? p.accent : p.light, p.deep, IVORY);
  if (width > 5) line(c, x, y - 1 + step, x, y + 2 + step, p.dark);
}
function feathers(c, x, y, direction, length, count, spread, p, bend = 0) {
  for (let i = 0; i < count; i++) {
    const a = direction + (i / Math.max(1, count - 1) - .5) * spread;
    leaf(c, x, y, a, length - Math.abs(i - (count - 1) / 2) * 3 + bend, Math.max(3, length * .13), i % 2 ? p.color : p.light, p.accent);
  }
}
function scallop(c, x, y, count, gap, p, size = 3) {
  for (let i = 0; i < count; i++) {
    ellipse(c, x + i * gap, y + i % 2, size, size, p.dark);
    ellipse(c, x + i * gap, y + i % 2 - 1, Math.max(1, size - 1), Math.max(1, size - 1), p.light);
  }
}

/** Os vinte guardiões partilham paleta e luz, nunca a silhueta. */
export function drawBoss(renderer, c, boss, time = 0, state = {}) {
  const data = BOSSES[boss.id] || boss, x = Math.round(boss.x || 0), y = Math.round(boss.y || 0);
  const selected = state.targetId != null && (state.targetId === boss.entityId || state.targetId === `boss-${boss.id}`);
  const floating = ['moth', 'ray', 'whale', 'phoenix', 'jellyfish', 'lotus', 'golem'].includes(data.shape);
  const phase = Math.floor(time * (data.shape === 'moth' ? 10 : 6) + (boss.id || 0) * .7) % 8;
  const wind = boss.telegraph > 0, strike = boss.attackTimer > 0 || boss.chargeTimer > 0;
  const pose = wind ? 1 : strike ? 2 : 0;
  const animation = [0, 1, 2, 1, 0, -1, -2, -1][phase];
  const bob = floating ? animation : wind ? 1 : 0;
  const hurt = boss.hurtTimer > 0 && Math.floor(time * 22) % 2;
  const p = palette(data, hurt);
  const shadow = data.shape === 'colossus' ? 45 : ['whale', 'ray', 'lotus', 'peacock'].includes(data.shape) ? 36 : 27;
  if (selected) markSelection(c, x, y, (boss.radius || 27) + 8, time);
  ellipse(c, x + 2, y + 2, shadow, floating ? 7 : 9, '#294d6056');
  c.save(); c.translate(x, y + bob);
  // Pequenas pós-imagens só durante a investida, sem esconder o chão marcado.
  if (boss.chargeTimer > 0) {
    const a = boss.angle || 0;
    for (let i = 1; i <= 3; i++) {
      c.save(); c.globalAlpha *= .1 - i * .02;
      ellipse(c, -Math.cos(a) * i * 7, -22 - Math.sin(a) * i * 7, 19, 16, p.accent);
      c.restore();
    }
  }
  const cache = renderer?.sprites;
  const melt = boss.acidApplied ? Math.min(5, Math.floor((boss.meltTimer || 0) / 2.4)) : -1;
  const key = `character-boss:${data.shape}:${data.color}:${data.accent}:${phase}:${pose}:${hurt ? 1 : 0}:${melt}`;
  let image = cache?.get(key);
  if (!image && typeof document !== 'undefined') {
    image = document.createElement('canvas'); image.width = 128; image.height = 112;
    const bc = image.getContext('2d'); bc.imageSmoothingEnabled = false;
    bc.translate(64, 88);
    paintBoss(bc, data.shape, p, phase, pose, melt);
    cache?.set(key, image);
  }
  if (image) c.drawImage(image, -64, -88);
  else paintBoss(c, data.shape, p, phase, pose, melt);
  if (wind) {
    glint(c, 0, -83, GOLD, phase % 2 ? 3 : 4);
    rect(c, -5, -82, 1, 1, IVORY); rect(c, 6, -84, 1, 1, IVORY);
  }
  c.restore();
  if (selected || boss.hp < boss.maxHp) healthBar(c, x, y - 91, 44, boss.hp, boss.maxHp);
}

function paintBoss(c, shapeName, p, frame, pose, melt) {
  const wave = [0, 1, 2, 1, 0, -1, -2, -1][frame];
  const wind = pose === 1, strike = pose === 2;
  const lift = wind ? -3 : strike ? 3 : 0;
  const wing = wind ? -6 : strike ? 7 : wave * 2;
  const head = wind ? 4 : strike ? 1 : 0;
  switch (shapeName) {
    case 'stag': {
      for (const x of [-18, 18]) foot(c, x, -6, 5, p, -Math.sign(x) * wave);
      orb(c, 0, -23, 25, 15, p.color, p.deep, p.light);
      ellipse(c, -4, -17, 17, 7, p.accent);
      for (const x of [-8, 8]) foot(c, x, -1, 6, p, Math.sign(x) * wave);
      leaf(c, 20, -27, -.55 + wave * .03, 12, 4, p.color, p.accent);
      shape(c, [[-9, -22], [-11, -43 + head], [-8, -49 + head], [8, -49 + head], [11, -39 + head], [8, -20]], p.color, p.deep);
      polygon(c, [[-7, -42 + head], [-2, -43 + head], [-3, -22], [-8, -23]], p.light);
      for (const side of sides) {
        const hornX = side * 7, hornY = -49 + head;
        line(c, hornX, hornY, side * 15, -67 + head, p.deep, 4);
        line(c, hornX, hornY, side * 15, -67 + head, p.accent, 2);
        line(c, side * 13, -60 + head, side * 29, -67 + head, p.accent, 2);
        line(c, side * 14, -64 + head, side * 8, -73 + head, p.accent, 2);
        line(c, side * 21, -64 + head, side * 23, -76 + head, p.accent, 2);
        leaf(c, side * 15, -67 + head, side < 0 ? -2.3 : -.9, 9, 3, p.color, p.accent);
        leaf(c, side * 25, -66 + head, side < 0 ? -2.8 : -.3, 9, 3, p.light, p.accent);
        leaf(c, side * 8, -43 + head, side < 0 ? -2.9 : -.25, 14, 4, p.color, p.accent);
      }
      orb(c, 0, -39 + head, 10, 11, p.color, p.deep, p.light);
      ellipse(c, 0, -32 + head, 6, 5, p.accent); rect(c, -2, -34 + head, 4, 2, p.deep);
      eyes(c, 0, -42 + head, 5, wind ? 0 : frame, 1, '#7b9e7f');
      for (const [x, y] of [[-19, -27], [-13, -22], [-16, -16], [16, -23], [20, -29]]) rect(c, x, y, 3, 2, p.accent);
      jewel(c, 0, -25, 3, 4, p.accent, IVORY, p.dark);
      break;
    }
    case 'tortoise': {
      for (const side of sides) {
        orb(c, side * 25, -30, 8, 5, p.color, p.deep, p.light);
        orb(c, side * 25, -4 + side * wave, 9, 5, p.color, p.deep, p.light);
        for (let i = 0; i < 3; i++) rect(c, side * 25 - 3 + i * 3, -1 + side * wave, 1, 2, p.accent);
      }
      orb(c, 0, -24 + lift, 32, 27, p.color, p.deep, p.light);
      ring(c, 0, -24 + lift, 28, 23, p.accent);
      shape(c, [[0, -48 + lift], [15, -40 + lift], [17, -23 + lift], [0, -13 + lift], [-17, -23 + lift], [-15, -40 + lift]], '#a6cfac', p.dark);
      line(c, 0, -48 + lift, 0, -15 + lift, p.light, 2);
      for (const side of sides) {
        line(c, side * 17, -24 + lift, side * 29, -20 + lift, p.dark);
        line(c, side * 15, -40 + lift, side * 23, -43 + lift, p.dark);
        line(c, side * 13, -39 + lift, side * 5, -29 + lift, p.light);
      }
      for (const [x, y, color] of [[-14, -34, '#f1d59e'], [14, -30, '#f2d2c0'], [0, -42, IVORY], [-19, -15, '#f1d59e'], [12, -12, '#f3dac0']]) {
        leaf(c, x, y + lift, -.9, 5, 2, '#638f7d'); flower(c, x, y - 3 + lift, color, 2);
      }
      orb(c, 0, -1 + (wind ? 4 : 0), wind ? 9 : 12, 8, p.color, p.deep, p.light);
      ellipse(c, 0, 3, 8, 4, p.accent); eyes(c, 0, -2 + (wind ? 3 : 0), 6, frame, 1, '#819675');
      rect(c, -2, 4, 4, 1, p.dark);
      break;
    }
    case 'moth': {
      const flare = wind ? -6 : strike ? 5 : wave * 2;
      for (const side of sides) {
        shape(c, [[side * 3, -34], [side * (34 + flare), -67], [side * (49 + flare), -48], [side * (44 + flare), -29], [side * 23, -17]], p.dark, p.deep);
        polygon(c, [[side * 6, -34], [side * (34 + flare), -62], [side * (44 + flare), -47], [side * (38 + flare), -31], [side * 23, -20]], p.color);
        leaf(c, side * 6, -33, side < 0 ? -2.45 : -.7, 38, 6, p.light, p.accent);
        orb(c, side * (29 + flare * .4), -43, 9, 11, p.accent, p.dark, IVORY);
        orb(c, side * (29 + flare * .4), -43, 4, 6, '#87aaa3', p.dark, '#c6e0c6');
        jewel(c, side * (29 + flare * .4), -43, 2, 3, p.accent, IVORY, p.dark);
        shape(c, [[side * 4, -25], [side * 39, -21 - flare], [side * 35, -5], [side * 22, 0], [side * 6, -9]], p.color, p.deep);
        leaf(c, side * 7, -22, side < 0 ? 2.9 : .25, 25, 6, p.light, p.accent);
        for (let i = 0; i < 3; i++) orb(c, side * (20 + i * 6), -9 - i * 3, 2, 3, p.accent, p.dark, IVORY);
        line(c, side * 3, -44, side * 10, -56 - wave, p.dark, 2); orb(c, side * 10, -56 - wave, 2, 2, p.accent);
      }
      orb(c, 0, -25, 6, 21, '#7b8970', p.deep, p.accent);
      for (let i = 0; i < 5; i++) rect(c, -3, -37 + i * 7, 6, 2, p.accent);
      orb(c, 0, -42, 8, 7, p.light, p.deep, IVORY);
      eyes(c, 0, -42, 4, frame, 1, '#91a37e');
      flower(c, 0, -28, p.accent, 3, '#e2ad6c');
      break;
    }
    case 'owl': {
      for (const side of sides) feathers(c, side * 10, -35, side < 0 ? 2.5 : .65, wind ? 24 : 32, 4, .65, p, wing);
      orb(c, 0, -23 + lift, 23, 26, p.color, p.deep, p.light);
      scallop(c, -13, -21 + lift, 4, 8, p, 4); scallop(c, -9, -13 + lift, 3, 9, p, 4);
      shape(c, [[-20, -38 + head], [-26, -57 + head], [-9, -47 + head], [9, -47 + head], [26, -57 + head], [20, -38 + head]], p.color, p.deep);
      for (const side of sides) {
        orb(c, side * 10, -35 + head, 11, 13, p.accent, p.deep, IVORY);
        ring(c, side * 10, -35 + head, 8, 10, p.dark);
        orb(c, side * 10, -35 + head, 5, 7, '#8cb1b1', p.dark, p.light);
      }
      eyes(c, 0, -36 + head, 10, frame, 2, wind ? '#d5c38a' : '#719597');
      shape(c, [[-4, -29 + head], [4, -29 + head], [0, -21 + head]], GOLD, p.dark);
      for (const side of sides) {
        foot(c, side * 9, -1, 6, p, 0);
        line(c, side * 9, 1, side * 15, 2, GOLD); line(c, side * 9, 1, side * 4, 3, GOLD);
        leaf(c, side * 10, -51 + head, side < 0 ? -2.6 : -.6, 11, 3, p.light, p.accent);
      }
      jewel(c, 0, -45 + head, 3, 4, p.accent);
      break;
    }
    case 'ram': {
      for (const x of [-17, 17]) foot(c, x, -3, 7, p, -Math.sign(x) * wave);
      for (let i = 0; i < 7; i++) {
        const x = -22 + i * 7, y = -22 + i % 2 * 3;
        orb(c, x, y, 9, 13, i % 2 ? p.color : p.light, p.dark, p.accent);
        ring(c, x - 2, y - 4, 3, 3, mix(p.color, p.accent, .5));
      }
      for (const x of [-7, 7]) foot(c, x, 0, 6, p, Math.sign(x) * wave);
      orb(c, 0, -35 + head, 11, 15, p.dark, p.deep, p.color);
      for (const side of sides) {
        orb(c, side * 17, -43 + head, 11, 14, p.dark, p.deep, p.color);
        orb(c, side * 17, -44 + head, 8, 10, p.accent, p.dark, IVORY);
        ellipse(c, side * 17, -43 + head, 4, 6, p.dark);
        ellipse(c, side * 17 + side, -45 + head, 2, 4, p.color);
        for (let i = 0; i < 4; i++) line(c, side * 18 - 6 + i * 4, -51 + head + i % 2, side * 18 - 6 + i * 4, -48 + head + i % 2, p.color);
      }
      orb(c, 0, -38 + head, 9, 12, p.color, p.deep, p.light);
      eyes(c, 0, -40 + head, 5, frame, 1, '#97845e');
      ellipse(c, 0, -30 + head, 6, 5, p.accent); rect(c, -2, -31 + head, 4, 2, p.dark);
      glint(c, 0, -51 + head, p.accent, 4);
      break;
    }
    case 'gryphon': {
      leaf(c, 16, -19, .35 + wave * .08, 22, 4, p.color, p.accent);
      flower(c, 36, -11 + wave, p.accent, 3);
      for (const x of [-16, 16]) foot(c, x, -1, 7, p, -Math.sign(x) * wave, false);
      orb(c, 0, -23, 23, 16, p.color, p.deep, p.light);
      for (const side of sides) {
        const a = side < 0 ? -2.3 : -.85;
        const blue = { ...p, color: p.accent, light: mix(p.accent, IVORY, .35) };
        feathers(c, side * 9, -31, a, wind ? 31 : 39, 5, .75, blue, wing);
        line(c, side * 14, -36, side * 29, -50 - wing * .5, IVORY, 2);
      }
      orb(c, 0, -36 + head, 12, 17, p.light, p.deep, IVORY);
      scallop(c, -8, -30 + head, 3, 8, { ...p, light: IVORY }, 3);
      orb(c, 0, -47 + head, 10, 11, p.light, p.deep, IVORY);
      eyes(c, 0, -48 + head, 5, frame, 1, '#728d8d');
      shape(c, [[-5, -43 + head], [6, -43 + head], [7, -36 + head], [0, -32 + head]], GOLD, p.deep);
      line(c, 2, -40 + head, 5, -37 + head, IVORY);
      feathers(c, 0, -54 + head, -1.6, 11, 3, .6, { ...p, color: p.accent });
      break;
    }
    case 'crab': {
      for (const side of sides) {
        for (let i = 0; i < 3; i++) {
          const kneeX = side * (29 + i * 5), kneeY = -13 + i * 7 + side * wave;
          line(c, side * 19, -20 + i * 5, kneeX, kneeY, p.deep, 4);
          line(c, kneeX, kneeY, side * (36 + i * 5), -1 + i * 2, p.color, 3);
          rect(c, kneeX - 1, kneeY - 2, 3, 2, p.light);
        }
        line(c, side * 19, -27, side * 34, -38 - lift, p.deep, 6);
        line(c, side * 21, -28, side * 35, -39 - lift, p.color, 3);
        const cy = -44 - lift + side * wave;
        orb(c, side * 40, cy, 12, 14, p.color, p.deep, p.light);
        shape(c, [[side * 32, cy - 12], [side * 41, cy - 18], [side * 42, cy - 6], [side * 35, cy + 3]], p.accent, p.deep);
        shape(c, [[side * 45, cy - 16], [side * 52, cy - 7], [side * 45, cy + 5], [side * 41, cy - 4]], p.light, p.deep);
        ring(c, side * 40, cy + 1, 7, 4, p.accent);
      }
      orb(c, 0, -23, 26, 17, p.color, p.deep, p.light);
      ellipse(c, -3, -28, 16, 7, p.light);
      scallop(c, -17, -12, 5, 8, { ...p, light: p.accent }, 2);
      for (const side of sides) {
        line(c, side * 9, -33, side * 11, -41, p.deep, 4);
        line(c, side * 9, -34, side * 11, -41, p.accent, 2);
        orb(c, side * 11, -42, 4, 4, p.accent, p.deep, IVORY);
        rect(c, side * 11 - 1, -43, 2, 3, p.deep); rect(c, side * 11 - 1, -43, 1, 1, IVORY);
      }
      orb(c, 0, -25, 6, 6, '#f8eacc', '#cfab9d', '#ffffff');
      ring(c, 0, -25, 8, 7, p.accent); rect(c, -4, -15, 8, 1, p.dark);
      break;
    }
    case 'ray': {
      line(c, 0, -5, 17, 13, p.deep, 3); line(c, 17, 13, 36, 16 + wave, p.color, 2);
      leaf(c, 29, 15 + wave, .1 + wave * .05, 11, 2, p.accent);
      shape(c, [[0, -52], [20, -38], [52, -27 + wing], [42, -13 + wing], [25, -5], [0, -9], [-25, -5], [-42, -13 + wing], [-52, -27 + wing], [-20, -38]], p.color, p.deep);
      polygon(c, [[0, -49], [18, -36], [46, -26 + wing], [29, -17], [0, -14], [-29, -17], [-46, -26 + wing], [-18, -36]], p.light);
      shape(c, [[0, -47], [12, -32], [9, -15], [0, -10], [-9, -15], [-12, -32]], p.color, p.dark);
      for (const side of sides) {
        line(c, side * 10, -31, side * 42, -23 + wing, p.accent, 2);
        for (let i = 0; i < 4; i++) orb(c, side * (17 + i * 6), -27 + i % 2 * 5, 2, 2, p.accent, p.dark, IVORY);
      }
      eyes(c, 0, -34, 7, frame, 1, '#5d97a0');
      jewel(c, 0, -25, 3, 5, p.accent, IVORY, p.dark);
      break;
    }
    case 'goat': {
      for (const x of [-17, 17]) foot(c, x, -4, 6, p, -Math.sign(x) * wave);
      orb(c, 0, -24, 23, 15, p.color, p.deep, p.light);
      leaf(c, 19, -26, -.7, 12, 3, p.light, p.accent);
      for (const x of [-7, 7]) foot(c, x, 0, 6, p, Math.sign(x) * wave);
      for (let i = 0; i < 3; i++) leaf(c, -10 + i * 9, -22, 1.5, 15, 3, i % 2 ? p.accent : p.light);
      orb(c, 0, -39 + head, 11, 17, p.light, p.deep, IVORY);
      for (const side of sides) {
        line(c, side * 6, -52 + head, side * 14, -71 + head, p.deep, 5);
        line(c, side * 14, -71 + head, side * 10, -78 + head, p.deep, 4);
        line(c, side * 6, -53 + head, side * 14, -71 + head, p.accent, 3);
        line(c, side * 14, -71 + head, side * 10, -77 + head, p.accent, 2);
        leaf(c, side * 8, -44 + head, side < 0 ? -2.8 : -.3, 14, 4, p.accent);
        ring(c, side * 17, 2, 7, 3, '#cfe9ee');
      }
      eyes(c, 0, -43 + head, 5, frame, 1, '#7e98ac');
      orb(c, 0, -31 + head, 6, 5, p.color, p.dark, p.light);
      leaf(c, 0, -28 + head, 1.6 + wave * .03, 13, 4, p.accent);
      jewel(c, 0, -48 + head, 2, 3, p.accent);
      break;
    }
    case 'serpent': {
      const cycle = frame * Math.PI / 4;
      for (let i = 10; i >= 0; i--) {
        const sx = Math.sin(i * .63 + cycle * .22) * i * 2.2, sy = -10 - i * 4;
        const rx = 15 - i * .85, ry = 9 - i * .35;
        orb(c, sx, sy, rx, ry, p.color, p.deep, p.light);
        leaf(c, sx, sy - ry + 1, -Math.PI / 2 + Math.sin(i) * .3, i > 7 ? 6 : 8, 2, p.accent);
        for (const side of sides) line(c, sx + side * rx * .4, sy - 1, sx + side * rx * .6, sy + 2, p.dark);
      }
      orb(c, 0, -11 + head, 16, 13, p.light, p.deep, IVORY);
      for (const side of sides) {
        leaf(c, side * 12, -17 + head, side < 0 ? -2.1 : -1.0, 17, 4, p.accent);
        leaf(c, side * 13, -13 + head, side < 0 ? -2.6 : -.55, 12, 3, p.color);
      }
      eyes(c, 0, -13 + head, 8, frame, 1, '#83a7b0');
      ellipse(c, 0, -4 + head, 11, 6, p.color); rect(c, -5, -5 + head, 1, 1, p.dark); rect(c, 5, -5 + head, 1, 1, p.dark);
      line(c, -5, 0 + head, 5, 0 + head, p.dark); jewel(c, 0, -23 + head, 3, 4, p.accent);
      break;
    }
    case 'fox': {
      for (let i = -1; i <= 1; i++) {
        const sway = i * wave * 2, tx = i * 23;
        shape(c, [[i * 4, -13], [tx - 15 + sway, -29], [tx - 9 + sway, -52], [tx + sway, -66], [tx + 12 + sway, -53], [tx + 15 + sway, -31]], p.color, p.deep);
        polygon(c, [[tx - 11 + sway, -40], [tx - 7 + sway, -53], [tx + sway, -61], [tx + 9 + sway, -51], [tx + 11 + sway, -43], [tx + 4 + sway, -38]], p.accent);
        line(c, tx + sway, -53, i * 5, -18, p.light);
      }
      for (const side of sides) foot(c, side * 10, -1, 5, p, side * wave, false);
      orb(c, 0, -17, 17, 15, p.color, p.deep, p.light);
      leaf(c, 0, -22, 1.6, 16, 7, p.accent);
      shape(c, [[-14, -24 + head], [-14, -45 + head], [-4, -34 + head], [4, -34 + head], [14, -45 + head], [14, -24 + head], [0, -11 + head]], p.color, p.deep);
      for (const side of sides) polygon(c, [[side * 11, -39 + head], [side * 10, -28 + head], [side * 5, -33 + head]], p.accent);
      polygon(c, [[-10, -23 + head], [0, -18 + head], [10, -23 + head], [0, -12 + head]], p.accent);
      eyes(c, 0, -25 + head, 7, frame, 1, '#9c89a7');
      rect(c, -2, -17 + head, 4, 2, p.deep); jewel(c, 0, -31 + head, 2, 3, p.accent);
      line(c, -8, -18 + head, -16, -17 + head, p.light); line(c, 8, -18 + head, 16, -17 + head, p.light);
      break;
    }
    case 'whale': {
      shape(c, [[23, -24], [43, -37 - wing], [55, -29 - wing], [46, -19], [56, -7 + wing], [44, -4 + wing], [26, -10]], p.color, p.deep);
      polygon(c, [[35, -24], [45, -32 - wing], [49, -29 - wing], [41, -18], [49, -8 + wing], [44, -7 + wing]], p.light);
      orb(c, -9, -25 + lift, 38, 23, p.color, p.deep, p.light);
      ellipse(c, -15, -13 + lift, 28, 10, p.accent);
      for (let i = 0; i < 4; i++) line(c, -30 + i * 8, -15 + lift, -29 + i * 8, -7 + lift, '#d5d4ae');
      leaf(c, -9, -24 + lift, .8 + wave * .07, 22, 6, p.light, p.accent);
      orb(c, -29, -25 + lift, 4, 4, '#6b9490', p.deep, p.accent);
      rect(c, -30, -26 + lift, 2, frame === 7 ? 1 : 3, p.deep); rect(c, -30, -26 + lift, 1, 1, IVORY);
      line(c, -42, -15 + lift, -22, -12 + lift, p.dark);
      for (let i = 0; i < 3; i++) orb(c, -9 + i * 9, -36 + lift, 2, 2, p.accent, p.dark, IVORY);
      const drop = frame % 4;
      for (let i = 0; i < 3; i++) {
        const dx = -12 + i * 7, dy = -52 - drop * 3 + i % 2 * 4;
        shape(c, [[dx, dy - 5], [dx + 2, dy], [dx, dy + 2], [dx - 2, dy]], p.accent, p.dark);
      }
      flower(c, -2, -42 + lift, IVORY, 3, p.accent);
      break;
    }
    case 'beetle': {
      for (const side of sides) for (let i = 0; i < 3; i++) {
        const sy = -34 + i * 13, knee = -39 + i * 17 + side * wave;
        line(c, side * 15, sy, side * 28, knee, p.deep, 4);
        line(c, side * 28, knee, side * 34, knee + 8, p.color, 3);
        jewel(c, side * 28, knee, 2, 3, p.accent, IVORY, p.dark);
      }
      orb(c, 0, -25, 23, 27, p.color, p.deep, p.light);
      const split = wind ? 5 : strike ? 2 : 0;
      for (const side of sides) {
        const centerX = side * (9 + split);
        jewel(c, centerX, -27, 13, 24, p.color, p.accent, p.deep);
        shape(c, [[centerX, -48], [centerX + side * 10, -31], [centerX, -16], [centerX - side * 7, -29]], p.light, null);
        jewel(c, centerX, -28, 5, 9, p.accent, IVORY, p.dark);
        line(c, centerX, -47, centerX, -35, IVORY);
      }
      orb(c, 0, -49 + head, 10, 8, p.dark, p.deep, p.color);
      eyes(c, 0, -50 + head, 5, frame, 1, '#99acc1');
      shape(c, [[-4, -53 + head], [-4, -68 + head], [5, -77 + head], [8, -73 + head], [2, -65 + head], [4, -53 + head]], p.accent, p.deep);
      line(c, -1, -54 + head, -1, -66 + head, IVORY);
      for (const side of sides) line(c, side * 8, -52 + head, side * 16, -59 + head, p.accent, 2);
      break;
    }
    case 'golem': {
      // Constelação de cristais: nenhuma cabeça ou anatomia humana.
      ring(c, 0, -28, 32, 25, p.dark, frame * .02, true);
      for (let i = 0; i < 3; i++) {
        const angle = -Math.PI / 2 + i * Math.PI * 2 / 3 + wave * .025;
        const orbit = wind ? 26 : strike ? 39 : 33;
        const sx = Math.cos(angle) * orbit, sy = -30 + Math.sin(angle) * orbit;
        jewel(c, sx, sy, 10, 14, i === 1 ? p.accent : p.color, IVORY, p.deep);
        line(c, sx * .5, -30 + (sy + 30) * .5, sx * .75, -30 + (sy + 30) * .75, p.accent);
      }
      jewel(c, 0, -31, 21, 28, p.color, p.accent, p.deep);
      jewel(c, -5, -33, 8, 18, p.light, IVORY, p.dark);
      jewel(c, 9, -24, 8, 14, p.accent, IVORY, p.dark);
      jewel(c, 0, -29, 6, 10, '#d6f7db', IVORY, p.dark);
      glint(c, 0, -30, IVORY, wind ? 5 : 3);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + frame * .04;
        jewel(c, Math.cos(a) * 23, -30 + Math.sin(a) * 19, 2, 3, p.accent, IVORY, p.dark);
      }
      break;
    }
    case 'phoenix': {
      for (let i = -2; i <= 2; i++) leaf(c, i * 4, -21, Math.PI / 2 - i * .16 + wave * .02, 40 - Math.abs(i) * 7, 5, i % 2 ? p.accent : p.color, IVORY);
      for (const side of sides) {
        const wingPalette = { ...p, light: p.accent };
        feathers(c, side * 7, -33, side < 0 ? -2.55 : -.6, wind ? 38 : 46, 6, .88, wingPalette, wing);
        leaf(c, side * 12, -31, side < 0 ? -2.3 : -.84, 32 + wing, 5, p.light, IVORY);
      }
      orb(c, 0, -30, 10, 19, p.light, p.deep, IVORY);
      scallop(c, -6, -26, 3, 6, { ...p, light: p.accent }, 3);
      orb(c, 0, -48 + head, 8, 10, p.color, p.deep, p.light);
      eyes(c, 0, -48 + head, 4, frame, 1, '#9d9b80');
      shape(c, [[-3, -42 + head], [4, -42 + head], [1, -34 + head]], GOLD, p.dark);
      for (let i = -1; i <= 1; i++) leaf(c, i * 2, -54 + head, -Math.PI / 2 + i * .35, 15 - Math.abs(i) * 4, 3, p.accent, IVORY);
      jewel(c, 0, -36, 2, 4, p.accent, IVORY, p.dark);
      break;
    }
    case 'jellyfish': {
      for (let i = -3; i <= 3; i++) {
        const sx = i * 7, sway = Math.sin(frame * Math.PI / 4 + i) * (wind ? 2 : 5);
        line(c, sx, -18, sx + sway, -2, p.dark, 4);
        line(c, sx, -18, sx + sway, -2, p.accent, 2);
        line(c, sx + sway, -2, sx - sway, 14 + Math.abs(i), p.color, 3);
        line(c, sx + sway, -2, sx - sway, 14 + Math.abs(i), p.light);
        jewel(c, sx - sway, 15 + Math.abs(i), 2, 3, p.accent, IVORY, p.dark);
      }
      orb(c, 0, -34 + lift, 30, 23, p.color, p.deep, p.light);
      polygon(c, [[-27, -27 + lift], [27, -27 + lift], [28, -18 + lift], [-28, -18 + lift]], p.color);
      for (let i = -2; i <= 2; i++) {
        orb(c, i * 11, -20 + lift, 6, 5, p.accent, p.dark, IVORY);
        leaf(c, i * 3, -49 + lift, 1.5 + i * .16, 21, 3, mix(p.color, p.light, .4), p.accent);
      }
      ring(c, 0, -23 + lift, 26, 6, p.accent);
      jewel(c, 0, -36 + lift, 5, 7, p.accent, IVORY, p.dark);
      flower(c, -6, -49 + lift, IVORY, 3, p.accent);
      break;
    }
    case 'lion': {
      line(c, 21, -17, 35, -7 + wave, p.deep, 4); line(c, 35, -7 + wave, 41, -19 + wave, p.color, 3);
      leaf(c, 41, -19 + wave, -.7, 11, 4, p.accent);
      for (const x of [-18, 18]) foot(c, x, -2, 8, p, -Math.sign(x) * wave, false);
      orb(c, 0, -21, 25, 15, p.color, p.deep, p.light);
      for (const x of [-9, 9]) foot(c, x, 1, 7, p, Math.sign(x) * wave, false);
      for (let i = 0; i < 14; i++) {
        const a = i * Math.PI * 2 / 14;
        leaf(c, Math.cos(a) * 7, -38 + Math.sin(a) * 8 + head, a, 22 + i % 2 * 3, 6, i % 2 ? p.accent : p.color, IVORY);
      }
      orb(c, 0, -38 + head, 15, 17, p.color, p.deep, p.light);
      eyes(c, 0, -41 + head, 8, frame, 1, '#9f946f');
      for (const side of sides) orb(c, side * 5, -30 + head, 6, 5, p.light, p.dark, p.accent);
      shape(c, [[-4, -35 + head], [4, -35 + head], [0, -31 + head]], p.deep, null);
      line(c, 0, -31 + head, 0, -27 + head, p.dark);
      for (const side of sides) line(c, side * 7, -30 + head, side * 14, -28 + head, p.accent);
      jewel(c, 0, -51 + head, 3, 4, p.accent);
      break;
    }
    case 'peacock': {
      const spread = wind ? .16 : strike ? .3 : .24;
      for (let i = -4; i <= 4; i++) {
        const a = -Math.PI / 2 + i * spread;
        const ex = Math.cos(a) * 52, ey = -10 + Math.sin(a) * (54 + wave);
        leaf(c, i, -13, a, 58 + wave, 9, p.color, p.accent);
        orb(c, ex, ey + 3, 7, 9, p.accent, p.deep, IVORY);
        orb(c, ex, ey + 3, 4, 6, '#5f9e9b', p.dark, '#a4d8ba');
        jewel(c, ex, ey + 3, 2, 3, p.accent, IVORY, p.dark);
        rect(c, ex - 1, ey, 2, 2, IVORY);
      }
      for (const side of sides) foot(c, side * 5, 1, 4, p, 0);
      orb(c, 0, -15, 12, 13, p.dark, p.deep, p.color);
      leaf(c, 0, -14, -Math.PI / 2, 33, 5, p.color, p.accent);
      orb(c, 0, -43 + head, 8, 9, p.light, p.deep, IVORY);
      eyes(c, 0, -44 + head, 4, frame, 1, '#649689');
      shape(c, [[-2, -39 + head], [4, -39 + head], [1, -34 + head]], GOLD, p.dark);
      for (let i = -1; i <= 1; i++) {
        line(c, 0, -50 + head, i * 7, -61 + head, p.accent);
        jewel(c, i * 7, -61 + head, 2, 3, p.accent, IVORY, p.dark);
      }
      scallop(c, -7, -16, 3, 7, { ...p, light: p.accent }, 2);
      break;
    }
    case 'colossus': {
      // Uma ilha-santuário quadrúpede: arcos entre patas, jardim sobre o dorso.
      for (const side of sides) for (let row = 0; row < 2; row++) {
        const sx = side * (row ? 32 : 24), sy = row ? -6 : -20;
        shape(c, [[sx - 8, sy - 13], [sx + 8, sy - 13], [sx + 10, sy + 7], [sx - 10, sy + 7]], p.color, p.deep);
        rect(c, sx - 5, sy - 12, 3, 16, p.light); rect(c, sx - 9, sy + 4, 18, 4, p.accent);
        line(c, sx + 4, sy - 9, sx + 5, sy, p.dark);
      }
      shape(c, [[-42, -27 + lift], [-35, -49 + lift], [-24, -59 + lift], [24, -59 + lift], [35, -49 + lift], [42, -27 + lift], [32, -16 + lift], [-32, -16 + lift]], p.color, p.deep);
      polygon(c, [[-36, -32 + lift], [-29, -49 + lift], [-19, -55 + lift], [19, -55 + lift], [31, -42 + lift], [34, -25 + lift], [-30, -25 + lift]], p.light);
      for (let i = -1; i <= 1; i++) {
        const ax = i * 20;
        rect(c, ax - 7, -32 + lift, 14, 15, p.dark); ellipse(c, ax, -33 + lift, 7, 8, p.dark);
        rect(c, ax - 4, -31 + lift, 8, 14, '#edf2d3'); ellipse(c, ax, -32 + lift, 4, 5, '#edf2d3');
        line(c, ax - 9, -25 + lift, ax - 9, -35 + lift, p.accent, 2);
      }
      rect(c, -34, -53 + lift, 68, 5, p.accent); line(c, -31, -54 + lift, 31, -54 + lift, IVORY);
      ellipse(c, 0, -58 + lift, 28, 8, '#83ad91');
      for (let i = -2; i <= 2; i++) {
        const tx = i * 10, ty = -63 + lift;
        rect(c, tx, ty - 5, 2, 10, '#597d6f');
        orb(c, tx, ty - 7, 5, 5, i % 2 ? '#a3c9a3' : '#c4d8a9', '#729b83', '#e3e7be');
        if (i % 2) flower(c, tx - 1, ty - 8, IVORY, 2);
      }
      orb(c, 0, -10 + head, 13, 8, p.color, p.deep, p.light);
      eyes(c, 0, -12 + head, 7, frame, 1, '#97ae96'); jewel(c, 0, -10 + head, 3, 4, p.accent);
      break;
    }
    case 'lotus': {
      const dissolved = melt >= 0, shrinking = dissolved ? 1 - melt * .055 : 1;
      const petals = dissolved ? 11 - melt : 12, cycle = frame * Math.PI / 4;
      for (const side of sides) leaf(c, 0, -4, side < 0 ? -2.85 : -.3, 36 * shrinking, 7, '#92b9a7', '#d7e2ba');
      for (let layer = 1; layer >= 0; layer--) {
        for (let i = 0; i < petals; i++) {
          const angle = i * Math.PI * 2 / petals + layer * .28 + Math.sin(cycle) * .035;
          const length = (layer ? 50 : 38) * shrinking + (wind ? -4 : strike ? 4 : wave);
          const radius = (layer ? 22 : 12) * shrinking;
          const sx = Math.cos(angle) * radius * .35, sy = -30 + Math.sin(angle) * radius * .25;
          const tip = [Math.cos(angle) * length, -30 + Math.sin(angle) * length * .76];
          const center = [Math.cos(angle) * length * .63, -30 + Math.sin(angle) * length * .47];
          const vx = -Math.sin(angle) * 9, vy = Math.cos(angle) * 8;
          shape(c, [[sx, sy], [center[0] + vx, center[1] + vy], tip, [center[0] - vx, center[1] - vy]], layer ? p.dark : p.color, p.deep);
          polygon(c, [[sx, sy], [center[0] - vx * .7, center[1] - vy * .7], tip], layer ? p.color : p.light);
          line(c, sx, sy, tip[0] * .91, -30 + (tip[1] + 30) * .9, layer ? p.light : p.accent);
          rect(c, tip[0] * .86, -30 + (tip[1] + 30) * .86, 2, 2, p.accent);
        }
      }
      orb(c, 0, -30, 17, 14, p.accent, p.dark, IVORY);
      ring(c, 0, -30, 12, 10, '#d5b97a');
      for (let i = 0; i < 7; i++) {
        const a = i * Math.PI * 2 / 7 + frame * .08;
        jewel(c, Math.cos(a) * 8, -30 + Math.sin(a) * 6, 1, 2, '#d6bb83', IVORY, '#bdab76');
      }
      glint(c, 0, -30, IVORY, wind ? 5 : 3);
      if (dissolved) for (let i = 0; i < 6; i++) {
        const dy = -17 + (frame * 3 + i * 5) % 30, dx = Math.sin(i * 2.3) * 28;
        shape(c, [[dx, dy - 3], [dx + 2, dy], [dx, dy + 3], [dx - 2, dy]], '#b0dfc2', '#78ad97');
      }
      break;
    }
    default:
      orb(c, 0, -23, 24, 24, p.color, p.deep, p.light);
      eyes(c, 0, -28, 8, frame, 1);
  }
}
