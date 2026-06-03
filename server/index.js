import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import transactionsRouter from './routes/transactions.js'
import questsRouter from './routes/quests.js'
import usersRouter from './routes/users.js'
import aiRouter from './routes/ai.js'
import xpRouter from './routes/xp.js'
import mlRouter from './routes/ml.js'

const app = express()
const PORT = process.env.PORT || 3000
const __dirname = dirname(fileURLToPath(import.meta.url))

// ── MIDDLEWARE ──
app.use(cors())
app.use(express.json())
app.use(express.static(join(__dirname, '../')))

// ── RESTful API ROUTES ──
app.use('/api/transactions', transactionsRouter)
app.use('/api/quests', questsRouter)
app.use('/api/users', usersRouter)
app.use('/api/ai', aiRouter)
app.use('/api/xp', xpRouter)
app.use('/api/ml', mlRouter)

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Finesse API is running 🚀',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET  /api/health',
      'GET  /api/transactions',
      'POST /api/transactions',
      'GET  /api/xp/history',
      'GET  /api/xp/summary',
      'GET  /api/xp/levels',
      'POST /api/ml/predict-xp',
      'GET  /api/ml/model-info',
      'POST /api/ai/analyze',
      'POST /api/ai/quest-suggest',
      'GET  /api/users/leaderboard/monthly'
    ]
  })
})

// ── 404 handler ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} tidak ditemukan` })
})

// ── Serve index.html ──
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'))
})

// ── START ──
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   🎮 Finesse API v2.0 Running            ║
║   http://localhost:${PORT}                  ║
╠══════════════════════════════════════════╣
║  /api/transactions  → CRUD + ML XP       ║
║  /api/xp/history    → Riwayat XP         ║
║  /api/xp/levels     → Level Config       ║
║  /api/ml/predict-xp → Deep Learning      ║
║  /api/ai/analyze    → Groq AI Coach      ║
╚══════════════════════════════════════════╝
  `)
})
