// Helper functions
const { log } = require('./io');
// Service for chat logic
const ChatService = require('./service');

module.exports.chatHandler = (socketIO, socket, namespace) => {
  log(`${socket.id} connected`);

  /* ============================= */
  /* ========  Listeners  ======== */
  /* ============================= */

  socket.on('logged_in', handleLogin);

  socket.on('logged_out', handleLogout);

  socket.on('message_sent', handleSentMessage);

  /* ============================= */
  /* =========  Handlers ========= */
  /* ============================= */

  function handleLogin(payload) {
    const { username } = payload;
    broadcastAlert(`${username} joined`, 'success');
    broadcastAllMessages();
  }

  function handleLogout(payload) {
    const { username } = payload;
    broadcastAlert(`${username} left`, 'error');
    broadcastAllMessages();
  }

  function handleSentMessage(payload) {
    const { from, message } = payload;
    ChatService.addMessage(from, message);

    broadcastAllMessages();
  }

  function broadcastAlert(message, type = 'info') {
    socket.broadcast.emit('alert', { message, type });
  }

  function broadcastAllMessages() {
    const messages = ChatService.getAll();
    socketIO.of(namespace).emit('all_messages', { messages });
  }
};
