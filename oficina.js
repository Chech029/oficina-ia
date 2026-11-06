/* ============================================================
   Laboratorio de IA de Sergio · Centro de Control 2D
   Vista 2D Top-Down · Integración Real con Ollama (localhost:11434)
   JavaScript Puro · Canvas HTML5 · WebAudio 8-Bit · Sin Dependencias
   ============================================================ */

'use strict';

// ── Configuración y Canvas ────────────────────────────────────
const canvas = document.getElementById('sala');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const TILE = 32;       // 32x32 píxeles por tile
const COLS = 25;       // 25 * 32 = 800px ancho
const ROWS = 15;       // 15 * 32 = 480px alto

// ── Estado de la simulación ────────────────────────────────────
let isPaused = false;
let soundEnabled = false;
let globalTick = 0;
let activeDialogueTimeout = null;

// Telemetría de Ollama en tiempo real
let ollamaOnline = false;
let activeModelName = 'qwen2.5-coder:1.5b';
let ollamaIsProcessing = false;

// Elementos de la interfaz
const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const btnSound = document.getElementById('btn-sound');
const btnPause = document.getElementById('btn-pause');
const ollamaDot = document.getElementById('ollama-dot');
const ollamaStatusText = document.getElementById('ollama-status-text');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');

// ── Audio 8-Bit Retro (Web Audio API) ──────────────────────────
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
}

