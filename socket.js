const { Server } = require('socket.io');
const { instrument } = require('@socket.io/admin-ui');

const { generateId } = require('./utils');
const {
  trade,
  getPlayer,
  addPlayer,
  reAddPlayer,
  isValidRoom,
  removePlayer,
  getPlayersInRoom,
  paySalaryToPlayer,
  changePlayerStatus,
  getActivePlayersInRoom,
} = require('./players');

module.exports = (server) => {
  const socketIO = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://admin.socket.io',
        'https://monopoly-companion.vercel.app',
      ],
      credentials: true,
    },
  });

  instrument(socketIO, {
    auth: false,
    mode: 'development',
  });

  socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} connected`);

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
      console.log(`🔃: ${player.name} rejoined ${player.roomId}`);

      broadcastUpdatedPlayerData(player?.roomId);
      callback();
    });

    socket.on('pay_salary', (playerId) => {
      const player = paySalaryToPlayer(playerId);
      if (!player) return;

      console.log(`💰: Paid salary to ${player?.name}`);
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

        console.log(`🫱🏽‍🫲🏽: ${player?.name} traded ${balance} with Bank`);
        broadcastUpdatedPlayerData(player?.roomId);
        return;
      }

      const toPlayer = getPlayer(playerId);
      const fromPlayer = getPlayer(currentPlayerId);
      if (!toPlayer || !fromPlayer) return;

      console.log(
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
        console.log(`✔️: Traded ${action}ed `);
        if (action !== 'accept') return;

        const player = trade({
          balance,
          playerId,
          fromBank: false,
          currentPlayerId,
        });
        if (!player) return;

        broadcastUpdatedPlayerData(player?.roomId);
      }
    );

    socket.on('player_status_changed', ({ playerId, status }) => {
      const player = changePlayerStatus(playerId, status);
      if (!player) return;

      console.log(
        `${status === 'online' ? '🟢' : '🟠'}: ${player?.name} went ${status}`
      );
      broadcastUpdatedPlayerData(player?.roomId);
    });

    socket.on('exit_room', (playerId) => {
      exitRoom(playerId, 'exited');
    });

    socket.on('disconnect', () => {
      console.log(`🔥: ${socket.id} disconnected`);
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
      console.log(`➕: ${player.name} joined ${player.roomId}`);

      // socket.broadcast.to(player.roomId).emit('notify_players', {
      //   ...player,
      // });

      broadcastUpdatedPlayerData(player?.roomId);
      callback();
    }

    function exitRoom(playerId, action) {
      const player = removePlayer(playerId, action);
      if (!player) return;

      socket.leave(player?.roomId);

      console.log(`➖: ${player?.name} left ${player?.roomId}`);
      broadcastUpdatedPlayerData(player?.roomId);
    }

    function broadcastUpdatedPlayerData(roomId) {
      socketIO.to(roomId).emit('update_player_data', {
        roomId,
        players: getActivePlayersInRoom(roomId),
      });
    }
  });
};
