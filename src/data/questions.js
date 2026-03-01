const { Op } = require('sequelize');
const QuestionModel = require('../models/Question');

const CATEGORIES = [
  { key: 'general', label: 'Genel Kültür', emoji: '🌍' },
  { key: 'science', label: 'Bilim', emoji: '🔬' },
  { key: 'history', label: 'Tarih', emoji: '📜' },
  { key: 'sports', label: 'Spor', emoji: '⚽' },
  { key: 'geography', label: 'Coğrafya', emoji: '🗺️' },
  { key: 'technology', label: 'Teknoloji', emoji: '💻' },
];

function rowToQuestion(row) {
  const opts = [row.optionA, row.optionB, row.optionC];
  if (row.optionD) opts.push(row.optionD);
  return {
    id: row.questionKey,
    dbId: row.id,
    text: row.text,
    options: opts,
    correct: row.correct,
    hint: row.hint || '',
    category: row.category,
    difficulty: row.difficulty,
  };
}

async function getRandomQuestions(difficulty, count = 5, category = null) {
  const where = { difficulty };
  if (category && category !== 'all') where.category = category;

  const rows = await QuestionModel.findAll({
    where,
    order: QuestionModel.sequelize.random(),
    limit: count,
  });

  return rows.map((r) => {
    const opts = [r.optionA, r.optionB, r.optionC];
    if (r.optionD) opts.push(r.optionD);
    return { id: r.questionKey, text: r.text, options: opts, correct: r.correct, hint: r.hint || '' };
  });
}

async function checkAnswer(questionId, selectedOption) {
  const row = await QuestionModel.findOne({ where: { questionKey: questionId } });
  if (!row) return false;
  return row.correct === selectedOption;
}

async function getCorrectAnswer(questionId) {
  const row = await QuestionModel.findOne({ where: { questionKey: questionId } });
  return row ? row.correct : -1;
}

async function getQuestionHint(questionId) {
  const row = await QuestionModel.findOne({ where: { questionKey: questionId } });
  return row ? (row.hint || '') : '';
}

async function getAllQuestions() {
  const rows = await QuestionModel.findAll({ order: [['category', 'ASC'], ['difficulty', 'ASC']] });
  return rows.map(rowToQuestion);
}

async function addQuestion(category, difficulty, questionData) {
  return QuestionModel.create({
    questionKey: questionData.id || `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category,
    difficulty,
    text: questionData.text,
    optionA: questionData.options[0],
    optionB: questionData.options[1],
    optionC: questionData.options[2],
    optionD: questionData.options[3] || null,
    correct: questionData.correct,
    hint: questionData.hint || '',
  });
}

async function updateQuestion(questionId, updates) {
  const row = await QuestionModel.findOne({ where: { [Op.or]: [{ questionKey: questionId }, { id: questionId }] } });
  if (!row) return false;
  if (updates.text) row.text = updates.text;
  if (updates.options) {
    row.optionA = updates.options[0];
    row.optionB = updates.options[1];
    row.optionC = updates.options[2];
    row.optionD = updates.options[3] || null;
  }
  if (updates.correct !== undefined) row.correct = updates.correct;
  if (updates.hint !== undefined) row.hint = updates.hint;
  if (updates.category) row.category = updates.category;
  if (updates.difficulty) row.difficulty = updates.difficulty;
  await row.save();
  return true;
}

async function deleteQuestion(questionId) {
  const deleted = await QuestionModel.destroy({ where: { [Op.or]: [{ questionKey: questionId }, { id: questionId }] } });
  return deleted > 0;
}

async function getDailyQuestion() {
  const today = new Date().toISOString().slice(0, 10);
  let seed = 0;
  for (let i = 0; i < today.length; i++) seed += today.charCodeAt(i);

  const hardCount = await QuestionModel.count({ where: { difficulty: 'hard' } });
  if (hardCount === 0) return null;

  const offset = seed % hardCount;
  const rows = await QuestionModel.findAll({ where: { difficulty: 'hard' }, order: [['id', 'ASC']], limit: 1, offset });
  const row = rows[0];
  if (!row) return null;

  return { ...rowToQuestion(row), date: today };
}

module.exports = {
  getRandomQuestions,
  checkAnswer,
  getCorrectAnswer,
  getQuestionHint,
  getAllQuestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getDailyQuestion,
  CATEGORIES,
};
