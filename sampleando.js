const fs = require("fs");

module.exports = (audioCtx) => {
  const sample = fs.readFileSync("./out.wav");

  return audioCtx
    .decodeAudioData(sample.buffer)
    .then((audioBuffer) => {
      var bufSrc = audioCtx.createBufferSource();

      bufSrc.buffer = audioBuffer;
      bufSrc.loop = false;
      bufSrc.start(audioCtx.currentTime);

      bufSrc.connect(audioCtx.destination);
    })
    .catch((e) => console.log("error:", e));
};
