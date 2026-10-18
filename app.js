/* KAS OMK Santo Carolus Houben — Paroki Nanga Mahap */
const KEY = 'kas_omk_carolus_v1';
const SUPABASE_URL = 'https://rmsjuzdhftejnyawskcd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtc2p1emRoZnRlam55YXdza2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNzA4NjIsImV4cCI6MjEwNzg0Njg2Mn0.JiyceI6aUnAlGyXtx_Jgfvb3f8gWIdUHCcovZJlAazg';
const CLOUD_SESSION_KEY = 'kas_omk_cloud_session_v1';
let cloudSession = null;
let cloudReady = false;
let cloudTimer = null;
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const PALETTE = ['#1565C0','#00A651','#E53935','#F59E0B','#7C3AED','#0891B2','#DB2777','#65A30D','#111111','#FFD400'];

const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const pad = n => String(n).padStart(2,'0');
const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const todayISO = () => isoDate(new Date());
const monthKeyOf = (dateStr) => (dateStr||'').slice(0,7);
const currentMonthKey = () => { const d=new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; };
const monthLabel = (key) => { if(!key) return '-'; const [y,m]=key.split('-').map(Number); return `${MONTHS[m-1]} ${y}`; };
const fmtRp = (n) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
const fmtNum = (n) => new Intl.NumberFormat('id-ID').format(Number(n)||0);
const fmtDate = (s) => { if(!s) return '-'; const d=new Date(s+'T00:00:00'); return d.toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',year:'numeric'}); };
const fmtDateShort = (s) => { if(!s) return '-'; const d=new Date(s+'T00:00:00'); return d.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}); };
const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials = (name='') => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'OMK';

function dateMonthsAgo(offset, day){
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth()-offset, day);
  return isoDate(d);
}

function defaultCategories(){
  const c = (name,type,icon)=>({id:uid()+name, name, type, icon});
  return [
    c('Iuran Anggota','masuk','💚'), c('Kolekte','masuk','⛪'), c('Donasi Umat','masuk','🎁'), c('Usaha Dana','masuk','🛍️'), c('Bantuan Paroki','masuk','🏛️'), c('Lain-lain','masuk','📌'),
    c('Kegiatan OMK','keluar','🎤'), c('Konsumsi','keluar','🍽️'), c('Transportasi','keluar','🚌'), c('Perlengkapan','keluar','🎸'), c('Sosial & Bakti','keluar','❤️'), c('Dekorasi & Liturgi','keluar','🌸'), c('Administrasi','keluar','🗂️'), c('Lain-lain','keluar','📌')
  ];
}
function seedState(){
  const categories = defaultCategories();
  const cat = (name,type) => categories.find(x=>x.name===name && x.type===type)?.name || name;
  const memberNames = [
    ['Agustinus Aldo Saputra','Ketua'],['Maria Yuniarti','Wakil Ketua'],['Clara Devina','Sekretaris'],['Yosef Fernando','Bendahara'],
    ['Theresia Nova','Koordinator Bidang'],['Antonius Dedi Prasetya','Koordinator Bidang'],['Bernadeta Sari Wulandari','Anggota'],['Fransiskus Rio Pratama','Anggota'],
    ['Katarina Mega','Anggota'],['Paulus Dimas Aryo Nugroho','Anggota'],['Veronika Lestari Putri','Anggota'],['Ignatius Bagus Wicaksono','Anggota']
  ];
  const members = memberNames.map(([nama,jabatan],i)=>({id:'m'+(i+1), nama, jabatan, status:'Aktif', hp:'', asal:'Nanga Mahap'}));
  const mid = (nama) => members.find(m=>m.nama===nama)?.id || '';
  let seq = 0;
  const t = (offset,day,jenis,kategori,keterangan,jumlah,metode='Tunai',anggota='',pic='',catatan='') => ({id:'seed'+(++seq), tanggal:dateMonthsAgo(offset,day), jenis, kategori:cat(kategori,jenis), keterangan, jumlah, metode, memberId:anggota, pic, catatan, createdAt:seq});
  const transactions = [
    t(5,6,'masuk','Iuran Anggota','Iuran anggota bulan berjalan',360000,'Tunai','','Bendahara','12 anggota x Rp30.000 (contoh data)'),
    t(5,13,'masuk','Kolekte','Kolekte misa OMK',275000,'Tunai','','Sekretaris'),
    t(5,20,'keluar','Konsumsi','Konsumsi rapat kerja OMK',150000,'Tunai','','Bendahara'),
    t(4,4,'masuk','Donasi Umat','Donasi umat untuk kegiatan OMK',500000,'Transfer Bank','','Ketua'),
    t(4,11,'keluar','Transportasi','Transportasi kunjungan lingkungan',200000,'Tunai','','Koordinator'),
    t(4,18,'keluar','Kegiatan OMK','Perlengkapan rekoleksi OMK',325000,'Transfer Bank','','Ketua'),
    t(4,25,'masuk','Usaha Dana','Usaha dana penjualan makanan',450000,'QRIS','','Bendahara'),
    t(3,3,'masuk','Iuran Anggota','Iuran anggota & kas bulanan',420000,'Tunai',mid('Bernadeta Sari Wulandari'),'Bendahara'),
    t(3,10,'keluar','Sosial & Bakti','Bakti sosial & kunjungan teman sakit',250000,'Tunai','','Koordinator Sosial'),
    t(3,17,'keluar','Dekorasi & Liturgi','Dekorasi & bunga altar misa OMK',180000,'Tunai','','Seksi Liturgi'),
    t(2,7,'masuk','Bantuan Paroki','Bantuan paroki untuk pembinaan OMK',750000,'Transfer Bank','','Ketua'),
    t(2,14,'keluar','Perlengkapan','Pembelian kabel, mic & perlengkapan musik',475000,'Transfer Bank','','Seksi Musik'),
    t(2,21,'masuk','Kolekte','Kolekte misa & persembahan OMK',310000,'Tunai','','Sekretaris'),
    t(1,5,'masuk','Iuran Anggota','Iuran bulanan anggota OMK',480000,'Tunai',mid('Bernadeta Sari Wulandari'),'Bendahara','Contoh: hubungkan ke anggota untuk leaderboard iuran'),
    t(1,12,'keluar','Konsumsi','Konsumsi latihan & rapat panitia',165000,'Tunai','','Bendahara'),
    t(1,19,'keluar','Kegiatan OMK','Retret / rekoleksi OMK (DP tempat & konsumsi)',600000,'Transfer Bank','','Ketua'),
    t(1,26,'masuk','Usaha Dana','Usaha dana OMK',525000,'QRIS','','Bendahara'),
    t(0,3,'masuk','Iuran Anggota','Iuran anggota awal bulan',450000,'Tunai',mid('Bernadeta Sari Wulandari'),'Bendahara'),
    t(0,6,'masuk','Donasi Umat','Donasi umat peduli OMK',300000,'Transfer Bank',mid('Maria Yuniarti'),'Ketua'),
    t(0,9,'keluar','Konsumsi','Konsumsi rapat pleno OMK',125000,'Tunai','','Bendahara','Rapat bulanan OMK'),
    t(0,11,'keluar','Transportasi','Bensin & transportasi tugas OMK',100000,'Tunai','','Koordinator'),
  ];
  const budgets = [
    {id:uid()+'b1', month:currentMonthKey(), category:'Konsumsi', amount:300000},
    {id:uid()+'b2', month:currentMonthKey(), category:'Transportasi', amount:250000},
    {id:uid()+'b3', month:currentMonthKey(), category:'Kegiatan OMK', amount:750000},
  ];
  return {
    transactions, members, categories, budgets,
    settings:{ namaOmk:'OMK SANTO CAROLUS HOUBEN', paroki:'PAROKI Nanga Mahap • KAB. Sekadau, KALIMANTAN BARAT', tempat:'Nanga Mahap', ketua:'Agustinus Aldo Saputra', bendahara:'Yosef Fernando', sekretaris:'Clara Devina', pembina:'', saldoAwal:500000, targetKas:5000000, dark:false }
  };
}
function emptyState(){
  return { transactions:[], members:[], categories:defaultCategories(), budgets:[], settings:{ namaOmk:'OMK SANTO CAROLUS HOUBEN', paroki:'PAROKI Nanga Mahap • KAB. Sekadau, KALIMANTAN BARAT', tempat:'Nanga Mahap', ketua:'', bendahara:'', sekretaris:'', pembina:'', saldoAwal:0, targetKas:5000000, dark:false } };
}
function loadState(){
  try{ const raw=localStorage.getItem(KEY); if(raw){ const parsed=JSON.parse(raw); if(parsed && Array.isArray(parsed.transactions)) return parsed; } }catch(e){}
  return seedState();
}
let state = loadState();
let ui = { view:'dashboard', month: currentMonthKey(), page:1, charts:{}, confirmCb:null, logoDataUrl:null };

