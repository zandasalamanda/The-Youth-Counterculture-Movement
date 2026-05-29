/* ============================================
   FREEDOM MARCH — Canvas Runner Game
   Part 1: Setup, constants, drawing
   ============================================ */

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');
const W = 760, H = 300;
const GROUND = 242;
const GRAVITY = 0.7;
const JUMP_V  = -14;

// Palette
const C = {
  sky:      '#1a0e00',
  skyFar:   '#2a1800',
  ground:   '#0e0900',
  gLine:    '#f5c842',
  bldDark:  '#1a0e00',
  bldMid:   '#221400',
  player:   '#f0eadc',
  sign:     '#f5c842',
  signPost: '#b8b09a',
  barrier:  '#1a3a6e',
  bStripe:  '#e8703a',
  gas:      'rgba(180,220,100,0.35)',
  peace:    '#2ec4b6',
  flower:   '#e8703a',
  marcher:  '#c2478c',
  spark:    '#f5c842',
  crowd:    '#4b3fa0',
};

// ---- State ----
let gs = {}; // game state object
let keys = {};
let raf  = null;
let buildings = [];

function resetState() {
  gs = {
    running:   false,
    dead:      false,
    dist:      0,
    crowd:     1,
    lives:     3,
    speed:     4.5,
    frame:     0,
    spawnT:    0,
    obstacles: [],
    collectibles: [],
    particles:  [],
    player: {
      x: 110, y: GROUND - 48,
      vy: 0, w: 24, h: 48,
      ducking: false,
      onGround: true,
      invincible: 0,
      runF: 0, runT: 0,
    },
    bgX1: 0, bgX2: 0,
  };
}

// ---- Background buildings (generated once) ----
function genBuildings() {
  buildings = [];
  let x = 0;
  while (x < W * 2) {
    const bw = 30 + Math.random() * 60;
    const bh = 40 + Math.random() * 100;
    buildings.push({ x, w: bw, h: bh, col: Math.random() > 0.5 ? C.bldMid : C.bldDark,
      windows: Math.floor(Math.random() * 6) });
    x += bw + 4 + Math.random() * 20;
  }
}

// ---- Draw helpers ----
function rect(x, y, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawBackground() {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, '#0e0700');
  sky.addColorStop(1, '#2a1800');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND);

  // Buildings (2 layers, different scroll speeds)
  const scroll1 = (gs.dist * 0.3) % (W * 2);
  const scroll2 = (gs.dist * 0.6) % (W * 2);

  buildings.forEach(b => {
    // far layer (slow)
    const fx = ((b.x - scroll1) % (W * 2) + W * 2) % (W * 2) - W * 0.5;
    rect(fx, GROUND - b.h * 0.55, b.w * 0.7, b.h * 0.55, '#181000');

    // near layer (fast)
    const nx = ((b.x - scroll2) % (W * 2) + W * 2) % (W * 2) - W * 0.5;
    rect(nx, GROUND - b.h * 0.85, b.w, b.h * 0.85, b.col);

    // simple windows
    ctx.fillStyle = 'rgba(245,200,66,0.18)';
    for (let r = 0; r < b.windows; r++) {
      ctx.fillRect(nx + 5, GROUND - b.h * 0.85 + 8 + r * 14, 6, 6);
      ctx.fillRect(nx + b.w - 14, GROUND - b.h * 0.85 + 8 + r * 14, 6, 6);
    }
  });

  // Ground
  rect(0, GROUND, W, H - GROUND, C.ground);
  // Gold ground line
  rect(0, GROUND, W, 3, C.gLine);
  // Ground texture lines
  ctx.fillStyle = 'rgba(245,200,66,0.08)';
  for (let lx = (-(gs.dist * 2) % 80 + 80) % 80; lx < W; lx += 80) {
    ctx.fillRect(lx, GROUND + 6, 40, 1);
  }

  // Stars
  ctx.fillStyle = 'rgba(245,200,66,0.5)';
  const starSeed = [7, 37, 71, 113, 157, 199, 239, 281, 317, 353, 389, 419];
  starSeed.forEach((s, i) => {
    const sx = (s * 53 + i * 97) % W;
    const sy = (s * 31 + i * 47) % (GROUND - 30);
    ctx.fillRect(sx, sy, 2, 2);
  });
}

