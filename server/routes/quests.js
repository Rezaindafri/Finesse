import { Router } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const quests = await db.all(`SELECT * FROM quests WHERE user_id = ? ORDER BY created_at DESC`, [userId])
    res.json({ success: true, data: quests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [req.params.id])
    if (!quest) return res.status(404).json({ success: false, message: 'Quest tidak ditemukan' })
    res.json({ success: true, data: quest })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/', async (req, res) => {
  const { user_id = 1, title, description, reason, total, exp_reward } = req.body
  if (!title || !total) return res.status(400).json({ success: false, message: 'Field title dan total wajib diisi' })
  try {
    const result = await db.run(`INSERT INTO quests (user_id, title, description, reason, total, exp_reward) VALUES (?, ?, ?, ?, ?, ?)`, [user_id, title, description || '', reason || '', total, exp_reward || 100])
    res.status(201).json({ success: true, message: 'Quest berhasil dibuat', data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.patch('/:id/progress', async (req, res) => {
  const { increment = 1 } = req.body
  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [req.params.id])
    if (!quest) return res.status(404).json({ success: false, message: 'Quest tidak ditemukan' })
    const newProgress = Math.min(quest.progress + increment, quest.total)
    const newStatus = newProgress >= quest.total ? 'completed' : 'active'
    await db.run('UPDATE quests SET progress = ?, status = ? WHERE id = ?', [newProgress, newStatus, req.params.id])
    res.json({ success: true, data: { progress: newProgress, total: quest.total, status: newStatus } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.post('/:id/claim', async (req, res) => {
  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [req.params.id])
    if (!quest) return res.status(404).json({ success: false, message: 'Quest tidak ditemukan' })
    if (quest.status !== 'completed') return res.status(400).json({ success: false, message: 'Quest belum selesai' })
    await db.run("UPDATE quests SET status = 'claimed' WHERE id = ?", [req.params.id])
    await db.run('UPDATE users SET exp = exp + ? WHERE id = ?', [quest.exp_reward, quest.user_id])
    res.json({ success: true, message: `+${quest.exp_reward} EXP berhasil diklaim!`, data: { exp_earned: quest.exp_reward } })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM quests WHERE id = ?', [req.params.id])
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Quest tidak ditemukan' })
    res.json({ success: true, message: 'Quest dihapus' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
