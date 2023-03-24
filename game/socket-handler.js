// Helper functions
const { log } = require('../utils/io');
const { addTimeout, clearTimeouts } = require('../utils/timeout-manager');

// Service for game logic
const GameService = require('./service');
// Service for history logic
const HistoryService = require('./history-service');

module.exports.gameHandler = (socketIO, socket) => {
  log(`${socket.id} connected`);

  /* ======================================== */
  /* ============   Listeners    ============ */
  /* ======================================== */

  // create_room
  socket.on('create_room', ({ username }, callback) => {
    const roomId = GameService.createNewRoom(username);
    joinRoom(roomId, username, callback);
  });

  // join_room
  socket.on('join_room', ({ roomId, username }, callback) => {
    joinRoom(roomId, username, callback);
  });

  // rejoin_room
  socket.on('rejoin_room', ({ username, roomId, playerId }, callback) => {
    rejoinRoom(username, roomId, playerId, callback);
  });

  // exit_room
  socket.on('exit_room', (playerId) => {
    exitRoom(playerId, 'exited');
  });

  // disconnect
  socket.on('disconnect', () => {
    log(`${socket.id} disconnected`);
    exitRoom(socket.id, 'disconnected');
  });

  // pay_salary
  socket.on('pay_salary', (playerId) => {
    // pay salary to player
    const player = GameService.paySalaryToPlayer(playerId);

    // return if no player
    if (!player) return;

    // notify everyone that a player has received salary
    broadcastAction(player.roomId, `${player.name} received salary`);

    // broadcast updated player data
    broadcastUpdatedPlayerData(player.roomId);
  });

  // trade
  socket.on('trade', ({ playerId, fromBank, balance, currentPlayerId }) => {
    // return if player trading with himself
    if (playerId === currentPlayerId) {
      sendAlert('Cannot trade with yourself', 'warning');
      return;
    }

    // return if another trade is ongoing
    if (!GameService.CAN_TRADE) {
      sendAlert('Another trade is in progress', 'warning');
      return;
    }

    // start trade process
    GameService.CAN_TRADE = false;

    if (fromBank) {
      // handle bank trade
      tradeWithBank(playerId, currentPlayerId, balance);
      // stop execution
      return;
    }

    // request trade with player
    requestTradeWithPlayer(playerId, currentPlayerId, balance);
  });

  // trade_response
  socket.on(
    'trade_response',
    ({ action, playerId, balance, requestedBy, currentPlayerId }) => {
      // clear all ongoing trade timeouts
      clearTimeouts();

      // end trade process
      GameService.CAN_TRADE = true;

      // enable trade option for all players
      const player = GameService.getPlayerByPlayerId(playerId);
      socketIO.to(player.roomId).emit('enable_trade');

      // trade request accepted
      if (action === 'accept') {
        tradeWithPlayer(playerId, currentPlayerId, balance);
        return;
      }

      // notify everyone that a trade has been rejected
      broadcastAction(
        player.roomId,
        `${player.name} rejected ${requestedBy}'s trade request`
      );

      // broadcast updated player data
      broadcastUpdatedPlayerData(player.roomId);
    }
  );

  // player_status_changed
  socket.on('player_status_changed', ({ playerId, status }) => {
    // change player status
    const player = GameService.changePlayerStatus(playerId, status);

    // return if no player
    if (!player) return;

    log(`${player?.name} went ${status}`);

    // broadcast updated player data
    broadcastUpdatedPlayerData(player?.roomId);
  });

  /* ======================================== */
  /* ============ Helper Methods ============ */
  /* ======================================== */

  function joinRoom(roomId, name, callback) {
    // add player to the room with socket id as playerId
    const { error, player } = GameService.addPlayerToRoom(
      name,
      roomId,
      socket.id
    );

    // return callback with error
    if (error) return callback(error);

    // add socket to the room
    socket.join(player.roomId);

    // notify host that the player has joined the room
    socket.emit('joined_room', {
      ...player,
    });

    // notify everyone that a player has joined the room
    broadcastAction(
      player.roomId,
      `${player?.name} joined the game`,
      'success'
    );

    // broadcast updated player data
    broadcastUpdatedPlayerData(player.roomId);
  }

  function rejoinRoom(name, roomId, playerId, callback) {
    // re add player to the room with socket id as new playerId
    const { error, player } = GameService.reAddPlayer(
      name,
      roomId,
      playerId,
      socket.id
    );

    // return callback with error
    if (error) return callback(error);

    // notify host that the player has joined the room
    socket.emit('joined_room', {
      ...player,
    });

    // add socket to the room
    socket.join(player.roomId);

    // notify everyone that a player has joined the room
    broadcastAction(player.roomId, `${player.name} joined the game`, 'success');

    // broadcast updated player data
    broadcastUpdatedPlayerData(player.roomId);
  }

  function exitRoom(playerId, action) {
    // remove player from the room
    const removedPlayer = GameService.removePlayerFromRoom(playerId, action);

    // return if no player is removed
    if (!removedPlayer) return;

    // remove socket from the room
    socket.leave(removedPlayer.roomId);

    // notify everyone that a player has left the room
    broadcastAction(
      removedPlayer.roomId,
      `${removedPlayer.name} left the game`,
      'error'
    );

    // broadcast updated player data
    broadcastUpdatedPlayerData(removedPlayer.roomId);
  }

  function tradeWithBank(toPlayerId, fromPlayerId, tradeAmount) {
    // initiate trade with bank
    const player = GameService.handleTrade(
      toPlayerId,
      fromPlayerId,
      tradeAmount,
      true
    );

    // end trade process
    GameService.CAN_TRADE = true;

    // return if no player
    if (!player) return;

    // notify everyone that a player has traded with bank
    let broadcastMessage =
      tradeAmount < 0
        ? `${player?.name} paid ₹${Math.abs(tradeAmount)} to the Bank`
        : `${player?.name} received ₹${Math.abs(tradeAmount)} from the Bank`;
    broadcastAction(player?.roomId, broadcastMessage);

    // broadcast updated player data
    broadcastUpdatedPlayerData(player?.roomId);
  }

  function tradeWithPlayer(toPlayerId, fromPlayerId, tradeAmount) {
    // initiate trade with player
    const player = GameService.handleTrade(
      toPlayerId,
      fromPlayerId,
      tradeAmount,
      false
    );

    // return if no player
    if (!player) return;

    // notify everyone that a trade has been made
    const currentPlayer = GameService.getPlayerByPlayerId(fromPlayerId);
    const amount = Math.abs(tradeAmount);
    let broadcastMessage =
      tradeAmount < 0
        ? `${player.name} paid ₹${amount} to ${currentPlayer.name}`
        : `${player.name} received ₹${amount} from ${currentPlayer.name}`;
    broadcastAction(player?.roomId, broadcastMessage);

    // broadcast updated player data
    broadcastUpdatedPlayerData(player?.roomId);
  }

  function requestTradeWithPlayer(playerId, currentPlayerId, balance) {
    // to player data
    const toPlayer = GameService.getPlayerByPlayerId(playerId);
    // from player data
    const fromPlayer = GameService.getPlayerByPlayerId(currentPlayerId);

    // return if no player data
    if (!toPlayer || !fromPlayer) {
      // end trade process
      GameService.CAN_TRADE = true;
      return;
    }

    // notify everyone that a trade request has been made
    const broadcastMessage = `${fromPlayer.name} sent trade request to  ${toPlayer.name}`;
    broadcastAction(toPlayer.roomId, broadcastMessage);

    // notify the player trade request has been made
    socketIO.to(toPlayer.id).emit('trade_request', {
      balance,
      playerId,
      currentPlayerId,
      requestedBy: fromPlayer.name,
    });

    // disable trade option for all players
    socketIO.to(toPlayer.roomId).emit('disable_trade');

    // reset trade option and reject trade request after a timeout
    // to handle no response from recipient
    const tradeTimeout = setTimeout(() => {
      // end trade process
      GameService.CAN_TRADE = true;

      // enable trade option for all players
      socketIO.to(toPlayer.roomId).emit('enable_trade');

      // notify everyone that a trade has been rejected
      broadcastAction(
        toPlayer.roomId,
        `${toPlayer.name} rejected ${fromPlayer.name}'s trade request`
      );
    }, 10 * 1000);

    // add the current trade timeout to the list
    addTimeout(tradeTimeout);
  }

  function sendAlert(message, type = 'info') {
    // log the message to file/console
    log(message);

    // broadcast action to room
    socket.emit('alert', { message, type });
  }

  function broadcastAction(roomId, message, type = 'info') {
    // log the message to file/console
    log(message);

    // save action to room history
    HistoryService.addToRoomHistory(roomId, message, type);

    // broadcast action to room
    socketIO.to(roomId).emit('log_action', { message, type });
  }

  function broadcastUpdatedPlayerData(roomId) {
    // broadcast updated player data to room
    socketIO.to(roomId).emit('update_player_data', {
      history: HistoryService.getRoomHistory(roomId),
      players: GameService.getActivePlayersInRoom(roomId),
    });
  }
};
