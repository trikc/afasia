const wa = require('@open-wa/wa-automate');
const { Client, Message } = require('node-osc');

const fs = require('fs');
const util = require('util');

const tidal = new Client('127.0.0.1',6010);
const supercollider = new Client('127.0.0.1',57120);

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

function start(client) {
  client.onMessage(async message => {
    await client.sendText(message.from, '🗣️');
    console.log(message.body);
    let toSend = '/'+message.body;
    try {
    await fonar(message.body, i, client, message.from);
    const tidalMsg = new Message('/ctrl', "speed", 0.5);
    const recordMsg = new Message('/record'); 
    supercollider.send(recordMsg);
    tidal.send(tidalMsg);
    if (message.body === 'jajaja') {
      await client.sendText(message.from, 'no es gracioso');
    }
    var filepath = path.join(__dirname, 'out_'+i.toString()+'.wav');
    console.log(filepath)
    await client.sendText(message.from, '🗣️');
    i = i+1;
    } catch (e) { await client.sendText(message.from, 'gracias. casi hacés caer al server')}
  });
}

