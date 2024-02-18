const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 }); // WebSocket server on port 8080

wss.on('connection', function connection(ws) {
  console.log('A new client connected');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  // Example function to send data to all connected clients
  const broadcastData = (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  };

  // Assuming you have a parser.on('data') for your serial port
  parser.on('data', (data) => {
    // Broadcast Arduino data to all connected WebSocket clients
    broadcastData(data);
  });
});