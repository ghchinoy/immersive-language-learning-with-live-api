#!/bin/bash
# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    
    # Get all child PIDs of this shell
    pids=$(jobs -p)
    
    if [ -n "$pids" ]; then
        echo "   Sending SIGTERM to: $pids"
        kill -TERM $pids 2>/dev/null
        
        # Wait for processes to exit (max 5 seconds)
        for i in {1..5}; do
            if ! kill -0 $pids 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if kill -0 $pids 2>/dev/null; then
            echo "   Force killing remaining processes..."
            kill -KILL $pids 2>/dev/null
        fi
    fi
    
    # extra safety: try to kill the uvicorn process found by port if it still exists
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

echo "🔧 Starting development environment..."

# Check for .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️  Warning: .env file not found. Copying from .env.example..."
        cp .env.example .env
        echo "Please update .env with your configuration."
    else
        echo "⚠️  Warning: .env file not found and no .env.example exists."
    fi
fi



# Enable Dev Mode
export DEV_MODE=true

echo "🚀 Starting Backend (Uvicorn) on port 8000..."
# Start Uvicorn in the background
# Start Uvicorn in the background
if [ -f "venv/bin/python" ]; then
    venv/bin/python -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload &
else
    python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8000 --reload &
fi
BACKEND_PID=$!

echo "🎨 Starting Frontend (Vite)..."
# Start Vite (it usually runs in foreground, but we want to wait for it)
# We run it in foreground so Ctrl+C goes to it and the script
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
