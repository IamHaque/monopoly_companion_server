// Helper functions
const { log } = require('./io');
// Service for chat logic
const ChatService = require('./service');

// List of online users
let USERS_ONLINE = {};

module.exports.chatHandler = (socketIO, socket, namespace) => {
  log(`${socket.id} connected`);

  /* ============================= */
  /* ========  Listeners  ======== */
  /* ============================= */

  socket.on('logged_in', handleLogin);

  socket.on('logged_out', handleLogout);

  socket.on('message_sent', handleSentMessage);

  socket.on('disconnect', handleDisconnect);

  socket.on('disconnect', handleDisconnect);

  /* ============================= */
  /* =========  Handlers ========= */
  /* ============================= */

  function handleLogin(payload) {
    const { user } = payload;

    USERS_ONLINE[user] = socket.id;

    // const loggedInUserIndex = USERS_ONLINE.findIndex((item) => item === user);
    // if (loggedInUserIndex < 0) USERS_ONLINE.push(user);

    broadcastAlert(`${user} joined`, 'success');
    broadcastOnlineUsers();
  }

  function handleLogout(payload) {
    const { user } = payload;

    delete USERS_ONLINE[user];

    // const loggedOutUserIndex = USERS_ONLINE.findIndex((item) => item === user);
    // if (loggedOutUserIndex >= 0) USERS_ONLINE.splice(loggedOutUserIndex, 1);

    broadcastAlert(`${user} left`, 'error');
    broadcastOnlineUsers();
  }

  function handleSentMessage(payload) {
    const { from, message } = payload;
    const newMessage = ChatService.addMessage(from, message);

    broadcastNewMessage(newMessage);
  }

  function handleDisconnect() {
    console.log('handleDisconnect');

    const user = Object.keys(USERS_ONLINE).find(
      (user) => USERS_ONLINE[user] === socket.id
    );

    if (!user) return;
    delete USERS_ONLINE[user];

    broadcastAlert(`${user} left`, 'error');
    broadcastOnlineUsers();
  }

  function broadcastAlert(message, type = 'info') {
    socket.broadcast.emit('alert', { message, type });
  }

  function broadcastNewMessage(message) {
    socketIO.of(namespace).emit('new_message', { message });
  }

  function broadcastOnlineUsers() {
    socketIO
      .of(namespace)
      .emit('users_online', { users: Object.keys(USERS_ONLINE) });
  }
};
