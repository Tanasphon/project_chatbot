from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain

class GameChatbot:
    def __init__(self, rag_engine):
        try:
            self.llm = ChatOpenAI(temperature=0.7)
            self.rag_engine = rag_engine
            if not self.rag_engine.vector_store:
                raise ValueError("RAG engine vector store not initialized")
            self.chain = ConversationalRetrievalChain.from_llm(
                self.llm,
                retriever=self.rag_engine.vector_store.as_retriever(),
                return_source_documents=True
            )
        except Exception as e:
            print(f"Error initializing Chatbot: {e}")
            raise
        
    def get_response(self, question, chat_history=[]):
        try:
            response = self.chain({"question": question, "chat_history": chat_history})
            return response["answer"]
        except Exception as e:
            print(f"Error getting response: {e}")
            return f"ขออภัย เกิดข้อผิดพลาด: {str(e)}" 