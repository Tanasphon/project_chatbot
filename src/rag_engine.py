from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import CharacterTextSplitter
from langchain.docstore.document import Document
from .utils.file_handler import load_json_file
import os

class GameRAGEngine:
    def __init__(self):
        try:
            self.embeddings = OpenAIEmbeddings()
            self.vector_store = None
        except Exception as e:
            print(f"Error initializing RAG Engine: {e}")
            raise
        
    def load_data(self, json_files):
        try:
            documents = []
            for file in json_files:
                data = load_json_file(file)
                if not data:
                    continue
                    
                # Convert games data to documents
                for game in data['games']:
                    text = f"""
                    Title: {game['title']}
                    Platform: {game['platform']}
                    Genre: {game['genre']}
                    Release Date: {game['release_date']}
                    Description: {game['description']}
                    """
                    doc = Document(
                        page_content=text,
                        metadata={"source": game['title']}
                    )
                    documents.append(doc)
                
            text_splitter = CharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            
            texts = text_splitter.split_documents(documents)
            
            if texts:
                self.vector_store = FAISS.from_documents(texts, self.embeddings)
                print("Vector store initialized successfully")
            else:
                raise ValueError("No documents to process")
            
        except Exception as e:
            print(f"Error loading data: {e}")
            raise

    def query(self, question):
        if not self.vector_store:
            return "ฐานข้อมูลยังไม่พร้อม"
            
        try:
            relevant_docs = self.vector_store.similarity_search(question)
            return relevant_docs
        except Exception as e:
            print(f"Error querying: {e}")
            return f"เกิดข้อผิดพลาด: {str(e)}"

    def load_game_data(self):
        try:
            with open('data/game_info.json', 'r', encoding='utf-8') as f:
                game_data = json.load(f)
            return game_data
        except Exception as e:
            print(f"Error loading game data: {e}")
            return None 

def download_file(url, local_filename):
    import requests
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        with open(local_filename, 'wb') as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    return local_filename 