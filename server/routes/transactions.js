import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const transactions = await db.all(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`, [userId])
    res.json({ success: true, data: transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const tx = await db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id])
    if (!tx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, data: tx })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/', async (req, res) => {
  const { user_id = 1, amount, category, note, date } = req.body
  if (!amount || !category || !date) return res.status(400).json({ success: false, message: 'Field amount, category, dan date wajib diisi' })
  try {
    const user = await db.get('SELECT budget FROM users WHERE id = ?', [user_id])
    const budget = user?.budget || 2000000
    const exp = Math.max(5, Math.min(30, Math.round(15 - (amount / budget) * 10)))
    const result = await db.run(`INSERT INTO transactions (user_id, amount, category, note, date, exp_earned) VALUES (?, ?, ?, ?, ?, ?)`, [user_id, amount, category, note || category, date, exp])
    await db.run('UPDATE users SET exp = exp + ? WHERE id = ?', [exp, user_id])
    const month = new Date().toISOString().slice(0, 7)
    const existing = await db.get('SELECT id FROM leaderboard WHERE user_id = ? AND month = ?', [user_id, month])
    if (existing) await db.run('UPDATE leaderboard SET exp = exp + ? WHERE user_id = ? AND month = ?', [exp, user_id, month])
    res.status(201).json({ success: true, message: 'Transaksi berhasil disimpan', data: { id: result.lastInsertRowid, exp_earned: exp } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM transactions WHERE id = ?', [req.params.id])
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, message: 'Transaksi dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/summary/monthly', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const summary = await db.all(`SELECT strftime('%Y-%m', date) as month, SUM(amount) as total, COUNT(*) as count, SUM(exp_earned) as total_exp FROM transactions WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 6`, [userId])
    res.json({ success: true, data: summary })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
