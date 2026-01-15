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

class AudioVisualizer extends HTMLElement {
    constructor() {
        super();
        this.active = false;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.animationId = null;
    }

    connectedCallback() {
        this.style.display = 'block';
        this.style.width = '100%';
        this.style.height = '100%'; // Allow height to be controlled by parent or CSS

        this.innerHTML = `
      <canvas style="width: 100%; height: 100%; display: block;"></canvas>
    `;
        this.canvas = this.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Handle resizing
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this);

        window.addEventListener('resize', () => this.resize());
        this.resize();
        this.drawIdle();
    }

    disconnectedCallback() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.stopAudio();
    }

    resize() {
        const rect = this.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        if (!this.active) this.drawIdle();
    }

    /**
     * Connect an audio source to this visualizer
     * @param {AudioContext} audioContext 
     * @param {AudioNode} sourceNode 
     */
    connect(audioContext, sourceNode) {
        if (this.analyser) {
            this.disconnect();
        }

        try {
            this.audioContext = audioContext;
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;

            this.source = sourceNode;
            this.source.connect(this.analyser);

            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.active = true;
            this.animate();
        } catch (err) {
            console.error('Error connecting visualizer:', err);
        }
    }

    disconnect() {
        this.active = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.source && this.analyser) {
            // Be careful not to disconnect source from other destinations if fan-out is used
            // But here we only connected source->analyser, so we can disconnect source->dest?
            // Actually source.disconnect() disconnects ALL outputs. That's bad.
            // We should only disconnect source -> analyser.
            try {
                this.source.disconnect(this.analyser);
            } catch (e) {
                // Ignore if already disconnected
            }
        }
        this.analyser = null;
        this.source = null;
        this.audioContext = null;
        this.drawIdle();
    }

    setActive(isActive) {
        // Legacy support or external control to pause rendering
        // connect/disconnect manages active state now mostly
        this.active = isActive;
        if (!this.active) {
            this.drawIdle();
        } else {
            if (this.analyser) this.animate();
        }
    }

    drawIdle() {
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);

        // Draw a simple straight line in the center when idle
        this.ctx.beginPath();
        this.ctx.moveTo(0, height / 2);
        this.ctx.lineTo(width, height / 2);
        this.ctx.strokeStyle = '#5c6b48'; // Primary accent color
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.3;
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }

    animate() {
        if (!this.active || !this.analyser) return;

        this.animationId = requestAnimationFrame(() => this.animate());

        this.analyser.getByteTimeDomainData(this.dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#5c6b48'; // Primary accent color
        ctx.beginPath();

        // Configuration for "Guitar String" effect
        const pointsCount = 20; // Number of control points (lower = smoother curve)
        const lerpFactor = 0.3; // Smoothing factor (higher = faster response)
        const amplitudeScale = 10.0; // Scale up the vibration significantly

        // Initialize points array if not exists
        if (!this.points || this.points.length !== pointsCount) {
            this.points = new Array(pointsCount).fill(0);
        }

        const sliceWidth = width / (pointsCount - 1);

        // Calculate target positions based on audio data
        // We skip through the buffer to get 'pointsCount' samples
        const bufferStep = Math.floor(this.dataArray.length / pointsCount);

        for (let i = 0; i < pointsCount; i++) {
            // Get raw audio value (0-255)
            const audioIndex = Math.min(i * bufferStep, this.dataArray.length - 1);
            let val = (this.dataArray[audioIndex] / 128.0) - 1.0; // Range -1 to 1

            // Apply specific "Guitar String" windowing: 
            // Fixed at ends (i=0, i=max), max in middle.
            // Using a simple sine half-wave.
            const normalization = i / (pointsCount - 1); // 0 to 1
            const window = Math.sin(normalization * Math.PI); // 0 -> 1 -> 0

            // Target Y offset from center
            const targetY = val * (height * 0.4) * amplitudeScale * window;

            // Apply LERP smoothing to reduce jitter
            this.points[i] += (targetY - this.points[i]) * lerpFactor;
        }

        // Draw the curve
        // Start at left center (fixed)
        ctx.moveTo(0, height / 2);

        // We use quadratic curves between midpoints for extra smoothness
        for (let i = 0; i < pointsCount; i++) {
            const x = i * sliceWidth;
            const y = (height / 2) + this.points[i];

            // Use Quadratic curves for fluid line
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                const prevX = (i - 1) * sliceWidth;
                const prevY = (height / 2) + this.points[i - 1];
                const cx = (prevX + x) / 2;
                const cy = (prevY + y) / 2;
                ctx.quadraticCurveTo(prevX, prevY, cx, cy);
            }
        }

        // Ensure we connect to the very end
        ctx.lineTo(width, height / 2);

        ctx.stroke();
    }
}

customElements.define('audio-visualizer', AudioVisualizer);
