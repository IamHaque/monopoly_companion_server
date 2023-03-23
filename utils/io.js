const fs = require('fs');
const path = require('path');

// Helper functions
const { dt } = require('./helper');

const LOG_FILE_PATH = path.resolve(__dirname, './log.txt');
const GAME_FILE_PATH = path.resolve(__dirname, '../game/data.json');

// Read game data from file
module.exports.read = () => {
  const data = fs.readFileSync(GAME_FILE_PATH, 'utf8') || '{}';
  return JSON.parse(data);
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
