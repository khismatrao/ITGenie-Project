from fastapi import FastAPI
from app.rag_chain import get_answer
from app.models.schemas import QueryRequest, QueryResponse
 
app = FastAPI()
 
@app.post("/ask", response_model=QueryResponse)
def ask_question(request: QueryRequest):
    response = get_answer(request.query)
    return QueryResponse(query=request.query, answer=response)