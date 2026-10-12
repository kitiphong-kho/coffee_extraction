/* Book shell: top bar, contents sidebar, reading progress, glossary & citation
   popovers, objectives, quizzes, summaries, pager, and per-reader progress. */
(function(){
  'use strict';
  var B = window.BOOK;
  var page = document.body.getAttribute('data-page');
  var chapter = B.chapters.filter(function(c){ return c.id === page; })[0] || null;

  /* ---------- storage (per-reader conveniences only) ---------- */
  var store = {
    get: function(k, d){ try { var v = localStorage.getItem('book.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function(k, v){ try { localStorage.setItem('book.' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- helpers ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs){ var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function el(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function fmtTime(sec){ var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function chapterState(id){
    var q = store.get('quiz.' + id, null), read = store.get('read.' + id, false);
    if (q && q.done) return { cls: 'done', text: 'ทำแบบทดสอบแล้ว ' + q.correct + '/' + q.total };
    if (read) return { cls: 'read', text: 'อ่านแล้ว' };
    return { cls: '', text: '' };
  }
  function chapterLabel(c){ return c.back ? c.title : (c.supp ? 'บทเสริม ' : 'บทที่ ') + c.n; }
  window.Book = { store: store, svgEl: svgEl, el: el, fmtTime: fmtTime, NS: NS };

  /* ---------- theme ---------- */
  var root = document.documentElement;
  function isDark(){ var t = root.getAttribute('data-theme'); return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; }
  var ICON = {
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>',
    read: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5q4-2 8 0v14q-4-2-8 0z"/><path d="M20 5.5q-4-2-8 0v14q4-2 8 0z"/></svg>',
    visual: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/></svg>'
  };

  /* ---------- top bar ---------- */
  var bar = el('header', 'topbar');
  bar.innerHTML =
    '<button class="tb-btn tb-menu" type="button" aria-label="เปิดสารบัญ" aria-controls="toc-side" aria-expanded="false">' + ICON.menu + '</button>' +
    '<a class="tb-book" href="index.html"><span class="seal" aria-hidden="true">ก</span><span>' + B.title + '</span></a>' +
    (chapter ? '<span class="tb-sep" aria-hidden="true"></span><span class="tb-chapter"><b>' + chapterLabel(chapter) + '</b>' + (chapter.back ? '' : ' · ' + chapter.title) + '</span>' : '') +
    '<span class="tb-spacer"></span>' +
    '<div class="tb-mode" role="group" aria-label="โหมดการอ่าน">' +
      '<button type="button" data-mode="read" title="อ่านละเอียด: แสดงเนื้อหาครบ">' + ICON.read + '<span>ละเอียด</span></button>' +
      '<button type="button" data-mode="visual" title="เน้นภาพ: สาระสำคัญสั้น ๆ กับรูป">' + ICON.visual + '<span>เน้นภาพ</span></button>' +
    '</div>' +
    '<button class="tb-btn tb-theme" type="button"></button>' +
    '<div class="tb-progress" aria-hidden="true"><i></i></div>';
  document.body.insertBefore(bar, document.body.firstChild);
  var themeBtn = bar.querySelector('.tb-theme');
  function paintTheme(){
    var dark = isDark();
    themeBtn.innerHTML = dark ? ICON.sun : ICON.moon;
    themeBtn.setAttribute('aria-label', dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด');
  }
  themeBtn.addEventListener('click', function(){
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store.set('theme', next);
    paintTheme();
    document.dispatchEvent(new CustomEvent('book:theme'));
  });
  paintTheme();

  /* ---------- reading mode: ละเอียด / เน้นภาพ ---------- */
  var modeBtns = bar.querySelectorAll('.tb-mode button');
  var toast = el('div', 'mode-toast');
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var toastT = null;
  function currentMode(){ return root.getAttribute('data-mode') === 'visual' ? 'visual' : 'read'; }
  function paintMode(){ modeBtns.forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-mode') === currentMode() ? 'true' : 'false'); }); }
  function setMode(mode){
    if (mode === currentMode()) return;
    // keep the reader on the same section: remember where its heading sits, restore after the reflow
    // (the first heading/figure at or below the top bar; these blocks exist in both modes)
    var anchor = null, before = 0;
    var blocks = document.querySelectorAll('.chapter-open, .cover, .prose h2[id], .prose > .fig, .prose > .tbl-wrap, .quiz, .summary');
    for (var i = 0; i < blocks.length && !anchor; i++){
      if (blocks[i].offsetParent && blocks[i].getBoundingClientRect().top >= 50) anchor = blocks[i];
    }
    if (anchor) before = anchor.getBoundingClientRect().top;
    if (mode === 'visual') root.setAttribute('data-mode', 'visual'); else root.removeAttribute('data-mode');
    store.set('mode', mode);
    paintMode();
    if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
    toast.textContent = mode === 'visual' ? 'โหมดเน้นภาพ · แสดงสาระสำคัญสั้น ๆ กับรูป' : 'โหมดละเอียด · แสดงเนื้อหาครบทุกย่อหน้า';
    toast.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
    hidePop();
    window.dispatchEvent(new Event('resize'));
  }
  modeBtns.forEach(function(b){ b.addEventListener('click', function(){ setMode(b.getAttribute('data-mode')); }); });
  paintMode();

  /* ---------- contents sidebar ---------- */
  var side = el('nav', 'toc-side');
  side.id = 'toc-side';
  side.setAttribute('aria-label', 'สารบัญ');
  var html = '<p class="toc-head">สารบัญ</p><ol class="toc-list">';
  html += '<li class="toc-ch' + (page === 'index' ? ' current' : '') + '"><a class="toc-ch-link" href="index.html"><span class="toc-n">—</span><span class="toc-t">หน้าปกและวิธีใช้ตำรา</span><span></span></a></li>';
  B.chapters.forEach(function(c){
    var st = chapterState(c.id), cur = c.id === page;
    if (c.back) html += '<li class="toc-divider" role="presentation"></li>';
    html += '<li class="toc-ch' + (cur ? ' current' : '') + '"><a class="toc-ch-link" href="' + c.file + '"' + (cur ? ' aria-current="page"' : '') + '>' +
      '<span class="toc-n">' + c.n + '</span><span class="toc-t">' + c.title + (c.supp ? '<small>บทเสริม</small>' : '') + '</span>' +
      '<span class="toc-state ' + st.cls + '" title="' + st.text + '"></span></a>';
    if (cur){
      html += '<ul class="toc-secs">';
      c.secs.forEach(function(s){ html += '<li><a href="#' + s[2] + '" data-sec="' + s[2] + '"><span class="no">' + s[0] + '</span>' + s[1] + '</a></li>'; });
      html += '</ul>';
    }
    html += '</li>';
  });
  html += '</ol><p class="toc-foot">จัดทำโดย ' + B.credit + '</p>';
  side.innerHTML = html;
  document.body.insertBefore(side, bar.nextSibling);
  var scrim = el('div', 'scrim');
  document.body.appendChild(scrim);
  var menuBtn = bar.querySelector('.tb-menu');
  function setDrawer(open){
    document.body.classList.toggle('toc-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open){ var a = side.querySelector('a'); if (a) a.focus(); }
  }
  menuBtn.addEventListener('click', function(){ setDrawer(!document.body.classList.contains('toc-open')); });
  scrim.addEventListener('click', function(){ setDrawer(false); });
  side.addEventListener('click', function(e){ if (e.target.closest('a')) setDrawer(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ setDrawer(false); hidePop(); } });

  /* ---------- scrollspy + reading progress ---------- */
  var secLinks = side.querySelectorAll('.toc-secs a');
  var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id]'));
  var progressBar = bar.querySelector('.tb-progress i');
  var readMarked = store.get('read.' + page, false);
  function onScroll(){
    var y = window.pageYOffset, max = document.documentElement.scrollHeight - window.innerHeight;
    var f = max > 0 ? Math.min(1, y / max) : 1;
    progressBar.style.width = (f * 100).toFixed(1) + '%';
    if (chapter && !readMarked && f > 0.92){ readMarked = true; store.set('read.' + page, true); refreshStates(); }
    var active = null;
    heads.forEach(function(h){ if (h.getBoundingClientRect().top < 140) active = h.id; });
    secLinks.forEach(function(a){ a.classList.toggle('active', a.getAttribute('data-sec') === active); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  function refreshStates(){
    B.chapters.forEach(function(c){
      var st = chapterState(c.id);
      side.querySelectorAll('.toc-ch-link[href="' + c.file + '"] .toc-state').forEach(function(s){ s.className = 'toc-state ' + st.cls; s.title = st.text; });
      document.querySelectorAll('[data-state-for="' + c.id + '"]').forEach(function(s){ s.className = 'tf-state ' + st.cls; s.textContent = st.text; });
    });
  }

  /* ---------- glossary & citation popovers ---------- */
  var pop = el('div', 'pop');
  pop.setAttribute('role', 'tooltip');
  pop.id = 'book-pop';
  pop.hidden = true;
  document.body.appendChild(pop);
  var popFor = null, hoverT = null;
  function popContent(a){
    if (a.hasAttribute('data-term')){
      var key = a.getAttribute('data-term'), g = B.glossary[key];
      if (!g) return null;
      return '<h4>' + g[0] + '<small>' + g[1] + '</small></h4><p>' + g[2] + '</p><a class="pop-more" href="appendix.html#g-' + key + '">ดูในอภิธานศัพท์ →</a>';
    }
    var n = a.getAttribute('data-ref'), r = B.refs[n];
    if (!r) return null;
    return '<h4>อ้างอิง [' + n + ']</h4><p>' + r[0] + (r[1] ? '<br><small style="color:var(--ink-dim)">' + r[1] + '</small>' : '') + '</p><a class="pop-more" href="appendix.html#ref-' + n + '">ดูบรรณานุกรม →</a>';
  }
  function showPop(a){
    var c = popContent(a);
    if (!c) return;
    pop.innerHTML = c;
    pop.hidden = false;
    popFor = a;
    a.setAttribute('aria-describedby', 'book-pop');
    var r = a.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.max(16, Math.min(window.innerWidth - pw - 16, r.left + r.width / 2 - pw / 2));
    var top = r.bottom + 8;
    if (top + ph > window.innerHeight - 8 && r.top - ph - 8 > 60) top = r.top - ph - 8;
    pop.style.left = (left + window.pageXOffset) + 'px';
    pop.style.top = (top + window.pageYOffset) + 'px';
  }
  function hidePop(){
    if (popFor) popFor.removeAttribute('aria-describedby');
    pop.hidden = true; popFor = null;
  }
  // delegated, so terms and citations rendered later by widgets get popovers too
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  // in visual mode the definitions are hidden, so a whole term card opens its definition
  var POP_SEL = '.term[data-term], sup.cite a[data-ref], :root[data-mode="visual"] .terms > div[data-term]';
  document.addEventListener('click', function(e){
    var a = e.target.closest(POP_SEL);
    if (a){ e.preventDefault(); clearTimeout(hoverT); if (popFor === a && !finePointer) hidePop(); else showPop(a); return; }
    if (popFor && !pop.contains(e.target)) hidePop();
  });
  document.addEventListener('focusin', function(e){ var a = e.target.closest(POP_SEL); if (a && a.matches(':focus-visible')) showPop(a); });
  document.addEventListener('focusout', function(e){
    if (e.target.closest(POP_SEL)) setTimeout(function(){ if (!pop.contains(document.activeElement)) hidePop(); }, 120);
  });
  if (finePointer){
    document.addEventListener('mouseover', function(e){
      var a = e.target.closest(POP_SEL);
      if (a){ clearTimeout(hoverT); if (popFor !== a) hoverT = setTimeout(function(){ showPop(a); }, 220); }
      else if (pop.contains(e.target)) clearTimeout(hoverT);
    });
    document.addEventListener('mouseout', function(e){
      var a = e.target.closest(POP_SEL);
      if (a || pop.contains(e.target)){
        clearTimeout(hoverT);
        hoverT = setTimeout(function(){ if (!pop.matches(':hover') && !(popFor && popFor.matches(':hover'))) hidePop(); }, 260);
      }
    });
  }
  window.addEventListener('resize', hidePop);

  /* ---------- learning objectives ---------- */
  document.querySelectorAll('[data-obj]').forEach(function(box){
    var items = B.objectives[box.getAttribute('data-obj')] || [];
    box.classList.add('objectives');
    box.innerHTML = '<p class="obj-title">วัตถุประสงค์การเรียนรู้ · เมื่อจบบทนี้ ผู้อ่านจะสามารถ</p><ol>' +
      items.map(function(s){ return '<li>' + s + '</li>'; }).join('') + '</ol>';
  });

  /* ---------- chapter summary ---------- */
  document.querySelectorAll('[data-summary]').forEach(function(box){
    var items = B.summaries[box.getAttribute('data-summary')] || [];
    box.classList.add('summary');
    box.innerHTML = '<h2>สรุปท้ายบท</h2><ul>' + items.map(function(s){ return '<li>' + s + '</li>'; }).join('') + '</ul>';
  });

  /* ---------- end-of-chapter quiz ---------- */
  var LETTERS = ['ก', 'ข', 'ค', 'ง'];
  function buildQuiz(box){
    var id = box.getAttribute('data-quiz'), qs = B.quizzes[id] || [];
    var answered = 0, correct = 0;
    var prev = store.get('quiz.' + id, null);
    box.innerHTML = '';
    var wrap = el('div', 'quiz-box');
    var head = el('div', 'quiz-head', '<h2>แบบทดสอบท้ายบท</h2><p>' + qs.length + ' ข้อ · เลือกแล้วเห็นเหตุผลทันที ทำซ้ำได้ไม่จำกัด' +
      (prev && prev.done ? ' · ครั้งล่าสุดได้ ' + prev.correct + '/' + prev.total : '') + '</p>');
    wrap.appendChild(head);
    var score = el('div', 'quiz-score');
    score.hidden = true;
    qs.forEach(function(item, qi){
      var q = el('div', 'quiz-q');
      q.appendChild(el('p', 'q-text', '<span class="qn">ข้อ ' + (qi + 1) + '</span>' + item.q));
      var opts = el('div', 'quiz-opts');
      var fb = el('p', 'quiz-fb'); fb.hidden = true; fb.setAttribute('aria-live', 'polite');
      var btns = item.o.map(function(label, i){
        var b = el('button', 'quiz-opt', '<span class="ol">' + LETTERS[i] + '</span><span></span>');
        b.type = 'button';
        b.lastChild.textContent = label;
        b.addEventListener('click', function(){
          btns.forEach(function(x, j){ x.disabled = true; if (j === item.a) x.classList.add('right'); });
          if (i !== item.a) b.classList.add('wrong');
          fb.innerHTML = '<b>' + (i === item.a ? 'ถูกต้อง' : 'ยังไม่ใช่') + '</b> · ';
          fb.appendChild(document.createTextNode(item.e));
          fb.hidden = false;
          answered++; if (i === item.a) correct++;
          if (answered === qs.length){
            store.set('quiz.' + id, { done: true, correct: correct, total: qs.length });
            refreshStates();
            score.hidden = false;
            score.innerHTML = '<span>ตอบถูก ' + correct + ' จาก ' + qs.length + ' ข้อ</span>';
            var again = el('button', 'btn small', 'ทำใหม่');
            again.type = 'button';
            again.addEventListener('click', function(){ buildQuiz(box); });
            score.appendChild(again);
          }
        });
        opts.appendChild(b);
        return b;
      });
      q.appendChild(opts); q.appendChild(fb);
      wrap.appendChild(q);
    });
    wrap.appendChild(score);
    box.appendChild(wrap);
  }
  document.querySelectorAll('[data-quiz]').forEach(buildQuiz);

  /* ---------- pager + colophon ---------- */
  document.querySelectorAll('.pager[data-auto]').forEach(function(nav){
    var order = [{ file: 'index.html', label: 'หน้าปก', title: 'สารบัญและวิธีใช้ตำรา' }].concat(B.chapters.map(function(c){ return { file: c.file, label: chapterLabel(c), title: c.back ? c.en : c.title }; }));
    var i = order.map(function(o){ return o.file; }).indexOf(chapter ? chapter.file : 'index.html');
    var out = '';
    if (i > 0) out += '<a class="prev" href="' + order[i - 1].file + '"><small>← ก่อนหน้า · ' + order[i - 1].label + '</small><span>' + order[i - 1].title + '</span></a>';
    if (i < order.length - 1) out += '<a class="next" href="' + order[i + 1].file + '"><small>ถัดไป · ' + order[i + 1].label + ' →</small><span>' + order[i + 1].title + '</span></a>';
    nav.setAttribute('aria-label', 'เปลี่ยนบท');
    nav.innerHTML = out;
  });
  document.querySelectorAll('.colophon[data-auto]').forEach(function(f){
    f.innerHTML = '<strong>' + B.title + '</strong> · ' + B.series + '<br>จัดทำโดย ' + B.credit +
      '<br>ตัวเลขและแบบจำลองในตำรานี้ทำให้เรียบง่ายเพื่อการเรียนรู้ ดู<a href="appendix.html#limits">ที่มาและข้อจำกัด</a>';
  });

  /* ---------- front matter: full contents + resume ---------- */
  var tocFull = document.getElementById('toc-full');
  if (tocFull){
    tocFull.innerHTML = B.chapters.map(function(c){
      var st = chapterState(c.id);
      return '<li><a class="tf-ch" href="' + c.file + '"><span class="tf-n">' + c.n + '</span><span class="tf-title">' + c.title +
        '<small>' + (c.supp ? 'บทเสริม · ' : '') + c.en + '</small></span><span class="tf-state ' + st.cls + '" data-state-for="' + c.id + '">' + st.text + '</span></a>' +
        '<ul class="tf-secs">' + c.secs.map(function(s){ return '<li><a href="' + c.file + '#' + s[2] + '"><span class="no">' + s[0] + '</span>' + s[1] + '</a></li>'; }).join('') + '</ul></li>';
    }).join('');
  }
  var resume = document.getElementById('resume');
  if (resume){
    var last = store.get('lastChapter', null);
    if (last && last.file){
      resume.hidden = false;
      resume.innerHTML = '<span>อ่านค้างไว้ที่ <strong></strong></span><a class="btn primary small" href="' + last.file + '">อ่านต่อ →</a>';
      resume.querySelector('strong').textContent = last.label;
    }
  }
  if (chapter) store.set('lastChapter', { file: chapter.file, label: chapterLabel(chapter) + (chapter.back ? '' : ' · ' + chapter.title) });

  /* ---------- appendix: glossary + bibliography ---------- */
  var glossList = document.getElementById('glossary-list');
  if (glossList){
    var keys = Object.keys(B.glossary).sort(function(a, b){ return B.glossary[a][0].localeCompare(B.glossary[b][0], 'en'); });
    glossList.innerHTML = keys.map(function(k){
      var g = B.glossary[k];
      return '<div data-term="' + k + '"><dt id="g-' + k + '">' + g[0] + '<small>' + g[1] + '</small></dt><dd>' + g[2] + '</dd></div>';
    }).join('');
  }
  var biblio = document.getElementById('biblio-list');
  if (biblio){
    biblio.innerHTML = Object.keys(B.refs).sort(function(a, b){ return a - b; }).map(function(n){
      var r = B.refs[n];
      return '<li id="ref-' + n + '"><span>' + r[0] + (r[1] ? '<span class="via">' + r[1] + '</span>' : '') + '</span></li>';
    }).join('');
  }

  /* ---------- animate concept curves when they scroll into view ---------- */
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.35 });
    document.querySelectorAll('.concept-svg').forEach(function(s){ io.observe(s); });
  }

  onScroll();
  if (location.hash){
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function(){ t.scrollIntoView(); }, 30);
  }
})();
