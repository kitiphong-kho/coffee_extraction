/* บทที่ 2 — Pour-Over Lab: a simplified extraction model, brewing control chart,
   cup composition, extraction sequence, multi-run trail and the dial-in exercise. */
(function(){
  'use strict';
  var Book = window.Book, svgEl = Book.svgEl, fmtTime = Book.fmtTime;
  var SANS = 'IBM Plex Sans Thai Looped, sans-serif', MONO = 'IBM Plex Mono, monospace';

  var els = {
    grind: document.getElementById('grind'),
    temp: document.getElementById('temp'),
    ratio: document.getElementById('ratio'),
    time: document.getElementById('time'),
    agitation: document.getElementById('agitation')
  };
  var vals = {
    grind: document.getElementById('val-grind'),
    temp: document.getElementById('val-temp'),
    ratio: document.getElementById('val-ratio'),
    time: document.getElementById('val-time'),
    agitation: document.getElementById('val-agitation')
  };

  var PRESETS = {
    under:    { grind: 8, temp: 88, ratio: 18, time: 110, agitation: 2 },
    balanced: { grind: 5, temp: 93, ratio: 17.5, time: 150, agitation: 5 },
    over:     { grind: 2, temp: 96, ratio: 15, time: 220, agitation: 9 },
    reset:    { grind: 5, temp: 93, ratio: 17.5, time: 150, agitation: 5 }
  };

  var EY_MIN = 14, EY_MAX = 26, CH_EY_MAX = 30, EY_LO = 18, EY_HI = 22;
  var TDS_MIN = 0.8, TDS_MAX = 1.7, CH_TDS_MAX = 2.0, TDS_LO = 1.15, TDS_HI = 1.35;
  var ABSORB = 2; // grounds keep about twice their weight of water, so beverage ≈ water − 2 × dose (หัวข้อ 1.3)

  function readInputs(){
    return { grind: Number(els.grind.value), temp: Number(els.temp.value), ratio: Number(els.ratio.value), time: Number(els.time.value), agitation: Number(els.agitation.value) };
  }
  function applyValues(v){ Object.keys(els).forEach(function(k){ if (v[k] != null) els[k].value = v[k]; }); }

  // Educational model: EY from grind, temperature, time and agitation;
  // TDS = EY × dose ÷ beverage = EY ÷ (ratio − ABSORB)
  function compute(v){
    var grindFactor = (10 - v.grind) / 9;
    var tempFactor = (v.temp - 80) / 16;
    var timeFactor = (v.time - 90) / 150;
    var agitationFactor = v.agitation / 10;
    var ey = 14 + 4 * grindFactor + 2 * tempFactor + 4 * timeFactor + 2 * agitationFactor;
    ey = Math.max(EY_MIN, Math.min(EY_MAX, ey));
    return { ey: ey, tds: ey / (v.ratio - ABSORB) };
  }
  function classify(ey, tds){
    return { eyCat: ey < EY_LO ? 'sour' : (ey > EY_HI ? 'bitter' : 'balanced'), tdsCat: tds < TDS_LO ? 'weak' : (tds > TDS_HI ? 'strong' : 'balanced') };
  }

  var VERDICTS = {
    sour_weak: { tag: 'บาง + เปรี้ยวนำ', color: 'sage', title: 'จืดชืดและเปรี้ยวโดดเด่น', body: 'สกัดไม่พอและกาแฟเจือจางเกินไป รสเปรี้ยวจะเด่นแต่ไม่มีความหวานมาคลุม ลองบดให้ละเอียดขึ้น เพิ่มเวลาสกัด หรือลดอัตราส่วนน้ำต่อกาแฟลง' },
    sour_balanced: { tag: 'พอดี + เปรี้ยวนำ', color: 'sage', title: 'เข้มข้นพอดีแต่เปรี้ยวนำ', body: 'ความเข้มข้นอยู่ในเกณฑ์ดีแล้ว แต่สกัดยังไม่ถึงจุดที่ความหวานจะมาสมดุลกับกรด ลองเพิ่มอุณหภูมิ เวลา หรือบดละเอียดขึ้นอีกเล็กน้อย' },
    sour_strong: { tag: 'เข้ม + เปรี้ยวฝาด', color: 'sage', title: 'เข้มข้นแต่สกัดไม่พอ เปรี้ยวและฝาด', body: 'ใช้กาแฟเยอะเทียบกับน้ำ แต่สารที่สกัดออกมายังน้อย ทำให้เข้มข้นแต่รสไม่กลม บดให้ละเอียดขึ้นหรือเพิ่มเวลาสกัดโดยไม่เพิ่มน้ำ' },
    balanced_weak: { tag: 'บาง + สมดุล', color: 'gold', title: 'รสชาติกลมกล่อมแต่เจือจาง', body: 'สัดส่วนการสกัดอยู่ในช่วงดี เพียงแต่กาแฟต่อน้ำน้อยไปทำให้รสบาง ลองลดอัตราส่วนน้ำ (เพิ่มกาแฟ หรือลดน้ำ) โดยคงตัวแปรอื่นไว้' },
    balanced_balanced: { tag: 'จุดทองคำ', color: 'gold', title: 'กลมกล่อม สมดุลตามหลัก SCA', body: 'สูตรนี้ให้ทั้งการสกัดและความเข้มข้นอยู่ในกรอบที่แนะนำ รสชาติควรมีความหวานนำ กรดที่พอดี และไม่มีความขมแทรก รักษาสูตรนี้ไว้เป็นฐานแล้วปรับทีละตัวแปรเพื่อหารสที่ชอบ' },
    balanced_strong: { tag: 'เข้ม + สมดุล', color: 'gold', title: 'เข้มข้นจัดแต่รสชาติสมดุลดี', body: 'การสกัดอยู่ในเกณฑ์ดี เพียงแต่เข้มข้นกว่าปกติ เหมาะกับคนชอบกาแฟหนักแน่น หากอยากได้ที่เบาลงลองเพิ่มน้ำเล็กน้อย' },
    bitter_weak: { tag: 'บาง + ขมปลายลิ้น', color: 'rust', title: 'บางแต่ขมติดปลายลิ้น', body: 'สกัดมากเกินไปทั้งที่กาแฟต่อน้ำน้อย ทำให้ได้รสขมแบบไม่มีอะไรมาคลุม ลดเวลาสกัด ลดอุณหภูมิ หรือบดหยาบขึ้น พร้อมเพิ่มปริมาณกาแฟ' },
    bitter_balanced: { tag: 'พอดี + ขมนำ', color: 'rust', title: 'เข้มข้นพอดีแต่ขมนำ', body: 'ความเข้มข้นอยู่ในเกณฑ์ดี แต่สกัดเลยจุดหวานไปแล้วจนขมเริ่มเด่น ลองบดหยาบขึ้นเล็กน้อยหรือย่นเวลา/ลดอุณหภูมิลง' },
    bitter_strong: { tag: 'เข้ม + ขมจัด', color: 'rust', title: 'เข้มข้นและขมจัด สกัดเกิน', body: 'ทั้งสกัดนานเกินและเข้มข้นเกิน สารขมและฝาดจะเด่นชัด บดหยาบขึ้นอย่างเห็นผล ลดเวลาสกัดและอุณหภูมิ เพื่อดึงกลับเข้ากรอบ' }
  };
  var colorVar = { sage: '--sage', gold: '--gold', rust: '--rust' };
  var ZONE_LABEL = { sour: 'เปรี้ยวนำ', balanced: 'สมดุล', bitter: 'ขมนำ' };

  /* ---------- brewing control chart ---------- */
  var chartSvg = document.getElementById('chart');
  var PAD = { l: 46, r: 18, t: 18, b: 40 };
  var CW = 460, CH = 340, plotW, plotH;
  var narrowMQ = window.matchMedia('(max-width: 560px)');
  function setChartSize(){
    CW = narrowMQ.matches ? 360 : 460;
    CH = narrowMQ.matches ? 400 : 340;
    plotW = CW - PAD.l - PAD.r; plotH = CH - PAD.t - PAD.b;
    chartSvg.setAttribute('viewBox', '0 0 ' + CW + ' ' + CH);
  }
  function xScale(ey){ return PAD.l + (ey - EY_MIN) / (CH_EY_MAX - EY_MIN) * plotW; }
  function yScale(tds){ tds = Math.max(TDS_MIN, Math.min(CH_TDS_MAX, tds)); return PAD.t + (1 - (tds - TDS_MIN) / (CH_TDS_MAX - TDS_MIN)) * plotH; }
  function text(parent, attrs, s){ var t = svgEl('text', attrs); t.textContent = s; parent.appendChild(t); return t; }

  function buildChartStatic(){
    setChartSize();
    chartSvg.innerHTML = '';
    // light gridlines
    [18, 22, 26].forEach(function(ey){ chartSvg.appendChild(svgEl('line', { x1: xScale(ey), y1: PAD.t, x2: xScale(ey), y2: CH - PAD.b, stroke: 'var(--line)', 'stroke-width': '1' })); });
    [1.0, 1.2, 1.4, 1.6, 1.8, 2.0].forEach(function(t){ chartSvg.appendChild(svgEl('line', { x1: PAD.l, y1: yScale(t), x2: CW - PAD.r, y2: yScale(t), stroke: 'var(--line)', 'stroke-width': '1' })); });
    var ix = xScale(EY_LO), ix2 = xScale(EY_HI), iy = yScale(TDS_HI), iy2 = yScale(TDS_LO);
    chartSvg.appendChild(svgEl('rect', { x: ix, y: iy, width: ix2 - ix, height: iy2 - iy, fill: 'var(--gold)', 'fill-opacity': '0.16', stroke: 'var(--gold)', 'stroke-width': '1.4', 'stroke-dasharray': '4 3' }));
    chartSvg.appendChild(svgEl('line', { x1: PAD.l, y1: PAD.t, x2: PAD.l, y2: CH - PAD.b, stroke: 'var(--ink-dim)', 'stroke-width': '1.5' }));
    chartSvg.appendChild(svgEl('line', { x1: PAD.l, y1: CH - PAD.b, x2: CW - PAD.r, y2: CH - PAD.b, stroke: 'var(--ink-dim)', 'stroke-width': '1.5' }));
    [14, 18, 22, 26, 30].forEach(function(ey){
      var x = xScale(ey);
      chartSvg.appendChild(svgEl('line', { x1: x, y1: CH - PAD.b, x2: x, y2: CH - PAD.b + 5, stroke: 'var(--ink-dim)', 'stroke-width': '1' }));
      text(chartSvg, { x: x, y: CH - PAD.b + 18, 'text-anchor': 'middle', 'font-size': '11.5', fill: 'var(--ink-dim)', 'font-family': MONO }, ey + '%');
    });
    [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].forEach(function(tds){
      var y = yScale(tds);
      chartSvg.appendChild(svgEl('line', { x1: PAD.l - 5, y1: y, x2: PAD.l, y2: y, stroke: 'var(--ink-dim)', 'stroke-width': '1' }));
      text(chartSvg, { x: PAD.l - 9, y: y + 3, 'text-anchor': 'end', 'font-size': '11.5', fill: 'var(--ink-dim)', 'font-family': MONO }, tds.toFixed(1));
    });
    text(chartSvg, { x: PAD.l + plotW / 2, y: CH - 4, 'text-anchor': 'middle', 'font-size': '12.5', fill: 'var(--ink-dim)', 'font-family': SANS }, 'Extraction Yield (%) — เปรี้ยว ← → ขม');
    text(chartSvg, { x: -(PAD.t + plotH / 2), y: 13, 'text-anchor': 'middle', 'font-size': '12.5', fill: 'var(--ink-dim)', 'font-family': SANS, transform: 'rotate(-90)' }, 'TDS (%) — บาง ↓ ↑ เข้ม');
    text(chartSvg, { x: (ix + ix2) / 2, y: iy - 6, 'text-anchor': 'middle', 'font-size': '11', fill: 'var(--gold)', 'font-family': SANS, 'font-weight': '700' }, 'โซนที่ SCA แนะนำ');
    chartSvg.appendChild(svgEl('g', { id: 'chart-trail' }));
    chartSvg.appendChild(svgEl('circle', { id: 'chart-point', r: 8, fill: 'var(--coffee)', stroke: 'var(--paper)', 'stroke-width': '2.5' }));
  }
  function updateChartPoint(ey, tds, colorKey){
    var pt = document.getElementById('chart-point');
    pt.setAttribute('cx', xScale(ey)); pt.setAttribute('cy', yScale(tds));
    pt.setAttribute('fill', 'var(' + colorVar[colorKey] + ')');
  }

  /* ---------- multi-run trail ---------- */
  var trail = [], TRAIL_MAX = 12;
  var TRAIL_LABEL = { grind: 'บด', temp: 'อุณหภูมิ', ratio: 'อัตราส่วน', time: 'เวลา', agitation: 'การกวน' };
  function fmtVal(k, x){
    if (k === 'temp') return x + '°C';
    if (k === 'ratio') return '1:' + x.toFixed(1);
    if (k === 'time') return fmtTime(x);
    return String(x);
  }
  function trailDiff(prev, cur){
    if (!prev) return 'ค่าเริ่มต้น';
    var out = [];
    Object.keys(TRAIL_LABEL).forEach(function(k){ if (prev.v[k] !== cur.v[k]) out.push(TRAIL_LABEL[k] + ' ' + fmtVal(k, prev.v[k]) + ' → ' + fmtVal(k, cur.v[k])); });
    return out.length ? out.join(', ') : 'ไม่เปลี่ยนค่า';
  }
  function drawTrail(){
    var g = document.getElementById('chart-trail'), body = document.getElementById('trail-body');
    if (!g || !body) return;
    g.innerHTML = ''; body.innerHTML = '';
    document.getElementById('trail-table').hidden = trail.length === 0;
    document.getElementById('trail-clear').disabled = trail.length === 0;
    for (var i = 1; i < trail.length; i++){
      var a = trail[i - 1], b = trail[i];
      var x1 = xScale(a.ey), y1 = yScale(a.tds), x2 = xScale(b.ey), y2 = yScale(b.tds);
      var d = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      if (d < 1) continue;
      var ux = (x2 - x1) / d, uy = (y2 - y1) / d, r = 11;
      g.appendChild(svgEl('line', { x1: x1 + ux * r, y1: y1 + uy * r, x2: x2 - ux * r, y2: y2 - uy * r, stroke: 'var(--ink-dim)', 'stroke-width': '1.6', 'stroke-dasharray': '4 3' }));
      if (d > 28){
        var tx = x2 - ux * (r + 1), ty = y2 - uy * (r + 1), nx = -uy * 4, ny = ux * 4;
        g.appendChild(svgEl('polygon', { points: tx + ',' + ty + ' ' + (tx - ux * 7 + nx) + ',' + (ty - uy * 7 + ny) + ' ' + (tx - ux * 7 - nx) + ',' + (ty - uy * 7 - ny), fill: 'var(--ink-dim)' }));
      }
    }
    trail.forEach(function(s, i){
      g.appendChild(svgEl('circle', { cx: xScale(s.ey), cy: yScale(s.tds), r: 9, fill: 'var(--paper)', stroke: 'var(--coffee)', 'stroke-width': '2' }));
      text(g, { x: xScale(s.ey), y: yScale(s.tds), 'dominant-baseline': 'central', 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '700', fill: 'var(--coffee)', 'font-family': MONO }, i + 1);
      var tr = document.createElement('tr');
      tr.className = 'trail-row';
      tr.title = 'คลิกเพื่อโหลดค่ารอบนี้กลับมา';
      tr.innerHTML = '<td><span class="trail-n">' + (i + 1) + '</span></td><td>' + trailDiff(trail[i - 1], s) + '</td><td class="num">' + s.ey.toFixed(1) + '%</td><td class="num">' + s.tds.toFixed(2) + '%</td>';
      tr.addEventListener('click', function(){ applyValues(s.v); render(); });
      body.appendChild(tr);
    });
  }
  document.getElementById('trail-save').addEventListener('click', function(){
    var v = readInputs(), r = compute(v);
    if (trail.length === TRAIL_MAX) trail.shift();
    trail.push({ v: v, ey: r.ey, tds: r.tds });
    drawTrail();
  });
  document.getElementById('trail-clear').addEventListener('click', function(){ trail = []; drawTrail(); });

  /* ---------- extraction sequence ---------- */
  var SEQ = { scaleMin: 8, scaleMax: 28, zones: [
    { key: 'acid', from: 8, to: 14, color: 'sage', label: 'Acids & Aromas', sub: 'กรด/กลิ่นระเหย' },
    { key: 'sugar', from: 14, to: 22, color: 'gold', label: 'Sugars & Lipids', sub: 'หวาน/บอดี้' },
    { key: 'tannin', from: 22, to: 28, color: 'rust', label: 'Fibers & Tannins', sub: 'ขม/ฝาด' }
  ]};

  /* ---------- cup composition ---------- */
  var cupSvg = document.getElementById('cup');
  var CUP_MAX_H = 88, CUP_TOP = 20;
  function buildCup(){
    cupSvg.innerHTML = '';
    cupSvg.appendChild(svgEl('path', { d: 'M20,20 L26,95 Q28,108 42,108 L58,108 Q72,108 74,95 L80,20 Z', fill: 'none', stroke: 'var(--ink-dim)', 'stroke-width': '3' }));
    cupSvg.appendChild(svgEl('path', { d: 'M78,32 Q96,32 96,50 Q96,68 78,66', fill: 'none', stroke: 'var(--ink-dim)', 'stroke-width': '3' }));
    var clip = svgEl('clipPath', { id: 'cupClip' });
    clip.appendChild(svgEl('path', { d: 'M21,21 L26.5,94 Q28.5,105 42,105 L58,105 Q71.5,105 73.5,94 L79,21 Z' }));
    cupSvg.appendChild(clip);
    var g = svgEl('g', { 'clip-path': 'url(#cupClip)' });
    ['acid', 'sugar', 'tannin'].forEach(function(key){ g.appendChild(svgEl('rect', { id: 'cup-band-' + key, x: 15, y: CUP_TOP + CUP_MAX_H, width: 70, height: 0 })); });
    cupSvg.appendChild(g);
    ['acid-sugar', 'sugar-tannin'].forEach(function(key){ cupSvg.appendChild(svgEl('line', { id: 'cup-sep-' + key, x1: 17, x2: 83, stroke: 'var(--paper)', 'stroke-width': '1', 'stroke-opacity': '0.6', y1: 0, y2: 0 })); });
  }
  function composition(ey){
    var f = SEQ.zones.map(function(z){ return Math.max(0, Math.min(1, (ey - z.from) / (z.to - z.from))); });
    var total = f[0] + f[1] + f[2];
    if (total <= 0) return { acid: 1, sugar: 0, tannin: 0 };
    return { acid: f[0] / total, sugar: f[1] / total, tannin: f[2] / total };
  }
  function updateCup(ey, tds){
    var comp = composition(ey);
    var liquidH = CUP_MAX_H * Math.max(0, Math.min(1, (tds - TDS_MIN) / (TDS_MAX - TDS_MIN)));
    var liquidTop = CUP_TOP + (CUP_MAX_H - liquidH);
    var acidH = liquidH * comp.acid, sugarH = liquidH * comp.sugar, tanninH = liquidH * comp.tannin;
    var yAcid = liquidTop + sugarH + tanninH, ySugar = liquidTop + tanninH;
    [['acid', yAcid, acidH, '--sage'], ['sugar', ySugar, sugarH, '--gold'], ['tannin', liquidTop, tanninH, '--rust']].forEach(function(b){
      var band = document.getElementById('cup-band-' + b[0]);
      band.setAttribute('y', b[1]); band.setAttribute('height', b[2]);
      band.setAttribute('fill', 'var(' + b[3] + ')'); band.setAttribute('fill-opacity', '0.85');
    });
    var s1 = document.getElementById('cup-sep-acid-sugar'); s1.setAttribute('y1', yAcid); s1.setAttribute('y2', yAcid);
    var s2 = document.getElementById('cup-sep-sugar-tannin'); s2.setAttribute('y1', ySugar); s2.setAttribute('y2', ySugar);
    document.getElementById('leg-acid').textContent = Math.round(comp.acid * 100) + '%';
    document.getElementById('leg-sugar').textContent = Math.round(comp.sugar * 100) + '%';
    document.getElementById('leg-tannin').textContent = Math.round(comp.tannin * 100) + '%';
  }

  var seqSvg = document.getElementById('sequence');
  var SEQ_PAD = { l: 14, r: 14 }, SEQ_W = 460, seqPlotW = SEQ_W - SEQ_PAD.l - SEQ_PAD.r;
  function seqX(val){ return SEQ_PAD.l + (val - SEQ.scaleMin) / (SEQ.scaleMax - SEQ.scaleMin) * seqPlotW; }
  function buildSequenceStatic(){
    seqSvg.innerHTML = '';
    var barY = 54, barH = 34;
    SEQ.zones.forEach(function(z){
      var x1 = seqX(z.from), x2 = seqX(z.to);
      seqSvg.appendChild(svgEl('rect', { x: x1, y: barY, width: x2 - x1, height: barH, fill: 'none', stroke: 'var(--line)', 'stroke-width': '1.4', rx: '4' }));
      seqSvg.appendChild(svgEl('rect', { id: 'seq-fill-' + z.key, x: x1, y: barY, width: 0, height: barH, fill: 'var(' + colorVar[z.color] + ')', 'fill-opacity': '0.55', rx: '4' }));
      text(seqSvg, { x: (x1 + x2) / 2, y: barY - 20, 'text-anchor': 'middle', 'font-size': '11', 'font-weight': '700', fill: 'var(--ink)', 'font-family': SANS }, z.label);
      text(seqSvg, { x: (x1 + x2) / 2, y: barY - 8, 'text-anchor': 'middle', 'font-size': '10', fill: 'var(--ink-dim)', 'font-family': SANS }, z.sub);
    });
    [EY_LO, EY_HI].forEach(function(v){ var x = seqX(v); seqSvg.appendChild(svgEl('line', { x1: x, y1: barY - 2, x2: x, y2: barY + barH + 2, stroke: 'var(--gold)', 'stroke-width': '1.2', 'stroke-dasharray': '3 2' })); });
    text(seqSvg, { x: (seqX(EY_LO) + seqX(EY_HI)) / 2, y: barY + barH + 16, 'text-anchor': 'middle', 'font-size': '9.5', fill: 'var(--gold)', 'font-family': MONO, 'font-weight': '700' }, 'SWEET SPOT');
    var marker = svgEl('g', { id: 'seq-marker' });
    marker.appendChild(svgEl('line', { x1: 0, y1: barY - 26, x2: 0, y2: barY + barH + 6, stroke: 'var(--coffee)', 'stroke-width': '2' }));
    marker.appendChild(svgEl('circle', { cx: 0, cy: barY - 26, r: '4.5', fill: 'var(--coffee)' }));
    seqSvg.appendChild(marker);
  }
  function updateSequence(ey){
    SEQ.zones.forEach(function(z){
      var frac = Math.max(0, Math.min(1, (ey - z.from) / (z.to - z.from)));
      document.getElementById('seq-fill-' + z.key).setAttribute('width', (seqX(z.to) - seqX(z.from)) * frac);
    });
    document.getElementById('seq-marker').setAttribute('transform', 'translate(' + seqX(Math.max(SEQ.scaleMin, Math.min(SEQ.scaleMax, ey))) + ',0)');
    var zone = SEQ.zones.filter(function(z){ return ey >= z.from && ey < z.to; })[0] || SEQ.zones[SEQ.zones.length - 1];
    var cap = ey < SEQ.zones[0].from ? 'ยังสกัดสารกลุ่มกรด/กลิ่นได้ไม่เต็มที่'
      : 'แนวสกัดตอนนี้อยู่ที่ ' + ey.toFixed(1) + '% — อยู่ในโซน ' + zone.label + ' (' + zone.sub + ')';
    document.getElementById('sequence-caption').innerHTML = cap.replace(/(\d+\.\d%)/, '<strong>$1</strong>');
  }

  /* ---------- per-variable reading ---------- */
  var FACTOR_LIST = document.getElementById('factor-list');
  function factorRow(name, tagText, color, note){
    var li = document.createElement('li'); li.className = 'factor-row';
    var n = document.createElement('span'); n.className = 'factor-name'; n.textContent = name;
    var tag = document.createElement('span'); tag.className = 'factor-tag'; tag.textContent = tagText; tag.style.background = 'var(' + colorVar[color] + ')';
    var nt = document.createElement('span'); nt.className = 'factor-note'; nt.textContent = note;
    li.appendChild(n); li.appendChild(tag); li.appendChild(nt);
    FACTOR_LIST.appendChild(li);
  }
  function buildFactors(v){
    FACTOR_LIST.innerHTML = '';
    if (v.grind <= 3) factorRow('เบอร์บด', 'ละเอียดไป', 'rust', 'บดละเอียด พื้นที่ผิวมาก น้ำไหลช้า สกัดเพิ่มขึ้นเร็ว — เสี่ยงฝาด ขม แห้งคอ');
    else if (v.grind >= 8) factorRow('เบอร์บด', 'หยาบไป', 'sage', 'บดหยาบ พื้นที่ผิวน้อย น้ำไหลผ่านเร็ว สกัดลดลง — เสี่ยงเปรี้ยวโดด จืด บอดี้บาง');
    else factorRow('เบอร์บด', 'กำลังดี', 'gold', 'อยู่ในช่วงกลาง ไม่ใช่ตัวการหลักที่ดึงรสไปทางใดทางหนึ่ง');
    if (v.temp >= 94) factorRow('อุณหภูมิน้ำ', 'ร้อนไป', 'rust', 'น้ำร้อนจัด (93–96°C ขึ้นไป) สกัดสารละลายเร็วมาก — เสี่ยงขมไหม้ รสฉุนจัด');
    else if (v.temp <= 87) factorRow('อุณหภูมิน้ำ', 'เย็นไป', 'sage', 'น้ำเย็น (85–90°C) สกัดช้าลง ดึงความหวานได้ไม่เต็มที่ — เสี่ยงเปรี้ยวฝาด ไม่หวาน ขาดมิติ');
    else factorRow('อุณหภูมิน้ำ', 'กำลังดี', 'gold', 'อยู่ในช่วงที่ดึงความหวานและบอดี้ได้ดีโดยไม่เสี่ยงไหม้');
    if (v.ratio >= 19) factorRow('อัตราส่วน', 'น้ำมากไป', 'sage', 'น้ำเยอะ (เช่น 1:19 ขึ้นไป) Yield รวมสูงขึ้นแต่บอดี้บางลง — เสี่ยงรสเจือจาง ชืด และขมปลายค้าง');
    else if (v.ratio <= 14) factorRow('อัตราส่วน', 'น้ำน้อยไป', 'rust', 'น้ำน้อย (เช่น 1:14 ลงมา) TDS สูง บอดี้หนา แต่สกัดองค์ประกอบรสไม่ครบ — เสี่ยงรสทึบ เปรี้ยวจัด ดื่มยาก');
    else factorRow('อัตราส่วน', 'กำลังดี', 'gold', 'อยู่ในช่วงที่สมดุลระหว่างความเข้มข้นและความครบรสของการสกัด');
    var intensity = (v.time - 90) / 150 + (v.agitation / 10);
    if (intensity >= 1.3) factorRow('เวลา/แรงกวน', 'มากไป', 'rust', 'เวลานาน คนหรือรินน้ำแรง สกัดเพิ่มขึ้นอย่างรวดเร็ว — เสี่ยงฝาดติดลิ้น รสหนักเกินไป');
    else if (intensity <= 0.35) factorRow('เวลา/แรงกวน', 'น้อยไป', 'sage', 'เวลาสั้น เทน้ำเบา สกัดน้อยลง — เสี่ยงเปรี้ยวแหลม มีกลิ่นหญ้าหรือถั่วดิบ');
    else factorRow('เวลา/แรงกวน', 'กำลังดี', 'gold', 'ระยะเวลาและแรงกวนอยู่ในช่วงที่ให้รสชาติเบาสว่างโดยไม่ขาดความสมดุล');
  }

  /* ---------- live rig illustration ---------- */
  function updateRig(v){
    var bed = document.getElementById('rig-bed');
    if (!bed) return;
    var r = 1.3 + (v.grind - 1) * 0.42, step = 2 * r + 1.1, rowH = step * 0.88, html = '', row = 0;
    for (var y = 108 - r; y > 62; y -= rowH, row++){
      for (var x = 117 + (row % 2 ? step / 2 : 0); x < 205; x += step){
        var j = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; j = j - Math.floor(j);
        html += '<circle cx="' + (x + (j - .5) * r * .5).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r * (0.85 + j * 0.3)).toFixed(2) + '" fill="var(' + (j > .62 ? '--caramel' : '--coffee') + ')"/>';
      }
    }
    bed.innerHTML = html;
    document.getElementById('rig-grind-txt').textContent = v.grind <= 3 ? 'บดละเอียด' : (v.grind >= 8 ? 'บดหยาบ' : 'บดกลาง');
    var h = 10 + (v.temp - 80) / 16 * 84;
    var tCol = v.temp >= 94 ? '--rust' : (v.temp <= 87 ? '--sage' : '--gold');
    var th = document.getElementById('rig-therm');
    th.setAttribute('y', 130 - h); th.setAttribute('height', h); th.setAttribute('fill', 'var(' + tCol + ')');
    document.getElementById('rig-bulb').setAttribute('fill', 'var(' + tCol + ')');
    document.getElementById('rig-temp-txt').textContent = v.temp + '°C';
    document.getElementById('rig-stream').setAttribute('stroke-width', (1.6 + v.agitation * 0.38).toFixed(2));
    var shown = Math.ceil(v.agitation / 3.4);
    document.querySelectorAll('#rig-swirl path').forEach(function(a, i){ a.style.opacity = i < shown ? (1 - i * 0.22) : 0; });
    document.getElementById('rig-liquid').setAttribute('fill-opacity', (0.95 - (v.ratio - 12) / 8 * 0.6).toFixed(2));
    document.getElementById('rig-ratio-txt').textContent = '1:' + v.ratio.toFixed(1);
    var tf = Math.min(v.time / 240, 0.999), ang = tf * 2 * Math.PI;
    var ex = 282 + 26 * Math.sin(ang), ey = 38 - 26 * Math.cos(ang);
    document.getElementById('rig-arc').setAttribute('d', 'M282 12 A26 26 0 ' + (tf > 0.5 ? 1 : 0) + ' 1 ' + ex.toFixed(1) + ' ' + ey.toFixed(1));
    document.getElementById('rig-time-txt').textContent = fmtTime(v.time);
  }

  function render(){
    var v = readInputs();
    vals.grind.textContent = v.grind + ' / 10';
    vals.temp.textContent = v.temp + '°C';
    vals.ratio.textContent = '1 : ' + v.ratio.toFixed(1);
    vals.time.textContent = fmtTime(v.time);
    vals.agitation.textContent = v.agitation + ' / 10';
    var r = compute(v), cls = classify(r.ey, r.tds), verdict = VERDICTS[cls.eyCat + '_' + cls.tdsCat];
    document.getElementById('m-ey').textContent = r.ey.toFixed(1) + '%';
    document.getElementById('m-tds').textContent = r.tds.toFixed(2) + '%';
    document.getElementById('m-zone').textContent = ZONE_LABEL[cls.eyCat] + ' · ' + (cls.tdsCat === 'weak' ? 'บาง' : cls.tdsCat === 'strong' ? 'เข้ม' : 'พอดี');
    var tag = document.getElementById('verdict-tag');
    tag.textContent = verdict.tag; tag.style.background = 'var(' + colorVar[verdict.color] + ')';
    document.getElementById('verdict-title').textContent = verdict.title;
    document.getElementById('verdict-body').textContent = verdict.body;
    updateChartPoint(r.ey, r.tds, verdict.color);
    updateCup(r.ey, r.tds);
    updateSequence(r.ey);
    buildFactors(v);
    updateRig(v);
    Book.store.set('lab.values', v);
  }

  Object.keys(els).forEach(function(k){ els[k].addEventListener('input', render); });
  document.querySelectorAll('.preset-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var p = PRESETS[btn.getAttribute('data-preset')];
      if (!p) return;
      if (chActive){ chEnd(); chEl.result.hidden = true; chEl.intro.hidden = false; chEl.start.textContent = 'เริ่มโจทย์'; }
      applyValues(p); render();
    });
  });

  /* ---------- exercise: fix a flawed brew in five moves ---------- */
  var CH_LIMIT = 5;
  var CHALLENGES = [
    { title: 'เปรี้ยวจัดและจืด', desc: 'ชิมแล้วเปรี้ยวแหลม รสบางเหมือนน้ำผลไม้เจือจาง', values: { grind: 8, temp: 88, ratio: 18, time: 110, agitation: 2 } },
    { title: 'เปรี้ยวแต่เข้มข้น', desc: 'เข้มและหนัก แต่รสเปรี้ยวฝาด ไม่มีความหวานมากลบ', values: { grind: 8, temp: 86, ratio: 12, time: 120, agitation: 2 } },
    { title: 'ขมฝาดและเข้มจัด', desc: 'ขมไหม้ ฝาดแห้งคอ ดื่มแล้วหนักมาก', values: { grind: 2, temp: 96, ratio: 15, time: 220, agitation: 9 } },
    { title: 'ขมนำ ทั้งที่ความเข้มข้นพอดี', desc: 'ความเข้มข้นกำลังดี แต่ท้ายแก้วขมและฝาดเด่นเกินไป', values: { grind: 4, temp: 94, ratio: 19.5, time: 190, agitation: 7 } }
  ];
  var chActive = false, chIdx = -1, chMoves = 0, chStart = null;
  var chEl = {
    start: document.getElementById('ch-start'), intro: document.getElementById('ch-intro'), active: document.getElementById('ch-active'),
    title: document.getElementById('ch-title'), desc: document.getElementById('ch-desc'), moves: document.getElementById('ch-moves'),
    hint: document.getElementById('ch-hint'), giveup: document.getElementById('ch-giveup'), hintText: document.getElementById('ch-hint-text'),
    result: document.getElementById('ch-result'), tag: document.getElementById('ch-result-tag'), rTitle: document.getElementById('ch-result-title'), rBody: document.getElementById('ch-result-body')
  };
  function chIsBalanced(v){ var r = compute(v), c = classify(r.ey, r.tds); return c.eyCat === 'balanced' && c.tdsCat === 'balanced'; }
  function chRenderMoves(){
    var html = '';
    for (var i = 0; i < CH_LIMIT; i++) html += '<i class="' + (i < chMoves ? 'used' : '') + '"></i>';
    chEl.moves.innerHTML = html + '<span>ปรับแล้ว ' + chMoves + '/' + CH_LIMIT + ' ครั้ง</span>';
  }
  function chHintFor(v){
    var r = compute(v);
    if (r.ey < EY_LO) return 'การสกัดยังน้อยไป (EY ' + r.ey.toFixed(1) + '%) ลองบดละเอียดขึ้น เพิ่มเวลา หรือเพิ่มอุณหภูมิ';
    if (r.ey > EY_HI) return 'การสกัดมากเกินไป (EY ' + r.ey.toFixed(1) + '%) ลองบดหยาบขึ้น ลดเวลา หรือลดอุณหภูมิ';
    if (r.tds < TDS_LO) return 'การสกัดอยู่ในช่วงแล้ว แต่ความเข้มข้นต่ำไป (TDS ' + r.tds.toFixed(2) + '%) ลองลดอัตราส่วนน้ำ';
    if (r.tds > TDS_HI) return 'การสกัดอยู่ในช่วงแล้ว แต่ความเข้มข้นสูงไป (TDS ' + r.tds.toFixed(2) + '%) ลองเพิ่มอัตราส่วนน้ำ';
    return 'ตอนนี้อยู่ในโซนสมดุลแล้ว';
  }
  function chShowResult(kind, title, body){
    chEl.result.hidden = false;
    chEl.tag.textContent = kind === 'won' ? 'สำเร็จ' : (kind === 'lost' ? 'ครบจำนวนครั้ง' : 'เฉลยแนวทาง');
    chEl.tag.style.background = 'var(' + (kind === 'won' ? '--gold' : '--rust') + ')';
    chEl.rTitle.textContent = title;
    chEl.rBody.textContent = body;
  }
  function chEnd(){
    chActive = false;
    chEl.active.hidden = true;
    chEl.hintText.hidden = true;
    chEl.start.textContent = 'โจทย์ใหม่';
  }
  function chBiggestMover(from, to){
    var items = [
      { name: 'เบอร์บด', d: 4 * ((10 - to.grind) - (10 - from.grind)) / 9 },
      { name: 'อุณหภูมิน้ำ', d: 2 * (to.temp - from.temp) / 16 },
      { name: 'เวลาสกัด', d: 4 * (to.time - from.time) / 150 },
      { name: 'การกวน', d: 2 * (to.agitation - from.agitation) / 10 }
    ];
    items.sort(function(a, b){ return Math.abs(b.d) - Math.abs(a.d); });
    return items[0];
  }
  function chWin(){
    var now = readInputs(), mover = chBiggestMover(chStart, now);
    var parts = ['ใช้ ' + chMoves + ' จาก ' + CH_LIMIT + ' ครั้ง'];
    if (Math.abs(mover.d) > 0.05) parts.push('ตัวแปรที่ขยับ EY มากที่สุดคือ' + mover.name + ' (' + (mover.d > 0 ? '+' : '') + mover.d.toFixed(1) + '%)');
    if (now.ratio !== chStart.ratio) parts.push('อัตราส่วนน้ำช่วยคุม TDS ให้เข้าโซน');
    chEnd();
    chShowResult('won', chMoves <= 2 ? 'เยี่ยม แก้ได้ในไม่กี่ครั้ง' : 'แก้รสชาติสำเร็จ', parts.join(' · '));
  }
  function chStartNew(){
    var next;
    do { next = Math.floor(Math.random() * CHALLENGES.length); } while (CHALLENGES.length > 1 && next === chIdx);
    chIdx = next;
    var c = CHALLENGES[chIdx];
    chStart = { grind: c.values.grind, temp: c.values.temp, ratio: c.values.ratio, time: c.values.time, agitation: c.values.agitation };
    chActive = true; chMoves = 0;
    applyValues(c.values); render();
    chEl.title.textContent = c.title;
    chEl.desc.textContent = c.desc;
    chEl.intro.hidden = true; chEl.result.hidden = true; chEl.hintText.hidden = true; chEl.active.hidden = false;
    chEl.start.textContent = 'สลับโจทย์';
    chRenderMoves();
  }
  Object.keys(els).forEach(function(k){
    els[k].addEventListener('change', function(){
      if (!chActive) return;
      chMoves++; chRenderMoves();
      var v = readInputs();
      if (chIsBalanced(v)){ chWin(); return; }
      if (chMoves >= CH_LIMIT){
        var r = compute(v);
        chEnd();
        chShowResult('lost', 'ยังไม่เข้าโซนสมดุล', 'ตอนนี้ EY ' + r.ey.toFixed(1) + '% · TDS ' + r.tds.toFixed(2) + '% — ' + chHintFor(v) + ' · กด "โจทย์ใหม่" เพื่อลองอีกครั้ง');
      }
    });
  });
  chEl.start.addEventListener('click', chStartNew);
  chEl.hint.addEventListener('click', function(){ chEl.hintText.hidden = false; chEl.hintText.textContent = chHintFor(readInputs()); });
  chEl.giveup.addEventListener('click', function(){ var hint = chHintFor(readInputs()); chEnd(); chShowResult('gaveup', 'ลองดูแนวทางนี้', hint); });
  document.querySelectorAll('[data-start-exercise]').forEach(function(b){
    b.addEventListener('click', function(){
      chStartNew();
      document.getElementById('lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- start ---------- */
  var saved = Book.store.get('lab.values', null);
  if (saved && typeof saved === 'object') applyValues(saved);
  buildChartStatic();
  drawTrail();
  if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', function(){ buildChartStatic(); drawTrail(); render(); });
  buildCup();
  buildSequenceStatic();
  render();
})();
