import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/leaderboard/monthly', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7)
  try {
    const ranks = await db.all(`
      SELECT l.*, u.name as display_name
      FROM leaderboard l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.month = ?
      ORDER BY l.exp DESC
      LIMIT 50
    `, [month])
    res.json({ success: true, data: ranks, month })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, email, level, exp, budget, created_at FROM users WHERE id = ?', [req.params.id])
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.patch('/:id', async (req, res) => {
  const { name, budget } = req.body
  try {
    await db.run('UPDATE users SET name = COALESCE(?, name), budget = COALESCE(?, budget) WHERE id = ?', [name || null, budget || null, req.params.id])
    res.json({ success: true, message: 'Profil diperbarui' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