function playBip(freq = 620, duration = 0.04) {
  if (!soundEnabled || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playFanfare() {
  if (!soundEnabled || !audioCtx) return;
  const notes = [440, 554, 659, 880];
  notes.forEach((freq, idx) => {
    setTimeout(() => playBip(freq, 0.08), idx * 70);
  });
}

// ── Sistema de Diálogo Retro con efecto máquina de escribir ───
function showDialogue(speaker, text, color = '#0284c7') {
  initAudio();
  dialogueSpeaker.textContent = speaker.toUpperCase();
  dialogueSpeaker.style.background = color;
  
  if (activeDialogueTimeout) {
    clearInterval(activeDialogueTimeout);
    activeDialogueTimeout = null;
  }

  dialogueText.textContent = '';
  let i = 0;
  playBip(520, 0.06);

  activeDialogueTimeout = setInterval(() => {
    if (i < text.length) {
      dialogueText.textContent += text.charAt(i);
      if (i % 2 === 0 && text.charAt(i) !== ' ') {
        playBip(480 + (i % 4) * 40, 0.025);
      }
      i++;
    } else {
      clearInterval(activeDialogueTimeout);
      activeDialogueTimeout = null;
    }
  }, 18);
}

// ── Paleta de Colores Técnica ─────────────────────────────────
const PAL = {
  // Suelos y Paredes
  wallTop: '#1e293b',
  wallFront: '#334155',
  wallTrim: '#0f172a',
  labFloor1: '#e2e8f0',
  labFloor2: '#cbd5e1',
  labBorder: '#94a3b8',
  
  // Despacho de Sergio (Nogal y Caoba)
  officeWood: '#78350f',
  officeWoodDark: '#451a03',
  carpetRed: '#881337',
  carpetBorder: '#f59e0b',
  partitionWood: '#5c2d11',
  partitionTrim: '#d97706',
  
  // Muebles
  deskBody: '#64748b',
  deskTop: '#94a3b8',
  deskWood: '#5a2d14',
  deskWoodTop: '#7c3f1d',
  monitorCase: '#cbd5e1',
  monitorScreenGreen: '#22c55e',
  monitorScreenBlue: '#38bdf8',
  chairLeather: '#991b1b',
  serverCase: '#0f172a',
  plantGreen: '#15803d',
  plantPot: '#b45309',
  
  // Personajes
  skinTone: '#c68642',
  hairDark: '#17120e',
  blazerNavy: '#1e3a8a',
  shirtWhite: '#f8fafc',
  pantsDark: '#0f172a'
};

// ── Definición de Personajes ──────────────────────────────────
const CHARACTERS = {
  sergio: {
    id: 'sergio',
    name: 'Sergio',
    role: 'Jefe & Arquitecto de Software',
    x: 20,
    y: 5,
    color: '#0284c7',
    state: 'working',
    dialogues: [
      "¡Equipo, el objetivo es mantener el sistema ágil, limpio y 100% bajo control!",
      "Qwen, confirma que Ollama esté corriendo sin consumir recursos de más.",
      "Excelente trabajo con la arquitectura 2D. Sin dependencias externas se trabaja mucho mejor.",
      "Pueden escribirle un prompt a Qwen en la barra inferior para probar el modelo local."
    ],
    draw(cx, cy, frame) {
      const px = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(cx + x, cy + y, w, h); };
      const bob = (this.state === 'working' && Math.sin(frame * 0.15) > 0) ? 1 : 0;

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(cx + 16, cy + 30, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pelo rizado oscuro (moreno)
      px(8, 2 - bob, 16, 8, PAL.hairDark);
      px(6, 4 - bob, 3, 5, PAL.hairDark);
      px(23, 4 - bob, 3, 5, PAL.hairDark);
      px(10, 0 - bob, 12, 3, PAL.hairDark);

      // Cara
      px(9, 6 - bob, 14, 10, PAL.skinTone);
      px(12, 9 - bob, 2, 3, '#111');
      px(18, 9 - bob, 2, 3, '#111');
      px(13, 9 - bob, 1, 1, '#fff');
      px(19, 9 - bob, 1, 1, '#fff');
      px(15, 13 - bob, 3, 1, '#663b15');

      // Cuello y Camisa blanca
      px(13, 16, 6, 4, PAL.shirtWhite);

      // Blazer Navy elegante
      px(8, 17, 16, 9, PAL.blazerNavy);
      px(14, 18, 4, 8, PAL.shirtWhite);
      px(7, 18, 3, 6, PAL.blazerNavy);
      px(22, 18, 3, 6, PAL.blazerNavy);
      px(7, 24, 3, 3, PAL.skinTone);
      px(22, 24, 3, 3, PAL.skinTone);

      // Pantalón y Zapatos
      px(10, 26, 5, 4, PAL.pantsDark);
      px(17, 26, 5, 4, PAL.pantsDark);
      px(9, 29, 6, 3, '#111');
      px(17, 29, 6, 3, '#111');

      if (this.state === 'talking') {
        drawSpeechBubble(cx + 12, cy - 8, '💬');
      }
    }
  },

  qwen: {
    id: 'qwen',
    name: 'Qwen Local',
    role: 'IA Local (Ollama)',
    x: 4,
    y: 5,
    color: '#16a34a',
    state: 'working',
    dialogues: [
      "¡Modelo qwen2.5-coder:1.5b cargado en Ollama! Listo para escribir código offline.",
      "Cero tokens gastados en la nube. 100% privacidad y ejecución local.",
      "Puedes escribirme un prompt abajo en la barra de comandos para poner a prueba mi velocidad.",
      "Procesando solicitudes en tu máquina a máxima velocidad."
    ],
    draw(cx, cy, frame) {
      const px = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(cx + x, cy + y, w, h); };
      const isTyping = (this.state === 'working' || ollamaIsProcessing);
      const typingBob = (isTyping && Math.floor(frame * 0.25) % 2 === 0) ? 1 : 0;

      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.ellipse(cx + 16, cy + 30, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Casco tecnológico verde de desarrollador
      px(8, 4 - typingBob, 16, 6, '#15803d');
      px(6, 7 - typingBob, 20, 3, '#22c55e');
      // Antena LED con parpadeo de actividad
      px(15, 0 - typingBob, 2, 4, '#15803d');
      const ledColor = isTyping ? ((Math.floor(frame * 0.2) % 2 === 0) ? '#4ade80' : '#15803d') : '#22c55e';
      px(14, 0 - typingBob, 4, 2, ledColor);

      // Cara chibi
      px(9, 10 - typingBob, 14, 7, '#fcd34d');
      px(11, 12 - typingBob, 3, 2, '#047857');
      px(18, 12 - typingBob, 3, 2, '#047857');
      px(9, 14 - typingBob, 2, 1, '#f87171');
      px(21, 14 - typingBob, 2, 1, '#f87171');

      // Bata blanca de ingeniero
      px(9, 17, 14, 9, '#f8fafc');
      px(13, 17, 6, 8, '#e2e8f0');
      // Manos tecleando
      px(7, 18 - typingBob, 3, 6, '#f8fafc');
      px(22, 18 + typingBob, 3, 6, '#f8fafc');

      // Pantalón
      px(11, 26, 4, 4, '#0f172a');
      px(17, 26, 4, 4, '#0f172a');

      if (this.state === 'talking') {
        drawSpeechBubble(cx + 12, cy - 8, '⚡');
      } else if (ollamaIsProcessing) {
        drawSpeechBubble(cx + 12, cy - 8, '⏳');
      }
    }
  },

  gemini: {
    id: 'gemini',
    name: 'Antigravity / Gemini',
    role: 'Orquestador en la Nube',
    x: 11,
    y: 5,
    color: '#0284c7',
    state: 'working',
    dialogues: [
      "¡Antigravity en línea! Supervisando el repositorio y asistiendo a Sergio en tiempo real.",
      "La integración directa con Ollama vía localhost permite consultar el modelo local sin intermediarios.",
      "Todo el entorno verificado: limpio, modular y sin dependencias superfluas.",
      "Listo para continuar desarrollando nuevas capacidades para el centro de control."
    ],
    draw(cx, cy, frame) {
      const px = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(cx + x, cy + y, w, h); };
      const floatOffset = Math.round(Math.sin(frame * 0.08) * 2);

      // Sombra dinámica
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(cx + 16, cy + 30, 8 - floatOffset, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura tecnológica
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx + 6, cy + 2 + floatOffset, 20, 26);

      // Cabello plateado
      px(8, 3 + floatOffset, 16, 7, '#94a3b8');
      px(6, 6 + floatOffset, 4, 6, '#64748b');
      px(22, 6 + floatOffset, 4, 6, '#64748b');

      // Rostro
      px(10, 8 + floatOffset, 12, 8, '#fde68a');
      // Visor cyan
      px(9, 10 + floatOffset, 14, 3, '#0284c7');
      px(12, 10 + floatOffset, 8, 2, '#38bdf8');

      // Túnica tecnológica
      px(9, 16 + floatOffset, 14, 10, '#1e3a8a');
      px(12, 16 + floatOffset, 8, 10, '#3b82f6');
      px(7, 17 + floatOffset, 3, 7, '#60a5fa');
      px(22, 17 + floatOffset, 3, 7, '#60a5fa');

      px(11, 26 + floatOffset, 10, 3, '#1d4ed8');

      if (this.state === 'talking') {
        drawSpeechBubble(cx + 12, cy - 8 + floatOffset, '✨');
      }
    }
  }
};

function drawSpeechBubble(x, y, symbol) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 10, 18, 16, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 6);
  ctx.lineTo(x + 5, y + 6);
  ctx.lineTo(x + 3, y + 10);
  ctx.fill();

  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(symbol, x + 3, y + 2);
}

