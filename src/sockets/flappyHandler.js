const {
  joinFlappyLobby,
  leaveFlappyLobby,
  takeFlappyLobbyForStart,
  createFlappyMatch,
  getFlappyMatch,
  removeFlappyMatch,
  flappyLobbyTimers,
  FLAPPY_MIN_PLAYERS,
  FLAPPY_MAX_PLAYERS,
  FLAPPY_LOBBY_WAIT_MS,
} = require('../game/flappyMatchmaking');
const UserModel = require('../models/User');
const { FlappyMatch, FlappyScore } = require('../models/flappy');

function setupFlappyHandlers(io, socket) {
  let currentUserId = null;
  let currentUsername = null;

  socket.on('flappy_queue_join', async ({ userId, username }) => {
    currentUserId = userId;
    currentUsername = username;
    if (!userId || !username) {
      socket.emit('flappy_queue_error', { error: 'Geçersiz kullanıcı bilgisi' });
      return;
    }

    const playerData = { socketId: socket.id, userId, username };
    const result = joinFlappyLobby(playerData);

    if (result.error) {
      socket.emit('flappy_queue_error', { error: result.error });
      return;
    }

    if (result.canStart) {
      const key = result.key;
      const prev = flappyLobbyTimers.get(key);
      if (prev) clearTimeout(prev);
      const t = setTimeout(async () => {
        flappyLobbyTimers.delete(key);
        const players = takeFlappyLobbyForStart(key);
        if (!players || players.length === 0) return;
        const match = createFlappyMatch(players);
        for (const p of players) {
          if (p.socketId) {
            const s = io.sockets.sockets.get(p.socketId);
            if (s) s.join(match.id);
          }
        }
        let playersPayload = players.map((p) => ({ userId: p.userId, username: p.username, avatar: null }));
        try {
          const realIds = players.filter((p) => !p.userId?.startsWith('bot_')).map((p) => p.userId);
          if (realIds.length > 0 && UserModel) {
            const avatarResults = await Promise.all(
              realIds.map((uid) => UserModel.findOne({ where: { oduserId: uid }, attributes: ['avatar'] }).catch(() => null))
            );
            const avatarMap = {};
            realIds.forEach((uid, i) => { avatarMap[uid] = avatarResults[i]?.avatar || null; });
            playersPayload = players.map((p) => ({
              userId: p.userId,
              username: p.username,
              avatar: p.userId?.startsWith('bot_') ? null : (avatarMap[p.userId] || null),
            }));
          }
        } catch (e) {
          console.error('[Flappy] Avatar fetch error:', e?.message);
        }
        console.log('[Flappy] Match started:', match.id, 'players:', players.length);
        const startAt = Date.now() + 3000;
        io.to(match.id).emit('flappy_match_found', {
          matchId: match.id,
          seed: match.seed,
          players: playersPayload,
          startAt,
        });
        setTimeout(() => {
          io.to(match.id).emit('flappy_game_start', { matchId: match.id });
        }, 3000);
      }, FLAPPY_LOBBY_WAIT_MS);
      flappyLobbyTimers.set(key, t);
    }

    socket.emit('flappy_queue_waiting', {
      message: result.count >= FLAPPY_MIN_PLAYERS
        ? `Başlamak için ${FLAPPY_LOBBY_WAIT_MS / 1000} saniye bekleniyor (${result.count} oyuncu)...`
        : `Oyuncu bekleniyor (${result.count}/${FLAPPY_MAX_PLAYERS})...`,
      count: result.count,
    });
  });

  socket.on('flappy_queue_leave', () => {
    const r = leaveFlappyLobby(socket.id);
    if (r && r.remainingCount !== undefined && r.remainingCount < FLAPPY_MIN_PLAYERS) {
      const prev = flappyLobbyTimers.get(r.key);
      if (prev) { clearTimeout(prev); flappyLobbyTimers.delete(r.key); }
    }
    socket.emit('flappy_queue_left');
  });

  socket.on('flappy_score', ({ matchId, score }) => {
    const match = getFlappyMatch(matchId);
    if (!match || match.status !== 'playing') return;
    if (!match.players[currentUserId] || !match.alive[currentUserId]) return;
    const prev = match.scores[currentUserId] || 0;
    if (typeof score !== 'number' || score < prev) return;
    match.scores[currentUserId] = score;
    socket.to(matchId).emit('flappy_score_update', { userId: currentUserId, username: currentUsername, score });
  });

  socket.on('flappy_died', ({ matchId }) => {
    const match = getFlappyMatch(matchId);
    if (!match || match.status !== 'playing') return;
    if (!match.players[currentUserId]) return;
    match.alive[currentUserId] = false;
    const aliveCount = Object.values(match.alive).filter(Boolean).length;
    io.to(matchId).emit('flappy_player_died', {
      userId: currentUserId,
      username: currentUsername,
      score: match.scores[currentUserId] || 0,
      aliveCount,
    });
    if (aliveCount <= 1) {
      match.status = 'finished';
      const winnerId = Object.keys(match.alive).find((id) => match.alive[id]);
      const leaderboard = Object.entries(match.scores)
        .map(([uid, s]) => ({ userId: uid, username: match.players[uid]?.username || '?', score: s }))
        .sort((a, b) => b.score - a.score);
      io.to(matchId).emit('flappy_game_finished', {
        matchId: match.id,
        winnerId,
        scores: match.scores,
        leaderboard,
      });
      saveFlappyMatchToDb(match.id, match.seed, match.players, match.scores, winnerId).catch((e) =>
        console.error('[Flappy] DB save error:', e?.message)
      );
      setTimeout(() => removeFlappyMatch(matchId), 15000);
    }
  });

  socket.on('flappy_leave_match', ({ matchId }) => {
    const match = getFlappyMatch(matchId);
    if (!match) return;
    socket.leave(matchId);
    if (match.players[currentUserId]) {
      match.alive[currentUserId] = false;
      const aliveCount = Object.values(match.alive).filter(Boolean).length;
      io.to(matchId).emit('flappy_player_died', {
        userId: currentUserId,
        username: currentUsername,
        score: match.scores[currentUserId] || 0,
        aliveCount,
      });
      if (aliveCount <= 1) {
        match.status = 'finished';
        const winnerId = Object.keys(match.alive).find((id) => match.alive[id]);
        const leaderboard = Object.entries(match.scores)
          .map(([uid, s]) => ({ userId: uid, username: match.players[uid]?.username || '?', score: s }))
          .sort((a, b) => b.score - a.score);
        io.to(matchId).emit('flappy_game_finished', {
          matchId: match.id,
          winnerId,
          scores: match.scores,
          leaderboard,
        });
        saveFlappyMatchToDb(match.id, match.seed, match.players, match.scores, winnerId).catch((e) =>
          console.error('[Flappy] DB save error:', e?.message)
        );
        setTimeout(() => removeFlappyMatch(matchId), 15000);
      }
    }
  });
}

async function saveFlappyMatchToDb(matchId, seed, players, scores, winnerId) {
  const playerCount = Object.keys(players).length;
  await FlappyMatch.create({
    id: matchId,
    seed,
    playerCount,
    winnerId,
    scores,
    finishedAt: new Date(),
  });
  const leaderboard = Object.entries(scores)
    .map(([uid, s]) => ({ userId: uid, username: players[uid]?.username || '?', score: s }))
    .sort((a, b) => b.score - a.score);
  for (let i = 0; i < leaderboard.length; i++) {
    const p = leaderboard[i];
    await FlappyScore.create({
      matchId,
      userId: p.userId,
      username: p.username,
      score: p.score,
      rank: i + 1,
    });
  }
}

module.exports = { setupFlappyHandlers };
