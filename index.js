const initializeSocket = require('./socket.js');
const express = require('express');
const http = require('http');
const cors = require('cors');

const { getAllPlayers } = require('./players');

const PORT = process.env.PORT || 4000;
const app = express();
const server = http.Server(app);

app.use(cors());

app.get('/players', (req, res) => {
  const players = getAllPlayers();
  res.json({
    players,
  });
});

app.get('/', (req, res) => res.send('Home Page Route'));

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

initializeSocket(server);