function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){ console.warn('Penyimpanan lokal tidak tersedia',e); }
  if(cloudSession && cloudReady){ clearTimeout(cloudTimer); cloudTimer=setTimeout(()=>syncCloudState(),700); }
}
function sortedTrx(list=[...state.transactions]){ return list.sort((a,b)=> a.tanggal===b.tanggal ? (a.createdAt||0)-(b.createdAt||0) : a.tanggal.localeCompare(b.tanggal)); }
function sumJenis(list, jenis){ return list.filter(t=>t.jenis===jenis).reduce((s,t)=>s+(Number(t.jumlah)||0),0); }
function trxInMonth(key){ return state.transactions.filter(t=>monthKeyOf(t.tanggal)===key); }
function saldoAkhir(){ return (Number(state.settings.saldoAwal)||0) + sumJenis(state.transactions,'masuk') - sumJenis(state.transactions,'keluar'); }
function saldoSebelumBulan(key){ const list=state.transactions.filter(t=>monthKeyOf(t.tanggal)<key); return (Number(state.settings.saldoAwal)||0)+sumJenis(list,'masuk')-sumJenis(list,'keluar'); }
function runningBalanceMap(){ const map={}; let bal=Number(state.settings.saldoAwal)||0; sortedTrx().forEach(t=>{ bal += t.jenis==='masuk'? Number(t.jumlah)||0 : -(Number(t.jumlah)||0); map[t.id]=bal; }); return map; }
function memberById(id){ return state.members.find(m=>m.id===id); }
function categoryIcon(name,type){ return state.categories.find(c=>c.name===name && c.type===type)?.icon || '🏷️'; }

function toast(msg){
  const el=$('#toast'); el.textContent=msg; el.hidden=false;
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.hidden=true, 3200);
}
function openModal(id){ $('#'+id).hidden=false; document.body.style.overflow='hidden'; }
function closeModal(id){ $('#'+id).hidden=true; document.body.style.overflow=''; }
function confirmAction(title,text,cb){ $('#confirmTitle').textContent=title; $('#confirmText').textContent=text; ui.confirmCb=cb; openModal('confirmModal'); }

