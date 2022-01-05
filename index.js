const wa = require('@open-wa/wa-automate');
const { Client, Bundle } = require('node-osc');


const OSCclient = new Client('127.0.0.1', 3333);
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

function start(client) {
  client.onMessage(async message => {
    let toSend = '/'+message.body;
    const bundle = new Bundle(['/one', 1], ['/two', 2], [toSend, 3]);
    console.log("...sending:")
    console.log(bundle);
    OSCclient.send(bundle);
    if (message.body === 'Hi') {
      await client.sendText(message.from, '👋 Hello!');
    }
  });
}

