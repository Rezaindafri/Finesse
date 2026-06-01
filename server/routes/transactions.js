import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId)
    res.json({ success: true, data: transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id)
    if (!tx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, data: tx })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/', (req, res) => {
  const { user_id = 1, amount, category, note, date } = req.body
  if (!amount || !category || !date) return res.status(400).json({ success: false, message: 'Field amount, category, dan date wajib diisi' })
  try {
    const user = db.prepare('SELECT budget FROM users WHERE id = ?').get(user_id)
    const budget = user?.budget || 2000000
    const exp = Math.max(5, Math.min(30, Math.round(15 - (amount / budget) * 10)))
    const result = db.prepare(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned) VALUES (?, ?, ?, ?, ?, ?)`).run(user_id, amount, category, note || category, date, exp)
    db.prepare('UPDATE users SET exp = exp + ? WHERE id = ?').run(exp, user_id)
    const month = new Date().toISOString().slice(0, 7)
    const existing = db.prepare('SELECT id FROM leaderboard WHERE user_id = ? AND month = ?').get(user_id, month)
    if (existing) db.prepare('UPDATE leaderboard SET exp = exp + ? WHERE user_id = ? AND month = ?').run(exp, user_id, month)
    res.status(201).json({ success: true, message: 'Transaksi berhasil disimpan', data: { id: result.lastInsertRowid, exp_earned: exp } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, message: 'Transaksi dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/summary/monthly', (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const summary = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(amount) as total, COUNT(*) as count, SUM(exp_earned) as total_exp
      FROM transactions WHERE user_id = ?
      GROUP BY month ORDER BY month DESC LIMIT 6
    `).all(userId)
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
