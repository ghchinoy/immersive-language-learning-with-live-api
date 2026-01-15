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

class TextCycler extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['text', 'values'];
    }

    connectedCallback() {
        this.render();
        this.startAnimation();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
            if (name === 'values') {
                this.startAnimation();
            }
        }
    }

    render() {
        const text = this.getAttribute('text') || '';

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        span {
          transition: opacity 0.5s ease-in-out;
          opacity: 1;
        }
        span.hidden {
          opacity: 0;
        }
      </style>
      <span id="content">${text}</span>
    `;
    }

    startAnimation() {
        if (this.intervalId) clearInterval(this.intervalId);

        const valuesStr = this.getAttribute('values');
        if (!valuesStr) return;

        let values = [];
        try {
            values = JSON.parse(valuesStr);
        } catch (e) {
            console.error('Invalid values for text-cycler:', valuesStr);
            return;
        }

        if (!Array.isArray(values) || values.length === 0) return;

        // Use a negative index to start so the first cycle moves to index 0
        let currentIndex = -1;
        const anchorText = this.getAttribute('text') || '';
        let showingAnchor = true;

        const span = this.shadowRoot.getElementById('content');
        if (!span) return;

        this.intervalId = setInterval(() => {
            if (!span) return;

            // Fade out
            span.classList.add('hidden');

            setTimeout(() => {
                if (showingAnchor) {
                    // Switch to next value
                    currentIndex = (currentIndex + 1) % values.length;
                    span.textContent = values[currentIndex];
                    showingAnchor = false;
                } else {
                    // Return to anchor text
                    span.textContent = anchorText;
                    showingAnchor = true;
                }

                // Fade in
                span.classList.remove('hidden');
            }, 500); // Wait for fade out to complete

        }, 3000);
    }

    disconnectedCallback() {
        if (this.intervalId) clearInterval(this.intervalId);
    }
}

customElements.define('text-cycler', TextCycler);
