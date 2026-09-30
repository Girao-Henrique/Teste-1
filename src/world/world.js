import { BIOMES } from '../data/content.js';

export const TILE = 16;
const WIDTH = 96;
const HEIGHT = 72;
const point = (x, y) => ({ x: x * TILE, y: y * TILE });

function random(seed) {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Every region is a handcrafted network of loops, generated with stable decoration. */
export function buildWorld(biome = 0) {
  biome = Math.max(0, Math.min(9, Number(biome) || 0));
  const rng = random(4187 + biome * 927);
  const tiles = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0));
  const objects = [];
  const reserved = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  const paint = (x, y, value) => {
    if (x > 0 && y > 0 && x < WIDTH - 1 && y < HEIGHT - 1) tiles[y][x] = value;
  };
  const disk = (cx, cy, radius, value, reserve = false) => {
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > radius ** 2) continue;
        paint(x, y, value);
        if (reserve && reserved[y]?.[x] !== undefined) reserved[y][x] = true;
      }
    }
  };
  const road = (points, width = 2) => {
    for (let i = 1; i < points.length; i++) {
      const [ax, ay] = points[i - 1], [bx, by] = points[i];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
      for (let step = 0; step <= steps; step++) {
        const x = Math.round(ax + (bx - ax) * step / Math.max(1, steps));
        const y = Math.round(ay + (by - ay) * step / Math.max(1, steps));
        for (let dy = -width; dy <= width; dy++) for (let dx = -width; dx <= width; dx++) {
          if (dx * dx + dy * dy > width * width + 1) continue;
          const xx = x + dx, yy = y + dy;
          if (xx <= 0 || yy <= 0 || xx >= WIDTH - 1 || yy >= HEIGHT - 1) continue;
          tiles[yy][xx] = tiles[yy][xx] === 2 ? 4 : 1;
          reserved[yy][xx] = true;
        }
      }
    }
  };

  // Waterways, pools and plateaux are placed before the actual traversable network.
  const riverWidth = biome === 3 ? 5 : biome === 7 ? 4 : 2;
  for (let y = 1; y < HEIGHT - 1; y++) {
    const center = Math.round(37 + Math.sin(y / 9 + biome * 0.45) * 4);
    for (let x = center - riverWidth; x <= center + riverWidth; x++) paint(x, y, 2);
  }
  disk(72, 16, biome === 3 ? 11 : 6, 2);
  disk(18, 55, 5, 2);
  if (biome === 3 || biome === 7) {
    disk(7, 11, 9, 2);
    disk(85, 62, 12, 2);
    disk(52, 42, 6, 2);
  }
  for (let y = 5; y < 12; y++) for (let x = 17; x < 34; x++) paint(x, y, 3);
  for (let y = 7; y < 11; y++) for (let x = 20; x < 31; x++) paint(x, y, 5);
  for (let y = 45; y < 53; y++) for (let x = 71; x < 81; x++) {
    if ((x - 75) ** 2 + (y - 47) ** 2 < 31) paint(x, y, 3);
  }
  if (biome === 4 || biome === 5 || biome === 7) {
    for (let y = 1; y < 9; y++) for (let x = 45; x < 89; x++) {
      if (y < 5 + Math.sin(x / 6) * 2) paint(x, y, 3);
    }
    for (let y = 64; y < 71; y++) for (let x = 44; x < 69; x++) paint(x, y, 3);
  }
  if (biome >= 8) {
    for (let y = 27; y < 45; y++) for (let x = 53; x < 94; x++) paint(x, y, 5);
    for (let y = 14; y < 21; y++) for (let x = 43; x < 55; x++) paint(x, y, 5);
  }

  road([[10, 36], [25, 36], [34, 36], [48, 36], [60, 36], [72, 36], [84, 36], [93, 36]]);
  road([[13, 36], [17, 26], [26, 16], [37, 16], [48, 16], [56, 25], [60, 36]]);
  road([[25, 36], [26, 46], [35, 57], [49, 59], [65, 59], [78, 55], [84, 43], [84, 36]]);
  road([[48, 16], [58, 15], [62, 23], [68, 29], [72, 36]], 1);
  road([[49, 59], [50, 46], [48, 36]], 1);
  road([[26, 16], [26, 10]], 1);
  road([[65, 59], [63, 65], [75, 65]], 1);
  road([[60, 36], [59, 43], [56, 48], [59, 54], [65, 59]], 1);
  if (biome === 9) road([[72, 36], [68, 25], [78, 17], [88, 24]], 2);
  disk(10, 36, 5, 1, true);
  disk(48, 16, 6, 5, true);
  disk(84, 36, 7, 5, true);
  disk(65, 59, 3, 1, true);
  disk(26, 16, 2, 1, true);
  disk(56, 48, 4, biome >= 8 ? 5 : 1, true);

  // A visible, narrow gate beyond the second arena communicates forward progress.
  for (let y = 25; y <= 47; y++) {
    if (y < 34 || y > 38) { paint(91, y, 3); paint(92, y, 3); }
  }
  for (let y = 0; y < HEIGHT; y++) tiles[y][0] = tiles[y][WIDTH - 1] = 3;
  for (let x = 0; x < WIDTH; x++) tiles[0][x] = tiles[HEIGHT - 1][x] = 3;

  const add = (type, x, y, extra = {}) => {
    const object = { id: `${biome}-${type}-${objects.length}`, type, x, y, ...extra };
    objects.push(object);
    return object;
  };
  const world = {
    biome, width: WIDTH, height: HEIGHT, tiles, objects,
    spawn: { x: 192, y: 610 }, support: { id: `support-${biome}`, x: 160, y: 576 },
    exit: { x: 1490, y: 576 },
    bosses: [{ id: biome * 2, ...point(48, 16) }, { id: biome * 2 + 1, ...point(84, 36) }],
    ingredient: biome < 9 ? { id: BIOMES[biome]?.ingredient, ...point(65, 59) } : null,
    npcs: biome === 0 ? [{ id: 'gatekeeper', x: 150, y: 630 }, { id: 'guide', x: 245, y: 574 }] : biome === 9 ? [{ id: 'guide', x: 1120, y: 650 }] : [],
    secrets: [{ id: `secret-${biome}`, x: 416, y: 256 }, { id: `vista-${biome}`, x: 1200, y: 1040 }],
    riftNodes: biome === 9 ? [{ x: 1080, y: 400 }, { x: 1240, y: 272 }, { x: 1408, y: 384 }] : [],
    rift: biome === 9 ? { x: 1264, y: 224 } : null,
    landmark: { id: `landmark-${biome}`, name: BIOMES[biome]?.landmark, ...point(56, 48) },
  };
  add('support', 160, 576, { variant: biome });
  add('ruin', 150, 640, { variant: 'gate', solid: false });
  add('ruin', 1488, 544, { variant: 'arch', solid: false });
  add('ruin', 416, 174, { variant: 'cave', solid: false });
  add('ruin', 1200, 1040, { variant: 'observatory', solid: false });
  add('ruin', 1040, 964, { variant: 'pedestal', solid: false });
  add('landmark', world.landmark.x, world.landmark.y, { variant: biome, solid: biome < 3, radius: biome < 2 ? 12 : 16 });
  for (const arena of world.bosses) {
    add('arena', arena.x, arena.y, { bossId: arena.id, radius: arena.id % 2 ? 108 : 92 });
    for (const direction of [-1, 1]) add('ruin', arena.x + direction * 97, arena.y - 72, { variant: biome >= 8 ? 'column' : 'marker', solid: false });
  }
  if (biome === 4 || biome === 5) add('waterfall', 608, 144, { height: 92 });
  if (biome >= 8) {
    for (let i = 0; i < 8; i++) add('ruin', 890 + i * 72, i % 2 ? 474 : 668, { variant: 'column', solid: false });
    add('ruin', 1000, 548, { variant: 'fountain', solid: false });
  }

  const treeCount = biome === 1 ? 155 : biome === 9 ? 38 : biome === 2 ? 60 : 105;
  for (let i = 0, attempts = 0; i < treeCount && attempts < treeCount * 14; attempts++) {
    const tx = 3 + Math.floor(rng() * (WIDTH - 6)), ty = 3 + Math.floor(rng() * (HEIGHT - 6));
    if (tiles[ty][tx] !== 0 || reserved[ty][tx]) continue;
    if (objects.some(o => o.type === 'tree' && Math.hypot(o.x - tx * TILE, o.y - ty * TILE) < 36)) continue;
    add('tree', tx * TILE + 8, ty * TILE + 8, {
      variant: biome === 3 ? 'palm' : biome === 1 ? (i % 3 ? 'broad' : 'ancient') : biome === 2 ? 'round' : biome === 4 ? 'pine' : biome >= 8 ? 'silver' : i % 5 === 0 ? 'round' : 'fruit',
      size: 0.9 + rng() * 0.25, solid: true, radius: 6, resource: 'wood', quantity: 3 + (i % 3), seed: i,
    });
    i++;
  }
  for (let i = 0; i < 430; i++) {
    const x = 32 + rng() * (WIDTH * TILE - 64), y = 32 + rng() * (HEIGHT * TILE - 64);
    if (tiles[Math.floor(y / TILE)][Math.floor(x / TILE)] !== 0) continue;
    add(i % 7 === 0 ? 'bush' : 'flower', x, y, { variant: i % 5, seed: i, stalk: biome === 2 });
  }
  for (let i = 0; i < 45; i++) {
    const x = 48 + rng() * (WIDTH * TILE - 96), y = 48 + rng() * (HEIGHT * TILE - 96);
    const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
    if (tiles[ty][tx] !== 0 || reserved[ty][tx]) continue;
    add(biome === 6 || biome === 7 ? 'crystal' : 'rock', x, y, { solid: true, radius: 7, seed: i, resource: biome === 6 ? 'crystal' : 'stone', quantity: 2 + i % 3 });
  }
  const resourceTypes = ['wood', 'stone', 'fiber', 'fruit', 'herb', 'water', 'ore', 'crystal'];
  // Resources also line the main trails, so basic survival never relies on random luck.
  for (let i = 0; i < 110; i++) {
    const x = i < 18 ? 225 + (i % 9) * 37 : 56 + rng() * (WIDTH * TILE - 112);
    const y = i < 18 ? 608 + Math.floor(i / 9) * 49 : 56 + rng() * (HEIGHT * TILE - 112);
    const resource = i < 18 ? resourceTypes[i % 6] : resourceTypes[Math.floor(rng() * resourceTypes.length)];
    if (!isWalkable(world, x, y, 9)) continue;
    add('resource', x, y, { resource, quantity: resource === 'water' ? 3 : 2 + (i % 3), seed: i });
  }
  // Distant islets may carry decorative palms, but never an unreachable pickup.
  // Flood the real player-sized collision space rather than only the tile centers.
  world._solidIndex = new Map();
  for (const o of objects) if (o.solid) {
    const key = `${Math.floor(o.x / 32)},${Math.floor(o.y / 32)}`;
    if (!world._solidIndex.has(key)) world._solidIndex.set(key, []);
    world._solidIndex.get(key).push(o);
  }
  const gridWidth = WIDTH * 2, gridHeight = HEIGHT * 2;
  const reachable = new Uint8Array(gridWidth * gridHeight);
  const startX = Math.round(world.spawn.x / 8), startY = Math.round(world.spawn.y / 8);
  const queue = [startY * gridWidth + startX]; reachable[queue[0]] = 1;
  for (let i = 0; i < queue.length; i++) {
    const n = queue[i], x = n % gridWidth, y = Math.floor(n / gridWidth);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx, ny = y + dy, index = ny * gridWidth + nx;
      if (nx < 0 || ny < 0 || nx >= gridWidth || ny >= gridHeight || reachable[index]) continue;
      if (!isWalkable(world, nx * 8, ny * 8, 6) || !isWalkable(world, (x + dx / 2) * 8, (y + dy / 2) * 8, 6)) continue;
      reachable[index] = 1; queue.push(index);
    }
  }
  for (const o of objects) {
    if (!o.resource) continue;
    let accessible = false;
    for (let gy = Math.floor(o.y / 8) - 4; gy <= Math.ceil(o.y / 8) + 4 && !accessible; gy++) {
      for (let gx = Math.floor(o.x / 8) - 4; gx <= Math.ceil(o.x / 8) + 4; gx++) {
        if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) continue;
        if (reachable[gy * gridWidth + gx] && Math.hypot(gx * 8 - o.x, gy * 8 - o.y) <= 30) { accessible = true; break; }
      }
    }
    if (!accessible) { delete o.resource; delete o.quantity; }
  }
  return world;
}

/** Collision matches the visible base of objects; canopies never block movement. */
export function isWalkable(world, x, y, radius = 6) {
  if (!world || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const probes = [[0, 0], [-radius, -radius], [radius, -radius], [-radius, radius], [radius, radius]];
  for (const [dx, dy] of probes) {
    const tile = world.tiles[Math.floor((y + dy) / TILE)]?.[Math.floor((x + dx) / TILE)];
    if (tile === undefined || tile === 2 || tile === 3) return false;
  }
  let solids = world.objects;
  if (world._solidIndex) {
    solids = [];
    const gx = Math.floor(x / 32), gy = Math.floor(y / 32);
    for (let yy = gy - 1; yy <= gy + 1; yy++) for (let xx = gx - 1; xx <= gx + 1; xx++) {
      const nearby = world._solidIndex.get(`${xx},${yy}`);
      if (nearby) solids.push(...nearby);
    }
  }
  for (const o of solids) {
    if (!o.solid || o.depleted || o.hidden) continue;
    if (Math.abs(x - o.x) > 32 || Math.abs(y - o.y) > 32) continue;
    if (Math.hypot(x - o.x, y - o.y) < radius + (o.radius || 6)) return false;
  }
  return true;
}
