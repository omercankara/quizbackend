// Flappy Bird - min 1, max 10 oyuncu
const FLAPPY_LOBBY_KEY = 'flappy_lobby';
const FLAPPY_MIN_PLAYERS = 1;
const FLAPPY_MAX_PLAYERS = 10;
const FLAPPY_LOBBY_WAIT_MS = 8000;

const flappyLobbies = new Map();
const flappyMatches = new Map();
const flappyLobbyTimers = new Map();

function getFlappyLobbyKey() {
  return FLAPPY_LOBBY_KEY;
}

function joinFlappyLobby(playerData) {
  const key = getFlappyLobbyKey();
  let lobby = flappyLobbies.get(key);
  if (!lobby) lobby = { players: [] };

  if (lobby.players.some((p) => p.userId === playerData.userId)) {
    return { error: 'Zaten lobidesin' };
  }
  if (lobby.players.length >= FLAPPY_MAX_PLAYERS) {
    return { error: 'Lobi dolu (max 10 oyuncu)' };
  }

  lobby.players.push(playerData);
  flappyLobbies.set(key, lobby);
  const count = lobby.players.length;

  return { joined: true, count, key, canStart: count >= FLAPPY_MIN_PLAYERS };
}

function takeFlappyLobbyForStart(key) {
  const lobby = flappyLobbies.get(key);
  if (!lobby || lobby.players.length < FLAPPY_MIN_PLAYERS) return null;
  const toStart = [...lobby.players];
  flappyLobbies.delete(key);
  return toStart;
}

function leaveFlappyLobby(socketId) {
  const key = getFlappyLobbyKey();
  const lobby = flappyLobbies.get(key);
  if (!lobby) return false;
  const idx = lobby.players.findIndex((p) => p.socketId === socketId);
  if (idx >= 0) {
    lobby.players.splice(idx, 1);
    const remaining = lobby.players.length;
    if (remaining === 0) flappyLobbies.delete(key);
    return { left: true, key, remainingCount: remaining };
  }
  return false;
}

function createFlappyMatch(players) {
  const matchId = `flappy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const seed = Date.now() + Math.floor(Math.random() * 10000);

  const match = {
    id: matchId,
    players: {},
    seed,
    status: 'playing',
    scores: {},
    alive: {},
    startTime: Date.now(),
  };

  for (const p of players) {
    match.players[p.userId] = { socketId: p.socketId, userId: p.userId, username: p.username };
    match.scores[p.userId] = 0;
    match.alive[p.userId] = true;
  }

  flappyMatches.set(matchId, match);
  return match;
}

function getFlappyMatch(matchId) {
  return flappyMatches.get(matchId);
}

function removeFlappyMatch(matchId) {
  flappyMatches.delete(matchId);
}

module.exports = {
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
};
