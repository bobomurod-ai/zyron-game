import os
import sys
import threading
import socket
from http.server import SimpleHTTPRequestHandler, HTTPServer
import webview

def get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

def get_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class CustomHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=get_base_dir(), **kwargs)

    def log_message(self, format, *args):
        pass  # Suppress console logs for clean execution

def start_server(port):
    server = HTTPServer(('127.0.0.1', port), CustomHandler)
    server.serve_forever()

def main():
    port = get_free_port()
    server_thread = threading.Thread(target=start_server, args=(port,), daemon=True)
    server_thread.start()

    url = f'http://127.0.0.1:{port}/index.html'

    window = webview.create_window(
        title='ZYRON - 2D Kosmik Jang va Sarguzasht O\'yini',
        url=url,
        width=1150,
        height=800,
        resizable=True,
        min_size=(840, 620),
        background_color='#040814'
    )
    webview.start(gui='edgechromium', debug=False)

if __name__ == '__main__':
    main()
