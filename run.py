import os
import sys
from dotenv import load_dotenv

def check_dependencies():
    try:
        import flask
        import langchain
        import faiss
        import torch
        import transformers
        import sentence_transformers
        print("All dependencies are installed.")
        return True
    except ImportError as e:
        print(f"Missing dependency: {e}")
        return False

if __name__ == "__main__":
    # Add the current directory to Python path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.append(current_dir)
    
    if not check_dependencies():
        print("Please run setup.bat first to install all required dependencies")
        sys.exit(1)
    
    # Import app after adding to path
    from web.app import app
    
    print("Starting Game Chatbot...")
    app.run(debug=True, host='0.0.0.0', port=5000) 