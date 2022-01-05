const { Server } = require('node-osc');
var server = new Server(3333, '0.0.0.0');
server.on('listening', () => {
  console.log('OSC Server is listening.');
})

server.on('message', (msg) => {
  console.log(`Message: ${msg}`);
  server.close();
});

server.on('bundle', function (bundle) {
  bundle.elements.forEach((element, i) => {
    console.log(`Timestamp: ${bundle.timetag[i]}`);
    console.log(`Message: ${element}`);
  });
});
