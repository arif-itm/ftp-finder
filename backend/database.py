from supabase import create_client, Client
from config import settings

try:
    if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    else:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Backend will not function correctly.")
        supabase = None
except Exception as e:
    print(f"Error initializing Supabase: {e}")
    supabase = None
