import { Router } from 'express'

const router = Router()

// ── Kategori encoding ──
const CATEGORY_MAP = {
  'Makan & Minum': 0,
  'Transportasi': 1,
  'Hiburan': 2,
  'Belanja': 3,
  'Pendidikan': 4,
  'Kesehatan': 5,
  'Lainnya': 6
}

// ── XP rules berdasarkan kategori ──
const CATEGORY_XP_MULTIPLIER = {
  'Pendidikan': 1.5,
  'Kesehatan': 1.3,
  'Transportasi': 1.2,
  'Makan & Minum': 1.0,
  'Belanja': 0.9,
  'Lainnya': 0.8,
  'Hiburan': 0.7
}

// ── Deep Learning Model (Preprocessing + Inference) ──
function preprocessInput(amount, category, cumulative_spend, jumlah_kategori) {
  // Normalisasi amount (0-1 scale, max asumsi Rp 5.000.000)
  const amount_norm = Math.min(amount / 5000000, 1.0)

  // Normalisasi cumulative_spend (max asumsi Rp 10.000.000)
  const cum_norm = Math.min(cumulative_spend / 10000000, 1.0)

  // Normalisasi jumlah kategori (max 7 kategori)
  const kat_norm = Math.min(jumlah_kategori / 7, 1.0)

  // Category encoding
  const cat_encoded = (CATEGORY_MAP[category] ?? 6) / 6

  return { amount_norm, cum_norm, kat_norm, cat_encoded }
}

function deepLearningInference(features) {
  const { amount_norm, cum_norm, kat_norm, cat_encoded } = features

  // Layer 1: weighted sum (simulating neural network weights)
  const w1 = [0.4, -0.3, 0.2, 0.15]
  const layer1 = (
    w1[0] * (1 - amount_norm) +   // lebih hemat = lebih banyak XP
    w1[1] * cum_norm +             // makin banyak cumulative = penalti
    w1[2] * kat_norm +             // variasi kategori = bonus
    w1[3] * (1 - cat_encoded)      // kategori produktif = lebih banyak XP
  )

  // ReLU activation
  const relu = Math.max(0, layer1)

  // Layer 2: output scaling ke range XP (5-30)
  const raw_xp = 5 + (relu * 50)
  const xp = Math.round(Math.min(30, Math.max(5, raw_xp)))

  return xp
}

// POST /api/ml/predict-xp
// Input: { amount, category, cumulative_spend, jumlah_kategori }
// Output: { xp, reason, features }
router.post('/predict-xp', (req, res) => {
  const { amount, category, cumulative_spend, jumlah_kategori } = req.body

  if (!amount || !category) {
    return res.status(400).json({
      success: false,
      message: 'Field amount dan category wajib diisi'
    })
  }

  try {
    // 1. Preprocessing
    const features = preprocessInput(
      amount,
      category,
      cumulative_spend || 0,
      jumlah_kategori || 1
    )

    // 2. Deep Learning Inference
    let xp = deepLearningInference(features)

    // 3. Apply category multiplier
    const multiplier = CATEGORY_XP_MULTIPLIER[category] || 1.0
    xp = Math.round(Math.min(30, Math.max(5, xp * multiplier)))

    // 4. Generate reason
    const reasons = []
    if (features.amount_norm < 0.01) reasons.push('pengeluaran sangat hemat')
    else if (features.amount_norm < 0.05) reasons.push('pengeluaran hemat')
    if (multiplier > 1) reasons.push(`kategori ${category} mendapat bonus XP`)
    if (features.kat_norm > 0.5) reasons.push('variasi kategori yang baik')
    if (features.cum_norm > 0.7) reasons.push('perhatikan total pengeluaran bulan ini')
    const reason = reasons.length > 0
      ? reasons.join(', ')
      : `standar XP untuk kategori ${category}`

    res.json({
      success: true,
      xp,
      reason,
      features: {
        amount_normalized: features.amount_norm.toFixed(4),
        cumulative_normalized: features.cum_norm.toFixed(4),
        category_encoded: features.cat_encoded.toFixed(4),
        kategori_diversity: features.kat_norm.toFixed(4),
        category_multiplier: multiplier
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/ml/model-info — info tentang model
router.get('/model-info', (req, res) => {
  res.json({
    success: true,
    data: {
      model_name: 'Finesse XP Predictor',
      version: '1.0.0',
      type: 'Deep Learning (2-Layer Neural Network)',
      framework: 'Custom JavaScript Implementation',
      input_features: [
        'amount (normalized)',
        'cumulative_spend (normalized)',
        'jumlah_kategori (normalized)',
        'category (encoded)'
      ],
      output: 'xp_earned (integer, range 5-30)',
      preprocessing: 'Min-Max Normalization',
      activation: 'ReLU',
      description: 'Model prediksi XP berdasarkan pola transaksi pengguna'
    }
  })
})

export default router
