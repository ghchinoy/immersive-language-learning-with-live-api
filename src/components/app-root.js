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

import './view-splash.js';
import './view-missions.js';
import './view-chat.js';
import './view-summary.js';
import './text-cycler.js';

class AppRoot extends HTMLElement {
    constructor() {
        super();
        this.state = {
            view: 'splash', // splash, missions, chat, summary
            selectedMission: null,
            selectedLanguage: null,
            sessionResult: null
        };
    }

    connectedCallback() {
        // Setup static layout once
        this.innerHTML = '';

        // Persistent Header (GitHub Star)
        const header = document.createElement('div');
        header.style.cssText = "position: absolute; top: 8px; right: 8px; z-index: 1000; display: flex; align-items: center; gap: 12px;";
        header.innerHTML = `
        <div style="
            font-family: 'Brush Script MT', cursive;
            font-size: 1.4rem;
            color: var(--color-text-primary);
            pointer-events: none;
            display: flex;
            align-items: center;
            opacity: 0.9;
            transform: rotate(-2deg);
            margin-top: 8px;
            margin-bottom: 8px;
        ">
            <span >how it's built →</span>
        </div>
        <a class="github-button" href="https://github.com/zackakil/immersive-language-learning-with-live-api" data-size="large" data-show-count="true" aria-label="Star zackakil/immersive-language-learning-with-live-api on GitHub">Star</a>`;
        this.appendChild(header);

        // Inject GitHub Buttons Script (after element is added)
        if (!document.getElementById('github-buttons-script')) {
            const script = document.createElement('script');
            script.id = 'github-buttons-script';
            script.src = 'https://buttons.github.io/buttons.js';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        // View Container
        this.viewContainer = document.createElement('div');
        this.viewContainer.style.height = "100%";
        this.viewContainer.style.width = "100%";
        this.appendChild(this.viewContainer);

        this.render();

        this.checkConfigStatus();

        this.addEventListener('navigate', (e) => {
            this.state.view = e.detail.view;
            if (e.detail.mission) this.state.selectedMission = e.detail.mission;
            if (e.detail.language) this.state.selectedLanguage = e.detail.language;
            if (e.detail.fromLanguage) this.state.selectedFromLanguage = e.detail.fromLanguage;
            if (e.detail.mode) this.state.selectedMode = e.detail.mode;
            if (e.detail.result) this.state.sessionResult = e.detail.result;
            this.render();
        });
    }

    async checkConfigStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();

            if (data.mode === 'simple') {
                this.showSimpleModeWarning(data.missing);
            }
        } catch (e) {
            console.warn("Failed to check config status:", e);
        }
    }

    showSimpleModeWarning(missing) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #fff3cd;
            color: #856404;
            padding: 8px 16px;
            text-align: center;
            font-size: 0.9rem;
            z-index: 9999;
            border-top: 1px solid #ffeeba;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        `;

        const missingText = missing.join(' & ');
        warning.innerHTML = `
            <span>⚠️ <b>Simple Mode Check:</b> Production security features (${missingText}) are not configured.</span>
            <a href="https://github.com/ZackAkil/immersive-language-learning-with-live-api#advanced-configuration" target="_blank" style="color: #533f03; text-decoration: underline; font-weight: bold; margin-left: 4px;">Learn more</a>
        `;

        this.appendChild(warning);
    }

    render() {
        if (!this.viewContainer) return;

        this.viewContainer.innerHTML = '';
        let currentView;

        switch (this.state.view) {
            case 'splash':
                currentView = document.createElement('view-splash');
                break;
            case 'missions':
                currentView = document.createElement('view-missions');
                break;
            case 'chat':
                currentView = document.createElement('view-chat');
                currentView.mission = this.state.selectedMission;
                currentView.language = this.state.selectedLanguage;
                currentView.fromLanguage = this.state.selectedFromLanguage;
                currentView.mode = this.state.selectedMode;
                break;
            case 'summary':
                currentView = document.createElement('view-summary');
                currentView.result = this.state.sessionResult;
                break;
            default:
                currentView = document.createElement('view-splash');
        }

        currentView.classList.add('fade-in');
        this.viewContainer.appendChild(currentView);
    }
}

customElements.define('app-root', AppRoot);
