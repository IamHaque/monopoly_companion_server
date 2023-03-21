const app = require('./app');
const routes = require('./routes/router');
const initializeSocket = require('./socket.js');

const PORT = process.env.PORT || 4000;

app.use('/', routes);

const server = http.Server(app);

server.listen(PORT, function () {
  console.log(`Server listening on http://localhost:${PORT}`);
});

initializeSocket(server);
