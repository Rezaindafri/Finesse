import { Router } from 'express'
import Groq from 'groq-sdk'
import db from '../database.js'

const router = Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
router.post('/analyze', async (req, res) => {
  const { user_id = 1 } = req.body
  try {
    const transactions = await db.all(`
      SELECT category, SUM(amount) as total, COUNT(*) as count
      FROM transactions
      WHERE user_id = ? AND date >= date('now', '-30 days')
      GROUP BY category ORDER BY total DESC
    `, [user_id])

    const user = await db.get('SELECT name, level, exp, budget FROM users WHERE id = ?', [user_id])
    const totalSpent = transactions.reduce((sum, t) => sum + t.total, 0)
    const budget = user?.budget || 2000000
    const sisaBudget = budget - totalSpent

    const prompt = `
Kamu adalah asisten keuangan pintar untuk aplikasi Finesse, sebuah app gamifikasi budgeting.

Data pengguna:
- Nama: ${user?.name || 'Pengguna'}
- Level: ${user?.level || 1}
- Budget bulanan: Rp ${budget.toLocaleString('id-ID')}
- Total pengeluaran 30 hari: Rp ${totalSpent.toLocaleString('id-ID')}
- Sisa budget: Rp ${sisaBudget.toLocaleString('id-ID')}

Rincian pengeluaran per kategori:
${transactions.map(t => `- ${t.category}: Rp ${t.total.toLocaleString('id-ID')} (${t.count}x transaksi)`).join('\n')}

Berikan analisis singkat dalam Bahasa Indonesia maksimal 150 kata, nada ramah seperti game coach.
    `.trim()

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      max_tokens: 300,
      temperature: 0.7
    })

    const analysis = completion.choices[0]?.message?.content || 'Tidak ada analisis tersedia.'
    res.json({
      success: true,
      data: {
        analysis,
        summary: {
          total_spent: totalSpent,
          budget,
          sisa_budget: sisaBudget,
          persen_terpakai: Math.round((totalSpent / budget) * 100),
          top_category: transactions[0]?.category || '-'
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI sedang tidak tersedia: ' + err.message })
  }
})

router.post('/quest-suggest', async (req, res) => {
  const { user_id = 1 } = req.body
  try {
    const transactions = await db.all(`
      SELECT category, SUM(amount) as total
      FROM transactions WHERE user_id = ?
      GROUP BY category ORDER BY total DESC LIMIT 3
    `, [user_id])

    const prompt = `
Kamu adalah game designer untuk app keuangan gamifikasi bernama Finesse.
Pengguna paling banyak menghabiskan uang di:
${transactions.map((t, i) => `${i + 1}. ${t.category}: Rp ${t.total.toLocaleString('id-ID')}`).join('\n')}

Buat 3 quest keuangan yang relevan. Jawab HANYA dalam format JSON array (tanpa backtick):
[{"title":"...","description":"...","reason":"...","total":7,"exp_reward":200}]
    `.trim()

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      max_tokens: 400,
      temperature: 0.8
    })

    const raw = completion.choices[0]?.message?.content || '[]'
    let quests = []
    try { quests = JSON.parse(raw) } catch { return res.json({ success: true, data: [], raw_response: raw }) }
    res.json({ success: true, data: quests })
  } catch (err) {
    res.status(500).json({ success: false, message: 'AI sedang tidak tersedia: ' + err.message })
  }
})

export default router