/* ===== Navigation ===== */
const PAGE_INFO = {
  dashboard:['Dashboard','Ringkasan keuangan OMK bulan ini'],
  transaksi:['Transaksi Kas','Semua pemasukan & pengeluaran OMK'],
  laporan:['Laporan Bulanan','Download laporan PDF resmi per bulan'],
  anggota:['Anggota OMK','Pengurus, anggota & kontribusi iuran'],
  anggaran:['Kategori & Anggaran','Atur kategori dan batas pengeluaran'],
  pengaturan:['Pengaturan','Identitas, pengurus, backup & data']
};
function switchView(view){
  ui.view=view; ui.page=1;
  $$('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+view));
  $$('.nav-item,.bnav-item').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
  const [title,sub]=PAGE_INFO[view]||PAGE_INFO.dashboard;
  $('#pageTitle').textContent=title; $('#pageSubtitle').textContent=sub;
  if(view==='pengaturan') fillSettings();
  renderAll(false);
  window.scrollTo({top:0,behavior:'smooth'});
}

/* ===== Renderers ===== */
function renderAll(saveFirst=true){
  if(saveFirst) save();
  document.body.classList.toggle('dark', !!state.settings.dark);
  $('#btnDarkTop').textContent = state.settings.dark ? '☀️' : '🌙';
  $('#btnDarkSidebar').textContent = state.settings.dark ? '☀️ Mode Terang' : '🌙 Mode Gelap';
  if($('#globalMonth').value !== ui.month) $('#globalMonth').value = ui.month;
  renderHeaderSaldo(); renderDashboard(); renderFilterOptions(); renderTransactions(); renderReportControls(); renderReport(); renderYearRecap(); renderMembers(); renderCategoriesBudgets();
}
function renderHeaderSaldo(){
  const akhir=saldoAkhir(), masuk=sumJenis(state.transactions,'masuk'), keluar=sumJenis(state.transactions,'keluar');
  $('#sidebarSaldo').textContent=fmtRp(akhir);
  $('#sidebarSaldoInfo').textContent=`Saldo awal ${fmtRp(state.settings.saldoAwal)} • ${state.transactions.length} transaksi`;
  $('#heroSaldo').textContent=fmtRp(akhir);
  $('#heroSaldoDetail').textContent=`Saldo awal ${fmtRp(state.settings.saldoAwal)} • Masuk ${fmtRp(masuk)} • Keluar ${fmtRp(keluar)}`;
  const target=Number(state.settings.targetKas)||0; const pct=target>0? Math.min(100, Math.max(0, akhir/target*100)):0;
  $('#targetBar').style.width=pct+'%'; $('#targetLabel').textContent=`${pct.toFixed(0)}% dari ${fmtRp(target)}`;
}
function renderDashboard(){
  const list=trxInMonth(ui.month), masuk=sumJenis(list,'masuk'), keluar=sumJenis(list,'keluar');
  $('#labelMasukBulan').textContent=`(${monthLabel(ui.month)})`; $('#labelKeluarBulan').textContent=`(${monthLabel(ui.month)})`;
  $('#statMasuk').textContent=fmtRp(masuk); $('#statKeluar').textContent=fmtRp(keluar);
  $('#statMasukCount').textContent=`${list.filter(t=>t.jenis==='masuk').length} transaksi masuk`;
  $('#statKeluarCount').textContent=`${list.filter(t=>t.jenis==='keluar').length} transaksi keluar`;
  const selisih=masuk-keluar; $('#statSelisih').textContent=fmtRp(selisih);
  $('#statSelisihInfo').textContent= selisih>=0 ? 'Surplus bulan ini 👍' : 'Defisit — pengeluaran lebih besar ⚠️';
  $('#statSelisih').style.color= selisih>=0 ? 'var(--green)' : 'var(--red)';
  $('#statTotalTrx').textContent=state.transactions.length;
  const aktif=state.members.filter(m=>m.status==='Aktif').length;
  $('#statAnggotaInfo').textContent=`${aktif} anggota aktif • ${state.members.length} total anggota`;
  $('#donutPeriodLabel').textContent=monthLabel(ui.month);
  renderCharts(list); renderBudgetProgress($('#budgetProgressList'), ui.month, true); renderLeaderboard(); renderRecent();
}
function last6Months(){
  const [y,m]=ui.month.split('-').map(Number); const arr=[];
  for(let i=5;i>=0;i--){ const d=new Date(y,m-1-i,1); arr.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}`); } return arr;
}
function renderCharts(monthList){
  const keys=last6Months();
  const labels=keys.map(k=>{ const [y,m]=k.split('-').map(Number); return MONTHS[m-1].slice(0,3)+' '+String(y).slice(2); });
  const masukData=keys.map(k=>sumJenis(trxInMonth(k),'masuk')); const keluarData=keys.map(k=>sumJenis(trxInMonth(k),'keluar'));
  const keluarCats={}; monthList.filter(t=>t.jenis==='keluar').forEach(t=>keluarCats[t.kategori]=(keluarCats[t.kategori]||0)+Number(t.jumlah));
  const catLabels=Object.keys(keluarCats), catData=catLabels.map(k=>keluarCats[k]);
  $('#donutLegend').innerHTML= catLabels.length ? catLabels.map((k,i)=>`<span class="legend-item"><span class="dot" style="background:${PALETTE[i%PALETTE.length]}"></span>${esc(k)} • ${fmtRp(keluarCats[k])}</span>`).join('') : '<span class="muted">Belum ada pengeluaran bulan ini.</span>';

  if(window.Chart){
    $('#chartTrend').style.display='block'; $('#chartDonut').style.display='block'; $('#chartTrendFallback').innerHTML=''; $('#chartDonutFallback').innerHTML='';
    const dark=!!state.settings.dark; Chart.defaults.color= dark?'#CBD5E1':'#475569';
    if(ui.charts.trend) ui.charts.trend.destroy();
    if(ui.charts.donut) ui.charts.donut.destroy();
    ui.charts.trend=new Chart($('#chartTrend'),{type:'bar',data:{labels,datasets:[{label:'Pemasukan',data:masukData,backgroundColor:'#00A651',borderRadius:7},{label:'Pengeluaran',data:keluarData,backgroundColor:'#E53935',borderRadius:7}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:(c)=>' '+c.dataset.label+': '+fmtRp(c.parsed.y)}}},scales:{y:{ticks:{callback:v=>'Rp '+(v>=1000000?(v/1000000)+'jt':fmtNum(v))},grid:{color:dark?'#263244':'#EEF2F7'}},x:{grid:{display:false}}}}});
    ui.charts.donut=new Chart($('#chartDonut'),{type:'doughnut',data:{labels:catLabels.length?catLabels:['Belum ada data'],datasets:[{data:catData.length?catData:[1],backgroundColor:catLabels.length?catLabels.map((_,i)=>PALETTE[i%PALETTE.length]):['#E5E7EB'],borderWidth:2}]},options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:false},tooltip:{callbacks:{label:(c)=>' '+c.label+': '+fmtRp(c.parsed)}}}}});
  } else {
    $('#chartTrend').style.display='none'; $('#chartDonut').style.display='none';
    const max=Math.max(1,...masukData,...keluarData);
    $('#chartTrendFallback').innerHTML='<div style="display:flex;gap:10px;align-items:end;height:230px;padding-top:16px">'+keys.map((k,i)=>`<div style="flex:1;text-align:center"><div style="display:flex;gap:4px;align-items:end;justify-content:center;height:170px"><div title="Masuk ${fmtRp(masukData[i])}" style="width:38%;background:#00A651;border-radius:6px 6px 0 0;height:${Math.max(3,masukData[i]/max*100)}%"></div><div title="Keluar ${fmtRp(keluarData[i])}" style="width:38%;background:#E53935;border-radius:6px 6px 0 0;height:${Math.max(3,keluarData[i]/max*100)}%"></div></div><small>${labels[i]}</small></div>`).join('')+'</div><p class="note">🟩 Pemasukan &nbsp; 🟥 Pengeluaran (grafik cadangan tanpa internet)</p>';
    const total=catData.reduce((a,b)=>a+b,0);
    $('#chartDonutFallback').innerHTML= total? catLabels.map((k,i)=>`<div style="margin:10px 0"><div style="display:flex;justify-content:space-between"><b>${esc(k)}</b><span>${fmtRp(keluarCats[k])} (${(keluarCats[k]/total*100).toFixed(0)}%)</span></div><div class="bar"><div style="width:${keluarCats[k]/total*100}%;background:${PALETTE[i%PALETTE.length]}"></div></div></div>`).join('') : '<div class="empty"><div class="empty-ic">🍩</div><p>Belum ada pengeluaran bulan ini.</p></div>';
  }
}
function budgetRowsForMonth(month){
  const list=trxInMonth(month).filter(t=>t.jenis==='keluar');
  return state.budgets.filter(b=>b.month===month).map(b=>{
    const used=list.filter(t=>t.kategori===b.category).reduce((s,t)=>s+Number(t.jumlah),0);
    const pct=b.amount>0? used/b.amount*100:0;
    return {...b, used, pct, sisa:b.amount-used};
  });
}
function renderBudgetProgress(container, month, dashboard=false){
  if(!container) return;
  const rows=budgetRowsForMonth(month);
  if(!rows.length){ container.innerHTML=`<div class="empty"><div class="empty-ic">🎯</div><h4>Belum ada anggaran bulan ini</h4><p>Atur batas pengeluaran di menu Kategori & Anggaran.</p>${dashboard?'<button class="btn btn-primary btn-sm" data-goto="anggaran">Atur Anggaran</button>':''}</div>`; bindGoto(container); return; }
  container.innerHTML=rows.map(r=>`<div class="budget-row"><div class="budget-row-head"><div><b>${esc(categoryIcon(r.category,'keluar'))} ${esc(r.category)}</b><br><span>Terpakai ${fmtRp(r.used)} dari ${fmtRp(r.amount)} • Sisa ${fmtRp(r.sisa)}</span></div><b style="color:${r.pct>100?'var(--red)':r.pct>=80?'#D97706':'var(--green)'}">${r.pct.toFixed(0)}%</b></div><div class="bar"><div class="${r.pct>100?'over':r.pct>=80?'warn':'ok'}" style="width:${Math.min(100,r.pct)}%"></div></div>${dashboard?'':`<div style="display:flex;gap:6px;margin-top:9px;justify-content:flex-end"><button class="mini-btn" data-edit-budget="${r.id}">✏️ Edit</button><button class="mini-btn" data-del-budget="${r.id}">🗑️ Hapus</button></div>`}</div>`).join('');
  bindGoto(container);
  $$('[data-edit-budget]',container).forEach(b=>b.onclick=()=>openBudgetModal(b.dataset.editBudget));
  $$('[data-del-budget]',container).forEach(b=>b.onclick=()=>confirmAction('Hapus anggaran?','Anggaran kategori ini untuk bulan terpilih akan dihapus.',()=>{ state.budgets=state.budgets.filter(x=>x.id!==b.dataset.delBudget); toast('Anggaran dihapus'); renderAll(); }));
}
function renderLeaderboard(){
  const rows=state.members.map(m=>{
    const list=state.transactions.filter(t=>t.memberId===m.id && t.jenis==='masuk' && t.kategori.toLowerCase().includes('iuran'));
    return {member:m,total:list.reduce((s,t)=>s+Number(t.jumlah),0),count:list.length};
  }).filter(r=>r.total>0).sort((a,b)=>b.total-a.total).slice(0,5);
  $('#leaderboard').innerHTML= rows.length ? rows.map((r,i)=>`<div class="leader-row"><div style="display:flex;gap:10px;align-items:center;min-width:0"><span class="rank">${i+1}</span><div><b>${esc(r.member.nama)}</b><br><span>${esc(r.member.jabatan)} • ${r.count} x iuran</span></div></div><span class="amount masuk">${fmtRp(r.total)}</span></div>`).join('')
    : '<div class="empty"><div class="empty-ic">🏆</div><h4>Belum ada data iuran per anggota</h4><p>Saat tambah transaksi Iuran Anggota, pilih nama anggota terkait agar muncul di sini.</p></div>';
}
function renderRecent(){
  const recent=[...state.transactions].sort((a,b)=> b.tanggal.localeCompare(a.tanggal) || (b.createdAt||0)-(a.createdAt||0)).slice(0,10);
  $('#recentList').innerHTML= recent.length ? recent.map(t=>trxRowHtml(t)).join('') : '<div class="empty"><div class="empty-ic">🧾</div><h4>Belum ada transaksi</h4><p>Tambahkan transaksi pertama kas OMK.</p></div>';
  bindTrxActions($('#recentList'));
}
function trxRowHtml(t){
  const m=memberById(t.memberId);
  return `<div class="recent-row"><div class="trx-ic ${t.jenis}">${t.jenis==='masuk'?'⬇️':'⬆️'}</div><div class="recent-main"><b>${esc(t.keterangan)}</b><span>${fmtDateShort(t.tanggal)} • ${esc(categoryIcon(t.kategori,t.jenis))} ${esc(t.kategori)}${m?' • '+esc(m.nama):''}${t.pic?' • PIC: '+esc(t.pic):''}</span></div><div style="text-align:right"><span class="amount ${t.jenis}">${t.jenis==='masuk'?'+':'−'} ${fmtRp(t.jumlah)}</span><div class="row-actions" style="justify-content:flex-end;margin-top:6px"><button class="mini-btn" data-edit-trx="${t.id}">✏️</button><button class="mini-btn" data-del-trx="${t.id}">🗑️</button></div></div></div>`;
}
function bindTrxActions(root){
  if(!root) return;
  $$('[data-edit-trx]',root).forEach(b=>b.onclick=()=>openTrxModal(b.dataset.editTrx));
  $$('[data-del-trx]',root).forEach(b=>b.onclick=()=>{ const t=state.transactions.find(x=>x.id===b.dataset.delTrx); confirmAction('Hapus transaksi?',`"${t?.keterangan||''}" (${fmtRp(t?.jumlah)}) akan dihapus permanen.`,()=>{ state.transactions=state.transactions.filter(x=>x.id!==b.dataset.delTrx); toast('🗑️ Transaksi dihapus'); renderAll(); }); });
}
function bindGoto(root=document){ $$('[data-goto]',root).forEach(b=>b.onclick=()=>switchView(b.dataset.goto)); }

/* ===== Transactions view ===== */
function renderFilterOptions(){
  const current=$('#fKategori').value;
  const names=[...new Set(state.categories.map(c=>c.name))].sort();
  $('#fKategori').innerHTML='<option value="">Semua Kategori</option>'+names.map(n=>`<option ${n===current?'selected':''}>${esc(n)}</option>`).join('');
  $('#pageSize').value=String(ui.pageSize);
}
function filteredTransactions(){
  const q=($('#fSearch').value||'').toLowerCase(), jenis=$('#fJenis').value, kat=$('#fKategori').value, sort=$('#fSort').value;
  let list=trxInMonth(ui.month).filter(t=>{
    const m=memberById(t.memberId);
    const hay=`${t.keterangan} ${t.kategori} ${t.pic||''} ${t.catatan||''} ${m?.nama||''}`.toLowerCase();
    return (!q||hay.includes(q)) && (!jenis||t.jenis===jenis) && (!kat||t.kategori===kat);
  });
  const sorters={'tgl-desc':(a,b)=>b.tanggal.localeCompare(a.tanggal)||(b.createdAt||0)-(a.createdAt||0),'tgl-asc':(a,b)=>a.tanggal.localeCompare(b.tanggal)||(a.createdAt||0)-(b.createdAt||0),'jml-desc':(a,b)=>b.jumlah-a.jumlah,'jml-asc':(a,b)=>a.jumlah-b.jumlah};
  return list.sort(sorters[sort]||sorters['tgl-desc']);
}
function renderTransactions(){
  const list=filteredTransactions(); const balances=runningBalanceMap();
  const totalPages=Math.max(1,Math.ceil(list.length/ui.pageSize)); if(ui.page>totalPages) ui.page=totalPages;
  const start=(ui.page-1)*ui.pageSize; const pageList=list.slice(start,start+ui.pageSize);
  $('#filterSummary').textContent=`Menampilkan ${list.length} transaksi • ${monthLabel(ui.month)}`;
  $('#sumMasukFilter').textContent=fmtRp(sumJenis(list,'masuk')); $('#sumKeluarFilter').textContent=fmtRp(sumJenis(list,'keluar')); $('#sumSelisihFilter').textContent=fmtRp(sumJenis(list,'masuk')-sumJenis(list,'keluar'));
  $('#trxEmpty').hidden=list.length>0;
  $('#trxTbody').innerHTML=pageList.map(t=>{ const m=memberById(t.memberId); return `<tr>
    <td data-label="Tanggal">${fmtDateShort(t.tanggal)}</td>
    <td data-label="Keterangan"><b>${esc(t.keterangan)}</b>${t.catatan?`<br><small class="muted">${esc(t.catatan)}</small>`:''}</td>
    <td data-label="Kategori"><span class="tag ${t.jenis}">${esc(categoryIcon(t.kategori,t.jenis))} ${esc(t.kategori)}</span></td>
    <td data-label="Anggota / PIC">${esc(m?.nama||t.pic||'-')}</td>
    <td data-label="Metode">${esc(t.metode||'Tunai')}</td>
    <td data-label="Jumlah" class="num"><span class="amount ${t.jenis}">${t.jenis==='masuk'?'+':'−'} ${fmtRp(t.jumlah)}</span></td>
    <td data-label="Saldo Berjalan" class="num">${fmtRp(balances[t.id]??'')}</td>
    <td data-label="Aksi"><div class="row-actions"><button class="mini-btn" data-edit-trx="${t.id}">✏️ Edit</button><button class="mini-btn" data-del-trx="${t.id}">🗑️</button></div></td></tr>`; }).join('');
  $('#pageInfo').textContent=`Halaman ${ui.page} dari ${totalPages} • ${list.length} data`;
  $('#btnPrevPage').disabled=ui.page<=1; $('#btnNextPage').disabled=ui.page>=totalPages;
  bindTrxActions($('#trxTbody'));
}

/* ===== Report ===== */
function renderReportControls(){
  const [y,m]=ui.month.split('-').map(Number);
  $('#lapBulan').innerHTML=MONTHS.map((name,i)=>`<option value="${i+1}" ${i+1===m?'selected':''}>${name}</option>`).join('');
  const years=[...new Set([y-2,y-1,y,y+1,2030,2029,2028,2027,2026,2025,2024])].sort();
  $('#lapTahun').innerHTML=years.map(yy=>`<option ${yy===y?'selected':''}>${yy}</option>`).join('');
}
function syncReportFromControls(){
  const y=$('#lapTahun').value, m=pad(Number($('#lapBulan').value));
  ui.month=`${y}-${m}`; $('#globalMonth').value=ui.month; ui.page=1; renderAll();
}
function renderReport(){
  const key=ui.month, list=sortedTrx(trxInMonth(key));
  const masuk=sumJenis(list,'masuk'), keluar=sumJenis(list,'keluar'), awal=saldoSebelumBulan(key), akhir=awal+masuk-keluar;
  $('#repNamaOmk').textContent=state.settings.namaOmk||'OMK SANTO CAROLUS HOUBEN';
  $('#repParoki').textContent=state.settings.paroki||'PAROKI Nanga Mahap';
  $('#repPeriode').textContent='Periode '+monthLabel(key);
  $('#repMeta').innerHTML=`<span>📅 Periode: <b>${monthLabel(key)}</b></span><span>🧾 Total transaksi: <b>${list.length}</b></span><span>🖨️ Dicetak: <b>${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</b></span>`;
  $('#reportSummary').innerHTML=[['Saldo Awal Bulan',awal],['Total Pemasukan',masuk],['Total Pengeluaran',keluar],['Saldo Akhir Bulan',akhir]].map(([l,v])=>`<div class="mini-stat ${l.includes('Pemasukan')?'green':l.includes('Pengeluaran')?'red':'blue'}"><span>${l}</span><strong>${fmtRp(v)}</strong></div>`).join('');
  $('#repBoxes').innerHTML=[['Saldo Awal',awal],['Pemasukan (+)',masuk],['Pengeluaran (−)',keluar],['Saldo Akhir',akhir]].map(([l,v])=>`<div class="report-box"><span>${l}</span><strong>${fmtRp(v)}</strong></div>`).join('');
  let run=awal;
  $('#repTbody').innerHTML= list.length ? list.map((t,i)=>{ run += t.jenis==='masuk'?Number(t.jumlah):-Number(t.jumlah); return `<tr><td>${i+1}</td><td>${fmtDateShort(t.tanggal)}</td><td>${esc(t.keterangan)}</td><td>${esc(t.kategori)}</td><td class="num">${t.jenis==='masuk'?fmtRp(t.jumlah):'-'}</td><td class="num">${t.jenis==='keluar'?fmtRp(t.jumlah):'-'}</td><td class="num"><b>${fmtRp(run)}</b></td></tr>`; }).join('') : '<tr><td colspan="7" style="text-align:center;padding:22px">Tidak ada transaksi pada bulan ini.</td></tr>';
  const byCat={}; list.forEach(t=>{ byCat[t.kategori]=byCat[t.kategori]||{masuk:0,keluar:0}; byCat[t.kategori][t.jenis]+=Number(t.jumlah); });
  const cats=Object.keys(byCat).sort();
  $('#repKategori').innerHTML= cats.length ? ['masuk','keluar'].map(j=>`<div><h4 style="margin:0 0 8px">${j==='masuk'?'⬇️ Pemasukan':'⬆️ Pengeluaran'}</h4><div class="table-wrap"><table class="table" style="min-width:0"><thead><tr><th>Kategori</th><th class="num">Total</th></tr></thead><tbody>${cats.filter(c=>byCat[c][j]>0).map(c=>`<tr><td data-label="Kategori">${esc(c)}</td><td data-label="Total" class="num">${fmtRp(byCat[c][j])}</td></tr>`).join('')||'<tr><td colspan="2">-</td></tr>'}</tbody></table></div></div>`).join('') : '<p class="muted">Belum ada rekap kategori.</p>';
  $('#repKetua').textContent=`( ${state.settings.ketua||'....................'} )`;
  $('#repBendahara').textContent=`( ${state.settings.bendahara||'....................'} )`;
  $('#repTempatTanggal').textContent=`${state.settings.tempat||'Nanga Mahap'}, ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`;
}
function renderYearRecap(){
  const year=ui.month.split('-')[0];
  $('#yearTbody').innerHTML=MONTHS.map((name,i)=>{ const key=`${year}-${pad(i+1)}`; const list=trxInMonth(key); const masuk=sumJenis(list,'masuk'), keluar=sumJenis(list,'keluar'); return `<tr><td data-label="Bulan"><b>${name} ${year}</b></td><td data-label="Pemasukan" class="num amount masuk">${fmtRp(masuk)}</td><td data-label="Pengeluaran" class="num amount keluar">${fmtRp(keluar)}</td><td data-label="Selisih" class="num"><b>${fmtRp(masuk-keluar)}</b></td><td data-label="Aksi"><button class="mini-btn" data-report-month="${key}">📄 Lihat & PDF</button></td></tr>`; }).join('');
  $$('[data-report-month]').forEach(b=>b.onclick=()=>{ ui.month=b.dataset.reportMonth; $('#globalMonth').value=ui.month; switchView('laporan'); toast('Periode laporan: '+monthLabel(ui.month)); });
}

/* ===== Members ===== */
function memberContribution(m){
  const list=state.transactions.filter(t=>t.memberId===m.id && t.jenis==='masuk' && t.kategori.toLowerCase().includes('iuran'));
  return {total:list.reduce((s,t)=>s+Number(t.jumlah),0), count:list.length};
}
function renderMembers(){
  const q=($('#memberSearch').value||'').toLowerCase();
  const list=state.members.filter(m=>!q || `${m.nama} ${m.jabatan} ${m.asal||''}`.toLowerCase().includes(q));
  $('#memberTotal').textContent=state.members.length;
  $('#memberAktif').textContent=state.members.filter(m=>m.status==='Aktif').length;
  $('#memberIuran').textContent=fmtRp(state.transactions.filter(t=>t.jenis==='masuk'&&t.kategori.toLowerCase().includes('iuran')).reduce((s,t)=>s+Number(t.jumlah),0));
  $('#memberEmpty').hidden=state.members.length>0;
  $('#memberGrid').innerHTML=list.map(m=>{ const c=memberContribution(m); const wa=m.hp? 'https://wa.me/'+m.hp.replace(/\D/g,'').replace(/^0/,'62') : ''; return `<article class="member-card"><div class="member-top"><span class="avatar">${esc(initials(m.nama))}</span><div><b>${esc(m.nama)}</b><span>${esc(m.jabatan)} • ${esc(m.status)}</span></div></div><div class="member-meta">📍 ${esc(m.asal||'-')}<br>📱 ${esc(m.hp||'-')}<br>💚 Iuran tercatat: <b>${fmtRp(c.total)}</b> (${c.count} x)</div><div class="member-foot"><span class="tag ${m.status==='Aktif'?'masuk':'keluar'}">${esc(m.status)}</span><span class="row-actions">${wa?`<a class="mini-btn" href="${wa}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">💬 WA</a>`:''}<button class="mini-btn" data-edit-member="${m.id}">✏️ Edit</button><button class="mini-btn" data-del-member="${m.id}">🗑️</button></span></div></article>`; }).join('') || '<div class="empty" style="grid-column:1/-1"><div class="empty-ic">🔎</div><h4>Tidak ditemukan</h4><p>Coba kata kunci pencarian lain.</p></div>';
  $$('[data-edit-member]').forEach(b=>b.onclick=()=>openMemberModal(b.dataset.editMember));
  $$('[data-del-member]').forEach(b=>b.onclick=()=>{ const m=memberById(b.dataset.delMember); confirmAction('Hapus anggota?',`Anggota "${m?.nama}" akan dihapus. Transaksi terkait tetap tersimpan.`,()=>{ state.transactions.forEach(t=>{ if(t.memberId===b.dataset.delMember) t.memberId=''; }); state.members=state.members.filter(x=>x.id!==b.dataset.delMember); toast('Anggota dihapus'); renderAll(); }); });
}

/* ===== Categories & budgets ===== */
function renderCategoriesBudgets(){
  const listFor=(type)=>state.categories.filter(c=>c.type===type);
  const chip=(c)=>{ const used=state.transactions.some(t=>t.kategori===c.name&&t.jenis===c.type); return `<div class="cat-chip"><span>${esc(c.icon||'🏷️')} <b>${esc(c.name)}</b></span><button class="mini-btn" data-del-category="${c.id}" ${used?'title="Kategori sedang dipakai transaksi"':''}>🗑️</button></div>`; };
  $('#catMasukList').innerHTML=listFor('masuk').map(chip).join('')||'<p class="muted">Belum ada kategori.</p>';
  $('#catKeluarList').innerHTML=listFor('keluar').map(chip).join('')||'<p class="muted">Belum ada kategori.</p>';
  $$('[data-del-category]').forEach(b=>b.onclick=()=>{ const c=state.categories.find(x=>x.id===b.dataset.delCategory); if(state.transactions.some(t=>t.kategori===c.name&&t.jenis===c.type)){ toast('⚠️ Kategori tidak bisa dihapus karena sudah dipakai transaksi.'); return; } confirmAction('Hapus kategori?',`Kategori "${c.name}" akan dihapus.`,()=>{ state.categories=state.categories.filter(x=>x.id!==c.id); state.budgets=state.budgets.filter(x=>x.category!==c.name); toast('Kategori dihapus'); renderAll(); }); });
  renderBudgetProgress($('#budgetList'), ui.month, false);
  $('#budgetEmpty').hidden=budgetRowsForMonth(ui.month).length>0 || state.budgets.some(b=>b.month===ui.month);
  // ringkasan per kategori bulan terpilih
  const monthList=trxInMonth(ui.month); const map={};
  monthList.forEach(t=>{ const k=t.jenis+':'+t.kategori; map[k]=map[k]||{name:t.kategori,jenis:t.jenis,total:0,count:0}; map[k].total+=Number(t.jumlah); map[k].count++; });
  const rows=Object.values(map).sort((a,b)=>b.total-a.total);
  $('#catSummary').innerHTML= rows.length ? rows.map(r=>`<div class="cat-sum-card"><span>${esc(categoryIcon(r.name,r.jenis))} ${esc(r.name)} • ${r.count} transaksi</span><strong class="${r.jenis==='masuk'?'amount masuk':'amount keluar'}">${r.jenis==='masuk'?'+':'−'} ${fmtRp(r.total)}</strong></div>`).join('') : '<div class="empty" style="grid-column:1/-1"><div class="empty-ic">📈</div><h4>Belum ada data bulan ini</h4></div>';
}

/* ===== Settings ===== */
function fillSettings(){
  const s=state.settings;
  $('#sNamaOmk').value=s.namaOmk||''; $('#sParoki').value=s.paroki||''; $('#sTempat').value=s.tempat||'';
  $('#sKetua').value=s.ketua||''; $('#sBendahara').value=s.bendahara||''; $('#sSekretaris').value=s.sekretaris||''; $('#sPembina').value=s.pembina||'';
  $('#sSaldoAwal').value=s.saldoAwal||0; $('#sTargetKas').value=s.targetKas||0;
}

/* ===== Modals: transaction ===== */
function fillTrxCategoryOptions(jenis, selected=''){
  const opts=state.categories.filter(c=>c.type===jenis);
  $('#tKategori').innerHTML=opts.map(c=>`<option value="${esc(c.name)}" ${c.name===selected?'selected':''}>${esc(c.icon||'🏷️')} ${esc(c.name)}</option>`).join('');
}
function fillMemberOptions(selected=''){
  $('#tAnggota').innerHTML='<option value="">— Tidak terkait anggota —</option>'+state.members.map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${esc(m.nama)} (${esc(m.jabatan)})</option>`).join('');
}
function setJenis(jenis){
  $('#tJenis').value=jenis;
  $$('.seg').forEach(b=>b.classList.toggle('active', b.dataset.jenis===jenis));
  fillTrxCategoryOptions(jenis, $('#tKategori').value);
}
function openTrxModal(id=''){
  const t=state.transactions.find(x=>x.id===id);
  $('#trxForm').reset(); $('#tId').value=t?.id||'';
  $('#trxModalTitle').textContent=t?'✏️ Edit Transaksi':'＋ Tambah Transaksi';
  setJenis(t?.jenis||'masuk'); fillMemberOptions(t?.memberId||'');
  if(t){ $('#tTanggal').value=t.tanggal; $('#tJumlah').value=t.jumlah; $('#tKeterangan').value=t.keterangan; fillTrxCategoryOptions(t.jenis,t.kategori); $('#tMetode').value=t.metode||'Tunai'; $('#tPic').value=t.pic||''; $('#tCatatan').value=t.catatan||''; }
  else { $('#tTanggal').value= monthKeyOf(todayISO())===ui.month ? todayISO() : ui.month+'-01'; }
  updateAmountPreview(); openModal('trxModal');
}
function updateAmountPreview(){ const v=Number($('#tJumlah').value)||0; $('#tJumlahPreview').textContent=v? fmtRp(v):''; }
function openMemberModal(id=''){
  const m=memberById(id); $('#memberForm').reset(); $('#mId').value=m?.id||'';
  $('#memberModalTitle').textContent=m?'✏️ Edit Anggota':'＋ Tambah Anggota';
  if(m){ $('#mNama').value=m.nama; $('#mJabatan').value=m.jabatan; $('#mStatus').value=m.status; $('#mHp').value=m.hp||''; $('#mAsal').value=m.asal||''; }
  openModal('memberModal');
}
function openBudgetModal(id=''){
  const b=state.budgets.find(x=>x.id===id); $('#budgetForm').reset(); $('#bId').value=b?.id||'';
  $('#budgetModalSub').textContent='Bulan: '+monthLabel(ui.month);
  $('#bKategori').innerHTML=state.categories.filter(c=>c.type==='keluar').map(c=>`<option value="${esc(c.name)}" ${b?.category===c.name?'selected':''}>${esc(c.icon||'🏷️')} ${esc(c.name)}</option>`).join('');
  if(b) $('#bJumlah').value=b.amount;
  openModal('budgetModal');
}

/* ===== Export / PDF ===== */
function download(filename, content, type='text/plain'){
  const blob=content instanceof Blob? content : new Blob([content],{type}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function csvOf(list){
  const rows=[['Tanggal','Jenis','Kategori','Keterangan','Anggota','PIC','Metode','Masuk','Keluar','Catatan']];
  sortedTrx([...list]).forEach(t=>{ const m=memberById(t.memberId); rows.push([t.tanggal,t.jenis==='masuk'?'Pemasukan':'Pengeluaran',t.kategori,t.keterangan,m?.nama||'',t.pic||'',t.metode||'',t.jenis==='masuk'?t.jumlah:'',t.jenis==='keluar'?t.jumlah:'',t.catatan||'']); });
  return '\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
}
async function getLogoDataUrl(){
  if(ui.logoDataUrl) return ui.logoDataUrl;
  const img=document.querySelector('.brand-logo');
  if(img && img.src && img.src.startsWith('data:')){ ui.logoDataUrl=img.src; return ui.logoDataUrl; }
  try{ const res=await fetch('logo.png'); const blob=await res.blob(); ui.logoDataUrl=await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(blob); }); return ui.logoDataUrl; }catch(e){ return null; }
}
async function downloadPdf(){
  const key=ui.month, list=sortedTrx(trxInMonth(key));
  if(!window.jspdf || !window.jspdf.jsPDF){ toast('⚠️ Library PDF belum termuat (perlu internet sekali). Gunakan tombol Cetak / Simpan via Print.'); window.print(); return; }
  toast('⏳ Menyiapkan PDF laporan '+monthLabel(key)+'…');
  const { jsPDF } = window.jspdf; const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  const pageW=210, masuk=sumJenis(list,'masuk'), keluar=sumJenis(list,'keluar'), awal=saldoSebelumBulan(key), akhir=awal+masuk-keluar;
  // Header
  doc.setFillColor(255,212,0); doc.rect(0,0,pageW,40,'F'); doc.setFillColor(17,17,17); doc.rect(0,40,pageW,1.2,'F');
  const logo=await getLogoDataUrl(); if(logo){ try{ doc.setFillColor(255,255,255); doc.circle(24,20,13,'F'); doc.addImage(logo,'PNG',12,8,24,24); }catch(e){} }
  doc.setTextColor(17,17,17); doc.setFont('helvetica','bold'); doc.setFontSize(15);
  doc.text(state.settings.namaOmk||'OMK SANTO CAROLUS HOUBEN', pageW/2, 13, {align:'center'});
  doc.setFontSize(10); doc.text(state.settings.paroki||'PAROKI Nanga Mahap', pageW/2, 19, {align:'center'});
  doc.setFontSize(12); doc.text('LAPORAN KEUANGAN KAS OMK', pageW/2, 26, {align:'center'});
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  doc.text(`Periode: ${monthLabel(key)}  •  Dicetak: ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}  •  Total transaksi: ${list.length}`, pageW/2, 32, {align:'center'});
  // Ringkasan
  let y=48; doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.text('Ringkasan Kas',14,y); y+=4;
  const boxes=[['Saldo Awal',awal],['Pemasukan',masuk],['Pengeluaran',keluar],['Saldo Akhir',akhir]];
  boxes.forEach(([label,val],i)=>{ const x=14+i*45.5; doc.setDrawColor(17,17,17); doc.setLineWidth(.4); doc.roundedRect(x,y,42,16,2,2); doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.text(label.toUpperCase(),x+3,y+6); doc.setFontSize(9.5); doc.text(fmtRp(val),x+3,y+12); });
  y+=22;
  // Tabel transaksi
  let run=awal;
  const body=list.map((t,i)=>{ run += t.jenis==='masuk'?Number(t.jumlah):-Number(t.jumlah); return [i+1, fmtDateShort(t.tanggal), t.keterangan, t.kategori, t.jenis==='masuk'?fmtRp(t.jumlah):'-', t.jenis==='keluar'?fmtRp(t.jumlah):'-', fmtRp(run)]; });
  doc.autoTable({ startY:y, head:[['No','Tanggal','Keterangan','Kategori','Masuk','Keluar','Saldo']], body: body.length?body:[['-','-','Tidak ada transaksi bulan ini','-','-','-','-']], styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[255,212,0],textColor:[17,17,17],fontStyle:'bold'}, alternateRowStyles:{fillColor:[255,248,214]}, columnStyles:{0:{cellWidth:10},1:{cellWidth:24},4:{halign:'right'},5:{halign:'right'},6:{halign:'right',fontStyle:'bold'}} });
  y=doc.lastAutoTable.finalY+8;
  // Rekap kategori
  if(y>235){ doc.addPage(); y=16; }
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text('Rekap per Kategori',14,y); y+=3;
  const byCat={}; list.forEach(t=>{ byCat[t.kategori]=byCat[t.kategori]||{masuk:0,keluar:0}; byCat[t.kategori][t.jenis]+=Number(t.jumlah); });
  const catBody=Object.keys(byCat).sort().map(c=>[c, byCat[c].masuk?fmtRp(byCat[c].masuk):'-', byCat[c].keluar?fmtRp(byCat[c].keluar):'-']);
  doc.autoTable({ startY:y, head:[['Kategori','Pemasukan','Pengeluaran']], body:catBody.length?catBody:[['-','-','-']], styles:{fontSize:8,cellPadding:2}, headStyles:{fillColor:[17,17,17],textColor:[255,212,0],fontStyle:'bold'}, columnStyles:{1:{halign:'right'},2:{halign:'right'}} });
  y=doc.lastAutoTable.finalY+12;
  if(y>245){ doc.addPage(); y=18; }
  // Tanda tangan
  const tgl=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(17,17,17);
  doc.text('Mengetahui,',32,y,{align:'center'}); doc.text(`${state.settings.tempat||'Nanga Mahap'}, ${tgl}`,168,y,{align:'center'});
  doc.setFont('helvetica','bold'); doc.text('Ketua OMK',32,y+5,{align:'center'}); doc.text('Bendahara OMK',168,y+5,{align:'center'});
  doc.setFont('helvetica','normal');
  doc.text(`( ${state.settings.ketua||'....................'} )`,32,y+32,{align:'center'}); doc.text(`( ${state.settings.bendahara||'....................'} )`,168,y+32,{align:'center'});
  if(state.settings.sekretaris){ doc.text(`Sekretaris: ${state.settings.sekretaris}`,14,y+42); }
  if(state.settings.pembina){ doc.text(`Pembina/Pastor: ${state.settings.pembina}`,14,y+47); }
  const pages=doc.getNumberOfPages();
  for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(120); doc.text(`Aplikasi Kas OMK St. Carolus Houben — Paroki Nanga Mahap • Halaman ${i} dari ${pages}`, pageW/2, 292, {align:'center'}); }
  doc.save(`Laporan-Kas-OMK-StCarolusHouben-${key}.pdf`);
  toast('✅ PDF laporan '+monthLabel(key)+' berhasil di-download!');
}

