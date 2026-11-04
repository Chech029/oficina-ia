/* ============================================================
   La Oficina de IA de Sergio — Premium (build 0.3)
   Una única escena compartida con un CUARTO PROPIO para Sergio
   (despacho privado con tabique + puerta) dentro del mismo render.
   Moderno cálido: nogal, latón, cuero, luz ámbar + acentos teal.
   Sin dependencias · estado simulado (hito 2: datos reales)
   ============================================================ */
'use strict';

/* ── Base ─────────────────────────────────────────────────── */
const canvas = document.getElementById('sala');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE_W = 64, TILE_H = 32, MAP_W = 12, MAP_H = 9, WALL_H = 88;
const ORIGIN_X = canvas.width / 2, ORIGIN_Y = 102;
const SPEED = 1.35;
const PART_X = 8.35;              // tabique del despacho
const DOOR_Y0 = 4.15, DOOR_Y1 = 5.45;  // hueco de la puerta

function iso(gx, gy) {
  return { x: ORIGIN_X + (gx - gy) * (TILE_W / 2), y: ORIGIN_Y + (gx + gy) * (TILE_H / 2) };
}
function now() { return performance.now(); }
function rand(min, max) { return min + Math.random() * (max - min); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ── Sprites pixel-art (16×20, ×3) ────────────────────────── */
function makeSprite(spec, frame) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 20;
  const g = c.getContext('2d');
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const legShift = frame === 0 ? -1 : 1;

  if (spec.kind === 'human') {
    if (spec.curly) {
      px(3, 0, 10, 2, spec.hair);
      px(2, 1, 2, 2, spec.hair); px(5, 0, 2, 1, spec.hair); px(8, 0, 2, 1, spec.hair); px(12, 1, 2, 2, spec.hair);
      px(3, 2, 10, 1, spec.hair);
      px(4, 3, 1, 2, spec.hair); px(11, 3, 1, 2, spec.hair);
    } else {
      px(4, 1, 8, 2, spec.hair);
      px(4, 3, 1, 3, spec.hair); px(11, 3, 1, 3, spec.hair);
    }
    px(4, 2, 8, 5, spec.skin);
    if (spec.curly) { px(3, 2, 2, 1, spec.skin); px(11, 2, 2, 1, spec.skin); }
    px(5, 4, 1, 1, '#1f150e');
    px(10, 4, 1, 1, '#1f150e');
    px(6, 6, 4, 1, spec.beard);
    px(3, 7, 10, 7, spec.hoodie);
    px(3, 7, 10, 1, spec.hoodieDark);
    px(6, 7, 4, 4, spec.tee);
    px(2, 8, 1, 5, spec.hoodieDark);
    px(13, 8, 1, 5, spec.hoodieDark);
    px(4, 12, 8, 1, '#00000033');
    px(4 + legShift, 14, 3, 4, spec.pants);
    px(9 - legShift, 14, 3, 4, spec.pants);
    px(4 + legShift, 18, 3, 2, spec.shoes);
    px(9 - legShift, 18, 3, 2, spec.shoes);
  } else {
    px(6, 0, 4, 1, spec.antenna);
    px(7, 1, 2, 1, spec.antennaTip);
    px(4, 2, 8, 5, spec.head);
    px(4, 6, 8, 1, spec.headDark);
    px(5, 4, 2, 1, spec.eyes);
    px(9, 4, 2, 1, spec.eyes);
    px(3, 7, 10, 7, spec.body);
    px(3, 7, 10, 1, spec.bodyDark);
    px(2, 8, 1, 5, spec.bodyDark);
    px(13, 8, 1, 5, spec.bodyDark);
    spec.emblem(px);
    px(4 + legShift, 14, 3, 4, spec.pants);
    px(9 - legShift, 14, 3, 4, spec.pants);
    px(4 + legShift, 18, 3, 2, spec.feet);
    px(9 - legShift, 18, 3, 2, spec.feet);
  }
  const scaled = document.createElement('canvas');
  scaled.width = 48; scaled.height = 60;
  const sg = scaled.getContext('2d');
  sg.imageSmoothingEnabled = false;
  sg.drawImage(c, 0, 0, 48, 60);
  return scaled;
}

