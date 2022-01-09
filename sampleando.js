//import fetch from 'node-fetch';
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
//const fetch = require("node-fetch")
function toArrayBuffer(buf) {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}
const fs = require('fs');
const audioBuffer = fs.readFileSync('./out.wav')
console.log(audioBuffer.constructor)
console.log(audioBuffer instanceof ArrayBuffer)
console.log("HOLAAAAA")
console.log(`Hello ${process.argv[6]}`);
const tempBuffer = new Uint8Array(audioBuffer).buffer;
//opcion 2
//const tempBuffer = toArrayBuffer(audioBuffer)
console.log(tempBuffer instanceof ArrayBuffer)
const buffer = audioContext.decodeAudioData(tempBuffer);


let context = audioContext


var bufSrc = context.createBufferSource();
    var delay = context.createDelay();
    var lfo1 = context.createOscillator();
    var lfo2 = context.createGain();
    var amp1 = context.createGain();
    var amp2 = context.createGain();

    bufSrc.buffer = buffer;
    bufSrc.loop = false;
    console.log(context.currentTime);
    bufSrc.start(context.currentTime);
    bufSrc.connect(amp1);
    bufSrc.connect(delay);

    lfo1.frequency.value = 0.125;
    lfo1.start(context.currentTime);
    lfo1.connect(lfo2);

    lfo2.gain.value = 0.015;
    lfo2.connect(delay.delayTime);

    delay.delayTime.value = 0.03;
    delay.connect(amp2);

    amp1.gain.value = 0.6;
    amp1.connect(context.destination);

    amp2.gain.value = 0.4;
    amp2.connect(context.destination);





































//const osc = audioContext.createOscillator();
//const amp = audioContext.createGain();
//var track = audioContext.createBufferSource();
//track.buffer = buffer;
////track.connect(audioContext.destination);
//console.log(audioContext);
//
//let gainParam = process.argv[6];
////osc.type = "square";
////osc.frequency.setValueAtTime(987.7666, 0);
////osc.frequency.setValueAtTime(1318.5102, 0.075);
////osc.start(0);
////osc.stop(2);
////osc.connect(amp);
//track.connect(amp);
////osc.onended = () => {
////  process.exit();
////};
////
//amp.gain.setValueAtTime(0.25, 0);
//amp.gain.setValueAtTime(0.25, 0.075);
//amp.gain.linearRampToValueAtTime(0, gainParam);
//amp.connect(audioContext.destination);
