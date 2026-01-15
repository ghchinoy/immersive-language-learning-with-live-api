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

import missionsData from '../data/missions.json';

class ViewMissions extends HTMLElement {
  connectedCallback() {
    const options = `
            <option>🇬🇧 English</option>
            <option>🇩🇪 German</option>
            <option>🇪🇸 Spanish</option>
            <option>🇫🇷 French</option>
            <option>🇮🇳 Hindi</option>
            <option>🇦🇪 Arabic</option>
            <option>🇮🇩 Indonesian</option>
            <option>🇮🇹 Italian</option>
            <option>🇯🇵 Japanese</option>
            <option>🇰🇷 Korean</option>
            <option>🇧🇷 Portuguese</option>
            <option>🇷🇺 Russian</option>
            <option>🇳🇱 Dutch</option>
            <option>🇵🇱 Polish</option>
            <option>🇧🇩 Bengali</option>
            <option>🇮🇳 Marathi</option>
            <option>🇮🇳 Tamil</option>
            <option>🇮🇳 Telugu</option>
            <option>🇹🇭 Thai</option>
            <option>🇹🇷 Turkish</option>
            <option>🇻🇳 Vietnamese</option>
            <option>🇷🇴 Romanian</option>
            <option>🇺🇦 Ukrainian</option>
            <option>🧑‍🔬 Science Jargon</option>
  
    `;

    this.innerHTML = `
      <div class="container">
        <h2 style="margin-top: var(--spacing-xl);">Select Mission</h2>
        
        <div style="
          margin-bottom: var(--spacing-lg); 
          background: white; 
          padding: var(--spacing-lg); 
          border-radius: var(--radius-lg); 
          border: 1px solid #ddd;
          box-shadow: var(--shadow-sm);
        ">
          <label style="display: block; font-weight: bold; margin-bottom: var(--spacing-md); color: var(--color-accent-primary);">Target Language</label>
          
          <div style="display: flex; align-items: center; gap: var(--spacing-md);">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.7;">I speak (Native)</label>
              <select id="from-lang" style="
                width: 100%;
                padding: var(--spacing-md);
                border: 2px solid #eee;
                border-radius: var(--radius-md);
                background: #f9f9f9;
                font-family: var(--font-body);
                font-size: 1rem;
                appearance: none;
                cursor: pointer;
              ">
                ${options}
              </select>
            </div>

            <div style="font-size: 1.2rem; margin-top: 20px; opacity: 0.3;">→</div>

            <div style="flex: 1;">
              <label style="display: block; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.7;">I want to practice</label>
              <select id="to-lang" style="
                width: 100%;
                padding: var(--spacing-md);
                border: 2px solid var(--color-accent-secondary);
                border-radius: var(--radius-md);
                background: white;
                font-family: var(--font-body);
                font-size: 1.1rem;
                font-weight: bold;
                appearance: none;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(203, 163, 107, 0.2);
              ">
                ${options}
              </select>
            </div>
          </div>

          <div style="height: 1px; background: #eee; margin: var(--spacing-lg) 0;"></div>

          <label style="display: block; font-weight: bold; margin-bottom: var(--spacing-md); color: var(--color-accent-primary);">Mode</label>

          <div style="display: flex; gap: var(--spacing-md);">
              <button id="mode-teacher" class="mode-btn" style="
                  flex: 1;
                  padding: var(--spacing-sm) var(--spacing-md);
                  border-radius: var(--radius-lg);
                  border: 2px solid transparent;
                  background: transparent;
                  cursor: pointer;
                  display: flex; flex-direction: row; align-items: center; justify-content: center; gap: var(--spacing-sm);
                  transition: all 0.2s;
                  text-align: left;
              ">
                  <span style="font-size: 1.5rem;">🧑‍🏫</span>
                  <div>
                      <span style="font-weight: bold; font-size: 1rem; display: block;">Teacher</span>
                      <span style="font-size: 0.75rem; opacity: 0.7; line-height: 1.2; display: block;">
                          Helpful explanations, native allowed.
                      </span>
                  </div>
              </button>

              <button id="mode-immersive" class="mode-btn" style="
                  flex: 1;
                  padding: var(--spacing-sm) var(--spacing-md);
                  border-radius: var(--radius-lg);
                  border: 2px solid transparent;
                  background: transparent;
                  cursor: pointer;
                  display: flex; flex-direction: row; align-items: center; justify-content: center; gap: var(--spacing-sm);
                  transition: all 0.2s;
                  text-align: left;
              ">
                  <span style="font-size: 1.5rem;">🎭</span>
                   <div>
                      <span style="font-weight: bold; font-size: 1rem; display: block;">Immersive</span>
                      <span style="font-size: 0.75rem; opacity: 0.7; line-height: 1.2; display: block;">
                          Graded, strict roleplay.
                      </span>
                  </div>
              </button>
          </div>
        </div>



        <div class="missions-list">
          <!-- Missions will be injected here -->
        </div>

        <div style="
            margin-top: var(--spacing-sm);
            margin-bottom: var(--spacing-xl);
            padding: var(--spacing-xl);
            background: linear-gradient(135deg, rgba(var(--color-accent-primary-rgb), 0.1) 0%, rgba(var(--color-accent-secondary-rgb), 0.1) 100%);
            border-radius: var(--radius-lg);
            text-align: center;
            border: 1px dashed var(--color-accent-primary);
        ">
            <h3 style="margin-bottom: var(--spacing-sm); color: var(--color-accent-primary);"> Build Your Own Version </h3>
            <p style="margin-bottom: var(--spacing-lg); opacity: 0.8; line-height: 1.5;">
                Add more missions or features <br>
            </p>
            
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
                    <a href="https://github.com/ZackAkil/immersive-language-learning-with-live-api" target="_blank" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: white;
                        color: var(--color-text-primary);
                        padding: var(--spacing-md) var(--spacing-lg);
                        border-radius: var(--radius-full);
                        text-decoration: none;
                        font-weight: bold;
                        box-shadow: var(--shadow-sm);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        Fork on GitHub
                    </a>

                    <a href="https://deploy.cloud.run/?git_repo=https://github.com/ZackAkil/immersive-language-learning-with-live-api" target="_blank" style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: white;
                        color: #1a73e8;
                        padding: var(--spacing-md) var(--spacing-lg);
                        border-radius: var(--radius-full);
                        text-decoration: none;
                        font-weight: bold;
                        box-shadow: var(--shadow-sm);
                        transition: transform 0.2s;
                    " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="https://www.gstatic.com/images/branding/product/1x/google_cloud_48dp.png" width="20" height="20" alt="Cloud Run Logo" />
                        Deploy to Cloud Run
                    </a>
                </div>
        </div>
      </div>
    `;

    this.renderMissions();

    // Restore language preference
    const savedLang = localStorage.getItem('immergo_language');
    const savedFromLang = localStorage.getItem('immergo_from_language');

    const toSelect = this.querySelector('#to-lang');
    const fromSelect = this.querySelector('#from-lang');

    if (savedLang) toSelect.value = savedLang;

    // Default From language to English if not set
    if (savedFromLang) {
      fromSelect.value = savedFromLang;
    } else {
      // Try to find English or default to first
      const options = Array.from(fromSelect.options);
      const englishOption = options.find(o => o.text.includes('English'));
      if (englishOption) fromSelect.value = englishOption.text;
    }


    // Mode Logic
    const modeImmersive = this.querySelector('#mode-immersive');
    const modeTeacher = this.querySelector('#mode-teacher');
    let currentMode = localStorage.getItem('immergo_mode') || 'immergo_immersive'; // Default to immersive

    const updateModeUI = () => {
      // Reset styles
      [modeTeacher, modeImmersive].forEach(btn => {
        btn.style.borderColor = 'transparent';
        btn.style.background = 'transparent';
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'none';
        btn.style.opacity = '0.5'; // Inactive state
      });

      const activeBtn = currentMode === 'immergo_teacher' ? modeTeacher : modeImmersive;

      // Active style
      activeBtn.style.borderColor = 'var(--color-accent-secondary)';
      activeBtn.style.background = 'white';
      activeBtn.style.transform = 'scale(1)';
      activeBtn.style.boxShadow = 'var(--shadow-md)';
      activeBtn.style.opacity = '1';
    };

    modeImmersive.addEventListener('click', () => {
      currentMode = 'immergo_immersive';
      localStorage.setItem('immergo_mode', currentMode);
      updateModeUI();
    });

    modeTeacher.addEventListener('click', () => {
      currentMode = 'immergo_teacher';
      localStorage.setItem('immergo_mode', currentMode);
      updateModeUI();
    });

    updateModeUI();

    // Add change listeners to persist immediately
    fromSelect.addEventListener('change', () => {
      localStorage.setItem('immergo_from_language', fromSelect.value);
    });

    toSelect.addEventListener('change', () => {
      localStorage.setItem('immergo_language', toSelect.value);
    });
  }

