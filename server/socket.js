const { Server } = require('socket.io');

// Listener for Game events
const { gameHandler } = require('../game/socket-handler');

module.exports = (server) => {
  // Configure socket options
  const options = {
    cors: {
      origin: ['http://localhost:5173', 'https://monopoly.subhanhaque.uk'],
      credentials: true,
    },
  };

  // Socket initialization
  const socketIO = new Server(server, options);

  // Socket connection listener
  socketIO.on('connection', (socket) => gameHandler(socketIO, socket));
};
