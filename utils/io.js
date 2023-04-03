const fs = require('fs');
const path = require('path');

// Helper functions
const { dt } = require('./helper');

const LOG_FILE_PATH = path.resolve(__dirname, './log.txt');
const GAME_FILE_PATH = path.resolve(__dirname, '../game/data.json');
const HISTORY_FILE_PATH = path.resolve(__dirname, '../game/history.json');

// Read game data from file
module.exports.read = () => {
  try {
    const data = fs.readFileSync(GAME_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

// Write game data into file
module.exports.write = (data) => {
  fs.writeFile(GAME_FILE_PATH, JSON.stringify(data, null, 2), (error) => {
    if (error) {
      console.log('ioError: Failed to write game data');
      console.log(error.message);
    }
  });
};

// Read history from file
module.exports.readHistory = () => {
  try {
    const data = fs.readFileSync(HISTORY_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

// Write history into file
module.exports.writeHistory = (data) => {
  fs.writeFile(HISTORY_FILE_PATH, JSON.stringify(data, null, 2), (error) => {
    if (error) {
      console.log('ioError: Failed to write history');
      console.log(error.message);
    }
  });
};

// Log data
module.exports.log = (data) => {
  console.log(data);
  fs.appendFile(LOG_FILE_PATH, `[${dt()}] \t ${data}\n`, (error) => {
    if (error) {
      console.log('ioError: Failed to log data');
      console.log(error.message);
    }
  });
};
