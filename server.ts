import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, '.data');
const STORE_FILE = path.join(DATA_DIR, 'pocketbase_store.json');

// Ensure data storage directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBStore {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    focusArea: string;
    avatarColor: string;
    avatarInitials: string;
    daily_target_minutes: number;
    created: string;
    updated: string;
  }>;
  repositories: Array<{
    id: string;
    user: string;
    title: string;
    code: string;
    description: string;
    category: string;
    is_public: boolean;
    share_slug: string;
    nodes_data: any[];
    due_reviews_count: number;
    next_due_date: string | null;
    mastered_count: number;
    total_nodes_count: number;
    revision: number;
    created: string;
    updated: string;
  }>;
  study_logs: Array<{
    id: string;
    user: string;
    repository: string;
    date: string;
    minutes_spent: number;
    nodes_reviewed: number;
    created: string;
  }>;
}

// Initial seed data
const initialDB: DBStore = {
  users: [
    {
      id: 'usr_alex',
      email: 'alex@syllabex.dev',
      passwordHash: 'demo1234',
      name: 'Alex Chen',
      focusArea: 'Distributed Systems & Compilers',
      avatarColor: '#6366f1',
      avatarInitials: 'AC',
      daily_target_minutes: 30,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    {
      id: 'usr_elena',
      email: 'elena@syllabex.dev',
      passwordHash: 'demo1234',
      name: 'Dr. Elena Rostova',
      focusArea: 'Deep Learning & Neural Architectures',
      avatarColor: '#10b981',
      avatarInitials: 'ER',
      daily_target_minutes: 25,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
    {
      id: 'usr_marcus',
      email: 'marcus@syllabex.dev',
      passwordHash: 'demo1234',
      name: 'Marcus Vance',
      focusArea: 'Cloud Native & Linux Kernel',
      avatarColor: '#06b6d4',
      avatarInitials: 'MV',
      daily_target_minutes: 45,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    },
  ],
  repositories: [],
  study_logs: [],
};

// Load or initialize store
function loadDB(): DBStore {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Failed to load store, initializing default', err);
  }
  saveDB(initialDB);
  return initialDB;
}

function saveDB(data: DBStore) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store file', err);
  }
}

let db = loadDB();

app.use(express.json({ limit: '15mb' }));

// Healthcheck endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.4.0',
    service: 'Syllabex Production Server',
    usersCount: db.users.length,
    reposCount: db.repositories.length,
    timestamp: new Date().toISOString(),
  });
});

