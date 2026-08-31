const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB
const TRIM_COUNT = 100;
const MAX_MESSAGE_LENGTH = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '6mb' }));
app.use(express.static(path.join(__dirname))); // serve site files

// ensure data dir and file
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(MESSAGES_FILE)) fs.writeFileSync(MESSAGES_FILE, '[]', 'utf8');

function readMessages(){
  try{
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    console.error('readMessages error', e);
    return [];
  }
}

function writeMessages(list){
  try{
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(list), 'utf8');
  }catch(e){
    console.error('writeMessages error', e);
  }
}

function enforceStorageLimit(){
  try{
    const stats = fs.statSync(MESSAGES_FILE);
    if (stats.size > STORAGE_LIMIT_BYTES){
      const list = readMessages();
      if (list.length > TRIM_COUNT){
        list.splice(0, TRIM_COUNT);
      } else {
        list.length = 0;
      }
      writeMessages(list);
      console.log('Storage exceeded - trimmed oldest', TRIM_COUNT, 'messages');
    }
  }catch(e){
    console.error('enforceStorageLimit error', e);
  }
}

app.get('/api/messages', (req, res) => {
  const list = readMessages();
  res.json(list);
});

app.post('/api/messages', (req, res) => {
  const { user, text } = req.body || {};
  if (!user || !text) return res.status(400).json({ error: 'Missing user or text' });
  if (typeof text !== 'string' || text.length === 0) return res.status(400).json({ error: 'Empty text' });
  if (text.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: 'Message too long' });

  const msg = { user: String(user).slice(0,64), text: String(text).slice(0, MAX_MESSAGE_LENGTH), time: Date.now() };
  const list = readMessages();
  list.push(msg);
  writeMessages(list);

  // enforce storage limit asynchronously
  setImmediate(enforceStorageLimit);

  res.status(201).json(msg);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
