import { Router } from 'express'
import db from '../database.js'

const router = Router()

// ── Konfigurasi Liga (4 liga sesuai K-Means cluster) ──
// Cluster 0 = Gold, 1 = Silver, 2 = Bronze, 3 = Iron
const LIGA_CONFIG = [
  { id: 'gold',   label: 'Liga Gold',   icon: '🥇', color: '#F59E0B' },
  { id: 'silver', label: 'Liga Silver', icon: '🥈', color: '#94A3B8' },
  { id: 'bronze', label: 'Liga Bronze', icon: '🥉', color: '#B45309' },
  { id: 'iron',   label: 'Liga Iron',   icon: '⚙️', color: '#6B7280' },
]

function getLigaById(ligaId) {
  return LIGA_CONFIG.find(l => l.id === ligaId) || LIGA_CONFIG[3]
}

// Fallback kalau K-Means belum dipanggil — pakai kolom liga dari DB user
function getLigaByUser(user) {
  return getLigaById(user?.liga || 'iron')
}

// ── GET /api/users/leaderboard/liga — Leaderboard per liga (3 besar tiap liga) ──
router.get('/leaderboard/liga', async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7)
  const currentUserId = parseInt(req.query.user_id || 1)

  try {
    // Ambil semua data leaderboard bulan ini
    const allRanks = await db.all(`
      SELECT l.user_id, l.name, l.exp, l.level, l.liga, l.month,
             u.name as display_name
      FROM leaderboard l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.month = ?
      ORDER BY l.exp DESC
    `, [month])

    // Ambil data user saat ini
    const currentUser = await db.get('SELECT id, name, exp, level, liga FROM users WHERE id = ?', [currentUserId])

    // Tentukan liga user
    const userLiga = getLigaByUser(currentUser)

    // Kelompokkan per liga pakai kolom liga langsung
    const result = LIGA_CONFIG.map(liga => {
      const pemainLiga = allRanks.filter(r => r.liga === liga.id)

      const top10 = pemainLiga
        .sort((a, b) => b.exp - a.exp)
        .slice(0, 10)
        .map((r, idx) => ({
          rank: idx + 1,
          user_id: r.user_id,
          name: r.display_name || r.name,
          exp: r.exp,
          level: r.level,
          is_me: r.user_id === currentUserId
        }))

      const userDiLigaIni = liga.id === userLiga.id

      const userRankDiLiga = pemainLiga
        .sort((a, b) => b.exp - a.exp)
        .findIndex(r => r.user_id === currentUserId)

      return {
        liga_id: liga.id,
        liga_label: liga.label,
        liga_icon: liga.icon,
        liga_color: liga.color,
        is_user_liga: userDiLigaIni,
        user_rank_di_liga: userRankDiLiga >= 0 ? userRankDiLiga + 1 : null,
        top10
      }
    })

    res.json({
      success: true,
      data: {
        liga_user: userLiga,
        leaderboard: result,
        user: currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          exp: currentUser.exp,
          level: currentUser.level,
          liga: userLiga
        } : null
      },
      month
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/users/leaderboard/monthly — semua pemain bulan ini (legacy) ──
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

// ── GET /api/users/:id ──
router.get('/:id', async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, name, email, level, exp, budget, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })
    res.json({ success: true, data: user })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── PATCH /api/users/:id ──
router.patch('/:id', async (req, res) => {
  const { name, budget } = req.body
  try {
    await db.run(
      'UPDATE users SET name = COALESCE(?, name), budget = COALESCE(?, budget) WHERE id = ?',
      [name || null, budget || null, req.params.id]
    )
    res.json({ success: true, message: 'Profil diperbarui' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

export default router
