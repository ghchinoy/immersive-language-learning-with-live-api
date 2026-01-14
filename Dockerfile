
# Stage 1: Build the Frontend
FROM node:22-alpine as frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Set up the Backend
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if needed (e.g. for audio processing)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built frontend assets
COPY --from=frontend-builder /app/dist ./dist

# Copy the server code
COPY server ./server
# Copy root level scripts/configs if needed (like .env example or deployment scripts, though usually not needed for runtime)
# We might need to copy specific files if the server code relies on relative paths outside 'server/'
# The main.py uses "dist" relative to CWD.

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Expose the port
EXPOSE 8080

# Run the application
# We run from the root /app so that "server.main" module path works if we run as module, 
# or just "python server/main.py" as the script does.
# The script server/main.py has: 
# if __name__ == "__main__":
#     import uvicorn
#     port = int(os.getenv("PORT", 8000))
#     uvicorn.run(app, host="0.0.0.0", port=port)
# Run the application as a module to ensure /app is in sys.path
CMD ["python", "-m", "server.main"]
