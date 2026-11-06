#!/usr/bin/env python3
"""
Servidor local para el Centro de Control de IA de Sergio.
Sirve la interfaz web estática y expone endpoints de telemetría y APIs:
- /api/ollama/status: Consulta el estado real de Ollama (localhost:11434)
- /api/ollama/generate: Proxy seguro para enviar prompts a Ollama
- /api/antigravity/status: Telemetría real de la sesión de Antigravity (tokens, modelo, pasos)
- /api/files y /api/file: Explorador de scripts de Python en ~/Escritorio/Python/
Sin dependencias externas (solo biblioteca estándar de Python).
"""

import http.server
import json
import os
import socketserver
import urllib.error
import urllib.parse
import urllib.request

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_DIR = os.path.expanduser('~/Escritorio/Python')
CONVERSATION_ID = '545ad4be-df02-4840-abee-aa36afd06b61'
TRANSCRIPT_PATH = os.path.expanduser(
    f'~/.gemini/antigravity-cli/brain/{CONVERSATION_ID}/.system_generated/logs/transcript.jsonl'
)


def get_antigravity_telemetry():
  """Lee el transcript de la sesión activa para obtener tokens reales y estado."""
  in_tokens, out_tokens, steps = 0, 0, 0
  if os.path.isfile(TRANSCRIPT_PATH):
    try:
      with open(TRANSCRIPT_PATH, 'r', encoding='utf-8', errors='replace') as f:
        for line in f:
          if not line.strip():
            continue
          d = json.loads(line)
          in_tokens += d.get('input_tokens', 0)
          out_tokens += d.get('output_tokens', 0)
          steps += 1
    except Exception:
      pass

  return {
      'model': 'Gemini 3.8 Flash (High)',
      'status': 'En línea (Supervisando)',
      'session_id': CONVERSATION_ID[:8] + '...',
      'input_tokens': in_tokens,
      'output_tokens': out_tokens,
      'total_tokens': in_tokens + out_tokens,
      'steps': steps,
  }


def query_ollama_status():
  """Consulta el estado del servidor local de Ollama en localhost:11434."""
  try:
    req = urllib.request.Request('http://127.0.0.1:11434/api/tags')
    with urllib.request.urlopen(req, timeout=2.5) as resp:
      data = json.loads(resp.read().decode())
      models = data.get('models', [])
      model_name = models[0]['name'] if models else 'qwen2.5-coder:1.5b'

    # Consultar si está procesando actualmente
    processing = False
    try:
      req_ps = urllib.request.Request('http://127.0.0.1:11434/api/ps')
      with urllib.request.urlopen(req_ps, timeout=1.5) as resp_ps:
        data_ps = json.loads(resp_ps.read().decode())
        processing = len(data_ps.get('models', [])) > 0
    except Exception:
      pass

    return {
        'online': True,
        'model': model_name,
        'models': [m.get('name') for m in models],
        'processing': processing,
    }
  except Exception as e:
    return {'online': False, 'model': None, 'error': str(e)}


class StudioHandler(http.server.SimpleHTTPRequestHandler):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=BASE_DIR, **kwargs)

  def _send_json(self, data, code=200):
    self.send_response(code)
    self.send_header('Content-Type', 'application/json')
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
    self.end_headers()
    self.wfile.write(json.dumps(data).encode('utf-8'))

  def do_GET(self):
    parsed = urllib.parse.urlparse(self.path)

    # 1. Telemetría de Antigravity en vivo
    if parsed.path == '/api/antigravity/status':
      return self._send_json(get_antigravity_telemetry())

    # 2. Estado de Ollama en vivo
    if parsed.path == '/api/ollama/status':
      return self._send_json(query_ollama_status())

    # 3. Listar scripts de Python
    if parsed.path == '/api/files':
      files = []
      if os.path.isdir(PYTHON_DIR):
        for f in sorted(os.listdir(PYTHON_DIR)):
          if f.endswith('.py'):
            fpath = os.path.join(PYTHON_DIR, f)
            files.append({
                'name': f,
                'size': os.path.getsize(fpath),
                'mtime': os.path.getmtime(fpath),
            })
      return self._send_json({'files': files})

    # 4. Leer script específico
    if parsed.path == '/api/file':
      qs = urllib.parse.parse_qs(parsed.query)
      filename = qs.get('name', [''])[0]
      safe_name = os.path.basename(filename)
      filepath = os.path.join(PYTHON_DIR, safe_name)

      if os.path.isfile(filepath):
        with open(filepath, 'r', encoding='utf-8', errors='replace') as fp:
          content = fp.read()
        return self._send_json({'name': safe_name, 'content': content})
      else:
        return self._send_json({'error': 'Archivo no encontrado'}, 404)

    # Para todo lo demás, servir archivos estáticos con no-cache para desarrollo
    return super().do_GET()

  def do_POST(self):
    parsed = urllib.parse.urlparse(self.path)

    # Proxy para generación con Ollama
    if parsed.path == '/api/ollama/generate':
      content_length = int(self.headers.get('Content-Length', 0))
      body_bytes = self.rfile.read(content_length)

      try:
        body_json = json.loads(body_bytes.decode('utf-8'))
        if not body_json.get('model'):
          body_json['model'] = 'qwen2.5-coder:1.5b'
        body_bytes = json.dumps(body_json).encode('utf-8')

        req = urllib.request.Request(
            'http://127.0.0.1:11434/api/generate',
            data=body_bytes,
            headers={'Content-Type': 'application/json'},
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
          resp_data = json.loads(resp.read().decode())
          return self._send_json(resp_data)
      except Exception as e:
        return self._send_json(
            {'error': f'Fallo de comunicación con Ollama: {str(e)}'}, 502
        )

    self.send_error(404, 'Endpoint no encontrado')


if __name__ == '__main__':
  socketserver.TCPServer.allow_reuse_address = True
  with socketserver.TCPServer(('', PORT), StudioHandler) as httpd:
    print(f'Servidor activo en http://localhost:{PORT}')
    try:
      httpd.serve_forever()
    except KeyboardInterrupt:
      pass
