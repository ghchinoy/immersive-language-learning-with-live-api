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

class ViewSplash extends HTMLElement {
  connectedCallback() {
    // Define translations
    const startTranslations = [
      "ابدأ", "Comenzar", "Commencer",
      "شروع کرें", "Mulai", "Inizia", "スタート", "시작",
      "Começar", "Начать", "เริ่ม", "Başla", "Bắt đầu", "Почати", "শুরু",
      "साुरु करा", "தொடங்கு", "ప్రారంభించు"
    ];

    // Escape quotes for HTML attribute if necessary, but simple JSON.stringify should be fine for these strings
    const valuesAttr = JSON.stringify(startTranslations).replace(/"/g, '&quot;');

    this.innerHTML = `
      <div class="container text-center flex-center">
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <h1 style="font-size: 4.5rem; letter-spacing: -2px; margin-bottom: var(--spacing-sm);">Immergo</h1>
          <p style="font-style: italic; font-size: 1.3rem; opacity: 0.7;">Intense immersive language learning experience.</p>
          <p style="font-size: 1rem; opacity: 0.6; margin-top: var(--spacing-sm); color: var(--color-text-secondary); ">Powered by <br>
          <a href="https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api" target="_blank" style=" color: var(--color-accent-primary); font-weight: bold;">Gemini Live API on Vertex AI</a>
          </p>



        </div>
        
        <div style="width: 100%; margin-bottom: var(--spacing-xxl);">
          <button id="start-btn" style="
            background: var(--color-accent-primary);
            color: white;
            padding: var(--spacing-md) var(--spacing-xl);
            font-size: 1.2rem;
            border-radius: var(--radius-full);
            width: 100%;
            max-width: 300px;
            box-shadow: var(--shadow-md);
          ">
            <text-cycler text="Start" values='${JSON.stringify(startTranslations)}'></text-cycler>
          </button>
        </div>

        <div style="font-size: 0.7rem; opacity: 0.5; max-width: 400px; margin: 0 auto; line-height: 1.4; padding-bottom: var(--spacing-lg);">
            <strong>Disclaimer:</strong> This application is for demo purposes only. This is not an official product. May produce inaccurate, unexpected, or offensive results. Present to a live audience at your own risk.
        </div>
      </div>
    `;

    this.querySelector('#start-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('navigate', {
        bubbles: true,
        detail: { view: 'missions' }
      }));
    });
  }
}

customElements.define('view-splash', ViewSplash);
