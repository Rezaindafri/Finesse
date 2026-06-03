import { Router } from 'express'
import db from '../database.js'

const router = Router()

// ── HELPER: Hitung level dari XP ──
async function hitungLevel(xp) {
  const level = await db.get(
    'SELECT level, title, badge FROM levels WHERE min_xp <= ? AND max_xp >= ?',
    [xp, xp]
  )
  return level || { level: 1, title: 'Pemula', badge: '🥉' }
}

// ── HELPER: Panggil ML API untuk prediksi XP ──
async function predictXP(amount, category, cumulative_spend, jumlah_kategori) {
  try {
    const ML_API = process.env.ML_API_URL || 'https://finesse-production.up.railway.app/api/ml'
    const res = await fetch(`${ML_API}/predict-xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, category, cumulative_spend, jumlah_kategori })
    })
    const data = await res.json()
    return data.xp || 10
  } catch {
    // Fallback kalau ML tidak tersedia
    const base = Math.max(5, Math.min(30, Math.round(20 - (amount / 100000) * 5)))
    return base
  }
}

// GET /api/transactions
router.get('/', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const transactions = await db.all(
      `SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
    res.json({ success: true, data: transactions })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const tx = await db.get('SELECT * FROM transactions WHERE id = ?', [req.params.id])
    if (!tx) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, data: tx })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/transactions — flow utama dengan ML
router.post('/', async (req, res) => {
  const { user_id = 1, amount, category, note, date } = req.body
  if (!amount || !category || !date) {
    return res.status(400).json({ success: false, message: 'Field amount, category, date wajib diisi' })
  }

  try {
    // 1. Ambil data user (level sebelum transaksi)
    const user = await db.get('SELECT * FROM users WHERE id = ?', [user_id])
    const level_before = user?.level || 1
    const current_xp = user?.exp || 0

    // 2. Hitung cumulative_spend bulan ini
    const month = date.slice(0, 7)
    const cumRow = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND date LIKE ?`,
      [user_id, `${month}%`]
    )
    const cumulative_spend = (cumRow?.total || 0) + amount

    // 3. Hitung jumlah kategori unik bulan ini
    const katRow = await db.get(
      `SELECT COUNT(DISTINCT category) as jumlah FROM transactions WHERE user_id = ? AND date LIKE ?`,
      [user_id, `${month}%`]
    )
    const jumlah_kategori = (katRow?.jumlah || 0) + 1

    // 4. Request ke ML API untuk prediksi XP (2 request API sesuai requirement)
    const xp_earned = await predictXP(amount, category, cumulative_spend, jumlah_kategori)

    // 5. Simpan transaksi ke database
    const txResult = await db.run(
      `INSERT INTO transactions (user_id, amount, category, note, date, exp_earned, cumulative_spend) VALUES (?,?,?,?,?,?,?)`,
      [user_id, amount, category, note || category, date, xp_earned, cumulative_spend]
    )

    // 6. Update XP user
    const new_xp = current_xp + xp_earned
    const newLevel = await hitungLevel(new_xp)
    await db.run(
      'UPDATE users SET exp = ?, level = ? WHERE id = ?',
      [new_xp, newLevel.level, user_id]
    )

    // 7. Simpan ke xp_history
    await db.run(
      `INSERT INTO xp_history (user_id, transaction_id, amount, category, cumulative_spend, jumlah_kategori, xp_earned, level_before, level_after, reason) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [user_id, txResult.lastInsertRowid, amount, category, cumulative_spend, jumlah_kategori, xp_earned, level_before, newLevel.level, `+${xp_earned} XP dari transaksi ${category}`]
    )

    // 8. Update leaderboard
    const existing = await db.get(
      'SELECT id FROM leaderboard WHERE user_id = ? AND month = ?',
      [user_id, month]
    )
    if (existing) {
      await db.run(
        'UPDATE leaderboard SET exp = exp + ?, level = ? WHERE user_id = ? AND month = ?',
        [xp_earned, newLevel.level, user_id, month]
      )
    }

    // 9. Response lengkap ke frontend
    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        transaction_id: txResult.lastInsertRowid,
        amount,
        category,
        cumulative_spend,
        jumlah_kategori,
        xp_earned,
        level_before,
        level_after: newLevel.level,
        level_title: newLevel.title,
        level_badge: newLevel.badge,
        total_xp: new_xp,
        level_up: newLevel.level > level_before
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// DELETE /api/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM transactions WHERE id = ?', [req.params.id])
    if (result.changes === 0) return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' })
    res.json({ success: true, message: 'Transaksi dihapus' })
  } catch (err) {
    re
