const players = require('express').Router();

const { getAllPlayers } = require('../players');

players.get('/players', async function (req, res) {
  const players = getAllPlayers();
  res.send({ players });
});

module.exports = players;
