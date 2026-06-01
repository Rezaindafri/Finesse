import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, 'finesse.db')
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    level       INTEGER DEFAULT 1,
    exp         INTEGER DEFAULT 0,
    budget      INTEGER DEFAULT 2000000,
    created_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    amount      INTEGER NOT NULL,
    category    TEXT    NOT NULL,
    note        TEXT,
    date        TEXT    NOT NULL,
    exp_earned  INTEGER DEFAULT 0,
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS quests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT,
    reason      TEXT,
    progress    INTEGER DEFAULT 0,
    total       INTEGER NOT NULL,
    exp_reward  INTEGER DEFAULT 100,
    status      TEXT    DEFAULT 'active',
    created_at  TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS leaderboard (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    exp         INTEGER DEFAULT 0,
    level       INTEGER DEFAULT 1,
    month       TEXT    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()
if (userCount.count === 0) {
  db.prepare(`INSERT INTO users (name, email, password, level, exp, budget) VALUES (?, ?, ?, ?, ?, ?)`).run('Budi Santoso', 'budi@email.com', 'password123', 7, 1240, 2000000)

  const insertTx = db.prepare(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned) VALUES (?, ?, ?, ?, ?, ?)`)
  insertTx.run(1, 25000, 'Makan & Minum', 'Makan siang warteg', '2025-05-28', 12)
  insertTx.run(1, 15000, 'Transportasi', 'Angkot kampus', '2025-05-27', 15)
  insertTx.run(1, 50000, 'Hiburan', 'Nonton bioskop', '2025-05-26', 8)
  insertTx.run(1, 120000, 'Belanja', 'Beli buku kuliah', '2025-05-25', 10)

  const insertQuest = db.prepare(`INSERT INTO quests (user_id, title, description, reason, progress, total, exp_reward, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  insertQuest.run(1, 'Hemat 5 Hari Berturut', 'Catat pengeluaran di bawah Rp 50.000 selama 5 hari', 'Kebiasaan hemat membentuk disiplin finansial jangka panjang', 3, 5, 200, 'active')
  insertQuest.run(1, 'Master Transportasi', 'Gunakan transportasi umum 10x bulan ini', 'Hemat sampai 60% dibanding kendaraan pribadi', 7, 10, 150, 'active')
  insertQuest.run(1, 'Zero Jajan Seminggu', 'Tidak jajan di luar selama 7 hari', 'Mengurangi pengeluaran impulsif', 7, 7, 300, 'completed')

  const month = new Date().toISOString().slice(0, 7)
  const insertRank = db.prepare(`INSERT INTO leaderboard (user_id, name, exp, level, month) VALUES (?, ?, ?, ?, ?)`)
  insertRank.run(1, 'Budi Santoso', 1240, 7, month)
  insertRank.run(0, 'Andi Kurnia', 4200, 9, month)
  insertRank.run(0, 'Siti Rahayu', 3800, 8, month)
  insertRank.run(0, 'Dian Pratama', 3100, 8, month)
  insertRank.run(0, 'Rizky Maulana', 2900, 7, month)

  console.log('✅ Database seeded dengan data demo')
}

export default db
