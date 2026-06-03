// ── API CONFIG ──
// Saat development: Node.js jalan di port 3000
// Saat production: ganti dengan URL server yang sebenarnya
const API_URL = 'http://localhost:3000/api'

// ── STATE ──
let totalBudget = 2000000
let usedBudget = 0
let txData = []
let questData = []
let rankData = []
let currentUser = { id: 1, name: 'Budi', level: 1, exp: 0, budget: 2000000 }

// ── API HELPERS ──
async function apiGet(endpoint) {
  try {
    const res = await fetch(API_URL + endpoint)
    return await res.json()
  } catch (err) {
    console.warn('API GET error:', err)
    return null
  }
}

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await res.json()
  } catch (err) {
    console.warn('API POST error:', err)
    return null
  }
}

async function apiPatch(endpoint, data) {
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return await res.json()
  } catch (err) {
    console.warn('API PATCH error:', err)
    return null
  }
}

// ── ICON & WARNA PER KATEGORI ──
const CATEGORY_ICON = {
  'Makan & Minum': { icon: 'ti-bowl-chopsticks', bg: '#FEF3C7' },
  'Transportasi':  { icon: 'ti-car',              bg: '#EFF6FF' },
  'Hiburan':       { icon: 'ti-device-tv',         bg: '#FEE2E2' },
  'Belanja':       { icon: 'ti-shopping-bag',      bg: '#F3E8FF' },
  'Pendidikan':    { icon: 'ti-book',              bg: '#CCFBF1' },
  'Kesehatan':     { icon: 'ti-heart',             bg: '#FCE7F3' },
  'Lainnya':       { icon: 'ti-dots',              bg: '#F1F5F9' },
}

function getCatStyle(category) {
  return CATEGORY_ICON[category] || { icon: 'ti-receipt', bg: '#EEF2FF' }
}

// ── NAVIGATION ──
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(screenId).classList.add('active')
  if (screenId === 'screen-app') initApp()
}

function showPage(page, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById('page-' + page).classList.add('active')
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'))
  if (navEl) navEl.classList.add('active')
  closeSidebar()
}

function setMobileNav(page) {
  document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'))
  const el = document.getElementById('mnav-' + page)
  if (el) el.classList.add('active')
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open')
  document.getElementById('sidebar-overlay').classList.toggle('open')
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open')
  document.getElementById('sidebar-overlay').classList.remove('open')
}

// ── MODALS ──
function openModal(id) {
  document.getElementById(id).classList.add('open')
  if (id === 'modal-transaksi') {
    const today = new Date().toISOString().split('T')[0]
    document.getElementById('tx-tanggal').value = today
  }
}
function closeModal(id) { document.getElementById(id).classList.remove('open') }

document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open')
  })
})

// ── FORMAT HELPERS ──
function formatRupiah(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'jt'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'rb'
  return n.toString()
}

