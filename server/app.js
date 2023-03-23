const express = require('express');
const cors = require('cors');

// Index controller
const { home } = require('../game/controller');

// App initialization
const app = express();

// Middleware
app.use(cors());

// Router
app.use('/game', require('../game/router'));
app.use('/', home);

module.exports = app;