/* ── Cast ─────────────────────────────────────────────────── */
const CAST = [
  {
    id: 'sergio', name: 'Sergio', role: 'Jefe de la oficina · humano',
    represents: 'Tú (la persona real)', model: '—', hw: 'pop-os · tu portátil',
    desc: 'El humano al mando: revisa lo que proponen las IAs, decide qué se sube y qué no. Moreno, pelo rizado, ahora con su propio cuarto dentro de la planta.',
    spec: { kind: 'human', curly: true, skin: '#a06a42', hair: '#221610', beard: '#1a110b',
      hoodie: '#33415c', hoodieDark: '#22304a', tee: '#e0a43c', pants: '#3f3f46', shoes: '#141416' },
    home: { x: 10.3, y: 2.45 }, accent: '#e0a43c',
    phrases: ['¿Alguien revisó los tests?', 'Esto lo despliego yo.', '¿Qué dice el diff?', 'Café antes de mergear.', 'No toquéis main a las 2am.'],
    cornerPhrases: ['Mi cuarto.', 'Que el pipeline espere.', 'Ni un correo hasta las 6.', 'Esto huele a deploy tranquilo.', 'Chinchín virtual por este merge.'],
  },
  {
    id: 'qwen', name: 'Qwen', role: 'Asistente local · Ollama',
    represents: 'qwen2.5-coder:1.5b', model: 'Qwen2.5 Coder 1.5B · Q4_K_M · ctx 32k', hw: 'Tu máquina (Ollama, offline)',
    desc: 'El becario que nunca sale de la oficina: corre 100% en local, gratis y sin internet. Ideal para explicar archivos y borradores. El razonamiento profundo no es lo suyo.',
    spec: { kind: 'robot', head: '#d8f3e3', headDark: '#8fd4ac', eyes: '#16a34a',
      antenna: '#8fd4ac', antennaTip: '#57f287', body: '#2fbf71', bodyDark: '#1f8f4f',
      pants: '#155e37', feet: '#0d3a21',
      emblem(px) { px(6, 10, 4, 3, '#1f8f4f'); px(7, 11, 1, 1, '#57f287'); px(9, 11, 1, 1, '#57f287'); } },
    home: { x: 2.95, y: 3.55 }, accent: '#35d07f',
    phrases: ['Procesando en local…', '0 tokens gastados.', '¿Corro esto offline?', '1.5B y con actitud.', 'Para y piensa…'],
  },
  {
    id: 'pulse', name: 'Pulse', role: 'Ingeniero · OpenCode (free)',
    represents: 'OpenCode · Pulse Alpha Free', model: 'opencode/pulse-alpha-free (Consola OpenCode)', hw: 'Nube OpenCode Console',
    desc: 'El agente de OpenCode (sí, quien te habla ahora). Grapa diffs, tests y refactors con modelos gratis. Si aprieta el problema, subes de variante en la consola.',
    spec: { kind: 'robot', head: '#d6c8ff', headDark: '#9d86e8', eyes: '#22d3ee',
      antenna: '#9d86e8', antennaTip: '#ff5cf4', body: '#8b5cf6', bodyDark: '#5b3cc4',
      pants: '#38236b', feet: '#241343',
      emblem(px) { px(7, 9, 2, 4, '#facc15'); px(6, 11, 2, 1, '#facc15'); } },
    home: { x: 5.7, y: 2.6 }, accent: '#a78bfa',
    phrases: ['Lanzando opencode run…', 'Tests en verde.', 'Diff ya en tus manos.', 'Razonamiento: high.', 'Esto lo arreglo en 3 pasos.'],
  },
  {
    id: 'gemini', name: 'Gemini', role: 'Diseñador / QA visual · Antigravity',
    represents: 'Google Antigravity (agy)', model: 'Gemini vía Antigravity IDE/CLI', hw: 'Google · tu máquina',
    desc: 'El ojo de la oficina: navega la app, hace capturas y verifica que lo que dicen funciona, funciona. Vive en ~/.gemini y aún no tiene ningún MCP conectado.',
    spec: { kind: 'robot', head: '#eaf2ff', headDark: '#a8c2f0', eyes: '#1a73e8',
      antenna: '#a8c2f0', antennaTip: '#ffd257', body: '#4285f4', bodyDark: '#2a5bb8',
      pants: '#1e3a66', feet: '#12233d',
      emblem(px) { px(7, 9, 2, 1, '#ffd257'); px(6, 10, 4, 1, '#ffd257'); px(7, 11, 2, 1, '#eaf2ff'); } },
    home: { x: 4.6, y: 7.15 }, accent: '#66a6ff',
    phrases: ['Verificando en el navegador…', 'Captura 12 de 14.', 'El botón se ve… raro.', 'QA: FAIL → fix.', 'Puliendo el píxel perfecto.'],
  },
];

/* ── Layout: zona común ───────────────────────────────────── */
const DESKS = [
  { x: 2.9, y: 2.6, accent: '#35d07f' },   // Qwen
  { x: 5.6, y: 1.7, accent: '#a78bfa' },   // Pulse
  { x: 4.0, y: 6.3, accent: '#66a6ff' },   // Gemini
];
const SERVER = { x: 1.15, y: 1.35 };
const COFFEE = { x: 6.7, y: 1.1 };
const RUG = { x: 5.5, y: 5.4, rx: 1.7, ry: 1.0 };
const PLANTS = [{ x: 0.7, y: 4.6 }, { x: 0.75, y: 8.0 }];
const FLOOR_LAMP = { x: 1.05, y: 7.2 };

/* ── Layout: cuarto de Sergio (dentro de la misma planta) ─── */
const S_DESK = { x: 10.35, y: 1.5 };          // caoba
const S_RUG = { x: 10.25, y: 4.35, rx: 1.5, ry: 0.92 };
const SOFA = { x: 10.45, y: 4.9 };
const S_TABLE = { x: 9.35, y: 5.35 };
const S_LAMP = { x: 11.35, y: 3.15 };
const S_PLANT = { x: 11.3, y: 8.0 };
const S_SHELF = { x: 9.62, y: 0.55 };        // librería (frente al sur)

const OBSTACLES = [
  { x: S_DESK.x, y: S_DESK.y, r: 0.7 },
  { x: SOFA.x, y: SOFA.y, r: 0.62 },
  { x: S_TABLE.x, y: S_TABLE.y, r: 0.32 },
  { x: S_LAMP.x, y: S_LAMP.y, r: 0.28 },
  { x: S_SHELF.x, y: S_SHELF.y, r: 0.55 },
  ...DESKS.map(d => ({ x: d.x, y: d.y, r: 0.55 })),
  { x: SERVER.x, y: SERVER.y, r: 0.5 },
  { x: COFFEE.x, y: COFFEE.y, r: 0.55 },
  { x: FLOOR_LAMP.x, y: FLOOR_LAMP.y, r: 0.3 },
];

/* ── Suelo y paredes ──────────────────────────────────────── */
const TILE_A = ['#9a6f47', '#8f6540', '#a87c52'];
const TILE_B = ['#8d633d', '#835c3a', '#97724a'];
const TILE_DA = ['#6e4c2e', '#654628', '#755436'];
const TILE_DB = ['#634628', '#5a3f24', '#6f4c2f'];