function formatBudget(el) {
  let v = el.value.replace(/\D/g, '')
  el.value = v ? parseInt(v).toLocaleString('id-ID') : ''
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

// ── SETUP (halaman welcome) ──
function startAdventure() {
  const raw = document.getElementById('budget-val').value.replace(/\./g, '').replace(/,/g, '')
  totalBudget = parseInt(raw) || 2000000
  currentUser.budget = totalBudget
  goTo('screen-app')
  showToast('success', '🎉 Petualangan dimulai!', `Selamat datang di Finesse!`)
}

// ── INIT APP (load semua data dari backend) ──
async function initApp() {
  await Promise.all([
    loadUser(),
    loadTransaksi(),
    loadQuests(),
    loadLeaderboard()
  ])
  renderAll()
  cekTokenStatus()
}

async function loadUser() {
  const res = await apiGet('/users/1')
  if (res && res.success) {
    currentUser = res.data
    totalBudget = currentUser.budget || 2000000

    // Update tampilan profil
    const nama = currentUser.name || 'Budi'
    const el = document.getElementById('profil-nama')
    if (el) el.textContent = nama
    const av = document.getElementById('profil-avatar')
    if (av) av.textContent = nama.charAt(0).toUpperCase()
    const bgt = document.getElementById('profil-budget')
    if (bgt) bgt.textContent = 'Rp ' + totalBudget.toLocaleString('id-ID')
    const sn = document.getElementById('sidebar-name')
    if (sn) sn.textContent = nama

    // Update EXP display
    const expEl = document.getElementById('profil-exp')
    if (expEl) expEl.textContent = `${(currentUser.exp || 0).toLocaleString('id-ID')} EXP · Level ${currentUser.level || 1}`
  }
}

async function loadTransaksi() {
  const res = await apiGet('/transactions?user_id=1')
  if (res && res.success) {
    txData = res.data || []
    // Hitung usedBudget dari transaksi bulan ini
    const thisMonth = new Date().toISOString().slice(0, 7)
    usedBudget = txData
      .filter(t => t.date && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  }
}

async function loadQuests() {
  const res = await apiGet('/quests?user_id=1')
  if (res && res.success) {
    questData = res.data || []
  }
}

async function loadLeaderboard() {
  const month = new Date().toISOString().slice(0, 7)
  const res = await apiGet(`/users/leaderboard/monthly?month=${month}`)
  if (res && res.success) {
    rankData = (res.data || []).map(r => ({
      ...r,
      me: r.user_id === (currentUser.id || 1),
      name: r.display_name || r.name
    }))
  }
}

// ── RENDER ──
function renderAll() {
  renderTxList()
  renderMiniQuest()
  renderMiniRank()
  renderQuestFull()
  renderRankFull()
  updateBudgetDisplay()
}

function updateBudgetDisplay() {
  const sisa = totalBudget - usedBudget
  const pct = Math.round((sisa / totalBudget) * 100)
  const sisaEl = document.getElementById('sisa-budget')
  if (sisaEl) sisaEl.textContent = 'Rp ' + formatRupiah(Math.max(0, sisa))
  const bar = document.getElementById('budget-progress')
  if (bar) {
    bar.style.width = Math.max(0, pct) + '%'
    bar.style.background = pct < 20 ? 'var(--red)' : pct < 40 ? 'var(--amber)' : 'var(--teal)'
  }
  const sub = document.getElementById('budget-sub')
  if (sub) sub.textContent = 'Rp ' + formatRupiah(usedBudget) + ' terpakai dari Rp ' + formatRupiah(totalBudget)
}

function renderTxList() {
  const el = document.getElementById('tx-list')
  if (!el) return
  if (txData.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--gray-400);padding:24px;font-size:13px;">Belum ada transaksi. Yuk catat pengeluaran pertamamu!</div>'
    return
  }
  el.innerHTML = txData.slice(0, 10).map(t => {
    const cat = getCatStyle(t.category)
    return `
    <div class="tx-item">
      <div class="tx-icon" style="background:${cat.bg};"><i class="ti ${cat.icon}"></i></div>
      <div class="tx-info">
        <div class="tx-name">${t.note || t.category}</div>
        <div class="tx-cat">${t.category}</div>
      </div>
      <div style="text-align:right;">
        <div class="tx-amount">-Rp ${(t.amount || 0).toLocaleString('id-ID')}</div>
        <div class="tx-date">${formatTanggal(t.date)}</div>
      </div>
    </div>`
  }).join('')
}

function renderMiniQuest() {
  const el = document.getElementById('mini-quest-list')
  if (!el) return
  const active = questData.filter(q => q.status === 'active').slice(0, 2)
  if (active.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--gray-400);padding:8px;">Tidak ada misi aktif.</div>'
    return
  }
  el.innerHTML = active.map(q => `
    <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:3px solid var(--teal);">
      <div style="font-size:13px;font-weight:500;margin-bottom:4px;">${q.title}</div>
      <div class="progress-bar" style="margin:4px 0;"><div class="progress-fill" style="width:${Math.round((q.progress/q.total)*100)}%;"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400);">
        <span>${q.progress}/${q.total}</span><span style="color:var(--brand);font-weight:500;">+${q.exp_reward} EXP</span>
      </div>
    </div>
  `).join('')
}

