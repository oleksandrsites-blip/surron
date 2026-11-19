/* Sur-Ron Ukraine — main.js */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = id => document.getElementById(id);
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

  /* ---- header ---- */
  const hdr = $('top');
  const onScroll = () => hdr.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- hero video: легший файл на телефоні, без автоплею при reduced motion ---- */
  const hv = $('heroVideo');
  if (hv && !reduce) {
    const lite = navigator.connection && navigator.connection.saveData;
    hv.src = 'media/' + (lite ? 'hero-540.mp4' : 'hero.mp4');
    hv.addEventListener('playing', () => hv.classList.add('on'), { once: true });
    hv.addEventListener('canplay', () => hv.play().catch(() => {}), { once: true });
    hv.load();
  }

  /* ---- старт: hero «наїжджає» ---- */
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

  /* ---- заголовки секцій: рядок з-під маски ---- */
  document.querySelectorAll('h2.rv').forEach(h => {
    h.classList.remove('rv'); h.classList.add('mask');
    h.innerHTML = `<span class="ln"><span>${h.innerHTML}</span></span>`;
  });

  /* ---- поява блоків ---- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.rv,.mask,.wordmark').forEach(el => io.observe(el));

  /* ---- моделі й оплата ----
     Ставки — приклад з payments.md, замінити на реальні з кабінетів мерчанта клієнта. */
  const RATES = { card: 1.5, invoice: 0, privat: { 3: 3.5, 6: 5.5, 12: 7.5, 24: 14.5 }, mono: { 3: 3.9, 6: 5.9, 12: 7.9, 24: 15 } };
  const PAY_NAME = { card: 'Картка', invoice: 'Рахунок', privat: 'Приват частинами', mono: 'mono частинами' };
  const M = {
    hyper: { n: 'Hyper Bee', y: '', sub: 'Легкий старт: 39 кг, для підлітка або першого байка.', img: 'hyperbee', w: 934, h: 707, p: 144500, old: 149000, stock: true,
      d: ['64 км/год', 'до 56 км', '39 кг', '5 кВт'], hs: ['Мотор 5 кВт', 'Батарея 58 В · 22 А·год', 'Вага всього 39 кг'] },
    lbx: { n: 'Light Bee X', y: '2025', sub: 'Хіт продажів: місто, ліс і перший серйозний байк.', img: 'lightbee-x', w: 1400, h: 727, p: 202000, old: 207000, stock: true,
      d: ['75 км/год', 'до 75 км', '57 кг', '8 кВт'], hs: ['Мотор 8 кВт', 'Батарея 60 В · 40 А·год', 'Хід вилки 198 мм'] },
    ultra: { n: 'Ultra Bee', y: '', sub: '22,5 кВт для дорослого райдера: траса й ендуро.', img: 'ultrabee', w: 1400, h: 759, p: null, stock: false,
      d: ['110 км/год', 'до 120 км', '132 кг', '22,5 кВт'], hs: ['Мотор 22,5 кВт', 'Батарея 104 В · 55 А·год', 'Вага 132 кг'] }
  };
  let cur = 'lbx', method = 'card', months = 12, shown = 0, raf;

  const isInst = () => method === 'privat' || method === 'mono';
  function calc() {
    const m = M[cur]; if (!m.p) return null;
    const r = isInst() ? RATES[method][months] : RATES[method];
    const total = m.p * (1 + r / 100);
    return { total, to: isInst() ? Math.ceil(total / months) : total };
  }
  function render(animate = true) {
    const m = M[cur]; $('panel').classList.toggle('order', !m.p);
    const c = calc(); if (!c) return;
    const inst = isInst(), unit = inst ? ' ₴/міс' : ' ₴';
    $('months').classList.toggle('dim', !inst);
    const word = [2, 3, 4].includes(months % 10) && ![12, 13, 14].includes(months % 100) ? 'платежі' : 'платежів';
    $('sumSub').textContent = inst ? `${months} ${word} · разом ${fmt(c.total)} ₴`
      : method === 'card' ? 'разом, оплата карткою' : 'безготівковий рахунок, без комісії';
    $('buyBtn').textContent = inst ? `Оформити: ${fmt(c.to)} ₴ × ${months}` : `Оформити за ${fmt(c.to)} ₴`;
    $('old').innerHTML = m.old ? `<s>${fmt(m.old)} ₴</s>−${fmt(m.old - m.p)} ₴` : '';
    cancelAnimationFrame(raf);
    if (!animate || reduce || !shown) { $('big').textContent = fmt(c.to) + unit; shown = c.to; return; }
    const from = shown, t0 = performance.now(); shown = c.to;
    const step = t => {
      const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 4);
      $('big').textContent = fmt(from + (c.to - from) * e) + unit;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function seg(id, attr, cb) {
    $(id).addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      $(id).querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
      cb(b.dataset[attr]); render();
    });
  }
  seg('pay', 'p', v => method = v);
  seg('months', 'n', v => months = +v);

  function pick(key) {
    if (key === cur) return;
    const b = document.querySelector(`#tabs [data-m="${key}"]`);
    $('tabs').querySelectorAll('button').forEach(x => x.setAttribute('aria-selected', x === b));
    $('panel').setAttribute('aria-labelledby', b.id);
    cur = key; const m = M[key], img = $('bike');
    const SH = 'drop-shadow(0 34px 28px rgba(0,0,0,.55))';
    img.style.opacity = 0; img.style.transform = 'translateX(-50px)'; img.style.filter = `blur(6px) ${SH}`; $('ghost').style.opacity = 0;
    document.querySelectorAll('.hs').forEach(x => x.setAttribute('aria-expanded', 'false'));
    setTimeout(() => {
      img.src = `img/${m.img}.webp`; img.width = m.w; img.height = m.h; img.alt = `Sur-Ron ${m.n} ${m.y}, вигляд збоку`.replace('  ', ' ');
      $('ghost').textContent = m.n.toUpperCase();
      $('pName').innerHTML = m.n + (m.y ? ` <em>${m.y}</em>` : '');
      $('pSub').textContent = m.sub;
      $('status').innerHTML = m.stock ? '<span class="dot"></span>В наявності у Києві' : '<span class="dot off"></span>Під замовлення';
      ['d1', 'd2', 'd3', 'd4'].forEach((id, i) => $(id).textContent = m.d[i]);
      ['hs1', 'hs2', 'hs3'].forEach((id, i) => $(id).textContent = m.hs[i]);
      img.style.transition = 'none'; img.style.transform = 'translateX(70px)'; img.style.filter = `blur(8px) ${SH}`; img.offsetWidth; img.style.transition = '';
      img.style.opacity = 1; img.style.transform = 'none'; img.style.filter = SH; $('ghost').style.opacity = 1;
      $('cap').textContent = 'Натисніть на точку — покажемо деталь'; $('cap').classList.remove('on');
      shown = 0; render(false);
    }, reduce ? 0 : 300);
  }
  $('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) pick(b.dataset.m); });
  /* стрілки на вкладках */
  $('tabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const bs = [...$('tabs').querySelectorAll('button')], i = bs.indexOf(document.activeElement);
    const n = bs[(i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length];
    n.focus(); pick(n.dataset.m);
  });
  document.querySelectorAll('[data-pick]').forEach(a => a.addEventListener('click', () => pick(a.dataset.pick)));

  document.querySelectorAll('.hs').forEach(h => h.addEventListener('click', () => {
    const open = h.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.hs').forEach(x => x.setAttribute('aria-expanded', 'false'));
    h.setAttribute('aria-expanded', open);
    $('cap').textContent = open ? h.querySelector('span').textContent : 'Натисніть на точку — покажемо деталь';
    $('cap').classList.toggle('on', open);
  }));
  render(false);

  /* ---- сцени: скрол перемикає відео й факти ---- */
  const sc = $('ride');
  if (sc) {
    const vids = [...sc.querySelectorAll('video')], items = [...sc.querySelectorAll('.sc-list li')],
      bars = [...sc.querySelectorAll('.sc-bars b')];
    let idx = 0, loaded = false, visible = false, ticking = false;
    const load = () => {
      if (loaded) return; loaded = true;
      vids.forEach(v => { v.preload = reduce ? 'metadata' : 'auto'; v.src = v.dataset.src; v.load(); });
    };
    const playActive = () => vids.forEach((v, i) => {
      if (i === idx && visible && !reduce) v.play().catch(() => {}); else v.pause();
    });
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) load();
    }), { rootMargin: '150% 0px' }).observe(sc);
    new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; playActive(); })).observe(sc);
    const update = () => {
      ticking = false;
      const r = sc.getBoundingClientRect(), total = sc.offsetHeight - innerHeight;
      const p = Math.min(Math.max(-r.top / total, 0), .9999), n = Math.floor(p * 4), sub = p * 4 - n;
      bars.forEach((b, i) => b.style.width = (i < n ? 100 : i === n ? sub * 100 : 0) + '%');
      if (n !== idx) {
        idx = n;
        vids.forEach((v, i) => v.classList.toggle('on', i === n));
        items.forEach((li, i) => li.classList.toggle('on', i === n));
        playActive();
      }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---- фонове відео фінального блоку: вантажимо й граємо лише у кадрі ---- */
  document.querySelectorAll('.final video[data-src]').forEach(v => {
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!v.src) { v.src = v.dataset.src; v.load(); } if (!reduce) v.play().catch(() => {}); }
      else v.pause();
    }), { rootMargin: '200px 0px' }).observe(v);
  });

  /* ---- плавний скрол на ноутбуці (Lenis) ---- */
  let lenis = null;
  if (window.Lenis && !reduce && matchMedia('(pointer: fine)').matches) {
    document.documentElement.style.scrollBehavior = 'auto';
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    const loop = t => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); if (id.length < 2) { e.preventDefault(); lenis.scrollTo(0); return; }
      const t = document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { duration: 1.4 });
    });
  }

  /* ---- форма заявки ---- */
  const sheet = $('sheet'), form = $('leadForm');
  function summary() {
    const m = M[cur], c = calc();
    const name = `${m.n}${m.y ? ' ' + m.y : ''}`;
    const pay = !c ? 'Під замовлення — ціну назвемо'
      : isInst() ? `${PAY_NAME[method]} · ${months} × ${fmt(c.to)} ₴` : `${PAY_NAME[method]} · ${fmt(c.to)} ₴`;
    return { name, pay, img: m.img, w: m.w, h: m.h };
  }
  let reqType = 'Покупка';
  document.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    const s = summary(), test = b.dataset.open === 'test';
    reqType = test ? 'Тест-драйв' : 'Покупка';
    $('sheetTitle').textContent = test ? 'Запис на тест-драйв' : 'Заявка на байк';
    $('oName').textContent = test ? `Тест-драйв: ${s.name}` : s.name;
    if (test) $('oPay').textContent = 'Київ, вул. Старонаводницька,\u00a04';
    else $('oPay').innerHTML = s.pay.replace(/([\d ]+ ₴)$/, '<em>$1</em>');
    $('eSend').textContent = '';
    $('oImg').src = `img/${s.img}.webp`; $('oImg').width = s.w; $('oImg').height = s.h;
    sheet.classList.remove('sent'); sheet.showModal(); lenis && lenis.stop();
  }));
  const close = () => sheet.close();
  sheet.addEventListener('close', () => lenis && lenis.start());
  $('sheetClose').addEventListener('click', close);
  $('sheetDone').addEventListener('click', close);
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });

  function check(input, errEl, ok, msg) {
    input.setAttribute('aria-invalid', !ok); errEl.textContent = ok ? '' : msg; return ok;
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('fName'), p = $('fPhone');
    const okN = check(n, $('eName'), n.value.trim().length >= 2, 'Вкажіть ім\'я — щоб знати, як до вас звертатись');
    const okP = check(p, $('ePhone'), p.value.replace(/\D/g, '').length >= 10, 'Перевірте номер: потрібно щонайменше 10 цифр');
    if (!okN) { n.focus(); return; } if (!okP) { p.focus(); return; }
    const btn = $('sendBtn'), s = summary(), fd = new FormData(form);
    btn.disabled = true; btn.textContent = 'Надсилаємо…'; $('eSend').textContent = '';
    fetch('/api/lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: n.value, phone: p.value, via: fd.get('way'), company: fd.get('company'),
        type: reqType, model: s.name, payment: reqType === 'Покупка' ? s.pay : '' })
    }).then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (!d.ok) throw 0; sheet.classList.add('sent'); form.reset(); })
      .catch(() => { $('eSend').textContent = 'Не вдалося надіслати. Подзвоніть нам: +38 050 695 52 99'; })
      .finally(() => { btn.disabled = false; btn.textContent = 'Надіслати заявку — передзвонимо'; });
  });
})();
