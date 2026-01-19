#!/bin/bash

# Navigate to the script's directory
cd "$(dirname "$0")"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "Files found. Installing dependencies..."
    pip install -r requirements.txt
fi

# Run the application
echo "Starting FastAPI backend..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
