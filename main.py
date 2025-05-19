from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return 'Flask server running. Please use the Node.js server for the main application.'
