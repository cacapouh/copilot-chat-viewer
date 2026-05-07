import express from 'express';
import { customAlphabet } from 'nanoid';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 3001);
const DATA_DIR = process.env.DATA_DIR ?? path.resolve('data');
const URLS_FILE = path.join(DATA_DIR, 'urls.json');

// 衝突しにくく、URL に出して気持ち悪くない英数字のみ。
const nanoid = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 8);

async function readAll() {
  try {
    const raw = await fs.readFile(URLS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return {};
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

async function writeAll(map) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = URLS_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(map, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, URLS_FILE);
}

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/api/share', async (req, res) => {
  const encoded = req.body?.encoded;
  if (typeof encoded !== 'string' || encoded.length === 0) {
    return res.status(400).json({ error: 'encoded (string) is required' });
  }
  const map = await readAll();
  // 同一内容は同一 ID を返す（冪等）。雑な社内利用想定なので線形スキャンで十分。
  for (const [existingId, value] of Object.entries(map)) {
    if (value === encoded) return res.json({ id: existingId });
  }
  let id = nanoid();
  while (map[id]) id = nanoid();
  map[id] = encoded;
  await writeAll(map);
  res.json({ id });
});

app.get('/api/share/:id', async (req, res) => {
  const id = req.params.id;
  if (!/^[a-z0-9]{1,64}$/i.test(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const map = await readAll();
  const encoded = map[id];
  if (!encoded) return res.status(404).json({ error: 'not found' });
  res.json({ encoded });
});

app.listen(PORT, () => {
  console.log(`[short-link] listening on :${PORT} (data: ${URLS_FILE})`);
});
