const express = require('express');

// Express router
const router = express.Router();

// Controller for game routes
const ChatController = require('./controller');

router.post('/login', ChatController.login);
router.get('/', ChatController.getAllMessages);

module.exports = router;
