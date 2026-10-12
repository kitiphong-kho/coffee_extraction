/* Small interactive figures: parameter tiles, EY calculator and mini control chart (บทที่ 1), filter table and
   troubleshooting (บทที่ 4), water chemistry (บทที่ 6). Each one only runs
   when its markup is on the page. */
(function(){
  'use strict';

  /* ---------- 1.4 six parameters ---------- */
  var PARAM_INFO = [
    { t: 'เวลาสกัด', en: 'Extraction time', b: [
      ['คืออะไร', 'ระยะที่น้ำสัมผัสผงกาแฟ ยิ่งนานยิ่งดึงสารที่ละลายยากออกมาเพิ่ม'],
      ['นานขึ้น', 'สารที่ออกมาก่อนคือน้ำตาล กรดอินทรีย์ และคาเฟอีน ส่วนสารที่ละลายยากซึ่งบางตัวขม/ฝาดตามมาทีหลัง การสกัดจึงเพิ่มไปตามลำดับโมเลกุล'],
      ['สั้นลง', 'หยุดการสกัดก่อนถึงกลุ่มโมเลกุลถัดไป'],
      ['สุดโต่ง', 'นานไป: ฝาดติดลิ้น หนักเกินไป · สั้นไป: เปรี้ยวแหลม กลิ่นหญ้า'],
      ['ในการดริป', 'เวลาเป็น "ผลลัพธ์" ของเบอร์บด การไหล และการเท ไม่ใช่ปุ่มที่ตั้งเองได้ ถ้าเวลาเปลี่ยนโดยไม่ได้แตะเบอร์บด ให้สงสัยว่าเบดอุดตันหรือน้ำไหลเป็นทาง สูตรของ Gagné มี drawdown ราว 2:45–3:30 นาที']
    ]},
    { t: 'อุณหภูมิน้ำ', en: 'Water temperature', b: [
      ['คืออะไร', 'แรงขับหลักของการสกัด น้ำร้อนขึ้นละลายสารได้มากขึ้น'],
      ['ร้อนขึ้น', 'สกัดเร็ว ดึงความหวานและบอดี้ได้ดี แต่สารหอมระเหย (VOCs) ก็ระเหยหนีมากขึ้นด้วย'],
      ['เย็นลง', 'สกัดช้า ลดโอกาสดึงรสขม/ฝาด แต่ถ้าเย็นไปจะเปรี้ยวและขาดมิติ'],
      ['สุดโต่ง', 'ร้อนไป: ขมไหม้ ฉุนจัด · เย็นไป: เปรี้ยวฝาด ขาดมิติ'],
      ['ในการดริป', 'สูตรทั่วไปราว 92–96 °C (สูตรพื้นฐานในบทที่ 3 ใช้ 93 °C) กาแฟคั่วอ่อนบางสูตรใช้ถึง 99–100 °C ข้อแลกเปลี่ยนคือ "สกัดสาร" กับ "รักษากลิ่น"']
    ]},
    { t: 'แรงดัน', en: 'Pressure', b: [
      ['คืออะไร', 'แรงที่ดันน้ำผ่านเบด จำเป็นกับวิธีกลุ่มใช้แรงดัน เช่น เอสเพรสโซที่ราว 9 bar'],
      ['ทำอะไร', 'กันไม่ให้ VOCs ระเหยหนีก่อนถึงถ้วย และทำให้เกิดครีมา (จาก CO₂ ที่ละลายในกาแฟคั่ว)'],
      ['ในการดริป', 'ไม่มีตัวแปรนี้ให้ปรับ ใช้แรงโน้มถ่วงอย่างเดียว สิ่งที่ใกล้เคียงที่สุดคือ "ความสูงของน้ำเหนือเบด" ซึ่งกำหนดแรงดันอุทกสถิตเล็ก ๆ ตามกฎ Darcy และรู้สึกได้จากการเทน้ำสูงหรือต่ำ (ดูเทคนิคการเทในหัวข้อ 3.4 และ 4.3)']
    ]},
    { t: 'อัตราส่วนกาแฟ/น้ำ', en: 'Brew ratio', b: [
      ['คืออะไร', 'น้ำหนักน้ำต่อน้ำหนักกาแฟ กำหนดทั้งความเข้มข้นและลักษณะของเบด'],
      ['น้ำมากขึ้น', 'เช่น 1:17 เจือจางลง TDS ต่ำ บอดี้บางลง'],
      ['น้ำน้อยลง', 'เช่น 1:13 เข้มข้นขึ้น TDS สูง บอดี้หนา แต่ชั้นกาแฟแน่นอาจสกัดไม่ทั่ว'],
      ['สุดโต่ง', 'น้ำมากไป: เจือจาง ชืด ขมปลาย · น้ำน้อยไป: รสทึบ เปรี้ยวจัด'],
      ['ในการดริป', 'ใช้บ่อยราว 1:15–1:17 (สูตรพื้นฐานในบทที่ 3 ใช้ 1:15, Scott Rao 1:17) ในห้องปฏิบัติการจำลอง ตัวแปรนี้ปรับ TDS เป็นหลัก ส่วน EY มาจากบด อุณหภูมิ เวลา และการกวน']
    ]},
    { t: 'ขนาดบด', en: 'Particle size', b: [
      ['คืออะไร', 'ขนาดอนุภาคของผงกาแฟ กำหนดพื้นที่ผิวและความต้านทานการไหล'],
      ['ละเอียดขึ้น', 'พื้นที่ผิวมาก น้ำไหลช้า สกัดเพิ่มขึ้น'],
      ['หยาบขึ้น', 'พื้นที่ผิวน้อย น้ำไหลเร็ว สกัดลดลง'],
      ['สุดโต่ง', 'ละเอียดไป: ฝาด ขม แห้งคอ · หยาบไป: เปรี้ยวโดด จืด บอดี้บาง'],
      ['ในการดริป', 'ละเอียดเกินไป fines จะไหลลงอุดกระดาษกรอง น้ำค้างนานผิดปกติ ผงกาแฟยังบวมได้ถึง 20–23% ใน 10–15 นาทีแรกหลังโดนน้ำ ทำให้ช่องว่างแคบลงอีก ถ้าติดขัดให้บดหยาบขึ้นก่อน']
    ]},
    { t: 'คุณภาพน้ำ', en: 'Water quality', b: [
      ['คืออะไร', 'แร่ธาตุในน้ำ (Na⁺, Mg²⁺, Ca²⁺) และความเป็นด่าง (bicarbonate) ซึ่งน้ำเป็นส่วนผสมกว่า 98% ของกาแฟที่ชง'],
      ['ทำอะไร', 'ช่วยหรือกดการละลายของสารรสชาติ น้ำแร่ธาตุต่ำมาก (กรอง/RO) สกัดได้จืดแบน น้ำด่างสูงบัฟเฟอร์กรดจนรสแบน'],
      ['จุดสำคัญ', 'ความสมดุลขึ้นกับความสัมพันธ์ระหว่างไอออนบวกกับความเป็นด่าง ไม่ใช่แร่ธาตุตัวใดตัวหนึ่งเดี่ยว ๆ'],
      ['ในการดริป', 'ดูตัวเลขอ้างอิงละเอียดในหัวข้อ 6.3 คุณภาพน้ำ (ความกระด้าง 70–80 ppm, ความเป็นด่าง 50 ppm) ผลต่ออัตราการสกัดยังเป็นสมมติฐานที่บางงานวิจัยไม่พบความต่างชัด']
    ]},
    { t: 'การกวน/การรินน้ำ', en: 'Agitation', tag: 'เสริมสำหรับดริป', b: [
      ['คืออะไร', 'แรงที่น้ำและมือกระทำต่อเบดกาแฟ มี 3 รูปแบบ คือ สายน้ำจากกาน้ำ การหมุนวน (swirl) และการคนด้วยไม้ ยิ่งน้ำปะทะผงกาแฟถี่และแรง การสกัดยิ่งเร็ว'],
      ['กวน/รินแรงขึ้น', 'น้ำปะทะผงกาแฟถี่ขึ้น เร่งการสกัดและช่วยให้ผงเปียกทั่ว'],
      ['รินเบาลง', 'น้ำไหลผ่านนิ่มนวล ชะลอการสกัด'],
      ['สุดโต่ง', 'แรงไป: สกัดเกินง่าย ฝาด · เบาไป: สกัดไม่ทั่วถึง เปรี้ยวแหลม'],
      ['สายน้ำ', 'ปรับความแรงได้ต่อเนื่องตลอดการเท แต่ถ้าแรงหรือเทจากที่สูงเกินไป น้ำจะเจาะเบดจนเกิด channeling (น้ำไหลลัดเป็นทาง) ควรเทจากความสูงต่ำกว่าจุดที่สายน้ำเริ่มแตกเป็นหยดเล็กน้อย'],
      ['Swirl (Rao Spin)', 'ช่วยจัดหน้าเบดให้เรียบและดึงผงที่ติดผนังลงมา แต่ถ้าแรงเกินไป fines จะแยกชั้นลงก้นกระดาษกรองเร็วและทำให้น้ำไหลช้า'],
      ['การคน', 'ใช้สลายก้อนผงแห้งตอน Bloom ได้ดี แต่ห้ามคนหลัง Bloom จบ เพราะรบกวนเบดรุนแรง'],
      ['การเคาะดริปเปอร์', 'ไม่แนะนำ เพราะเร่ง fines migration และอัดเบดแน่นขึ้น ใช้การหมุนวนเบา ๆ แทน'],
      ['อ่านต่อ', 'ดูวิธีเทในหัวข้อ 3.4 (เทตรงกลาง, เทวนเป็นวง, เทเร็ว/ช้า) และหัวข้อ 4.3 (3 วิธีสร้างแรงกวน)']
    ]}
  ];
  var paramTiles = document.querySelectorAll('.param-tile[data-param]');
  var paramDetail = document.getElementById('param-detail');
  var PARAM_HINT = '<p class="param-hint">แตะตัวแปรด้านบนเพื่อดูว่าแต่ละตัวมีผลอย่างไร</p>';
  paramTiles.forEach(function(tile){
    tile.addEventListener('click', function(){
      var open = tile.getAttribute('aria-expanded') === 'true';
      paramTiles.forEach(function(x){ x.setAttribute('aria-expanded', 'false'); });
      if (open){ paramDetail.innerHTML = PARAM_HINT; return; }
      tile.setAttribute('aria-expanded', 'true');
      var info = PARAM_INFO[Number(tile.getAttribute('data-param'))];
      paramDetail.innerHTML = '';
      var h = document.createElement('h3'); h.textContent = info.t;
      var en = document.createElement('span'); en.className = 'pd-en'; en.textContent = info.en; h.appendChild(en);
      if (info.tag){ var tg = document.createElement('span'); tg.className = 'pd-tag'; tg.textContent = info.tag; h.appendChild(tg); }
      paramDetail.appendChild(h);
      var dl = document.createElement('dl'); dl.className = 'pd-list';
      info.b.forEach(function(row){
        var dt = document.createElement('dt'); dt.textContent = row[0];
        var dd = document.createElement('dd'); dd.textContent = row[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      paramDetail.appendChild(dl);
    });
  });

  /* ---------- 4.2 filter table rows ---------- */
  var FILTER_INFO = {
    bed: { t: 'เบดกาแฟ — ตัวกรองหลัก',
      d: 'ผงกาแฟเรียงซ้อนกันเป็นชั้น ๆ และดัก fines ไว้ในเบดเอง แต่เบดไม่นิ่ง ระหว่างชง fines บางส่วนเคลื่อนลงไปสะสมด้านล่าง ทำให้ช่องว่างที่น้ำไหลผ่านลดลง น้ำไหลช้าลงและการสกัดไม่สม่ำเสมอ',
      svg: '<svg viewBox="0 0 120 80" role="img" aria-label="หน้าตัดเบดกาแฟ"><path d="M10,6 L110,6 L90,74 L30,74" fill="none" stroke="currentColor" stroke-width="2" opacity=".5"/><g fill="currentColor"><circle cx="30" cy="18" r="6" opacity=".8"/><circle cx="48" cy="16" r="6" opacity=".8"/><circle cx="66" cy="18" r="6" opacity=".8"/><circle cx="84" cy="16" r="6" opacity=".8"/><circle cx="40" cy="31" r="6" opacity=".8"/><circle cx="58" cy="30" r="6" opacity=".8"/><circle cx="76" cy="31" r="6" opacity=".8"/><circle cx="49" cy="44" r="6" opacity=".8"/><circle cx="67" cy="44" r="6" opacity=".8"/></g><g fill="var(--rust)"><circle cx="44" cy="62" r="1.8"/><circle cx="52" cy="66" r="1.8"/><circle cx="60" cy="62" r="1.8"/><circle cx="68" cy="67" r="1.8"/><circle cx="76" cy="62" r="1.8"/><circle cx="56" cy="70" r="1.8"/><circle cx="64" cy="58" r="1.8"/></g><path d="M58,50 L58,56 M55,54 L58,57 L61,54" stroke="var(--rust)" stroke-width="1.5" fill="none"/></svg>' },
    paper: { t: 'กระดาษกรอง — กรองเชิงลึก',
      d: 'เส้นใยซ้อนกันลึกและคดเคี้ยว ดักทั้ง fines และน้ำมันกาแฟได้มาก ถ้วยจึงมักใส สะอาด บอดี้เบากว่า ถ้า fines สะสมมากจนอุดเส้นใย น้ำจะไหลช้าลง',
      svg: '<svg viewBox="0 0 120 80" role="img" aria-label="เส้นใยกระดาษกรอง"><g fill="none" stroke="currentColor" stroke-width="2" opacity=".7"><path d="M6,28 C30,10 50,46 74,24 S104,40 116,30"/><path d="M4,40 C28,58 48,22 72,44 S100,28 118,46"/><path d="M6,54 C30,36 52,66 76,48 S104,62 116,52"/></g><g fill="var(--rust)"><circle cx="30" cy="8" r="1.8"/><circle cx="56" cy="8" r="1.8"/><circle cx="82" cy="8" r="1.8"/><circle cx="43" cy="22" r="1.8"/><circle cx="68" cy="34" r="1.8"/></g><g fill="var(--sage)"><circle cx="48" cy="74" r="1.4"/><circle cx="78" cy="74" r="1.4"/></g></svg>' },
    metal: { t: 'ตะแกรงโลหะ — กรองที่ผิว',
      d: 'อาศัยรูเปิดบนผิวเป็นหลัก fines ขนาดเล็กจึงผ่านลงถ้วยได้ และอาจมีชั้น fines สะสมบนผิว น้ำมันและตะกอน (silt) ลงถ้วยมากกว่า ทำให้มักได้บอดี้หนักและขุ่นกว่า',
      svg: '<svg viewBox="0 0 120 80" role="img" aria-label="ตะแกรงโลหะ"><g stroke="currentColor" stroke-width="3" opacity=".8"><line x1="6" y1="40" x2="26" y2="40"/><line x1="34" y1="40" x2="54" y2="40"/><line x1="62" y1="40" x2="82" y2="40"/><line x1="90" y1="40" x2="114" y2="40"/></g><g fill="currentColor" opacity=".8"><circle cx="16" cy="32" r="5"/><circle cx="72" cy="32" r="5"/><circle cx="100" cy="32" r="5"/></g><g fill="var(--rust)"><circle cx="30" cy="22" r="1.8"/><circle cx="58" cy="22" r="1.8"/><circle cx="86" cy="22" r="1.8"/><circle cx="30" cy="56" r="1.8"/><circle cx="58" cy="64" r="1.8"/><circle cx="86" cy="58" r="1.8"/></g><path d="M30,26 L30,50 M58,26 L58,58 M86,26 L86,52" stroke="var(--rust)" stroke-width="1" stroke-dasharray="2 3" fill="none"/></svg>' }
  };
  var filterRows = document.querySelectorAll('.filter-row');
  var filterDetail = document.getElementById('filter-detail');
  function showFilter(row){
    var on = row.classList.contains('on');
    filterRows.forEach(function(r){ r.classList.remove('on'); r.setAttribute('aria-pressed', 'false'); });
    if (on){ filterDetail.hidden = true; return; }
    row.classList.add('on'); row.setAttribute('aria-pressed', 'true');
    var info = FILTER_INFO[row.getAttribute('data-filter')];
    filterDetail.innerHTML = info.svg + '<div class="fd-text"><h3>' + info.t + '</h3><p>' + info.d + '</p></div>';
    filterDetail.hidden = false;
  }
  filterRows.forEach(function(row){
    row.addEventListener('click', function(){ showFilter(row); });
    row.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); showFilter(row); } });
  });

  /* ---------- 4.4 troubleshooting ---------- */
  var TROUBLES = [
    { cause: 'Fines migration อุดกระดาษกรอง — fines ถูกน้ำพัดลงไปอุดรูพรุนที่ก้นเบด', fix: ['ลดการ swirl', 'ลดความสูงที่เทน้ำ', 'บดหยาบขึ้น'] },
    { cause: 'Micro-channeling ในเบด — น้ำเลือกไหลทางที่ต้านทานน้อย บางจุดสกัดเกิน บางจุดน้อยไป', fix: ['เกลี่ยหน้าเบดให้เรียบ', 'เลี่ยงเทน้ำโดนผนังกระดาษ'], challenge: true },
    { cause: 'น้ำเย็นไป หรือบดหยาบไป (under-extraction)', fix: ['เช็คอุณหภูมิน้ำ — สูตรทั่วไปใช้ราว 92–96°C ส่วนกาแฟคั่วอ่อนบางสูตรใช้ถึง 99–100°C', 'บดละเอียดขึ้น'], challenge: true }
  ];
  var troubleChips = document.querySelectorAll('.trouble-chip');
  var troubleResult = document.getElementById('trouble-result');
  troubleChips.forEach(function(chip){
    chip.addEventListener('click', function(){
      var on = chip.getAttribute('aria-pressed') === 'true';
      troubleChips.forEach(function(c){ c.setAttribute('aria-pressed', 'false'); });
      troubleResult.innerHTML = '';
      if (on){ troubleResult.innerHTML = '<p class="param-hint">แตะอาการที่เจอ เพื่อดูสาเหตุและวิธีแก้</p>'; return; }
      chip.setAttribute('aria-pressed', 'true');
      var tr = TROUBLES[Number(chip.getAttribute('data-trouble'))];
      var k1 = document.createElement('div'); k1.className = 'tr-k tr-cause'; k1.textContent = 'สาเหตุ';
      var p = document.createElement('p'); p.textContent = tr.cause;
      var k2 = document.createElement('div'); k2.className = 'tr-k tr-fix'; k2.textContent = 'วิธีแก้';
      var ul = document.createElement('ul');
      tr.fix.forEach(function(f){ var li = document.createElement('li'); li.textContent = f; ul.appendChild(li); });
      [k1, p, k2, ul].forEach(function(n){ troubleResult.appendChild(n); });
      if (tr.challenge){
        var a = document.createElement('a'); a.className = 'btn small'; a.href = 'ch2.html#s2-3';
        a.textContent = 'ลองฝึกแก้รสชาติในหัวข้อ 2.3 →';
        troubleResult.appendChild(a);
      }
    });
  });

  /* ---------- 6.3 water quality (Córdoba et al., 2020 §4.6) ---------- */
  var WATER_INFO = {
    ro: { color: '--sage', note: 'แร่ธาตุต่ำเกินไป น้ำดึงรสชาติออกมาได้ไม่เต็มที่ งานวิจัยอ้างว่าน้ำกลั่น/แร่ธาตุต่ำมากทำให้กาแฟมีรส<strong>เปรี้ยวจัดและบางเกินไป</strong> (Lockhart et al., 1955; Pangborn &amp; Trabue, 1971)<sup class="cite"><a href="appendix.html#ref-6" data-ref="6">6</a></sup><sup class="cite"><a href="appendix.html#ref-7" data-ref="7">7</a></sup>' },
    balanced: { color: '--gold', note: 'แมกนีเซียม (Mg²⁺) และแคลเซียม (Ca²⁺) ในระดับสมดุลถูกเสนอว่าช่วยดึงรสชาติออกมาได้ดีขึ้น (Hendon et al., 2014)<sup class="cite"><a href="appendix.html#ref-5" data-ref="5">5</a></sup> แต่การทดลองอื่นยังไม่พบผลต่อ<strong>อัตราการสกัด</strong>ชัดเจน — ที่แน่นอนกว่าคือน้ำสะอาด ไม่มีกลิ่น/รสแปลกปลอมมาบดบังกาแฟ' },
    hard: { color: '--rust', note: 'ไบคาร์บอเนต/ความเป็นด่าง (Alkalinity) สูงทำหน้าที่เป็นบัฟเฟอร์ลดทอนความเป็นกรดตามธรรมชาติ น้ำด่างสูงจึงมักให้กาแฟรส<strong>ขมและจืดชืด (flat)</strong> ต่างจาก "ความกระด้าง" (Ca²⁺/Mg²⁺) ซึ่งเป็นแร่ธาตุคนละแกน (Lockhart et al., 1955)<sup class="cite"><a href="appendix.html#ref-6" data-ref="6">6</a></sup>' }
  };
  var ION_COUNTS = { ro: { mg: 0, ca: 1, hco: 0 }, balanced: { mg: 3, ca: 3, hco: 2 }, hard: { mg: 2, ca: 3, hco: 6 } };
  var WATER_SHORT = { ro: 'เปรี้ยว · บาง', balanced: 'ดึงรสได้ดี', hard: 'ขม · แบน' };
  var waterNote = document.getElementById('water-note');
  var waterShort = document.getElementById('water-short');
  function renderWater(kind){
    var info = WATER_INFO[kind];
    if (waterShort){ waterShort.textContent = WATER_SHORT[kind]; waterShort.style.color = 'var(' + info.color + ')'; }
    waterNote.innerHTML = info.note;
    waterNote.style.borderColor = 'var(' + info.color + ')';
    var counts = ION_COUNTS[kind];
    document.querySelectorAll('#water-drop .ion').forEach(function(g){
      g.classList.toggle('on', Number(g.getAttribute('data-i')) < counts[g.getAttribute('data-t')]);
    });
  }
  if (waterNote){
    var waterBtns = document.querySelectorAll('#water-btns .chip');
    waterBtns.forEach(function(btn){
      btn.addEventListener('click', function(){
        waterBtns.forEach(function(b){ b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        renderWater(btn.getAttribute('data-water'));
      });
    });
    renderWater('balanced');
  }

  /* ---------- 1.3 EY calculator + 1.4 mini brewing control chart ---------- */
  var ABSORB = 2; // grounds hold about twice their weight of water after brewing
  var EY_LO = 18, EY_HI = 22, TDS_LO = 1.15, TDS_HI = 1.35;
  var eycDose = document.getElementById('eyc-dose');
  var miniChart = document.getElementById('mini-bcc');
  var MONO = 'IBM Plex Mono, monospace', SANS = 'IBM Plex Sans Thai Looped, sans-serif';
  var MC = { W: 520, H: 300, l: 58, r: 18, t: 18, b: 52, ey0: 12, ey1: 28, tds0: 0.8, tds1: 1.8 };
  function mcX(ey){ return MC.l + (Math.max(MC.ey0, Math.min(MC.ey1, ey)) - MC.ey0) / (MC.ey1 - MC.ey0) * (MC.W - MC.l - MC.r); }
  function mcY(tds){ return MC.t + (1 - (Math.max(MC.tds0, Math.min(MC.tds1, tds)) - MC.tds0) / (MC.tds1 - MC.tds0)) * (MC.H - MC.t - MC.b); }
  function drawMiniChart(){
    if (!miniChart) return;
    var o = '', x0 = mcX(EY_LO), x1 = mcX(EY_HI), y0 = mcY(TDS_HI), y1 = mcY(TDS_LO);
    [12, 16, 20, 24, 28].forEach(function(e){
      o += '<line x1="' + mcX(e) + '" x2="' + mcX(e) + '" y1="' + MC.t + '" y2="' + (MC.H - MC.b) + '" stroke="var(--line)"/>';
      o += '<text x="' + mcX(e) + '" y="' + (MC.H - MC.b + 18) + '" text-anchor="middle" font-size="12" fill="var(--ink-dim)" font-family="' + MONO + '">' + e + '%</text>';
    });
    [0.8, 1.0, 1.2, 1.4, 1.6, 1.8].forEach(function(t){
      o += '<line x1="' + MC.l + '" x2="' + (MC.W - MC.r) + '" y1="' + mcY(t) + '" y2="' + mcY(t) + '" stroke="var(--line)"/>';
      o += '<text x="' + (MC.l - 8) + '" y="' + (mcY(t) + 4) + '" text-anchor="end" font-size="12" fill="var(--ink-dim)" font-family="' + MONO + '">' + t.toFixed(1) + '</text>';
    });
    o += '<rect x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" fill="var(--gold)" fill-opacity=".18" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="5 3"/>';
    o += '<text x="' + ((x0 + x1) / 2) + '" y="' + (y1 - 7) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--gold)" font-family="' + SANS + '">ช่วงที่ SCA แนะนำ</text>';
    o += '<text x="' + ((MC.l + x0) / 2) + '" y="' + (MC.t + 16) + '" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--sage)" font-family="' + SANS + '">สกัดน้อยไป</text>';
    o += '<text x="' + ((x1 + MC.W - MC.r) / 2) + '" y="' + (MC.t + 16) + '" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--rust)" font-family="' + SANS + '">สกัดมากไป</text>';
    o += '<path d="M' + MC.l + ' ' + MC.t + 'V' + (MC.H - MC.b) + 'H' + (MC.W - MC.r) + '" fill="none" stroke="var(--ink-dim)" stroke-width="1.5"/>';
    o += '<text x="' + (MC.l + (MC.W - MC.l - MC.r) / 2) + '" y="' + (MC.H - 10) + '" text-anchor="middle" font-size="13" fill="var(--ink-dim)" font-family="' + SANS + '">Extraction Yield (%) — สกัดมากขึ้น →</text>';
    o += '<text x="' + (-(MC.t + (MC.H - MC.t - MC.b) / 2)) + '" y="16" transform="rotate(-90)" text-anchor="middle" font-size="13" fill="var(--ink-dim)" font-family="' + SANS + '">TDS (%) — เข้มขึ้น →</text>';
    o += '<g id="mini-pt"><circle r="8" fill="var(--accent)" stroke="var(--page)" stroke-width="2.5"/><text id="mini-pt-label" y="-14" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)" font-family="' + MONO + '"></text></g>';
    miniChart.innerHTML = o;
  }
  // round half up (17.55 → 17.6) instead of toFixed's binary-float rounding
  function fmt(n, d){ var p = Math.pow(10, d); return (Math.round(n * p + 1e-9) / p).toFixed(d); }
  function eyZone(ey){ return ey < EY_LO ? 'under' : (ey > EY_HI ? 'over' : 'ideal'); }
  function tdsZone(t){ return t < TDS_LO ? 'บาง' : (t > TDS_HI ? 'เข้ม' : 'เข้มพอดี'); }
  function calcEY(){
    var dose = Number(eycDose.value), water = Number(document.getElementById('eyc-water').value);
    var tds = Number(document.getElementById('eyc-tds').value), bevIn = document.getElementById('eyc-bev').value;
    var verdict = document.getElementById('eyc-verdict'), steps = document.getElementById('eyc-steps');
    var measured = bevIn !== '' && Number(bevIn) > 0;
    var bev = measured ? Number(bevIn) : water - ABSORB * dose;
    var pt = document.getElementById('mini-pt');
    if (!(dose > 0) || !(water > 0) || !(tds > 0) || !(bev > 0)){
      ['eyc-bev-out', 'eyc-sol-out', 'eyc-ey-out'].forEach(function(id){ document.getElementById(id).textContent = '—'; });
      verdict.textContent = 'กรอกปริมาณกาแฟ น้ำที่เท และ TDS ให้ครบ (น้ำที่เทต้องมากกว่า 2 เท่าของปริมาณกาแฟ)';
      verdict.style.borderColor = 'var(--line)';
      steps.innerHTML = '';
      if (pt) pt.style.display = 'none';
      return;
    }
    var sol = bev * tds / 100, ey = sol / dose * 100, z = eyZone(ey);
    document.getElementById('eyc-bev-out').textContent = fmt(bev, 0) + ' g';
    document.getElementById('eyc-sol-out').textContent = fmt(sol, 2) + ' g';
    document.getElementById('eyc-ey-out').textContent = fmt(ey, 1) + '%';
    var ZT = { under: ['สกัดน้อยไป', '--sage', 'อาจเปรี้ยวนำ จืด'], ideal: ['สกัดพอดี', '--gold', 'อยู่ในช่วงที่ SCA แนะนำ'], over: ['สกัดมากไป', '--rust', 'อาจขม ฝาด'] }[z];
    verdict.innerHTML = '<strong></strong> · <span></span> · TDS ' + fmt(tds, 2) + '% (' + tdsZone(tds) + ')';
    verdict.querySelector('strong').textContent = ZT[0] + ' (EY ' + fmt(ey, 1) + '%)';
    verdict.querySelector('span').textContent = ZT[2];
    verdict.style.borderColor = 'var(' + ZT[1] + ')';
    steps.innerHTML =
      '<li>น้ำกาแฟ ' + (measured ? '= ค่าที่ชั่งได้ = <strong>' + fmt(bev, 0) + ' g</strong>' : '≈ ' + water + ' − 2 × ' + dose + ' = <strong>' + fmt(bev, 0) + ' g</strong>') + '</li>' +
      '<li>สารที่ละลาย = ' + fmt(bev, 0) + ' × ' + fmt(tds, 2) + ' ÷ 100 ≈ <strong>' + fmt(sol, 2) + ' g</strong></li>' +
      '<li>EY = ' + fmt(sol, 2) + ' ÷ ' + dose + ' × 100 ≈ <strong>' + fmt(ey, 1) + '%</strong></li>';
    if (pt){
      pt.style.display = '';
      pt.setAttribute('transform', 'translate(' + mcX(ey).toFixed(1) + ',' + mcY(tds).toFixed(1) + ')');
      pt.querySelector('circle').setAttribute('fill', 'var(' + ZT[1] + ')');
      document.getElementById('mini-pt-label').textContent = fmt(ey, 1) + '% · ' + fmt(tds, 2) + '%';
    }
  }
  drawMiniChart();
  if (eycDose){
    ['eyc-dose', 'eyc-water', 'eyc-tds', 'eyc-bev'].forEach(function(id){ document.getElementById(id).addEventListener('input', calcEY); });
    calcEY();
  }
})();
