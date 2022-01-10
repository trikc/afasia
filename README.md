AFASIA DE WENICKE
==================
# Lemma

> Joker: If you're good at something, do it for nothing.
- Karen.

# Instalar
> node y npm últimos (usá nvm)


```
npm install node-osc 
npm i --save @open-wa/wa-automate@latest
npm install wae-cli
```

# Correr
```
node index.js

node example_server.js
```

## testear wae por separado

```
npx wae sines -o sines.wav -V 0.4
```

> como se ve, el último argumento es un parámetro libre!!

[Documentacion parte audio node](https://github.com/mohayonao/web-audio-engine)
[con su correspondiente cli](https://github.com/mohayonao/wae-cli)

Dentro del wae cli podemos usar la Web Audio API tranquilamente:
[tuto web audio api muchas cosas](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
[tuto web audio api evanzado](https://medium.com/creative-technology-concepts-code/recording-syncing-and-exporting-web-audio-1e1a1e35ef08)


## Configuración supercollider

```
SuperDirt.start;
OSCFunc.trace(false);
n = NetAddr.new("127.0.0.1", 6010);
o = OSCFunc({ arg msg, time, addr, recvPort; [msg, time, addr, recvPort].postln; }, '/ctrl')


n.sendMsg("/ctrl", "speed", 0.1);

```
[Docu tidal](http://tidalcycles.org/docs/getting-started/tidal_start/)
[tidal OSC ](https://tidalcycles.org/docs/configuration/MIDIOSC/osc/#controller-input)
[Supercollider OSC](https://doc.sccode.org/Guides/OSC_communication.html)
[grabar supercollider](http://depts.washington.edu/dxscdoc/Help/Classes/Recorder.html)

![fonador](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Respiratory_system_complete_no_labels.svg/568px-Respiratory_system_complete_no_labels.svg.png)

