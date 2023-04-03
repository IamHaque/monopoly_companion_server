const fs = require('fs');
const path = require('path');

const UPI_PATH = path.resolve(__dirname, './upi.json');
const LIFAFAS_PATH = path.resolve(__dirname, './data.json');

module.exports.read = () => readFile(LIFAFAS_PATH);
module.exports.write = (data) => writeFile(LIFAFAS_PATH, data);

module.exports.loadUpiIds = () => readFile(UPI_PATH);
module.exports.saveUpiIds = (data) => writeFile(UPI_PATH, data);

function readFile(file) {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function writeFile(file, data) {
  fs.writeFile(file, JSON.stringify(data, null, 2), (error) => {
    if (error) {
      console.log('ioError: Failed to write');
      console.log(error.message);
    }
  });
}
