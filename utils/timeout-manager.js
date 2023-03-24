// List of active timeouts
let activeTimeouts = [];

// Adds a timeout to the list
module.exports.addTimeout = (timeout) => {
  activeTimeouts.push(timeout);
};

// Resets the timeout list
module.exports.clearTimeouts = () => {
  activeTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeTimeouts = [];
};
