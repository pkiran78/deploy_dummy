# backend/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

class MessagePayload(BaseModel):
    message: str = ""

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running!"}

@app.post("/chat")
async def chat_endpoint(payload: MessagePayload, request: Request):
    # Log headers and raw body for debugging
    try:
        raw_body = await request.body()
        logger.info("Request headers: %s", dict(request.headers))
        logger.info("Raw body bytes: %s", raw_body)
    except Exception as e:
        logger.exception("Could not read raw body: %s", e)

    user_message = payload.message
    logger.info("Parsed payload.message: %r", user_message)

    # Simple echo response
    response = f"AI Response to: {user_message}"
    return {"reply": response, "received": {"message": user_message}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