// ── Elementos del Entorno (Mobiliario Técnico) ────────────────
const OBJECTS = [
  {
    x: 1, y: 1, w: 3, h: 2,
    name: 'Biblioteca de Arquitectura',
    dialogue: "Biblioteca técnica: 'Patrones de Software', 'Clean Code', 'Manual de Python' y 'Documentación de Ollama'.",
    draw(cx, cy) { drawBookshelf(cx, cy, 3 * TILE, 2 * TILE); }
  },
  {
    x: 5, y: 1, w: 4, h: 2,
    name: 'Pizarra de Arquitectura',
    dialogue: "Diagrama del sistema: [Sergio / UI] ➔ [Ollama Local: qwen2.5-coder] + [Antigravity Cloud].",
    draw(cx, cy) { drawWhiteboard(cx, cy, 4 * TILE, 2 * TILE); }
  },
  {
    x: 10, y: 1, w: 3, h: 2,
    name: 'Servidor Local Ollama',
    dialogue: "Servidor local en http://localhost:11434. Estado activo y listo para procesar prompts en RAM.",
    draw(cx, cy) { drawServers(cx, cy, 3 * TILE, 2 * TILE); }
  },
  {
    x: 14, y: 1, w: 1, h: 2,
    name: 'Cafetera Espresso',
    dialogue: "Cafetera del equipo. Sergio ya recargó su taza con espresso caliente.",
    draw(cx, cy) { drawCoffeeMachine(cx, cy, 1 * TILE, 2 * TILE); }
  },
  {
    x: 3, y: 4, w: 3, h: 2,
    name: 'Puesto de Qwen Local',
    dialogue: "Estación de cómputo offline. Monitor CRT conectado al motor Ollama local.",
    draw(cx, cy) { drawWorkstation(cx, cy, PAL.monitorScreenGreen, 'QWEN'); }
  },
  {
    x: 10, y: 4, w: 3, h: 2,
    name: 'Puesto de Gemini / Antigravity',
    dialogue: "Terminal de enlace en la nube con Google Antigravity para soporte de arquitectura y código.",
    draw(cx, cy) { drawWorkstation(cx, cy, PAL.monitorScreenBlue, 'GEMINI'); }
  },
  {
    x: 19, y: 4, w: 4, h: 2,
    name: 'Despacho de Sergio',
    dialogue: "Escritorio ejecutivo de caoba con laptop, monitor secundario y taza de café.",
    draw(cx, cy) { drawExecutiveDesk(cx, cy); }
  },
  {
    x: 18, y: 9, w: 3, h: 2,
    name: 'Sofá Ejecutivo',
    dialogue: "Sofá Chesterfield de cuero marrón para planificar sprints y descansar la vista.",
    draw(cx, cy) { drawSofa(cx, cy); }
  },
  {
    x: 6, y: 8, w: 4, h: 4,
    name: 'Alfombra Circuito PCB',
    dialogue: "Alfombra central con el nodo principal de cómputo del laboratorio.",
    draw(cx, cy) { drawCircuitRug(cx, cy, 4 * TILE, 4 * TILE); }
  },
  {
    x: 0, y: 13, w: 1, h: 2,
    name: 'Planta de Oficina',
    dialogue: "Monstera deliciosa en maceta de terracota.",
    draw(cx, cy) { drawPlant(cx, cy); }
  },
  {
    x: 23, y: 13, w: 1, h: 2,
    name: 'Bonsái Ejecutivo',
    dialogue: "Bonsái decorativo en el despacho de Sergio.",
    draw(cx, cy) { drawPlant(cx, cy); }
  }
];

