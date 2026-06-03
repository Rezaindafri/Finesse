// ── DATA ──
const txData = [
  { nama:'Makan siang warteg', kat:'Makan & Minum', amt:15000, date:'19 Mei', icon:'ti-bowl-chopsticks', iconBg:'#FEF3C7' },
  { nama:'Grab ke kampus', kat:'Transportasi', amt:18000, date:'19 Mei', icon:'ti-car', iconBg:'#EFF6FF' },
  { nama:'Netflix', kat:'Hiburan', amt:54000, date:'18 Mei', icon:'ti-device-tv', iconBg:'#FEE2E2' },
  { nama:'Kopi kekinian', kat:'Makan & Minum', amt:32000, date:'18 Mei', icon:'ti-coffee', iconBg:'#FEF3C7' },
  { nama:'Buku kuliah', kat:'Pendidikan', amt:85000, date:'17 Mei', icon:'ti-book', iconBg:'#CCFBF1' },
];

const questData = [
  { id:1, title:'Jangan jajan kopi selama 3 hari', kat:'Hiburan', alasan:'Kamu menghabiskan 34% budget untuk Hiburan bulan ini — jauh di atas rata-rata Liga Silver. Misi ini dirancang AI untuk membantumu mengurangi pengeluaran impulsif.', desc:'Hindari membeli kopi kekinian selama 3 hari berturut-turut. Setiap hari tanpa kopi akan dicatat secara otomatis.', progress:1, total:3, exp:500, status:'active' },
  { id:2, title:'Tabung sisa budget Rp 50.000', kat:'Tabungan', alasan:'K-Means mendeteksi bahwa kamu jarang menyisihkan dana. Misi ini melatih kebiasaan menabung rutin.', desc:'Pastikan sisa budget bulan ini minimal Rp 50.000 sebelum akhir bulan. Pantau di dashboard.', progress:1, total:1, exp:300, status:'completed' },
  { id:3, title:'Kurangi transportasi online 5x', kat:'Transportasi', alasan:'Pengeluaran transportasi online kamu 20% di atas rata-rata. Coba jalan kaki atau naik angkot!', desc:'Batasi penggunaan ojek/taksi online menjadi maksimal 5 kali dalam 7 hari ke depan.', progress:3, total:5, exp:400, status:'active' },
  { id:4, title:'Masak sendiri 3x minggu ini', kat:'Makan & Minum', alasan:'Makan di luar menghabiskan 45% dari total pengeluaranmu. Masak sendiri bisa hemat hingga 60%.', desc:'Catat setidaknya 3 transaksi dengan kategori Masak Sendiri minggu ini.', progress:0, total:3, exp:600, status:'claimed' },
];

const rankData = [
  { name:'Andi Kurnia', exp:4200, level:9, me:false, badges:['Gold Saver','Silver'] },
  { name:'Sari Dewi', exp:3850, level:8, me:false, badges:['Silver','Iron'] },
  { name:'Rizky Pratama', exp:3200, level:8, me:false, badges:['Silver'] },
  { name:'Dina Fitriani', exp:2900, level:7, me:false, badges:['Iron','Iron'] },
  { name:'Arif Hidayat', exp:2450, level:7, me:false, badges:['Silver'] },
  { name:'Lena Puspita', exp:2300, level:6, me:false, badges:[] },
  { name:'Yoga Prasetyo', exp:2100, level:6, me:false, badges:['Iron'] },
  { name:'Nina Rahayu', exp:1950, level:6, me:false, badges:[] },
  { name:'Bayu Setiawan', exp:1800, level:5, me:false, badges:['Iron'] },
  { name:'Fira Aulia', exp:1600, level:5, me:false, badges:[] },
  { name:'Hendra Wijaya', exp:1400, level:5, me:false, badges:[] },
  { name:'Budi Santoso', exp:1240, level:7, me:true, badges:['Gold Saver','Silver','Silver'] },
  { name:'Tika Permata', exp:1100, level:4, me:false, badges:['Iron'] },
  { name:'Surya Dharma', exp:980, level:4, me:false, badges:[] },
  { name:'Wati Sumarna', exp:820, level:3, me:false, badges:['Iron'] },
];

let totalBudget = 2000000;
let usedBudget = 1500000;

// ── NAVIGATION ──
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'screen-app') renderAll();
}

