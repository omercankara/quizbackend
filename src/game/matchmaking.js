const { getRandomQuestions } = require('../data/questions');

const QUESTIONS_PER_MATCH = 5;

// Türk isimleri - karışık kadın ve erkek
const BOT_NAMES = [
  'Zeynep', 'Ahmet', 'Elif', 'Mehmet', 'Ayşe', 'Mustafa', 'Fatma', 'Ali', 'Merve', 'Hüseyin',
  'Selin', 'Emre', 'Deniz', 'Burak', 'Özlem', 'Can', 'Esra', 'Kerem', 'Dilara', 'Oğuz',
  'Sude', 'Barış', 'Melis', 'Yusuf', 'Ece', 'Murat', 'Ceren', 'Berk', 'Aslı', 'Eren',
  'İrem', 'Kaan', 'Begüm', 'Serkan', 'Defne', 'Onur', 'Naz', 'Tolga', 'Ela', 'Batuhan',
];

function getRandomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}

function createBotPlayer() {
  const name = getRandomBotName();
  return {
    socketId: null,
    userId: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    username: name,
    powerups: { fifty_fifty: 0, time_freeze: 0, double_points: 0, hint: 0 },
    isBot: true,
  };
}
const TIME_PER_QUESTION = 15;
const QUICK_QUESTIONS = 3;
const QUICK_TIME = 8;

const waitingQueues = {};
const activeMatches = new Map();
const privateInvites = new Map();

function getQueueKey(difficulty, category, mode) {
  return `${mode || '1v1'}_${difficulty}_${category || 'all'}`;
}

async function createMatch(player1, player2, difficulty, category, mode) {
  const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const isQuick = mode === 'quick';
  const qCount = isQuick ? QUICK_QUESTIONS : QUESTIONS_PER_MATCH;
  const tPerQ = isQuick ? QUICK_TIME : TIME_PER_QUESTION;
  const questions = await getRandomQuestions(difficulty, qCount, category === 'all' ? null : category);

  const p1pw = player1.powerups || { fifty_fifty: 0, time_freeze: 0, double_points: 0, hint: 0 };
  const p2pw = player2.powerups || { fifty_fifty: 0, time_freeze: 0, double_points: 0, hint: 0 };

  const match = {
    id: matchId,
    difficulty,
    category: category || 'all',
    mode: mode || '1v1',
    players: {
      [player1.userId]: {
        socketId: player1.socketId, score: 0, answers: {}, username: player1.username,
        correctCount: 0, powerups: { ...p1pw }, doubleActive: false,
      },
      [player2.userId]: {
        socketId: player2.socketId, score: 0, answers: {}, username: player2.username,
        correctCount: 0, powerups: { ...p2pw }, doubleActive: false,
      },
    },
    questions,
    currentQuestionIndex: 0,
    status: 'playing',
    answeredThisRound: new Set(),
    timer: null,
    questionsPerMatch: qCount,
    timePerQuestion: tPerQ,
  };

  activeMatches.set(matchId, match);
  return match;
}

function joinQueue(playerData, difficulty, category, mode) {
  const key = getQueueKey(difficulty, category, mode);
  if (waitingQueues[key]) {
    const opponent = waitingQueues[key];
    waitingQueues[key] = null;
    return { matched: true, opponent };
  }
  waitingQueues[key] = playerData;
  return { matched: false };
}

function leaveQueue(socketId) {
  for (const key of Object.keys(waitingQueues)) {
    if (waitingQueues[key] && waitingQueues[key].socketId === socketId) {
      waitingQueues[key] = null;
      return true;
    }
  }
  return false;
}

function getWaitingPlayer(key, socketId) {
  const wp = waitingQueues[key];
  if (wp && wp.socketId === socketId) return wp;
  return null;
}

function createPrivateInvite(hostPlayer, difficulty, category, mode) {
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  privateInvites.set(inviteCode, { host: hostPlayer, difficulty, category, mode, createdAt: Date.now() });
  return inviteCode;
}

function joinPrivateInvite(inviteCode) {
  const invite = privateInvites.get(inviteCode);
  if (!invite) return { success: false, error: 'Davet kodu geçersiz' };
  privateInvites.delete(inviteCode);
  return { success: true, host: invite.host, difficulty: invite.difficulty, category: invite.category, mode: invite.mode };
}

function getMatch(matchId) { return activeMatches.get(matchId); }

function removeMatch(matchId) {
  const match = activeMatches.get(matchId);
  if (match && match.timer) clearTimeout(match.timer);
  activeMatches.delete(matchId);
}

module.exports = {
  joinQueue, leaveQueue, createMatch, getMatch, removeMatch, activeMatches,
  createPrivateInvite, joinPrivateInvite, createBotPlayer, getQueueKey, getWaitingPlayer,
  QUESTIONS_PER_MATCH, TIME_PER_QUESTION,
};
