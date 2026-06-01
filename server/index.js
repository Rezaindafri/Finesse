import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import transactionsRouter from './routes/transactions.js'
import questsRouter from './routes/quests.js'
import usersRouter from './routes/users.js'
import aiRouter from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 3000
const __dirname = dirname(fileURLToPath(import.meta.url))

app.use(cors())
app.use(express.json())
app.use(express.static(join(__dirname, '../')))

app.use('/api/transactions', transactionsRouter)
app.use('/api/quests', questsRouter)
app.use('/api/users', usersRouter)
app.use('/api/ai', aiRouter)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Finesse API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} tidak ditemukan` })
})

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'))
})

app.listen(PORT, () => {
  console.log(`🎮 Finesse API Server Running at http://localhost:${PORT}`)
})