// ── Rutinas de Dibujo ─────────────────────────────────────────
function drawBookshelf(cx, cy, w, h) {
  ctx.fillStyle = '#451a03';
  ctx.fillRect(cx, cy, w, h);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(cx + 2, cy + 2, w - 4, h - 4);

  const bookColors = ['#0284c7', '#16a34a', '#d97706', '#9333ea', '#ef4444', '#38bdf8'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = cy + 6 + shelf * 18;
    ctx.fillStyle = '#271003';
    ctx.fillRect(cx + 4, sy + 14, w - 8, 3);

    let bx = cx + 6;
    while (bx < cx + w - 10) {
      const bw = 5 + (bx % 4);
      const col = bookColors[(bx + shelf) % bookColors.length];
      ctx.fillStyle = col;
      ctx.fillRect(bx, sy, bw, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(bx + 1, sy + 2, bw - 2, 2);
      bx += bw + 1;
    }
  }
}

function drawWhiteboard(cx, cy, w, h) {
  ctx.fillStyle = '#64748b';
  ctx.fillRect(cx, cy, w, h);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(cx + 4, cy + 4, w - 8, h - 8);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(cx + 12, cy + 12, 26, 16);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(cx + 52, cy + 12, 28, 16);
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(cx + 92, cy + 12, 26, 16);

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 38, cy + 20); ctx.lineTo(cx + 52, cy + 20);
  ctx.moveTo(cx + 80, cy + 20); ctx.lineTo(cx + 92, cy + 20);
  ctx.moveTo(cx + 66, cy + 28); ctx.lineTo(cx + 66, cy + 40);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '8px monospace';
  ctx.fillText('IA LOCAL PIPELINE', cx + 22, cy + 46);
}

function drawServers(cx, cy, w, h) {
  ctx.fillStyle = '#020617';
  ctx.fillRect(cx, cy, w, h);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx + 2, cy + 2, w - 4, h - 4);

  for (let r = 0; r < 4; r++) {
    const ry = cy + 4 + r * 14;
    ctx.fillStyle = '#020617';
    ctx.fillRect(cx + 6, ry, w - 12, 11);

    const isBlinking = (Math.floor(globalTick * 0.15 + r) % 3 === 0);
    ctx.fillStyle = ollamaOnline ? (isBlinking ? '#22c55e' : '#15803d') : '#ef4444';
    ctx.fillRect(cx + 10, ry + 4, 4, 3);
    ctx.fillStyle = (r % 2 === 0) ? '#38bdf8' : '#eab308';
    ctx.fillRect(cx + 16, ry + 4, 3, 3);

    ctx.fillStyle = '#334155';
    for (let g = 0; g < 6; g++) {
      ctx.fillRect(cx + 26 + g * 8, ry + 3, 5, 5);
    }
  }
}

