// IO provider to read/write game data into file
const IO = require('./io');
// Helper functions
const { generateId } = require('../utils/helper');

// Initial game data
let CHAT_DATA = IO.read() || {};

/* ======================================== */
/* ============ Getter Methods ============ */
/* ======================================== */

const getAll = () => {
  if (!CHAT_DATA.messages) CHAT_DATA.messages = [];
  saveMessages();

  return CHAT_DATA.messages.sort((a, b) => b.timestamp - a.timestamp);
};

/* ======================================== */
/* ============ Checker Methods =========== */
/* ======================================== */

/* ======================================== */
/* ============ Handler Methods =========== */
/* ======================================== */

const addMessage = (from, message) => {
  if (!CHAT_DATA.messages) CHAT_DATA.messages = [];

  CHAT_DATA.messages.push({
    from,
    message,
    timestamp: Date.now(),
  });

  saveMessages();
};

const saveMessages = () => IO.write(CHAT_DATA);

module.exports = {
  getAll,
  addMessage,
};
