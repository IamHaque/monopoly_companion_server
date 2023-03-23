// Service for game logic
const GameService = require('./service');

// Home controller
module.exports.home = (req, res) => {
  res.send({
    message: 'Welcome to Monopoly Server',
  });
};

// Return all game data
module.exports.gameData = (req, res) => {
  const gameData = GameService.getGameData();
  res.send({
    gameData: gameData,
  });
};