function drawDiamond(cx, cy, hw, hh, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - hh); ctx.lineTo(cx + hw, cy); ctx.lineTo(cx, cy + hh); ctx.lineTo(cx - hw, cy);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function drawFloor() {
  for (let gy = 0; gy < MAP_H; gy++) {
    for (let gx = 0; gx < MAP_W; gx++) {
      const p = iso(gx + 0.5, gy + 0.5);
      const alt = (gx + gy) % 2 === 0;
      const shade = (gx * 7 + gy * 13) % 3;
      const inOffice = (gx + 0.5) >= PART_X;
      const set = inOffice ? (alt ? TILE_DA : TILE_DB) : (alt ? TILE_A : TILE_B);
      drawDiamond(p.x, p.y, TILE_W / 2, TILE_H / 2, set[shade], 'rgba(25,14,7,.3)');
    }
  }
  ctx.strokeStyle = 'rgba(30,16,8,.3)';
  ctx.lineWidth = 1;
  for (let gy = 1; gy < MAP_H; gy++) {
    const p1 = iso(0, gy), p2 = iso(MAP_W, gy);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
}

function drawWalls() {
  const A = iso(0, 0), B = iso(0, MAP_H), C = iso(MAP_W, 0);
  // pared izquierda: cálida
  const gL = ctx.createLinearGradient(0, A.y - WALL_H, 0, B.y);
  gL.addColorStop(0, '#d9cdb8'); gL.addColorStop(1, '#b3a68e');
  ctx.fillStyle = gL;
  ctx.beginPath(); ctx.moveTo(A.x, A.y - WALL_H); ctx.lineTo(B.x, B.y - WALL_H); ctx.lineTo(B.x, B.y); ctx.lineTo(A.x, A.y); ctx.closePath(); ctx.fill();
  // pared derecha: más oscura (el cuarto de Sergio)
  const gR = ctx.createLinearGradient(0, A.y - WALL_H, 0, C.y);
  gR.addColorStop(0, '#8d8270'); gR.addColorStop(1, '#57503f');
  ctx.fillStyle = gR;
  ctx.beginPath(); ctx.moveTo(A.x, A.y - WALL_H); ctx.lineTo(C.x, C.y - WALL_H); ctx.lineTo(C.x, C.y); ctx.lineTo(A.x, A.y); ctx.closePath(); ctx.fill();

  // cornisas
  ctx.fillStyle = '#ece2cd';
  ctx.beginPath(); ctx.moveTo(A.x, A.y - WALL_H); ctx.lineTo(B.x, B.y - WALL_H); ctx.lineTo(B.x, B.y - WALL_H + 7); ctx.lineTo(A.x, A.y - WALL_H + 7); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3f3a2e';
  ctx.beginPath(); ctx.moveTo(A.x, A.y - WALL_H); ctx.lineTo(C.x, C.y - WALL_H); ctx.lineTo(C.x, C.y - WALL_H + 7); ctx.lineTo(A.x, A.y - WALL_H + 7); ctx.closePath(); ctx.fill();
  // frisos + filete dorado
  ctx.fillStyle = '#7d7060';
  ctx.beginPath(); ctx.moveTo(A.x, A.y - 17); ctx.lineTo(B.x, B.y - 17); ctx.lineTo(B.x, B.y); ctx.lineTo(A.x, A.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4c4432';
  ctx.beginPath(); ctx.moveTo(A.x, A.y - 17); ctx.lineTo(C.x, C.y - 17); ctx.lineTo(C.x, C.y); ctx.lineTo(A.x, A.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(A.x, A.y - 17); ctx.lineTo(B.x, B.y - 17); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(A.x, A.y - 17); ctx.lineTo(C.x, C.y - 17); ctx.stroke();

  /* pared izquierda: pizarra con marco + certificados + estantería */
  const slopeL = (B.y - A.y) / (B.x - A.x);
  ctx.save();
  ctx.translate(A.x + 38, A.y - 90);
  ctx.transform(1, slopeL, 0, 1, 0, 0);
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(-6, -6, 162, 68);
  ctx.fillStyle = '#20242c'; ctx.fillRect(0, 0, 150, 56);
  ctx.strokeStyle = '#39424f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(12, 18); ctx.lineTo(66, 18); ctx.moveTo(12, 30); ctx.lineTo(104, 30); ctx.moveTo(12, 42); ctx.lineTo(46, 42); ctx.stroke();
  ctx.fillStyle = '#e0a43c'; ctx.font = 'bold 8px monospace'; ctx.fillText('Q3 · RELEASE', 12, 11);
  ctx.fillStyle = '#57f287'; ctx.font = '8px monospace'; ctx.fillText('ship it', 92, 47);
  ctx.restore();
  // certificados
  ctx.save();
  ctx.translate(A.x + 216, A.y - 80);
  ctx.transform(1, slopeL, 0, 1, 0, 0);
  for (const dy of [0, 36]) {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, dy, 26, 20);
    ctx.fillStyle = '#f5eed6'; ctx.fillRect(2, dy + 2, 22, 16);
    ctx.fillStyle = '#8a6d1f'; ctx.fillRect(8, dy + 6, 10, 2); ctx.fillRect(8, dy + 11, 10, 2);
    ctx.fillStyle = '#b03a2e'; ctx.beginPath(); ctx.arc(13, dy + 15, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  // estantería flotante con libros
  ctx.save();
  ctx.translate(A.x + 38, A.y - 12);
  ctx.transform(1, slopeL, 0, 1, 0, 0);
  ctx.fillStyle = '#6b4a2f'; ctx.fillRect(0, 0, 122, 5);
  const bookCols = ['#b03a2e', '#2471a3', '#1e8449', '#9a7d0a', '#7d3c98', '#ca6f1e'];
  for (let i = 0; i < bookCols.length; i++) {
    ctx.fillStyle = bookCols[i];
    ctx.fillRect(6 + i * 19, -15, 10, 15);
  }
  ctx.restore();

  /* pared derecha: ventanal nocturno con luna (cuarto de Sergio).
     Empieza antes del tabique para que el tabique tape su borde izquierdo. */
  const slopeR = (C.y - A.y) / (C.x - A.x);
  ctx.save();
  ctx.translate(A.x + 0.60 * (C.x - A.x), A.y - 82);
  ctx.transform(1, slopeR, 0, 1, 0, 0);
  ctx.fillStyle = '#241510'; ctx.fillRect(-6, -6, 236, 82);
  const night = ctx.createLinearGradient(0, 0, 0, 70);
  night.addColorStop(0, '#0b1030'); night.addColorStop(0.7, '#223050'); night.addColorStop(1, '#3a486e');
  ctx.fillStyle = night; ctx.fillRect(0, 0, 224, 70);
  ctx.fillStyle = '#f2ecd9'; ctx.beginPath(); ctx.arc(165, 17, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9d2b8'; ctx.beginPath(); ctx.arc(162, 15, 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0d1230';
  const hs = [20, 32, 14, 40, 24, 28, 12, 36, 18, 26];
  for (let i = 0; i < hs.length; i++) ctx.fillRect(6 + i * 22, 70 - hs[i], 13, hs[i]);
  ctx.fillStyle = '#ffd257';
  for (let i = 0; i < 13; i++) ctx.fillRect(8 + (i * 33) % 210, 28 + ((i * 17) % 34), 2, 2);
  ctx.strokeStyle = '#241510'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(112, 0); ctx.lineTo(112, 70); ctx.stroke();
  ctx.restore();
}

/* Tabique con puerta: separa el cuarto de Sergio del resto del render */
function drawPartition() {
  const segs = [
    { y0: 0, y1: DOOR_Y0 },
    { y0: DOOR_Y1, y1: MAP_H },
  ];
  for (const s of segs) {
    const p0 = iso(PART_X, s.y0), p1 = iso(PART_X, s.y1);
    const slope = (p1.y - p0.y) / (p1.x - p0.x);
    const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    ctx.save();
    ctx.translate(p0.x, p0.y);
    ctx.transform(1, slope, 0, 1, 0, 0);
    // cuerpo de nogal oscuro con paneles
    const g = ctx.createLinearGradient(0, -WALL_H, 0, 0);
    g.addColorStop(0, '#54402a'); g.addColorStop(1, '#34241566'.slice(0,7));
    ctx.fillStyle = g; ctx.fillRect(0, -WALL_H, len, WALL_H);
    // paneles: moldeuras verticales + paneles rectangulares
    ctx.fillStyle = '#241510';
    for (let x = 14; x < len - 10; x += 46) {
      ctx.fillRect(x - 6, -WALL_H + 14, 3, WALL_H - 34);
      ctx.strokeStyle = '#5e422c'; ctx.lineWidth = 2;
      ctx.strokeRect(x, -WALL_H + 16, 32, (WALL_H - 44) / 2);
      ctx.strokeRect(x, -WALL_H + 24 + (WALL_H - 44) / 2, 32, (WALL_H - 44) / 2);
    }
    // línea de oro (rail) y coronilla
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(len, -44); ctx.stroke();
    ctx.fillStyle = '#17100a'; ctx.fillRect(0, -WALL_H, len, 6);
    // zócalo
    ctx.fillStyle = '#17100a'; ctx.fillRect(0, -8, len, 8);
    ctx.restore();
  }
  // postes de la puerta + dintel con placa de latón
  const postH = WALL_H;
  for (const gy of [DOOR_Y0, DOOR_Y1]) {
    const p = iso(PART_X, gy);
    ctx.fillStyle = '#1c110a';
    ctx.fillRect(p.x - 5, p.y - postH, 10, postH);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(p.x - 5, p.y - postH, 10, 4);
    ctx.fillRect(p.x - 6, p.y - 4, 12, 3);
  }
  // dintel sobre el hueco
  const d0 = iso(PART_X, DOOR_Y0), d1 = iso(PART_X, DOOR_Y1);
  const slope = (d1.y - d0.y) / (d1.x - d0.x);
  const len = Math.hypot(d1.x - d0.x, d1.y - d0.y);
  ctx.save();
  ctx.translate(d0.x, d0.y);
  ctx.transform(1, slope, 0, 1, 0, 0);
  ctx.fillStyle = '#33200f'; ctx.fillRect(-5, -WALL_H, len + 10, 22);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(-5, -WALL_H + 22, len + 10, 3);
  // placa de latón SERGIO centrada en el dintel
  const pw = 56;
  ctx.fillStyle = '#c9a227'; ctx.fillRect(len / 2 - pw / 2, -WALL_H + 3, pw, 15);
  ctx.fillStyle = '#241510'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  ctx.fillText('S E R G I O', len / 2, -WALL_H + 14.5);
  ctx.textAlign = 'left';
  ctx.restore();
}

/* ── Mobiliario ───────────────────────────────────────────── */
function drawDesk(d, t) {
  const p = iso(d.x, d.y);
  ctx.fillStyle = 'rgba(0,0,0,.30)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 50, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241d33';
  ctx.beginPath(); ctx.ellipse(p.x + 26, p.y + 10, 11, 6.5, 0, 0, Math.PI * 2); ctx.fill();
  const top = { x: p.x, y: p.y - 24 };
  ctx.fillStyle = '#4a2c1c';
  ctx.beginPath(); ctx.moveTo(top.x - 46, top.y); ctx.lineTo(top.x, top.y + 18); ctx.lineTo(top.x, p.y); ctx.lineTo(top.x - 46, p.y - 18); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5d3a24';
  ctx.beginPath(); ctx.moveTo(top.x + 46, top.y); ctx.lineTo(top.x, top.y + 18); ctx.lineTo(top.x, p.y); ctx.lineTo(top.x + 46, p.y - 18); ctx.closePath(); ctx.fill();
  drawDiamond(top.x, top.y, 46, 18, '#7a4f2c', 'rgba(20,10,5,.4)');
  ctx.fillStyle = '#10131d'; ctx.fillRect(top.x - 13, top.y - 24, 26, 18);
  ctx.fillStyle = d.accent; ctx.globalAlpha = .3; ctx.fillRect(top.x - 11, top.y - 22, 22, 14); ctx.globalAlpha = 1;
  const blink = (Math.floor(t / 530 + d.x * 7) % 2) === 0;
  if (blink) { ctx.fillStyle = d.accent; ctx.fillRect(top.x - 9, top.y - 12, 4, 2); }
  ctx.fillStyle = '#10131d'; ctx.fillRect(top.x - 2, top.y - 6, 4, 4);
  drawDiamond(top.x, top.y + 8, 12, 5, '#232838');
  ctx.fillStyle = d.accent; ctx.fillRect(top.x + 22, top.y - 6, 5, 6);
}

function drawSergioDesk(t) {
  const p = iso(S_DESK.x, S_DESK.y);
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 6, 84, 22, 0, 0, Math.PI * 2); ctx.fill();
  // silla ejecutiva de espaldas
  ctx.fillStyle = '#33231e'; ctx.fillRect(p.x - 16, p.y - 70, 32, 44);
  ctx.fillStyle = '#402d26'; ctx.fillRect(p.x - 13, p.y - 67, 26, 38);
  ctx.fillStyle = '#c9a227';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(p.x - 9, p.y - 60 + i * 11, 1.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(p.x + 9, p.y - 60 + i * 11, 1.4, 0, Math.PI * 2); ctx.fill(); }
  const top = { x: p.x, y: p.y - 28 };
  ctx.fillStyle = '#2c1608';
  ctx.beginPath(); ctx.moveTo(top.x - 70, top.y); ctx.lineTo(top.x, top.y + 24); ctx.lineTo(top.x, p.y + 5); ctx.lineTo(top.x - 70, p.y - 19); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2010';
  ctx.beginPath(); ctx.moveTo(top.x + 70, top.y); ctx.lineTo(top.x, top.y + 24); ctx.lineTo(top.x, p.y + 5); ctx.lineTo(top.x + 70, p.y - 19); ctx.closePath(); ctx.fill();
  drawDiamond(top.x, top.y, 70, 24, '#452a17', '#1a0d04');
  drawDiamond(top.x, top.y, 63, 20.5, '#53331d');
  // lámpara de banquero esmeralda + latón
  ctx.fillStyle = '#c9a227'; ctx.fillRect(top.x - 34, top.y - 7, 12, 4);
  ctx.fillStyle = '#0f5a52';
  ctx.beginPath(); ctx.moveTo(top.x - 39, top.y - 7); ctx.lineTo(top.x - 17, top.y - 7); ctx.lineTo(top.x - 20, top.y - 17); ctx.lineTo(top.x - 36, top.y - 17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.2; ctx.stroke();
  // intercomunicador ámbar con estado del equipo
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(top.x - 2, top.y - 16, 28, 13);
  ctx.fillStyle = '#ffb64f'; ctx.font = 'bold 6px monospace';
  const dots = '.'.repeat(1 + Math.floor(t / 400) % 3);
  ctx.fillText('EQUIPO: OK' + dots, top.x + 1, top.y - 7.5);
  // dosierers + placa
  ctx.fillStyle = '#e8e2d0'; ctx.fillRect(top.x + 32, top.y - 3, 16, 4);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(top.x + 32, top.y - 5.5, 16, 2);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(top.x - 12, top.y + 7, 24, 7);
  ctx.fillStyle = '#241510'; ctx.font = 'bold 6px monospace'; ctx.fillText('S E R G I O', top.x - 10, top.y + 12.4);
}

function drawShelf(t) {
  const p = iso(S_SHELF.x, S_SHELF.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 40, 12, 0, 0, Math.PI * 2); ctx.fill();
  const h = 78, w = 40;
  ctx.fillStyle = '#33200f'; ctx.fillRect(p.x - w, p.y - h, w * 2, h);
  ctx.fillStyle = '#241510'; ctx.fillRect(p.x - w + 5, p.y - h + 5, w * 2 - 10, h - 10);
  const cols = ['#b03a2e', '#2471a3', '#1e8449', '#9a7d0a', '#7d3c98', '#ca6f1e', '#566573'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = p.y - h + 10 + shelf * 23;
    ctx.fillStyle = '#33200f'; ctx.fillRect(p.x - w + 5, sy + 15, w * 2 - 10, 3);
    let bx = p.x - w + 9, k = shelf * 4;
    while (bx < p.x + w - 9) {
      const bw = 6 + ((k * 37 + 5) % 5), bh = 10 + ((k * 53 + 3) % 5);
      ctx.fillStyle = cols[k % cols.length];
      ctx.fillRect(bx, sy + 15 - bh, bw, bh);
      bx += bw + 2; k++;
    }
  }
  // marco de foto + plantita encima
  ctx.fillStyle = '#c9a227'; ctx.fillRect(p.x - 12, p.y - h - 12, 14, 11);
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(p.x - 10, p.y - h - 10, 10, 7);
  ctx.fillStyle = '#247a4e'; ctx.beginPath(); ctx.ellipse(p.x + 16, p.y - h - 6, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(p.x + 12, p.y - h - 3, 8, 4);
}

function drawSofa() {
  const p = iso(SOFA.x, SOFA.y);
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4e342c';
  ctx.beginPath(); ctx.ellipse(p.x, p.y - 6, 44, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6a463a';
  ctx.beginPath(); ctx.ellipse(p.x, p.y - 13, 44, 14, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#3a2620';
  for (const dx of [-24, 0, 24]) {
    ctx.beginPath(); ctx.ellipse(p.x + dx, p.y - 9, 11.5, 5.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#c9a227';
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(p.x + i * 17, p.y - 17, 1.2, 0, Math.PI * 2); ctx.fill(); }
}

function drawCoffeeTable() {
  const p = iso(S_TABLE.x, S_TABLE.y);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  drawDiamond(p.x, p.y - 6, 19, 7.5, '#1c2530', '#c9a227');
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(p.x - 11, p.y - 2); ctx.lineTo(p.x - 11, p.y + 7); ctx.moveTo(p.x + 11, p.y - 2); ctx.lineTo(p.x + 11, p.y + 7); ctx.stroke();
  ctx.fillStyle = '#e8e2d0'; ctx.fillRect(p.x - 5, p.y - 9, 10, 3);
}

function drawOfficeRug() {
  const r = iso(S_RUG.x, S_RUG.y);
  drawDiamond(r.x, r.y, S_RUG.rx * TILE_W / 1.6, S_RUG.ry * TILE_H / 1.6, '#5b2333', '#c9a227');
  drawDiamond(r.x, r.y, S_RUG.rx * TILE_W / 2.05, S_RUG.ry * TILE_H / 2.05, '#6e2c40');
  drawDiamond(r.x, r.y, S_RUG.rx * TILE_W / 3.3, S_RUG.ry * TILE_H / 3.3, '#5b2333', '#c9a227');
}

function drawOfficeLamp() {
  const p = iso(S_LAMP.x, S_LAMP.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 13, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 66); ctx.stroke();
  ctx.fillStyle = '#f5dfa8';
  ctx.beginPath(); ctx.moveTo(p.x - 14, p.y - 66); ctx.lineTo(p.x + 14, p.y - 66); ctx.lineTo(p.x + 9, p.y - 84); ctx.lineTo(p.x - 9, p.y - 84); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#241510'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
}

function drawServer(t) {
  const p = iso(SERVER.x, SERVER.y);
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 30, 11, 0, 0, Math.PI * 2); ctx.fill();
  const h = 64;
  ctx.fillStyle = '#12151f'; ctx.fillRect(p.x - 17, p.y - h, 34, h);
  ctx.fillStyle = '#1d2230'; ctx.fillRect(p.x - 17, p.y - h, 7, h);
  ctx.fillStyle = '#c9a227'; ctx.fillRect(p.x - 17, p.y - h, 34, 2);
  for (let i = 0; i < 4; i++) {
    const y = p.y - h + 12 + i * 13;
    ctx.fillStyle = '#0a0c14'; ctx.fillRect(p.x - 12, y, 24, 9);
    const on = (Math.floor(t / (280 + i * 170) + i * 2) % 3) !== 0;
    ctx.fillStyle = on ? '#57f287' : '#173421';
    ctx.fillRect(p.x + 6, y + 3, 3, 3);
    ctx.fillStyle = '#233047'; ctx.fillRect(p.x - 9, y + 3, 8, 3);
  }
  ctx.fillStyle = '#57f287'; ctx.font = 'bold 7px monospace';
  ctx.fillText('OLLAMA', p.x - 15, p.y - h - 4);
}

function drawCoffee(t, inUse) {
  const p = iso(COFFEE.x, COFFEE.y);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 30, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2417'; ctx.fillRect(p.x - 21, p.y - 16, 42, 16);
  ctx.fillStyle = '#5d3a24'; ctx.fillRect(p.x - 21, p.y - 16, 42, 3);
  ctx.fillStyle = '#232838'; ctx.fillRect(p.x - 10, p.y - 34, 20, 18);
  ctx.fillStyle = '#b03a2e'; ctx.fillRect(p.x - 10, p.y - 30, 20, 3);
  ctx.fillStyle = '#0a0c14'; ctx.fillRect(p.x - 5, p.y - 22, 10, 6);
  ctx.fillStyle = '#c08457'; ctx.fillRect(p.x - 5, p.y - 17, 10, 2);
  if (inUse) {
    for (let i = 0; i < 3; i++) {
      const ph = (t / 350 + i * 1.7) % 3;
      ctx.globalAlpha = clamp(1 - ph / 3, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - 6 + i * 6, p.y - 36 - ph * 8, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawPlant(pl, big) {
  const p = iso(pl.x, pl.y);
  const s = big ? 1.35 : 1;
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 13 * s, 5.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3a22'; ctx.fillRect(p.x - 7 * s, p.y - 9 * s, 14 * s, 10 * s);
  ctx.fillStyle = '#247a4e';
  ctx.beginPath(); ctx.ellipse(p.x - 5 * s, p.y - 14 * s, 7 * s, 5 * s, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(p.x + 6 * s, p.y - 17 * s, 7 * s, 5 * s, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(p.x, p.y - 21 * s, 6 * s, 7.5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2fbf71';
  ctx.beginPath(); ctx.ellipse(p.x - 3 * s, p.y - 18 * s, 2.4 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill();
}

function drawFloorLamp() {
  const p = iso(FLOOR_LAMP.x, FLOOR_LAMP.y);
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - 56); ctx.stroke();
  ctx.fillStyle = '#f0d49a';
  ctx.beginPath(); ctx.moveTo(p.x - 12, p.y - 56); ctx.lineTo(p.x + 12, p.y - 56); ctx.lineTo(p.x + 8, p.y - 71); ctx.lineTo(p.x - 8, p.y - 71); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#241510'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 8, 3.5, 0, 0, Math.PI * 2); ctx.fill();
}

function drawRug() {
  const r = iso(RUG.x, RUG.y);
  drawDiamond(r.x, r.y, RUG.rx * TILE_W / 1.6, RUG.ry * TILE_H / 1.6, '#1f4e4a', '#c9a227');
  drawDiamond(r.x, r.y, RUG.rx * TILE_W / 2.1, RUG.ry * TILE_H / 2.1, '#27635e');
  drawDiamond(r.x, r.y, RUG.rx * TILE_W / 3.4, RUG.ry * TILE_H / 3.4, '#1f4e4a');
}

/* ── Personajes ───────────────────────────────────────────── */
const STATUS = { work: 'Tecleando', move: 'Caminando', coffee: 'En la cafetera', think: 'Pensando' };

function makeWalker(spec) {
  const sprites = [makeSprite(spec.spec, 0), makeSprite(spec.spec, 1)];
  return {
    spec, sprites,
    x: spec.home.x, y: spec.home.y, tx: spec.home.x, ty: spec.home.y,
    state: 'work', timer: rand(2, 5),
    bubble: null, bubbleUntil: 0, nextPhrase: rand(2500, 8000),
    waveUntil: 0, facing: 1, phase: Math.random() * Math.PI * 2, onArrive: 'work',
  };
}
const npcs = CAST.map(makeWalker);

function pickTarget() {
  for (let i = 0; i < 26; i++) {
    const tx = rand(1.2, MAP_W - 1.1), ty = rand(1.1, MAP_H - 1.1);
    if (!OBSTACLES.some(o => Math.hypot(o.x - tx, o.y - ty) < o.r + 0.25)) return { tx, ty };
  }
  return { tx: RUG.x, ty: RUG.y };
}
function decideNext(n) {
  const r = Math.random();
  if (r < 0.34) { n.tx = n.spec.home.x; n.ty = n.spec.home.y; n.onArrive = 'work'; }
  else if (r < 0.5) { n.tx = COFFEE.x + rand(-0.4, 0.4); n.ty = COFFEE.y + 0.7; n.onArrive = 'coffee'; }
  else if (r < 0.62) { n.tx = RUG.x + rand(-0.7, 0.7); n.ty = RUG.y + rand(-0.45, 0.45); n.onArrive = 'think'; }
  else { const p = pickTarget(); n.tx = p.tx; n.ty = p.ty; n.onArrive = 'think'; }
  n.state = 'move';
  n.timer = rand(6, 12);
}

function phraseOf(n) {
  if (n.spec.id === 'sergio' && n.x >= PART_X && n.spec.cornerPhrases) {
    return n.spec.cornerPhrases[Math.floor(Math.random() * n.spec.cornerPhrases.length)];
  }
  return n.spec.phrases[Math.floor(Math.random() * n.spec.phrases.length)];
}

function updateNPC(n, dt, t) {
  if (t < n.waveUntil) return;
  if (n.state === 'move') {
    const dx = n.tx - n.x, dy = n.ty - n.y, dist = Math.hypot(dx, dy);
    if (dist < 0.06) { n.state = n.onArrive || 'think'; n.timer = rand(3, 7); return; }
    const step = Math.min(dist, SPEED * dt);
    n.x += (dx / dist) * step; n.y += (dy / dist) * step;
    n.facing = (dx - dy) >= 0 ? 1 : -1;
  } else {
    n.timer -= dt;
    if (n.timer <= 0) decideNext(n);
  }
  if (t > n.nextPhrase) {
    n.bubble = phraseOf(n);
    n.bubbleUntil = t + 3600;
    n.nextPhrase = t + rand(9000, 17000);
  }
}

function drawNPC(n, t) {
  const p = iso(n.x, n.y);
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
  if (selected === n) {
    const pulse = 1 + 0.18 * Math.sin(t / 180);
    ctx.strokeStyle = '#e0a43c'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 22 * pulse, 9 * pulse, 0, 0, Math.PI * 2); ctx.stroke();
  }
  const walking = n.state === 'move';
  const bob = walking ? Math.abs(Math.sin(t / 105 + n.phase)) * 3 : Math.sin(t / 620 + n.phase) * 1.5;
  const frame = walking ? (Math.floor(t / 190 + n.phase) % 2) : 0;
  const wave = t < n.waveUntil ? Math.sin(t / 90) * 4 : 0;
  ctx.save();
  ctx.translate(p.x, p.y - bob);
  if (n.facing < 0) ctx.scale(-1, 1);
  ctx.drawImage(n.sprites[frame], -24, -60 + wave * 0.4);
  ctx.restore();

  if (n.state === 'think') {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let i = 0; i < 3; i++) {
      const ph = (t / 280 + i * 0.9) % 3;
      ctx.globalAlpha = clamp(1 - ph / 3, 0.15, 1);
      ctx.beginPath(); ctx.arc(p.x + 12 + i * 8, p.y - 66 - ph * 6, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (n.bubble && t < n.bubbleUntil) {
    ctx.font = 'bold 11px "Courier New", monospace';
    const w = ctx.measureText(n.bubble).width + 16;
    const bx = clamp(p.x, w / 2 + 4, canvas.width - w / 2 - 4);
    const by = p.y - 78;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.strokeStyle = '#14101f'; ctx.lineWidth = 2;
    roundRect(bx - w / 2, by - 14, w, 19, 6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 4, by + 4); ctx.lineTo(p.x + 5, by + 4); ctx.lineTo(p.x, by + 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14101f'; ctx.textAlign = 'center';
    ctx.fillText(n.bubble, bx, by);
    ctx.textAlign = 'left';
  }
  ctx.font = 'bold 10px "Segoe UI", sans-serif';
  const nw = ctx.measureText(n.spec.name).width + 10;
  const lx = clamp(p.x, nw / 2 + 3, canvas.width - nw / 2 - 3);
  ctx.fillStyle = 'rgba(10,8,16,.78)';
  roundRect(lx - nw / 2, p.y + 6, nw, 13, 4); ctx.fill();
  ctx.fillStyle = n.spec.accent; ctx.textAlign = 'center';
  ctx.fillText(n.spec.name.toUpperCase(), lx, p.y + 16);
  ctx.textAlign = 'left';
}

/* ── Iluminación ──────────────────────────────────────────── */
function radial(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 4, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function drawLighting() {
  const sLamp = iso(FLOOR_LAMP.x, FLOOR_LAMP.y);
  const officeLamp = iso(S_LAMP.x, S_LAMP.y);
  const officeDesk = iso(S_DESK.x, S_DESK.y);
  const A = iso(0, 0), B = iso(0, MAP_H), C = iso(MAP_W, 0);
  ctx.save();
  radial(sLamp.x, sLamp.y - 70, 140, 'rgba(255,214,140,.32)');
  radial(officeLamp.x, officeLamp.y - 82, 160, 'rgba(255,222,150,.38)');
  radial(officeDesk.x - 24, officeDesk.y - 46, 130, 'rgba(120,235,185,.24)');
  // sconces en la pared izquierda
  for (const f of [0.28, 0.62]) {
    const x = A.x + f * (B.x - A.x), y = A.y - 62 + f * (B.y - A.y);
    radial(x, y, 105, 'rgba(255,205,125,.2)');
  }
  // resplandor frío de la luna dentro del cuarto
  const moon = iso(10.9, 1.35);
  radial(moon.x, moon.y - 70, 170, 'rgba(160,180,255,.16)');
  // charco cálido ambiental en el cuarto
  const warm = iso(10.2, 5.6);
  radial(warm.x, warm.y, 190, 'rgba(255,200,130,.12)');
  // viñeta
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const vg = ctx.createRadialGradient(cx, cy, canvas.height * 0.38, cx, cy, canvas.width * 0.62);
  vg.addColorStop(0, 'rgba(8,6,14,0)');
  vg.addColorStop(1, 'rgba(8,6,14,.36)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/* ── Render ───────────────────────────────────────────────── */
let selected = null;
let paused = false;
const furniture = [
  { depth: RUG.x + RUG.y - 1, draw: () => drawRug() },
  { depth: S_RUG.x + S_RUG.y - 1, draw: () => drawOfficeRug() },
  { depth: S_DESK.x + S_DESK.y + 0.1, draw: t => drawSergioDesk(t) },
  { depth: S_SHELF.x + S_SHELF.y + 0.15, draw: t => drawShelf(t) },
  { depth: SOFA.x + SOFA.y + 0.1, draw: () => drawSofa() },
  { depth: S_TABLE.x + S_TABLE.y + 0.1, draw: () => drawCoffeeTable() },
  { depth: S_LAMP.x + S_LAMP.y + 0.1, draw: () => drawOfficeLamp() },
  ...DESKS.map(d => ({ depth: d.x + d.y + 0.1, draw: t => drawDesk(d, t) })),
  { depth: SERVER.x + SERVER.y + 0.1, draw: t => drawServer(t) },
  { depth: COFFEE.x + COFFEE.y + 0.1, draw: t => drawCoffee(t, npcs.some(n => n.state === 'coffee')) },
  { depth: FLOOR_LAMP.x + FLOOR_LAMP.y + 0.1, draw: () => drawFloorLamp() },
  ...PLANTS.map(pl => ({ depth: pl.x + pl.y + 0.1, draw: () => drawPlant(pl, true) })),
  { depth: S_PLANT.x + S_PLANT.y + 0.1, draw: () => drawPlant(S_PLANT, true) },
];

function render(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWalls();
  drawFloor();
  drawPartition();
  // sconces (artefactos) en pared izquierda
  const A = iso(0, 0), B = iso(0, MAP_H);
  for (const f of [0.28, 0.62]) {
    const x = A.x + f * (B.x - A.x), y = A.y - 62 + f * (B.y - A.y);
    ctx.fillStyle = '#3a2c14'; ctx.fillRect(x - 6, y - 3, 12, 6);
    ctx.fillStyle = '#ffb64f'; ctx.fillRect(x - 4, y - 1, 8, 2);
  }
  const drawables = [
    ...furniture,
    ...npcs.map(n => ({ depth: n.x + n.y + 0.2, draw: () => drawNPC(n, t) })),
  ].sort((a, b) => a.depth - b.depth);
  for (const d of drawables) d.draw(t);
  drawLighting();
  if (paused) {
    ctx.fillStyle = 'rgba(10,8,18,.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e0a43c'; ctx.font = 'bold 26px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillText('| |  PAUSA', canvas.width / 2, 56);
    ctx.textAlign = 'left';
  }
}

let last = now();
function loop() {
  const t = now();
  const dt = Math.min((t - last) / 1000, 0.05);
  last = t;
  if (!paused) for (const n of npcs) updateNPC(n, dt, t);
  render(t);
  requestAnimationFrame(loop);
}

/* ── Interacción y panel ──────────────────────────────────── */
function canvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) * (canvas.width / rect.width),
    y: (evt.clientY - rect.top) * (canvas.height / rect.height),
  };
}
function pickNPC(pt) {
  let best = null, bestD = 32;
  for (const n of npcs) {
    const p = iso(n.x, n.y);
    const d = Math.hypot(p.x - pt.x, (p.y - 30) - pt.y);
    if (d < bestD) { bestD = d; best = n; }
  }
  return best;
}
canvas.addEventListener('click', evt => {
  const hit = pickNPC(canvasPos(evt));
  selected = hit;
  if (hit) { hit.waveUntil = now() + 1200; blip(); }
  renderFicha(); renderRoster();
});

const statusOf = n => STATUS[n.state === 'move' ? 'move' : n.state] || 'Tecleando';

function renderRoster() {
  const ul = document.getElementById('roster-list');
  ul.innerHTML = '';
  for (const n of npcs) {
    const li = document.createElement('li');
    li.className = 'roster-item' + (selected === n ? ' active' : '');
    const mini = document.createElement('canvas');
    mini.width = 48; mini.height = 60; mini.className = 'avatar-mini';
    const mg = mini.getContext('2d');
    mg.imageSmoothingEnabled = false;
    mg.drawImage(n.sprites[0], 0, 0, 48, 60);
    li.appendChild(mini);
    const mid = document.createElement('div');
    mid.innerHTML = `<div class="name">${n.spec.name}</div><div class="role">${n.spec.role}</div>`;
    li.appendChild(mid);
    const st = document.createElement('div');
    st.className = 'status'; st.textContent = statusOf(n);
    li.appendChild(st);
    li.addEventListener('click', () => { selected = n; n.waveUntil = now() + 1200; renderFicha(); renderRoster(); blip(); });
    ul.appendChild(li);
  }
}
function renderFicha() {
  const body = document.getElementById('ficha-body');
  if (!selected) {
    body.className = 'ficha-empty';
    body.innerHTML = '<p>Ningún personaje seleccionado.</p><p class="ficha-sub">Haz clic en alguien de la sala para ver quién es y qué hace.</p>';
    return;
  }
  const s = selected.spec;
  body.className = '';
  body.innerHTML = `
    <p class="ficha-name" style="color:${s.accent}">${s.name}</p>
    <p class="ficha-subtitle">${s.role}</p>
    <p class="ficha-desc">${s.desc}</p>
    <dl class="ficha-meta">
      <dt>Representa</dt><dd>${s.represents}</dd>
      <dt>Modelo</dt><dd>${s.model}</dd>
      <dt>Hardware</dt><dd>${s.hw}</dd>
    </dl>
    <div class="ficha-status">Ahora mismo: <b>${statusOf(selected)}</b> <span style="opacity:.6">(simulado)</span></div>`;
}

/* ── Barra superior ───────────────────────────────────────── */
const clockEl = document.getElementById('clock');
setInterval(() => { clockEl.textContent = new Date().toLocaleTimeString('es-ES', { hour12: false }); }, 1000);

document.getElementById('btn-pause').addEventListener('click', e => {
  paused = !paused;
  e.currentTarget.textContent = paused ? 'Reanudar' : 'Pausar';
});
document.getElementById('btn-scatter').addEventListener('click', () => {
  for (const n of npcs) { const p = pickTarget(); n.tx = p.tx; n.ty = p.ty; n.state = 'move'; n.onArrive = 'think'; }
});

let audioCtx = null, soundOn = false;
const btnSound = document.getElementById('btn-sound');
btnSound.addEventListener('click', () => {
  soundOn = !soundOn;
  btnSound.textContent = soundOn ? 'Sonido: on' : 'Sonido: off';
  btnSound.setAttribute('aria-pressed', String(soundOn));
});
function blip() {
  if (!soundOn) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = 740;
    g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.12);
  } catch (_) { /* sin audio */ }
}

/* ── Arranque ─────────────────────────────────────────────── */
for (const n of npcs) { n.x = n.spec.home.x; n.y = n.spec.home.y; }
renderRoster();
renderFicha();
setInterval(renderRoster, 800);
requestAnimationFrame(loop);
