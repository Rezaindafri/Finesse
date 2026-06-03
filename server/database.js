import sqlite3pkg from 'sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const { Database } = sqlite3pkg.verbose()
const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'finesse.db')
const db = new Database(DB_PATH)

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err)
    else resolve({ lastInsertRowid: this.lastID, changes: this.changes })
  })
})
const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row) })
})
const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows) })
})

// ── TABEL ──
await run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  exp INTEGER DEFAULT 0,
  budget INTEGER DEFAULT 2000000,
  created_at TEXT DEFAULT (datetime('now'))
)`)

await run(`CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  exp_earned INTEGER DEFAULT 0,
  cumulative_spend INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`)

await run(`CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  exp_reward INTEGER DEFAULT 100,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
)`)

await run(`CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  exp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  month TEXT NOT NULL
)`)

// ── TABEL XP HISTORY ──
await run(`CREATE TABLE IF NOT EXISTS xp_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  transaction_id INTEGER,
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  cumulative_spend INTEGER DEFAULT 0,
  jumlah_kategori INTEGER DEFAULT 1,
  xp_earned INTEGER NOT NULL,
  level_before INTEGER NOT NULL,
  level_after INTEGER NOT NULL,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`)

// ── TABEL LEVELS ──
await run(`CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level INTEGER UNIQUE NOT NULL,
  min_xp INTEGER NOT NULL,
  max_xp INTEGER NOT NULL,
  title TEXT NOT NULL,
  badge TEXT NOT NULL
)`)

// ── SEED LEVELS ──
const levelCount = await get('SELECT COUNT(*) as count FROM levels')
if (levelCount.count === 0) {
  const levelData = [
    [1, 0, 199, 'Pemula', '🥉'],
    [2, 200, 499, 'Hemat Muda', '🥉'],
    [3, 500, 899, 'Penabung', '🥈'],
    [4, 900, 1399, 'Bijak Belanja', '🥈'],
    [5, 1400, 1999, 'Finansial Pro', '🥇'],
    [6, 2000, 2799, 'Money Master', '🥇'],
    [7, 2800, 3799, 'Liga Silver', '⭐'],
    [8, 3800, 4999, 'Liga Gold', '🌟'],
    [9, 5000, 6499, 'Liga Platinum', '💎'],
    [10, 6500, 999999, 'Financial Legend', '👑'],
  ]
  for (const [level, min_xp, max_xp, title, badge] of levelData) {
    await run(`INSERT INTO levels (level, min_xp, max_xp, title, badge) VALUES (?,?,?,?,?)`,
      [level, min_xp, max_xp, title, badge])
  }
  console.log('✅ Levels seeded')
}

// ── SEED USERS & DATA ──
const userCount = await get('SELECT COUNT(*) as count FROM users')
if (userCount.count === 0) {
  await run(`INSERT INTO users (name, email, password, level, exp, budget) VALUES (?,?,?,?,?,?)`,
    ['Budi Santoso', 'budi@email.com', 'password123', 7, 3200, 2000000])

  const txList = [
    [1, 25000, 'Makan & Minum', 'Makan siang warteg', '2026-05-28', 15, 25000],
    [1, 15000, 'Transportasi', 'Angkot kampus', '2026-05-27', 18, 40000],
    [1, 50000, 'Hiburan', 'Nonton bioskop', '2026-05-26', 10, 90000],
    [1, 120000, 'Belanja', 'Beli buku kuliah', '2026-05-25', 8, 210000],
    [1, 32000, 'Makan & Minum', 'Kopi kekinian', '2026-05-24', 12, 242000],
    [1, 18000, 'Transportasi', 'Grab ke kampus', '2026-05-23', 16, 260000],
  ]
  for (const [uid, amt, cat, note, date, xp, cum] of txList) {
    const res = await run(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned, cumulative_spend) VALUES (?,?,?,?,?,?,?)`,
      [uid, amt, cat, note, date, xp, cum])
    await run(`INSERT INTO xp_history (user_id, transaction_id, amount, category, cumulative_spend, jumlah_kategori, xp_earned, level_before, level_after, reason) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [uid, res.lastInsertRowid, amt, cat, cum, 1, xp, 7, 7, `Transaksi ${cat}`])
  }

  const month = new Date().toISOString().slice(0, 7)
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?,?,?,?,?)`, [1, 'Budi Santoso', 3200, 7, month])
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?,?,?,?,?)`, [0, 'Andi Kurnia', 4200, 9, month])
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?,?,?,?,?)`, [0, 'Siti Rahayu', 3800, 8, month])
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?,?,?,?,?)`, [0, 'Dian Pratama', 3100, 8, month])
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?,?,?,?,?)`, [0, 'Rizky Maulana', 2900, 7, month])

  await run(`INSERT INTO quests (user_id, title, description, reason, progress, total, exp_reward, status) VALUES (?,?,?,?,?,?,?,?)`,
    [1, 'Hemat 5 Hari Berturut', 'Catat pengeluaran di bawah Rp 50.000 selama 5 hari', 'Kebiasaan hemat membentuk disiplin finansial', 3, 5, 200, 'active'])
  await run(`INSERT INTO quests (user_id, title, description, reason, progress, total, exp_reward, status) VALUES (?,?,?,?,?,?,?,?)`,
    [1, 'Master Transportasi', 'Gunakan transportasi umum 10x bulan ini', 'Hemat sampai 60% dibanding kendaraan pribadi', 7, 10, 150, 'active'])

  console.log('✅ Database seeded dengan data demo')
}

export default { run, get, all }
