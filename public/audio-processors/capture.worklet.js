/**
 * Copyright 2025 Google LLC
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

/**
 * Audio Worklet Processor for capturing and processing audio
 */

class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input && input.length > 0) {
      const inputChannel = input[0];

      // Buffer the incoming audio
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i];

        // When buffer is full, send it to main thread
        if (this.bufferIndex >= this.bufferSize) {
          // Send the buffered audio to the main thread
          this.port.postMessage({
            type: "audio",
            data: this.buffer.slice(),
          });

          // Reset buffer
          this.bufferIndex = 0;
        }
      }
    }

    // Return true to keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor("audio-capture-processor", AudioCaptureProcessor);
