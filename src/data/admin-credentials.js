const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '..', '..', 'data', 'admin-credentials.json');
const DEFAULT_USERNAME = 'omer123';
const DEFAULT_PASSWORD = 'omer123';

function ensureDataDir() {
  const dir = path.dirname(CREDENTIALS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_PATH)) {
      const raw = fs.readFileSync(CREDENTIALS_PATH, 'utf8');
      const data = JSON.parse(raw);
      return {
        username: data.username || DEFAULT_USERNAME,
        password: data.password || DEFAULT_PASSWORD,
      };
    }
  } catch (e) {
    console.warn('Admin credentials read failed:', e.message);
  }
  return { username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD };
}

function setCredentials(username, password) {
  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    throw new Error('Kullanıcı adı ve şifre gerekli');
  }
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) throw new Error('Kullanıcı adı ve şifre boş olamaz');
  ensureDataDir();
  fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify({ username: u, password: p }, null, 2), 'utf8');
  return { username: u };
}

function ensureDefaultCredentials() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    ensureDataDir();
    fs.writeFileSync(
      CREDENTIALS_PATH,
      JSON.stringify({ username: DEFAULT_USERNAME, password: DEFAULT_PASSWORD }, null, 2),
      'utf8'
    );
    console.log(`Admin varsayılan hesap oluşturuldu: ${DEFAULT_USERNAME} / ***`);
  }
}

module.exports = { getCredentials, setCredentials, ensureDefaultCredentials };
