# FTP Finder

FTP Finder is a full-stack application designed to index and search content across multiple FTP servers. It features a high-performance FastAPI backend for crawling and indexing, and a modern Next.js frontend for searching and managing sources.

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: Next.js (React), Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Other**: BeautifulSoup4 (HTML parsing), Lucide React (Icons)

## Prerequisites

Before running the application, ensure you have the following installed:

- **Python**: 3.8 or higher
- **Node.js**: 16.x or higher
- **pnpm** (or npm/yarn)
- **Supabase Account**: You'll need a Supabase project set up.

## Installation & Setup

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory with your Supabase credentials and other configs:

```bash
# backend/.env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
# Add other required environment variables found in config.py
```

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
pnpm install
```

Create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

### Start the Backend

From the `backend` directory (with virtual environment activated):

```bash
# Run with uvicorn directly
uvicorn main:app --reload

# OR use the start script if available
./start.sh
```

The API will be available at `http://localhost:8000`.

### Start the Frontend

From the `frontend` directory:

```bash
pnpm dev
```

The application will be running at `http://localhost:3000`.

## Features

## Architecture Overview

FTP Finder operates as a decoupled full-stack application:

1.  **Backend (FastAPI)**:
    -   Handles business logic, database interactions, and crawling operations.
    -   Exposes RESTful endpoints for the frontend.
    -   Manages background tasks for long-running FTP indexing.
2.  **Frontend (Next.js)**:
    -   Provides a modern, responsive UI for users and admins.
    -   Interacts with the backend via REST API.
    -   Uses Supabase client (optional direct connection) or Backend API for data.
3.  **Database (Supabase/PostgreSQL)**:
    -   Stores configuration, sources, scraped data, and admin credentials.
    -   Uses Row Level Security (RLS) for data protection.

## Directory Structure

```
ftp-finder/
├── backend/                # FastAPI Application
│   ├── main.py            # Entry point and API routes
│   ├── crawler.py         # FTP crawling logic
│   ├── models.py          # Pydantic data models
│   ├── database.py        # Supabase client initialization
│   ├── config.py          # Environment configuration
│   └── schema.sql         # Database schema definitions
├── frontend/               # Next.js Application
│   ├── src/app/           # App Router pages
│   │   ├── page.tsx       # Search & Home page
│   │   └── admin/         # Admin Dashboard
│   └── public/            # Static assets
└── README.md               # Project documentation
```

## API Reference

### Authentication & System
-   `GET /`: Health check. Returns `{"message": "..."}`.
-   `GET /auth/status`: Checks if the admin password is configured.
-   `POST /auth/setup`: Sets the initial admin password. Body: `{"password": "..."}`.
-   `POST /auth/login`: Verifies admin password. Body: `{"password": "..."}`.
-   `GET /stats`: Returns system statistics (source count, directory count, last update).

### content & Search
-   `GET /search`: Search for directories. Query param: `?q=search_term`.
-   `GET /sources`: List all configured FTP sources.
-   `POST /sources`: Add a new FTP source. Body: `{"label": "...", "url": "..."}`.
-   `DELETE /sources/{id}`: Remove a source and its indexed data.

### Indexing
-   `POST /index`: Triggers the background indexing process.
-   `GET /index/status`: Returns current indexing status (running state, progress, logs).

## Database Schema

### `sources`
-   `id`: Primary Key (BigInt)
-   `label`: Human-readable name for the source.
-   `url`: Base URL of the FTP/HTTP server.
-   `created_at`: Timestamp.

### `directories`
-   `id`: Primary Key (BigInt)
-   `source_id`: Foreign Key linking to `sources`.
-   `name`: Name of the directory/file.
-   `path`: Relative path or full URL.
-   `original_link`: Direct link to the resource.
-   `created_at`: Timestamp.

### `admin_settings`
-   `id`: Primary Key.
-   `password_hash`: Bcrypt hash of the admin password.

## Environment Variables

### Backend (`backend/.env`)
-   `SUPABASE_URL`: Your Supabase Project URL.
-   `SUPABASE_KEY`: Your Supabase Anon/Service Key.

### Frontend (`frontend/.env.local`)
-   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
-   `NEXT_PUBLIC_API_URL`: URL of the backend API (default: `http://localhost:8000`).

## Development Workflow

1.  **Database Migration**: Use the `backend/schema.sql` to set up your Supabase SQL Editor.
2.  **Running Locally**: Follow the setup instructions above to run both servers.
3.  **Indexing**: Use the Admin Dashboard (`/admin`) to add sources and trigger the initial index.

## License

[MIT](LICENSE)
