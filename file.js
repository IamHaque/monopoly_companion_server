const fs = require('fs');

const LOG_FILE_PATH = './log.log';
const PLAYERS_FILE_PATH = './players.json';

module.exports.read = () => {
  const data = fs.readFileSync(PLAYERS_FILE_PATH, 'utf8') || '[]';
  return JSON.parse(data);
};

module.exports.write = (data) => {
  fs.writeFile(PLAYERS_FILE_PATH, JSON.stringify(data, null, 2), (err) => {});
};

module.exports.log = (data) => {
  console.log(data);
  fs.appendFile(LOG_FILE_PATH, `[${dt()}] \t ${data}\n`, (err) => {});
};

const dt = () => {
  var today = new Date();
  var date =
    today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
  var time =
    today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
  return `${date} ${time}`;
};
