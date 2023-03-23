// IO provider to read/write history into file
const IO = require('../utils/io');

// Initial history
let HISTORY = IO.readHistory() || {};

// Returns all history from file
const getAllHistory = () => HISTORY;

// Returns all history of room
const getRoomHistory = (roomId) => {
  return HISTORY[roomId];
};

// Adds history to specified room
const addToRoomHistory = (roomId, message, type) => {
  // crate a new room if does not exist
  if (!isValidRoom(roomId)) {
    HISTORY[roomId] = [];
  }

  // create history action
  const action = {
    type,
    message,
    timestamp: Date.now(),
  };

  // insert player into room
  HISTORY[roomId].push(action);

  // save history into file
  saveHistory();
};

// Checks if room exists
const isValidRoom = (roomId) => {
  return Object.keys(HISTORY).includes(roomId);
};

// Stores history into file
const saveHistory = () => IO.writeHistory(HISTORY);

module.exports = {
  getRoomHistory,
  addToRoomHistory,
};
