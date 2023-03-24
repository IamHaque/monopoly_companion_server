// IO provider to read/write game data into file
const IO = require('../utils/io');
// Helper functions
const { COLORS, capitalize, generateId } = require('../utils/helper');

// Salary to give on passing GO
const SALARY_AMOUNT = 200;
// Initial salary given to each player
const INITIAL_AMOUNT = 1500;
// Initial status for added player
const INITIAL_STATUS = 'online';

// Initial game data
let GAME_DATA = IO.read() || {};
// Flag denoting if a trade can be made
let CAN_TRADE = true;

// Custom error class
class GameError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
    this.name = 'GameError';
  }
}

/* ======================================== */
/* ============ Getter Methods ============ */
/* ======================================== */

// Returns all game data from file
const getGameData = () => GAME_DATA;

// Returns all players in room
const getAllPlayersInRoom = (roomId) => {
  return GAME_DATA[roomId];
};

// Returns all active players in room
const getActivePlayersInRoom = (roomId) => {
  return GAME_DATA[roomId]?.filter(
    (player) => player.status !== 'disconnected'
  );
};

// Returns player in room
const getPlayerInRoom = (playerId, roomId) => {
  return GAME_DATA[roomId]?.find((player) => player.id === playerId);
};

// Returns player index in room
const getPlayerIndexInRoom = (playerId, roomId) => {
  return GAME_DATA[roomId]?.findIndex((player) => player.id === playerId);
};

// Returns player by player id
const getPlayerByPlayerId = (playerId) => {
  // get room id player is part of
  const roomId = getRoomFromPlayerId(playerId);

  // return if no room id
  if (!roomId) return;

  // return the player in room
  return getPlayerInRoom(playerId, roomId);
};

// Returns the banker in room
const getBankerInRoom = (roomId) => {
  return GAME_DATA[roomId]?.find((player) => player.isBanker === true);
};

// Returns the room id of player
const getRoomFromPlayerId = (playerId) => {
  const allRoomIds = Object.keys(GAME_DATA);
  return allRoomIds.find((roomId) => {
    const player = getPlayerInRoom(playerId, roomId);
    return !!player;
  });
};

/* ======================================== */
/* ============ Checker Methods =========== */
/* ======================================== */

// Checks if room exists
const isValidRoom = (roomId) => {
  return Object.keys(GAME_DATA).includes(roomId);
};

// Checks if player is in room
const isPlayerInRoom = (playerId, roomId) => {
  const player = getPlayerInRoom(playerId, roomId);
  return !!player;
};

/* ======================================== */
/* ============ Handler Methods =========== */
/* ======================================== */

// Creates a new room
const createNewRoom = () => {
  // generate random room id
  const roomId = generateId(6).trim().toLowerCase();

  // insert room into game data
  GAME_DATA[roomId] = [];

  // return created roomId
  return roomId;
};

// Adds player to specified room
const addPlayerToRoom = (name, roomId, playerId) => {
  name = capitalize(name);
  roomId = roomId.trim().toLowerCase();

  try {
    // throw error if roomId is invalid
    if (!isValidRoom(roomId))
      throw new GameError('roomId', 'Room ID is invalid');

    // throw error if player is already in room
    if (isPlayerInRoom(playerId, roomId))
      throw new GameError('username', 'Username already in room');

    // get all players part of this room
    const playersInRoom = getAllPlayersInRoom(roomId);
    // get banker of this room
    const banker = getBankerInRoom(roomId);
    // make this player banker if there are no other players or there is no other banker in room
    const shouldBeBanker = playersInRoom.length <= 0 || !banker;

    // generate a random color for the player
    const color = generateColor(roomId);

    // create player data
    const player = {
      name,
      color,
      roomId,
      id: playerId,
      status: INITIAL_STATUS,
      balance: INITIAL_AMOUNT,
      isBanker: shouldBeBanker,
    };

    // insert player into room
    GAME_DATA[roomId].push(player);

    // save game data into file
    saveGameData();

    // return player data
    return { player };
  } catch (error) {
    // save game data into file
    saveGameData();

    // return error message
    return {
      error: {
        type: error.type,
        message: error.message,
      },
    };
  }
};

// Removes given player from first room
const removePlayerFromRoom = (playerId, action) => {
  // get room id player is part of
  const roomId = getRoomFromPlayerId(playerId);

  // return if no room id
  if (!roomId) return;

  // list of all players in room
  const playersInRoom = getAllPlayersInRoom(roomId);

  // player index in the list of all players
  const playerIndex = getPlayerIndexInRoom(playerId, roomId);

  // stores removed player data
  let removedPlayer;

  // player has left the game
  if (action === 'exited') {
    playersInRoom[playerIndex].status = action;

    // remove player from list
    removedPlayer = playersInRoom.splice(playerIndex, 1)[0];
  }

  // player has been disconnected from the game
  if (action === 'disconnected') {
    playersInRoom[playerIndex].status = action;

    // save removed player
    removedPlayer = playersInRoom[playerIndex];
  }

  // make the first active player the banker if removed player was the banker
  if (removedPlayer && removedPlayer.isBanker) {
    // remove the banker role from disconnected player
    if (action === 'disconnected') {
      playersInRoom[playerIndex].isBanker = false;
    }

    // list of active players
    const activePlayersInRoom = playersInRoom.filter(
      (player) => player.status !== 'disconnected'
    );

    // make the first active player the banker
    if (activePlayersInRoom.length > 0) {
      const firstActivePlayerIndex = playersInRoom.findIndex(
        (player) => player.id === activePlayersInRoom[0].id
      );
      playersInRoom[firstActivePlayerIndex].isBanker = true;
    }
  }

  // update room data
  GAME_DATA[roomId] = playersInRoom;

  // save game data into file
  saveGameData();

  // return the removed player data
  return removedPlayer;
};

