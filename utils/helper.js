const { v4: uuidv4 } = require('uuid');

// Generates random UUID of given length
module.exports.generateId = (length = undefined) => {
  // get uuid
  let uuid = uuidv4();
  // remove - decorator
  uuid = uuid.replace(/-/g, '');
  // return substring of given length
  return uuid.substring(0, length);
};

// Capitalizes each word of str
module.exports.capitalize = (str) => {
  return str
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Current time in DD-MM-YYYY hh:mm:ss format
module.exports.dt = () => {
  var today = new Date();

  const DD = today.getDate();
  const MM = today.getMonth() + 1;
  const YYYY = today.getFullYear();

  const hh = today.getHours();
  const mm = today.getMinutes();
  const ss = today.getSeconds();

  return `${DD}-${MM}-${YYYY} ${hh}:${mm}:${ss}`;
};

// Colors array for players in game room
module.exports.COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
];
