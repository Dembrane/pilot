class SilenceDetector extends AudioWorkletProcessor {
  constructor(options = {}) {
    super();
    this.threshold = options.threshold || 0.01; // Initial threshold for silence detection
    this.silenceDuration = options.silenceDuration || 3; // Silence duration in seconds
    this.silenceThresholdFrames = this.silenceDuration * sampleRate;
    this.silentFrames = 0;
    this.noiseFloorLevel = 0.01;
    this.adaptationRate = options.adaptationRate || 0.005; // How quickly the threshold adapts to background noise

    this.port.postMessage({
      action: "init",
      threshold: this.threshold,
      silenceDuration: this.silenceDuration,
      silentThresholdFrames: this.silenceThresholdFrames,
      noiseFloorLevel: this.noiseFloorLevel,
      adaptationRate: this.adaptationRate,
    });
  }

  calculateRMS(channelData) {
    const sum = channelData.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / channelData.length);
  }

  process(inputs) {
    const input = inputs[0];
    let isSilent = true;

    // Iterate over all channels to check for silence
    for (const channelData of input) {
      const rms = this.calculateRMS(channelData);

      // Update noise floor level based on RMS of the current frame
      this.noiseFloorLevel +=
        this.adaptationRate * (rms - this.noiseFloorLevel);
      const effectiveThreshold = Math.max(this.noiseFloorLevel, this.threshold);

      if (rms > effectiveThreshold) {
        isSilent = false;
        break;
      }
    }

    if (isSilent) {
      this.silentFrames += input[0].length;
      if (this.silentFrames >= this.silenceThresholdFrames) {
        this.port.postMessage({ action: "pause" });
        this.silentFrames = 0;
      }
    } else {
      if (this.silentFrames > 0) {
        this.port.postMessage({ action: "resume" });
      }
      this.silentFrames = 0;
    }

    return true;
  }
}

registerProcessor("silence-detector", SilenceDetector);