function showPage(page, navEl) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  else {
    document.querySelectorAll('.nav-item').forEach(n => {
      if (n.textContent.trim().toLowerCase().startsWith(page.charAt(0).toUpperCase() + page.slice(1).split(' ')[0].toLowerCase()) || n.textContent.trim().toLowerCase() === page) n.classList.add('active');
    });
  }
  closeSidebar();
}

function setMobileNav(page) {
  document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('mnav-' + page);
  if (el) el.classList.add('active');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── MODALS ──
function openModal(id) {
  document.getElementById(id).classList.add('open');
  if (id === 'modal-transaksi') {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tx-tanggal').value = today;
  }
}
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('open');
  });
});

// ── SETUP ──
function formatBudget(el) {
  let v = el.value.replace(/\D/g, '');
  el.value = v ? parseInt(v).toLocaleString('id-ID') : '';
}

function startAdventure() {
  const raw = document.getElementById('budget-val').value.replace(/\./g, '').replace(/,/g, '');
  totalBudget = parseInt(raw) || 2000000;
  usedBudget = Math.round(totalBudget * 0.75);
  goTo('screen-app');
  showToast('success', '🎉 Petualangan dimulai!', 'Selamat datang di Finesse, Budi!');
}

// ── RENDER ──
function renderAll() {
  renderTxList();
  renderMiniQuest();
  renderMiniRank();
  renderQuestFull();
  renderRankFull();
  updateBudgetDisplay();
}

function updateBudgetDisplay() {
  const sisa = totalBudget - usedBudget;
  const pct = Math.round((sisa / totalBudget) * 100);
  document.getElementById('sisa-budget').textContent = 'Rp ' + formatRupiah(sisa);
  document.getElementById('budget-progress').style.width = pct + '%';
  document.getElementById('budget-sub').textContent = 'Rp ' + formatRupiah(usedBudget) + ' terpakai dari Rp ' + formatRupiah(totalBudget);
  const bar = document.getElementById('budget-progress');
  bar.style.background = pct < 20 ? 'var(--red)' : pct < 40 ? 'var(--amber)' : 'var(--teal)';
}

function formatRupiah(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.0','') + 'jt';
  if (n >= 1000) return (n/1000).toFixed(0) + 'rb';
  return n.toString();
}

function renderTxList() {
  const el = document.getElementById('tx-list');
  el.innerHTML = txData.map(t => `
    <div class="tx-item">
      <div class="tx-icon" style="background:${t.iconBg};"><i class="ti ${t.icon}"></i></div>
      <div class="tx-info">
        <div class="tx-name">${t.nama}</div>
        <div class="tx-cat">${t.kat}</div>
      </div>
      <div style="text-align:right;">
        <div class="tx-amount">-Rp ${t.amt.toLocaleString('id-ID')}</div>
        <div class="tx-date">${t.date}</div>
      </div>
    </div>
  `).join('');
}

function renderMiniQuest() {
  const el = document.getElementById('mini-quest-list');
  const active = questData.filter(q => q.status === 'active').slice(0, 2);
  el.innerHTML = active.map(q => `
    <div style="padding:12px;background:var(--gray-50);border-radius:var(--radius-sm);border-left:3px solid var(--teal);">
      <div style="font-size:13px;font-weight:500;margin-bottom:4px;">${q.title}</div>
      <div class="progress-bar" style="margin:4px 0;"><div class="progress-fill" style="width:${Math.round(q.progress/q.total*100)}%;"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400);">
        <span>${q.progress}/${q.total}</span><span style="color:var(--brand);font-weight:500;">+${q.exp} EXP</span>
      </div>
    </div>
  `).join('');
}

function renderMiniRank() {
  const el = document.getElementById('mini-rank-list');
  el.innerHTML = rankData.slice(0, 5).map((r, i) => `
    <div class="rank-item ${r.me ? 'me' : ''}" onclick="openPlayerProfile(${i})">
      <div class="rank-num ${i < 3 ? 'top' : ''}">${i+1}</div>
      <div class="avatar avatar-sm" style="${r.me ? 'background:var(--brand);' : 'background:var(--gray-200);color:var(--gray-600);'}">${r.name.charAt(0)}</div>
      <div class="rank-name" style="${r.me ? 'color:var(--brand);font-weight:600;' : ''}">${r.me ? 'Kamu' : r.name}</div>
      <div class="rank-exp">${r.exp.toLocaleString('id-ID')}</div>
    </div>
  `).join('');
}