// Adds player again to the last room
const reAddPlayer = (name, roomId, playerId, newPlayerId) => {
  try {
    // throw error if roomId is invalid
    if (!isValidRoom(roomId))
      throw new GameError('roomId', 'Room ID is invalid');

    // throw error if playerId is invalid
    if (!isPlayerInRoom(playerId, roomId))
      throw new GameError('player', 'Player ID is invalid');

    // list of all players in room
    const playersInRoom = getAllPlayersInRoom(roomId);

    // player index in the list of all players
    const playerIndex = getPlayerIndexInRoom(playerId, roomId);

    // throw error if player data is invalid
    if (playersInRoom[playerIndex].name !== name)
      throw new GameError('player', 'Player details are incorrect');

    // reset player details
    playersInRoom[playerIndex].status = INITIAL_STATUS;
    playersInRoom[playerIndex].id = newPlayerId;

    // make player the banker if there is no other banker
    const banker = getBankerInRoom(roomId);
    playersInRoom[playerIndex].isBanker = !banker;

    // update room data
    GAME_DATA[roomId] = playersInRoom;

    // save game data into file
    saveGameData();

    // return player data
    return { player: playersInRoom[playerIndex] };
  } catch (error) {
    // save game data into file
    saveGameData();

    // return error message
    return {
      error: {
        type: error.type,
        message: error.message,
      },
    };
  }
};

// Change player status
const changePlayerStatus = (playerId, status) => {
  // get room id player is part of
  const roomId = getRoomFromPlayerId(playerId);

  // return if no room id
  if (!roomId) return;

  // list of all players in room
  const playersInRoom = getAllPlayersInRoom(roomId);

  // player index in the list of all players
  const playerIndex = getPlayerIndexInRoom(playerId, roomId);

  // change the player status
  playersInRoom[playerIndex].status = status;

  // update room data
  GAME_DATA[roomId] = playersInRoom;

  // save game data into file
  saveGameData();

  // return the removed player data
  return playersInRoom[playerIndex];
};

// Adds salary amount to the player
const paySalaryToPlayer = (playerId) => {
  // get room id player is part of
  const roomId = getRoomFromPlayerId(playerId);

  // return if no room id
  if (!roomId) return;

  // list of all players in room
  const playersInRoom = getAllPlayersInRoom(roomId);

  // player index in the list of all players
  const playerIndex = getPlayerIndexInRoom(playerId, roomId);

  // add salary to player balance
  playersInRoom[playerIndex].balance += SALARY_AMOUNT;

  // update room data
  GAME_DATA[roomId] = playersInRoom;

  // save game data into file
  saveGameData();

  // return the removed player data
  return playersInRoom[playerIndex];
};

// Makes trade amount transfer
const handleTrade = (
  toPlayerId,
  fromPlayerId,
  tradeAmount,
  initiatedByBank
) => {
  // get room id player (receiving trade) is part of
  const toRoomId = getRoomFromPlayerId(toPlayerId);

  // return if no room id
  if (!toRoomId) return;

  // list of all players in room
  const playersInRoom = getAllPlayersInRoom(toRoomId);

  // player (receiving trade) index  in the list of all players
  const toPlayerIndex = getPlayerIndexInRoom(toPlayerId, toRoomId);

  // logic for when the trade is not initiated by the bank
  if (!initiatedByBank) {
    // get room id player (initiating trade) is part of
    const fromRoomId = getRoomFromPlayerId(toPlayerId);

    // return if no room id
    if (!fromRoomId) return;

    // player (initiating trade) index  in the list of all players
    const fromPlayerIndex = getPlayerIndexInRoom(fromPlayerId, fromRoomId);

    // debit amount from trade initiator's balance
    playersInRoom[fromPlayerIndex].balance -= tradeAmount;
  }

  // credit amount to trade receiver's balance
  playersInRoom[toPlayerIndex].balance += tradeAmount;

  // update room data
  GAME_DATA[toRoomId] = playersInRoom;

  // save game data into file
  saveGameData();

  // return the player (receiving trade) data
  return playersInRoom[toPlayerIndex];
};

// Stores game data into file
const saveGameData = () => IO.write(GAME_DATA);

// Generates unique color
const generateColor = (roomId) => {
  let availableColors = [...COLORS];

  // get list of colors not assigned to any other player in room
  const playersInRoom = getAllPlayersInRoom(roomId);
  playersInRoom.forEach((player) => {
    const colorIndex = availableColors.findIndex((clr) => clr === player.color);
    if (colorIndex < 0) return;
    availableColors.splice(colorIndex, 1);
  });

  // return random color
  if (availableColors.length <= 0) availableColors = [...COLORS];
  return availableColors[Math.floor(Math.random() * availableColors.length)];
};

module.exports = {
  CAN_TRADE,
  getGameData,
  reAddPlayer,
  handleTrade,
  createNewRoom,
  addPlayerToRoom,
  paySalaryToPlayer,
  changePlayerStatus,
  getPlayerByPlayerId,
  removePlayerFromRoom,
  getActivePlayersInRoom,
};
