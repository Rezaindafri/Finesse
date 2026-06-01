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

await run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, level INTEGER DEFAULT 1, exp INTEGER DEFAULT 0, budget INTEGER DEFAULT 2000000, created_at TEXT DEFAULT (datetime('now')))`)
await run(`CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, amount INTEGER NOT NULL, category TEXT NOT NULL, note TEXT, date TEXT NOT NULL, exp_earned INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`)
await run(`CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, description TEXT, reason TEXT, progress INTEGER DEFAULT 0, total INTEGER NOT NULL, exp_reward INTEGER DEFAULT 100, status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))`)
await run(`CREATE TABLE IF NOT EXISTS leaderboard (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, name TEXT NOT NULL, exp INTEGER DEFAULT 0, level INTEGER DEFAULT 1, month TEXT NOT NULL)`)

const userCount = await get('SELECT COUNT(*) as count FROM users')
if (userCount.count === 0) {
  await run(`INSERT INTO users (name, email, password, level, exp, budget) VALUES (?, ?, ?, ?, ?, ?)`, ['Budi Santoso', 'budi@email.com', 'password123', 7, 1240, 2000000])
  await run(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned) VALUES (?, ?, ?, ?, ?, ?)`, [1, 25000, 'Makan & Minum', 'Makan siang warteg', '2025-05-28', 12])
  await run(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned) VALUES (?, ?, ?, ?, ?, ?)`, [1, 15000, 'Transportasi', 'Angkot kampus', '2025-05-27', 15])
  await run(`INSERT INTO quests (user_id, title, description, reason, progress, total, exp_reward, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [1, 'Hemat 5 Hari Berturut', 'Catat pengeluaran di bawah Rp 50.000 selama 5 hari', 'Kebiasaan hemat', 3, 5, 200, 'active'])
  const month = new Date().toISOString().slice(0, 7)
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?, ?, ?, ?, ?)`, [1, 'Budi Santoso', 1240, 7, month])
  await run(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?, ?, ?, ?, ?)`, [0, 'Andi Kurnia', 4200, 9, month])
  console.log('✅ Database seeded')
}

export default { run, get, all }
