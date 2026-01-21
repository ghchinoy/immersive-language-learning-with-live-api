# GEMINI.md - Project Context & Agent Instructions

This file provides critical context and instructions for AI coding agents (Gemini CLI, Cursor, Claude Code, etc.) working on the **Immergo** project.

## Project Overview
**Immergo** is an immersive language learning application that leverages the **Google Gemini Live API** to simulate real-world roleplay scenarios. It features low-latency, full-duplex audio communication, allowing users to practice speaking in various languages with an AI persona.

## Tech Stack
- **Backend**: Python 3.10+, FastAPI, `google-genai` SDK, `websockets`, `redis` (rate limiting), `google-cloud-bigquery` (metrics).
- **Frontend**: Vanilla JavaScript (ES Modules), Vite, Web Components (Custom Elements), Web Audio API (AudioWorklets).
- **Communication**: WebSockets for real-time PCM audio streaming and JSON control messages.

## Core Architecture

### Backend (`/server`)
- `main.py`: Entry point for the FastAPI application. Handles static file serving, REST API endpoints (`/api/*`), and the WebSocket endpoint (`/ws`).
- `gemini_live.py`: Manages the lifecycle of the Gemini Live session. Connects to the Google GenAI backend and proxies messages between the client and Gemini.
- `simple_tracker.py`: Handles session and event tracking (BigQuery).
- `config_utils.py`: Configuration and environment variable management.

### Frontend (`/src`)
- `main.js`: Application initialization.
- `components/app-root.js`: Main state management and view orchestration (Splash -> Missions -> Chat -> Summary).
- `lib/gemini-live/geminilive.js`: Client-side implementation of the Gemini Live protocol. Handles WebSocket lifecycle, setup messages, and audio/text message routing.
- `components/view-chat.js`: The primary interaction view. Manages the audio visualizer, transcriptions, and session state.
- `public/audio-processors/`: Contains `capture.worklet.js` and `playback.worklet.js` for low-level audio handling via Web Audio API.

## Key Concepts & Workflows

### Missions
Missions are defined in `src/data/missions.json`. Each mission includes:
- `id`: Unique identifier.
- `title`: Display name.
- `persona`: The role the AI should adopt.
- `situation`: The context of the roleplay.
- `objectives`: Specific goals for the user to achieve.

### Interaction Modes
- **Teacher Mode**: AI provides explanations and can speak the user's native language.
- **Immersive Mode**: AI strictly speaks the target language and challenges the user to stay in character.

### Audio Pipeline
1. **Capture**: `capture.worklet.js` collects PCM audio from the user's microphone.
2. **Streaming**: `view-chat.js` sends binary PCM data over the WebSocket via `GeminiLiveAPI`.
3. **Processing**: `gemini_live.py` (backend) receives and forwards audio to Gemini.
4. **Playback**: Model responses (PCM audio) are received via WebSocket and played back using `playback.worklet.js`.

## Development Guidelines

### Coding Style
- **Frontend**: Use Vanilla JS with Web Components. Avoid adding external UI frameworks (React, Vue, etc.) unless explicitly requested. Use standard CSS variables defined in `style.css`.
- **Backend**: Use `async`/`await` for all I/O bound operations. Follow FastAPI best practices.
- **Naming**: Use camelCase for JavaScript and snake_case for Python.
- **Mobile Safety**: When styling absolute/fixed headers or containers, always account for device notches using `env(safe-area-inset-*)` (e.g., `padding-top: calc(var(--spacing-md) + env(safe-area-inset-top))`).
- **Commits**: Use **Conventional Commits** (e.g., `feat:`, `fix:`, `docs:`) for all repository contributions.

### UI Patterns
- **HUD & Pills**: For system labels or status indicators, use low-opacity backgrounds (`rgba(0,0,0,0.04)`), full rounding (`var(--radius-full)`), and bold, small uppercase text (`font-size: 0.75rem`, `letter-spacing: 0.05em`).
- **Glassmorphism**: Use the project's glass panel style for overlays: `backdrop-filter: blur(20px); border: var(--glass-border);`.

### Gemini Live Prompting
Standardize the structure of `systemInstruction` in `view-chat.js`:
1.  **ROLEPLAY INSTRUCTION**: Define the AI's persona, the user's role, and the scenario.
2.  **INTERACTION GUIDELINES**: Define behavior constraints (e.g., teaching protocols, proactivity, or strictness).
3.  **MISSION COMPLETION**: Explicitly define the trigger for the `complete_mission` tool, including scoring criteria and feedback requirements.


### Environment Setup
- Backend runs on port `8000`.
- Frontend (Vite) runs on port `5173`.
- Use `./dev.sh` to start both with hot-reloading enabled.

### Testing & Verification
- Verify backend changes with `go test ./...` (if applicable) or manual integration tests.
- Check browser console for WebSocket errors or audio processing warnings.
- Ensure `DEV_MODE=True` in `.env` for local development to bypass production-only features like reCAPTCHA.

## Common Tasks for Agents
- **Adding a Mission**: Update `src/data/missions.json` with a new scenario definition.
- **UI Tweaks**: Modify components in `src/components/` and check `src/style.css` for theme variables.
- **Live API Logic**: Look into `server/gemini_live.py` for backend handling and `src/lib/gemini-live/geminilive.js` for client-side protocol adjustments.
- **Audio Improvements**: Investigate `public/audio-processors/` and `src/components/audio-visualizer.js`.
