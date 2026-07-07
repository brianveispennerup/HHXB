const { JSDOM } = require('/tmp/node_modules/jsdom');
const fs = require('fs');
const html = fs.readFileSync('/mnt/user-data/outputs/hhx-matematik-v4.html', 'utf8');

let passed = 0, failed = 0;
function test(n,c,d){if(c){console.log('  PASS ',n);passed++;}else{console.log('  FAIL ',n,d?'— '+d:'');failed++;}}
function isVisible(el){return el&&!el.classList.contains('page-hidden')&&el.style.display!=='none';}

const storage={_data:{},getItem(k){return this._data[k]||null;},setItem(k,v){this._data[k]=v;},removeItem(k){delete this._data[k];}};
const dom = new JSDOM(html, {runScripts:'dangerously', beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:storage});
  w.requestAnimationFrame=(cb)=>setTimeout(cb,0);
  w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>({clearRect:()=>{},beginPath:()=>{},arc:()=>{},fill:()=>{},moveTo:()=>{},lineTo:()=>{},stroke:()=>{},fillText:()=>{},globalAlpha:1,fillStyle:'',strokeStyle:'',lineWidth:1,font:'',textAlign:'',canvas:{width:280,height:280}});
}});

setTimeout(() => {
  const w = dom.window;
  const d = w.document;

  // ── CSS OG STRUKTUR ───────────────────────────────────────────────────────
  console.log('\nCSS og HTML grundstruktur');
  test('page-hidden CSS regel', html.includes('.page-hidden { display: none !important; }'));
  test('opgave-hidden CSS regel', html.includes('.opgave-hidden { display: none !important; }'));
  test('page-f1 har page-hidden', html.includes('id="page-f1" class="page-hidden"'));
  test('page-home ingen page-hidden', !html.includes('id="page-home" class="page-hidden"'));
  test('Ingen star-btn i page-home', !d.querySelector('#page-home .star-btn'));
  test('3.1.2 i emneData', html.includes("'3.1.2'") && html.includes("'chk-312-bog'"));

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  console.log('\nNavigation');
  test('Forside synlig ved start', isVisible(d.getElementById('page-home')));
  ['home','f1','fremgang','1-3-1','3-1-1','3-1-2'].forEach(id => {
    w.showPage(id);
    test(`showPage('${id}')`, isVisible(d.getElementById('page-'+id)));
  });

  // ── FREMGANG ──────────────────────────────────────────────────────────────
  console.log('\nFremgang');
  storage._data = {'hhxb_fremgang': JSON.stringify({'medal_131':1,'mat_chk-131-bog':true,'mat_chk-131-yt':true})};
  w.showPage('fremgang'); w.updateFremgang();
  const cards = d.querySelectorAll('[data-slug]');
  test('Fremgang kort med data-slug', cards.length > 0);
  if (cards.length > 0) { cards[0].click(); test('Klik på fremgang-kort navigerer', isVisible(d.getElementById('page-1-3-1'))); }

  // ── QUIZ 1.3.1 – POSITIV ─────────────────────────────────────────────────
  console.log('\nQuiz 1.3.1 – positive tests');
  w.showPage('1-3-1');
  d.querySelectorAll('#page-1-3-1 .tab-btn')[1].click();
  const q1 = d.querySelectorAll('#qq-1 .quiz-option');
  q1[2].click(); // C = correct
  test('Q1: C → correct', q1[2].classList.contains('correct'));
  test('Q1: feedback ok', d.getElementById('qf-1').classList.contains('ok'));
  test('Q1: tekst Korrekt!', d.getElementById('qf-1').textContent === 'Korrekt!');
  const q2 = d.querySelectorAll('#qq-2 .quiz-option');
  q2[0].click(); // A = correct
  test('Q2: A → correct', q2[0].classList.contains('correct'));

  // ── QUIZ 1.3.1 – NEGATIV ─────────────────────────────────────────────────
  console.log('\nQuiz 1.3.1 – negative tests');
  const q3 = d.querySelectorAll('#qq-3 .quiz-option');
  q3[1].click(); // B = wrong
  test('Q3: B (forkert) → wrong', q3[1].classList.contains('wrong'));
  test('Q3: feedback err', d.getElementById('qf-3').classList.contains('err'));
  test('Q3: A ikke afsløret (reveal fjernet)', !q3[0].classList.contains('reveal-correct'));
  test('Q3: C ikke afsløret', !q3[2].classList.contains('reveal-correct'));

  // Q4: kun C valgt (forkert)
  w.quizRetry();
  d.querySelectorAll('#page-1-3-1 .tab-btn')[1].click();
  const o4C2 = d.getElementById('o4C');
  o4C2 && o4C2.click();
  d.getElementById('q4-check') && d.getElementById('q4-check').click();
  test('Q4: kun C → feedback err', d.getElementById('qf-4').classList.contains('err'));
  test('Q4: C (forkert valgt) → wrong', o4C2 && o4C2.classList.contains('wrong'));
  test('Q4: A (ikke valgt, korrekt) → ingen markering', d.getElementById('o4A') && !d.getElementById('o4A').classList.contains('correct') && !d.getElementById('o4A').classList.contains('wrong'));

  // Q4: A+B korrekt
  w.quizRetry();
  d.querySelectorAll('#page-1-3-1 .tab-btn')[1].click();
  d.getElementById('o4A') && d.getElementById('o4A').click();
  d.getElementById('o4B') && d.getElementById('o4B').click();
  d.getElementById('q4-check') && d.getElementById('q4-check').click();
  test('Q4: A+B → feedback ok', d.getElementById('qf-4').classList.contains('ok'));
  test('Q4: A+B valgt korrekt → correct klasse', d.getElementById('o4A') && d.getElementById('o4A').classList.contains('correct'));
  test('Q4: B valgt korrekt → correct klasse', d.getElementById('o4B') && d.getElementById('o4B').classList.contains('correct'));

  // ── QUIZ 3.1.1 ───────────────────────────────────────────────────────────
  console.log('\nQuiz 3.1.1 – positive tests');
  w.showPage('3-1-1');
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();
  const q311_1 = d.querySelectorAll('#qq311-1 .quiz-option');
  q311_1[1].click(); // B = correct
  test('3.1.1 Q1: B → correct', q311_1[1].classList.contains('correct'));
  test('3.1.1 Q1: feedback ok', d.getElementById('qf311-1').classList.contains('ok'));
  const q311_2 = d.querySelectorAll('#qq311-2 .quiz-option');
  q311_2[0].click(); // A = correct
  test('3.1.1 Q2: A → correct', q311_2[0].classList.contains('correct'));

  console.log('\nQuiz 3.1.1 – negative tests');
  w.quizRetry311();
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();
  const q311_1b = d.querySelectorAll('#qq311-1 .quiz-option');
  q311_1b[2].click(); // C = wrong
  test('3.1.1 Q1: C → wrong', q311_1b[2].classList.contains('wrong'));
  test('3.1.1 Q1: B ikke afsløret (reveal fjernet)', !q311_1b[1].classList.contains('reveal-correct'));
  test('3.1.1 Q1: A ikke afsløret', !q311_1b[0].classList.contains('reveal-correct'));

  // 3.1.1 Q3 multi-select negativ
  w.quizRetry311();
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();
  // Vælg kun A (forkert)
  const q311_3opts = d.querySelectorAll('#qq311-3 .quiz-option');
  const q311_chk = d.getElementById('q311-check');
  if (q311_3opts[0]) q311_3opts[0].click();
  if (q311_chk) q311_chk.click();
  const fb311_3 = d.getElementById('qf311-3');
  test('3.1.1 Q3 negativ: feedback afslører ikke svar', fb311_3 && !fb311_3.textContent.includes('B') && !fb311_3.textContent.includes('C'));
  test('3.1.1 Q3 negativ: feedback er err', fb311_3 && fb311_3.classList.contains('err'));

  // ── QUIZ 3.1.2 ───────────────────────────────────────────────────────────
  console.log('\nQuiz 3.1.2 – positive tests');
  w.showPage('3-1-2');
  d.querySelectorAll('#page-3-1-2 .tab-btn')[1].click();
  const q312_1 = d.querySelectorAll('#qq312-1 .quiz-option');
  q312_1[1].click(); // B = correct
  test('3.1.2 Q1: B → correct', q312_1[1].classList.contains('correct'));
  const q312_2 = d.querySelectorAll('#qq312-2 .quiz-option');
  q312_2[1].click(); // B = correct
  test('3.1.2 Q2: B → correct', q312_2[1].classList.contains('correct'));
  const q312_3 = d.querySelectorAll('#qq312-3 .quiz-option');
  q312_3[1].click(); // B = correct
  test('3.1.2 Q3: B → correct', q312_3[1].classList.contains('correct'));

  console.log('\nQuiz 3.1.2 – negative tests');
  w.quizRetry312();
  d.querySelectorAll('#page-3-1-2 .tab-btn')[1].click();
  const q312_1b = d.querySelectorAll('#qq312-1 .quiz-option');
  q312_1b[0].click(); // A = wrong
  test('3.1.2 Q1: A → wrong', q312_1b[0].classList.contains('wrong'));
  test('3.1.2 Q1: B ikke afsløret (reveal fjernet)', !q312_1b[1].classList.contains('reveal-correct'));
  test('3.1.2 Q1: C ikke afsløret', !q312_1b[2].classList.contains('reveal-correct'));
  const q312_3b = d.querySelectorAll('#qq312-3 .quiz-option');
  q312_3b[2].click(); // C = wrong
  test('3.1.2 Q3: C → wrong', q312_3b[2].classList.contains('wrong'));
  test('3.1.2 Q3: B ikke afsløret (reveal fjernet)', !q312_3b[1].classList.contains('reveal-correct'));

  // ── INPUT VALIDERING ──────────────────────────────────────────────────────
  console.log('\nInput validering 1.3.1');
  function setVal(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  function reset(id){var i=d.getElementById('ow-'+id);if(i){i.value='';i.className='ow-input';}}

  w.showPage('1-3-1');
  setVal('1a','13'); w.owCheck('1a',13); test('owCheck: 13 → correct', isCorrect('1a'));
  reset('1d'); setVal('1d','5'); w.owCheck('1d',0); test('owCheck: 5 (forkert) → not correct', !isCorrect('1d'));
  reset('1b'); setVal('1b','abc'); w.owCheck('1b',1); test('owCheck: abc → not correct', !isCorrect('1b'));
  setVal('2b','7/6'); w.owCheck('2b',1.1667); test('owCheck: 7/6 (brøk) → correct', isCorrect('2b'));

  console.log('\nInput validering 3.1.2');
  w.showPage('3-1-2'); w.startOpgaver312();
  setVal('b1','-1'); w.owCheck312('b1',-1); test('owCheck312: -1 → correct', isCorrect('b1'));
  reset('b2'); setVal('b2','7/6'); w.owCheck312('b2',1); test('owCheck312: 7/6 → not correct', !isCorrect('b2'));
  reset('b3'); setVal('b3','abc'); w.owCheck312('b3',2); test('owCheck312: abc → not correct', !isCorrect('b3'));
  reset('b4'); setVal('b4','0'); w.owCheck312('b4',0); test('owCheck312: 0 → correct', isCorrect('b4'));

  console.log('\ninfReplace og normalizeInterval');
  var inp=d.getElementById('ow-b-dm');
  inp.value='oo'; w.infReplace(inp); test('"oo" → "∞"', inp.value==='∞');
  inp.value=']0;oo['; w.infReplace(inp); test('"]0;oo[" → "]0;∞["', inp.value===']0;∞[');
  inp.value='inf'; w.infReplace(inp); test('"inf" → "∞"', inp.value==='∞');
  inp.value='uendelig'; w.infReplace(inp); test('"uendelig" → "∞"', inp.value==='∞');
  test('[0,5;3[ = [0.5;3[', w.normalizeInterval('[0,5;3[')=== w.normalizeInterval('[0.5;3['));
  test(']0;∞[ = ]0;oo[', w.normalizeInterval(']0;∞[')=== w.normalizeInterval(']0;oo['));

  console.log('\ncheckBronze312');
  w.restartOpgaver312(); w.startOpgaver312();
  [['b1',-1],['b2',1],['b3',2],['b4',0],['b5',-3],['b6',-1]].forEach(p=>setVal(p[0],String(p[1])));
  setVal('b-dm','[-4;4]'); w.checkBronze312();
  test('Bronze alle korrekte', ['b1','b2','b3','b4','b5','b6'].every(id=>isCorrect(id)));
  test('Bronze Dm korrekt', isCorrect('b-dm'));
  w.restartOpgaver312(); w.startOpgaver312();
  ['b1','b2','b3'].forEach(id=>setVal(id,'99'));
  w.checkBronze312();
  test('Bronze forkerte → ingen correct', ['b1','b2','b3'].every(id=>!isCorrect(id)));

  console.log('\nSølv g(4)=0');
  w.restartOpgaver312(); w.opg312Level=2; w.startOpgaver312();
  [['s1a',-1],['s1b',1],['s1c',2],['s1d',0],['s1e',-3],['s1f',-1],['s1g',0]].forEach(p=>setVal(p[0],String(p[1])));
  setVal('s1-dm','[-4;4]'); setVal('s1-vm','[-3;2]'); w.checkSilver312a();
  test('g(4)=0 → correct', isCorrect('s1g'));
  w.restartOpgaver312(); w.opg312Level=2; w.startOpgaver312();
  [['s1a',-1],['s1b',1],['s1c',2],['s1d',0],['s1e',-3],['s1f',-1],['s1g',3]].forEach(p=>setVal(p[0],String(p[1])));
  setVal('s1-dm','[-4;4]'); setVal('s1-vm','[-3;2]'); w.checkSilver312a();
  test('g(4)=3 (forkert) → not correct', !isCorrect('s1g'));

// ── QUIZ 3.1.3 ───────────────────────────────────────────────────────────
  console.log('\nQuiz 3.1.3 – positive tests');
  w.showPage('3-1-3');
  d.querySelectorAll('#page-3-1-3 .tab-btn')[1].click();
  const q313_1 = d.querySelectorAll('#qq313-1 .quiz-option');
  q313_1[2].click(); // C = correct
  test('3.1.3 Q1: C → correct', q313_1[2].classList.contains('correct'));
  const q313_2 = d.querySelectorAll('#qq313-2 .quiz-option');
  q313_2[0].click(); // A = correct
  test('3.1.3 Q2: A → correct', q313_2[0].classList.contains('correct'));
  const q313_3 = d.querySelectorAll('#qq313-3 .quiz-option');
  q313_3[1].click(); // B = correct
  test('3.1.3 Q3: B → correct', q313_3[1].classList.contains('correct'));
  const q313_5 = d.querySelectorAll('#qq313-5 .quiz-option');
  q313_5[1].click(); // B = correct
  test('3.1.3 Q5: B → correct', q313_5[1].classList.contains('correct'));

  console.log('\nQuiz 3.1.3 – negative tests');
  w.quizRetry313();
  d.querySelectorAll('#page-3-1-3 .tab-btn')[1].click();
  const q313_1b = d.querySelectorAll('#qq313-1 .quiz-option');
  q313_1b[0].click(); // A = wrong
  test('3.1.3 Q1: A → wrong', q313_1b[0].classList.contains('wrong'));
  test('3.1.3 Q1: feedback err', d.getElementById('qf313-1').classList.contains('err'));
  test('3.1.3 Q1: C ikke afsløret', !q313_1b[2].classList.contains('reveal-correct'));
  const q313_5b = d.querySelectorAll('#qq313-5 .quiz-option');
  q313_5b[2].click(); // C = wrong
  test('3.1.3 Q5: C → wrong', q313_5b[2].classList.contains('wrong'));
  test('3.1.3 Q5: B ikke afsløret', !q313_5b[1].classList.contains('reveal-correct'));

  // ── BRONZE 3.1.3 ─────────────────────────────────────────────────────────
  console.log('\nBronze 3.1.3 – h(t) = 2-t²');
  w.showPage('3-1-3'); w.startOpgaver313();
  function setVal313(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect313(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}

  // Alle korrekte
  setVal313('313b1','-2'); setVal313('313b2','-34'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(2)=-2, h(6)=-34, h(√3)=-1 → alle correct', isCorrect313('313b1')&&isCorrect313('313b2')&&isCorrect313('313b3'));

  // Negative
  w.restartOpgaver313(); w.startOpgaver313();
  setVal313('313b1','99'); setVal313('313b2','-34'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(2)=99 (forkert) → not correct', !isCorrect313('313b1'));
  test('h(6)=-34 (korrekt) → correct', isCorrect313('313b2'));

  w.restartOpgaver313(); w.startOpgaver313();
  setVal313('313b1','abc'); setVal313('313b2','-34'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(2)=abc → not correct', !isCorrect313('313b1'));

  // ── GULD TABEL 3.1.3 ─────────────────────────────────────────────────────
  console.log('\nGuld tabel 3.1.3 – f(x) = x²+2');
  w.restartOpgaver313(); w.opg313Level=3; w.startOpgaver313();
  [['313g1',6],['313g2',3],['313g3',2],['313g4',3],['313g5',6]].forEach(function(p){setVal313(p[0],String(p[1]));});
  w.checkGold313();
  test('Tabel alle korrekte', ['313g1','313g2','313g3','313g4','313g5'].every(function(id){return isCorrect313(id);}));

  w.restartOpgaver313(); w.opg313Level=3; w.startOpgaver313();
  setVal313('313g1','99'); setVal313('313g2','3'); setVal313('313g3','2'); setVal313('313g4','3'); setVal313('313g5','6');
  w.checkGold313();
  test('Tabel g1=99 → not correct', !isCorrect313('313g1'));
  test('Tabel g2=3 → correct', isCorrect313('313g2'));

  // ── SØLV 3.1.3 – to inputfelter for union ───────────────────────────────────
  console.log('\nSølv 3.1.3 – Dm to inputfelter');
  function tryUnion313(v1,v2){
    var i1=d.getElementById('ow-313s1a'), i2=d.getElementById('ow-313s1b');
    if(i1){i1.value=v1;i1.className='ow-input';}
    if(i2){i2.value=v2;i2.className='ow-input';}
    w.owCheck313Union();
    return i1&&i2&&i1.classList.contains('correct')&&i2.classList.contains('correct');
  }
  w.restartOpgaver313(); w.opg313Level=2; w.startOpgaver313();
  function tryUnion313(v1,v2){
    var i1=d.getElementById('ow-313s1a'), i2=d.getElementById('ow-313s1b'), i3=d.getElementById('ow-313s2');
    if(i1){i1.value=v1;i1.className='ow-input';}
    if(i2){i2.value=v2;i2.className='ow-input';}
    if(i3){i3.value='[-3;∞[';} // fill q correctly so silver check works
    w.checkSilver313();
    var ok=i1&&i2&&i1.classList.contains('correct')&&i2.classList.contains('correct');
    if(i1)i1.className='ow-input'; if(i2)i2.className='ow-input';
    return ok;
  }
  test('To felter: ]-∞;-1[ og ]-1;∞[', tryUnion313(']-∞;-1[',']-1;∞['));
  test('To felter: omvendt ]-1;∞[ og ]-∞;-1[', tryUnion313(']-1;∞[',']-∞;-1['));
  test('To felter: ]-inf;-1[ og ]-1;inf[', tryUnion313(']-inf;-1[',']-1;inf['));
  test('To felter: uendelig notation', tryUnion313(']-uendelig;-1[',']-1;uendelig['));
  test('To felter: [0;5] afvises', !tryUnion313('[0;5]','[1;2]'));

  // ── GRAF 3.1.3 ───────────────────────────────────────────────────────────────
  // checkGraph313/checkPoints313 er nu testet under 'checkPoints313' ovenfor

  // ── KURVE 3.1.3 ──────────────────────────────────────────────────────────────
  console.log('\ncheckCurve313');
  w.restartOpgaver313(); w.opg313Level=3; w.startOpgaver313();
  var dw2=d.getElementById('canvas-313-draw-wrap'); if(dw2)dw2.style.display='block';
  const rg2 = d.getElementById('ow-r-313gold-graph');

  function genCurve(noisy){
    var pts=[];
    for(var x=-2;x<=2;x+=0.1){pts.push([x,x*x+2+(noisy?(Math.random()-0.5)*0.3:0)]);}
    return pts;
  }

  w.canvas313Curve=genCurve(false); w.opg313GraphDone=false; w.checkCurve313();
  test('Kurve: korrekt → done', w.opg313GraphDone);
  test('Kurve: korrekt → ok', rg2&&rg2.classList.contains('ok'));

  w.canvas313Curve=genCurve(true); w.opg313GraphDone=false; w.checkCurve313();
  test('Kurve: med lille støj → done', w.opg313GraphDone);

  var flatLine=[]; for(var x=-2;x<=2;x+=0.1) flatLine.push([x,4]);
  w.canvas313Curve=flatLine; w.opg313GraphDone=false; w.checkCurve313();
  test('Kurve: forkert (y=4) → ikke done', !w.opg313GraphDone);
  test('Kurve: forkert → err', rg2&&rg2.classList.contains('err'));

  w.canvas313Curve=[]; w.opg313GraphDone=false; w.checkCurve313();
  test('Kurve: ingen → err', rg2&&rg2.classList.contains('err'));


  // ── QUIZ 3.1.1 Q3 MULTI-SELECT ───────────────────────────────────────────
  console.log('\nQuiz 3.1.1 Q3 multi-select');
  w.showPage('3-1-1');
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();
  w.quizRetry311();
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();

  // Positiv: vælg B og C (korrekt)
  var q311_3B = d.getElementById('q311opt-B'), q311_3C = d.getElementById('q311opt-C');
  var q311_3A = d.getElementById('q311opt-A');
  q311_3B && q311_3B.click(); q311_3C && q311_3C.click();
  d.getElementById('q311-check') && d.getElementById('q311-check').click();
  test('3.1.1 Q3: B+C → ok feedback', d.getElementById('qf311-3')&&d.getElementById('qf311-3').classList.contains('ok'));
  test('3.1.1 Q3: B → correct', q311_3B&&q311_3B.classList.contains('correct'));
  test('3.1.1 Q3: C → correct', q311_3C&&q311_3C.classList.contains('correct'));

  // Negativ: kun A (forkert)
  w.quizRetry311();
  d.querySelectorAll('#page-3-1-1 .tab-btn')[1].click();
  var q311_3Aneg = d.getElementById('q311opt-A');
  q311_3Aneg && q311_3Aneg.click();
  d.getElementById('q311-check') && d.getElementById('q311-check').click();
  test('3.1.1 Q3: kun A → err feedback', d.getElementById('qf311-3')&&d.getElementById('qf311-3').classList.contains('err'));
  test('3.1.1 Q3: A → wrong', q311_3Aneg&&q311_3Aneg.classList.contains('wrong'));
  test('3.1.1 Q3: feedback afslører ikke svar', d.getElementById('qf311-3')&&!d.getElementById('qf311-3').textContent.includes('B')&&!d.getElementById('qf311-3').textContent.includes('C'));

  // ── SILVER 3.1.3 Dm(q) ───────────────────────────────────────────────────
  console.log('\nSølv 3.1.3 – Dm(q)');
  w.restartOpgaver313(); w.opg313Level=2; w.startOpgaver313();
  // Fill p correctly
  var i1=d.getElementById('ow-313s1a'), i2=d.getElementById('ow-313s1b'), i3=d.getElementById('ow-313s2');
  if(i1)i1.value=']-∞;-1['; if(i2)i2.value=']-1;∞[';
  // Test q
  if(i3){i3.value='[-3;∞[';} w.checkSilver313();
  test('Dm(q)=[-3;∞[ → correct', i3&&i3.classList.contains('correct'));

  w.restartOpgaver313(); w.opg313Level=2; w.startOpgaver313();
  var i1b=d.getElementById('ow-313s1a'), i2b=d.getElementById('ow-313s1b'), i3b=d.getElementById('ow-313s2');
  if(i1b)i1b.value=']-∞;-1['; if(i2b)i2b.value=']-1;∞[';
  if(i3b){i3b.value='[3;∞[';} w.checkSilver313();
  test('Dm(q)=[3;∞[ (forkert) → not correct', i3b&&!i3b.classList.contains('correct'));

  // ── checkPoints313 ────────────────────────────────────────────────────────
  console.log('\ncheckPoints313 negativ');
  w.restartOpgaver313(); w.opg313Level=3; w.startOpgaver313();
  var cwrap=d.getElementById('canvas-313-wrap'); if(cwrap)cwrap.style.display='block';
  var rpts=d.getElementById('ow-r-313gold-points');

  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6],[1,1]];
  w.checkPoints313();
  test('checkPoints313: forkert punkt → err', rpts&&rpts.classList.contains('err'));
  test('checkPoints313: forkert → ikke done', !w.opg313PointsDone);

  w.opg313PointsDone=false; w.graph313Points=[[-2,6],[-1,3]];
  w.checkPoints313();
  test('checkPoints313: for få → err', rpts&&rpts.classList.contains('err'));

  w.opg313PointsDone=false; w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6],[0,3]];
  w.checkPoints313();
  test('checkPoints313: for mange → err', rpts&&rpts.classList.contains('err'));

  w.opg313PointsDone=false; w.graph313Points=[];
  w.checkPoints313();
  test('checkPoints313: ingen → err', rpts&&rpts.classList.contains('err'));

  // Positiv
  w.opg313PointsDone=false; w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]];
  w.checkPoints313();
  test('checkPoints313: 5 korrekte → done', w.opg313PointsDone);

  // ── 3.1.1 OPGAVER ────────────────────────────────────────────────────────
  console.log('\n3.1.1 opgaver multi-select');
  w.showPage('3-1-1'); w.opg311Level=1; w.startOpgaver311();

  // opg3111: kun B er korrekt
  var o3111B=d.getElementById('opg3111-B'), o3111A=d.getElementById('opg3111-A');
  o3111B && o3111B.click();
  d.getElementById('chk3111') && d.getElementById('chk3111').click();
  test('opg3111: B → correct klasse', o3111B&&(o3111B.classList.contains('reveal-correct')||o3111B.classList.contains('correct')));

  // Negativ: kun A
  w.restartOpgaver311(); w.opg311Level=1; w.startOpgaver311();
  var o3111An=d.getElementById('opg3111-A');
  o3111An && o3111An.click();
  d.getElementById('chk3111') && d.getElementById('chk3111').click();
  test('opg3111: kun A → feedback err', d.getElementById('fb3111')&&d.getElementById('fb3111').classList.contains('err'));
  test('opg3111: feedback afslører ikke svar', d.getElementById('fb3111')&&!d.getElementById('fb3111').textContent.includes('B'));

  // ── RESULTAT ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultat: ${passed}/${passed+failed} tests bestået`);
  if (failed > 0) process.exit(1);
}, 500);
