# La Oficina de IA de Sergio

Habbo de IAs: una sala isométrica pixel-art — **una única planta compartida** con un cuarto privado para Sergio (tabique de nogal con puerta y placa de latón) dentro del mismo render.

## Personajes (build 0.1 — solo visual)

| Personaje | Representa | Frases | Hardware |
|---|---|---|---|
| **Sergio** | Tú (humano, el jefe) — moreno, pelo rizado, americana navy | español natural + frases de mandamás dentro de su cuarto | tu PC pop-os |
| **Qwen** | `qwen2.5-coder:1.5b` (Ollama, local) | "0 tokens gastados" | local, offline |
| **Pulse** | OpenCode · `opencode/pulse-alpha-free` | "Tests en verde" | nube OpenCode Console |
| **Gemini** | Google Antigravity (`agy`) | "Verificando en el navegador…" | Google |

DeepSeek / dsh quedan fuera a propósito (todavía no dominado). Gemma (OpenRouter) tampoco entra porque pasa por dsh.

## Correr

No hay dependencias. Dos opciones:

```bash
# opción A: servidor estático
cd ~/proyectos/oficina-ia
python3 -m http.server 8080
# abre http://127.0.0.1:8080

# opción B: abre index.html directamente en el navegador
```

## Controles

- El cuarto de Sergio está **a la derecha del tabique**: escritorio de caoba, silla ejecutiva, librería, sofá chesterfield, alfombra persa, lámpara de pie y ventanal nocturno con luna. Su cuarto y la zona común son un solo render: todo el mundo puede entrar y si Sergio está dentro, suelta otras frases.
- **Pausar / Reanudar** — congela la simulación.
- **Repartir** — manda a todos a pasear por la sala.
- **Sonido** — blip retro al fichar un personaje (WebAudio, desactivado por defecto).
- **Clic en un personaje o en el roster** — abre su ficha (nombre, modelo, hardware, estado simulado) y hace que salude.

## Hito 2 (siguiente): estado real

Los estados ahora mismo son simulados. El plan:

1. **Ollama**: `GET http://127.0.0.1:11434/api/ps` → si hay modelo cargado y quién.
2. **OpenCode**: API local (`opencode api get /api/...`) o `~/.dsh` → sesiones activas.
3. **Antigravity**: logs en `~/.gemini/antigravity*/cli.log`.
4. Un pequeño backend (o el propio canvas haciendo polling) que pinte Tecleando/Pensando según datos reales.

## Estructura

- `index.html` — layout: topbar, canvas, panel lateral (roster + ficha + leyenda)
- `style.css` — tema retro oscuro
- `oficina.js` — isometría, sprites pixel-art dibujados por código, máquina de estados de NPCs, interacción
