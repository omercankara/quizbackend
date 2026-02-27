const ChatMessage = require('../models/ChatMessage');
const { isChatBanned } = require('../game/chatBan');

function setupChatSocket(io) {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    socket.on('register', ({ userId, username }) => {
      socket.userId = userId;
      socket.username = username;
    });

    socket.on('match_message', async ({ matchId, userId, username, text }) => {
      if (!text || !text.trim() || !matchId) return;
      if (await isChatBanned(userId)) {
        socket.emit('chat_error', { error: 'Sohbet yetkiniz geçici olarak kısıtlandı.' });
        return;
      }
      const trimmed = text.trim().slice(0, 200);

      await ChatMessage.create({
        oduserId: userId,
        username,
        text: trimmed,
        room: matchId,
      });

      const message = {
        id: `msg_${Date.now()}`,
        userId,
        username,
        text: trimmed,
        timestamp: Date.now(),
      };

      chatNamespace.to(matchId).emit('match_message', message);
    });

    socket.on('join_match_chat', ({ matchId }) => {
      if (matchId) socket.join(matchId);
    });

    socket.on('leave_match_chat', ({ matchId }) => {
      if (matchId) socket.leave(matchId);
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { setupChatSocket };
