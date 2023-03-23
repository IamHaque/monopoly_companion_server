const app = require('./app');
const http = require('http');

// Port from process environment
const PORT = process.env.PORT || 4000;

// Server initialization
const server = http.Server(app);

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);

  // Socket initialization
  require('./socket.js')(server);
});