function drawCoffeeMachine(cx, cy, w, h) {
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx, cy + 24, w, h - 24);

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(cx + 4, cy + 4, w - 8, 20);
  ctx.fillStyle = '#0369a1';
  ctx.fillRect(cx + 6, cy + 8, w - 12, 6);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 12, cy + 16, 8, 7);

  const vaporY = (globalTick * 0.5) % 8;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillRect(cx + 14 + Math.sin(globalTick * 0.1) * 2, cy + 12 - vaporY, 3, 3);
}

function drawWorkstation(cx, cy, screenColor, label) {
  ctx.fillStyle = PAL.deskBody;
  ctx.fillRect(cx, cy + 20, 3 * TILE, 36);
  ctx.fillStyle = PAL.deskTop;
  ctx.fillRect(cx - 2, cy + 16, 3 * TILE + 4, 10);

  ctx.fillStyle = PAL.monitorCase;
  ctx.fillRect(cx + 26, cy, 44, 30);
  ctx.fillStyle = '#020617';
  ctx.fillRect(cx + 30, cy + 4, 36, 22);

  // Monitor activo
  ctx.fillStyle = screenColor;
  ctx.fillRect(cx + 32, cy + 6, 32, 18);

  // Código en pantalla
  ctx.fillStyle = '#ffffff';
  for (let l = 0; l < 3; l++) {
    const lw = 10 + ((l * 8 + globalTick) % 18);
    ctx.fillRect(cx + 34, cy + 8 + l * 5, lw, 2);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(cx + 34, cy + 22, 28, 5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(cx + 66, cy + 23, 4, 4);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(label, cx + 32, cy + 42);
}

function drawExecutiveDesk(cx, cy) {
  const w = 4 * TILE;
  ctx.fillStyle = PAL.deskWood;
  ctx.fillRect(cx, cy + 16, w, 44);
  ctx.fillStyle = PAL.deskWoodTop;
  ctx.fillRect(cx - 4, cy + 10, w + 8, 12);

  ctx.fillStyle = PAL.carpetBorder;
  ctx.fillRect(cx, cy + 22, w, 3);

  // Laptop executive
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx + 40, cy - 2, 48, 24);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(cx + 42, cy, 44, 20);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 60, cy + 6, 8, 8);

  ctx.fillStyle = '#475569';
  ctx.fillRect(cx + 36, cy + 14, 56, 4);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx + 20, cy + 12, 8, 8);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(cx + 22, cy + 14, 4, 4);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx + 104, cy + 12, 12, 8);
}

function drawSofa(cx, cy) {
  ctx.fillStyle = '#451a03';
  ctx.fillRect(cx, cy, 3 * TILE, 36);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(cx + 4, cy + 4, 3 * TILE - 8, 24);
  for (let c = 0; c < 3; c++) {
    ctx.strokeStyle = '#271003';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 6 + c * 28, cy + 8, 26, 18);
  }
}

