const fs = require('fs');
const path = require('path');

const LIFAFAS_PATH = path.resolve(__dirname, './data.json');

module.exports.read = () => {
  try {
    const data = fs.readFileSync(LIFAFAS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
};

module.exports.write = (data) => {
  fs.writeFile(LIFAFAS_PATH, JSON.stringify(data, null, 2), (error) => {
    if (error) {
      console.log('ioError: Failed to write');
      console.log(error.message);
    }
  });
};
