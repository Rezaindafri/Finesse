import { Router } from 'express'
import db from '../database.js'

const router = Router()

// ── HELPER: Verifikasi misi berdasarkan tipe ──
async function verifikasiMisi(quest, userId) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  // Gunakan start_date dari quest, fallback ke 30 hari ke belakang
  const startDate = quest.start_date || (() => {
    const d = new Date(now)
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })()

  // Deadline: gunakan quest.deadline, fallback ke hari ini
  const deadline = quest.deadline || today

  switch (quest.quest_type) {

    // Tipe: hemat total — total pengeluaran di bawah target dalam periode
    case 'hemat_total': {
      const row = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND date >= ? AND date <= ?`,
        [userId, startDate, deadline]
      )
      const totalSpend = row?.total || 0
      const target = quest.target_amount || 0
      // Lolos kalau: ada transaksi (user aktif) DAN total di bawah target
      // Atau kalau total = 0 (tidak ada transaksi sama sekali = hemat sempurna)
      const lolos = totalSpend <= target
      return {
        lolos,
        detail: `Total pengeluaran: Rp ${totalSpend.toLocaleString('id-ID')} dari target hemat Rp ${target.toLocaleString('id-ID')}`,
        actual: totalSpend
      }
    }

    // Tipe: batas harian — pengeluaran hari ini tidak melebihi target
    case 'batas_harian': {
      // Cek pengeluaran di tanggal deadline (bukan hanya "hari ini")
      // sehingga misi bisa diklaim kapanpun selama kondisi terpenuhi
      const checkDate = deadline <= today ? deadline : today
      const row = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND date = ?`,
        [userId, checkDate]
      )
      const totalHari = row?.total || 0
      const target = quest.target_amount || 0
      const lolos = totalHari <= target
      return {
        lolos,
        detail: `Pengeluaran pada ${checkDate}: Rp ${totalHari.toLocaleString('id-ID')} dari batas Rp ${target.toLocaleString('id-ID')}`,
        actual: totalHari
      }
    }

    // Tipe: batas frekuensi — jumlah transaksi kategori tertentu tidak melebihi target
    case 'batas_frekuensi': {
      const row = await db.get(
        `SELECT COUNT(*) as jumlah FROM transactions
         WHERE user_id = ? AND category = ? AND date >= ? AND date <= ?`,
        [userId, quest.target_category, startDate, deadline]
      )
      const jumlah = row?.jumlah || 0
      const target = quest.target_count || 3
      const hangus = jumlah > target
      const lolos = !hangus
      return {
        lolos,
        hangus,
        detail: `Transaksi ${quest.target_category}: ${jumlah}x dari batas ${target}x`,
        actual: jumlah
      }
    }

    // Tipe: batas kategori — total pengeluaran kategori tertentu tidak melebihi target
    case 'batas_kategori': {
      const row = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND category = ? AND date >= ? AND date <= ?`,
        [userId, quest.target_category, startDate, deadline]
      )
      const totalKat = row?.total || 0
      const target = quest.target_amount || 0
      const lolos = totalKat <= target
      return {
        lolos,
        detail: `Total ${quest.target_category}: Rp ${totalKat.toLocaleString('id-ID')} dari batas Rp ${target.toLocaleString('id-ID')}`,
        actual: totalKat
      }
    }

    default:
      return { lolos: false, detail: 'Tipe misi tidak dikenal', actual: 0 }
  }
}

// ── MOCK FastAPI: generate misi (diganti real FastAPI nanti) ──
async function generateMisiDariFastAPI(userId, transactions, user) {
  const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000'
  try {
    const res = await fetch(`${FASTAPI_URL}/generate_quests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, transactions, user })
    })
    if (!res.ok) throw new Error('FastAPI tidak merespons')
    const data = await res.json()
    return data.quests
  } catch (err) {
    // ── MOCK RESPONSE (aktif kalau FastAPI belum tersedia) ──
    console.warn('[generateMisi] FastAPI tidak aktif, pakai mock:', err.message)

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const weekEnd = new Date(now)
    weekEnd.setDate(now.getDate() + 7)
    const deadline7 = weekEnd.toISOString().slice(0, 10)

    // Analisis sederhana dari transaksi
    const topCategory = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})
    const borosKategori = Object.entries(topCategory).sort((a,b) => b[1]-a[1])[0]?.[0] || 'Hiburan'
    const budget = user?.budget || 2000000
    const targetHarian = Math.round(budget / 30 / 1000) * 1000

    return [
      {
        title: `Hemat minggu ini di bawah Rp ${(targetHarian * 5).toLocaleString('id-ID')}`,
        description: `Jaga total pengeluaranmu dalam 7 hari ke depan agar tidak melebihi Rp ${(targetHarian * 5).toLocaleString('id-ID')}. Ini akan membentuk kebiasaan hemat yang konsisten.`,
        reason: `AI mendeteksi rata-rata pengeluaran harianmu cukup tinggi. Misi ini dirancang untuk melatih disiplin mingguan.`,
        quest_type: 'hemat_total',
        target_amount: targetHarian * 5,
        target_category: null,
        target_count: null,
        deadline: deadline7,
        difficulty: 'medium',
        exp_reward: 300
      },
      {
        title: `Jangan habiskan lebih dari Rp ${targetHarian.toLocaleString('id-ID')} hari ini`,
        description: `Total pengeluaran hari ini harus di bawah Rp ${targetHarian.toLocaleString('id-ID')}. Kamu perlu bijak memilih prioritas pengeluaran.`,
        reason: `Berdasarkan pola transaksi harianmu, AI menyarankan batas harian yang realistis untuk budgetmu.`,
        quest_type: 'batas_harian',
        target_amount: targetHarian,
        target_category: null,
        target_count: null,
        deadline: today,
        difficulty: 'easy',
        exp_reward: 150
      },
      {
        title: `Batasi ${borosKategori} maksimal 3x minggu ini`,
        description: `Transaksi kategori ${borosKategori} tidak boleh lebih dari 3 kali dalam 7 hari ke depan. Jika melebihi, misi otomatis hangus!`,
        reason: `AI mendeteksi ${borosKategori} adalah kategori dengan pengeluaran terbesar bulanmu. Kurangi frekuensinya!`,
        quest_type: 'batas_frekuensi',
        target_amount: null,
        target_category: borosKategori,
        target_count: 3,
        deadline: deadline7,
        difficulty: 'hard',
        exp_reward: 500
      }
    ]
  }
}