// Alfombra de circuito tecnológico (reemplaza la de Pokémon)
function drawCircuitRug(cx, cy, w, h) {
  const rx = cx + w / 2;
  const ry = cy + h / 2;
  const r = w / 2 - 4;

  ctx.save();
  ctx.beginPath();
  ctx.arc(rx, ry, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Borde exterior cyan
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pistas de circuito
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(rx, ry, r * 0.65, 0, Math.PI * 2);
  ctx.stroke();

  // Núcleo central
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(rx - 16, ry - 16, 32, 32);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(rx - 8, ry - 8, 16, 16);

  // Líneas bus
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(rx - r + 8, ry - 1, r * 2 - 16, 2);
  ctx.fillRect(rx - 1, ry - r + 8, 2, r * 2 - 16);

  ctx.restore();
}

function drawPlant(cx, cy) {
  ctx.fillStyle = PAL.plantPot;
  ctx.beginPath();
  ctx.moveTo(cx + 6, cy + 20);
  ctx.lineTo(cx + 26, cy + 20);
  ctx.lineTo(cx + 22, cy + 32);
  ctx.lineTo(cx + 10, cy + 32);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = PAL.plantGreen;
  ctx.beginPath();
  ctx.arc(cx + 12, cy + 12, 10, 0, Math.PI * 2);
  ctx.arc(cx + 20, cy + 10, 11, 0, Math.PI * 2);
  ctx.arc(cx + 16, cy + 6, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(cx + 14, cy + 10, 5, 0, Math.PI * 2);
  ctx.fill();
}

// ── Renderizado del Escenario ─────────────────────────────────
function drawRoom() {
  // 1. Suelo del Laboratorio (Cols 0 a 16)
  for (let c = 0; c < 16; c++) {
    for (let r = 2; r < ROWS; r++) {
      const tileColor = ((c + r) % 2 === 0) ? PAL.labFloor1 : PAL.labFloor2;
      ctx.fillStyle = tileColor;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      ctx.strokeStyle = PAL.labBorder;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(c * TILE, r * TILE, TILE, TILE);
    }
  }

  // 2. Despacho Ejecutivo de Sergio (Cols 16 a 25)
  for (let c = 16; c < COLS; c++) {
    for (let r = 2; r < ROWS; r++) {
      ctx.fillStyle = ((c + r) % 2 === 0) ? PAL.officeWood : PAL.officeWoodDark;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }

  // Alfombra Ejecutiva de Sergio
  const rugX = 17 * TILE;
  const rugY = 3 * TILE;
  const rugW = 7 * TILE;
  const rugH = 10 * TILE;
  ctx.fillStyle = PAL.carpetRed;
  ctx.fillRect(rugX, rugY, rugW, rugH);
  ctx.strokeStyle = PAL.carpetBorder;
  ctx.lineWidth = 3;
  ctx.strokeRect(rugX + 4, rugY + 4, rugW - 8, rugH - 8);

  // 3. Pared Norte
  ctx.fillStyle = PAL.wallTop;
  ctx.fillRect(0, 0, canvas.width, 24);
  ctx.fillStyle = PAL.wallFront;
  ctx.fillRect(0, 24, canvas.width, 2 * TILE - 24);
  ctx.fillStyle = PAL.wallTrim;
  ctx.fillRect(0, 2 * TILE - 4, canvas.width, 4);

  // Ventana
  drawWindow(20 * TILE, 6, 3 * TILE, 44);

  // 4. Tabique divisorio
  const partX = 16 * TILE;
  ctx.fillStyle = PAL.partitionWood;
  ctx.fillRect(partX, 2 * TILE, 8, 5 * TILE);
  ctx.fillStyle = PAL.partitionTrim;
  ctx.fillRect(partX + 8, 2 * TILE, 2, 5 * TILE);

  // Puerta abierta en filas 7-8
  ctx.fillStyle = PAL.partitionTrim;
  ctx.fillRect(partX, 7 * TILE - 4, 10, 4);
  ctx.fillRect(partX, 9 * TILE, 10, 4);

  ctx.fillStyle = PAL.partitionWood;
  ctx.fillRect(partX, 9 * TILE + 4, 8, 6 * TILE - 4);
  ctx.fillStyle = PAL.partitionTrim;
  ctx.fillRect(partX + 8, 9 * TILE + 4, 2, 6 * TILE - 4);

  // Placa de latón
  ctx.fillStyle = '#d97706';
  ctx.fillRect(partX - 18, 5 * TILE, 16, 10);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(partX - 16, 5 * TILE + 4, 12, 2);
}

function drawWindow(x, y, w, h) {
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#020617';
  ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(x + w - 16, y + 16, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.arc(x + w - 20, y + 14, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 10, y + 10, 1, 1);
  ctx.fillRect(x + 24, y + 20, 2, 2);
  ctx.fillRect(x + 45, y + 8, 1, 1);
}

// ── Bucle de Renderizado ──────────────────────────────────────
function render() {
  if (!isPaused) {
    globalTick++;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoom();

  OBJECTS.forEach(obj => {
    obj.draw(obj.x * TILE, obj.y * TILE);
  });

  Object.values(CHARACTERS).forEach(char => {
    char.draw(char.x * TILE, char.y * TILE, globalTick);
  });

  requestAnimationFrame(render);
}

// ── Manejo de Clics ───────────────────────────────────────────
canvas.addEventListener('click', (e) => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const clickX = (e.clientX - rect.left) * scaleX;
  const clickY = (e.clientY - rect.top) * scaleY;

  const tileX = Math.floor(clickX / TILE);
  const tileY = Math.floor(clickY / TILE);

  // 1. Clic en personaje
  for (const char of Object.values(CHARACTERS)) {
    if (Math.abs(tileX - char.x) <= 1 && Math.abs(tileY - char.y) <= 1) {
      char.state = 'talking';
      const randomDialogue = char.dialogues[Math.floor(Math.random() * char.dialogues.length)];
      showDialogue(char.name, randomDialogue, char.color);
      playFanfare();
      setTimeout(() => { char.state = 'working'; }, 3500);
      return;
    }
  }

  // 2. Clic en mueble/máquina
  for (const obj of OBJECTS) {
    if (tileX >= obj.x && tileX < obj.x + obj.w &&
        tileY >= obj.y && tileY < obj.y + obj.h) {
      showDialogue(obj.name, obj.dialogue, '#0f172a');
      playBip(700, 0.05);
      return;
    }
  }

  // 3. Clic en suelo
  if (tileX >= 16) {
    showDialogue("DESPACHO PRIVADO", "Despacho de Sergio. Área de arquitectura y diseño de software.", '#b45309');
  } else {
    showDialogue("LABORATORIO DE IA", "Área de computación local y orquestación de modelos.", '#0284c7');
  }
  playBip(440, 0.03);
});

// ── Integración Real con la API de Ollama ─────────────────────
async function checkOllamaStatus() {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (!res.ok) throw new Error('Ollama no responde');
    const data = await res.json();
    
    ollamaOnline = true;
    const model = data.models && data.models[0] ? data.models[0].name : 'qwen2.5-coder:1.5b';
    activeModelName = model;

    ollamaDot.className = 'status-dot online';
    ollamaStatusText.textContent = `${model} (En línea)`;

    // Comprobar si hay procesos activos en /api/ps
    try {
      const psRes = await fetch('http://localhost:11434/api/ps');
      if (psRes.ok) {
        const psData = await psRes.json();
        ollamaIsProcessing = (psData.models && psData.models.length > 0);
      }
    } catch (e) {}

  } catch (err) {
    ollamaOnline = false;
    ollamaDot.className = 'status-dot offline';
    ollamaStatusText.textContent = 'Desconectado';
  }
}

// Enviar Prompt real a Ollama (localhost:11434)
async function sendPromptToOllama(promptText) {
  initAudio();
  if (!promptText.trim()) return;

  playBip(659, 0.08);
  showDialogue("SERGIO", `Enviando a Qwen Local: "${promptText}"`, '#0284c7');

  CHARACTERS.qwen.state = 'working';
  ollamaIsProcessing = true;

  try {
    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModelName || 'qwen2.5-coder:1.5b',
        prompt: promptText,
        stream: false
      })
    });

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    const reply = (data.response || 'Sin respuesta del modelo').trim();

    ollamaIsProcessing = false;
    CHARACTERS.qwen.state = 'talking';
    showDialogue("QWEN LOCAL", reply, '#16a34a');
    playFanfare();

    setTimeout(() => { CHARACTERS.qwen.state = 'working'; }, 8000);
  } catch (err) {
    ollamaIsProcessing = false;
    CHARACTERS.qwen.state = 'working';
    showDialogue("ERROR OLLAMA", `No se pudo conectar con Ollama en localhost:11434: ${err.message}`, '#ef4444');
  }
}