// Helper for generating tokens
function generateToken(userId: string): string {
  return `pb_jwt_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ----------------------------------------------------
// PocketBase Compatibility: Authentication Collections
// ----------------------------------------------------

// POST /api/collections/users/auth-with-password
app.post('/api/collections/users/auth-with-password', (req: Request, res: Response) => {
  const { identity, email, password } = req.body;
  const targetEmail = (identity || email || '').trim().toLowerCase();

  const user = db.users.find(
    (u) => u.email.toLowerCase() === targetEmail && u.passwordHash === password
  );

  if (!user) {
    return res.status(400).json({
      code: 400,
      message: 'Failed to authenticate. Incorrect email or password.',
      data: {},
    });
  }

  const token = generateToken(user.id);
  const userSafe = { ...user };
  delete (userSafe as any).passwordHash;

  return res.json({
    token,
    record: userSafe,
  });
});

// POST /api/collections/users/records (Signup)
app.post('/api/collections/users/records', (req: Request, res: Response) => {
  const { email, password, name, focusArea, avatarColor, avatarInitials, daily_target_minutes } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      code: 400,
      message: 'Email and password are required.',
      data: {},
    });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({
      code: 400,
      message: 'An account with this email already exists.',
      data: { email: { message: 'Must be unique' } },
    });
  }

  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    email: email.trim().toLowerCase(),
    passwordHash: password,
    name: name || email.split('@')[0],
    focusArea: focusArea || 'Software Engineering',
    avatarColor: avatarColor || '#6366f1',
    avatarInitials: avatarInitials || 'SB',
    daily_target_minutes: Number(daily_target_minutes) || 30,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB(db);

  const safe = { ...newUser };
  delete (safe as any).passwordHash;
  return res.status(200).json(safe);
});

// GET /api/collections/users/records/:id
app.get('/api/collections/users/records/:id', (req: Request, res: Response) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ code: 404, message: 'User not found' });
  }
  const safe = { ...user };
  delete (safe as any).passwordHash;
  return res.json(safe);
});

// PATCH /api/collections/users/records/:id
app.patch('/api/collections/users/records/:id', (req: Request, res: Response) => {
  const userIndex = db.users.findIndex((u) => u.id === req.params.id);
  if (userIndex === -1) {
    return res.status(404).json({ code: 404, message: 'User not found' });
  }

  const user = db.users[userIndex];
  const { name, focusArea, daily_target_minutes, avatarColor, avatarInitials } = req.body;

  if (name !== undefined) user.name = name;
  if (focusArea !== undefined) user.focusArea = focusArea;
  if (daily_target_minutes !== undefined) user.daily_target_minutes = Number(daily_target_minutes);
  if (avatarColor !== undefined) user.avatarColor = avatarColor;
  if (avatarInitials !== undefined) user.avatarInitials = avatarInitials;
  user.updated = new Date().toISOString();

  saveDB(db);
  const safe = { ...user };
  delete (safe as any).passwordHash;
  return res.json(safe);
});

// ----------------------------------------------------
// PocketBase Compatibility: Repositories Collection
// ----------------------------------------------------

// GET /api/collections/repositories/records
app.get('/api/collections/repositories/records', (req: Request, res: Response) => {
  const filter = (req.query.filter as string) || '';

  // Handle public share query: share_slug = "..." && is_public = true
  const shareMatch = filter.match(/share_slug\s*=\s*["']([^"']+)["']/);
  if (shareMatch) {
    const slug = shareMatch[1];
    const found = db.repositories.find((r) => r.share_slug === slug && r.is_public);
    if (!found) {
      return res.status(404).json({ code: 404, message: 'Public syllabus not found' });
    }
    return res.json({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [found],
    });
  }

  // Handle user query: user = "..."
  const userMatch = filter.match(/user\s*=\s*["']([^"']+)["']/);
  let items = db.repositories;
  if (userMatch) {
    const userId = userMatch[1];
    items = items.filter((r) => r.user === userId);
  }

  // Sort by updated descending
  items.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

  return res.json({
    page: 1,
    perPage: 100,
    totalItems: items.length,
    totalPages: 1,
    items,
  });
});

// GET /api/collections/repositories/records/:id
app.get('/api/collections/repositories/records/:id', (req: Request, res: Response) => {
  const repo = db.repositories.find((r) => r.id === req.params.id);
  if (!repo) {
    return res.status(404).json({ code: 404, message: 'Repository not found' });
  }
  return res.json(repo);
});

// POST /api/collections/repositories/records
app.post('/api/collections/repositories/records', (req: Request, res: Response) => {
  const b = req.body;
  const id = b.id || `repo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const existingIndex = db.repositories.findIndex((r) => r.id === id);
  if (existingIndex >= 0) {
    // If already exists, update instead of error
    db.repositories[existingIndex] = {
      ...db.repositories[existingIndex],
      ...b,
      id,
      updated: new Date().toISOString(),
    };
    saveDB(db);
    return res.json(db.repositories[existingIndex]);
  }

  const newRepo = {
    id,
    user: b.user,
    title: b.title || b.name || 'Untitled Syllabus',
    code: b.code || 'SYS-101',
    description: b.description || '',
    category: b.category || 'General',
    is_public: Boolean(b.is_public),
    share_slug: b.share_slug || '',
    nodes_data: b.nodes_data || [],
    due_reviews_count: Number(b.due_reviews_count) || 0,
    next_due_date: b.next_due_date || null,
    mastered_count: Number(b.mastered_count) || 0,
    total_nodes_count: Number(b.total_nodes_count) || 0,
    revision: Number(b.revision) || 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  db.repositories.push(newRepo);
  saveDB(db);
  return res.status(200).json(newRepo);
});

// PATCH /api/collections/repositories/records/:id
app.patch('/api/collections/repositories/records/:id', (req: Request, res: Response) => {
  const repoIndex = db.repositories.findIndex((r) => r.id === req.params.id);
  if (repoIndex === -1) {
    return res.status(404).json({ code: 404, message: 'Repository not found' });
  }

  const b = req.body;
  const current = db.repositories[repoIndex];

  db.repositories[repoIndex] = {
    ...current,
    ...b,
    id: current.id,
    updated: new Date().toISOString(),
  };

  saveDB(db);
  return res.json(db.repositories[repoIndex]);
});

// DELETE /api/collections/repositories/records/:id
app.delete('/api/collections/repositories/records/:id', (req: Request, res: Response) => {
  const prevCount = db.repositories.length;
  db.repositories = db.repositories.filter((r) => r.id !== req.params.id);
  saveDB(db);

  if (db.repositories.length < prevCount) {
    return res.status(204).send();
  }
  return res.status(404).json({ code: 404, message: 'Repository not found' });
});

// ----------------------------------------------------
// PocketBase Compatibility: Study Logs Collection
// ----------------------------------------------------

app.get('/api/collections/study_logs/records', (req: Request, res: Response) => {
  const userId = req.query.user as string;
  let items = db.study_logs;
  if (userId) {
    items = items.filter((l) => l.user === userId);
  }
  return res.json({ items });
});

app.post('/api/collections/study_logs/records', (req: Request, res: Response) => {
  const { user, repository, date, minutes_spent, nodes_reviewed } = req.body;
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    user,
    repository,
    date: date || new Date().toISOString().split('T')[0],
    minutes_spent: Number(minutes_spent) || 0,
    nodes_reviewed: Number(nodes_reviewed) || 0,
    created: new Date().toISOString(),
  };
  db.study_logs.push(newLog);
  saveDB(db);
  return res.json(newLog);
});

// ----------------------------------------------------
// Vite Dev Server / Static Hosting Integration
// ----------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Syllabex Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[PocketBase Engine] Database initialized with ${db.users.length} users and ${db.repositories.length} repos`);
  });
}

startServer();
