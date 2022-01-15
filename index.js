const { RenderingAudioContext } = require("web-audio-engine");

const wa = require("@open-wa/wa-automate");
const fs = require("fs");
const util = require("util");
const gtts = require("node-gtts")("es");
const path = require("path");

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

function start(client) {
  let i = 0;
  client.onMessage(async (message) => {
    i += 1;
    //await client.sendText(message.from, '🗣️');
    console.log(message.body);
    let toSend = "/" + message.body;
    try {
      await fonarInst(message.body, i, client, message.from);
      //await fonar(message.body, i, client, message.from);
      if (message.body === "jajaja") {
        await client.sendText(message.from, "no es gracioso");
      }
      var filepath = path.join(__dirname, "sines_" + i.toString() + ".wav");
      console.log(filepath);
      await client.sendText(message.from, "🗣️");
    } catch (e) {
      await client.sendText(message.from, "gracias. casi hacés caer al server");
    }
  });
}

async function loadSample(s, audioCtx) {
  const sample = fs.readFileSync(s);

  const audioBuffer = await audioCtx.decodeAudioData(sample.buffer);
  const bufSrc = audioCtx.createBufferSource();

  bufSrc.buffer = audioBuffer;
  bufSrc.loop = false;

  return bufSrc;
}

async function saveToFile(filename, audioCtx) {
  const audioData = audioCtx.exportAsAudioData();

  await audioCtx.encodeAudioData(audioData).then((arrayBuffer) => {
    fs.writeFileSync(filename, new Buffer.from(arrayBuffer));
  });
}

async function initWAE() {
  const audioCtx = new RenderingAudioContext();

  const kick = await loadSample("samples/kick.wav", audioCtx);

  kick.start(audioCtx.currentTime);
  kick.connect(audioCtx.destination);

  audioCtx.processTo("00:00:10.000");

  await saveToFile("out.wav", audioCtx);
}

function main() {
  /*
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
  */

  initWAE();
}

main();
