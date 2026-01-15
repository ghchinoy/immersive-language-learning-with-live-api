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

class LiveTranscript extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  addInputTranscript(text, isFinal) {
    this.updateTranscript('user', text, isFinal);
  }

  addOutputTranscript(text, isFinal) {
    this.updateTranscript('model', text, isFinal);
  }

  finalizeAll() {
    const container = this.shadowRoot.querySelector('.transcript-container');
    if (!container) return;
    const activeBubbles = container.querySelectorAll('.bubble.temp');
    activeBubbles.forEach(b => {
      b.classList.remove('temp');
      b.dataset.role = null;
    });
  }

  updateTranscript(role, text, isFinal) {
    const container = this.shadowRoot.querySelector('.transcript-container');
    if (!container) return;

    // Finalize other roles (implicit turn switch)
    const activeBubbles = container.querySelectorAll('.bubble.temp');
    activeBubbles.forEach(b => {
      if (b.dataset.role !== role) {
        b.classList.remove('temp');
        b.dataset.role = null;
      }
    });

    // Find existing temporary bubble for this role
    let bubble = container.querySelector(`.bubble.temp[data-role="${role}"]`);

    if (!bubble) {
      // Create new bubble
      bubble = document.createElement('div');
      bubble.className = `bubble temp ${role}`;
      bubble.dataset.role = role;
      container.appendChild(bubble);

      // Auto scroll
      container.scrollTop = container.scrollHeight;
    }

    // Intelligent spacing:
    // If we have content, and we're not starting/ending with space, check if we need one.
    const currentText = bubble.textContent;
    if (currentText.length > 0 && !currentText.endsWith(' ') && !text.startsWith(' ')) {
      // Check if starts with alphanumeric (approximate check for "word")
      if (/^[a-zA-Z0-9À-ÿ]/.test(text)) {
        bubble.appendChild(document.createTextNode(' '));
      }
    }

    // Wrap new text in a span for animation
    const span = document.createElement('span');
    span.textContent = text;
    span.className = 'fade-span';
    bubble.appendChild(span);

    // Note: We ignore isFinal here because the backend might be sending it prematurely for chunks.
    // We rely on role-switching or explicit finalizeAll() calls to close bubbles.

    // Auto scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  render() {
    if (this.shadowRoot.innerHTML.trim() !== '') return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        .transcript-container {
          height: 100%;
          overflow-y: auto;
          padding: 1rem;
          /* padding-bottom removed in favor of spacer */
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          scroll-behavior: smooth;
          /* Seamless fade effect - fixed size fade */
          mask-image: linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0px, black 60px, black calc(100% - 60px), transparent 100%);
        }

        /* Robust spacer to ensure scrolling clears the bottom fade */
        .transcript-container::after {
          content: "";
          display: block;
          min-height: 120px; 
          flex-shrink: 0;
        }

        /* Bubble animation for the CONTAINER itself (optional, mainly for first appearance) */
        .bubble {
          max-width: 80%;
          padding: 0.5rem 1rem;
          font-size: 1.1rem;
          line-height: 1.5;
          animation: popIn 0.5s ease forwards; 
          word-wrap: break-word;
          /* opacity handled by animation */
        }

        .fade-span {
          animation: fadeIn 1.5s ease forwards;
          opacity: 0;
        }

        .bubble.model {
          align-self: flex-start;
          color: #333; /* Dark text for model */
          text-align: left;
        }

        .bubble.user {
          align-self: flex-end;
          color: var(--color-accent-primary, #5c6b48); /* Accent color for user */
          text-align: right;
          font-weight: 500;
        }

        .bubble.temp {
          opacity: 0.7;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* Scrollbar styling - hidden for cleaner look or minimal */
        .transcript-container::-webkit-scrollbar {
          width: 0px; /* Hide scrollbar for seamless feel */
          background: transparent;
        }
      </style>
      <div class="transcript-container">
        <!-- Transcripts go here -->
      </div>
    `;
  }
}

customElements.define('live-transcript', LiveTranscript);
