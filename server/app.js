const express = require('express');
const cors = require('cors');

// Index controller
const { home } = require('../game/controller');

// App initialization
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Router
app.use('/chat', require('../chat/router'));
app.use('/game', require('../game/router'));
app.use('/', home);

module.exports = app;
