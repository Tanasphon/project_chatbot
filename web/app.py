from flask import Flask, render_template, request, jsonify
import os
import sys

# Add parent directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from src.chatbot import GameChatbot
from src.rag_engine import GameRAGEngine
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Initialize RAG engine and chatbot
rag_engine = GameRAGEngine()

# Load initial game data
data_path = os.path.join(parent_dir, 'data', 'game_info.json')
game_files = [data_path]

try:
    rag_engine.load_data(game_files)
except Exception as e:
    print(f"Error loading game data: {e}")

chatbot = GameChatbot(rag_engine)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        message = request.json['message']
        response = chatbot.get_response(message)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 