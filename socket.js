const { Server } = require('socket.io');

const { generateId } = require('./utils');
const {
  trade,
  getPlayer,
  addPlayer,
  reAddPlayer,
  isValidRoom,
  removePlayer,
  paySalaryToPlayer,
  changePlayerStatus,
  getActivePlayersInRoom,
} = require('./players');

const file = require('./file');

module.exports = (server) => {
  const socketIO = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'https://iris-marred-church.glitch.me'],
      credentials: true,
    },
  });

  socketIO.on('connection', (socket) => {
    file.log(`⚡: ${socket.id} connected`);

    socket.on('create_room', ({ username }, callback) => {
      const roomId = generateId();
      joinRoom(roomId, username, callback);
    });

    socket.on('join_room', ({ roomId, username }, callback) => {
      const validRoom = isValidRoom(roomId);

      if (!validRoom) {
        return callback({
          type: 'roomId',
          message: 'Invalid room ID',
        });
      }

      joinRoom(roomId, username, callback);
    });

    socket.on('rejoin_room', (playerData, callback) => {
      const { error, player } = reAddPlayer({
        ...playerData,
        newId: socket.id,
      });
      if (error) return callback(error);

      socket.emit('joined_room', {
        ...player,
      });

      socket.join(player.roomId);
      file.log(`🔃: ${player?.name} rejoined ${player.roomId}`);

      broadcastAction(
        player?.roomId,
        `${player?.name} re-joined the game`,
        'success'
      );
      broadcastUpdatedPlayerData(player?.roomId);
      callback();
    });

    socket.on('pay_salary', (playerId) => {
      const player = paySalaryToPlayer(playerId);
      if (!player) return;

      file.log(`💰: Paid salary to ${player?.name}`);
      broadcastAction(player?.roomId, `${player?.name} received salary`);
      broadcastUpdatedPlayerData(player?.roomId);
    });

    socket.on('trade', ({ playerId, fromBank, balance, currentPlayerId }) => {
      if (playerId === currentPlayerId) return;

      if (fromBank) {
        const player = trade({
          playerId,
          fromBank,
          balance,
          currentPlayerId,
        });
        if (!player) return;

        let broadcastMessage =
          balance < 0
            ? `${player?.name} paid ₹${Math.abs(balance)} to the Bank`
            : `${player?.name} received ₹${Math.abs(balance)} from the Bank`;
        broadcastAction(player?.roomId, broadcastMessage);

        file.log(`🫱🏽‍🫲🏽: ${broadcastMessage}`);
        broadcastUpdatedPlayerData(player?.roomId);
        return;
      }

      const toPlayer = getPlayer(playerId);
      const fromPlayer = getPlayer(currentPlayerId);
      if (!toPlayer || !fromPlayer) return;

      file.log(
        `🔔: ${fromPlayer?.name} sent trade request to  ${toPlayer?.name}`
      );
      socketIO.to(toPlayer?.id).emit('trade_request', {
        balance,
        playerId,
        currentPlayerId,
        requestedBy: fromPlayer.name,
      });
    });

    socket.on(
      'trade_response',
      ({ action, playerId, balance, currentPlayerId }) => {
        file.log(`✔️: Traded ${action}ed `);
        if (action !== 'accept') return;

        const player = trade({
          balance,
          playerId,
          fromBank: false,
          currentPlayerId,
        });
        if (!player) return;

        const currentPlayer = getPlayer(currentPlayerId)?.name;
        let broadcastMessage =
          balance < 0
            ? `${player?.name} paid ₹${Math.abs(balance)} to ${currentPlayer}`
            : `${player?.name} received ₹${Math.abs(
                balance
              )} from ${currentPlayer}`;
        broadcastAction(player?.roomId, broadcastMessage);

        file.log(`✔️:${broadcastMessage}`);
        broadcastUpdatedPlayerData(player?.roomId);
      }
    );

    socket.on('player_status_changed', ({ playerId, status }) => {
      const player = changePlayerStatus(playerId, status);
      if (!player) return;

      file.log(
        `${status === 'online' ? '🟢' : '🟠'}: ${player?.name} went ${status}`
      );
      broadcastUpdatedPlayerData(player?.roomId);
    });

    socket.on('exit_room', (playerId) => {
      exitRoom(playerId, 'exited');
    });

    socket.on('disconnect', () => {
      file.log(`🔥: ${socket.id} disconnected`);
      exitRoom(socket.id, 'disconnected');
    });

    function joinRoom(roomId, name, callback) {
      const { error, player } = addPlayer({
        name,
        roomId,
        id: socket.id,
      });

      if (error) return callback(error);

      socket.emit('joined_room', {
        ...player,
      });

      socket.join(player.roomId);
      file.log(`➕: ${player.name} joined ${player.roomId}`);
      broadcastAction(
        player?.roomId,
        `${player?.name} joined the game`,
        'success'
      );

      broadcastUpdatedPlayerData(player?.roomId);
      callback();
    }

    function exitRoom(playerId, action) {
      const player = removePlayer(playerId, action);
      if (!player) return;
      file.log(`➖: ${player?.name} left ${player?.roomId}`);

      socket.leave(player?.roomId);

      broadcastAction(player?.roomId, `${player?.name} left the game`, 'error');
      broadcastUpdatedPlayerData(player?.roomId);
    }

    function broadcastAction(roomId, message, type = 'info') {
      socketIO.to(roomId).emit('log_action', { message, type });
    }

    function broadcastUpdatedPlayerData(roomId) {
      socketIO.to(roomId).emit('update_player_data', {
        roomId,
        players: getActivePlayersInRoom(roomId),
      });
    }
  });
};
