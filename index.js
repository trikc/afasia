const { RenderingAudioContext } = require("web-audio-engine");

const wa = require("@open-wa/wa-automate");
const fs = require("fs").promises;
const util = require("util");
const gtts = require("node-gtts")("es");
const path = require("path");
const exec = util.promisify(require("child_process").exec);

const { Container } = require("@nlpjs/core");
const { SentimentAnalyzer } = require("@nlpjs/sentiment");
const { LangEs } = require("@nlpjs/lang-es");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const toMP3 = (filepathWAV, filepathMP3) =>
  "ffmpeg -i " + filepathWAV + " " + filepathMP3;
const toWAV = (filepathMP3, filepathWAV) =>
  "ffmpeg -i " + filepathMP3 + " " + filepathWAV;

async function fonar(text, i, client, destination) {
  var filepathMP3 = path.join(__dirname, "raw_" + i.toString() + ".mp3");
  var filepathWAV = path.join(__dirname, "raw_" + i.toString() + ".wav");

  gtts.save(filepathMP3, text, function () {
    console.log("save done ", i);
  });

  //ffmpeg(filepathMP3).toFormat('wav').on('error', (err) => {console.log('An error occurred: ' + err.message);}).save(filepathWAV);
  await delay(2000);
  await exec(toWAV(filepathMP3,filepathWAV));
  console.log("pasado a wav");
  //await fs.unlink(filepathMP3);
  //await client.sendAudio(destination, filepath);
  return filepathWAV;
}

async function start(client) {
  let i = 0;
  client.onMessage(async (message) => {
    i += 1;
    console.log(message.body);
    try {
      const rawFilepath = await fonar(message.body, i, client, message.from);
      const params = await analizeText(message.body);
      console.log(params);
      console.log(">>>>>>>>>>>>>>>>>>");
      const resultFilepath = await applyAudioEffects(rawFilepath, i);
      console.log(
        "Despues de apply audioeffects. nos dio el filepath ",
        resultFilepath
      );
      var finalAudioPath = path.join(__dirname, "out_" + i.toString() + ".mp3");
      //ffmpeg(resultFilepath).toFormat('mp3').save(finalAudioPath);
      await exec(toMP3(resultFilepath, finalAudioPath));
      console.log(
        "despues de llamar a ffmpeg con el filepath ",
        resultFilepath
      );
      await delay(4000);
      await client.sendText(message.from, "🗣️");
      await client.sendAudio(message.from, finalAudioPath);
    } catch (e) {
      console.log(e);
      await client.sendText(message.from, "gracias. casi hacés caer al server");
    }
  });
}

async function loadSample(audioCtx, s) {
  return fs.readFile(s).then((data) => audioCtx.decodeAudioData(data.buffer));
}

async function analizeText(text) {
  let length = text.length;
  const container = new Container();
  container.use(LangEs);
  console.log("container use", container);
  const sentiment = new SentimentAnalyzer({ container });
  console.log("despues de sentiment ", sentiment);
  const result = await sentiment.process({ locale: "es", text: text });
  console.log("result ", result);
  let res = {
    length: length,
    sentiment: result.sentiment.score,
    total_words: result.sentiment.numWords,
    sent_words: result.sentiment.numHits,
    sent_average: result.sentiment.average,
  };
  console.log(res);
  return res;
}

async function playVoice(audioCtx, filename, delay, effects) {
  console.log("dentro de playvoice. se le dio el filename ,", filename);
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

async function applyAudioEffects(raw_filepath, i) {
  const audioCtx = new RenderingAudioContext();
  console.log("aca en apply audio effects");
  // Effects
  const distort = effectDistort(audioCtx, 9000);
  const lpf = effectLPF(audioCtx);
  const compressor = effectCompressor(audioCtx);
  const biquad = effectBiquad(audioCtx);
  const waveloss = effectWaveloss(audioCtx, 400);
  const glitch = effectGlitch(audioCtx, 8);

  await playVoice(audioCtx, raw_filepath, 0, [glitch]);
  console.log("despues de playvoice");

  audioCtx.processTo("00:00:10.000");

  var filepath = path.join(__dirname, "out_" + i.toString() + ".wav");
  await saveToFile(filepath, audioCtx);
  console.log("despues de guardar");
  return filepath;
}

async function main() {
  wa.create({
    sessionId: "AFASIA_DE_WERNICKE",
    multiDevice: true, // required to enable multiDevice support
    authTimeout: 60, // wait only 60 seconds to get a connection with the host account device
    blockCrashLogs: true,
    disableSpins: true,
    headless: true,
    hostNotificationLang: "ES_AR",
    logConsole: true,
    popup: true,
    useChrome: true,
    qrTimeout: 0, // 0 means it will wait forever for you to scan the qr code
  }).then((client) => start(client));
}

main();