// Manejo del formulario de terminal interactiva
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = promptInput.value;
  if (!text.trim()) return;
  promptInput.value = '';
  sendPromptToOllama(text);
});

// ── Botones de Acción Rápida ──────────────────────────────────
const actFiles = document.getElementById('act-files');
if (actFiles) {
  actFiles.addEventListener('click', () => openFilesModal());
}

// ── Explorador de Archivos de Python ──────────────────────────
const filesModal = document.getElementById('files-modal');
const btnFiles = document.getElementById('btn-files');
const modalClose = document.getElementById('modal-close');
const filesList = document.getElementById('files-list');
const currentFilename = document.getElementById('current-filename');
const fileContent = document.getElementById('file-content');
const btnAnalyzeQwen = document.getElementById('btn-analyze-qwen');

let loadedFiles = [];
let currentSelectedFile = null;
let currentSelectedCode = '';

async function loadFiles() {
  if (!filesList) return;
  filesList.innerHTML = '<li class="file-item loading">Buscando archivos...</li>';
  try {
    const res = await fetch('/api/files');
    if (!res.ok) throw new Error('No se pudo obtener la lista de archivos');
    const data = await res.json();
    loadedFiles = data.files || [];
    renderFilesList();
    if (loadedFiles.length > 0 && !currentSelectedFile) {
      selectFile(loadedFiles[0].name);
    }
  } catch (err) {
    filesList.innerHTML = `<li class="file-item error">Error: ${err.message}</li>`;
  }
}

