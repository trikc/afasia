const { RenderingAudioContext } = require("web-audio-engine");

const wa = require("@open-wa/wa-automate");
const fs = require("fs").promises;
const util = require("util");
const gtts = require("node-gtts")("es");
const path = require("path");

const SAMPLE_LIBRARY = {
  piano: [
    { note: "C", octave: 1, file: "samples/piano/C1_mf.wav" },
    { note: "C", octave: 2, file: "samples/piano/C2_mf.wav" },
    { note: "C", octave: 3, file: "samples/piano/C3_mf.wav" },
    { note: "C", octave: 4, file: "samples/piano/C4_mf.wav" },
    { note: "C", octave: 5, file: "samples/piano/C5_mf.wav" },
    { note: "C", octave: 6, file: "samples/piano/C6_mf.wav" },
    { note: "C", octave: 7, file: "samples/piano/C7_mf.wav" },
    { note: "G", octave: 1, file: "samples/piano/G1_mf.wav" },
    { note: "G", octave: 2, file: "samples/piano/G2_mf.wav" },
    { note: "G", octave: 3, file: "samples/piano/G3_mf.wav" },
    { note: "G", octave: 4, file: "samples/piano/G4_mf.wav" },
    { note: "G", octave: 5, file: "samples/piano/G5_mf.wav" },
    { note: "G", octave: 6, file: "samples/piano/G6_mf.wav" },
    { note: "G", octave: 7, file: "samples/piano/G7_mf.wav" },
  ],
};

const OCTAVE = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fonar(text, i, client, destination) {
  var filepath = path.join(__dirname, "out_" + i.toString() + ".wav");
  gtts.save(filepath, text, function () {
    console.log("save done ", i);
  });
  await delay(4000);
  await client.sendAudio(destination, filepath);
}

const exec = util.promisify(require("child_process").exec);

async function callWAE(param, i) {
  let fileName = "sines_" + i;
  let executeWAE = "npx wae sines -o " + fileName + ".wav -V " + param;
  let toMP3 = "ffmpeg -i " + fileName + ".wav " + fileName + ".mp3";
  try {
    console.log("por ej el primer");
    await exec(executeWAE);
    await delay(500);
    console.log("por ej ffmpeg");
    await exec(toMP3);
    console.log("termine ffmpeg");
    //console.log('por sacar del fs el wav')
    //await exec('rm '+fileName+'.wav')
  } catch (err) {
    console.error(err);
  }
}

async function fonarInst(text, i, client, destination) {
  var filepath = path.join(__dirname, "sines_" + i.toString() + ".mp3");
  const param = text.length / 3;

  await callWAE(param.toString(), i.toString());
  console.log("finished fonar waiting");
  await delay(1000);
  console.log("finished fonar ressuming to send");
  await client.sendAudio(destination, filepath);
}

async function start(client) {
  let i = 0;
  client.onMessage(async (message) => {
    await initWAE();

    let toMP3 = "ffmpeg -i " + "out" + ".wav " + "out" + ".mp3";
    await exec(toMP3);

    i += 1;
    //await client.sendText(message.from, '🗣️');
    console.log(message.body);
    let toSend = "/" + message.body;
    try {
      // await fonarInst(message.body, i, client, message.from);
      //await fonar(message.body, i, client, message.from);
      // if (message.body === "jajaja") {
      //   await client.sendText(message.from, "no es gracioso");
      // }
      var filepath = path.join(__dirname, "out.mp3");
      await client.sendText(message.from, "🗣️");
      await client.sendAudio(message.from, filepath);
    } catch (e) {
      await client.sendText(message.from, "gracias. casi hacés caer al server");
    }
  });
}

async function loadSample(audioCtx, s) {
  return fs.readFile(s).then((data) => audioCtx.decodeAudioData(data.buffer));
}

function noteValue(note, octave) {
  return octave * 12 + OCTAVE.indexOf(note);
}

function getNoteDistance(note1, octave1, note2, octave2) {
  return noteValue(note1, octave1) - noteValue(note2, octave2);
}

function getNearestSample(sampleBank, note, octave) {
  let sortedBank = sampleBank.slice().sort((sampleA, sampleB) => {
    let distanceToA = Math.abs(
      getNoteDistance(note, octave, sampleA.note, sampleA.octave)
    );
    let distanceToB = Math.abs(
      getNoteDistance(note, octave, sampleB.note, sampleB.octave)
    );
    return distanceToA - distanceToB;
  });
  return sortedBank[0];
}

function flatToSharp(note) {
  switch (note) {
    case "Bb":
      return "A#";
    case "Db":
      return "C#";
    case "Eb":
      return "D#";
    case "Gb":
      return "F#";
    case "Ab":
      return "G#";
    default:
      return note;
  }
}

