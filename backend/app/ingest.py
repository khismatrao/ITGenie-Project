import os
import fitz  # PyMuPDF
from app.config import settings
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Qdrant
 
def load_text_from_files(folder="downloaded_docs"):
    texts = []
    for filename in os.listdir(folder):
        if filename.endswith(".pdf"):
            with fitz.open(os.path.join(folder, filename)) as doc:
                text = ""
                for page in doc:
                    text += page.get_text()
                texts.append(text)
    return texts

def ingest_documents():
    texts = load_text_from_files()
    embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
    db = Qdrant.from_texts(
        texts=texts,
        embedding=embeddings,
        url=settings.QDRANT_URL,
        collection_name="it_docs"
    )
    print("✅ Documents embedded and stored in Qdrant")