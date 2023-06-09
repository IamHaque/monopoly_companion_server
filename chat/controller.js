const ChatService = require('./service');
const { getAllUsers, saveAllUsers } = require('./io');

// Fetch all chats
module.exports.getAllMessages = (req, res) => {
  const messages = ChatService.getAll();
  res.json({ messages });
};

// Register/Login the user
module.exports.login = (req, res) => {
  const USERS = getAllUsers() || {};
  const username = req.body?.username?.trim();
  const password = req.body?.password?.trim();

  if (!username && !password) {
    return res.status(400).json({
      username: 'Username is required',
      password: 'Password is required',
    });
  }

  if (!username) {
    return res.status(400).json({
      username: 'Username is required',
    });
  }

  if (!password) {
    return res.status(400).json({
      password: 'Password is required',
    });
  }

  if (!USERS[username]) {
    USERS[username] = password;
    saveAllUsers(USERS);
    return res.json({ username, message: 'User registered' });
  }

  if (USERS[username] !== password) {
    return res.status(400).json({
      password: 'Incorrect password',
    });
  }

  return res.json({ username, message: 'User logged in' });
};
