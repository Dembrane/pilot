class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    console.log("SilenceDetector constructor");
    super();
    this.silentFrames = 0;
    this.threshold = 0.01;
    this.silenceThresholdFrames = 3 * sampleRate;
  }

  process(inputs) {
    const input = inputs[0];
    const channelData = input[0];
    let isSilent = true;

    for (let i = 0; i < channelData.length; i++) {
      if (Math.abs(channelData[i]) > this.threshold) {
        isSilent = false;
        break;
      }
    }

    if (isSilent) {
      this.silentFrames += channelData.length;
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
