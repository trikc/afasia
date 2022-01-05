const wa = require('@open-wa/wa-automate');
const { Client, Message } = require('node-osc');

const fs = require('fs');
const util = require('util');

const oscClient = new Client('127.0.0.1',6010);
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

function fonar(text, i) {
    var filepath = path.join(__dirname, 'out_'+i.toString()+'.wav');
    gtts.save(filepath, text, function() {
      console.log('save done ',i);
    })
}

function start(client) {
  client.onMessage(async message => {
    let toSend = '/'+message.body;
    fonar(message.body, i);
    i = i+1;
    const msg = new Message('/ctrl', "speed", 0.5);

    console.log("...sending: ", msg)
    oscClient.send(msg);
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

