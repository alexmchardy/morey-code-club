"""
code-mob Python server — DreamHost backup
Uses polling (no WebSocket dependency). Room screen detects wsSupported: false
and falls back to polling /admin/state every 500ms.
"""

import os
import re
import socket
import time
from collections import deque
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

PORT = int(os.environ.get('PORT', 3000))
TUNNEL_URL = os.environ.get('TUNNEL_URL', None)
ACTIVE_GAME = os.environ.get('GAME', 'pixel-poke')

GRID_SIZE = 40
NAMED_COLORS = {'cyan', 'pink', 'yellow', 'green', 'red', 'purple', 'white', 'orange'}
HEX_COLOR_RE = re.compile(r'^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$')

def is_valid_color(c):
    return c in NAMED_COLORS or bool(HEX_COLOR_RE.match(c))
MAX_LOG = 50

# ─── State ────────────────────────────────────────────────────────────────────

state = {
    'game': 'pixel-poke',
    'paused': False,
    'startTime': int(time.time() * 1000),
    'pixels': {},    # "x,y" → { color, name, timestamp }
    'students': {},  # name → { pixelCount, lastSeen }
    'log': deque(maxlen=MAX_LOG),
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

def state_snapshot():
    return {
        'game': state['game'],
        'paused': state['paused'],
        'startTime': state['startTime'],
        'pixels': state['pixels'],
        'students': state['students'],
        'log': list(state['log']),
    }

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return redirect(f'/game/{ACTIVE_GAME}/student')

@app.route('/room')
def room_redirect():
    return redirect(f'/game/{ACTIVE_GAME}/room')

@app.route('/game/<name>/student')
def student(name):
    return send_from_directory(f'public/games/{name}', 'student.html')

@app.route('/game/<name>/room')
def room(name):
    return send_from_directory(f'public/games/{name}', 'room.html')

@app.route('/admin')
def admin():
    return send_from_directory('public', 'admin.html')

# ─── Admin API ────────────────────────────────────────────────────────────────

@app.route('/admin/info')
def admin_info():
    return jsonify({
        'localIp': get_local_ip(),
        'port': PORT,
        'tunnelUrl': TUNNEL_URL,
        'activeGame': ACTIVE_GAME,
        'wsSupported': False,
    })

@app.route('/admin/state')
def admin_state():
    return jsonify(state_snapshot())

@app.route('/admin/clear', methods=['POST'])
def admin_clear():
    state['pixels'].clear()
    state['students'].clear()
    state['log'].clear()
    state['startTime'] = int(time.time() * 1000)
    return jsonify({'ok': True})

@app.route('/admin/pause', methods=['POST'])
def admin_pause():
    state['paused'] = not state['paused']
    return jsonify({'paused': state['paused']})

@app.route('/admin/broadcast', methods=['POST'])
def admin_broadcast():
    data = request.get_json() or {}
    message = data.get('message', '')
    if not message or not isinstance(message, str):
        return jsonify({'error': 'message is required'}), 400
    # Store as a pending broadcast — clients will pick it up on next poll
    state['pendingBroadcast'] = message[:200]
    return jsonify({'ok': True})

@app.route('/admin/broadcast/consume', methods=['POST'])
def consume_broadcast():
    msg = state.pop('pendingBroadcast', None)
    return jsonify({'message': msg})

# ─── Pixel Poke ───────────────────────────────────────────────────────────────

@app.route('/game/pixel-poke/pixel', methods=['POST'])
def pixel():
    if state['paused']:
        return jsonify({'error': 'Game is paused'}), 403

    data = request.get_json() or {}
    x = data.get('x')
    y = data.get('y')
    color = data.get('color')
    name = str(data.get('name', 'Anonymous')).strip()[:20] or 'Anonymous'

    if (
        not isinstance(x, int) or not isinstance(y, int) or
        x < 0 or x >= GRID_SIZE or y < 0 or y >= GRID_SIZE
    ):
        return jsonify({'error': f'x and y must be integers 0–{GRID_SIZE - 1}'}), 400

    if not is_valid_color(color):
        return jsonify({'error': 'color must be a named color (cyan, pink, ...) or a hex code like #ff0000'}), 400

    key = f'{x},{y}'
    ts = int(time.time() * 1000)

    state['pixels'][key] = {'color': color, 'name': name, 'timestamp': ts}

    if name not in state['students']:
        state['students'][name] = {'pixelCount': 0, 'lastSeen': ts}
    state['students'][name]['pixelCount'] += 1
    state['students'][name]['lastSeen'] = ts

    event = {'x': x, 'y': y, 'color': color, 'name': name, 'timestamp': ts}
    state['log'].appendleft(event)

    pixel_count = state['students'][name]['pixelCount']
    return jsonify({'ok': True, 'pixelCount': pixel_count})

# ─── Start ────────────────────────────────────────────────────────────────────

if __name__ == '__main__':
    ip = get_local_ip()
    print(f'\ncode-mob server running!')
    print(f'  Local:   http://localhost:{PORT}')
    print(f'  Network: http://{ip}:{PORT}')
    print(f'  Room:    http://{ip}:{PORT}/room')
    print(f'  Admin:   http://{ip}:{PORT}/admin')
    if TUNNEL_URL:
        print(f'  Tunnel:  {TUNNEL_URL}')
    print('')
    app.run(host='0.0.0.0', port=PORT, debug=False)
