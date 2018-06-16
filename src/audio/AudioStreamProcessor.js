export default {
  data() {
    return {
      userMediaSupported: false,
      audioStream: null,
      audioContext: null
    };
  },
  created() {
    if (!navigator.getUserMedia)
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!navigator.getUserMedia) {
      console.warn("Capturing user media is not supported by this browser.");
      return;
    }

    this.userMediaSupported = true;
  },
  beforeDestroy() {
    this.stopCapturingAudio();
  },
  methods: {
    startCapturingAudio() {
      navigator.getUserMedia(
        { audio: true, video: false },
        (stream) => this.initializeProcessing(stream),
        () => console.error("Error capturing audio from microphone.")
      );
    },
    stopCapturingAudio() {
      if (this.audioStream) {
        this.audioStream
          .getAudioTracks()
          .forEach(t => t.stop());
        this.audioStream = null;
      }
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
    },
    initializeProcessing(stream) {
      this.audioStream = stream;
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);
      //const lowPassFilter = this.audioContext.createBiquadFilter();
      //lowPassFilter.type = 'lowpass';
      //lowPassFilter.frequency.value = 500;
      const processor = this.audioContext.createScriptProcessor(8192, 1, 1);

      //source.connect(lowPassFilter);
      //lowPassFilter.connect(processor);
      source.connect(processor);
      processor.connect(this.audioContext.destination);

      processor.onaudioprocess = (e) => {
        const buffer = e.inputBuffer;
        const data = buffer.getChannelData(0);

        const min = Math.min(...data);
        const max = Math.max(...data);
        // console.log('min ' + min + ' max ' + max);
        const threshold = min + (max - min) * 0.98;

        if (max > 0.5)
          this.respondToPeak();

        //if (threshold > 0.01)
        //  console.log(threshold);

        let peak;
        for (let i = 0; i < data.length; i++) {
          if (data[i] > threshold)
            peak = data[i];
            break;
        }
        //if (peak)
        //  console.log(peak);
      };
    },
    respondToPeak() {}
  }

};