function renderMiniRank() {
  const el = document.getElementById('mini-rank-list')
  if (!el) return
  if (rankData.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--gray-400);padding:8px;">Data leaderboard belum tersedia.</div>'
    return
  }
  el.innerHTML = rankData.slice(0, 5).map((r, i) => `
    <div class="rank-item ${r.me ? 'me' : ''}" onclick="openPlayerProfile(${i})">
      <div class="rank-num ${i < 3 ? 'top' : ''}">${i+1}</div>
      <div class="avatar avatar-sm" style="${r.me ? 'background:var(--brand);' : 'background:var(--gray-200);color:var(--gray-600);'}">${(r.name||'?').charAt(0)}</div>
      <div class="rank-name" style="${r.me ? 'color:var(--brand);font-weight:600;' : ''}">${r.me ? 'Kamu' : r.name}</div>
      <div class="rank-exp">${(r.exp||0).toLocaleString('id-ID')}</div>
    </div>
  `).join('')
}

function renderQuestFull() {
  const el = document.getElementById('quest-list-full')
  if (!el) return
  if (questData.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:40px;margin-bottom:12px;">🎯</div>
        <div style="font-weight:600;margin-bottom:6px;color:var(--gray-700);">Belum ada misi</div>
        <div style="font-size:13px;color:var(--gray-400);">Tekan "Minta Misi Baru" di atas untuk generate misi dari AI!</div>
      </div>`
    return
  }

  el.innerHTML = questData.map(q => {
    const diff = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium
    const isClaimed = q.status === 'claimed'
    const isHangus = q.status === 'hangus'
    const isActive = q.status === 'active'

    let statusBadge = ''
    if (isClaimed) statusBadge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:#D1FAE5;color:#065F46;">✅ Selesai</span>`
    else if (isHangus) statusBadge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:#FEE2E2;color:#991B1B;">💀 Hangus</span>`
    else statusBadge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:${diff.bg};color:${diff.color};">${diff.icon} ${diff.label}</span>`

    const borderColor = isClaimed ? 'var(--teal)' : isHangus ? '#EF4444' : 'var(--brand)'
    const opacity = isHangus ? '0.6' : '1'

    return `
    <div class="quest-item" style="opacity:${opacity};border-left:3px solid ${borderColor};" onclick="openQuestDetail(${q.id})">
      <div class="quest-header">
        <div class="quest-title">${q.title}</div>
        <div class="quest-reward" style="${isClaimed?'color:var(--teal)':isHangus?'color:#EF4444':''}">+${q.exp_reward} EXP</div>
      </div>
      <div style="margin:6px 0;">
        ${statusBadge}
        <span style="margin-left:6px;padding:2px 8px;border-radius:10px;font-size:10px;background:var(--gray-100);color:var(--gray-500);">${QUEST_TYPE_LABEL[q.quest_type]||'📋 Misi'}</span>
      </div>
      <div class="quest-desc" style="margin-top:8px;">${q.reason || q.description || ''}</div>
      ${isActive ? `
        <button class="btn btn-primary" style="width:100%;margin-top:12px;font-size:13px;" onclick="event.stopPropagation();selesaikanMisi(${q.id})">
          ✅ Selesaikan Misi
        </button>` : ''}
    </div>`
  }).join('')
}

function renderRankFull() {
  const el = document.getElementById('rank-list-full')
  if (!el) return
  if (rankData.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--gray-400);padding:24px;font-size:13px;">Data leaderboard belum tersedia.</div>'
    return
  }
  el.innerHTML = `
    <div class="rank-item" style="font-weight:600;font-size:11px;color:var(--gray-400);padding:6px 14px;cursor:default;">
      <div class="rank-num">#</div>
      <div style="width:28px;"></div>
      <div style="flex:1;">Pemain</div>
      <div>EXP bulan ini</div>
    </div>
  ` + rankData.map((r, i) => `
    <div class="rank-item ${r.me ? 'me' : ''}" onclick="openPlayerProfile(${i})">
      <div class="rank-num ${i < 3 ? 'top' : ''}">${i < 3 ? ['🥇','🥈','🥉'][i] : i+1}</div>
      <div class="avatar avatar-sm" style="${r.me ? 'background:var(--brand);' : 'background:var(--gray-200);color:var(--gray-600);'}">${(r.name||'?').charAt(0)}</div>
      <div class="rank-name" style="${r.me ? 'color:var(--brand);font-weight:600;' : ''}">${r.me ? '⭐ Kamu ('+r.name+')' : r.name}</div>
      <div class="rank-exp">${(r.exp||0).toLocaleString('id-ID')}</div>
    </div>
  `).join('')
}