// ── GET /api/quests ──
router.get('/', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const quests = await db.all(
      `SELECT * FROM quests WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    )
    res.json({ success: true, data: quests })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/quests/token-status — cek sisa token hari ini ──
router.get('/token-status', async (req, res) => {
  const userId = req.query.user_id || 1
  try {
    const user = await db.get('SELECT quest_token_used, quest_token_date FROM users WHERE id = ?', [userId])
    const today = new Date().toISOString().slice(0, 10)
    const sudahPakai = user?.quest_token_date === today && user?.quest_token_used === 1
    res.json({
      success: true,
      data: {
        token_tersedia: !sudahPakai,
        reset_jam: '00:00 tengah malam',
        pesan: sudahPakai
          ? 'Token harian sudah digunakan. Kembali lagi besok!'
          : 'Kamu punya 1 token untuk generate misi hari ini!'
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/quests/generate — generate misi baru (1x per hari) ──
router.post('/generate', async (req, res) => {
  const { user_id = 1 } = req.body
  const today = new Date().toISOString().slice(0, 10)
  try {
    // Cek token harian
    const user = await db.get('SELECT * FROM users WHERE id = ?', [user_id])
    if (user?.quest_token_date === today && user?.quest_token_used === 1) {
      return res.status(429).json({
        success: false,
        message: 'Token harian sudah digunakan! Kembali lagi besok pukul 00:00.',
        data: { token_tersedia: false }
      })
    }

    // Ambil data transaksi untuk dikirim ke FastAPI
    const transactions = await db.all(
      `SELECT category, amount, date FROM transactions
       WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`,
      [user_id]
    )

    // Minta misi dari FastAPI (atau mock kalau belum aktif)
    const misiList = await generateMisiDariFastAPI(user_id, transactions, user)

    // Hapus misi aktif lama (bersihkan slate)
    await db.run(
      `DELETE FROM quests WHERE user_id = ? AND status = 'active'`,
      [user_id]
    )

    // Simpan misi baru ke DB
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const startDate = weekStart.toISOString().slice(0, 10)

    const savedQuests = []
    for (const misi of misiList) {
      const result = await db.run(
        `INSERT INTO quests
          (user_id, title, description, reason, progress, total, exp_reward, status,
           quest_type, target_amount, target_category, target_count, deadline, difficulty, start_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          user_id,
          misi.title,
          misi.description || '',
          misi.reason || '',
          0,
          1,
          misi.exp_reward || 100,
          'active',
          misi.quest_type || 'hemat_total',
          misi.target_amount || null,
          misi.target_category || null,
          misi.target_count || null,
          misi.deadline || today,
          misi.difficulty || 'medium',
          startDate
        ]
      )
      savedQuests.push({ id: result.lastInsertRowid, ...misi })
    }

    // Tandai token sudah dipakai
    await db.run(
      'UPDATE users SET quest_token_used = 1, quest_token_date = ? WHERE id = ?',
      [today, user_id]
    )

    res.status(201).json({
      success: true,
      message: `${savedQuests.length} misi baru berhasil digenerate!`,
      data: { quests: savedQuests, token_tersedia: false }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── POST /api/quests/:id/selesaikan — verifikasi + klaim misi ──
router.post('/:id/selesaikan', async (req, res) => {
  // user_id bisa dari body atau query param sebagai fallback
  const user_id = parseInt(req.body?.user_id || req.query?.user_id || 1)
  const questId = parseInt(req.params.id)

  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [questId])
    if (!quest) return res.status(404).json({ success: false, message: 'Misi tidak ditemukan' })
    if (quest.status === 'claimed') return res.status(400).json({ success: false, message: 'Misi sudah diklaim sebelumnya!' })
    if (quest.status === 'hangus') return res.status(400).json({ success: false, message: 'Misi ini sudah hangus.' })

    // Verifikasi kondisi misi
    const hasil = await verifikasiMisi(quest, user_id)

    // Kalau hangus (khusus batas_frekuensi yang kelewatan)
    if (hasil.hangus) {
      await db.run(`UPDATE quests SET status = 'hangus' WHERE id = ?`, [questId])
      return res.status(400).json({
        success: false,
        hangus: true,
        message: '💀 Misi hangus! Kamu melewati batas yang ditentukan.',
        detail: hasil.detail
      })
    }

    // Kalau belum lolos
    if (!hasil.lolos) {
      return res.status(400).json({
        success: false,
        message: '⚠️ Misi belum selesai! Kondisi belum terpenuhi.',
        detail: hasil.detail
      })
    }

    // ── Lolos → klaim EXP ──

    // 1. Tandai quest sebagai claimed
    await db.run(`UPDATE quests SET status = 'claimed', progress = 1 WHERE id = ?`, [questId])

    // 2. Ambil data user TERBARU dari DB
    const user = await db.get('SELECT id, exp, level FROM users WHERE id = ?', [user_id])
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' })

    const oldExp = user.exp || 0
    const oldLevel = user.level || 1
    const newExp = oldExp + quest.exp_reward

    // 3. Cari level baru berdasarkan total EXP
    const newLevel = await db.get(
      'SELECT level, title, badge FROM levels WHERE min_xp <= ? AND max_xp >= ?',
      [newExp, newExp]
    )
    const finalLevel = newLevel?.level || oldLevel

    // 4. Update EXP dan level user ke DB
    await db.run(
      'UPDATE users SET exp = ?, level = ? WHERE id = ?',
      [newExp, finalLevel, user_id]
    )

    // 5. Update leaderboard bulan ini
    const month = new Date().toISOString().slice(0, 7)
    const lb = await db.get('SELECT id FROM leaderboard WHERE user_id = ? AND month = ?', [user_id, month])
    if (lb) {
      await db.run(
        'UPDATE leaderboard SET exp = exp + ?, level = ? WHERE user_id = ? AND month = ?',
        [quest.exp_reward, finalLevel, user_id, month]
      )
    }

    // 6. Verifikasi hasil update (untuk debugging)
    const updatedUser = await db.get('SELECT exp, level FROM users WHERE id = ?', [user_id])
    console.log(`[Quest Claim] User ${user_id}: ${oldExp} → ${updatedUser.exp} EXP (+${quest.exp_reward})`)

    res.json({
      success: true,
      message: `🎉 Misi selesai! +${quest.exp_reward} EXP`,
      detail: hasil.detail,
      data: {
        exp_earned: quest.exp_reward,
        exp_sebelum: oldExp,
        total_exp: updatedUser.exp,
        level_before: oldLevel,
        level_after: finalLevel,
        level_up: finalLevel > oldLevel,
        level_title: newLevel?.title,
        level_badge: newLevel?.badge
      }
    })
  } catch (err) {
    console.error('[Quest Claim Error]', err)
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── GET /api/quests/:id ──
router.get('/:id', async (req, res) => {
  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [req.params.id])
    if (!quest) return res.status(404).json({ success: false, message: 'Quest tidak ditemukan' })
    res.json({ success: true, data: quest })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ── DELETE /api/quests/:id ──
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
