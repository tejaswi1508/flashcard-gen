from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import yt_dlp
import os
from openai import OpenAI
from groq import Groq
from dotenv import load_dotenv
import tempfile
import shutil

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))  # We'll get you a free key in 10 sec

class Flashcard(BaseModel):
    front: str
    back: str

@app.post("/generate")
async def generate_flashcards(url: str = Form(...)):
    # 1. Download audio or extract text
    text = await extract_text(url)
    
    # 2. Generate flashcards with Groq
    flashcards = await create_flashcards(text)
    
    return {"flashcards": flashcards}

async def extract_text(url: str) -> str:
    if "youtube.com" in url or "youtu.be" in url:
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'outtmpl': 'audio.%(ext)s',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'wav',
            }],
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            audio_file = "audio.wav"
            
        # Transcribe with Groq Whisper (free!)
        with open(audio_file, "rb") as f:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=f,
                response_format="text"
            )
        os.remove(audio_file)
        return transcription
    else:
        # Simple article scraper (we'll improve later)
        import requests
        from bs4 import BeautifulSoup
        html = requests.get(url).text
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()[:15000]

async def create_flashcards(text: str):
    response = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": "You are an expert flashcard creator. Create 15-25 high-quality flashcards from the text. Output ONLY JSON array of objects with 'front' and 'back' keys. No explanations."},
            {"role": "user", "content": f"Text: {text[:12000]}"}
        ],
        temperature=0.7,
        max_tokens=4000
    )
    import json
    try:
        data = json.loads(response.choices[0].message.content.strip("```json\n").strip("```"))
        return data
    except:
        return [{"front": "Error parsing AI response", "back": str(response.choices[0].message.content)}]