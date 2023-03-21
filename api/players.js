const app = require('../app');
const route = require('../routes/router');

app.use('/api', route);

module.exports = app;
