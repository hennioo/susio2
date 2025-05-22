from flask import Flask, send_from_directory, redirect
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def home():
    return redirect('/darkmode.html')

@app.route('/<path:path>')
def serve_file(path):
    if os.path.exists(os.path.join('public', path)):
        return send_from_directory('public', path)
    return send_from_directory('static', path)
