const fs = require('fs');
const path = require('path');

// Helper functions
const { dt } = require('../utils/helper');

const LOG_FILE_PATH = path.resolve(__dirname, './chat_logs.txt');
const USERS_FILE_PATH = path.resolve(__dirname, './users.json');
const CHAT_FILE_PATH = path.resolve(__dirname, './data.json');

// Read chats from file
module.exports.read = () => readData(CHAT_FILE_PATH);
// Write chats into file
module.exports.write = (data) => writeData(CHAT_FILE_PATH, data);

// Read users from file
module.exports.getAllUsers = () => readData(USERS_FILE_PATH);
// Write users into file
module.exports.saveAllUsers = (data) => writeData(USERS_FILE_PATH, data);

// Log data
module.exports.log = (data) => {
  data = `[CHAT] \t ${data}`;
  console.log(data);

  fs.appendFile(LOG_FILE_PATH, `[${dt()}] \t ${data}\n`, (error) => {
    if (error) {
      console.log('[CHAT] ioError: Failed to log data');
      console.log(error.message);
    }
  });
};

function readData(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeData(filepath, data) {
  fs.writeFile(filepath, JSON.stringify(data, null, 2), (error) => {
    if (error) {
      console.log('[CHAT] ioError: Failed to write');
      console.log(error.message);
    }
  });
}
