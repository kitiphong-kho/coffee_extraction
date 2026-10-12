/* บทที่ 3 และ 5 — step-by-step brew guides: pour-profile chart, brew timer,
   the basic 1:15 recipe and the world recipes. */
(function(){
  'use strict';
  var Book = window.Book, fmtTime = Book.fmtTime;
  var MONO = 'IBM Plex Mono, monospace';

  /* ---------- top-view step icons (use the #ico-dripper symbol on the page) ---------- */
  var STEP_ICONS = {
    bloom: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><circle cx="60" cy="44" r="3.5" fill="var(--coffee)" fill-opacity="0.75"></circle><circle cx="70" cy="54" r="2.6" fill="var(--coffee)" fill-opacity="0.55"></circle><circle cx="49" cy="57" r="1.8" fill="var(--coffee)" fill-opacity="0.4"></circle></svg>',
    spiral: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><path d="M63,50 L63.1,53.1 L60,55.6 L55.1,54.9 L51.8,50 L53.2,43.2 L60,39.1 L68.6,41.4 L73.5,50 L70.5,60.5 L60,66.1 L47.7,62.3 L41.3,50 L45.8,35.8 L60,28.6 L76,34 L84,50" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><path d="M84,50 l-0.9,-7.9 M84,50 l-5.8,-5.5" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round"></path></svg>',
    fill: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><circle cx="60" cy="50" r="26" fill="var(--coffee)" fill-opacity="0.42"></circle></svg>',
    drawdown: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><circle cx="60" cy="50" r="26" fill="var(--coffee)" fill-opacity="0.12"></circle><circle cx="60" cy="50" r="4.5" fill="var(--paper)" stroke="var(--line)" stroke-width="1.5"></circle><circle cx="60" cy="50" r="1.6" fill="var(--coffee)" fill-opacity="0.8"></circle></svg>',
    center: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><circle cx="60" cy="50" r="9" fill="var(--rust)" fill-opacity="0.5"></circle><circle cx="60" cy="50" r="2" fill="var(--coffee)"></circle></svg>',
    spin: '<svg viewBox="0 0 120 100" aria-hidden="true"><use href="#ico-dripper"></use><path d="M93.9,28.8 A40,40 0 0,1 93.9,71.2" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round"></path><path d="M93.9,71.2 l-6,-1 M93.9,71.2 l-1.5,6" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round"></path><path d="M26.1,71.2 A40,40 0 0,1 26.1,28.8" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round"></path><path d="M26.1,28.8 l6,1 M26.1,28.8 l1.5,-6" fill="none" stroke="var(--coffee)" stroke-width="2" stroke-linecap="round"></path></svg>'
  };

  /* ---------- pour profile: cumulative water vs time ---------- */
  var PROFILE_ARGS = {};
  function drawProfile(id, steps, total, water){
    var svg = document.getElementById(id);
    if (!svg || !total || !water) return;
    var W = Math.max(300, Math.round(svg.getBoundingClientRect().width) || (PROFILE_ARGS[id] && PROFILE_ARGS[id][3]) || 600);
    PROFILE_ARGS[id] = [steps, total, water, W];
    var H = W < 520 ? 200 : 210;
    var P = { l: 50, r: 16, t: 16, b: 30 }, pw = W - P.l - P.r, ph = H - P.t - P.b;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    function X(t){ return P.l + Math.max(0, Math.min(total, t)) / total * pw; }
    function Y(g){ return P.t + (1 - g / water) * ph; }
    var out = '';
    [0, 0.5, 1].forEach(function(f){
      var g = Math.round(water * f), y = Y(g);
      out += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)" stroke-width="1"' + (f ? ' stroke-dasharray="3 4"' : '') + '/>';
      out += '<text x="' + (P.l - 13) + '" y="' + (y + 4) + '" text-anchor="end" font-size="11" fill="var(--ink-dim)" font-family="' + MONO + '">' + g + 'g</text>';
    });
    var tick = total <= 200 ? 30 : 60;
    for (var t = 0; t <= total + 0.1; t += tick){
      out += '<text x="' + X(t) + '" y="' + (H - 9) + '" text-anchor="middle" font-size="11" fill="var(--ink-dim)" font-family="' + MONO + '">' + fmtTime(Math.round(t)) + '</text>';
    }
    var pts = [[0, 0]], prev = 0, marks = [];
    steps.forEach(function(st, i){
      var start = Math.min(st.timeSec, total);
      var next = steps[i + 1] ? Math.min(steps[i + 1].timeSec, total) : total;
      if (st.pour > 0){
        var dur = Math.max(4, Math.min(15, (next - start) * 0.6));
        if (start + dur > total) start = Math.max(0, total - dur);
        pts.push([start, prev]); pts.push([start + dur, st.cumulative]);
        marks.push([start, prev, i + 1]);
        prev = st.cumulative;
      } else {
        marks.push([start, prev, i + 1]);
      }
    });
    pts.push([total, prev]);
    var d = pts.map(function(p, i){ return (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1); }).join(' ');
    out += '<path d="' + d + ' L' + X(total) + ',' + Y(0) + ' L' + X(0) + ',' + Y(0) + ' Z" fill="var(--caramel)" fill-opacity=".18"/>';
    out += '<path d="' + d + '" fill="none" stroke="var(--caramel)" stroke-width="2.5" stroke-linejoin="round"/>';
    out += '<line id="' + id + '-ph" x1="' + X(0) + '" x2="' + X(0) + '" y1="' + P.t + '" y2="' + (H - P.b) + '" stroke="var(--coffee-strong)" stroke-width="2" opacity="0"/>';
    marks.forEach(function(m){
      var cx = X(m[0]), cy = Y(m[1]);
      out += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="9" fill="var(--coffee)" stroke="var(--paper)" stroke-width="2"/>';
      out += '<text x="' + cx.toFixed(1) + '" y="' + (cy + 3.8).toFixed(1) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--paper)" font-family="' + MONO + '">' + m[2] + '</text>';
    });
    svg.innerHTML = out;
  }
  function moveProfileHead(id, elapsed, total){
    var ph = document.getElementById(id + '-ph'), a = PROFILE_ARGS[id];
    if (!ph || !a) return;
    var x = 50 + Math.min(1, elapsed / total) * (a[3] - 66);
    ph.setAttribute('x1', x); ph.setAttribute('x2', x);
    ph.setAttribute('opacity', elapsed > 0 ? '1' : '0');
  }
  var resizeT = null;
  window.addEventListener('resize', function(){
    clearTimeout(resizeT);
    resizeT = setTimeout(function(){
      Object.keys(PROFILE_ARGS).forEach(function(id){
        var a = PROFILE_ARGS[id], svg = document.getElementById(id), w = svg ? Math.round(svg.getBoundingClientRect().width) : 0;
        if (w && w !== a[3]) drawProfile(id, a[0], a[1], a[2]);
      });
    }, 150);
  });

  /* ---------- step cards ---------- */
  function renderCards(container, steps){
    container.innerHTML = '';
    steps.forEach(function(s, i){
      var card = document.createElement('div');
      card.className = 'recipe-card';
      card.dataset.timeSec = s.timeSec;
      card.dataset.stepLabel = 'ขั้นที่ ' + (i + 1) + ' · ' + s.label;
      card.innerHTML =
        '<div class="rc-head"><span class="rc-step">ขั้นที่ ' + (i + 1) + ' · ' + s.label + '</span><span class="rc-time">' + fmtTime(Math.round(s.timeSec)) + '</span></div>' +
        s.icon +
        '<div class="rc-stats">' + (s.pour > 0 ? '<span>เทน้ำ: <strong>' + s.pour + ' g</strong></span>' : '<span>ไม่เทเพิ่ม</span>') +
        '<span>ปริมาตรรวม: <strong>' + s.cumulative + ' g</strong></span></div>' +
        '<p class="rc-text">' + s.text + '</p>';
      container.appendChild(card);
    });
  }

  /* ---------- brew timer (one instance per guide; speed is shared) ---------- */
  var TIMER_SPEED = 1; // ×10 makes one real second count as ten timer seconds
  var timers = [];
  function BrewTimer(prefix, cardsId, profileId, getTotal){
    var self = this;
    this.running = false; this.pausedElapsed = 0;
    var startTs = 0, intervalId = null, wakeLock = null;
    function $(s){ return document.getElementById(prefix + s); }
    function lock(){ try { if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(function(l){ wakeLock = l; }).catch(function(){}); } catch (e) {} }
    function unlock(){ try { if (wakeLock){ wakeLock.release(); wakeLock = null; } } catch (e) {} }
    this.update = function(elapsed){
      var total = getTotal(), clamped = Math.min(elapsed, total);
      $('timer-elapsed').textContent = fmtTime(Math.round(clamped));
      $('timer-total-label').textContent = '/ ' + fmtTime(total);
      $('timer-fill').style.width = Math.min(100, clamped / total * 100) + '%';
      moveProfileHead(profileId, clamped, total);
      var cards = document.querySelectorAll('#' + cardsId + ' .recipe-card'), label = '';
      cards.forEach(function(card, idx){
        var t = Number(card.dataset.timeSec), nextT = cards[idx + 1] ? Number(cards[idx + 1].dataset.timeSec) : Infinity;
        card.classList.remove('rc-active', 'rc-done');
        if (elapsed > 0 && elapsed >= t && elapsed < nextT){ card.classList.add('rc-active'); label = card.dataset.stepLabel || ''; }
        else if (elapsed >= nextT) card.classList.add('rc-done');
      });
      var stepEl = $('timer-step-label');
      if (elapsed >= total){
        cards.forEach(function(c){ c.classList.remove('rc-active'); c.classList.add('rc-done'); });
        stepEl.textContent = 'เสร็จแล้ว! ยกดริปเปอร์ออกและดื่มได้เลย';
      } else if (label) stepEl.textContent = 'ตอนนี้: ' + label;
    };
    function tick(){
      if (!self.running) return;
      var elapsed = (Date.now() - startTs) / 1000 * TIMER_SPEED;
      self.update(elapsed);
      if (elapsed >= getTotal()){ self.running = false; clearInterval(intervalId); unlock(); $('timer-pause').hidden = true; }
    }
    this.start = function(){
      if (self.running) return;
      self.running = true;
      startTs = Date.now() - (self.pausedElapsed / TIMER_SPEED) * 1000;
      clearInterval(intervalId); intervalId = setInterval(tick, 100); tick(); lock();
      $('timer-start').hidden = true; $('timer-pause').hidden = false; $('timer-pause').textContent = 'หยุดชั่วคราว ⏸'; $('timer-reset').hidden = false;
    };
    this.pause = function(){
      if (!self.running) return;
      self.running = false;
      self.pausedElapsed = (Date.now() - startTs) / 1000 * TIMER_SPEED;
      clearInterval(intervalId); unlock();
      $('timer-pause').textContent = 'ดำเนินการต่อ ▶';
    };
    this.reset = function(){
      self.running = false; clearInterval(intervalId); self.pausedElapsed = 0; unlock();
      self.update(0);
      $('timer-start').hidden = false; $('timer-pause').hidden = true; $('timer-reset').hidden = true;
      $('timer-step-label').textContent = 'กดเริ่มชงเพื่อจับเวลาไปพร้อมกับขั้นตอน';
    };
    $('timer-start').addEventListener('click', this.start);
    $('timer-pause').addEventListener('click', function(){ if (self.running) self.pause(); else self.start(); });
    $('timer-reset').addEventListener('click', this.reset);
    timers.push(this);
  }
  document.querySelectorAll('.speed-btn').forEach(function(b){
    b.addEventListener('click', function(){
      var s = Number(b.getAttribute('data-speed'));
      if (s === TIMER_SPEED) return;
      var busy = timers.some(function(t){ return t.running || t.pausedElapsed > 0; });
      var msg = b.parentNode.querySelector('.speed-msg');
      if (busy){
        msg.textContent = 'กดรีเซ็ตตัวจับเวลาก่อน จึงเปลี่ยนความเร็วได้';
        setTimeout(function(){ msg.textContent = ''; }, 2500);
        return;
      }
      TIMER_SPEED = s;
      document.querySelectorAll('.speed-btn').forEach(function(x){ x.setAttribute('aria-pressed', Number(x.getAttribute('data-speed')) === s ? 'true' : 'false'); });
    });
  });

  /* ---------- 3.3 basic recipe: 1:15, 93°C ---------- */
  var rcDose = document.getElementById('rc-dose');
  if (rcDose){
    var RC_RATIO = 15, RC_PULSE = 70, RC_TIMES = [0, 30, 75, 110, 150];
    var rcTimer = new BrewTimer('', 'recipe-cards', 'rc-profile', function(){ return RC_TIMES[4]; });
    var buildRecipe = function(){
      var dose = Math.max(8, Math.min(50, Number(rcDose.value) || 15));
      var waterG = Math.round(dose * RC_RATIO), bloomWater = Math.round(dose * 2);
      document.getElementById('rc-water').innerHTML = 'น้ำที่ต้องใช้: <strong>' + waterG + ' g</strong> (~' + waterG + ' ml) &nbsp;·&nbsp; เวลาสกัดรวม: <strong>' + fmtTime(RC_TIMES[4]) + '</strong>';
      var cum0 = Math.min(bloomWater, waterG), cum1 = Math.min(cum0 + RC_PULSE, waterG), cum2 = Math.min(cum1 + RC_PULSE, waterG);
      var pour2 = cum1 - cum0, pour3 = cum2 - cum1, remaining = waterG - cum2;
      var steps = [{ label: 'Bloom', timeSec: RC_TIMES[0], icon: STEP_ICONS.bloom, pour: cum0, cumulative: cum0,
        text: 'เทน้ำร้อนเท่ากับ <strong>2 เท่าของน้ำหนักกาแฟ</strong> ให้ทั่วผงกาแฟ รอให้ฟองอากาศพองตัวแล้วยุบตัวลง <em>(2 เท่าคือสูตรพื้นฐานของตารางนี้ บางสูตรใช้ 3–4 เท่าเพื่อให้ผงอิ่มน้ำเต็มที่ ดูหมายเหตุในหัวข้อ 4.3)</em>' }];
      if (pour2 > 0) steps.push({ label: 'เทวนรอบที่ 1', timeSec: RC_TIMES[1], icon: STEP_ICONS.spiral, pour: pour2, cumulative: cum1, text: 'เทน้ำวนช้าๆ จากตรงกลางออกด้านนอก เพิ่มอีก <strong>' + pour2 + ' g</strong>' });
      if (pour3 > 0) steps.push({ label: 'เทวนรอบที่ 2', timeSec: RC_TIMES[2], icon: STEP_ICONS.spiral, pour: pour3, cumulative: cum2, text: 'เทน้ำวนช้าๆ เพิ่มอีก <strong>' + pour3 + ' g</strong>' });
      if (remaining > 0) steps.push({ label: 'เทให้ครบสูตร', timeSec: RC_TIMES[3], icon: STEP_ICONS.center, pour: remaining, cumulative: waterG, text: 'เทน้ำที่เหลือให้ครบ <strong>' + waterG + ' g</strong>' });
      steps.push({ label: 'ยกดริปเปอร์ออก', timeSec: RC_TIMES[4], icon: STEP_ICONS.fill, pour: 0, cumulative: waterG, text: 'ปล่อยให้น้ำหยดจนหมด แล้วยกดริปเปอร์ออก เป็นอันเสร็จการสกัด' });
      renderCards(document.getElementById('recipe-cards'), steps);
      drawProfile('rc-profile', steps, RC_TIMES[4], waterG);
      if (!rcTimer.running) rcTimer.update(rcTimer.pausedElapsed);
    };
    rcDose.addEventListener('input', buildRecipe);
    buildRecipe();
  }

  /* ---------- บทที่ 5 world recipes ---------- */
  var RECIPES = {
    fourSix: { name: '4:6 Method', by: 'Tetsu Kasuya · 2016', ref: 8, ratio: 15, doseDefault: 20, timeDefault: 180, dripper: 'Hario V60 (เซรามิก)', temp: '92°C',
      source: 'Tetsu Kasuya · World Brewer Cup Champion 2016',
      philosophy: '40% แรก (2 รอบ) คุมสมดุลเปรี้ยว-หวาน · 60% หลัง (3 รอบ) คุมความเข้มข้น — บดหยาบปานกลาง (Medium-Coarse)',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 15), cumFracs = [0.2, 0.4, 0.6, 0.8, 1.0], timeFracs = [0, 40 / 180, 80 / 180, 120 / 180, 160 / 180], steps = [], prev = 0;
        cumFracs.forEach(function(cf, i){
          var cum = Math.round(cf * waterTotal), phase = i < 2 ? '40% แรก · คุมเปรี้ยว-หวาน' : '60% หลัง · คุมความเข้มข้น';
          steps.push({ label: 'เทรอบที่ ' + (i + 1) + ' · ' + phase, timeSec: timeFracs[i] * totalTime, pour: cum - prev, cumulative: cum, icon: STEP_ICONS.spiral, text: 'เทน้ำวนช้าๆ ให้ครบ ' + cum + ' g แล้วรอน้ำลงเกือบหมดก่อนเทรอบถัดไป' });
          prev = cum;
        });
        steps.push({ label: 'ยกดริปเปอร์ออก', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'ปล่อยให้น้ำหยดจนหมด เป็นอันเสร็จสูตร 4:6' });
        return { waterTotal: waterTotal, steps: steps };
      } },
    chadWang: { name: 'Chad Wang Method', by: 'Chad Wang · 2017', ref: 9, ratio: 16.6, doseDefault: 15, timeDefault: 120, dripper: 'Hario V60 (เซรามิก)', temp: '92°C',
      source: 'Chad Wang · World Brewer Cup Champion 2017',
      philosophy: 'เทเพียง 2 ครั้งเพื่อความแม่นยำและความสม่ำเสมอของรสชาติ — บดละเอียดปานกลาง (Medium-Fine)',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 16.6), bloom = Math.round(waterTotal * 30 / 250), spiralTo = Math.round(waterTotal * 100 / 250), f = totalTime / 120;
        return { waterTotal: waterTotal, steps: [
          { label: 'Bloom (Spiral Pour)', timeSec: 0, pour: bloom, cumulative: bloom, icon: STEP_ICONS.bloom, text: 'เท bloom แบบ Spiral Pour ' + bloom + ' g รอ 30 วินาที' },
          { label: 'Single Pour', timeSec: 30 * f, pour: waterTotal - bloom, cumulative: waterTotal, icon: STEP_ICONS.spiral, text: 'เทรวดเดียวแบบ Spiral Pour จนถึง ' + spiralTo + ' g แล้วเปลี่ยนเป็น Center Pour จนครบ ' + waterTotal + ' g' },
          { label: 'ปล่อยน้ำหยดจนหมด', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'รอจนน้ำหยดหมด คาดว่าจะเสร็จที่ ' + fmtTime(totalTime) }
        ]};
      } },
    fivePour: { name: 'Five-Pour Method', by: 'Matt Winton · 2021', ref: 10, ratio: 15, doseDefault: 20, timeDefault: 160, dripper: 'Hario V60 (สแตนเลส)', temp: '93°C',
      source: 'Matt Winton · World Brewer Cup Champion 2021',
      philosophy: 'เท 5 ครั้งเท่ากันทันทีที่น้ำเริ่มไหลเป็นหยด ป้องกันผงกาแฟแห้งจนฝาด เน้น Clarity และ Balance — บดหยาบปานกลาง (Medium-Coarse)',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 15), f = totalTime / 160, timeSecs = [0, 30 * f, 60 * f, 90 * f, 120 * f], each = Math.round(waterTotal / 5), steps = [], cum = 0;
        timeSecs.forEach(function(t, i){
          var pour = (i === 4) ? (waterTotal - cum) : each;
          cum += pour;
          steps.push({ label: 'เทรอบที่ ' + (i + 1), timeSec: t, pour: pour, cumulative: cum, icon: STEP_ICONS.spiral, text: 'เทน้ำทันทีที่หยดเริ่มไหล เพิ่มอีก ' + pour + ' g' });
        });
        steps.push({ label: 'ปล่อยน้ำหยดจนหมด', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'ปล่อยน้ำหยดจนหมด เน้นความสะอาดของรสชาติ (Clarity) และความสมดุล (Balance)' });
        return { waterTotal: waterTotal, steps: steps };
      } },
    georgePeng: { name: 'George Peng Method', by: 'George J. Peng · 2025', ref: 11, ratio: 14, doseDefault: 15, timeDefault: 105, dripper: 'Solo Dripper (พลาสติก PP)', temp: '94°C → 88°C',
      source: 'George Jinyang Peng · World Brewer Cup Champion 2025',
      philosophy: 'ต้นสกัดร้อน (94°C) ดึงรสชัดเจน ท้ายลดเหลือ 88°C พร้อมลด Agitation ด้วย Melodrip เพื่อไม่ให้เกิดรสฝาด — บดปานกลาง (Medium)',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 14), bloom = Math.round(waterTotal * 30 / 210), pour2 = Math.round(waterTotal * 90 / 210), pour3 = waterTotal - bloom - pour2, f = totalTime / 105;
        return { waterTotal: waterTotal, steps: [
          { label: 'Bloom (94°C)', timeSec: 0, pour: bloom, cumulative: bloom, icon: STEP_ICONS.bloom, text: 'เท bloom ' + bloom + ' g ที่อุณหภูมิ 94°C' },
          { label: 'เทรอบที่ 2 (94°C)', timeSec: 30 * f, pour: pour2, cumulative: bloom + pour2, icon: STEP_ICONS.spiral, text: 'เทน้ำวนที่อุณหภูมิ 94°C เพิ่มอีก ' + pour2 + ' g เพื่อสกัดรสชาติให้ชัดเจน' },
          { label: 'เทรอบที่ 3 (88°C)', timeSec: 70 * f, pour: pour3, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'ลดอุณหภูมิเหลือ 88°C เทเพิ่ม ' + pour3 + ' g พร้อมลดการกวน (Agitation) ด้วย Melodrip ป้องกันรสฝาด' },
          { label: 'ยกดริปเปอร์ออก', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'ปล่อยให้น้ำหยดจนหมด คาดว่าจะเสร็จที่ ' + fmtTime(totalTime) }
        ]};
      } },
    neoMethod: { name: 'Neo Method', by: 'Yoneyama Ryutaro · HARIO', ref: 12, ratio: 16, doseDefault: 15, timeDefault: 150, dripper: 'Hario Neo Dripper (พลาสติก PP)', temp: '90°C',
      source: 'Yoneyama Ryutaro · HARIO Asia Pte., Ltd.',
      philosophy: 'Bloom ด้วยน้ำปริมาณมาก + บดละเอียดขึ้น + ลดอุณหภูมิ ป้องกัน Over-extraction ดึง Sweetness และ Balance — บดละเอียดปานกลาง (Medium-Fine)',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 16), each = Math.round(waterTotal / 3), pour2 = each, pour3 = waterTotal - each - pour2, f = totalTime / 150;
        return { waterTotal: waterTotal, steps: [
          { label: 'Bloom (น้ำเยอะ)', timeSec: 0, pour: each, cumulative: each, icon: STEP_ICONS.bloom, text: 'เท bloom ปริมาณมาก ' + each + ' g ให้กาแฟพร้อมสกัดง่าย' },
          { label: 'เทรอบที่ 2', timeSec: 40 * f, pour: pour2, cumulative: each + pour2, icon: STEP_ICONS.spiral, text: 'เทน้ำวนช้าๆ เพิ่มอีก ' + pour2 + ' g' },
          { label: 'เทให้ครบ + ยกดริปเปอร์', timeSec: totalTime, pour: pour3, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'เทน้ำที่เหลือให้ครบ ' + waterTotal + ' g แล้วปล่อยน้ำหยดจนหมด ยกดริปเปอร์ออก' }
        ]};
      } },
    hoffmann: { name: 'Hoffmann V60', by: 'James Hoffmann', ref: 13, ratio: 16.6, doseDefault: 30, timeDefault: 210, dripper: 'Hario V60 (พลาสติก)', temp: '96°C',
      source: 'James Hoffmann · สูตร "Ultimate V60" เผยแพร่สาธารณะ',
      philosophy: 'เน้นให้หน้ากาแฟราบเรียบหลังชง ลด Channeling เพื่อการสกัดสม่ำเสมอที่สุด',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 16.6), bloom = Math.round(dose * 2), f = totalTime / 210, cum60 = Math.round(waterTotal * 0.6);
        return { waterTotal: waterTotal, steps: [
          { label: 'Bloom', timeSec: 0, pour: bloom, cumulative: bloom, icon: STEP_ICONS.bloom, text: 'เทน้ำ ' + bloom + ' g (ราว 2 เท่าของกาแฟ) รอ 45 วินาที' },
          { label: 'เทถึง 60%', timeSec: 45 * f, pour: cum60 - bloom, cumulative: cum60, icon: STEP_ICONS.spiral, text: 'เทน้ำวนภายใน ~30 วินาที ให้ถึง ' + cum60 + ' g' },
          { label: 'เทให้ครบ + Swirl', timeSec: 75 * f, pour: waterTotal - cum60, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'เทน้ำที่เหลือให้ครบ ' + waterTotal + ' g แล้วหมุนดริปเปอร์เบาๆ ให้หน้ากาแฟราบ' },
          { label: 'ปล่อยน้ำหยดจนหมด', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'รอจนน้ำหยดหมด คาดว่าจะเสร็จที่ ' + fmtTime(totalTime) }
        ]};
      } },
    scottRao: { name: 'Scott Rao Method', by: 'Rao Spin', ref: 14, ratio: 17, doseDefault: 20, timeDefault: 180, dripper: 'Hario V60', temp: '99–100°C',
      source: 'Scott Rao · The Physics of Filter Coffee (2021)',
      philosophy: 'อัตราส่วน 1:17 ตามตำรา Bloom ยาวด้วยน้ำ 3 เท่า และ "Rao Spin" ท้ายสุด เพื่อให้ผงกาแฟที่ติดผนังกลับลงมาราบเป็นหน้าเดียวกัน',
      build: function(dose, totalTime){
        var waterTotal = Math.round(dose * 17), bloom = Math.round(dose * 3);
        return { waterTotal: waterTotal, steps: [
          { label: 'Bloom (3 เท่า) + Swirl', timeSec: 0, pour: bloom, cumulative: bloom, icon: STEP_ICONS.bloom, text: 'เทน้ำ ' + bloom + ' g แล้วคนหรือ swirl เบาๆ ให้ผงกาแฟเปียกทั่ว' },
          { label: 'เทต่อเนื่องจนครบ', timeSec: totalTime * 0.55, pour: waterTotal - bloom, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'เทน้ำที่เหลือให้ครบ ' + waterTotal + ' g แบบต่อเนื่อง' },
          { label: 'Rao Spin', timeSec: totalTime * 0.85, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.spin, text: 'หมุนดริปเปอร์เบาๆ ให้ผงกาแฟที่ติดผนังกลับลงมาราบที่ก้น' },
          { label: 'ปล่อยน้ำหยดจนหมด', timeSec: totalTime, pour: 0, cumulative: waterTotal, icon: STEP_ICONS.fill, text: 'รอจนน้ำหยดหมด' }
        ]};
      } }
  };
  var ORDER = ['fourSix', 'chadWang', 'fivePour', 'georgePeng', 'neoMethod', 'hoffmann', 'scottRao'];

  var wrDose = document.getElementById('wr-dose');
  if (wrDose){
    var wrTime = document.getElementById('wr-time');
    var picker = document.getElementById('wr-picker');
    var compareBody = document.getElementById('wr-compare');
    var current = 'fourSix';
    var wrTimer = new BrewTimer('wr-', 'wr-cards', 'wr-profile', function(){ return Number(wrTime.value); });

    picker.innerHTML = ORDER.map(function(k){
      var r = RECIPES[k];
      return '<button class="chip" type="button" data-recipe="' + k + '" aria-pressed="' + (k === current) + '">' + r.name + '<small>' + r.by + '</small></button>';
    }).join('');
    if (compareBody){
      compareBody.innerHTML = ORDER.map(function(k){
        var r = RECIPES[k];
        return '<tr data-recipe="' + k + '" tabindex="0"><td>' + r.name + '<sup class="cite"><a href="appendix.html#ref-' + r.ref + '" data-ref="' + r.ref + '">' + r.ref + '</a></sup></td><td class="num">1:' + r.ratio + '</td><td>' + r.dripper + '</td><td class="num">' + r.temp + '</td><td class="num">' + r.doseDefault + ' g · ' + fmtTime(r.timeDefault) + '</td></tr>';
      }).join('');
    }
    // visual-mode map: ratio (x) against water temperature (y)
    var map = document.getElementById('wr-map');
    var MAP_PTS = {
      fourSix: { t: [92], label: '4:6', side: 'left' },
      fivePour: { t: [93], label: 'Five-Pour', side: 'left' },
      chadWang: { t: [92], label: 'Chad Wang', side: 'right' },
      hoffmann: { t: [96], label: 'Hoffmann', side: 'right' },
      neoMethod: { t: [90], label: 'Neo', side: 'right' },
      georgePeng: { t: [94, 88], label: 'George Peng', side: 'right' },
      scottRao: { t: [99, 100], label: 'Scott Rao', side: 'left' }
    };
    var drawMap = function(){
      if (!map) return;
      var W = 560, H = 300, P = { l: 56, r: 24, t: 20, b: 48 };
      var X = function(r){ return P.l + (r - 13.5) / 4 * (W - P.l - P.r); };
      var Y = function(t){ return P.t + (1 - (t - 86) / 15) * (H - P.t - P.b); };
      var SANS = 'IBM Plex Sans Thai Looped, sans-serif';
      var out = '';
      [14, 15, 16, 17].forEach(function(r){
        out += '<line x1="' + X(r) + '" x2="' + X(r) + '" y1="' + P.t + '" y2="' + (H - P.b) + '" stroke="var(--line)"/>';
        out += '<text x="' + X(r) + '" y="' + (H - P.b + 18) + '" text-anchor="middle" font-size="12" fill="var(--ink-dim)" font-family="' + MONO + '">1:' + r + '</text>';
      });
      [88, 92, 96, 100].forEach(function(t){
        out += '<line x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--line)"/>';
        out += '<text x="' + (P.l - 8) + '" y="' + (Y(t) + 4) + '" text-anchor="end" font-size="12" fill="var(--ink-dim)" font-family="' + MONO + '">' + t + '°</text>';
      });
      out += '<text x="' + (P.l + (W - P.l - P.r) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="13" fill="var(--ink-dim)" font-family="' + SANS + '">น้ำต่อกาแฟ → ใส่น้ำมากขึ้น</text>';
      out += '<text x="' + (-(P.t + (H - P.t - P.b) / 2)) + '" y="16" transform="rotate(-90)" text-anchor="middle" font-size="13" fill="var(--ink-dim)" font-family="' + SANS + '">อุณหภูมิน้ำ ↑</text>';
      ORDER.forEach(function(k){
        var m = MAP_PTS[k], r = RECIPES[k].ratio, x = X(r), y0 = Y(m.t[0]), on = k === current;
        var col = on ? 'var(--accent)' : 'var(--coffee)';
        out += '<g class="pt" data-recipe="' + k + '" tabindex="0" role="button" aria-label="' + RECIPES[k].name + '">';
        if (m.t.length > 1){
          var y1 = Y(m.t[1]);
          out += '<line x1="' + x + '" x2="' + x + '" y1="' + y0 + '" y2="' + y1 + '" stroke="' + col + '" stroke-width="' + (k === 'scottRao' ? 10 : 3) + '" stroke-linecap="round"' + (k === 'georgePeng' ? ' stroke-dasharray="4 4"' : '') + '/>';
          if (k === 'georgePeng') out += '<circle cx="' + x + '" cy="' + y1 + '" r="6" fill="var(--page)" stroke="' + col + '" stroke-width="2.5"/>';
        }
        out += '<circle class="dot" cx="' + x + '" cy="' + y0 + '" r="' + (on ? 9 : 7) + '" fill="' + col + '" stroke="var(--page)" stroke-width="2"/>';
        var lx = m.side === 'left' ? x - 14 : x + 14, ly = (m.t.length > 1 && k === 'georgePeng') ? (y0 + Y(m.t[1])) / 2 + 4 : y0 + 4;
        out += '<text x="' + lx + '" y="' + ly + '" text-anchor="' + (m.side === 'left' ? 'end' : 'start') + '" font-size="13.5" font-weight="' + (on ? 700 : 500) + '" fill="' + (on ? 'var(--accent)' : 'var(--ink)') + '" font-family="' + SANS + '">' + m.label + '</text>';
        out += '</g>';
      });
      map.innerHTML = out;
    };
    if (map){
      var pickPt = function(g){ select(g.getAttribute('data-recipe')); document.getElementById('s5-2').scrollIntoView({ behavior: 'smooth' }); };
      map.addEventListener('click', function(e){ var g = e.target.closest('.pt'); if (g) pickPt(g); });
      map.addEventListener('keydown', function(e){ var g = e.target.closest('.pt'); if (g && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); pickPt(g); } });
    }

    var build = function(){
      var recipe = RECIPES[current];
      var dose = Math.max(5, Math.min(60, Number(wrDose.value) || recipe.doseDefault));
      var totalTime = Number(wrTime.value), result = recipe.build(dose, totalTime);
      document.getElementById('wr-ratio-label').textContent = '1 : ' + recipe.ratio;
      document.getElementById('wr-dripper-label').textContent = recipe.dripper;
      document.getElementById('wr-temp-label').textContent = recipe.temp;
      document.getElementById('wr-time-val').textContent = fmtTime(totalTime);
      document.getElementById('wr-water').innerHTML = 'น้ำที่ต้องใช้: <strong>' + result.waterTotal + ' g</strong> (~' + result.waterTotal + ' ml)';
      document.getElementById('wr-philosophy').textContent = recipe.philosophy;
      document.getElementById('wr-source').innerHTML = 'แหล่งอ้างอิง: <strong></strong><sup class="cite"><a href="appendix.html#ref-' + recipe.ref + '" data-ref="' + recipe.ref + '">' + recipe.ref + '</a></sup>';
      document.getElementById('wr-source').querySelector('strong').textContent = recipe.source;
      renderCards(document.getElementById('wr-cards'), result.steps);
      drawProfile('wr-profile', result.steps, totalTime, result.waterTotal);
      wrTimer.reset();
    };
    var select = function(k){
      current = k;
      wrDose.value = RECIPES[k].doseDefault;
      wrTime.value = RECIPES[k].timeDefault;
      picker.querySelectorAll('.chip').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-recipe') === k ? 'true' : 'false'); });
      if (compareBody) compareBody.querySelectorAll('tr').forEach(function(tr){ tr.classList.toggle('on', tr.getAttribute('data-recipe') === k); });
      drawMap();
      build();
    };
    picker.addEventListener('click', function(e){ var b = e.target.closest('.chip'); if (b) select(b.getAttribute('data-recipe')); });
    if (compareBody){
      var pick = function(tr){ select(tr.getAttribute('data-recipe')); document.getElementById('s5-2').scrollIntoView({ behavior: 'smooth' }); };
      compareBody.addEventListener('click', function(e){ if (e.target.closest('sup.cite')) return; var tr = e.target.closest('tr'); if (tr) pick(tr); });
      compareBody.addEventListener('keydown', function(e){ var tr = e.target.closest('tr'); if (tr && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); pick(tr); } });
    }
    wrDose.addEventListener('input', build);
    wrTime.addEventListener('input', build);
    select(current);
  }
})();
