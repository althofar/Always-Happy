(() => {
  const cfg = window.WEDDING_CONFIG || {};
  if (!window.WEDDING_CONFIG) console.error('[Undangan] config.js tidak terbaca. Pastikan config.js berada satu folder dengan index.html dan dibuka lewat folder project yang benar.');
  console.info('[Undangan] Config aktif:', cfg);
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const supabaseReady = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const db = supabaseReady ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const local = { rsvps: 'wedding_rsvps_demo', wishes: 'wedding_wishes_demo' };
  const readLocal = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const writeLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const setText = (selector, value) => $$(selector).forEach(el => el.textContent = value ?? '');
  document.title = `Undangan Pernikahan — ${cfg.bride || 'Mempelai'} & ${cfg.groom || 'Pasangan'}`;
  setText('[data-bride]', cfg.bride || 'Nama Mempelai'); setText('[data-groom]', cfg.groom || 'Nama Pasangan');
  setText('[data-date-label]', cfg.dateLabel || 'Tanggal pernikahan'); setText('[data-akad-time]', cfg.akadTime || 'Waktu akad'); setText('[data-resepsi-time]', cfg.resepsiTime || 'Waktu resepsi');
  setText('[data-venue]', cfg.venue || 'Lokasi acara'); setText('[data-address]', cfg.address || 'Alamat acara'); setText('[data-bank]', cfg.bank || 'Nama Bank');setText('[data-account-name]', cfg.accountName || 'Nama pemilik rekening'); setText('[data-account]', cfg.accountNumber || 'Nomor rekening'); setText('[data-wallet-name]', cfg.walletName || 'Nama penerima'); setText('[data-wallet]', cfg.walletNumber || 'Nomor e-wallet');
  setText('[data-gift-address]', cfg.giftAddress || 'Alamat kirim hadiah');
  $$('[data-map-link]').forEach(a => a.href = cfg.mapsUrl || 'https://maps.google.com');
  if (cfg.mapsEmbedUrl) $('#mapFrame').src = cfg.mapsEmbedUrl;
  const walletCaption = $('.digital-wallet .bank-caption');
  if (walletCaption) walletCaption.textContent = cfg.walletProvider || 'E-wallet';
  $('#year').textContent = new Date().getFullYear();
  const params = new URLSearchParams(location.search); const guest = params.get('to');
  if (guest) { $('#guestName').textContent = guest; $('#rsvpName').value = guest; }
  // Halaman pembuka dikunci sampai tamu menekan "Buka undangan", supaya musik pasti bisa diputar saat itu.
  // Kunci dipasang lewat JavaScript, jadi kalau script gagal dimuat halaman tetap bisa di-scroll.
  const lockPage = on => { document.documentElement.classList.toggle('is-locked', on); document.body.classList.toggle('is-locked', on); };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0); lockPage(true);
  $('#openInvitation').addEventListener('click', () => {
    lockPage(false);
    $('#intro').scrollIntoView({behavior:'smooth'});
    startMusic();
  });

  const audio = $('#weddingMusic'); const musicBtn = $('#musicToggle');
  audio.volume = 0.2;
  if (cfg.musicUrl) {
    audio.querySelector('source').src = cfg.musicUrl;
    audio.load(); // Memuat file audio terlebih dahulu di latar belakang
  }
  let userPaused = false; // true = tamu sendiri yang menjeda, jangan diputar otomatis lagi
  const showMusicState = () => { musicBtn.innerHTML = audio.paused ? '♫ <span>Putar musik</span>' : '♫ <span>Jeda musik</span>'; };
  audio.addEventListener('play', showMusicState); audio.addEventListener('pause', showMusicState);
  const startMusic = () => { if (!cfg.musicUrl || userPaused || !audio.paused) return Promise.resolve(); return audio.play().catch(() => {}); };
  musicBtn.addEventListener('click', async () => {
    if (!cfg.musicUrl) { alert('Tambahkan URL file MP3 di config.js terlebih dahulu. Musik baru akan diputar setelah tombol ini ditekan.'); return; }
    if (audio.paused) { userPaused = false; try { await audio.play(); } catch { alert('Musik belum dapat diputar. Periksa URL file audio.'); } }
    else { userPaused = true; audio.pause(); }
  });
  // Coba putar otomatis saat link dibuka. Kalau diblokir browser, mulai pada sentuhan pertama (selain tombol musik).
  if (cfg.musicUrl) {
    const pemicu = ['click', 'touchend', 'keydown'];
    const pasang = () => pemicu.forEach(e => document.addEventListener(e, mulai, true));
    const lepas = () => pemicu.forEach(e => document.removeEventListener(e, mulai, true));
    function mulai(e) {
      if (e.target instanceof Element && e.target.closest('#musicToggle')) return;
      lepas();
      startMusic().then(() => { if (audio.paused && !userPaused) pasang(); });
    }
    audio.play().catch(pasang);
  }
  function tick(){const target=new Date(cfg.dateISO || '2027-06-20T08:00:00+07:00').getTime();let diff=Math.max(0,target-Date.now());const days=Math.floor(diff/86400000);diff%=86400000;const hours=Math.floor(diff/3600000);diff%=3600000;const mins=Math.floor(diff/60000);diff%=60000;const secs=Math.floor(diff/1000);$('#days').textContent=String(days).padStart(3,'0');$('#hours').textContent=String(hours).padStart(2,'0');$('#minutes').textContent=String(mins).padStart(2,'0');$('#seconds').textContent=String(secs).padStart(2,'0');}
  tick(); setInterval(tick,1000);
  const escapeHTML = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function submitRsvp(data) {
    const row = { name:data.name, attendance:data.attendance, guests:Number(data.guests || 1), note:data.note || '', created_at:new Date().toISOString() };
    if (db) { const {error}=await db.from('rsvps').insert(row); if(error) throw error; }
    else { const rows=readLocal(local.rsvps); rows.unshift({...row,id:crypto.randomUUID?.() || String(Date.now())}); writeLocal(local.rsvps,rows); }
  }
  async function submitWish(data) {
    const row={name:data.name,message:data.message,created_at:new Date().toISOString()};
    if(db){const {error}=await db.from('wishes').insert(row);if(error)throw error;}
    else{const rows=readLocal(local.wishes);rows.unshift({...row,id:crypto.randomUUID?.() || String(Date.now())});writeLocal(local.wishes,rows);}
  }
  async function loadWishes(){let rows=[];if(db){const {data,error}=await db.from('wishes').select('name,message,created_at').order('created_at',{ascending:false}).limit(30);if(error){console.warn(error);return;}rows=data||[];}else rows=readLocal(local.wishes).slice(0,30);const list=$('#wishesList');list.innerHTML='';if(!rows.length){list.innerHTML='<p class="muted-copy">Jadilah yang pertama mengirim ucapan 💌</p>';return;}rows.forEach(r=>{const el=document.createElement('article');el.className='wish-item';el.innerHTML=`<strong>${escapeHTML(r.name)}</strong><p>${escapeHTML(r.message)}</p>`;list.appendChild(el);});}
  $('#rsvpForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const msg=$('#rsvpMessage');const btn=$('button[type="submit"]',form);btn.disabled=true;msg.textContent='Mengirim...';try{await submitRsvp(Object.fromEntries(new FormData(form)));msg.textContent='Terima kasih! Konfirmasi kehadiranmu sudah tercatat ♡';form.reset();if(guest)$('#rsvpName').value=guest;}catch(err){console.error(err);msg.textContent='Belum berhasil mengirim. Coba lagi atau hubungi pengantin.';}finally{btn.disabled=false;}});
  $('#wishForm').addEventListener('submit',async e=>{e.preventDefault();const form=e.currentTarget;const msg=$('#wishMessage');const btn=$('button[type="submit"]',form);btn.disabled=true;msg.textContent='Mengirim...';try{await submitWish(Object.fromEntries(new FormData(form)));msg.textContent='Ucapan terkirim. Terima kasih atas doa baiknya! ♡';form.reset();await loadWishes();}catch(err){console.error(err);msg.textContent='Belum berhasil mengirim. Coba lagi sebentar lagi.';}finally{btn.disabled=false;}});
  const copy = async (value) => {try{await navigator.clipboard.writeText(value);$('#copyMessage').textContent='Berhasil disalin ♡';}catch{$('#copyMessage').textContent='Tidak bisa menyalin otomatis. Silakan salin: '+value;}};
  $('[data-copy-account]').addEventListener('click',()=>copy(cfg.accountNumber || '0000000000'));
  $('[data-copy-wallet]').addEventListener('click',()=>copy(cfg.giftAddress || cfg.address || ''));
  const date = new Date(cfg.dateISO || '2027-06-20T08:00:00+07:00');const stamp=date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const end=new Date(date.getTime()+3*3600000).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const cal=new URL('https://calendar.google.com/calendar/render');cal.searchParams.set('action','TEMPLATE');cal.searchParams.set('text',`Pernikahan ${cfg.bride||'Mempelai'} & ${cfg.groom||'Pasangan'}`);cal.searchParams.set('dates',`${stamp}/${end}`);cal.searchParams.set('details','Kami menantikan kehadiran dan doa restu Anda.');cal.searchParams.set('location',cfg.venue+' '+cfg.address);$('#calendarLink').href=cal.toString();
  loadWishes();
})();