  renderMissions() {
    const missions = missionsData;

    const listContainer = this.querySelector('.missions-list');

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'card mission-card';
      card.style.cursor = 'pointer';

      let badgeColor = '#8bc34a';
      if (mission.difficulty === 'Medium') badgeColor = '#ffc107';
      if (mission.difficulty === 'Hard') badgeColor = '#ff9800';
      if (mission.difficulty === 'Expert') badgeColor = '#f44336';

      // Highlight Easy for the first one if we wanted, but sticking to logic
      if (mission.difficulty === 'Easy') badgeColor = '#8bc34a';


      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
          <h3 style="margin: 0; font-size: 1.1rem;">${mission.title}</h3>
          <span style="
            background: ${badgeColor}33;
            color: ${badgeColor};
            padding: 2px 8px;
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            font-weight: 700;
            display: inline-block;
          ">${mission.difficulty}</span>
        </div>
        <p style="margin: 0; font-size: 0.9rem;">${mission.desc}</p>
      `;

      card.addEventListener('click', () => {
        const toSelect = this.querySelector('#to-lang');
        const fromSelect = this.querySelector('#from-lang');

        const selectedToLang = toSelect.value;
        const selectedFromLang = fromSelect.value;
        // currentMode is defined in the closure above? No, it's local to connectedCallback.
        // We need to re-read it or make it accessible. Let's re-read from localStorage for simplicity and safety
        const selectedMode = localStorage.getItem('immergo_mode') || 'immergo_immersive';

        // Save preference
        localStorage.setItem('immergo_language', selectedToLang);
        localStorage.setItem('immergo_from_language', selectedFromLang);

        this.dispatchEvent(new CustomEvent('navigate', {
          bubbles: true,
          detail: {
            view: 'chat',
            mission: mission,
            language: selectedToLang,
            fromLanguage: selectedFromLang,
            mode: selectedMode
          }
        }));
      });

      listContainer.appendChild(card);
    });
  }
}

customElements.define('view-missions', ViewMissions);
