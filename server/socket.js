const { Server } = require('socket.io');

// Listener for Chat events
const { chatHandler } = require('../chat/socket-handler');
// Listener for Game events
const { gameHandler } = require('../game/socket-handler');

// Namespaces
const NAMESPACE = {
  chat: '/chat',
  monopoly: '/monopoly',
};

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

  // Monopoly Socket connection listener
  socketIO
    .of(NAMESPACE.chat)
    .on('connection', (socket) =>
      chatHandler(socketIO, socket, NAMESPACE.chat)
    );

  // Monopoly Socket connection listener
  socketIO
    .of(NAMESPACE.monopoly)
    .on('connection', (socket) =>
      gameHandler(socketIO, socket, NAMESPACE.monopoly)
    );
};