function drawPlayer(p) {
  const x = p.x, y = p.y;
  const alpha = p.invincible > 0 && Math.floor(p.invincible / 4) % 2 === 0 ? 0.35 : 1;
  ctx.globalAlpha = alpha;

  // Duck adjustments
  const ph = p.ducking ? 30 : p.h;
  const py = p.ducking ? y + (p.h - 30) : y;

  // Body
  rect(x, py + (p.ducking ? 0 : 16), 24, p.ducking ? 20 : 26, C.player);

  if (!p.ducking) {
    // Head
    rect(x + 4, py, 16, 16, C.player);
    // Headband
    rect(x + 4, py + 5, 16, 3, C.flower);

    // Sign post
    rect(x + 20, py - 18, 3, 22, C.signPost);
    // Sign
    rect(x + 10, py - 22, 28, 16, C.sign);
    ctx.fillStyle = '#1a1208';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('PEACE', x + 11, py - 11);
    ctx.fillText(' NOW!', x + 11, py - 4);

    // Legs (animated)
    const leg = Math.floor(p.runF) % 2;
    if (p.onGround) {
      if (leg === 0) {
        rect(x + 4,  py + 42, 8, 6, C.signPost);
        rect(x + 14, py + 38, 8, 10, C.signPost);
      } else {
        rect(x + 4,  py + 38, 8, 10, C.signPost);
        rect(x + 14, py + 42, 8, 6, C.signPost);
      }
    } else {
      rect(x + 4,  py + 38, 8, 10, C.signPost);
      rect(x + 14, py + 38, 8, 10, C.signPost);
    }
  }

  ctx.globalAlpha = 1;
}

function drawObstacle(o) {
  if (o.type === 'barrier') {
    // Police barrier (blue/orange stripes)
    rect(o.x, o.y, o.w, o.h, C.barrier);
    // Diagonal stripes
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = C.bStripe;
      ctx.fillRect(o.x + i * 16, o.y, 8, o.h);
    }
    rect(o.x, o.y, o.w, 4, '#2c5282');
    rect(o.x, o.y + o.h - 4, o.w, 4, '#2c5282');
    // "POLICE" text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('POLICE', o.x + 4, o.y + o.h / 2 + 3);
  } else if (o.type === 'gas') {
    // Tear gas cloud (floating mid-air)
    ctx.fillStyle = C.gas;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = 'rgba(150,200,80,0.5)';
    ctx.fillRect(o.x + 6, o.y + 6, o.w - 12, o.h - 12);
    ctx.fillStyle = 'rgba(100,180,60,0.3)';
    ctx.font = '10px monospace';
    ctx.fillText('* GAS *', o.x + 4, o.y + o.h / 2 + 3);
  }
}

function drawCollectible(c) {
  if (c.type === 'peace') {
    // Peace sign (circle + lines drawn as rects)
    ctx.strokeStyle = C.peace;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x + 10, c.y + 10, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x + 10, c.y + 1);
    ctx.lineTo(c.x + 10, c.y + 19);
    ctx.moveTo(c.x + 10, c.y + 10);
    ctx.lineTo(c.x + 3,  c.y + 17);
    ctx.moveTo(c.x + 10, c.y + 10);
    ctx.lineTo(c.x + 17, c.y + 17);
    ctx.stroke();
  } else if (c.type === 'flower') {
    // Flower = small cross
    rect(c.x + 6,  c.y,      8, 20, C.flower);
    rect(c.x,      c.y + 6,  20, 8,  C.flower);
    rect(c.x + 7,  c.y + 7,  6, 6,  C.sign);
  } else if (c.type === 'marcher') {
    // Fellow marcher — small person shape
    rect(c.x + 6, c.y,      8,  8,  C.marcher);
    rect(c.x + 4, c.y + 8,  12, 14, C.marcher);
    rect(c.x + 4, c.y + 22, 5,  8,  C.marcher);
    rect(c.x + 11,c.y + 22, 5,  8,  C.marcher);
  }
}

