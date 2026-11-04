# AGENTS.md — La Oficina de IA de Sergio

Contexto para cualquier agente que trabaje en este repositorio.

## Qué es

Habitación isométrica pixel-art ("Habbo de IAs") en **JS puro, sin dependencias**.
Una sola planta con el despacho de Sergio detrás de un tabique de nogal.
Build actual: **0.3**. El estado de los personajes es **simulado** (hito 2 pendiente).

## Cómo correr

```bash
cd ~/proyectos/oficina-ia
python3 -m http.server 8080
# abre http://127.0.0.1:8080
```

También se puede abrir `index.html` directamente en el navegador.

## Mapa del código

- `index.html` — topbar, canvas `#sala`, panel lateral (roster, ficha, leyenda).
- `style.css` — tema retro oscuro, layout responsive, scanlines.
- `oficina.js` — render y simulación:
  - `CAST` — personajes (Sergio, Qwen, Pulse, Gemini).
  - `DESKS`, `S_*`, `OBSTACLES` — layout y colisiones.
  - `makeSprite` — sprites 16×20 dibujados por código, escalados ×3.
  - `drawFloor`, `drawWalls`, `drawPartition`, `draw*` — suelo, paredes y mobiliario.
  - `furniture` + `render()` — *depth sort* por `x + y`.
  - `updateNPC` / `decideNext` — máquina de estados de los NPCs.
  - `renderRoster`, `renderFicha` — panel lateral.
- `CONTEXTO-2026-11-03.md` — bitácora de la sesión de descubrimiento.
- `README.md` — resumen para humanos.

## Convenciones

- **Español informal** en docs, comentarios y respuestas.
- **JS puro**: sin build, sin dependencias, sin frameworks.
- Mantener la estética: nogal, latón, cuero, ámbar + acentos teal.
- No cambiar la paleta global sin pedir una captura al usuario.
- Todo cambio visual se valida con `node --check oficina.js` y, si toca render, con **captura del usuario** (no hay navegador headless en la máquina).
- No guardar API keys ni secretos en el repo.

## Verificación mínima

```bash
node --check oficina.js
```

El smoke test histórico vive en `/tmp/opencode/smoke.js` (puede desaparecer).
Si no existe, recrearlo o pedir permiso antes de asumir que pasó.

## Equipo de agentes

| Agente | Modo | Rol |
|---|---|---|
| `orquestador` | primary | Reparte trabajo, revisa y decide. No implementa código. |
| `pulse-dev` | subagent | Implementa cambios en `oficina.js`, `style.css`, `index.html`. |
| `qwen-local` | subagent | Tareas baratas y offline con Ollama; solo lectura. |
| `gemini-qa` | subagent | QA visual, capturas y accesibilidad; solo lectura. |
| `revisor` | subagent | Code review por severidad; no edita. |

## Estado de la build 0.3 (tras los fixes)

Arreglado:

1. **Colisión del tabique**: los NPCs solo cruzan `PART_X` por la franja de la puerta (`DOOR_Y0..DOOR_Y1`); fuera de ella se deslizan hacia el centro de la puerta.
2. **Depth sort del tabique**: el cuerpo se trocea en tramos de 0.5 unidades y entra en la lista ordenada por `x + y`; postes, dintel y placa SERGIO se dibujan por separado.
3. **Roster sin parpadeo**: se construye una vez y solo se actualiza el estado y la clase `active`.

Pendiente:

4. El servidor 8080 no siempre está levantado.
5. **Hito 2**: estados reales vía Ollama `/api/ps`, API de OpenCode y logs de Antigravity.
6. **Validación visual** de los fixes con captura del usuario (no hay navegador headless).