/* ===== Supabase Cloud Sync ===== */
function setCloudStatus(text, tone='yellow'){
  const el=$('#cloudStatus'); if(!el) return;
  el.textContent=text; el.className='badge '+(tone==='green'?'badge-blue':tone==='red'?'badge-red':'badge-yellow');
}
function cloudHelp(text){ const el=$('#cloudHelp'); if(el) el.textContent=text; }
function cloudSessionSave(){
  try{ if(cloudSession) localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(cloudSession)); else localStorage.removeItem(CLOUD_SESSION_KEY); }catch(e){}
}
async function cloudFetch(path, options={}, auth=true){
  let session=cloudSession;
  if(auth && session && session.expires_at && session.expires_at < Math.floor(Date.now()/1000)+60){
    const refreshed=await fetch(SUPABASE_URL+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json','apikey':SUPABASE_ANON_KEY},body:JSON.stringify({refresh_token:session.refresh_token})});
    const rj=await refreshed.json().catch(()=>({}));
    if(!refreshed.ok) throw new Error(rj.msg||rj.message||'Sesi login kedaluwarsa. Masuk kembali.');
    cloudSession={...rj,expires_at:rj.expires_at||Math.floor(Date.now()/1000)+(rj.expires_in||3600)}; cloudSessionSave(); session=cloudSession;
  }
  const headers={'apikey':SUPABASE_ANON_KEY,'Content-Type':'application/json',...(options.headers||{})};
  if(auth && session?.access_token) headers.Authorization='Bearer '+session.access_token;
  const res=await fetch(SUPABASE_URL+path,{...options,headers});
  const text=await res.text(); let body={}; try{body=text?JSON.parse(text):{};}catch(e){body={message:text};}
  if(!res.ok) throw new Error(body.msg||body.message||body.error_description||('Permintaan cloud gagal ('+res.status+')'));
  return body;
}
function syncCloudControls(){
  const logged=!!cloudSession;
  $('#cloudLoginFields').hidden=logged;
  $('#btnCloudLogin').hidden=logged;
  $('#btnCloudSignup').hidden=logged;
  $('#btnCloudLogout').hidden=!logged;
  $('#btnCloudUpload').hidden=!logged||cloudReady;
}
async function syncCloudState(){
  if(!cloudSession||!cloudReady) return;
  setCloudStatus('Menyinkronkan…');
  try{
    await cloudFetch('/rest/v1/kas_omk_data?on_conflict=user_id',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:cloudSession.user.id,data:state,updated_at:new Date().toISOString()})});
    setCloudStatus('Tersinkron','green'); cloudHelp('Data di perangkat ini sudah tersimpan di cloud dan akan tersedia saat masuk dengan akun yang sama.');
  }catch(e){ setCloudStatus('Gagal sinkron','red'); cloudHelp('Sinkronisasi gagal: '+e.message+'. Data lokal tetap tersimpan; periksa koneksi dan coba masuk kembali.'); }
}
async function cloudLogin(email,password,signup=false){
  if(!email||!password){toast('Isi email dan kata sandi akun Supabase terlebih dahulu.');return;}
  setCloudStatus(signup?'Membuat akun…':'Sedang masuk…');
  try{
    const path=signup?'/auth/v1/signup':'/auth/v1/token?grant_type=password';
    const result=await cloudFetch(path,{method:'POST',body:JSON.stringify({email,password})},false);
    if(!result.access_token){
      setCloudStatus('Perlu verifikasi email');
      cloudHelp('Akun dibuat. Buka email untuk verifikasi, lalu kembali ke sini dan masuk dengan akun tersebut.');
      toast('Akun dibuat. Periksa email untuk verifikasi.'); return;
    }
    cloudSession={...result,expires_at:result.expires_at||Math.floor(Date.now()/1000)+(result.expires_in||3600)};
    cloudSessionSave(); syncCloudControls();
    await hydrateCloud();
  }catch(e){ setCloudStatus('Belum tersambung','red'); cloudHelp('Tidak bisa masuk: '+e.message); toast('Gagal masuk: '+e.message); }
}
async function hydrateCloud(){
  if(!cloudSession) return;
  setCloudStatus('Memuat data cloud…');
  try{
    const rows=await cloudFetch('/rest/v1/kas_omk_data?user_id=eq.'+encodeURIComponent(cloudSession.user.id)+'&select=data,updated_at');
    if(rows.length && rows[0].data && Array.isArray(rows[0].data.transactions)){
      state=rows[0].data; cloudReady=true;
      try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
      ui.page=1; fillSettings(); renderAll(false); syncCloudControls(); setCloudStatus('Tersambung • '+(cloudSession.user.email||'akun'),'green');
      cloudHelp('Data cloud berhasil dimuat. Perubahan di perangkat ini akan tersinkron otomatis.');
      toast('☁️ Data cloud berhasil dimuat.');
    }else{
      cloudReady=false; syncCloudControls();
      setCloudStatus('Menunggu data awal');
      cloudHelp('Belum ada data di cloud. Login pertama sebaiknya dari laptop yang berisi catatan keuangan sebenarnya, lalu tekan tombol “Jadikan data perangkat ini sebagai data cloud”. Jangan unggah data contoh dari HP.');
      toast('Akun terhubung; tentukan perangkat sumber data pertama.');
    }
  }catch(e){ cloudReady=false; syncCloudControls(); setCloudStatus('Gagal memuat','red'); cloudHelp('Tidak bisa mengambil data cloud: '+e.message+'. Periksa apakah SQL setup sudah dijalankan di Supabase.'); }
}
async function uploadLocalAsCloud(){
  if(!cloudSession) return;
  const n=state.transactions.length;
  if(!confirm(`Unggah data dari perangkat ini (${n} transaksi, ${state.members.length} anggota) sebagai data awal cloud? Setelah ini, akun di laptop/HP akan menggunakan data ini.`)) return;
  cloudReady=true; syncCloudControls(); await syncCloudState();
}
async function logoutCloud(){
  try{ if(cloudSession?.access_token) await cloudFetch('/auth/v1/logout',{method:'POST'},true); }catch(e){}
  cloudSession=null; cloudReady=false; cloudSessionSave(); syncCloudControls(); setCloudStatus('Keluar dari cloud'); cloudHelp('Data perangkat ini tetap tersimpan lokal. Masuk lagi dengan akun yang sama untuk menyinkronkan.');
}
async function resumeCloud(){
  try{ const raw=localStorage.getItem(CLOUD_SESSION_KEY); if(!raw) return; cloudSession=JSON.parse(raw); syncCloudControls(); await hydrateCloud(); }
  catch(e){ cloudSession=null; cloudReady=false; cloudSessionSave(); syncCloudControls(); setCloudStatus('Sesi perlu masuk ulang','red'); }
}

