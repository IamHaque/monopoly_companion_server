const fileHelper = require('./file');

const players = fileHelper.read() || [];
const SALARY_AMOUNT = 200;
const STARTING_AMOUNT = 1500;
const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#03a9f4',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#8bc34a',
  '#cddc39',
  '#ffeb3b',
  '#ffc107',
  '#ff9800',
  '#ff5722',
];

const addPlayer = ({ id, name, roomId }) => {
  name = name.trim().toLowerCase();
  roomId = roomId.trim().toLowerCase();

  const existingPlayer = players.find(
    (player) => player.roomId === roomId && player.name === name
  );

  if (existingPlayer) {
    return {
      error: {
        type: 'username',
        message: 'Username is taken',
      },
    };
  }

  const playersInRoom = getPlayersInRoom(roomId);
  const availableColors = [...COLORS];
  playersInRoom.forEach((player) => {
    const colorIndex = availableColors.findIndex((clr) => clr === player.color);
    if (colorIndex < 0) return;
    availableColors.splice(colorIndex, 1);
  });
  const playerColor =
    availableColors[Math.floor(Math.random() * availableColors.length)];

  const player = {
    id,
    name,
    roomId,
    status: 'online',
    color: playerColor,
    balance: STARTING_AMOUNT,
    isBanker: playersInRoom.length <= 0,
  };

  players.push(player);

  return { player };
};

const removePlayer = (playerId, action) => {
  const playerIndex = getPlayerIndex(playerId);
  if (playerIndex < 0) return;

  let removedPlayer;

  if (action === 'exited') {
    players[playerIndex].status = action;
    removedPlayer = players.splice(playerIndex, 1);
  }

  if (action === 'disconnected') {
    players[playerIndex].status = action;
    removedPlayer = players[playerIndex];

    if (removedPlayer?.isBanker === true) {
      players[playerIndex].isBanker = false;

      const otherPlayersInRoom = players.filter(
        (player) =>
          player.roomId === removedPlayer?.roomId &&
          player.status !== 'disconnected' &&
          player.id !== removedPlayer?.id
      );

      if (otherPlayersInRoom.length > 0) {
        const firstPlayerIndex = getPlayerIndex(otherPlayersInRoom[0]?.id);
        players[firstPlayerIndex].isBanker = true;
      }
    }
  }

  if (removedPlayer?.isBanker && players.length > 0) {
    players[0].isBanker = true;
  }

  return removedPlayer;
};

const reAddPlayer = ({ username: name, roomId, playerId, newId }) => {
  if (!isValidRoom(roomId)) {
    return {
      error: {
        type: 'roomId',
        message: 'Invalid room ID',
      },
    };
  }

  const playerIndex = getPlayerIndex(playerId);
  if (playerIndex < 0) {
    return {
      error: {
        type: 'player',
        message: 'Invalid player ID',
      },
    };
  }

  const player = players[playerIndex];
  if (player?.roomId !== roomId || player?.name !== name) {
    return {
      error: {
        type: 'player',
        message: 'Incorrect player details',
      },
    };
  }

  players[playerIndex].isBanker = false;
  players[playerIndex].status = 'online';
  players[playerIndex].id = newId;

  const bankerIndex = getBankerIndexInRoom(player?.roomId);
  if (bankerIndex < 0) players[playerIndex].isBanker = true;

  return { player };
};

const paySalaryToPlayer = (playerId) => {
  const index = getPlayerIndex(playerId);
  if (index === -1) return;

  players[index].balance += SALARY_AMOUNT;
  return players[index];
};

const trade = ({ playerId, fromBank, balance, currentPlayerId }) => {
  const toPlayerIndex = getPlayerIndex(playerId);
  if (toPlayerIndex === -1) return;

  if (!fromBank) {
    const fromPlayerIndex = players.findIndex(
      (player) => player.id === currentPlayerId
    );
    if (fromPlayerIndex === -1) return;

    players[fromPlayerIndex].balance -= balance;
  }

  players[toPlayerIndex].balance += balance;
  return players[toPlayerIndex];
};

const isValidRoom = (roomId) => {
  if (!roomId) return false;
  const playersInRoom = getPlayersInRoom(roomId);
  return playersInRoom.length > 0;
};

const changePlayerStatus = (playerId, status) => {
  const playerIndex = getPlayerIndex(playerId);
  if (playerIndex < 0) return;

  players[playerIndex].status = status;
  return players[playerIndex];
};

const getPlayer = (playerId) =>
  players.find((player) => player.id === playerId);

const getPlayerIndex = (playerId) =>
  players.findIndex((player) => player.id === playerId);

const getAllPlayers = () => [...players];

const getPlayersInRoom = (roomId) =>
  players.filter((player) => player.roomId === roomId);

const getActivePlayersInRoom = (roomId) => {
  fileHelper.write(players);

  return players.filter(
    (player) => player?.roomId === roomId && player?.status !== 'disconnected'
  );
};

const getBankerIndexInRoom = (roomId) =>
  getPlayersInRoom(roomId).findIndex((player) => player?.isBanker === true);

module.exports = {
  trade,
  addPlayer,
  getPlayer,
  isValidRoom,
  reAddPlayer,
  removePlayer,
  getAllPlayers,
  getPlayersInRoom,
  paySalaryToPlayer,
  changePlayerStatus,
  getActivePlayersInRoom,
};
