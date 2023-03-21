const crypto = require('crypto');

const generateId = (length = 6) =>
  crypto.randomBytes(length / 2).toString('hex');

module.exports = { generateId };