/* ===== Events ===== */
function init(){
  $('#globalMonth').value=ui.month;
  // Nav
  $$('.nav-item,.bnav-item').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
  bindGoto();
  $('#btnThisMonth').onclick=()=>{ ui.month=currentMonthKey(); ui.page=1; renderAll(); toast('Periode: '+monthLabel(ui.month)); };
  $('#globalMonth').addEventListener('change',e=>{ ui.month=e.target.value||currentMonthKey(); ui.page=1; renderAll(); });
  // Add transaction buttons
  ['btnAddTop','btnAddMain','btnAddTrx2','btnFab'].forEach(id=>{ const el=document.getElementById(id); if(el) el.onclick=()=>openTrxModal(); });
  window.openTrxModal=openTrxModal;
  // Dark mode
  const toggleDark=()=>{ state.settings.dark=!state.settings.dark; renderAll(); };
  $('#btnDarkTop').onclick=toggleDark; $('#btnDarkSidebar').onclick=toggleDark;
  // Modal close
  $$('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
  $$('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModal(m.id); }));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') $$('.modal-backdrop').forEach(m=>closeModal(m.id)); });
  $('#btnConfirmYes').onclick=()=>{ const cb=ui.confirmCb; ui.confirmCb=null; closeModal('confirmModal'); if(cb) cb(); };
  // Transaction form
  $$('.seg').forEach(b=>b.onclick=()=>setJenis(b.dataset.jenis));
  $('#tJumlah').addEventListener('input',updateAmountPreview);
  $$('.chip-btn').forEach(b=>b.onclick=()=>{ $('#tJumlah').value=b.dataset.amt; updateAmountPreview(); });
  $('#trxForm').addEventListener('submit',e=>{
    e.preventDefault();
    const id=$('#tId').value, jenis=$('#tJenis').value;
    const data={ id:id||uid(), tanggal:$('#tTanggal').value, jenis, jumlah:Number($('#tJumlah').value), keterangan:$('#tKeterangan').value.trim(), kategori:$('#tKategori').value, metode:$('#tMetode').value, memberId:$('#tAnggota').value, pic:$('#tPic').value.trim(), catatan:$('#tCatatan').value.trim(), createdAt:Date.now() };
    if(!data.tanggal||!data.keterangan||!(data.jumlah>0)){ toast('⚠️ Tanggal, keterangan & jumlah wajib diisi dengan benar.'); return; }
    if(id){ const idx=state.transactions.findIndex(t=>t.id===id); data.createdAt=state.transactions[idx]?.createdAt||Date.now(); state.transactions[idx]=data; toast('✅ Transaksi diperbarui'); }
    else { state.transactions.push(data); toast(jenis==='masuk'?'✅ Pemasukan tercatat: '+fmtRp(data.jumlah):'✅ Pengeluaran tercatat: '+fmtRp(data.jumlah)); }
    ui.month=monthKeyOf(data.tanggal); closeModal('trxModal'); renderAll();
  });
  // Filters
  ['fSearch','fJenis','fKategori','fSort'].forEach(id=>$('#'+id).addEventListener('input',()=>{ ui.page=1; renderTransactions(); }));
  $('#btnResetFilter').onclick=()=>{ $('#fSearch').value=''; $('#fJenis').value=''; $('#fKategori').value=''; $('#fSort').value='tgl-desc'; ui.page=1; renderTransactions(); };
  $('#pageSize').addEventListener('change',e=>{ ui.pageSize=Number(e.target.value); ui.page=1; renderTransactions(); });
  $('#btnPrevPage').onclick=()=>{ if(ui.page>1){ ui.page--; renderTransactions(); } };
  $('#btnNextPage').onclick=()=>{ ui.page++; renderTransactions(); };
  $('#btnExportCsv').onclick=()=>{ download(`Transaksi-Kas-OMK-${ui.month}-filter.csv`, csvOf(filteredTransactions()), 'text/csv'); toast('CSV transaksi (sesuai filter) di-download'); };
  // Report
  $('#lapBulan').addEventListener('change',syncReportFromControls); $('#lapTahun').addEventListener('change',syncReportFromControls);
  $('#btnDownloadPdf').onclick=downloadPdf;
  $('#btnPrintReport').onclick=()=>{ switchView('laporan'); setTimeout(()=>window.print(),150); };
  $('#btnCsvMonth').onclick=()=>{ download(`Laporan-Kas-OMK-${ui.month}.csv`, csvOf(trxInMonth(ui.month)), 'text/csv'); toast('CSV laporan '+monthLabel(ui.month)+' di-download'); };
  // Members
  $('#btnAddMember').onclick=()=>openMemberModal();
  $('#memberSearch').addEventListener('input',renderMembers);
  $('#memberForm').addEventListener('submit',e=>{ e.preventDefault(); const id=$('#mId').value; const data={id:id||uid(), nama:$('#mNama').value.trim(), jabatan:$('#mJabatan').value, status:$('#mStatus').value, hp:$('#mHp').value.trim(), asal:$('#mAsal').value.trim()}; if(!data.nama){ toast('Nama anggota wajib diisi'); return; } if(id){ state.members[state.members.findIndex(m=>m.id===id)]=data; toast('✅ Anggota diperbarui'); } else { state.members.push(data); toast('✅ Anggota ditambahkan'); } closeModal('memberModal'); renderAll(); });
  // Categories & budget
  $('#btnAddCategory').onclick=()=>{ $('#categoryForm').reset(); openModal('categoryModal'); };
  $('#categoryForm').addEventListener('submit',e=>{ e.preventDefault(); const nama=$('#cNama').value.trim(), jenis=$('#cJenis').value, ikon=$('#cIkon').value.trim()||'🏷️'; if(!nama) return; if(state.categories.some(c=>c.name.toLowerCase()===nama.toLowerCase()&&c.type===jenis)){ toast('⚠️ Kategori itu sudah ada.'); return; } state.categories.push({id:uid(),name:nama,type:jenis,icon:ikon}); toast('✅ Kategori ditambahkan'); closeModal('categoryModal'); renderAll(); });
  $('#btnAddBudget').onclick=()=>openBudgetModal();
  $('#budgetForm').addEventListener('submit',e=>{ e.preventDefault(); const id=$('#bId').value, kategori=$('#bKategori').value, jumlah=Number($('#bJumlah').value); const dup=state.budgets.find(b=>b.month===ui.month&&b.category===kategori&&b.id!==id); if(dup){ toast('⚠️ Anggaran kategori ini sudah ada untuk bulan terpilih. Edit yang sudah ada.'); return; } if(id){ const b=state.budgets.find(x=>x.id===id); b.category=kategori; b.amount=jumlah; b.month=ui.month; toast('✅ Anggaran diperbarui'); } else { state.budgets.push({id:uid(),month:ui.month,category:kategori,amount:jumlah}); toast('✅ Anggaran ditambahkan untuk '+monthLabel(ui.month)); } closeModal('budgetModal'); renderAll(); });
  // Cloud sign-in and synchronization
  $('#btnCloudLogin').onclick=()=>cloudLogin($('#cloudEmail').value.trim(),$('#cloudPassword').value,false);
  $('#btnCloudSignup').onclick=()=>cloudLogin($('#cloudEmail').value.trim(),$('#cloudPassword').value,true);
  $('#btnCloudLogout').onclick=logoutCloud;
  $('#btnCloudUpload').onclick=uploadLocalAsCloud;
  resumeCloud();
  // Settings & data
  fillSettings();
  $('#settingsForm').addEventListener('submit',e=>{ e.preventDefault(); state.settings={...state.settings, namaOmk:$('#sNamaOmk').value.trim(), paroki:$('#sParoki').value.trim(), tempat:$('#sTempat').value.trim(), ketua:$('#sKetua').value.trim(), bendahara:$('#sBendahara').value.trim(), sekretaris:$('#sSekretaris').value.trim(), pembina:$('#sPembina').value.trim(), saldoAwal:Number($('#sSaldoAwal').value)||0, targetKas:Number($('#sTargetKas').value)||0}; toast('✅ Pengaturan disimpan'); renderAll(); });
  $('#btnBackup').onclick=()=>{ download(`Backup-Kas-OMK-${todayISO()}.json`, JSON.stringify(state,null,2), 'application/json'); toast('💾 Backup JSON di-download. Simpan di tempat aman!'); };
  $('#fileRestore').addEventListener('change',e=>{ const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const parsed=JSON.parse(reader.result); if(!parsed.transactions||!parsed.settings) throw new Error('format'); state=parsed; ui.page=1; fillSettings(); toast('✅ Restore berhasil! Data backup dimuat.'); renderAll(); }catch(err){ toast('⚠️ File backup tidak valid.'); } }; reader.readAsText(file); e.target.value=''; });
  $('#btnDemo').onclick=()=>confirmAction('Muat ulang data contoh?','Semua data saat ini akan diganti dengan data contoh.',()=>{ state=seedState(); fillSettings(); toast('✨ Data contoh dimuat'); renderAll(); });
  $('#btnWipe').onclick=()=>confirmAction('Hapus SEMUA data?','Seluruh transaksi, anggota, kategori & anggaran akan dikosongkan. Tindakan ini tidak dapat dibatalkan!',()=>{ state=emptyState(); fillSettings(); toast('🗑️ Semua data dikosongkan'); renderAll(); });

  getLogoDataUrl();
  renderAll(false);
}
document.addEventListener('DOMContentLoaded', init);
