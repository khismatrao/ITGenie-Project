from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Qdrant
from langchain_community.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA
from app.config import settings
 
def get_answer(query: str) -> str:
    embeddings = OpenAIEmbeddings(openai_api_key=settings.OPENAI_API_KEY)
    vectorstore = Qdrant(
        url=settings.QDRANT_URL,
        embeddings=embeddings,
        collection_name="it_docs"
    )
    qa = RetrievalQA.from_chain_type(
        llm=ChatOpenAI(openai_api_key=settings.OPENAI_API_KEY),
        retriever=vectorstore.as_retriever()
    )
    return qa.run(query)