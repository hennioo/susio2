from flask import Flask, send_from_directory, redirect, jsonify
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def home():
    return redirect('/darkmode.html')

@app.route('/api-info')
def api_info():
    return jsonify({"status": "online", "message": "API is working"})

@app.route('/verify-access', methods=['POST'])
def verify_access():
    return jsonify({"success": True, "sessionId": "test-session-123"})

@app.route('/api/locations')
def get_locations():
    return jsonify({"success": True, "data": []})

@app.route('/api/stats')
def get_stats():
    return jsonify({"success": True, "data": {"totalLocations": 0, "totalImages": 0}})

@app.route('/<path:path>')
def serve_file(path):
    if os.path.exists(os.path.join('public', path)):
        return send_from_directory('public', path)
    return send_from_directory('static', path)
