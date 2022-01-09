//import fetch from 'node-fetch';
//const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
//
//var audioFile = fetch("do.wav").then(response => response.arrayBuffer()).then(buffer => audioContext.decodeAudioData(buffer)).then(buffer => {
//    var track = audioContext.createBufferSource();
//    track.buffer = buffer;
//    track.connect(audioContext.destination);
//});
const osc = audioContext.createOscillator();
const amp = audioContext.createGain();
console.log("HOLAAAAA")
console.log(`Hello ${process.argv[6]}`);
console.log(audioContext);

let gainParam = process.argv[6];
osc.type = "square";
osc.frequency.setValueAtTime(987.7666, 0);
osc.frequency.setValueAtTime(1318.5102, 0.075);
osc.start(0);
osc.stop(2);
osc.connect(amp);
osc.onended = () => {
  process.exit();
};

amp.gain.setValueAtTime(0.25, 0);
amp.gain.setValueAtTime(0.25, 0.075);
amp.gain.linearRampToValueAtTime(0, gainParam);
amp.connect(audioContext.destination);
