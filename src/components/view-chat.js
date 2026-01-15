/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./audio-visualizer.js";
import "./live-transcript.js";
import {
  GeminiLiveAPI,
  MultimodalLiveResponseType,
  FunctionCallDefinition,
} from "../lib/gemini-live/geminilive.js";
import { AudioStreamer, AudioPlayer } from "../lib/gemini-live/mediaUtils.js";

class ViewChat extends HTMLElement {
  constructor() {
    super();
    this._mission = null;
  }

  set mission(value) {
    this._mission = value;
    this.render();
  }

  set language(value) {
    this._language = value;
  }

  set fromLanguage(value) {
    this._fromLanguage = value;
  }

  set mode(value) {
    this._mode = value;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this.audioStreamer) this.audioStreamer.stop();
    if (this.client) this.client.disconnect();
  }

  render() {
    if (!this._mission) return; // Wait for mission prop

    this.innerHTML = `

 <button id="back-to-missions" style="
            position: absolute;
            top: var(--spacing-md);
            left: var(--spacing-md);
            background: transparent;
            float: left;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            opacity: 0.7;
            transition: opacity 0.2s;
            z-index: 10;
        " onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>

      <div class="container" style="justify-content: space-between; min-height: 100vh; position: relative; padding-bottom: var(--spacing-xl);">
        
       

        <div style="margin-top: var(--spacing-xl); text-align: center;">
          <h2 style="font-size: 1.5rem; margin-bottom: var(--spacing-xs);">${this._mission.target_role || "Target Person"
      }</h2>
          <div style="
            background: rgba(var(--color-accent-secondary-rgb), 0.1); 
            border: 1px solid var(--color-accent-secondary);
            border-radius: var(--radius-lg);
            padding: var(--spacing-md) var(--spacing-lg);
            display: inline-block;
            margin-top: var(--spacing-md);
            max-width: 800px;
          ">
            <p style="font-size: 1.2rem; font-weight: bold; color: var(--color-accent-secondary); margin: 0;">${this._mission.title
      }</p>
            <p style="font-size: 1rem; opacity: 0.9; margin-top: 4px;">${this._mission.desc
      }</p>
          </div>
          ${this._mode === "immergo_teacher"
        ? `
          <div style="
            margin-top: var(--spacing-lg); 
            font-size: 0.9rem; 
            background: var(--color-surface); 
            color: var(--color-accent-primary); 
            padding: 8px 16px; 
            border-radius: var(--radius-full); 
            display: inline-flex; 
            align-items: center; 
            gap: 6px;
            border: 1px solid var(--color-accent-primary);
            box-shadow: var(--shadow-sm);
          ">
            <span>You can ask for <strong>translations</strong> & <strong>explanations</strong> at any time.</span>
          </div>
          `
        : ""
      }
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: ${this._mode === "immergo_teacher" ? "space-between" : "center"
      }; width: 100%; gap: ${this._mode === "immergo_teacher" ? "10px" : "40px"
      };">
          <!-- Model Visualizer (Top) -->
          <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <audio-visualizer id="model-viz"></audio-visualizer>
          </div>
          
          <!-- Transcript (Middle) -->
          ${this._mode === "immergo_teacher"
        ? `
            <div style="width: 100%; height: 250px; margin: 10px 0; position: relative;">
              <live-transcript></live-transcript>
            </div>
          `
        : ""
      }

          <!-- User Visualizer (Bottom) -->
           <div style="width: 100%; height: 120px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
             <audio-visualizer id="user-viz"></audio-visualizer>
          </div>
        </div>

        <div style="margin-bottom: var(--spacing-xxl); display: flex; flex-direction: column; gap: var(--spacing-lg); align-items: center;">
           
           <button id="mic-btn" style="
            background: var(--color-accent-primary);
            color: white;
            padding: var(--spacing-lg) var(--spacing-xl);
            border-radius: var(--radius-full);
            width: auto; height: auto;
            min-width: 200px;
            box-shadow: var(--shadow-md);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 2;
            transition: all 0.3s ease;
          ">
            <span style="font-size: 1.2rem; font-weight: bold; margin-bottom: 4px;">Start Mission</span>
            <span style="font-size: 0.8rem; opacity: 0.9;">You start the conversation!</span>
          </button>

           <p id="connection-status" style="
             margin-top: var(--spacing-sm);
             font-size: 0.9rem;
             font-weight: bold;
             height: 1.2em;
             transition: all 0.3s ease;
           "></p>
        </div>

        <!-- Rate Limit Dialog -->
        <div id="rate-limit-dialog" class="hidden" style="
            position: fixed; inset: 0; 
            background: rgba(0,0,0,0.8); 
            backdrop-filter: blur(4px);
            z-index: 20;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
        ">
            <div style="background: white; color: var(--color-text-primary); padding: var(--spacing-xl); border-radius: var(--radius-lg); max-width: 500px; text-align: center; box-shadow: var(--shadow-lg);">
                <h3 style="margin-bottom: var(--spacing-md); color: var(--color-accent-primary);">Oops, app is popular!</h3>
                <p style="margin-bottom: var(--spacing-lg); line-height: 1.5;">
                    Looks like this app is popular. Try again in a couple of minutes, or check out the GitHub to explore the code and build/deploy your own version.
                </p>
                <div style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-bottom: var(--spacing-lg);">
                     <a href="https://github.com/ZackAkil/immersive-language-learning-with-live-api" target="_blank" style="
                        background: var(--color-background);
                        color: var(--color-text-primary);
                        padding: var(--spacing-md);
                        border-radius: var(--radius-md);
                        text-decoration: none;
                        font-weight: bold;
                        border: 1px solid var(--color-text-sub);
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                     ">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        View Source on GitHub
                     </a>
                </div>
                <button id="close-rate-limit" style="
                    background: var(--color-accent-primary);
                    color: white;
                    border: none;
                    padding: var(--spacing-sm) var(--spacing-xl);
                    border-radius: var(--radius-full);
                    cursor: pointer;
                    font-weight: bold;
                ">Got it</button>
            </div>
        </div>

      </div>
    `;

    const rateLimitDialog = this.querySelector("#rate-limit-dialog");
    const closeRateLimitBtn = this.querySelector("#close-rate-limit");

    closeRateLimitBtn.addEventListener("click", () => {
      rateLimitDialog.classList.add("hidden");
      rateLimitDialog.style.display = "none";
    });

    // Helper to perform navigation
    const doEndSession = () => {
      // Cleanup Gemini session
      if (this.audioStreamer) this.audioStreamer.stop();
      if (this.client) this.client.disconnect();
      if (this.audioPlayer) this.audioPlayer.interrupt(); // Stop playback

      // Disconnect visualizers
      const userViz = this.querySelector("#user-viz");
      const modelViz = this.querySelector("#model-viz");
      if (userViz && userViz.disconnect) userViz.disconnect();
      if (modelViz && modelViz.disconnect) modelViz.disconnect();

      console.log("👋 [App] Session ended by user");

      // Incomplete session
      const result = {
        incomplete: true,
      };

      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: true,
          detail: { view: "summary", result: result },
        })
      );
    };

    // Back Button
    const backBtn = this.querySelector("#back-to-missions");
    backBtn.addEventListener("click", () => {
      // Stop session if active
      if (this.audioStreamer) this.audioStreamer.stop();
      if (this.client) this.client.disconnect();
      if (this.audioPlayer) this.audioPlayer.interrupt();

      const userViz = this.querySelector("#user-viz");
      const modelViz = this.querySelector("#model-viz");
      if (userViz && userViz.disconnect) userViz.disconnect();
      if (modelViz && modelViz.disconnect) modelViz.disconnect();

      // Navigate back to mission selector
      this.dispatchEvent(
        new CustomEvent("navigate", {
          bubbles: true,
          detail: { view: "mission-selector" },
        })
      );
    });

    // Animate visualizer on click
    const userViz = this.querySelector("#user-viz");
    const modelViz = this.querySelector("#model-viz");
    const micBtn = this.querySelector("#mic-btn");
    const statusEl = this.querySelector("#connection-status");
    let isSpeaking = false;

    // Initialize Gemini Live
    this.client = new GeminiLiveAPI();
    this.audioStreamer = new AudioStreamer(this.client);
    this.audioPlayer = new AudioPlayer();

    // Define Mission Complete Tool
    const completeMissionTool = new FunctionCallDefinition(
      "complete_mission",
      "Call this tool when the user has successfully completed the mission objective. Provide a score and feedback.",
      {
        type: "OBJECT",
        properties: {
          score: {
            type: "INTEGER",
            description:
              "Rating from 1 to 3 based on performance: 1 (Tiro) = Struggled, used frequent English, or needed many hints. 2 (Proficiens) = Good, intelligible but with errors or hesitation. 3 (Peritus) = Excellent, fluent, native-like, no help needed.",
          },
          feedback_pointers: {
            type: "ARRAY",
            items: { type: "STRING" },
            description:
              "List of 3 constructive feedback points or compliments in English.",
          },
        },
        required: ["score", "feedback_pointers"],
      },
      ["score", "feedback_pointers"]
    );

    completeMissionTool.functionToCall = (args) => {
      console.log("🏆 [App] Mission Complete Tool Triggered!", args);

      // Play winner sound immediately
      const winnerSound = new Audio("/winner-bell.mp3");
      winnerSound.volume = 0.6;
      winnerSound
        .play()
        .catch((e) => console.error("Failed to play winner sound:", e));

      // Map score to level
      const levels = { 1: "Tiro", 2: "Proficiens", 3: "Peritus" };
      const level = levels[args.score] || "Proficiens";

      console.log(
        "⏳ [App] Waiting for final audio to play before ending session..."
      );

      // Delay cleanup to allow the agent's congratulatory message to be heard
      setTimeout(() => {
        // Cleanup
        if (this.audioStreamer) this.audioStreamer.stop();
        if (this.client) this.client.disconnect();
        if (this.audioPlayer) this.audioPlayer.interrupt();

        // Navigate to summary
        const result = {
          score: args.score.toString(),
          level: level,
          notes: args.feedback_pointers,
        };

        this.dispatchEvent(
          new CustomEvent("navigate", {
            bubbles: true,
            detail: { view: "summary", result: result },
          })
        );
      }, 2500); // 2.5 seconds delay
    };

    this.client.addFunction(completeMissionTool);

    // Setup client callbacks for logging
    this.client.onConnectionStarted = () => {
      console.log("🚀 [Gemini] Connection started");
    };

    this.client.onOpen = () => {
      console.log("🔓 [Gemini] WebSocket connection opened");
    };

    this.client.onReceiveResponse = (response) => {
      console.log("📥 [Gemini] Received response:", response.type);
      if (response.type === MultimodalLiveResponseType.AUDIO) {
        this.audioPlayer.play(response.data);
      } else if (response.type === MultimodalLiveResponseType.TURN_COMPLETE) {
        console.log("✅ [Gemini] Turn complete");
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.finalizeAll();
        }
      } else if (response.type === MultimodalLiveResponseType.TOOL_CALL) {
        console.log("🛠️ [Gemini] Tool Call received:", response.data);
        if (response.data.functionCalls) {
          response.data.functionCalls.forEach((fc) => {
            this.client.callFunction(fc.name, fc.args);
          });
        }
      } else if (
        response.type === MultimodalLiveResponseType.INPUT_TRANSCRIPTION
      ) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addInputTranscript(
            response.data.text,
            response.data.finished
          );
        }
      } else if (
        response.type === MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION
      ) {
        const transcriptEl = this.querySelector("live-transcript");
        if (transcriptEl) {
          transcriptEl.addOutputTranscript(
            response.data.text,
            response.data.finished
          );
        }
      }
    };

    this.client.onError = (error) => {
      console.error("❌ [Gemini] Error:", error);
    };

    this.client.onClose = () => {
      console.log("🔒 [Gemini] Connection closed");
    };

    micBtn.addEventListener("click", async () => {
      isSpeaking = !isSpeaking;
      micBtn.style.background = isSpeaking
        ? "#2c2c2c"
        : "var(--color-accent-primary)";

      if (isSpeaking) {
        // Change to Stop/Listening state
        micBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
                    <span style="margin-left: 8px;">End Mission</span>
                `;
        micBtn.style.flexDirection = "row";
        micBtn.style.background = "var(--color-danger)"; // Red for end
      } else {
        // Was active, so stopping now
        doEndSession();
        return; // Stop here, don't execute start logic
      }

      if (isSpeaking) {
        console.log("🎙️ [App] Microphone button clicked: Starting session...");
        statusEl.textContent = "Connecting...";
        statusEl.style.color = "var(--color-text-sub)";
        // Viz active handled by connection now

        try {
          // 0. Configure System Instructions
          const language = this._language || "French";
          const fromLanguage = this._fromLanguage || "English";
          const mode = this._mode || "immergo_immersive";
          const missionTitle = this._mission
            ? this._mission.title
            : "General Conversation";
          const missionDesc = this._mission ? this._mission.desc : "";
          const targetRole = this._mission
            ? this._mission.target_role || "a local native speaker"
            : "a conversational partner";

          let systemInstruction = "";

          if (mode === "immergo_teacher") {
            // Teacher Mode Prompt
            systemInstruction = `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to be a HELPFUL TEACHER while playing your role (${targetRole}).
Speak in the accent and tone of the role.

INTERACTION GUIDELINES:
1. Act as the person, but if the user struggles, friendly explains options in their native language (${fromLanguage}).
2. It's okay for the user to ask questions in ${fromLanguage}. Answer them helpfully.
3. Encourage the user to speak ${language}, but do not force them if they are asking for clarity.
4. Utilising the proactive audio feature, do not respond until it is necessary.

MISSION COMPLETION:
When the user has successfully achieved the mission objective declared in the scenario:
1. Speak a brief congratulatory message and sound happy for their progress.
2. THEN call the "complete_mission" tool.
3. IMPORTANT: Set 'score' to 0 (Zero) to indicate this was a practice session.
4. Provide 3 helpful tips or vocabulary words they learned in the feedback list (in ${fromLanguage}).
`;
          } else {
            // Immersive Mode Prompt (Default)
            systemInstruction = `
ROLEPLAY INSTRUCTION:
You are acting as **${targetRole}**, a native speaker of ${language}.
The user is a language learner (native speaker of ${fromLanguage}) trying to: "${missionTitle}" (${missionDesc}).
Your goal is to play your role (${targetRole}) naturally. Do not act as an AI assistant. Act as the person.
Speak in the accent and tone of the role.

INTERACTION GUIDELINES:
1. It is up to you if you want to directly speak back, or speak out what you think the user is saying in your native language before responding.
2. Utilising the proactive audio feature, do not respond until it is necessary (i.e. the user has finished their turn).
3. Be helpful but strict about language practice. It is just like speaking to a multilingual person.
4. You cannot proceed without the user speaking the target language (${language}) themselves.
5. If you need to give feedback, corrections, or translations, use the user's native language (${fromLanguage}).

NO FREE RIDES POLICY:
If the user asks for help in ${fromLanguage} (e.g., "please can you repeat"), you MUST NOT simply answer.
Instead, force them to say the phrase in the target language (${language}).
For example, say: "You mean to say [Insert Translation in ${language}]" (provided in ${fromLanguage}) and wait for them to repeat it.
Do not continue the conversation until they attempt the phrase in ${language}.

MISSION COMPLETION:
When the user has successfully achieved the mission objective declared in the scenario:
1. Speak a brief congratulatory message (in character) and say goodbye.
2. THEN call the "complete_mission" tool.
3. Assign a score based on strict criteria: 1 for struggling/English reliance (Tiro), 2 for capable but imperfect (Proficiens), 3 for native-level fluency (Peritus).
4. Provide 3 specific pointers or compliments in the feedback list (in the user's native language: ${fromLanguage}).
`;
          }

          console.log(
            "📝 [App] Setting system instructions for",
            language,
            "Mode:",
            mode
          );
          this.client.setSystemInstructions(systemInstruction);

          // Configure Transcription based on Mode
          if (mode === "immergo_teacher") {
            this.client.setInputAudioTranscription(true);
            this.client.setOutputAudioTranscription(true);
          } else {
            this.client.setInputAudioTranscription(false);
            this.client.setOutputAudioTranscription(false);
          }

          // 1. Connect to WebSocket
          console.log("🔌 [App] Connecting to backend...");

          // Execute Recaptcha
          let token = "";
          try {
            token = await this.getRecaptchaToken();
            console.log("Captcha solved:", token);
          } catch (err) {
            console.error("Recaptcha failed:", err);
            // Start without token? Or fail? The server will reject it.
            // Let's proceed and let server reject if needed, or stop.
            // For now, let's stop to be safe.
            isSpeaking = false;
            micBtn.style.background = "var(--color-accent-primary)";
            userViz.disconnect();
            modelViz.disconnect();
            statusEl.textContent = "";
            return;
          }

          await this.client.connect(token);

          // 2. Start Audio Stream
          console.log("🎤 [App] Starting audio stream...");
          await this.audioStreamer.start();

          // Connect User Visualizer
          if (this.audioStreamer.audioContext && this.audioStreamer.source) {
            userViz.connect(
              this.audioStreamer.audioContext,
              this.audioStreamer.source
            );
          }

          // 3. Initialize Audio Player
          console.log("🔊 [App] Initializing audio player...");
          await this.audioPlayer.init();

          // Connect Model Visualizer
          if (this.audioPlayer.audioContext && this.audioPlayer.gainNode) {
            modelViz.connect(
              this.audioPlayer.audioContext,
              this.audioPlayer.gainNode
            );
          }

          console.log("✨ [App] Session active!");
          statusEl.textContent = "Connected and ready to speak";
          statusEl.style.color = "#4CAF50"; // Success green

          // Play start sound
          const startSound = new Audio("/start-bell.mp3");
          startSound.volume = 0.6;
          startSound
            .play()
            .catch((e) => console.error("Failed to play start sound:", e));
        } catch (err) {
          console.error("❌ [App] Failed to start session:", err);
          console.log("Error status:", err.status); // Debug status

          isSpeaking = false;
          micBtn.style.background = "var(--color-accent-primary)";
          // Reset button content to "Start Mission"
          micBtn.innerHTML = `
                        <span style="font-size: 1.2rem; font-weight: bold; margin-bottom: 4px;">Start Mission</span>
                        <span style="font-size: 0.8rem; opacity: 0.9;">You start the conversation!</span>
                    `;
          micBtn.style.flexDirection = "column";

          userViz.disconnect();
          modelViz.disconnect();
          statusEl.textContent = "";

          if (err.status === 429) {
            rateLimitDialog.classList.remove("hidden");
            rateLimitDialog.style.display = "flex";
          } else {
            alert("Failed to start session: " + err.message);
          }
        }
      }
    });
  }

  async getRecaptchaToken() {
    return new Promise((resolve) => {
      // Graceful fallback for Simple Mode
      if (typeof grecaptcha === "undefined") {
        console.warn("⚠️ ReCAPTCHA not loaded (Simple Mode). Proceeding without token.");
        resolve(null);
        return;
      }

      try {
        grecaptcha.enterprise.ready(async () => {
          try {
            const t = await grecaptcha.enterprise.execute(
              "6LeSYx8sAAAAAGdRAp8VQ2K9I-KYGWBykzayvQ8n",
              { action: "LOGIN" }
            );
            resolve(t);
          } catch (e) {
            console.warn("⚠️ ReCAPTCHA execution failed (Simple Mode fallback):", e);
            resolve(null);
          }
        });
      } catch (e) {
        console.warn("⚠️ ReCAPTCHA ready failed:", e);
        resolve(null);
      }
    });
  }
}

customElements.define("view-chat", ViewChat);
