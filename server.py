#!/usr/bin/env python3
"""
Servidor local para el Centro de Control de IA de Sergio.
Sirve la interfaz web estática y expone endpoints ligeros para listar
y visualizar los scripts personales de Python en ~/Escritorio/Python/.
Sin dependencias externas (solo biblioteca estándar de Python).
"""

import http.server
import json
import os
import socketserver
import urllib.parse

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_DIR = os.path.expanduser('~/Escritorio/Python')


class StudioHandler(http.server.SimpleHTTPRequestHandler):

  def __init__(self, *args, **kwargs):
    super().__init__(*args, directory=BASE_DIR, **kwargs)

  def do_GET(self):
    parsed = urllib.parse.urlparse(self.path)

    # API: Listar scripts en ~/Escritorio/Python
    if parsed.path == '/api/files':
      self.send_response(200)
      self.send_header('Content-Type', 'application/json')
      self.send_header('Access-Control-Allow-Origin', '*')
      self.end_headers()
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
      self.wfile.write(json.dumps({'files': files}).encode('utf-8'))
      return

    # API: Leer el contenido de un script
    if parsed.path == '/api/file':
      qs = urllib.parse.parse_qs(parsed.query)
      filename = qs.get('name', [''])[0]
      safe_name = os.path.basename(filename)
      filepath = os.path.join(PYTHON_DIR, safe_name)

      if os.path.isfile(filepath):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        with open(filepath, 'r', encoding='utf-8', errors='replace') as fp:
          content = fp.read()
        self.wfile.write(
            json.dumps({'name': safe_name, 'content': content}).encode('utf-8')
        )
      else:
        self.send_error(404, 'Archivo no encontrado')
      return

    # Para todo lo demás, servir archivos estáticos (index.html, style.css, oficina.js)
    return super().do_GET()


if __name__ == '__main__':
  socketserver.TCPServer.allow_reuse_address = True
  with socketserver.TCPServer(('', PORT), StudioHandler) as httpd:
    print(f'Servidor activo en http://localhost:{PORT}')
    try:
      httpd.serve_forever()
    except KeyboardInterrupt:
      pass