function renderQuestFull() {
  const el = document.getElementById('quest-list-full');
  el.innerHTML = questData.map(q => {
    const pct = Math.round(q.progress / q.total * 100);
    const isDone = q.status === 'completed';
    const isClaimed = q.status === 'claimed';
    return `
    <div class="quest-item ${isDone ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}" onclick="openQuestDetail(${q.id})">
      <div class="quest-header">
        <div class="quest-title">${q.title}</div>
        <div class="quest-reward ${isDone || isClaimed ? 'amber' : ''}">+${q.exp} EXP</div>
      </div>
      <div class="quest-desc">${q.alasan}</div>
      <div class="quest-progress-label">
        <span>${isClaimed ? '✅ Selesai & diklaim' : isDone ? '🎉 Selesai!' : `${q.progress} dari ${q.total}`}</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;${isDone||isClaimed?'background:var(--amber);':''}"></div></div>
      ${isDone ? `<button class="claim-btn" onclick="event.stopPropagation();claimReward(${q.id})">🎁 Klaim Hadiah</button>` : ''}
      ${isClaimed ? `<div style="font-size:11px;color:var(--gray-400);margin-top:8px;">Sudah diklaim</div>` : ''}
    </div>
  `}).join('');
}

function renderRankFull() {
  const el = document.getElementById('rank-list-full');
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
      <div class="avatar avatar-sm" style="${r.me ? 'background:var(--brand);' : 'background:var(--gray-200);color:var(--gray-600);'}">${r.name.charAt(0)}</div>
      <div class="rank-name" style="${r.me ? 'color:var(--brand);font-weight:600;' : ''}">${r.me ? '⭐ Kamu ('+r.name+')' : r.name}</div>
      <div class="rank-exp">${r.exp.toLocaleString('id-ID')}</div>
    </div>
  `).join('');
}

// ── TRANSAKSI ──
function simpanTransaksi() {
  const nom = parseInt(document.getElementById('tx-nominal').value);
  const kat = document.getElementById('tx-kategori').value;
  const cat = document.getElementById('tx-catatan').value || kat;
  if (!nom || nom <= 0) { showToast('warn', '⚠️ Nominal tidak valid', 'Masukkan nominal yang benar.'); return; }

  closeModal('modal-transaksi');
  document.getElementById('tx-nominal').value = '';
  document.getElementById('tx-catatan').value = '';

  usedBudget += nom;
  const sisa = totalBudget - usedBudget;
  const exp = Math.max(5, Math.min(30, Math.round(15 - (nom / totalBudget) * 10)));
  const isOver = sisa < 0;

  const tanggal = document.getElementById('tx-tanggal').value;
  txData.unshift({ nama: cat, kat, amt: nom, date: 'Baru saja', icon: 'ti-plus', iconBg: '#EEF2FF' });
  if (txData.length > 6) txData.pop();

  // Simpan ke backend Railway
  simpanTransaksiBackend(nom, kat, cat, tanggal);

  setTimeout(() => {
    if (isOver) {
      showToast('warn', '⚠️ Over budget!', `Kamu melebihi budget sebesar Rp ${Math.abs(sisa).toLocaleString('id-ID')}`);
    } else {
      showExpPopup(exp);
    }
    updateBudgetDisplay();
    renderTxList();
  }, 300);
}

// ── QUEST ──
function openQuestDetail(id) {
  const q = questData.find(x => x.id === id);
  if (!q) return;
  document.getElementById('md-title').textContent = q.title;
  document.getElementById('md-alasan').textContent = '🤖 ' + q.alasan;
  document.getElementById('md-desc').textContent = q.desc;
  document.getElementById('md-progress').style.width = Math.round(q.progress/q.total*100) + '%';
  document.getElementById('md-prog-label').textContent = `Progress: ${q.progress}/${q.total}`;
  document.getElementById('md-reward').textContent = `+${q.exp} EXP`;
  openModal('modal-misi-detail');
}

function claimReward(id) {
  const q = questData.find(x => x.id === id);
  if (!q) return;
  q.status = 'claimed';
  renderQuestFull();
  renderMiniQuest();
  showExpPopup(q.exp);
}

// ── LEADERBOARD ──
function openPlayerProfile(idx) {
  const r = rankData[idx];
  document.getElementById('pp-avatar').textContent = r.name.charAt(0);
  document.getElementById('pp-name').textContent = r.name;
  document.getElementById('pp-level').textContent = `Level ${r.level} · ${r.exp.toLocaleString('id-ID')} EXP`;
  const bg = document.getElementById('pp-badges');
  bg.innerHTML = r.badges.length
    ? r.badges.map(b => `<span class="badge-item ${b.includes('Gold')?'badge-gold':b==='Silver'?'badge-silver':'badge-iron'}">${b.includes('Gold')?'🥇':b==='Silver'?'🥈':'🥉'} ${b}</span>`).join('')
    : '<span style="font-size:12px;color:var(--gray-400);">Belum ada lencana</span>';
  openModal('modal-profil-pemain');
}

// ── TOAST ──
function showToast(type, title, desc) {
  const t = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-desc').textContent = desc;
  document.getElementById('toast-icon').textContent = type === 'warn' ? '⚠️' : '✅';
  t.className = 'toast' + (type === 'warn' ? ' warn' : '');
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3500);
}

// ── EXP POPUP ──
function showExpPopup(exp) {
  document.getElementById('exp-popup-val').textContent = `+${exp} EXP`;
  document.getElementById('exp-popup').classList.add('show');
}
function closeExpPopup() {
  document.getElementById('exp-popup').classList.remove('show');
}

// ── BACKEND API ──
const API_URL = 'https://finesse-production.up.railway.app/api';

async function apiPost(endpoint, data) {
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error:', err);
    return null;
  }
}

async function apiGet(endpoint) {
  try {
    const res = await fetch(API_URL + endpoint);
    return await res.json();
  } catch (err) {
    console.warn('API error:', err);
    return null;
  }
}

async function apiPatch(endpoint, data) {
  try {
    const res = await fetch(API_URL + endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (err) {
    console.warn('API error:', err);
    return null;
  }
}



// ── EDIT PROFIL ──
function openEditProfil() {
  document.getElementById('edit-nama').value = document.getElementById('profil-nama').textContent;
  const budgetText = document.getElementById('profil-budget').textContent;
  document.getElementById('edit-budget').value = budgetText.replace(/\D/g, '');
  openModal('modal-edit-profil');
}

async function simpanProfil() {
  const nama = document.getElementById('edit-nama').value.trim();
  const budget = parseInt(document.getElementById('edit-budget').value.replace(/\D/g, ''));

  if (!nama) { showToast('warn', '⚠️ Nama tidak boleh kosong', ''); return; }
  if (!budget || budget < 100000) { showToast('warn', '⚠️ Budget minimal Rp 100.000', ''); return; }

  // Update tampilan
  document.getElementById('profil-nama').textContent = nama;
  document.getElementById('profil-avatar').textContent = nama.charAt(0).toUpperCase();
  document.getElementById('profil-budget').textContent = 'Rp ' + budget.toLocaleString('id-ID');
  document.getElementById('sidebar-name').textContent = nama;
  totalBudget = budget;
  updateBudgetDisplay();

  // Simpan ke backend
  const result = await apiPatch('/users/1', { name: nama, budget });
  closeModal('modal-edit-profil');

  if (result && result.success) {
    showToast('success', '✅ Profil diperbarui!', 'Data tersimpan ke database.');
  } else {
    showToast('success', '✅ Profil diperbarui!', 'Data tersimpan lokal.');
  }
}

// ── SIMPAN TRANSAKSI KE BACKEND ──
async function simpanTransaksiBackend(nom, kat, cat, tanggal) {
  const result = await apiPost('/transactions', {
    user_id: 1,
    amount: nom,
    category: kat,
    note: cat,
    date: tanggal
  });
  if (result && result.success) {
    console.log('✅ Transaksi tersimpan ke DB, EXP:', result.data.exp_earned);
  }
}

// ── INIT ──
window.addEventListener('load', () => {
  const today = new Date().toISOString().split('T')[0];
  const txDate = document.getElementById('tx-tanggal');
  if (txDate) txDate.value = today;
  renderAll();
});