// ── TRANSAKSI ──
async function simpanTransaksi() {
  const nom = parseInt(document.getElementById('tx-nominal').value)
  const kat = document.getElementById('tx-kategori').value
  const cat = document.getElementById('tx-catatan').value || kat
  const tanggal = document.getElementById('tx-tanggal').value

  if (!nom || nom <= 0) {
    showToast('warn', '⚠️ Nominal tidak valid', 'Masukkan nominal yang benar.')
    return
  }

  closeModal('modal-transaksi')
  document.getElementById('tx-nominal').value = ''
  document.getElementById('tx-catatan').value = ''

  // Kirim ke backend
  const result = await apiPost('/transactions', {
    user_id: currentUser.id || 1,
    amount: nom,
    category: kat,
    note: cat,
    date: tanggal
  })

  if (result && result.success) {
    const d = result.data
    usedBudget += nom

    // Reload data terbaru dari DB
    await loadTransaksi()
    await loadUser()
    await loadLeaderboard()
    renderAll()

    const sisa = totalBudget - usedBudget
    if (sisa < 0) {
      showToast('warn', '⚠️ Over budget!', `Kamu melebihi budget sebesar Rp ${Math.abs(sisa).toLocaleString('id-ID')}`)
    } else {
      showExpPopup(d.xp_earned, d.level_up, d.level_title, d.level_badge)
    }
  } else {
    showToast('warn', '⚠️ Gagal menyimpan', result?.message || 'Periksa koneksi ke server.')
  }
}

// ── QUEST SYSTEM ──

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Mudah',  color: '#10B981', bg: '#D1FAE5', icon: '🟢' },
  medium: { label: 'Sedang', color: '#F59E0B', bg: '#FEF3C7', icon: '🟡' },
  hard:   { label: 'Susah',  color: '#EF4444', bg: '#FEE2E2', icon: '🔴' },
}

const QUEST_TYPE_LABEL = {
  hemat_total:     '💰 Hemat Total',
  batas_harian:    '📅 Batas Harian',
  batas_frekuensi: '🔢 Batas Frekuensi',
  batas_kategori:  '🏷️ Batas Kategori',
}

async function cekTokenStatus() {
  const res = await apiGet('/quests/token-status?user_id=1')
  const btn = document.getElementById('btn-generate-misi')
  const badge = document.getElementById('token-badge')
  const statusText = document.getElementById('token-status-text')

  if (res && res.success) {
    const { token_tersedia, pesan } = res.data
    if (statusText) statusText.textContent = pesan
    if (badge) {
      badge.style.display = 'block'
      badge.textContent = token_tersedia ? '1 Token ✅' : 'Habis ❌'
      badge.style.background = token_tersedia ? '#D1FAE5' : '#FEE2E2'
      badge.style.color = token_tersedia ? '#065F46' : '#991B1B'
    }
    if (btn) {
      btn.disabled = !token_tersedia
      btn.style.opacity = token_tersedia ? '1' : '0.5'
      btn.style.cursor = token_tersedia ? 'pointer' : 'not-allowed'
      btn.innerHTML = token_tersedia
        ? '<i class="ti ti-wand"></i> Minta Misi Baru (1 Token)'
        : '<i class="ti ti-clock"></i> Token habis · Reset jam 00:00'
    }
  }
}

async function generateMisi() {
  const btn = document.getElementById('btn-generate-misi')
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader"></i> Generating...' }

  const result = await apiPost('/quests/generate', { user_id: 1 })

  if (result && result.success) {
    await loadQuests()
    renderQuestFull()
    renderMiniQuest()
    await cekTokenStatus()
    showToast('success', '🎯 Misi baru siap!', result.message)
  } else {
    showToast('warn', '⚠️ ' + (result?.message || 'Gagal generate misi'), '')
    await cekTokenStatus()
  }
}