function drawParticles() {
  gs.particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    rect(p.x, p.y, p.s, p.s, p.col);
  });
  ctx.globalAlpha = 1;
}

function drawCrowdBar() {
  // Small crowd indicator at bottom of canvas
  const barW = Math.min(W, gs.crowd * 2);
  rect(0, H - 8, barW, 8, 'rgba(75,63,160,0.6)');
  ctx.fillStyle = C.peace;
  ctx.font = '9px monospace';
  ctx.fillText('CROWD: ' + gs.crowd.toLocaleString(), 6, H - 1);
}

/* ============================================
   Part 2: Physics, Spawning, Collision
   ============================================ */

function updatePlayer(p) {
  // Gravity
  p.vy += GRAVITY;
  p.y  += p.vy;

  // Ground collision
  const groundY = GROUND - p.h;
  if (p.y >= groundY) {
    p.y = groundY;
    p.vy = 0;
    p.onGround = true;
  } else {
    p.onGround = false;
  }

  // Duck: shrink hitbox
  if (p.ducking) {
    p.h = 30;
    p.y = Math.max(p.y, GROUND - 30);
  } else {
    p.h = 48;
  }

  // Run animation
  if (p.onGround) { p.runT++; if (p.runT > 6) { p.runF++; p.runT = 0; } }

  // Invincible cooldown
  if (p.invincible > 0) p.invincible--;
}

function spawnObstacle() {
  const roll = Math.random();
  if (roll < 0.6) {
    // Police barrier — jump over
    gs.obstacles.push({ type: 'barrier', x: W + 20, y: GROUND - 44, w: 60, h: 44 });
  } else {
    // Tear gas — duck under
    gs.obstacles.push({ type: 'gas', x: W + 20, y: GROUND - 90, w: 70, h: 50 });
  }
}

function spawnCollectible() {
  const roll = Math.random();
  let type, val;
  if (roll < 0.6) {
    type = 'peace'; val = 1;
  } else if (roll < 0.85) {
    type = 'flower'; val = 3;
  } else {
    type = 'marcher'; val = 10;
  }
  const floatY = GROUND - 24 - Math.random() * 40;
  gs.collectibles.push({ type, val, x: W + 20, y: floatY, w: 20, h: 20 });
}

function spawnParticles(x, y, col, n) {
  for (let i = 0; i < n; i++) {
    gs.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: -Math.random() * 4 - 1,
      s: 4 + Math.random() * 4,
      col,
      life: 30, maxLife: 30,
    });
  }
}

