from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database import supabase
from models import SourceCreate, Source
from crawler import crawl_ftp
import bcrypt
from pydantic import BaseModel



class AuthSetup(BaseModel):
    password: str

class AuthLogin(BaseModel):
    password: str


INDEXING_STATE = {
   "is_running": False,
   "current_source": None,
   "current_path": None,
   "directories_found": 0,
   "logs": []
}

# ... (Existing code) ...

app = FastAPI(title="FTP Finder Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/auth/status")
def get_auth_status():
    if not supabase:
        return {"configured": False, "error": "Supabase not connected"}
    
    # Check if admin_settings has a row
    try:
        res = supabase.table("admin_settings").select("*", count="exact", head=True).execute()
        count = res.count
        return {"configured": count > 0}
    except Exception as e:
        print(f"Auth status check failed: {e}")
        return {"configured": False}

@app.post("/auth/setup")
def setup_auth(auth: AuthSetup):
    # Only allow setup if no password exists
    status = get_auth_status()
    if status.get("configured"):
        raise HTTPException(status_code=400, detail="Already configured")
    
    # bcrypt requires bytes
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(auth.password.encode('utf-8'), salt).decode('utf-8')
    
    try:
        supabase.table("admin_settings").insert({"password_hash": hashed}).execute()
        return {"message": "Password set successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
def login(auth: AuthLogin):
    try:
        # Get hash from db
        # We assume 1 admin row for now
        res = supabase.table("admin_settings").select("*").limit(1).execute()
        if not res.data:
             raise HTTPException(status_code=400, detail="Not configured")
        
        stored_hash = res.data[0]["password_hash"]
        
        if bcrypt.checkpw(auth.password.encode('utf-8'), stored_hash.encode('utf-8')):
            return {"success": True}
        else:
            raise HTTPException(status_code=401, detail="Invalid password")
            
    except Exception as e:
        # In production, be careful not to leak details
        print(f"Login error: {e}")
        raise HTTPException(status_code=401, detail="Invalid password")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FTP Finder Backend is running"}

@app.get("/search")
def search_directories(q: str):
    if not q:
        return []
    # Split query into terms
    terms = q.strip().split()
    
    query = supabase.table("directories").select("*")
    
    # Apply ilike for each term to ensure all are present (AND logic)
    for term in terms:
        query = query.ilike("name", f"%{term}%")
        
    response = query.execute()
    return response.data

@app.get("/sources")
def get_sources():
    try:
        response = supabase.table("sources").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sources", response_model=Source)
def add_source(source: SourceCreate):
    try:
        response = supabase.table("sources").insert({"label": source.label, "url": source.url}).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=400, detail="Failed to add source")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/sources/{source_id}")
def delete_source(source_id: int):
    try:
        response = supabase.table("sources").delete().eq("id", source_id).execute()
        return {"message": "Source deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def background_indexer():
    global INDEXING_STATE
    INDEXING_STATE["is_running"] = True
    INDEXING_STATE["logs"] = []
    INDEXING_STATE["directories_found"] = 0
    
    def on_progress(count, url):
        INDEXING_STATE["directories_found"] = count
        INDEXING_STATE["current_path"] = url
        # Keep logs limited
        if len(INDEXING_STATE["logs"]) > 50:
            INDEXING_STATE["logs"].pop(0)
        INDEXING_STATE["logs"].append(f"Crawling: {url}")

    print("Starting background indexer...")
    INDEXING_STATE["logs"].append("Starting background indexer...")
    
    try:
        sources_res = supabase.table("sources").select("*").execute()
        sources = sources_res.data
        
        for src in sources:
            print(f"Indexing source: {src['label']}")
            INDEXING_STATE["current_source"] = src['label']
            INDEXING_STATE["logs"].append(f"Indexing source: {src['label']}")
            
            directories = crawl_ftp(src['id'], src['url'], on_progress)
            
            if directories:
                # Batch insert
                batch_size = 1000
                print(f"Found {len(directories)} directories. Inserting...")
                INDEXING_STATE["logs"].append(f"Found {len(directories)} directories. Inserting...")
                for i in range(0, len(directories), batch_size):
                    batch = directories[i:i+batch_size]
                    supabase.table("directories").upsert(batch).execute()
        print("Indexing completed.")
        INDEXING_STATE["logs"].append("Indexing completed.")
    except Exception as e:
        print(f"Indexer failed: {e}")
        INDEXING_STATE["logs"].append(f"Indexer failed: {e}")
    finally:
        INDEXING_STATE["is_running"] = False
        INDEXING_STATE["current_source"] = None
        INDEXING_STATE["current_path"] = None

@app.get("/index/status")
def get_index_status():
    return INDEXING_STATE

@app.post("/index")
def trigger_index(background_tasks: BackgroundTasks):
    background_tasks.add_task(background_indexer)
    return {"message": "Indexing started in background"}

@app.get("/stats")
def get_stats():
    if not supabase:
        return {"sources": 0, "directories": 0, "last_updated": None}
    
    try:
        # Get counts
        sources_count = supabase.table("sources").select("*", count="exact", head=True).execute().count
        dirs_count = supabase.table("directories").select("*", count="exact", head=True).execute().count
        
        # Get last update
        last_update = None
        latest_dir = supabase.table("directories").select("created_at").order("created_at", desc=True).limit(1).execute()
        if latest_dir.data:
            last_update = latest_dir.data[0]["created_at"]
            
        return {
            "sources": sources_count,
            "directories": dirs_count,
            "last_updated": last_update
        }
    except Exception:
        return {"sources": 0, "directories": 0, "last_updated": None}