function openQuestDetail(id) {
  const q = questData.find(x => x.id === id)
  if (!q) return

  const diff = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG.medium
  const isClaimed = q.status === 'claimed'
  const isHangus = q.status === 'hangus'
  const isActive = q.status === 'active'

  document.getElementById('md-title').textContent = q.title
  document.getElementById('md-alasan').textContent = '🤖 ' + (q.reason || 'Misi ini dibuat berdasarkan pola transaksimu.')
  document.getElementById('md-desc').textContent = q.description || ''
  document.getElementById('md-reward').textContent = `+${q.exp_reward} EXP`

  // Badge difficulty
  const diffBadge = document.getElementById('md-difficulty-badge')
  diffBadge.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${diff.bg};color:${diff.color};">
      ${diff.icon} ${diff.label}
    </span>
    <span style="margin-left:8px;display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:20px;font-size:12px;background:var(--gray-100);color:var(--gray-600);">
      ${QUEST_TYPE_LABEL[q.quest_type] || '📋 Misi'}
    </span>`

  // Target info
  const targetInfo = document.getElementById('md-target-info')
  let targetText = ''
  if (q.quest_type === 'hemat_total' || q.quest_type === 'batas_harian' || q.quest_type === 'batas_kategori') {
    targetText = `🎯 Target: maks Rp ${(q.target_amount||0).toLocaleString('id-ID')}`
    if (q.target_category) targetText += ` untuk kategori <strong>${q.target_category}</strong>`
  } else if (q.quest_type === 'batas_frekuensi') {
    targetText = `🎯 Target: maks <strong>${q.target_count}x</strong> transaksi <strong>${q.target_category}</strong> — jika lebih, misi <span style="color:#EF4444;font-weight:600;">hangus!</span>`
  }
  targetInfo.innerHTML = targetText

  // Deadline
  const deadlineEl = document.getElementById('md-deadline')
  deadlineEl.textContent = q.deadline ? `⏰ Deadline: ${formatTanggal(q.deadline)}` : ''

  // Progress & status
  const progBar = document.getElementById('md-progress')
  const progLabel = document.getElementById('md-prog-label')
  if (isClaimed) {
    progBar.style.width = '100%'
    progBar.style.background = 'var(--teal)'
    progLabel.textContent = '✅ Selesai & diklaim'
  } else if (isHangus) {
    progBar.style.width = '100%'
    progBar.style.background = '#EF4444'
    progLabel.textContent = '💀 Misi hangus'
  } else {
    progBar.style.width = '0%'
    progBar.style.background = ''
    progLabel.textContent = 'Belum diverifikasi'
  }

  // Tombol aksi
  const actionEl = document.getElementById('md-action')
  if (isActive) {
    actionEl.innerHTML = `<button class="btn btn-primary" style="width:100%;" onclick="selesaikanMisi(${q.id})">✅ Selesaikan Misi</button>`
  } else if (isClaimed) {
    actionEl.innerHTML = `<div style="text-align:center;font-size:13px;color:var(--gray-400);padding:8px;">🎉 Misi sudah diklaim!</div>`
  } else if (isHangus) {
    actionEl.innerHTML = `<div style="text-align:center;font-size:13px;color:#EF4444;padding:8px;">💀 Misi ini sudah hangus dan tidak bisa diklaim.</div>`
  } else {
    actionEl.innerHTML = ''
  }

  openModal('modal-misi-detail')
}

async function selesaikanMisi(id) {
  const btn = document.querySelector('#md-action .btn')
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Memverifikasi...' }

  const result = await apiPost(`/quests/${id}/selesaikan`, { user_id: 1 })

  if (result && result.success) {
    // Update quest lokal
    const q = questData.find(x => x.id === id)
    if (q) q.status = 'claimed'

    await loadUser()
    renderQuestFull()
    renderMiniQuest()

    // Tampilkan modal hasil
    document.getElementById('hasil-icon').textContent = result.data?.level_up ? '🏆' : '⭐'
    document.getElementById('hasil-title').textContent = result.data?.level_up
      ? `${result.data.level_badge} Level Up ke ${result.data.level_title}!`
      : '🎉 Misi Berhasil!'
    document.getElementById('hasil-detail').textContent = result.detail || ''
    document.getElementById('hasil-exp').textContent = `+${result.data?.exp_earned || 0} EXP`
    closeModal('modal-misi-detail')
    openModal('modal-hasil-verifikasi')

  } else if (result?.hangus) {
    const q = questData.find(x => x.id === id)
    if (q) q.status = 'hangus'
    renderQuestFull()
    document.getElementById('hasil-icon').textContent = '💀'
    document.getElementById('hasil-title').textContent = 'Misi Hangus!'
    document.getElementById('hasil-detail').textContent = result.detail || 'Kamu melewati batas yang ditentukan.'
    document.getElementById('hasil-exp').textContent = '+0 EXP'
    closeModal('modal-misi-detail')
    openModal('modal-hasil-verifikasi')

  } else {
    // Belum memenuhi kondisi
    document.getElementById('hasil-icon').textContent = '⚠️'
    document.getElementById('hasil-title').textContent = 'Misi Belum Selesai'
    document.getElementById('hasil-detail').textContent = result?.detail || result?.message || 'Kondisi misi belum terpenuhi.'
    document.getElementById('hasil-exp').textContent = 'Coba lagi nanti!'
    closeModal('modal-misi-detail')
    openModal('modal-hasil-verifikasi')
  }
}

// ── LEADERBOARD PROFILE ──
function openPlayerProfile(idx) {
  const r = rankData[idx]
  if (!r) return
  document.getElementById('pp-avatar').textContent = (r.name||'?').charAt(0)
  document.getElementById('pp-name').textContent = r.name
  document.getElementById('pp-level').textContent = `Level ${r.level || 1} · ${(r.exp||0).toLocaleString('id-ID')} EXP`
  const bg = document.getElementById('pp-badges')
  bg.innerHTML = '<span style="font-size:12px;color:var(--gray-400);">Data lencana tersedia segera</span>'
  openModal('modal-profil-pemain')
}

// ── TOAST ──
function showToast(type, title, desc) {
  const t = document.getElementById('toast')
  document.getElementById('toast-title').textContent = title
  document.getElementById('toast-desc').textContent = desc
  document.getElementById('toast-icon').textContent = type === 'warn' ? '⚠️' : '✅'
  t.className = 'toast' + (type === 'warn' ? ' warn' : '')
  setTimeout(() => t.classList.add('show'), 10)
  setTimeout(() => t.classList.remove('show'), 3500)
}

// ── EXP POPUP ──
function showExpPopup(exp, levelUp = false, levelTitle = '', levelBadge = '') {
  const valEl = document.getElementById('exp-popup-val')
  if (valEl) valEl.textContent = `+${exp} EXP`
  if (levelUp && levelTitle) {
    showToast('success', `${levelBadge} Level Up!`, `Selamat! Kamu naik ke ${levelTitle}!`)
  }
  document.getElementById('exp-popup').classList.add('show')
}
function closeExpPopup() {
  document.getElementById('exp-popup').classList.remove('show')
}

// ── EDIT PROFIL ──
function openEditProfil() {
  document.getElementById('edit-nama').value = document.getElementById('profil-nama').textContent
  const budgetText = document.getElementById('profil-budget').textContent
  document.getElementById('edit-budget').value = budgetText.replace(/\D/g, '')
  openModal('modal-edit-profil')
}

async function simpanProfil() {
  const nama = document.getElementById('edit-nama').value.trim()
  const budget = parseInt(document.getElementById('edit-budget').value.replace(/\D/g, ''))

  if (!nama) { showToast('warn', '⚠️ Nama tidak boleh kosong', ''); return }
  if (!budget || budget < 100000) { showToast('warn', '⚠️ Budget minimal Rp 100.000', ''); return }

  // Update tampilan dulu
  document.getElementById('profil-nama').textContent = nama
  document.getElementById('profil-avatar').textContent = nama.charAt(0).toUpperCase()
  document.getElementById('profil-budget').textContent = 'Rp ' + budget.toLocaleString('id-ID')
  document.getElementById('sidebar-name').textContent = nama
  totalBudget = budget
  currentUser.budget = budget
  currentUser.name = nama
  updateBudgetDisplay()

  // Simpan ke backend
  const result = await apiPatch('/users/1', { name: nama, budget })
  closeModal('modal-edit-profil')
  showToast('success', '✅ Profil diperbarui!', result?.success ? 'Data tersimpan ke database.' : 'Data tersimpan lokal.')
}

// ── INIT ──
window.addEventListener('load', () => {
  const today = new Date().toISOString().split('T')[0]
  const txDate = document.getElementById('tx-tanggal')
  if (txDate) txDate.value = today
})