const noteRegex = /^(\w[b\#]?)(\d)$/;

async function getSample(audioCtx, instrument, noteAndOctave) {
  let [, requestedNote, requestedOctave] = noteRegex.exec(noteAndOctave);
  requestedOctave = parseInt(requestedOctave, 10);
  requestedNote = flatToSharp(requestedNote);
  let sampleBank = SAMPLE_LIBRARY[instrument];
  let sample = getNearestSample(sampleBank, requestedNote, requestedOctave);
  let distance = getNoteDistance(
    requestedNote,
    requestedOctave,
    sample.note,
    sample.octave
  );

  return loadSample(audioCtx, sample.file).then((audioBuffer) => ({
    audioBuffer,
    distance,
  }));
}

async function playSample(audioCtx, instrument, note, delay) {
  await getSample(audioCtx, instrument, note).then(
    ({ audioBuffer, distance }) => {
      let playbackRate = Math.pow(2, distance / 12);
      let bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.playbackRate.value = playbackRate;
      bufferSource.connect(audioCtx.destination);
      bufferSource.start(audioCtx.currentTime + delay);
    }
  );
}

async function playVoice(audioCtx, filename, delay, effects) {
  const audioBuffer = await loadSample(audioCtx, filename);
  let bufferSource = audioCtx.createBufferSource();
  bufferSource.buffer = audioBuffer;

  const initialNode = bufferSource;
  const finalNode = audioCtx.destination;
  let currentNode = initialNode;

  for (const effect of effects) {
    currentNode.connect(effect);
    console.log("connected", currentNode, "to", effect);
    currentNode = effect;
  }

  console.log("connected", currentNode, "to", finalNode);
  currentNode.connect(finalNode);

  bufferSource.start(audioCtx.currentTime + delay);
}

function effectDistort(audioCtx, amount) {
  const waveShaper = audioCtx.createWaveShaper();

  const k = typeof amount === "number" ? amount : 50;
  const nSamples = 44100;
  const curve = new Float32Array(nSamples);
  const deg = Math.PI / 180;
  let x = 0;

  for (let i = 0; i < nSamples; ++i) {
    x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }

  waveShaper.curve = curve;
  waveShaper.oversample = "4x";

  return waveShaper;
}

function effectLPF(audioCtx) {
  const iirFilter = audioCtx.createIIRFilter(
    [0.0012681742, 0.0025363483, 0.0012681742],
    [1.0317185917, -1.9949273033, 0.9682814083]
  );

  return iirFilter;
}

function effectCompressor(audioCtx) {
  const compressor = audioCtx.createDynamicsCompressor();

  compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
  compressor.knee.setValueAtTime(40, audioCtx.currentTime);
  compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
  compressor.attack.setValueAtTime(0, audioCtx.currentTime);
  compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

  return compressor;
}

function effectBiquad(audioCtx) {
  const biquadFilter = audioCtx.createBiquadFilter();
  biquadFilter.type = "lowshelf";
  biquadFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  biquadFilter.gain.setValueAtTime(25, audioCtx.currentTime);

  return biquadFilter;
}

function partialShuffle(values, count) {
  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * (values.length - i)) + i;
    [values[i], values[j]] = [values[j], values[i]];
  }
}

function effectWaveloss(audioCtx, n) {
  const scriptNode = audioCtx.createScriptProcessor(4096, 2, 2);

  scriptNode.onaudioprocess = (audioProcessingEvent) => {
    let inBuf = audioProcessingEvent.inputBuffer;
    let outBuf = audioProcessingEvent.outputBuffer;

    for (let chan = 0; chan < outBuf.numberOfChannels; chan++) {
      let inData = inBuf.getChannelData(chan);
      let outData = outBuf.getChannelData(chan);

      partialShuffle(inData, n);

      for (let sample = 0; sample < inBuf.length; sample++) {
        outData[sample] = inData[sample];
      }
    }
  };

  return scriptNode;
}

function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var rand = Math.floor(Math.random() * (i + 1));
    [array[i], array[rand]] = [array[rand], array[i]];
  }
}

// split the buffer into n chunks, and randomize them
function effectGlitch(audioCtx, n) {
  const scriptNode = audioCtx.createScriptProcessor(4096, 2, 2);

  scriptNode.onaudioprocess = (audioProcessingEvent) => {
    let inBuf = audioProcessingEvent.inputBuffer;
    let outBuf = audioProcessingEvent.outputBuffer;

    for (let chan = 0; chan < outBuf.numberOfChannels; chan++) {
      let inData = inBuf.getChannelData(chan);
      let outData = outBuf.getChannelData(chan);

      const chunkSize = inBuf.length / n;
      let chunks = [];

      for (let i = 0; i < inBuf.length; i += chunkSize) {
        const chunk = inData.slice(i, i + chunkSize);
        chunks.push(chunk);
      }

      shuffle(chunks);

      // types arrays don't support concat
      let newInData = new Float32Array(inBuf.length);
      for (let i = 0, offset = 0; i < n; i++) {
        newInData.set(chunks[i], offset);
        offset += chunkSize;
      }

      for (let sample = 0; sample < inBuf.length; sample++) {
        outData[sample] = newInData[sample];
      }
    }
  };

  return scriptNode;
}

async function saveToFile(filename, audioCtx) {
  const audioData = audioCtx.exportAsAudioData();

  await audioCtx.encodeAudioData(audioData).then(async (arrayBuffer) => {
    await fs.writeFile(filename, new Buffer.from(arrayBuffer));
  });
}

async function initWAE() {
  const audioCtx = new RenderingAudioContext();

  // Effects
  const distort = effectDistort(audioCtx, 9000);
  const lpf = effectLPF(audioCtx);
  const compressor = effectCompressor(audioCtx);
  const biquad = effectBiquad(audioCtx);
  const waveloss = effectWaveloss(audioCtx, 400);
  const glitch = effectGlitch(audioCtx, 8);

  await playVoice(audioCtx, "samples/gtts/de_que_organos.wav", 0, [glitch]);

  audioCtx.processTo("00:00:10.000");

  await saveToFile("out.wav", audioCtx);
}

async function main() {
  // wa.create({
  //   sessionId: "AFASIA_DE_WERNICKE",
  //   multiDevice: true, // required to enable multiDevice support
  //   authTimeout: 60, // wait only 60 seconds to get a connection with the host account device
  //   blockCrashLogs: true,
  //   disableSpins: true,
  //   headless: true,
  //   hostNotificationLang: "ES_AR",
  //   logConsole: true,
  //   popup: true,
  //   useChrome: true,
  //   qrTimeout: 0, // 0 means it will wait forever for you to scan the qr code
  // }).then((client) => start(client));

  await initWAE();
}

main();
