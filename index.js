const wa = require('@open-wa/wa-automate');
const { Client, Message } = require('node-osc');


const fs = require('fs');

//const tidal = new Client('127.0.0.1',6010);
//const supercollider = new Client('127.0.0.1',57120);

// Import other required libraries
// Creates a client
var gtts = require('node-gtts')('es');
var path = require('path');

wa.create({
  sessionId: "AFASIA_DE_WERNICKE",
  multiDevice: true, //required to enable multiDevice support
  authTimeout: 60, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'ES_AR',
  logConsole: true,
  popup: true,
  useChrome:true,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
}).then(client => start(client));
let i=0

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function fonar(text, i, client, destination) {
    var filepath = path.join(__dirname, 'out_'+i.toString()+'.wav');
    gtts.save(filepath, text, function() {
      console.log('save done ',i);
    })
    await delay(4000);
    await client.sendAudio(destination, filepath)
}

const util = require('util');
const exec = util.promisify(require('child_process').exec);
async function callWAE(param, i) {
  let fileName = 'sines_'+i;
  let executeWAE='npx wae sines -o '+fileName+'.wav -V '+param
  let toMP3='ffmpeg -i '+fileName+'.wav '+fileName+'.mp3'
  try {
      console.log("por ej el primer")
      await exec(executeWAE);
      await delay(500)
      console.log("por ej ffmpeg")
      await exec(toMP3)
      console.log("termine ffmpeg")
      //console.log('por sacar del fs el wav')
      //await exec('rm '+fileName+'.wav')
  }catch (err){
     console.error(err);
  };
};


async function fonarInst(text, i, client,destination){
    var filepath = path.join(__dirname, 'sines_'+i.toString()+'.mp3');
    const param = text.length/3;

    await callWAE(param.toString(), i.toString());
    console.log("finished fonar waiting")
    await delay(1000);
    console.log("finished fonar ressuming to send")
    await client.sendAudio(destination, filepath);

}
function start(client) {
  client.onMessage(async message => {
    i = i+1;
    //await client.sendText(message.from, '🗣️');
    console.log(message.body);
    let toSend = '/'+message.body;
    try {
        await fonarInst(message.body, i, client, message.from);
        //await fonar(message.body, i, client, message.from);
        //const tidalMsg = new Message('/ctrl', "speed", message.body.length);
        //const recordMsg = new Message('/record_start'); 
        //supercollider.send(recordMsg);
        //console.log("mandè mensaje de grabado")
        //tidal.send(tidalMsg);
        if (message.body === 'jajaja') {
          await client.sendText(message.from, 'no es gracioso');
        }
        var filepath = path.join(__dirname, 'sines_'+i.toString()+'.wav');
        console.log(filepath)
        await client.sendText(message.from, '🗣️');
    } catch (e) { await client.sendText(message.from, 'gracias. casi hacés caer al server')}
  });
}