function renderFilesList() {
  if (!filesList) return;
  filesList.innerHTML = '';
  if (loadedFiles.length === 0) {
    filesList.innerHTML = '<li class="file-item">No se encontraron archivos .py</li>';
    return;
  }

  loadedFiles.forEach(f => {
    const li = document.createElement('li');
    li.className = 'file-item' + (currentSelectedFile === f.name ? ' active' : '');
    li.textContent = `🐍 ${f.name}`;
    li.addEventListener('click', () => selectFile(f.name));
    filesList.appendChild(li);
  });
}

async function selectFile(filename) {
  currentSelectedFile = filename;
  renderFilesList();
  currentFilename.textContent = `📄 ${filename}`;
  fileContent.textContent = 'Cargando contenido...';
  btnAnalyzeQwen.disabled = true;

  try {
    const res = await fetch(`/api/file?name=${encodeURIComponent(filename)}`);
    if (!res.ok) throw new Error('Error al leer el archivo');
    const data = await res.json();
    currentSelectedCode = data.content || '';
    fileContent.textContent = currentSelectedCode;
    btnAnalyzeQwen.disabled = false;
  } catch (err) {
    fileContent.textContent = `Error al leer archivo: ${err.message}`;
  }
}

function openFilesModal() {
  initAudio();
  playBip(587, 0.06);
  if (filesModal) filesModal.hidden = false;
  loadFiles();
}

function closeFilesModal() {
  if (filesModal) filesModal.hidden = true;
}

if (btnFiles) btnFiles.addEventListener('click', openFilesModal);
if (modalClose) modalClose.addEventListener('click', closeFilesModal);

if (filesModal) {
  filesModal.addEventListener('click', (e) => {
    if (e.target === filesModal) closeFilesModal();
  });
}

if (btnAnalyzeQwen) {
  btnAnalyzeQwen.addEventListener('click', () => {
    if (!currentSelectedFile || !currentSelectedCode) return;
    closeFilesModal();
    const prompt = `Analiza este script en Python de Sergio (${currentSelectedFile}):\n${currentSelectedCode}\nExplícale brevemente qué hace el código en dos oraciones claras.`;
    sendPromptToOllama(prompt);
  });
}

document.getElementById('act-work').addEventListener('click', () => {
  sendPromptToOllama("¿Cuál es la diferencia entre una variable y una constante en programación? Respóndeme en dos oraciones cortas.");
});

document.getElementById('act-coffee').addEventListener('click', () => {
  initAudio();
  playBip(659, 0.08);
  CHARACTERS.sergio.state = 'talking';
  showDialogue("PAUSA PARA CAFÉ", "Sergio va a la cafetera espresso: 'Una buena arquitectura se piensa con una taza de café en mano.'", '#b45309');
  setTimeout(() => { CHARACTERS.sergio.state = 'working'; }, 3500);
});

document.getElementById('act-reunion').addEventListener('click', () => {
  initAudio();
  playFanfare();
  showDialogue("REUNIÓN TÉCNICA", "Sergio reúne al equipo: 'El sistema está limpio y Ollama responde en tiempo real. ¡Continuemos con el sprint!'", '#1d4ed8');
});

document.getElementById('act-info').addEventListener('click', async () => {
  initAudio();
  playBip(587, 0.05);
  await checkOllamaStatus();
  showDialogue("TELEMETRÍA EN TIEMPO REAL", `Ollama: ${ollamaOnline ? 'ACTIVO (localhost:11434)' : 'OFFLINE'} · Modelo: ${activeModelName} · Cloud: Antigravity CLI`, '#334155');
});

// ── Controles de Cabecera ─────────────────────────────────────
btnSound.addEventListener('click', () => {
  initAudio();
  soundEnabled = !soundEnabled;
  btnSound.textContent = soundEnabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF';
  btnSound.style.borderColor = soundEnabled ? '#22c55e' : '#475569';
  if (soundEnabled) playBip(880, 0.1);
});

btnPause.addEventListener('click', () => {
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? '▶ Reanudar' : '⏸ Pausar';
  btnPause.style.borderColor = isPaused ? '#eab308' : '#475569';
});

// ── Inicialización ────────────────────────────────────────────
render();
checkOllamaStatus();
setInterval(checkOllamaStatus, 4000);

setTimeout(() => {
  showDialogue("SERGIO", "¡Centro de Control 2D en línea! Ollama conectado en vivo. Escribe un prompt abajo para probar a Qwen en tiempo real.", '#0284c7');
}, 600);
