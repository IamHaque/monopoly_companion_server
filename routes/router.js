const routes = require('express').Router();

const players = require('./players');

routes.get('/', async function (req, res) {
  res.send(`<h1>Monopoly Server</h1>`);
});

routes.use('/', players);

module.exports = routes;
