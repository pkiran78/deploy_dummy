import json
import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from groq import Groq
from pydantic import BaseModel
from pypdf import PdfReader


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("backend")

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

model = "openai/gpt-oss-120b"
app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RESUME_PATH = Path("my_resume.pdf")

#parse resume
class Experience(BaseModel):
    company: str | None = None
    role: str | None = None
    duration: str | None = None
    description: str | None = None
    skills_used: list[str] = []

class Resume(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None

    total_experience_years: float | None = None

    skills: list[str] = []
    experiences: list[Experience] = []
    education: list[str] = []
    projects: list[str] = []
    certifications: list[str] = []
resume_schema = Resume.model_json_schema()

class ChatRequest(BaseModel):
    question: str

class MessagePayload(BaseModel):
    message: str = ""

def ask_candidate(question: str, resume: Resume):

    system_prompt = f"""
You are an AI assistant representing a job candidate to recruiters and hiring professionals.

Below is everything you know about the candidate:

{resume.model_dump_json(indent=2)}

Rules:
1. Answer ONLY using the information provided above. Never hallucinate or invent details.
2. If information is not available, say: "I don't have enough information to answer that."
3. Be professional, concise, and clear.
4. ALWAYS format your response using Markdown:
   - Use **bold** for company names, technologies, and key terms.
   - Use bullet points (`-`) for lists of items like skills, companies, or responsibilities.
   - Use numbered lists for ordered information (e.g., steps, ranked experience).
   - Use `###` headings to separate distinct sections when answering multi-part questions.
   - Use a table if comparing multiple items (e.g., skills across companies).
   - Keep responses focused and well-structured — avoid walls of text.
5. When listing companies or experiences, include the role, company, and duration on the same line.
"""

    response = client.chat.completions.create(

        model=model,

        messages=[

            {
                "role":"system",
                "content":system_prompt
            },

            {
                "role":"user",
                "content":question
            }

        ]

    )
    print(f"\n\nask_candidate response is: {response}\n\n")
    return response.choices[0].message.content

def parse_resume(resume_text):
    system_prompt = f"""
    You are an expert resume parser.

    Extract information from the resume based on its meaning,
    not only based on exact section headings.

    Different resumes may use different headings.

    For example:
    - Experience
    - Professional Experience
    - Work History
    - Employment
    - Internships

    These may all contain relevant experience.

    Skills may also appear in the skills section, work experience,
    internships or projects.

    Return ONLY valid JSON matching this schema:

    {resume_schema}

    Important rules:

    1. Do not invent information.
    2. If a value is not available, return null.
    3. If a list has no information, return an empty list.
    4. Include internships inside experiences.
    5. Extract skills mentioned across the entire resume.
    """
    user_prompt = f"""
    Parse the following resume:

    {resume_text}
    """
    message_system={
        "role" : "system",
        "content" : system_prompt
    }
    message_user={
        "role" : "user",
        "content" : user_prompt
    }
    messages=[message_system, message_user]
    response_format={
        "type": "json_object"
    }
    response=client.chat.completions.create(model=model, messages=messages, response_format=response_format)
    raw_output = response.choices[0].message.content
    data = json.loads(raw_output)
    resume = Resume(**data)
    print(f"\n\nparse_resume resume is: {resume}\n\n")
    return resume

#pdf extraction
def read_pdf(file_path: Path):

    reader = PdfReader(file_path)

    text = ""

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"
    print(f"read_pdf text is: {text}")
    return text

@app.get("/")
def home():
    return {
        "message" : "Ye home page hai"
    }

@app.get("/resume")
def download_resume():
    """Serve the resume PDF for download."""
    if not RESUME_PATH.exists():
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Resume not found")
    return FileResponse(
        path=RESUME_PATH,
        media_type="application/pdf",
        filename="Kiran_Resume.pdf",
        headers={"Content-Disposition": "attachment; filename=Kiran_Resume.pdf"}
    )

@app.post("/chat")
def chat(payload: MessagePayload, request: Request):
    try:
        raw_body = request.body()
        logger.info("Request headers: %s", dict(request.headers))
        logger.info("Raw body bytes: %s", raw_body)
    except Exception as e:
        logger.exception("Could not read raw body: %s", e)

    user_message = payload.message
    logger.info("Parsed payload.message: %r", user_message)
    resume_text=read_pdf(RESUME_PATH)
    resume=parse_resume(resume_text)
    answer=ask_candidate(user_message, resume)
    return {"reply": answer, "received": {"message": user_message}}