const express = require('express');

// Express router
const router = express.Router();

// Controller for game routes
const GameController = require('./controller');

router.get('/', GameController.gameData);

module.exports = router;