function checkAABB(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateEntities() {
  const p = gs.player;

  // Move obstacles
  gs.obstacles.forEach(o => { o.x -= gs.speed; });
  gs.obstacles = gs.obstacles.filter(o => o.x + o.w > -20);

  // Move collectibles
  gs.collectibles.forEach(c => { c.x -= gs.speed; });
  gs.collectibles = gs.collectibles.filter(c => c.x + c.w > -20);

  // Move particles
  gs.particles.forEach(pt => {
    pt.x += pt.vx; pt.y += pt.vy; pt.vy += 0.2; pt.life--;
  });
  gs.particles = gs.particles.filter(pt => pt.life > 0);

  // Player hitbox (slightly inset)
  const ph = { x: p.x + 4, y: p.y + 4, w: p.w - 8, h: p.h - 4 };

  // Obstacle collisions
  if (p.invincible === 0) {
    gs.obstacles.forEach(o => {
      if (checkAABB(ph, o)) {
        gs.lives--;
        p.invincible = 80;
        spawnParticles(p.x + 12, p.y + 12, C.bStripe, 12);
        updateHUD();
        if (gs.lives <= 0) endGame(false);
      }
    });
  }

  // Collectible collisions
  gs.collectibles = gs.collectibles.filter(c => {
    if (checkAABB(ph, c)) {
      gs.crowd += c.val;
      spawnParticles(c.x + 10, c.y + 10, C.peace, 8);
      updateHUD();
      return false;
    }
    return true;
  });

  // Spawn timer
  gs.spawnT++;
  const interval = Math.max(55, 100 - gs.dist * 0.02);
  if (gs.spawnT >= interval) {
    gs.spawnT = 0;
    if (Math.random() < 0.55) spawnObstacle();
    else spawnCollectible();
    // Always occasionally spawn a collectible alongside obstacle
    if (Math.random() < 0.3) spawnCollectible();
  }

  // Speed up over time
  gs.speed = Math.min(10, 4.5 + gs.dist * 0.003);
}

/* ============================================
   Part 3: Game Loop, Input, Screens
   ============================================ */

function updateHUD() {
  document.getElementById('hud-crowd').textContent = gs.crowd.toLocaleString();
  document.getElementById('hud-dist').textContent  = Math.round(gs.dist);
  const livesStr = ['', 'I', 'II', 'III'][Math.max(0, gs.lives)] || '';
  document.getElementById('hud-lives').textContent = livesStr;
}

function jump() {
  const p = gs.player;
  if (p.onGround && gs.running) {
    p.vy = JUMP_V;
    p.onGround = false;
  }
}

function gameLoop() {
  if (!gs.running) return;

  gs.frame++;
  gs.dist += gs.speed * 0.05;

  // Update
  updatePlayer(gs.player);
  updateEntities();

  // Draw
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  gs.obstacles.forEach(drawObstacle);
  gs.collectibles.forEach(drawCollectible);
  drawPlayer(gs.player);
  drawParticles();
  drawCrowdBar();

  // Distance milestone text
  if (gs.frame % 300 === 0) {
    const milestones = [
      'Keep marching!', 'Berkeley is behind you!',
      'Chicago — 1968!', 'Half a million strong!',
      'Almost at Washington!'
    ];
    const m = milestones[Math.floor(gs.dist / 600) % milestones.length];
    ctx.fillStyle = 'rgba(245,200,66,0.85)';
    ctx.font = 'bold 13px Special Elite, monospace';
    ctx.fillText(m, W / 2 - ctx.measureText(m).width / 2, 30);
  }

  // Win condition
  if (gs.dist >= 2000) {
    endGame(true);
    return;
  }

  raf = requestAnimationFrame(gameLoop);
}

function startGame() {
  if (raf) cancelAnimationFrame(raf);
  resetState();
  genBuildings();
  showScreen('none');
  gs.running = true;
  updateHUD();
  raf = requestAnimationFrame(gameLoop);
}

function endGame(won) {
  gs.running = false;
  if (raf) cancelAnimationFrame(raf);

  document.getElementById('end-title').textContent = won ? 'WASHINGTON REACHED!' : 'MARCH ENDED';
  document.getElementById('end-crowd').textContent = 'Crowd: ' + gs.crowd.toLocaleString();
  document.getElementById('end-dist').textContent  = 'Distance: ' + Math.round(gs.dist) + 'm';

  let msg;
  if (won)             msg = 'You made it! Half a million marched with you. The movement lives on.';
  else if (gs.crowd > 50) msg = 'A strong march — ' + gs.crowd + ' people joined you. Try again to reach Washington!';
  else                 msg = 'The march was suppressed. But the movement never dies — try again!';
  document.getElementById('end-msg').textContent = msg;

  showScreen('end');
}

function showScreen(which) {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-end').classList.remove('active');
  if (which === 'start') document.getElementById('screen-start').classList.add('active');
  if (which === 'end')   document.getElementById('screen-end').classList.add('active');
}

// ---- Input ----
document.addEventListener('keydown', e => {
  if (!gs.running) return;
  if (e.code === 'Space' || e.code === 'ArrowUp')   { e.preventDefault(); jump(); }
  if (e.code === 'ArrowDown') { e.preventDefault(); gs.player.ducking = true; }
});
document.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown') gs.player.ducking = false;
});

// Canvas tap = jump
canvas.addEventListener('click',     () => { if (gs.running) jump(); });
canvas.addEventListener('touchstart', e => { e.preventDefault(); if (gs.running) jump(); }, { passive: false });

// Buttons
document.getElementById('btn-start-game').addEventListener('click', startGame);
document.getElementById('btn-play-again').addEventListener('click', startGame);

// Init
resetState();
genBuildings();
// Draw a static preview frame
drawBackground();
