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
```

# Correr
```
node index.js

node example_server.js
```
## Configuración supercollider

```
SuperDirt.start;
OSCFunc.trace(false);
n = NetAddr.new("127.0.0.1", 6010);
o = OSCFunc({ arg msg, time, addr, recvPort; [msg, time, addr, recvPort].postln; }, '/ctrl')


n.sendMsg("/ctrl", "speed", 0.1);

```


![fonador](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Respiratory_system_complete_no_labels.svg/568px-Respiratory_system_complete_no_labels.svg.png)

