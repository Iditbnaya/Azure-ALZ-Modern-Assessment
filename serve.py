#!/usr/bin/env python3
"""
Simple HTTP Server for ALZ Assessment Tool Testing
Serves the web application with proper CORS headers for local development.
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support for local development."""
    
    def end_headers(self):
        """Add CORS headers to all responses."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle preflight OPTIONS requests."""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[{self.address_string()}] {format % args}")

def open_browser(url, delay=3):
    """Open browser after a delay."""
    def delayed_open():
        time.sleep(delay)
        try:
            webbrowser.open(url)
            print(f"🌐 Opened browser at {url}")
        except Exception as e:
            print(f"⚠️  Could not open browser automatically: {e}")
            print(f"Please visit manually: {url}")
    
    # Start browser opening in background thread
    threading.Thread(target=delayed_open, daemon=True).start()

def main():
    """Start the development server."""
    # Serve from the web-assessment directory
    script_dir = Path(__file__).parent
    web_dir = script_dir / 'web-assessment'
    
    if web_dir.exists():
        os.chdir(web_dir)
        print(f"📁 Serving from: {web_dir}")
    else:
        print(f"❌ Web directory not found: {web_dir}")
        print("Please run this script from the project root directory.")
        sys.exit(1)
    
    # Configuration
    PORT = 8000
    HOST = 'localhost'
    
    # Check if port is available
    try:
        with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
            app_url = f"http://{HOST}:{PORT}/index.html"
            
            print(f"🚀 ALZ Assessment Tool Development Server")
            print(f"📡 Server starting at http://{HOST}:{PORT}/")
            print(f"🧪 Test page available at http://{HOST}:{PORT}/test.html")
            print(f"📊 Main app available at {app_url}")
            print(f"🌐 Opening browser in 3 seconds...")
            print(f"")
            print(f"Press Ctrl+C to stop the server")
            print(f"{'='*60}")
            
            # Open browser automatically
            open_browser(app_url, delay=3)
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print(f"\n🛑 Server stopped by user")
                httpd.shutdown()
                
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} is already in use.")
            print(f"Try a different port or stop the other process.")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()