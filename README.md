# Laboratorio de IA de Sergio · Centro de Control 2D

Entorno visual pixel-art 2D en tiempo real para supervisión de IA local (Ollama) y orquestación con Antigravity.

## Características

- **Vista 2D Top-Down retro**: Escenario estilo laboratorio/oficina con despacho ejecutivo y área de cómputo.
- **Integración real con Ollama (`localhost:11434`)**:
  - Telemetría en tiempo real: Detección automática del estado del modelo (`qwen2.5-coder:1.5b`).
  - Terminal interactiva para enviar prompts directamente a la IA local.
  - Animación en vivo de procesamiento y tecleo de sprites mientras la IA calcula.
- **Explorador de Archivos de Python integrado**:
  - Visualiza los scripts ubicados en `~/Escritorio/Python/` (`Reto1.py` a `reto4.py`).
  - Botón para solicitar análisis directo de código a Qwen en la interfaz.
- **Cero dependencias externas**: Construido con Canvas HTML5, CSS puro y servidor nativo en Python.

## Ejecución

```bash
cd ~/proyectos/oficina-ia
python3 server.py
# Abre en el navegador: http://localhost:8080
```

## Estructura del Proyecto

- `index.html` — Layout: pantalla de control, terminal de prompts, caja de diálogo y visor de archivos.
- `style.css` — Estilos retro pixel-art responsive.
- `oficina.js` — Motor de renderizado en canvas 2D, interactividad, WebAudio 8-bit y cliente API de Ollama.
- `server.py` — Servidor HTTP nativo en Python con endpoints para servir la app y leer scripts de Python.
