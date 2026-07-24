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
  setVal313('313b1','-7'); setVal313('313b2','-2'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(3)=-7, h(-2)=-2, h(√3)=-1 → alle correct', isCorrect313('313b1')&&isCorrect313('313b2')&&isCorrect313('313b3'));

  // Negative
  w.restartOpgaver313(); w.startOpgaver313();
  setVal313('313b1','99'); setVal313('313b2','-2'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(3)=99 (forkert) → not correct', !isCorrect313('313b1'));
  test('h(-2)=-2 (korrekt) → correct', isCorrect313('313b2'));

  w.restartOpgaver313(); w.startOpgaver313();
  setVal313('313b1','abc'); setVal313('313b2','-2'); setVal313('313b3','-1');
  w.checkBronze313();
  test('h(3)=abc → not correct', !isCorrect313('313b1'));

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


  // ── FLOW 3.1.3 ───────────────────────────────────────────────────────────
  console.log('\nFlow: Bronze/Sølv/Guld genstart');
  function isHidden313(id){var el=d.getElementById(id);return !el||el.classList.contains('opgave-hidden');}
  function isVis313(id){var el=d.getElementById(id);return el&&!el.classList.contains('opgave-hidden');}

  // Bronze
  w.showPage('3-1-3'); w.restartOpgaver313(); w.updateEnergy313(30); w.startOpgaver313();
  test('Bronze: low synlig, mid+high skjult', isVis313('opg313-low')&&isHidden313('opg313-mid')&&isHidden313('opg313-high'));
  w.restartOpgaver313(); w.updateEnergy313(30); w.startOpgaver313();
  test('Genstart bronze: low synlig igen', isVis313('opg313-low'));

  // Sølv
  w.restartOpgaver313(); w.updateEnergy313(60); w.startOpgaver313();
  test('Sølv: low+mid synlig, high skjult', isVis313('opg313-low')&&isVis313('opg313-mid')&&isHidden313('opg313-high'));
  w.restartOpgaver313(); w.updateEnergy313(60); w.startOpgaver313();
  test('Genstart sølv: low+mid synlig igen', isVis313('opg313-low')&&isVis313('opg313-mid'));

  // Guld – fuld flow
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  test('Guld: alle tre synlige', isVis313('opg313-low')&&isVis313('opg313-mid')&&isVis313('opg313-high'));

  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){
    var inp=d.getElementById('ow-'+id); if(inp)inp.value=[6,3,2,3,6][i];
  });
  w.checkGold313();
  var cw=d.getElementById('canvas-313-wrap');
  test('Guld: canvas vises efter korrekt tabel', cw&&cw.style.display!=='none');

  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]];
  w.checkPoints313();
  var dw=d.getElementById('canvas-313-draw-wrap');
  test('Guld: draw-wrap vises efter korrekte punkter', dw&&dw.style.display!=='none');

  // Genstart guld – alt nulstilles
  w.restartOpgaver313();
  test('Guld restart: canvas-wrap skjult', !cw||cw.style.display==='none');
  test('Guld restart: draw-wrap skjult', !dw||dw.style.display==='none');
  test('Guld restart: punkter nulstillet', w.graph313Points.length===0);
  test('Guld restart: tableDone=false', w.opg313TableDone===false);
  test('Guld restart: pointsDone=false', w.opg313PointsDone===false);

  // Guld 2. gang – canvas skal virke igen
  w.updateEnergy313(90); w.startOpgaver313();
  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){
    var inp=d.getElementById('ow-'+id); if(inp)inp.value=[6,3,2,3,6][i];
  });
  w.checkGold313();
  test('Guld 2. gang: canvas vises igen', cw&&cw.style.display!=='none');
  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]];
  w.checkPoints313();
  test('Guld 2. gang: punkter godkendt igen', w.opg313PointsDone===true);

  // ── FLOW: Medalje gemmes ikke lavere ─────────────────────────────────────
  console.log('\nFlow: Medalje overskriver ikke højere niveau');
  storage._data={};
  w.saveProgress('medal_313',3);
  var prev=parseInt(w.loadProgress('medal_313',0));
  if(1>prev) w.saveProgress('medal_313',1);
  test('Bronze overskriver ikke guld', parseInt(w.loadProgress('medal_313',0))===3);
  prev=parseInt(w.loadProgress('medal_313',0));
  if(2>prev) w.saveProgress('medal_313',2);
  test('Sølv overskriver ikke guld', parseInt(w.loadProgress('medal_313',0))===3);

  // ── FLOW: Skift niveau undervejs ─────────────────────────────────────────
  console.log('\nFlow: Skift niveau undervejs');
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  test('Guld: restart-btn synlig', d.getElementById('restart-btn-313')&&d.getElementById('restart-btn-313').style.display!=='none');
  w.restartOpgaver313(); w.updateEnergy313(30); w.startOpgaver313();
  test('Skift til bronze: kun low synlig', isVis313('opg313-low')&&isHidden313('opg313-mid')&&isHidden313('opg313-high'));


  // ── FLOW: Afbryd midt i guld og start forfra ─────────────────────────────
  console.log('\nFlow: Afbryd midt i guld');
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){var inp=d.getElementById('ow-'+id);if(inp)inp.value=[6,3,2,3,6][i];});
  w.checkGold313();
  w.graph313Points=[[-2,6]]; // delvis – ikke godkendt
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){var inp=d.getElementById('ow-'+id);if(inp)inp.value=[6,3,2,3,6][i];});
  w.checkGold313();
  var ptBtns2=d.getElementById('canvas-313-point-btns');
  test('Afbryd+genstart: point-btns synlige', ptBtns2&&ptBtns2.style.display!=='none');
  test('Afbryd+genstart: canvas-wrap synlig', d.getElementById('canvas-313-wrap')&&d.getElementById('canvas-313-wrap').style.display!=='none');
  test('Afbryd+genstart: draw-wrap skjult', d.getElementById('canvas-313-draw-wrap')&&d.getElementById('canvas-313-draw-wrap').style.display==='none'||d.getElementById('canvas-313-draw-wrap').style.display==='');
  test('Afbryd+genstart: punkter nulstillet', w.graph313Points.length===0);

  // Afbryd efter punkter godkendt
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){var inp=d.getElementById('ow-'+id);if(inp)inp.value=[6,3,2,3,6][i];});
  w.checkGold313();
  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]];
  w.checkPoints313(); // godkendt – knapper skjules
  test('Point-btns skjules efter godkendt', ptBtns2&&ptBtns2.style.display==='none');
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();
  ['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){var inp=d.getElementById('ow-'+id);if(inp)inp.value=[6,3,2,3,6][i];});
  w.checkGold313();
  test('Restart efter godkendt: point-btns synlige igen', ptBtns2&&ptBtns2.style.display!=='none');
  test('Restart efter godkendt: pointsDone=false', w.opg313PointsDone===false);


  // ── FULD FLOW 3.1.3 ──────────────────────────────────────────────────────
  // Patch drawCanvas313 to no-op to avoid canvas issues in jsdom
  w.drawCanvas313 = function(){};

  console.log('\nFuld flow 3.1.3 – 1. gennemgang');
  w.restartOpgaver313(); w.updateEnergy313(90); w.startOpgaver313();

  function fillTable313(){['313g1','313g2','313g3','313g4','313g5'].forEach(function(id,i){var inp=d.getElementById('ow-'+id);if(inp){inp.value=[6,3,2,3,6][i];inp.className='ow-input';}});}
  function correctCurve313(){w.canvas313Curve=[];for(var cx=-2;cx<=2;cx+=0.1)w.canvas313Curve.push([cx,cx*cx+2]);}
  function ptBtnsVis(){var el=d.getElementById('canvas-313-point-btns');return el&&el.style.display!=='none';}
  function drawWrapVis(){var el=d.getElementById('canvas-313-draw-wrap');return el&&(el.style.display==='block'||el.style.display==='')&&el.style.display!=='none';}
  function canvasWrapVis(){var el=d.getElementById('canvas-313-wrap');return el&&el.style.display!=='none';}

  fillTable313(); w.checkGold313();
  test('Fuld flow 1: canvas-wrap synlig', canvasWrapVis());
  test('Fuld flow 1: point-knapper synlige', ptBtnsVis());
  test('Fuld flow 1: draw-wrap skjult', !drawWrapVis());
  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]]; w.checkPoints313();
  test('Fuld flow 1: point-knapper skjult efter godkendt', !ptBtnsVis());
  test('Fuld flow 1: draw-wrap synlig', drawWrapVis());
  correctCurve313(); w.checkCurve313();
  test('Fuld flow 1: kurve godkendt', w.opg313GraphDone);

  console.log('\nFuld flow 3.1.3 – restart og 2. gennemgang');
  w.restartOpgaver313();
  test('Restart: canvas._init313 undefined', d.getElementById('canvas-313')&&d.getElementById('canvas-313')._init313===undefined);
  test('Restart: point-btns reset til flex', ptBtnsVis());
  test('Restart: canvas-wrap skjult', !canvasWrapVis());
  test('Restart: draw-wrap skjult', !drawWrapVis());
  test('Restart: punkter nulstillet', w.graph313Points.length===0);
  test('Restart: kurve nulstillet', w.canvas313Curve.length===0);

  w.updateEnergy313(90); w.startOpgaver313();
  fillTable313(); w.checkGold313();
  test('2. gennemgang: canvas-wrap synlig', canvasWrapVis());
  test('2. gennemgang: point-knapper synlige', ptBtnsVis());
  test('2. gennemgang: draw-wrap skjult', !drawWrapVis());
  w.graph313Points=[[-2,6],[-1,3],[0,2],[1,3],[2,6]]; w.checkPoints313();
  test('2. gennemgang: point-knapper skjult', !ptBtnsVis());
  test('2. gennemgang: draw-wrap synlig', drawWrapVis());
  correctCurve313(); w.checkCurve313();
  test('2. gennemgang: kurve godkendt', w.opg313GraphDone);

  console.log('\nFuld flow 3.1.3 – ryd kurve og gentegn');
  w.clearCurve313();
  test('Ryd kurve: graphDone=false', !w.opg313GraphDone);
  test('Ryd kurve: draw-wrap stadig synlig', drawWrapVis());
  test('Ryd kurve: punkter bevaret', w.graph313Points.length===5);
  correctCurve313(); w.checkCurve313();
  test('Ryd+gentegn: kurve godkendt igen', w.opg313GraphDone);

  // ── 3.1.4 GRAFISKE LØSNINGER ────────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.1.4');
  w.showPage('3-1-4');
  test('showPage(3-1-4)', isVisible(d.getElementById('page-3-1-4')));
  test('3 tab-knapper i 3.1.4', d.querySelectorAll('#page-3-1-4 .tab-btn').length === 3);
  test('3.1.4 i emneData', html.includes("'3.1.4'") && html.includes("'chk-314-bog'"));

  console.log('\nQuiz 3.1.4 – positive tests');
  d.querySelectorAll('#page-3-1-4 .tab-btn')[1].click();
  const q314_1 = d.querySelectorAll('#qq314-1 .quiz-option');
  q314_1[1].click(); // B = correct
  test('3.1.4 Q1: B → correct', q314_1[1].classList.contains('correct'));
  const q314_2 = d.querySelectorAll('#qq314-2 .quiz-option');
  q314_2[1].click(); // B = correct
  test('3.1.4 Q2: B → correct', q314_2[1].classList.contains('correct'));
  const q314_3 = d.querySelectorAll('#qq314-3 .quiz-option');
  q314_3[0].click(); // A = correct
  test('3.1.4 Q3: A → correct', q314_3[0].classList.contains('correct'));
  const q314_4 = d.querySelectorAll('#qq314-4 .quiz-option');
  q314_4[1].click(); // B = correct
  test('3.1.4 Q4: B → correct', q314_4[1].classList.contains('correct'));
  const q314_5 = d.querySelectorAll('#qq314-5 .quiz-option');
  q314_5[0].click(); // A = correct
  test('3.1.4 Q5: A → correct', q314_5[0].classList.contains('correct'));
  test('3.1.4 quiz score: 5/5', d.getElementById('quiz-score-314-title').textContent.includes('5/5'));

  console.log('\nQuiz 3.1.4 – negative tests');
  w.quizRetry314();
  d.querySelectorAll('#page-3-1-4 .tab-btn')[1].click();
  const q314_1b = d.querySelectorAll('#qq314-1 .quiz-option');
  q314_1b[0].click(); // A = wrong
  test('3.1.4 Q1: A → wrong', q314_1b[0].classList.contains('wrong'));
  test('3.1.4 Q1: feedback err', d.getElementById('qf314-1').classList.contains('err'));
  test('3.1.4 Q1: B ikke afsløret', !q314_1b[1].classList.contains('reveal-correct'));

  console.log('\nBronze 3.1.4 – f(x)=3/4/1');
  function setVal314(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect314(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  w.showPage('3-1-4'); w.restartOpgaver314(); w.startOpgaver314();
  setVal314('314b1','1'); setVal314('314b2','2'); setVal314('314b3','-1');
  w.checkBronze314();
  test('Bronze: alle tre korrekte', ['314b1','314b2','314b3'].every(id=>isCorrect314(id)));
  test('Bronze: opg314BronzeDone=true', w.opg314BronzeDone);
  w.restartOpgaver314(); w.startOpgaver314();
  setVal314('314b1','99'); setVal314('314b2','2'); setVal314('314b3','-1');
  w.checkBronze314();
  test('Bronze: én forkert → opg314BronzeDone forbliver false', !w.opg314BronzeDone);
  test('Bronze: forkert felt ikke correct', !isCorrect314('314b1'));
  test('Bronze: øvrige korrekte felter markeres', isCorrect314('314b2'));

  console.log('\nSølv 3.1.4 – to løsninger pr. ligning');
  w.restartOpgaver314(); w.opg314Level=2; w.startOpgaver314();
  setVal314('314s1a','-2'); setVal314('314s1b','2');
  setVal314('314s2a','-1'); setVal314('314s2b','1');
  w.checkSilver314();
  test('Sølv: f(x)=4 løsninger korrekte', isCorrect314('314s1a') && isCorrect314('314s1b'));
  test('Sølv: f(x)=1 løsninger korrekte', isCorrect314('314s2a') && isCorrect314('314s2b'));
  test('Sølv: opg314SilverDone=true', w.opg314SilverDone);

  console.log('\nSølv 3.1.4 – ombyttet rækkefølge skal også accepteres');
  w.restartOpgaver314(); w.opg314Level=2; w.startOpgaver314();
  setVal314('314s1a','2'); setVal314('314s1b','-2'); // ombyttet rækkefølge for f(x)=4
  setVal314('314s2a','1'); setVal314('314s2b','-1'); // ombyttet rækkefølge for f(x)=1
  w.checkSilver314();
  test('Sølv: f(x)=4 ombyttet → stadig correct', isCorrect314('314s1a') && isCorrect314('314s1b'));
  test('Sølv: f(x)=1 ombyttet → stadig correct', isCorrect314('314s2a') && isCorrect314('314s2b'));
  test('Sølv: ombyttet rækkefølge → opg314SilverDone=true', w.opg314SilverDone);
  w.restartOpgaver314(); w.opg314Level=2; w.startOpgaver314();
  setVal314('314s1a','99'); setVal314('314s1b','2'); // reelt forkert, ikke bare ombyttet
  setVal314('314s2a','-1'); setVal314('314s2b','1');
  w.checkSilver314();
  test('Sølv: reelt forkert svar → not correct', !isCorrect314('314s1a'));
  test('Sølv: reelt forkert → opg314SilverDone forbliver false', !w.opg314SilverDone);

  console.log('\nGuld 3.1.4 – uligheder med to separate intervalfelter');
  w.restartOpgaver314(); w.opg314Level=3; w.startOpgaver314();
  setVal314('314g1a','[-3;-2['); setVal314('314g1b',']2;3['); setVal314('314g2','[-1;1]');
  w.checkGold314();
  test('Guld: f(x)>4 begge intervaller korrekte', isCorrect314('314g1a') && isCorrect314('314g1b'));
  test('Guld: f(x)≤1 → correct', isCorrect314('314g2'));
  test('Guld: opg314GoldDone=true', w.opg314GoldDone);

  console.log('\nGuld 3.1.4 – ombyttet rækkefølge skal også accepteres');
  w.restartOpgaver314(); w.opg314Level=3; w.startOpgaver314();
  setVal314('314g1a',']2;3['); setVal314('314g1b','[-3;-2['); setVal314('314g2','[-1;1]'); // ombyttet
  w.checkGold314();
  test('Guld: ombyttede intervaller → stadig correct', isCorrect314('314g1a') && isCorrect314('314g1b'));
  test('Guld: ombyttet rækkefølge → opg314GoldDone=true', w.opg314GoldDone);
  w.restartOpgaver314(); w.opg314Level=3; w.startOpgaver314();
  setVal314('314g1a','[2;3]'); setVal314('314g1b',']2;3['); setVal314('314g2','[-1;1]'); // reelt forkert interval
  w.checkGold314();
  test('Guld: reelt forkert interval → not correct', !isCorrect314('314g1a'));
  test('Guld: reelt forkert → opg314GoldDone forbliver false', !w.opg314GoldDone);

  console.log('\nMedalje og restart-flow 3.1.4');
  w.restartOpgaver314(); w.opg314Level=1; w.startOpgaver314();
  setVal314('314b1','1'); setVal314('314b2','2'); setVal314('314b3','-1');
  w.checkBronze314();
  test('Bronze niveau: medalje gemmes', w.opg314MedalShown);
  w.restartOpgaver314();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-314').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-314').style.display==='none');
  test('Restart: inputs nulstillet', d.getElementById('ow-314b1').value==='');
  test('Restart: opgave-widgets skjules', d.getElementById('opg314-low').classList.contains('opgave-hidden'));
  test('Restart: opg314BronzeDone nulstillet', !w.opg314BronzeDone);
  test('Restart: opg314MedalShown nulstillet', !w.opg314MedalShown);

  // ── 3.1.5 MONOTONIFORHOLD ───────────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.1.5');
  w.showPage('3-1-5');
  test('showPage(3-1-5)', isVisible(d.getElementById('page-3-1-5')));
  test('3 tab-knapper i 3.1.5', d.querySelectorAll('#page-3-1-5 .tab-btn').length === 3);
  test('3.1.5 i emneData', html.includes("'3.1.5'") && html.includes("'chk-315-bog'"));

  console.log('\ntoggleMono');
  var testBtn = d.getElementById('mono-315b1');
  test('mono-toggle default state = voksende', testBtn.dataset.state === 'voksende');
  w.toggleMono(testBtn);
  test('toggleMono: voksende → aftagende', testBtn.dataset.state === 'aftagende' && testBtn.textContent === 'aftagende');
  w.toggleMono(testBtn);
  test('toggleMono: aftagende → voksende', testBtn.dataset.state === 'voksende' && testBtn.textContent === 'voksende');

  console.log('\nQuiz 3.1.5 – positive tests');
  d.querySelectorAll('#page-3-1-5 .tab-btn')[1].click();
  const q315_1 = d.querySelectorAll('#qq315-1 .quiz-option');
  q315_1[1].click(); // B = correct
  test('3.1.5 Q1: B → correct', q315_1[1].classList.contains('correct'));
  const q315_2 = d.querySelectorAll('#qq315-2 .quiz-option');
  q315_2[2].click(); // C = correct
  test('3.1.5 Q2: C → correct', q315_2[2].classList.contains('correct'));
  const q315_3 = d.querySelectorAll('#qq315-3 .quiz-option');
  q315_3[1].click(); // B = correct
  test('3.1.5 Q3: B → correct', q315_3[1].classList.contains('correct'));
  test('3.1.5 quiz score: 3/3', d.getElementById('quiz-score-315-title').textContent.includes('3/3'));

  console.log('\nQuiz 3.1.5 – negative tests');
  w.quizRetry315();
  d.querySelectorAll('#page-3-1-5 .tab-btn')[1].click();
  const q315_1b = d.querySelectorAll('#qq315-1 .quiz-option');
  q315_1b[0].click(); // A = wrong
  test('3.1.5 Q1: A → wrong', q315_1b[0].classList.contains('wrong'));
  test('3.1.5 Q1: feedback err', d.getElementById('qf315-1').classList.contains('err'));
  test('3.1.5 Q1: B ikke afsløret', !q315_1b[1].classList.contains('reveal-correct'));

  function setMono315(toggleId, state, inputId, val) {
    var btn = d.getElementById(toggleId);
    if (btn.dataset.state !== state) w.toggleMono(btn);
    var inp = d.getElementById('ow-'+inputId);
    if (inp) inp.value = val;
  }
  function isMonoCorrect(toggleId, inputId) {
    var btn = d.getElementById(toggleId);
    var inp = d.getElementById('ow-'+inputId);
    return btn.classList.contains('correct') && inp.classList.contains('correct');
  }

  console.log('\nBronze 3.1.5 – konstant voksende funktion');
  w.showPage('3-1-5'); w.restartOpgaver315(); w.startOpgaver315();
  setMono315('mono-315b1','voksende','315b1-int',']-uendelig;uendelig[');
  w.checkBronze315();
  test('Bronze: voksende på ]-∞;∞[ → correct', isMonoCorrect('mono-315b1','315b1-int'));
  test('Bronze: opg315BronzeDone=true', w.opg315BronzeDone);
  w.restartOpgaver315(); w.startOpgaver315();
  setMono315('mono-315b1','aftagende','315b1-int',']-uendelig;uendelig['); // forkert retning
  w.checkBronze315();
  test('Bronze: forkert retning → not correct', !isMonoCorrect('mono-315b1','315b1-int'));
  test('Bronze: forkert → opg315BronzeDone forbliver false', !w.opg315BronzeDone);

  console.log('\nSølv 3.1.5 – to intervaller, korrekt rækkefølge');
  w.restartOpgaver315(); w.opg315Level=2; w.startOpgaver315();
  setMono315('mono-315s1','aftagende','315s1-int',']-uendelig;0]');
  setMono315('mono-315s2','voksende','315s2-int','[0;uendelig[');
  w.checkSilver315();
  test('Sølv: korrekt rækkefølge → begge correct', isMonoCorrect('mono-315s1','315s1-int') && isMonoCorrect('mono-315s2','315s2-int'));
  test('Sølv: opg315SilverDone=true', w.opg315SilverDone);

  console.log('\nSølv 3.1.5 – ombyttet rækkefølge skal også accepteres');
  w.restartOpgaver315(); w.opg315Level=2; w.startOpgaver315();
  setMono315('mono-315s1','voksende','315s1-int','[0;uendelig[');
  setMono315('mono-315s2','aftagende','315s2-int',']-uendelig;0]');
  w.checkSilver315();
  test('Sølv: ombyttet rækkefølge → stadig correct', isMonoCorrect('mono-315s1','315s1-int') && isMonoCorrect('mono-315s2','315s2-int'));
  test('Sølv: ombyttet → opg315SilverDone=true', w.opg315SilverDone);
  w.restartOpgaver315(); w.opg315Level=2; w.startOpgaver315();
  setMono315('mono-315s1','voksende','315s1-int',']-uendelig;0]'); // retning matcher ikke interval
  setMono315('mono-315s2','voksende','315s2-int','[0;uendelig[');
  w.checkSilver315();
  test('Sølv: forkert retning-interval match → not correct', !isMonoCorrect('mono-315s1','315s1-int'));
  test('Sølv: forkert match → opg315SilverDone forbliver false', !w.opg315SilverDone);

  console.log('\nGuld 3.1.5 – to intervaller, ombyttet rækkefølge');
  w.restartOpgaver315(); w.opg315Level=3; w.startOpgaver315();
  setMono315('mono-315g1','aftagende','315g1-int','[-150;315]');
  setMono315('mono-315g2','voksende','315g2-int','[315;350]');
  w.checkGold315();
  test('Guld: korrekt rækkefølge → begge correct', isMonoCorrect('mono-315g1','315g1-int') && isMonoCorrect('mono-315g2','315g2-int'));
  test('Guld: opg315GoldDone=true', w.opg315GoldDone);
  w.restartOpgaver315(); w.opg315Level=3; w.startOpgaver315();
  setMono315('mono-315g1','voksende','315g1-int','[315;350]'); // ombyttet
  setMono315('mono-315g2','aftagende','315g2-int','[-150;315]');
  w.checkGold315();
  test('Guld: ombyttet rækkefølge → stadig correct', isMonoCorrect('mono-315g1','315g1-int') && isMonoCorrect('mono-315g2','315g2-int'));
  test('Guld: ombyttet → opg315GoldDone=true', w.opg315GoldDone);
  w.restartOpgaver315(); w.opg315Level=3; w.startOpgaver315();
  setMono315('mono-315g1','aftagende','315g1-int','[-150;300]'); // forkert interval
  setMono315('mono-315g2','voksende','315g2-int','[315;350]');
  w.checkGold315();
  test('Guld: forkert interval → not correct', !isMonoCorrect('mono-315g1','315g1-int'));
  test('Guld: forkert → opg315GoldDone forbliver false', !w.opg315GoldDone);

  console.log('\nMedalje og restart-flow 3.1.5');
  w.restartOpgaver315(); w.opg315Level=1; w.startOpgaver315();
  setMono315('mono-315b1','voksende','315b1-int',']-uendelig;uendelig[');
  w.checkBronze315();
  test('Bronze niveau: medalje gemmes', w.opg315MedalShown);
  w.restartOpgaver315();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-315').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-315').style.display==='none');
  test('Restart: interval-input nulstillet', d.getElementById('ow-315b1-int').value==='');
  test('Restart: toggle-knap nulstillet til voksende', d.getElementById('mono-315b1').dataset.state==='voksende');
  test('Restart: toggle-knap korrekt/wrong fjernet', !d.getElementById('mono-315b1').classList.contains('correct'));
  test('Restart: opgave-widgets skjules', d.getElementById('opg315-low').classList.contains('opgave-hidden'));
  test('Restart: opg315BronzeDone nulstillet', !w.opg315BronzeDone);
  test('Restart: opg315MedalShown nulstillet', !w.opg315MedalShown);

  // ── 3.1.6 EGENSKABER VED GRAFER ─────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.1.6');
  w.showPage('3-1-6');
  test('showPage(3-1-6)', isVisible(d.getElementById('page-3-1-6')));
  test('3 tab-knapper i 3.1.6', d.querySelectorAll('#page-3-1-6 .tab-btn').length === 3);
  test('3.1.6 i emneData', html.includes("'3.1.6'") && html.includes("'chk-316-bog'"));
  test('3.1.6 har kun ét materiale-kort (ingen YouTube)', d.querySelectorAll('#t316-mat .simple-card').length === 1);

  console.log('\nQuiz 3.1.6 – positive tests');
  d.querySelectorAll('#page-3-1-6 .tab-btn')[1].click();
  const q316answers = [2,1,0,1,1,1]; // korrekte options (0-indekseret): C,B,A,B,B,B
  q316answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq316-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.1.6 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.1.6 quiz score: 6/6', d.getElementById('quiz-score-316-title').textContent.includes('6/6'));

  console.log('\nQuiz 3.1.6 – negative tests');
  w.quizRetry316();
  d.querySelectorAll('#page-3-1-6 .tab-btn')[1].click();
  const q316_1b = d.querySelectorAll('#qq316-1 .quiz-option');
  q316_1b[0].click(); // A = wrong
  test('3.1.6 Q1: A → wrong', q316_1b[0].classList.contains('wrong'));
  test('3.1.6 Q1: feedback err', d.getElementById('qf316-1').classList.contains('err'));
  test('3.1.6 Q1: C ikke afsløret', !q316_1b[2].classList.contains('reveal-correct'));

  console.log('\ntoggleLige');
  var ligeBtn = d.getElementById('lige-316s1');
  test('lige-toggle default state = lige', ligeBtn.dataset.state === 'lige');
  w.toggleLige(ligeBtn);
  test('toggleLige: lige → ikke-lige', ligeBtn.dataset.state === 'ikke-lige' && ligeBtn.textContent === 'Ikke lige');
  w.toggleLige(ligeBtn);
  test('toggleLige: ikke-lige → lige', ligeBtn.dataset.state === 'lige' && ligeBtn.textContent === 'Lige');

  function setVal316(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect316(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  function setLige316(toggleId, state){ var btn=d.getElementById(toggleId); if(btn.dataset.state!==state) w.toggleLige(btn); }
  function isLigeCorrect316(toggleId){ return d.getElementById(toggleId).classList.contains('correct'); }

  console.log('\nBronze 3.1.6 – find nulpunkter, vilkårlig rækkefølge');
  w.showPage('3-1-6'); w.restartOpgaver316(); w.startOpgaver316();
  setVal316('316b1','2'); setVal316('316b2','-3'); setVal316('316b3','0'); setVal316('316b4','-1'); // vilkårlig rækkefølge
  w.checkBronze316();
  test('Bronze: alle fire nulpunkter (ombyttet) → correct', ['316b1','316b2','316b3','316b4'].every(id=>isCorrect316(id)));
  test('Bronze: opg316BronzeDone=true', w.opg316BronzeDone);

  console.log('\nBronze 3.1.6 – negative test: duplikat afvises');
  w.restartOpgaver316(); w.startOpgaver316();
  setVal316('316b1','-3'); setVal316('316b2','-3'); setVal316('316b3','0'); setVal316('316b4','2'); // -3 to gange
  w.checkBronze316();
  test('Bronze: duplikat nulpunkt → not correct', !isCorrect316('316b1'));
  test('Bronze: duplikat → opg316BronzeDone forbliver false', !w.opg316BronzeDone);
  w.restartOpgaver316(); w.startOpgaver316();
  setVal316('316b1','-3'); setVal316('316b2','-1'); setVal316('316b3','0'); setVal316('316b4','99'); // reelt forkert
  w.checkBronze316();
  test('Bronze: reelt forkert nulpunkt → not correct', !isCorrect316('316b1'));

  console.log('\nSølv 3.1.6 – lige funktioner');
  w.restartOpgaver316(); w.opg316Level=2; w.startOpgaver316();
  setLige316('lige-316s1','lige'); setLige316('lige-316s2','lige');
  w.checkSilver316();
  test('Sølv: f(x)=2x²+10 lige → correct', isLigeCorrect316('lige-316s1'));
  test('Sølv: g(x)=-3x²+4 lige → correct', isLigeCorrect316('lige-316s2'));
  test('Sølv: opg316SilverDone=true', w.opg316SilverDone);
  w.restartOpgaver316(); w.opg316Level=2; w.startOpgaver316();
  setLige316('lige-316s1','ikke-lige'); setLige316('lige-316s2','lige'); // forkert på s1
  w.checkSilver316();
  test('Sølv: forkert svar → not correct', !isLigeCorrect316('lige-316s1'));
  test('Sølv: forkert → opg316SilverDone forbliver false', !w.opg316SilverDone);

  console.log('\nGuld 3.1.6 – lige/ikke lige med flere led');
  w.restartOpgaver316(); w.opg316Level=3; w.startOpgaver316();
  setLige316('lige-316g1','ikke-lige'); // h(x)=x³
  setLige316('lige-316g2','ikke-lige'); // f(x)=2x⁴+4x
  setLige316('lige-316g3','lige');      // g(x)=3x⁴+x²
  w.checkGold316();
  test('Guld: h(x)=x³ ikke lige → correct', isLigeCorrect316('lige-316g1'));
  test('Guld: f(x)=2x⁴+4x ikke lige → correct', isLigeCorrect316('lige-316g2'));
  test('Guld: g(x)=3x⁴+x² lige → correct', isLigeCorrect316('lige-316g3'));
  test('Guld: opg316GoldDone=true', w.opg316GoldDone);
  w.restartOpgaver316(); w.opg316Level=3; w.startOpgaver316();
  setLige316('lige-316g1','lige'); // forkert — h(x)=x³ er ulige
  setLige316('lige-316g2','ikke-lige');
  setLige316('lige-316g3','lige');
  w.checkGold316();
  test('Guld: forkert svar → not correct', !isLigeCorrect316('lige-316g1'));
  test('Guld: forkert → opg316GoldDone forbliver false', !w.opg316GoldDone);

  console.log('\nMedalje og restart-flow 3.1.6');
  w.restartOpgaver316(); w.opg316Level=1; w.startOpgaver316();
  setVal316('316b1','-3'); setVal316('316b2','-1'); setVal316('316b3','0'); setVal316('316b4','2');
  w.checkBronze316();
  test('Bronze niveau: medalje gemmes', w.opg316MedalShown);
  w.restartOpgaver316();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-316').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-316').style.display==='none');
  test('Restart: input nulstillet', d.getElementById('ow-316b1').value==='');
  test('Restart: lige-toggle nulstillet til Lige', d.getElementById('lige-316s1').dataset.state==='lige');
  test('Restart: opgave-widgets skjules', d.getElementById('opg316-low').classList.contains('opgave-hidden'));
  test('Restart: opg316BronzeDone nulstillet', !w.opg316BronzeDone);
  test('Restart: opg316MedalShown nulstillet', !w.opg316MedalShown);

  // ── 3.1.7 OMVENDT FUNKTION ──────────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.1.7');
  w.showPage('3-1-7');
  test('showPage(3-1-7)', isVisible(d.getElementById('page-3-1-7')));
  test('3 tab-knapper i 3.1.7', d.querySelectorAll('#page-3-1-7 .tab-btn').length === 3);
  test('3.1.7 i emneData', html.includes("'3.1.7'") && html.includes("'chk-317-bog'"));
  test('3.1.7 har to YouTube-kort', d.querySelectorAll('#t317-mat .simple-card').length === 3);

  console.log('\nQuiz 3.1.7 – positive tests');
  d.querySelectorAll('#page-3-1-7 .tab-btn')[1].click();
  const q317answers = [1,2,1,1,2,1,1]; // korrekte options (0-indekseret): B,C,B,B,C,B,B
  q317answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq317-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.1.7 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.1.7 quiz score: 7/7', d.getElementById('quiz-score-317-title').textContent.includes('7/7'));

  console.log('\nQuiz 3.1.7 – negative tests');
  w.quizRetry317();
  d.querySelectorAll('#page-3-1-7 .tab-btn')[1].click();
  const q317_1b = d.querySelectorAll('#qq317-1 .quiz-option');
  q317_1b[0].click(); // A = wrong
  test('3.1.7 Q1: A → wrong', q317_1b[0].classList.contains('wrong'));
  test('3.1.7 Q1: feedback err', d.getElementById('qf317-1').classList.contains('err'));
  test('3.1.7 Q1: B ikke afsløret', !q317_1b[1].classList.contains('reveal-correct'));

  console.log('\nsafeEvalFormula');
  test('(x+2)/3 og x/3+2/3 er ækvivalente', Math.abs(w.safeEvalFormula('(x+2)/3',7) - w.safeEvalFormula('x/3+2/3',7)) < 0.001);
  test('x^2 og x*x er ækvivalente', w.safeEvalFormula('x^2',5) === w.safeEvalFormula('x*x',5));
  test('implicit multiplikation: 50000-10x = 50000-10*x', w.safeEvalFormula('50000-10x',100) === w.safeEvalFormula('50000-10*x',100));
  test('sqrt(x) og √x er ækvivalente', w.safeEvalFormula('sqrt(x)',9) === w.safeEvalFormula('√x',9));
  test('ondsindet input afvises: alert(1)', isNaN(w.safeEvalFormula('alert(1)',0)));
  test('ondsindet input afvises: window.location', isNaN(w.safeEvalFormula('window.location',0)));
  test('tomt input afvises', isNaN(w.safeEvalFormula('',0)));

  function setVal317(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect317(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}

  console.log('\nBronze 3.1.7 – omvendt funktion til f(x)=3x-2');
  w.showPage('3-1-7'); w.restartOpgaver317(); w.startOpgaver317();
  setVal317('317b1','(x+2)/3');
  w.checkBronze317();
  test('Bronze: (x+2)/3 → correct', isCorrect317('317b1'));
  test('Bronze: opg317BronzeDone=true', w.opg317BronzeDone);
  w.restartOpgaver317(); w.startOpgaver317();
  setVal317('317b1','(2+x)/3'); // anden paranteseret men ækvivalent formulering
  w.checkBronze317();
  test('Bronze: ækvivalent parenteseret formulering (2+x)/3 → correct', isCorrect317('317b1'));
  w.restartOpgaver317(); w.startOpgaver317();
  setVal317('317b1','(x+2)/4'); // reelt forkert, men har parenteser
  w.checkBronze317();
  test('Bronze: forkert formel (med parentes) → not correct', !isCorrect317('317b1'));
  test('Bronze: forkert → opg317BronzeDone forbliver false', !w.opg317BronzeDone);

  console.log('\nBronze 3.1.7 – manglende parentes afvises, selvom tallene passer');
  w.restartOpgaver317(); w.startOpgaver317();
  setVal317('317b1','1/3*x+2/3'); // numerisk identisk med (x+2)/3, men uden parentes
  w.checkBronze317();
  test('Bronze: 1/3*x+2/3 (ingen parentes) → not correct', !isCorrect317('317b1'));
  test('Bronze: manglende parentes → specifik fejlbesked', d.getElementById('ow-r-317-low').textContent.includes('parentes'));
  test('Bronze: manglende parentes → opg317BronzeDone forbliver false', !w.opg317BronzeDone);
  w.restartOpgaver317(); w.startOpgaver317();
  setVal317('317b1','x/3+2/3'); // også numerisk korrekt, men ingen parentes
  w.checkBronze317();
  test('Bronze: x/3+2/3 (ingen parentes) → not correct', !isCorrect317('317b1'));

  console.log('\nSølv 3.1.7 – omvendt funktion til f(x)=sqrt(x)');
  w.restartOpgaver317(); w.opg317Level=2; w.startOpgaver317();
  setVal317('317s1','x^2');
  w.checkSilver317();
  test('Sølv: x^2 → correct', isCorrect317('317s1'));
  test('Sølv: opg317SilverDone=true', w.opg317SilverDone);
  w.restartOpgaver317(); w.opg317Level=2; w.startOpgaver317();
  setVal317('317s1','x*x'); // ækvivalent formulering
  w.checkSilver317();
  test('Sølv: ækvivalent formulering (x*x) → correct', isCorrect317('317s1'));
  w.restartOpgaver317(); w.opg317Level=2; w.startOpgaver317();
  setVal317('317s1','x^3'); // reelt forkert
  w.checkSilver317();
  test('Sølv: forkert formel → not correct', !isCorrect317('317s1'));

  console.log('\nGuld 3.1.7 – prisfunktion (elektronikvirksomhed)');
  w.restartOpgaver317(); w.opg317Level=3; w.startOpgaver317();
  setVal317('317g1','6000');
  setVal317('317g2','40000-5*x');
  setVal317('317g5','[0;40000]');
  setVal317('317g4','25000');
  w.checkGold317();
  test('Guld: pris ved 10000 enheder → correct', isCorrect317('317g1'));
  test('Guld: omvendt funktion → correct', isCorrect317('317g2'));
  test('Guld: definitionsmængde → correct', isCorrect317('317g5'));
  test('Guld: salg ved 3000 kr. → correct', isCorrect317('317g4'));
  test('Guld: opg317GoldDone=true', w.opg317GoldDone);
  test('Guld: ingen forklaringsfelt findes længere', !d.getElementById('ow-317g3'));
  w.restartOpgaver317(); w.opg317Level=3; w.startOpgaver317();
  setVal317('317g1','9999'); // reelt forkert
  setVal317('317g2','40000-5*x');
  setVal317('317g5','[0;40000]');
  setVal317('317g4','25000');
  w.checkGold317();
  test('Guld: forkert prisberegning → not correct', !isCorrect317('317g1'));
  w.restartOpgaver317(); w.opg317Level=3; w.startOpgaver317();
  setVal317('317g1','6000');
  setVal317('317g2','40000-5*x');
  setVal317('317g5','[0;30000]'); // forkert definitionsmængde
  setVal317('317g4','25000');
  w.checkGold317();
  test('Guld: forkert definitionsmængde → not correct', !isCorrect317('317g5'));
  test('Guld: forkert definitionsmængde → opg317GoldDone forbliver false', !w.opg317GoldDone);

  console.log('\nMedalje og restart-flow 3.1.7');
  w.restartOpgaver317(); w.opg317Level=1; w.startOpgaver317();
  setVal317('317b1','(x+2)/3');
  w.checkBronze317();
  test('Bronze niveau: medalje gemmes', w.opg317MedalShown);
  w.restartOpgaver317();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-317').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-317').style.display==='none');
  test('Restart: formel-input nulstillet', d.getElementById('ow-317b1').value==='');
  test('Restart: opgave-widgets skjules', d.getElementById('opg317-low').classList.contains('opgave-hidden'));
  test('Restart: opg317BronzeDone nulstillet', !w.opg317BronzeDone);
  test('Restart: opg317MedalShown nulstillet', !w.opg317MedalShown);

  // ── 3.2.1 GRUNDBEGREBER ─────────────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.2.1');
  w.showPage('3-2-1');
  test('showPage(3-2-1)', isVisible(d.getElementById('page-3-2-1')));
  test('3 tab-knapper i 3.2.1', d.querySelectorAll('#page-3-2-1 .tab-btn').length === 3);
  test('3.2.1 i emneData', html.includes("'3.2.1'") && html.includes("'chk-321-bog'"));

  console.log('\nQuiz 3.2.1 – positive tests');
  d.querySelectorAll('#page-3-2-1 .tab-btn')[1].click();
  const q321answers = [1,1,2,1,1,0,2,1]; // korrekte options (0-indekseret): B,B,C,B,B,A,C,B
  q321answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq321-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.2.1 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.2.1 quiz score: 8/8', d.getElementById('quiz-score-321-title').textContent.includes('8/8'));

  console.log('\nQuiz 3.2.1 – negative tests');
  w.quizRetry321();
  d.querySelectorAll('#page-3-2-1 .tab-btn')[1].click();
  const q321_1b = d.querySelectorAll('#qq321-1 .quiz-option');
  q321_1b[0].click(); // A = wrong
  test('3.2.1 Q1: A → wrong', q321_1b[0].classList.contains('wrong'));
  test('3.2.1 Q1: feedback err', d.getElementById('qf321-1').classList.contains('err'));
  test('3.2.1 Q1: B ikke afsløret', !q321_1b[1].classList.contains('reveal-correct'));

  // ── BRONZE 3.2.1 — TEGN GRAF (genbrug af 3.1.3's tegne-mekanisme) ────────────
  console.log('\nStruktur: navngivne canvas-handlers findes globalt (removeEventListener-krav)');
  ['canvas321MousedownHandler','canvas321MousemoveHandler','canvas321MouseupHandler',
   'canvas321TouchstartHandler','canvas321TouchmoveHandler','canvas321TouchendHandler',
   'initCanvas321','getCanvasPoint321','drawCanvas321'].forEach(fn => {
    test(`${fn} findes globalt`, typeof w[fn] === 'function');
  });

  console.log('\ncheckCurve321 — kurve for f(x) = -2x + 3');
  w.showPage('3-2-1'); w.restartOpgaver321(); w.startOpgaver321();
  const rCurve321 = d.getElementById('ow-r-321-curve');

  function genLine321(noisy){
    var pts=[];
    for(var x=-2;x<=4;x+=0.1){pts.push([x, -2*x+3+(noisy?(Math.random()-0.5)*0.3:0)]);}
    return pts;
  }

  w.canvas321Curve=genLine321(false); w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: korrekt linje → done', w.opg321BronzeCurveDone);
  test('Kurve: korrekt linje → ok-styling', rCurve321 && rCurve321.classList.contains('ok'));
  test('Kurve: korrekt → endepunkt-sektion vises', d.getElementById('canvas-321-endpoints-wrap').style.display==='block');

  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(true); w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: med lille støj → stadig done', w.opg321BronzeCurveDone);

  w.restartOpgaver321(); w.startOpgaver321();
  var flatLine321=[]; for(var fx=-2;fx<=4;fx+=0.1) flatLine321.push([fx,0]);
  w.canvas321Curve=flatLine321; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: forkert hældning (flad linje) → ikke done', !w.opg321BronzeCurveDone);
  test('Kurve: forkert → err-styling', rCurve321 && rCurve321.classList.contains('err'));
  test('Kurve: forkert → endepunkt-sektion vises IKKE', d.getElementById('canvas-321-endpoints-wrap').style.display!=='block');

  w.canvas321Curve=[]; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: ingen kurve tegnet → err', rCurve321 && rCurve321.classList.contains('err'));

  console.log('\ncheckCurve321 — skærpede krav: fuld dækning af domænet');
  w.restartOpgaver321(); w.startOpgaver321();
  var lineToX3=[]; for(var lx=-2;lx<=3;lx+=0.1) lineToX3.push([lx,-2*lx+3]);
  w.canvas321Curve=lineToX3; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: stopper ved x=3 (når ikke x=4) → ikke done', !w.opg321BronzeCurveDone);
  test('Kurve: stopper for tidligt → specifik fejlbesked om intervallet', rCurve321.textContent.includes('hele vejen'));
  test('Kurve: stopper for tidligt → endepunkt-sektion vises IKKE', d.getElementById('canvas-321-endpoints-wrap').style.display!=='block');

  w.restartOpgaver321(); w.startOpgaver321();
  var lineFromXminus1=[]; for(var lx2=-1;lx2<=4;lx2+=0.1) lineFromXminus1.push([lx2,-2*lx2+3]);
  w.canvas321Curve=lineFromXminus1; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: starter ved x=-1 (når ikke x=-2) → ikke done', !w.opg321BronzeCurveDone);

  console.log('\ncheckCurve321 — skærpet tolerance (0.4 i stedet for 0.8)');
  w.restartOpgaver321(); w.startOpgaver321();
  var lineOffBy05=[]; for(var lx3=-2;lx3<=4;lx3+=0.1) lineOffBy05.push([lx3,-2*lx3+3+0.5]);
  w.canvas321Curve=lineOffBy05; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: hele linjen forskudt 0,5 (ville bestå med gammel tolerance 0.8) → nu ikke done', !w.opg321BronzeCurveDone);

  w.restartOpgaver321(); w.startOpgaver321();
  var wrongIntercept=[]; for(var lx4=-2;lx4<=4;lx4+=0.1){
    var yv=-2*lx4+3;
    if(Math.abs(lx4)<0.35) yv=2; // fejl et bredt nok område omkring y-tilskæringen til at ramme flere samplepunkter
    wrongIntercept.push([lx4,yv]);
  }
  w.canvas321Curve=wrongIntercept; w.opg321BronzeCurveDone=false; w.checkCurve321();
  test('Kurve: forkert y-skæring (2 i stedet for 3) → ikke done', !w.opg321BronzeCurveDone);

  console.log('\ntoggleEndpoint');
  var epLeft = d.getElementById('endpoint-321-left'), epRight = d.getElementById('endpoint-321-right');
  test('Venstre endepunkt default = åben', epLeft.dataset.state === 'aaben' && epLeft.textContent === 'Åben');
  test('Højre endepunkt default = åben', epRight.dataset.state === 'aaben' && epRight.textContent === 'Åben');
  w.toggleEndpoint(epLeft);
  test('toggleEndpoint: åben → lukket', epLeft.dataset.state === 'lukket' && epLeft.textContent === 'Lukket');
  w.toggleEndpoint(epLeft);
  test('toggleEndpoint: lukket → åben', epLeft.dataset.state === 'aaben' && epLeft.textContent === 'Åben');

  console.log('\ncheckEndpoints321 — x=-2 skal være åben, x=4 skal være lukket');
  function setEndpoints321(leftState, rightState){
    var l=d.getElementById('endpoint-321-left'), r=d.getElementById('endpoint-321-right');
    if(l.dataset.state!==leftState) w.toggleEndpoint(l);
    if(r.dataset.state!==rightState) w.toggleEndpoint(r);
  }

  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321(); // kurve skal være korrekt først
  setEndpoints321('aaben','lukket');
  w.checkEndpoints321();
  test('Endepunkter: åben+lukket (korrekt) → begge correct', epLeft.classList.contains('correct') && epRight.classList.contains('correct'));
  test('Endepunkter: korrekt → opg321BronzeEndpointsDone=true', w.opg321BronzeEndpointsDone);

  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  setEndpoints321('lukket','aaben'); // byttet om
  w.checkEndpoints321();
  test('Endepunkter: byttet om (lukket+åben) → ikke korrekt', !w.opg321BronzeEndpointsDone);
  test('Endepunkter: byttet om → venstre wrong', epLeft.classList.contains('wrong'));

  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  setEndpoints321('aaben','aaben'); // begge åbne
  w.checkEndpoints321();
  test('Endepunkter: begge åbne → ikke korrekt', !w.opg321BronzeEndpointsDone);
  test('Endepunkter: begge åbne → højre wrong (skal være lukket)', epRight.classList.contains('wrong'));

  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  setEndpoints321('lukket','lukket'); // begge lukkede
  w.checkEndpoints321();
  test('Endepunkter: begge lukkede → ikke korrekt', !w.opg321BronzeEndpointsDone);
  test('Endepunkter: begge lukkede → venstre wrong (skal være åben)', epLeft.classList.contains('wrong'));

  console.log('\nMedalje kræver BÅDE korrekt kurve OG korrekte endepunkter');
  w.restartOpgaver321(); w.opg321Level=1; w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321(); // kun kurve, ikke endepunkter
  test('Kun kurve korrekt → ingen medalje endnu', !w.opg321MedalShown);
  setEndpoints321('aaben','lukket');
  w.checkEndpoints321(); // nu begge dele
  test('Kurve + endepunkter korrekte → medalje gemmes', w.opg321MedalShown);

  console.log('\nclearCurve321');
  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  test('Før ryd: kurve tegnet', w.canvas321Curve.length>0);
  w.clearCurve321();
  test('Ryd kurve: canvas321Curve tømt', w.canvas321Curve.length===0);
  test('Ryd kurve: opg321BronzeCurveDone nulstillet', !w.opg321BronzeCurveDone);

  console.log('\nRestart-flow 3.2.1');
  w.restartOpgaver321(); w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  setEndpoints321('aaben','lukket'); w.checkEndpoints321();
  w.restartOpgaver321();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-321').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-321').style.display==='none');
  test('Restart: canvas321Curve tømt', w.canvas321Curve.length===0);
  test('Restart: endepunkt-sektion skjult igen', d.getElementById('canvas-321-endpoints-wrap').style.display==='none');
  test('Restart: venstre endepunkt nulstillet til åben', d.getElementById('endpoint-321-left').dataset.state==='aaben');
  test('Restart: højre endepunkt nulstillet til åben', d.getElementById('endpoint-321-right').dataset.state==='aaben');
  test('Restart: endepunkt-styling fjernet', !d.getElementById('endpoint-321-left').classList.contains('correct'));
  test('Restart: opgave-widget skjules', d.getElementById('opg321-low').classList.contains('opgave-hidden'));
  test('Restart: opg321BronzeCurveDone nulstillet', !w.opg321BronzeCurveDone);
  test('Restart: opg321BronzeEndpointsDone nulstillet', !w.opg321BronzeEndpointsDone);
  test('Restart: opg321MedalShown nulstillet', !w.opg321MedalShown);

  console.log('\nparseCoordinatePoint');
  test('(5,0) parses til [5,0]', JSON.stringify(w.parseCoordinatePoint('(5,0)')) === JSON.stringify([5,0]));
  test('5,0 (uden parenteser) parses til [5,0]', JSON.stringify(w.parseCoordinatePoint('5,0')) === JSON.stringify([5,0]));
  test('( 5 , 0 ) med mellemrum parses korrekt', JSON.stringify(w.parseCoordinatePoint('( 5 , 0 )')) === JSON.stringify([5,0]));
  test('ugyldigt input giver null', w.parseCoordinatePoint('abc') === null);
  test('kun ét tal giver null', w.parseCoordinatePoint('(5)') === null);

  console.log('\nSølv 3.2.1 – skæringspunkt med x-aksen for g(x)=-3x+15');
  function setVal321(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect321(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  w.showPage('3-2-1'); w.restartOpgaver321(); w.opg321Level=2; w.startOpgaver321();
  setVal321('321s1','(5,0)');
  w.checkSilver321();
  test('Sølv: (5,0) → correct', isCorrect321('321s1'));
  test('Sølv: opg321SilverDone=true', w.opg321SilverDone);
  w.restartOpgaver321(); w.opg321Level=2; w.startOpgaver321();
  setVal321('321s1','5,0'); // uden parenteser
  w.checkSilver321();
  test('Sølv: 5,0 (uden parenteser) → correct', isCorrect321('321s1'));
  w.restartOpgaver321(); w.opg321Level=2; w.startOpgaver321();
  setVal321('321s1','(0,5)'); // byttet om x og y
  w.checkSilver321();
  test('Sølv: (0,5) byttet om x/y → not correct', !isCorrect321('321s1'));
  test('Sølv: forkert → opg321SilverDone forbliver false', !w.opg321SilverDone);
  w.restartOpgaver321(); w.opg321Level=2; w.startOpgaver321();
  setVal321('321s1','(3,0)'); // reelt forkert x-værdi
  w.checkSilver321();
  test('Sølv: (3,0) reelt forkert → not correct', !isCorrect321('321s1'));

  console.log('\nGuld 3.2.1 – værdimængde for h(x)=2x-4, x∈[-3;5[');
  w.restartOpgaver321(); w.opg321Level=3; w.startOpgaver321();
  setVal321('321g1','[-10;6[');
  w.checkGold321();
  test('Guld: [-10;6[ → correct', isCorrect321('321g1'));
  test('Guld: opg321GoldDone=true', w.opg321GoldDone);
  w.restartOpgaver321(); w.opg321Level=3; w.startOpgaver321();
  setVal321('321g1','[-10;6]'); // forkert parentestype i højre ende
  w.checkGold321();
  test('Guld: forkert parentestype → not correct', !isCorrect321('321g1'));
  test('Guld: forkert → opg321GoldDone forbliver false', !w.opg321GoldDone);

  console.log('\nFuld 3-niveau medaljeflow 3.2.1 (bronze+sølv+guld)');
  w.restartOpgaver321(); w.opg321Level=3; w.startOpgaver321();
  w.canvas321Curve=genLine321(false); w.checkCurve321();
  setEndpoints321('aaben','lukket'); w.checkEndpoints321();
  test('Niveau 3: kun bronze færdig → ingen medalje endnu', !w.opg321MedalShown);
  setVal321('321s1','(5,0)'); w.checkSilver321();
  test('Niveau 3: bronze+sølv færdig, guld mangler → stadig ingen medalje', !w.opg321MedalShown);
  setVal321('321g1','[-10;6['); w.checkGold321();
  test('Niveau 3: alle tre færdige → medalje gemmes', w.opg321MedalShown);

  // ── 3.2.2 FORSKRIFT UD FRA TO PUNKTER ───────────────────────────────────────
  console.log('\nNavigation og struktur 3.2.2 (4 faner, inkl. ny Bevis-fane)');
  w.showPage('3-2-2');
  test('showPage(3-2-2)', isVisible(d.getElementById('page-3-2-2')));
  test('4 tab-knapper i 3.2.2 (Materiale/Tjekspørgsmål/Bevis/Opgaver)', d.querySelectorAll('#page-3-2-2 .tab-btn').length === 4);
  test('3.2.2 i emneData', html.includes("'3.2.2'") && html.includes("'chk-322-bog'"));
  test('Bevis-fane findes og er tom indtil videre', d.getElementById('t322-bevis') !== null);

  console.log('\nBevis-fanen på 3.2.2 påvirker ikke andre siders tab-antal');
  test('3.1.1 har stadig kun 3 tabs', d.querySelectorAll('#page-3-1-1 .tab-btn').length === 3);
  test('3.1.4 har stadig kun 3 tabs', d.querySelectorAll('#page-3-1-4 .tab-btn').length === 3);
  test('3.2.1 har stadig kun 3 tabs', d.querySelectorAll('#page-3-2-1 .tab-btn').length === 3);

  console.log('\nFane-skift på 3.2.2 er korrekt sidescopet');
  const tabs322 = d.querySelectorAll('#page-3-2-2 .tab-btn');
  tabs322[2].click(); // klik på "Bevis"
  test('Klik på Bevis-fane aktiverer t322-bevis panel', d.getElementById('t322-bevis').classList.contains('active'));
  test('Klik på Bevis-fane deaktiverer t322-mat panel', !d.getElementById('t322-mat').classList.contains('active'));
  test('3.1.1s aktive fane hører stadig til 3.1.1 (ingen leakage fra 3.2.2)', d.querySelector('#page-3-1-1 .tab-btn.active').dataset.tab.startsWith('t311-'));

  console.log('\nQuiz 3.2.2 – positive tests');
  d.querySelectorAll('#page-3-2-2 .tab-btn')[1].click();
  const q322answers = [1,1,1]; // korrekte options (0-indekseret): B,B,B
  q322answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq322-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.2.2 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.2.2 quiz score: 3/3', d.getElementById('quiz-score-322-title').textContent.includes('3/3'));

  console.log('\nQuiz 3.2.2 – negative tests');
  w.quizRetry322();
  d.querySelectorAll('#page-3-2-2 .tab-btn')[1].click();
  const q322_1b = d.querySelectorAll('#qq322-1 .quiz-option');
  q322_1b[0].click(); // A = wrong
  test('3.2.2 Q1: A → wrong', q322_1b[0].classList.contains('wrong'));
  test('3.2.2 Q1: feedback err', d.getElementById('qf322-1').classList.contains('err'));
  test('3.2.2 Q1: B ikke afsløret', !q322_1b[1].classList.contains('reveal-correct'));

  console.log('\nBevis 3.2.2 Del 1 – MC-spørgsmål om a og b');
  d.querySelectorAll('#page-3-2-2 .tab-btn')[2].click(); // Bevis-fanen
  test('Bevis-fane er nu aktiv', d.getElementById('t322-bevis').classList.contains('active'));
  const bq322_1 = d.querySelectorAll('#bq322-1 .quiz-option');
  test('4 svarmuligheder i Del 1', bq322_1.length === 4);
  bq322_1[2].click(); // C = correct
  test('Del 1: C → correct', bq322_1[2].classList.contains('correct'));
  test('Del 1: feedback ok', d.getElementById('bqf322-1').classList.contains('ok'));

  console.log('\nBevis 3.2.2 Del 1 – negativ test');
  w.resetBevis322(); // simulerer at fanen genåbnes
  const bq322_1b = d.querySelectorAll('#bq322-1 .quiz-option');
  bq322_1b[0].click(); // A = wrong
  test('Del 1: A → wrong', bq322_1b[0].classList.contains('wrong'));
  test('Del 1: feedback err', d.getElementById('bqf322-1').classList.contains('err'));
  test('Del 1: C ikke afsløret', !bq322_1b[2].classList.contains('reveal-correct'));
  test('Del 1: kan ikke besvares to gange (disabled efter svar)', bq322_1b[1].disabled === true);

  console.log('\nBevis 3.2.2 – fanen starter forfra ved genbesøg');
  // Besvar spørgsmålet korrekt først
  w.resetBevis322();
  const bq322_1c = d.querySelectorAll('#bq322-1 .quiz-option');
  bq322_1c[2].click(); // C = correct
  test('Før genbesøg: spørgsmål er besvaret (correct)', bq322_1c[2].classList.contains('correct'));
  test('Før genbesøg: knapper er disabled', bq322_1c[0].disabled === true);
  // Forlad fanen og klik ind på Bevis-fanen igen — skal nulstille
  d.querySelectorAll('#page-3-2-2 .tab-btn')[0].click(); // Materiale
  d.querySelectorAll('#page-3-2-2 .tab-btn')[2].click(); // Bevis igen
  const bq322_1d = d.querySelectorAll('#bq322-1 .quiz-option');
  test('Genbesøg: ingen knapper er længere markeret correct', ![...bq322_1d].some(b=>b.classList.contains('correct')));
  test('Genbesøg: ingen knapper er længere markeret wrong', ![...bq322_1d].some(b=>b.classList.contains('wrong')));
  test('Genbesøg: alle knapper er igen klikbare', [...bq322_1d].every(b=>!b.disabled));
  test('Genbesøg: feedback-tekst er tømt', d.getElementById('bqf322-1').textContent === '');
  test('Genbesøg: spørgsmålet kan besvares igen', (bq322_1d[2].click(), bq322_1d[2].classList.contains('correct')));

  // ── BEVIS 3.2.2 DEL 2 — BYGGEKLODS-BEVIS (TRÆK-OG-SLIP) ─────────────────────
  console.log('\nDel 2 er skjult indtil Del 1 er besvaret korrekt');
  w.showPage('3-2-2');
  d.querySelectorAll('#page-3-2-2 .tab-btn')[2].click(); // Bevis-fanen
  w.resetBevis322();
  test('Del 2 er skjult ved fane-åbning', d.getElementById('t322-bevis-del2').style.display === 'none');
  var bq322_gate = d.querySelectorAll('#bq322-1 .quiz-option');
  bq322_gate[0].click(); // A = wrong
  test('Del 2 forbliver skjult ved forkert svar på Del 1', d.getElementById('t322-bevis-del2').style.display === 'none');
  w.resetBevis322();
  var bq322_gate2 = d.querySelectorAll('#bq322-1 .quiz-option');
  bq322_gate2[2].click(); // C = correct
  test('Del 2 vises efter korrekt svar på Del 1', d.getElementById('t322-bevis-del2').style.display === 'block');

  function proofTile(pid){ return d.getElementById('proof322-'+pid); }
  function isInSequence(pid){ return proofTile(pid).parentElement.id === 'proof322-sequence'; }
  function isInPool(pid){ return proofTile(pid).parentElement.id === 'proof322-pool'; }

  console.log('\nproof322MoveToSequence / proof322MoveToPool — DOM-baseret træk-og-slip');
  w.resetProof322Sequence();
  test('Alle brikker starter i pool (grå, ikke en del af rækkefølgen)', w.proof322Pieces.every(pid => isInPool(pid)));
  test('Pool-brik er ikke .in-sequence', !proofTile('b3').classList.contains('in-sequence'));

  w.proof322MoveToSequence('b3');
  test('b3 flyttet til sekvensen', isInSequence('b3'));
  test('b3 får in-sequence-klasse (fjern-knap vises)', proofTile('b3').classList.contains('in-sequence'));
  test('Sekvens-rækkefølge er b3', w.getProof322Sequence().join(',') === 'b3');

  w.proof322MoveToSequence('b1');
  test('Sekvens-rækkefølge er b3,b1', w.getProof322Sequence().join(',') === 'b3,b1');

  w.proof322MoveToSequence('b4', 'b1'); // indsæt b4 FØR b1 → b3,b4,b1
  test('Indsæt før specifik brik: rækkefølge er b3,b4,b1', w.getProof322Sequence().join(',') === 'b3,b4,b1');

  console.log('\nproof322MoveToPool (fjern-knap) — brik bliver grå igen, ude af rækkefølgen');
  w.proof322MoveToPool('b4');
  test('Fjern b4: tilbage i pool', isInPool('b4'));
  test('Fjern b4: ikke længere in-sequence', !proofTile('b4').classList.contains('in-sequence'));
  test('Fjern b4: væk fra sekvensen', w.getProof322Sequence().join(',') === 'b3,b1');

  console.log('\ncheckProof322 — korrekt rækkefølge (3→1→4→5→2)');
  w.resetProof322Sequence();
  ['b3','b1','b4','b5','b2'].forEach(pid => w.proof322MoveToSequence(pid));
  test('Fuld korrekt sekvens sat op', w.getProof322Sequence().join(',') === 'b3,b1,b4,b5,b2');
  w.checkProof322();
  ['b3','b1','b4','b5','b2'].forEach(pid => {
    test('Brik '+pid+' markeres correct', proofTile(pid).classList.contains('correct'));
  });
  test('opg322BevisDone=true', w.opg322BevisDone);
  test('bevis_322 gemt i localStorage', w.loadProgress('bevis_322', false) === true);
  test('Resultat: ok-styling', d.getElementById('ow-r-322-proof').classList.contains('ok'));

  console.log('\nshowHeart/closeHeart — popup for fuldført bevis');
  d.getElementById('heart-overlay').classList.remove('show'); // nulstil for ren test
  w.showHeart();
  test('showHeart(): overlay får show-klasse', d.getElementById('heart-overlay').classList.contains('show'));
  w.closeHeart();
  test('closeHeart(): overlay mister show-klasse', !d.getElementById('heart-overlay').classList.contains('show'));

  console.log('\ncheckProof322 — forkert rækkefølge (byttet om)');
  w.resetProof322Sequence(); w.opg322BevisDone = false;
  ['b1','b3','b4','b5','b2'].forEach(pid => w.proof322MoveToSequence(pid)); // b1 og b3 byttet om
  w.checkProof322();
  test('Byttet rækkefølge: opg322BevisDone forbliver false', !w.opg322BevisDone);
  test('Byttet rækkefølge: resultat err-styling', d.getElementById('ow-r-322-proof').classList.contains('err'));
  test('Byttet rækkefølge: b4 (position 3, korrekt der) markeres correct', proofTile('b4').classList.contains('correct'));
  test('Byttet rækkefølge: b1 (forkert position) markeres wrong', proofTile('b1').classList.contains('wrong'));

  console.log('\ncheckProof322 — distraktor inkluderet i sekvensen');
  w.resetProof322Sequence(); w.opg322BevisDone = false;
  ['b3','b1','fA','b5','b2'].forEach(pid => w.proof322MoveToSequence(pid)); // fA i stedet for b4
  w.checkProof322();
  test('Distraktor i sekvens: opg322BevisDone forbliver false', !w.opg322BevisDone);
  test('Distraktor fA markeres wrong', proofTile('fA').classList.contains('wrong'));
  test('Korrekt placerede brikker (b3,b1) markeres stadig correct', proofTile('b3').classList.contains('correct') && proofTile('b1').classList.contains('correct'));

  console.log('\ncheckProof322 — for få brikker valgt');
  w.resetProof322Sequence(); w.opg322BevisDone = false;
  ['b3','b1'].forEach(pid => w.proof322MoveToSequence(pid));
  w.checkProof322();
  test('Kun 2 af 5 brikker: opg322BevisDone forbliver false', !w.opg322BevisDone);

  console.log('\nresetProof322Sequence');
  w.resetProof322Sequence(); w.opg322BevisDone = false;
  ['b3','b1','b4','b5','b2'].forEach(pid => w.proof322MoveToSequence(pid));
  w.resetProof322Sequence();
  test('Ryd: sekvensen er tom', w.getProof322Sequence().length === 0);
  test('Ryd: alle brikker er tilbage i pool', w.proof322Pieces.every(pid => isInPool(pid)));
  test('Ryd: ingen brikker er in-sequence', w.proof322Pieces.every(pid => !proofTile(pid).classList.contains('in-sequence')));

  console.log('\nDragEvent-handlere — proof322DropOnSequence/DropOnPool virker via draggedId');
  w.resetProof322Sequence();
  w.proof322DraggedId = 'b3';
  var fakeSeqDrop = { preventDefault: function(){}, target: d.getElementById('proof322-sequence'), dataTransfer: null };
  w.proof322DropOnSequence(fakeSeqDrop);
  test('DropOnSequence flytter den trukne brik til sekvensen', isInSequence('b3'));
  w.proof322DraggedId = 'b3';
  var fakePoolDrop = { preventDefault: function(){}, target: d.getElementById('proof322-pool'), dataTransfer: null };
  w.proof322DropOnPool(fakePoolDrop);
  test('DropOnPool flytter brikken tilbage i pool', isInPool('b3'));

  console.log('\nVisuelt drop-placeholder (grå boks der viser hvor brikken lander)');
  console.log('  NB: selve indsætnings-positionen afhænger af getBoundingClientRect, som jsdom ikke');
  console.log('  layouter rigtigt — det testes derfor manuelt i browseren. Her testes kun show/hide-logikken.');
  w.resetProof322Sequence();
  var placeholderEl = d.getElementById('proof322-placeholder');
  test('Placeholder findes og starter skjult', placeholderEl && placeholderEl.style.display === 'none');
  test('Placeholder er altid barn af sekvens-containeren', placeholderEl.parentElement.id === 'proof322-sequence');

  w.proof322DraggedId = 'b3';
  var fakeDragOver = { preventDefault: function(){}, clientY: 0 };
  w.proof322DragOverSequence(fakeDragOver);
  test('dragover over sekvensen: placeholder bliver synlig', placeholderEl.style.display === 'block');

  w.proof322DragOverPool({ preventDefault: function(){} });
  test('dragover over puljen: placeholder skjules igen', placeholderEl.style.display === 'none');

  w.proof322DragOverSequence(fakeDragOver);
  test('placeholder synlig igen efter dragover på sekvensen', placeholderEl.style.display === 'block');
  w.proof322DragLeaveSequence({ relatedTarget: null });
  test('dragleave (forlader helt): placeholder skjules', placeholderEl.style.display === 'none');

  w.proof322DragOverSequence(fakeDragOver);
  w.proof322MoveToSequence('b1'); // sørg for at b1 rent faktisk er i sekvensen
  var tileInSeq = d.getElementById('proof322-b1');
  w.proof322DragLeaveSequence({ relatedTarget: tileInSeq });
  test('dragleave til en brik INDENI sekvensen: placeholder forbliver synlig', placeholderEl.style.display === 'block');

  w.proof322DragOverSequence(fakeDragOver);
  w.proof322DragEnd();
  test('dragend rydder op: placeholder skjules', placeholderEl.style.display === 'none');
  test('dragend rydder op: proof322DraggedId nulstillet', w.proof322DraggedId === null);

  console.log('\nDrop bruger placeholderens position, ikke det rå event-target');
  w.resetProof322Sequence();
  w.proof322MoveToSequence('b1'); // b1 ligger alene i sekvensen
  // Flyt placeholderen manuelt foran b1 (simulerer at museren hang der under dragover)
  var seqEl = d.getElementById('proof322-sequence');
  var b1El = d.getElementById('proof322-b1');
  placeholderEl.style.display = 'block';
  seqEl.insertBefore(placeholderEl, b1El);
  w.proof322DraggedId = 'b3';
  w.proof322DropOnSequence({ preventDefault: function(){}, dataTransfer: null });
  test('Drop indsætter brikken FØR den brik placeholderen stod foran', w.getProof322Sequence().join(',') === 'b3,b1');
  test('Drop skjuler placeholderen bagefter', placeholderEl.style.display === 'none');

  console.log('\nresetBevis322 — hele Bevis-fanen nulstilles ved genbesøg (men optjent hjerte bevares)');
  w.resetProof322Sequence(); w.opg322BevisDone = false;
  ['b3','b1','b4','b5','b2'].forEach(pid => w.proof322MoveToSequence(pid));
  w.checkProof322();
  test('Bevis fuldført igen: bevis_322 = true', w.loadProgress('bevis_322', false) === true);
  d.querySelectorAll('#page-3-2-2 .tab-btn')[0].click(); // Materiale
  d.querySelectorAll('#page-3-2-2 .tab-btn')[2].click(); // Bevis igen — trigger resetBevis322 via onclick
  test('Genbesøg: Del 2 er skjult igen', d.getElementById('t322-bevis-del2').style.display === 'none');
  test('Genbesøg: sekvensen er nulstillet', w.getProof322Sequence().length === 0);
  test('Genbesøg: alle brikker tilbage i pool', w.proof322Pieces.every(pid => isInPool(pid)));
  test('Genbesøg: ingen brikker markeret correct længere', w.proof322Pieces.every(pid => !proofTile(pid).classList.contains('correct')));
  test('Genbesøg: optjent hjerte-flag i localStorage er BEVARET', w.loadProgress('bevis_322', false) === true);

  console.log('\nF1-kort — hjerte vises KUN for emner i emnerMedBevis, rører intet andet');
  w.showPage('f1');
  const card322 = d.querySelector("[onclick=\"showPage('3-2-2')\"]");
  test('3.2.2-kortet viser hjerte efter fuldført bevis', card322 && card322.innerHTML.includes('❤️'));
  const card311 = d.querySelector("[onclick=\"showPage('3-1-1')\"]");
  test('3.1.1-kortet viser ALDRIG hjerte (ikke i emnerMedBevis)', card311 && !card311.innerHTML.includes('❤️'));
  const card321 = d.querySelector("[onclick=\"showPage('3-2-1')\"]");
  test('3.2.1-kortet viser ALDRIG hjerte (ikke i emnerMedBevis)', card321 && !card321.innerHTML.includes('❤️'));
  test('emnerMedBevis indeholder kun 3.2.2 indtil videre', w.emnerMedBevis.length === 1 && w.emnerMedBevis[0] === '3.2.2');

  // ── 3.2.2 OPGAVER — FORSKRIFT UD FRA TO PUNKTER ─────────────────────────────
  console.log('\nBronze 3.2.2 – h gennem (-1,8) og (4,-2) → h(x)=-2x+6');
  function setVal322(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect322(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  w.showPage('3-2-2');
  d.querySelectorAll('#page-3-2-2 .tab-btn')[3].click(); // Opgaver-fanen
  w.restartOpgaver322(); w.startOpgaver322();
  setVal322('322b1','-2x+6');
  w.checkBronze322();
  test('Bronze: -2x+6 → correct', isCorrect322('322b1'));
  test('Bronze: opg322BronzeDone=true', w.opg322BronzeDone);
  w.restartOpgaver322(); w.startOpgaver322();
  setVal322('322b1','6-2x'); // ækvivalent omskrivning
  w.checkBronze322();
  test('Bronze: ækvivalent formulering (6-2x) → correct', isCorrect322('322b1'));
  w.restartOpgaver322(); w.startOpgaver322();
  setVal322('322b1','-2x+8'); // forkert b
  w.checkBronze322();
  test('Bronze: forkert konstantled → not correct', !isCorrect322('322b1'));
  test('Bronze: forkert → opg322BronzeDone forbliver false', !w.opg322BronzeDone);
  w.restartOpgaver322(); w.startOpgaver322();
  setVal322('322b1','2x+6'); // forkert fortegn på a
  w.checkBronze322();
  test('Bronze: forkert hældning (2x+6) → not correct', !isCorrect322('322b1'));

  console.log('\nSølv 3.2.2 – a=4 gennem (2,-1) → f(x)=4x-9');
  w.restartOpgaver322(); w.opg322Level=2; w.startOpgaver322();
  setVal322('322s1','4x-9');
  w.checkSilver322();
  test('Sølv: 4x-9 → correct', isCorrect322('322s1'));
  test('Sølv: opg322SilverDone=true', w.opg322SilverDone);
  w.restartOpgaver322(); w.opg322Level=2; w.startOpgaver322();
  setVal322('322s1','4*x-9'); // med eksplicit gangetegn
  w.checkSilver322();
  test('Sølv: 4*x-9 (eksplicit gange) → correct', isCorrect322('322s1'));
  w.restartOpgaver322(); w.opg322Level=2; w.startOpgaver322();
  setVal322('322s1','4x+9'); // forkert fortegn på b
  w.checkSilver322();
  test('Sølv: forkert konstantled (4x+9) → not correct', !isCorrect322('322s1'));

  console.log('\nGuld 3.2.2 – g(3)=5, g(-1)=-7 → g(x)=3x-4');
  w.restartOpgaver322(); w.opg322Level=3; w.startOpgaver322();
  setVal322('322g1','3x-4');
  w.checkGold322();
  test('Guld: 3x-4 → correct', isCorrect322('322g1'));
  test('Guld: opg322GoldDone=true', w.opg322GoldDone);
  w.restartOpgaver322(); w.opg322Level=3; w.startOpgaver322();
  setVal322('322g1','-4+3x'); // ækvivalent omskrivning
  w.checkGold322();
  test('Guld: ækvivalent formulering (-4+3x) → correct', isCorrect322('322g1'));
  w.restartOpgaver322(); w.opg322Level=3; w.startOpgaver322();
  setVal322('322g1','3x+4'); // forkert fortegn på b
  w.checkGold322();
  test('Guld: forkert konstantled → not correct', !isCorrect322('322g1'));
  test('Guld: forkert → opg322GoldDone forbliver false', !w.opg322GoldDone);

  console.log('\nFuld 3-niveau medaljeflow 3.2.2');
  w.restartOpgaver322(); w.opg322Level=3; w.startOpgaver322();
  setVal322('322b1','-2x+6'); w.checkBronze322();
  test('Niveau 3: kun bronze færdig → ingen medalje endnu', !w.opg322MedalShown);
  setVal322('322s1','4x-9'); w.checkSilver322();
  test('Niveau 3: bronze+sølv færdig, guld mangler → stadig ingen medalje', !w.opg322MedalShown);
  setVal322('322g1','3x-4'); w.checkGold322();
  test('Niveau 3: alle tre færdige → medalje gemmes', w.opg322MedalShown);
  test('Niveau 3: medal_322 = 3 i localStorage', parseInt(w.loadProgress('medal_322',0)) === 3);

  console.log('\nRestart-flow 3.2.2 opgaver');
  w.restartOpgaver322();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-322').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-322').style.display==='none');
  test('Restart: formel-input nulstillet', d.getElementById('ow-322b1').value==='');
  test('Restart: opgave-widgets skjules', d.getElementById('opg322-low').classList.contains('opgave-hidden'));
  test('Restart: opg322BronzeDone nulstillet', !w.opg322BronzeDone);
  test('Restart: opg322MedalShown nulstillet', !w.opg322MedalShown);
  test('Restart: optjent medalje i localStorage BEVARET', parseInt(w.loadProgress('medal_322',0)) === 3);

  // ── 3.2.3 VÆKSTEGENSKABER ────────────────────────────────────────────────────
  console.log('\nNavigation og struktur 3.2.3 (3 faner — INGEN Bevis-fane)');
  w.showPage('3-2-3');
  test('showPage(3-2-3)', isVisible(d.getElementById('page-3-2-3')));
  test('3 tab-knapper i 3.2.3 (Materiale/Tjekspørgsmål/Opgaver)', d.querySelectorAll('#page-3-2-3 .tab-btn').length === 3);
  test('Ingen Bevis-fane på 3.2.3', d.getElementById('t323-bevis') === null);
  test('3.2.3 i emneData', html.includes("'3.2.3'") && html.includes("'chk-323-bog'"));

  console.log('\nQuiz 3.2.3 – positive tests');
  d.querySelectorAll('#page-3-2-3 .tab-btn')[1].click();
  const q323answers = [1,1,2]; // korrekte options (0-indekseret): B,B,C
  q323answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq323-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.2.3 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.2.3 quiz score: 3/3', d.getElementById('quiz-score-323-title').textContent.includes('3/3'));

  console.log('\nQuiz 3.2.3 – negativ test');
  w.quizRetry323();
  d.querySelectorAll('#page-3-2-3 .tab-btn')[1].click();
  const q323_1b = d.querySelectorAll('#qq323-1 .quiz-option');
  q323_1b[0].click(); // A = wrong
  test('3.2.3 Q1: A → wrong', q323_1b[0].classList.contains('wrong'));
  test('3.2.3 Q1: feedback err', d.getElementById('qf323-1').classList.contains('err'));
  test('3.2.3 Q1: B ikke afsløret', !q323_1b[1].classList.contains('reveal-correct'));

  console.log('\nBronze 3.2.3 – a=4, Δx=5 → Δf=20');
  function setVal323(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect323(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  d.querySelectorAll('#page-3-2-3 .tab-btn')[2].click(); // Opgaver-fanen
  w.restartOpgaver323(); w.startOpgaver323();
  setVal323('323b1','20');
  w.checkBronze323();
  test('Bronze: 20 → correct', isCorrect323('323b1'));
  test('Bronze: opg323BronzeDone=true', w.opg323BronzeDone);
  w.restartOpgaver323(); w.startOpgaver323();
  setVal323('323b1','24'); // reelt forkert
  w.checkBronze323();
  test('Bronze: forkert (24) → not correct', !isCorrect323('323b1'));
  test('Bronze: forkert → opg323BronzeDone forbliver false', !w.opg323BronzeDone);

  console.log('\nSølv 3.2.3 – a=4, Δf=24 → Δx=6');
  w.restartOpgaver323(); w.opg323Level=2; w.startOpgaver323();
  setVal323('323s1','6');
  w.checkSilver323();
  test('Sølv: 6 → correct', isCorrect323('323s1'));
  test('Sølv: opg323SilverDone=true', w.opg323SilverDone);
  w.restartOpgaver323(); w.opg323Level=2; w.startOpgaver323();
  setVal323('323s1','96'); // reelt forkert (gangede i stedet for at dividere)
  w.checkSilver323();
  test('Sølv: forkert (96) → not correct', !isCorrect323('323s1'));

  console.log('\nGuld 3.2.3 – a=4, Δx=10 → Δf=40');
  w.restartOpgaver323(); w.opg323Level=3; w.startOpgaver323();
  setVal323('323g1','40');
  w.checkGold323();
  test('Guld: 40 → correct', isCorrect323('323g1'));
  test('Guld: opg323GoldDone=true', w.opg323GoldDone);
  w.restartOpgaver323(); w.opg323Level=3; w.startOpgaver323();
  setVal323('323g1','14'); // reelt forkert
  w.checkGold323();
  test('Guld: forkert (14) → not correct', !isCorrect323('323g1'));
  test('Guld: forkert → opg323GoldDone forbliver false', !w.opg323GoldDone);

  console.log('\nFuld 3-niveau medaljeflow 3.2.3');
  w.restartOpgaver323(); w.opg323Level=3; w.startOpgaver323();
  setVal323('323b1','20'); w.checkBronze323();
  test('Niveau 3: kun bronze færdig → ingen medalje endnu', !w.opg323MedalShown);
  setVal323('323s1','6'); w.checkSilver323();
  test('Niveau 3: bronze+sølv færdig, guld mangler → stadig ingen medalje', !w.opg323MedalShown);
  setVal323('323g1','40'); w.checkGold323();
  test('Niveau 3: alle tre færdige → medalje gemmes', w.opg323MedalShown);

  console.log('\nRestart-flow 3.2.3');
  w.restartOpgaver323();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-323').style.display==='block');
  test('Restart: restart-btn skjult', d.getElementById('restart-btn-323').style.display==='none');
  test('Restart: input nulstillet', d.getElementById('ow-323b1').value==='');
  test('Restart: opgave-widgets skjules', d.getElementById('opg323-low').classList.contains('opgave-hidden'));
  test('Restart: opg323BronzeDone nulstillet', !w.opg323BronzeDone);
  test('Restart: opg323MedalShown nulstillet', !w.opg323MedalShown);

  // ── 3.2.4 STYKKEVIS LINEÆRE FUNKTIONER ──────────────────────────────────────
  console.log('\nNavigation og struktur 3.2.4 (3 faner — INGEN Bevis-fane)');
  w.showPage('3-2-4');
  test('showPage(3-2-4)', isVisible(d.getElementById('page-3-2-4')));
  test('3 tab-knapper i 3.2.4 (Materiale/Tjekspørgsmål/Opgaver)', d.querySelectorAll('#page-3-2-4 .tab-btn').length === 3);
  test('Ingen Bevis-fane på 3.2.4', d.getElementById('t324-bevis') === null);
  test('3.2.4 i emneData', html.includes("'3.2.4'") && html.includes("'chk-324-bog'"));
  test('2 YouTube-links i materiale', html.includes('_znI8fAP2eA') && html.includes('xNiot-_zy4U'));

  console.log('\nQuiz 3.2.4 – positive tests');
  d.querySelectorAll('#page-3-2-4 .tab-btn')[1].click();
  const q324answers = [1,1,0]; // korrekte options (0-indekseret): B,B,A
  q324answers.forEach((idx,i) => {
    const opts = d.querySelectorAll('#qq324-'+(i+1)+' .quiz-option');
    opts[idx].click();
    test(`3.2.4 Q${i+1}: korrekt svar → correct`, opts[idx].classList.contains('correct'));
  });
  test('3.2.4 quiz score: 3/3', d.getElementById('quiz-score-324-title').textContent.includes('3/3'));

  console.log('\nQuiz 3.2.4 – negativ test');
  w.quizRetry324();
  d.querySelectorAll('#page-3-2-4 .tab-btn')[1].click();
  const q324_1b = d.querySelectorAll('#qq324-1 .quiz-option');
  q324_1b[0].click(); // A = wrong
  test('3.2.4 Q1: A → wrong', q324_1b[0].classList.contains('wrong'));
  test('3.2.4 Q1: feedback err', d.getElementById('qf324-1').classList.contains('err'));
  test('3.2.4 Q1: B ikke afsløret', !q324_1b[1].classList.contains('reveal-correct'));

  // ── 3.2.4 OPGAVER ────────────────────────────────────────────────────────────
  console.log('\nBronze 3.2.4 – stykkevis forskrift (gaffel med formel + ulighed pr. linje)');
  function setVal324(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect324(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  w.showPage('3-2-4');
  d.querySelectorAll('#page-3-2-4 .tab-btn')[2].click(); // Opgaver-fanen
  w.restartOpgaver324(); w.startOpgaver324();
  setVal324('324b-f1','x+2');   setVal324('324b-u1','-10<x<-2');
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');    setVal324('324b-u3','x>1');
  w.checkBronze324();
  test('Bronze: alle 3 formler korrekte', isCorrect324('324b-f1') && isCorrect324('324b-f2') && isCorrect324('324b-f3'));
  test('Bronze: alle 3 uligheder korrekte (eksakte facit)', isCorrect324('324b-u1') && isCorrect324('324b-u2') && isCorrect324('324b-u3'));
  test('Bronze: opg324BronzeDone=true', w.opg324BronzeDone);

  w.restartOpgaver324(); w.startOpgaver324();
  setVal324('324b-f1','x+2');   setVal324('324b-u1','-10<x<-2');
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<=1');  // alternativ ulighed for stykke 2
  setVal324('324b-f3','-2');    setVal324('324b-u3','x>=1');    // alternativ ulighed for stykke 3
  w.checkBronze324();
  test('Bronze: alternativ ulighed stykke 2 (-2<=x<=1) → correct', isCorrect324('324b-u2'));
  test('Bronze: alternativ ulighed stykke 3 (x>=1) → correct', isCorrect324('324b-u3'));
  test('Bronze: begge alternativer samtidig → opg324BronzeDone=true', w.opg324BronzeDone);

  console.log('\nBronze 3.2.4 – negative tests');
  w.restartOpgaver324(); w.startOpgaver324();
  setVal324('324b-f1','x+3');   setVal324('324b-u1','-10<x<-2'); // forkert formel
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');    setVal324('324b-u3','x>1');
  w.checkBronze324();
  test('Bronze: forkert formel stykke 1 → f1 not correct', !isCorrect324('324b-f1'));
  test('Bronze: forkert formel → opg324BronzeDone forbliver false', !w.opg324BronzeDone);
  test('Bronze: de øvrige (korrekte) felter påvirkes ikke', isCorrect324('324b-f2') && isCorrect324('324b-u2'));

  w.restartOpgaver324(); w.startOpgaver324();
  setVal324('324b-f1','x+2');   setVal324('324b-u1','-10<=x<-3'); // forkert ulighed
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');    setVal324('324b-u3','x>1');
  w.checkBronze324();
  test('Bronze: forkert ulighed (grænse) → u1 not correct', !isCorrect324('324b-u1'));
  test('Bronze: formel stadig korrekt uafhængigt af ulighed', isCorrect324('324b-f1'));

  console.log('\nSølv 3.2.4 — klik-baserede endepunkter for stykkevis funktion g(x)');
  var expected324 = [[[-6,-2],[-3,1]], [[-3,7],[0,-2]], [[0,1],[3,1]]];
  function setPoints324(pointsPerPiece){
    w.canvas324Points = pointsPerPiece.map(p=>p.slice());
    w.canvas324PointStates = pointsPerPiece.map(p=>p.map(()=>'aaben'));
    w.canvas324CurrentPiece = 3;
  }

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  const rCurve324 = d.getElementById('ow-r-324-curve');
  setPoints324(expected324); w.opg324CurveDone=false; w.checkCurve324();
  test('Endepunkter: alle 3 stykker korrekt sat → done', w.opg324CurveDone);
  test('Endepunkter: ok-styling', rCurve324 && rCurve324.classList.contains('ok'));
  test('Endepunkter: endepunkt-sektion (åben/lukket) vises', d.getElementById('canvas-324-endpoints-wrap').style.display==='block');

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-6,-2],[-3,1]], [[-3,7],[0,-2]]]); // mangler stykke 3 helt
  w.canvas324Points.push([]);
  w.opg324CurveDone=false; w.checkCurve324();
  test('Endepunkter: mangler et helt linjestykke → ikke done', !w.opg324CurveDone);
  test('Endepunkter: mangler stykke → endepunkt-sektion vises IKKE', d.getElementById('canvas-324-endpoints-wrap').style.display!=='block');

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-6,-2],[-3,1]], [[-3,7],[0,-2]], [[0,5],[3,1]]]); // forkert punkt på stykke 3 (0,5 i stedet for 0,1)
  w.opg324CurveDone=false; w.checkCurve324();
  test('Endepunkter: ét forkert punkt → ikke done', !w.opg324CurveDone);
  test('Endepunkter: forkert punkt → err-styling', rCurve324 && rCurve324.classList.contains('err'));

  console.log('\nEndepunkter må sættes i vilkårlig rækkefølge inden for hvert stykke');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-3,1],[-6,-2]], [[0,-2],[-3,7]], [[3,1],[0,1]]]); // byttet om inden for hvert par
  w.opg324CurveDone=false; w.checkCurve324();
  test('Endepunkter: byttet rækkefølge inden for stykke → stadig done', w.opg324CurveDone);

  console.log('\nTolerance er nu stram (0,3) — kun tæt på men fejlplacerede punkter skal fejle');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-6.6,-2.6],[-3,1]], [[-3,7],[0,-2]], [[0,1],[3,1]]]); // stykke 1 forskudt 0.6 (over tolerance)
  w.opg324CurveDone=false; w.checkCurve324();
  test('Stram tolerance: punkt 0,6 fra facit → ikke done', !w.opg324CurveDone);

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-6.15,-2.15],[-3,1]], [[-3,7],[0,-2]], [[0,1],[3,1]]]); // stykke 1 forskudt kun 0.15 (inden for tolerance)
  w.opg324CurveDone=false; w.checkCurve324();
  test('Stram tolerance: punkt 0,15 fra facit → stadig done', w.opg324CurveDone);

  console.log('\ncanvas324ClickHandler — klik sætter punkter og rykker til næste stykke');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  test('Start: canvas324CurrentPiece = 0', w.canvas324CurrentPiece === 0);
  w.canvas324Points[0].push([-6,-2]);
  test('Efter 1 punkt: stadig på stykke 0', w.canvas324CurrentPiece === 0);
  // Simuler canvas324ClickHandler-logikken direkte via de underliggende funktioner
  w.canvas324Points[0].push([-3,1]);
  if (w.canvas324Points[0].length >= 2) w.canvas324CurrentPiece++;
  test('Efter 2. punkt: rykket til stykke 1', w.canvas324CurrentPiece === 1);

  console.log('\nRigtig klik-handler (canvas324ClickHandler) — ende-til-ende via getBoundingClientRect');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  var canvasEl324 = d.getElementById('canvas-324');
  canvasEl324.getBoundingClientRect = () => ({ left:0, top:0, width:320, height:300 });
  w.canvas324LastPointTime = 0; // sørg for at debounce ikke blokerer denne første test
  // Klik-position for datapunkt (-6,-2): px=((x+7)/11)*320, py=((9-y)/13)*300
  function clickAt324(x,y){
    var px = ((x+7)/11)*320, py = ((9-y)/13)*300;
    w.canvas324ClickHandler({ clientX: px, clientY: py });
  }
  clickAt324(-6,-2);
  test('Ægte klik: punkt registreret i stykke 0', w.canvas324Points[0].length === 1);
  test('Ægte klik: koordinat er korrekt (-6,-2)', w.canvas324Points[0][0][0]===-6 && w.canvas324Points[0][0][1]===-2);
  w.canvas324LastPointTime = 0;
  clickAt324(-3,1);
  test('Ægte klik nr. 2: rykket til stykke 1', w.canvas324CurrentPiece === 1);

  console.log('\nDebounce-værn mod dobbelt-registrering (touchend + synthetic click for samme tryk)');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  canvasEl324.getBoundingClientRect = () => ({ left:0, top:0, width:320, height:300 });
  w.canvas324LastPointTime = 0;
  clickAt324(-6,-2); // første "tryk"
  var pointCountAfterFirst = w.canvas324Points[0].length;
  clickAt324(-6,-2); // simulerer en synthetic click der fyrer LIGE efter (samme fysiske tryk)
  test('Debounce: hurtigt gentaget klik (samme tryk) registreres KUN én gang', w.canvas324Points[0].length === pointCountAfterFirst);
  w.canvas324LastPointTime = 0; // simuler at der er gået tid — nu ægte nyt klik
  clickAt324(-3,1);
  test('Debounce: efter tilstrækkelig tid registreres et NYT klik korrekt', w.canvas324Points[0].length === pointCountAfterFirst + 1);
  test('Debounce: rykket korrekt til stykke 1 efter to ægte klik', w.canvas324CurrentPiece === 1);

  console.log('\nclearCurve324 — rydder alle klikkede punkter');
  setPoints324(expected324);
  w.clearCurve324();
  test('Ryd: alle punktlister er tomme', w.canvas324Points.every(pts => pts.length === 0));
  test('Ryd: canvas324CurrentPiece nulstillet til 0', w.canvas324CurrentPiece === 0);
  test('Ryd: opg324CurveDone nulstillet', !w.opg324CurveDone);

  console.log('\ncheckEndpoints324 — grafisk åben/lukket (klik på punktet selv)');
  function setPointStates324(states){ w.canvas324PointStates = states.map(s=>s.slice()); }

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324(expected324); w.checkCurve324();
  test('Efter korrekt kurve: endepunkt-sektionen vises', d.getElementById('canvas-324-endpoints-wrap').style.display==='block');
  test('Alle punkter starter åbne (default)', w.canvas324PointStates.every(states => states.every(s => s==='aaben')));
  setPointStates324([['aaben','lukket'], ['aaben','lukket'], ['aaben','lukket']]); // xMin-side åben, xMax-side lukket — korrekt for alle 3 stykker
  w.checkEndpoints324();
  test('Alle 6 korrekte (xMin=åben, xMax=lukket) → opg324EndpointsDone=true', w.opg324EndpointsDone);
  test('Endepunkter: ok-styling', d.getElementById('ow-r-324-endpoints').classList.contains('ok'));

  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324(expected324); w.checkCurve324();
  setPointStates324([['lukket','lukket'], ['aaben','lukket'], ['aaben','lukket']]); // stykke 1's venstre ende forkert (skal være åben)
  w.checkEndpoints324();
  test('Ét forkert endepunkt → opg324EndpointsDone forbliver false', !w.opg324EndpointsDone);
  test('Forkert endepunkt → err-styling', d.getElementById('ow-r-324-endpoints').classList.contains('err'));

  console.log('\nEndepunkt-tjek er uafhængigt af klikkerækkefølge (matcher på koordinat, ikke indeks)');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324([[[-3,1],[-6,-2]], [[0,-2],[-3,7]], [[3,1],[0,1]]]); // byttet rækkefølge for alle 3 stykker
  w.checkCurve324();
  setPointStates324([['lukket','aaben'], ['lukket','aaben'], ['lukket','aaben']]); // matcher de BYTTEDE punkters faktiske roller
  w.checkEndpoints324();
  test('Byttet rækkefølge + korrekt matchende tilstande → stadig korrekt', w.opg324EndpointsDone);

  console.log('\ncanvas324ToggleNearestPoint — ægte klik-baseret skift af åben/lukket');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setPoints324(expected324); w.checkCurve324();
  test('Før klik: (-6,-2) er åben', w.canvas324PointStates[0][0] === 'aaben');
  // Klik direkte på punktet (-6,-2) for at skifte det
  var canvasEl324b = d.getElementById('canvas-324');
  canvasEl324b.getBoundingClientRect = () => ({ left:0, top:0, width:320, height:300 });
  function clickAtPoint324(x,y){
    var px = ((x+7)/11)*320, py = ((9-y)/13)*300;
    w.canvas324LastPointTime = 0;
    w.canvas324ClickHandler({ clientX: px, clientY: py });
  }
  clickAtPoint324(-6,-2);
  test('Efter klik på punktet: (-6,-2) er nu lukket', w.canvas324PointStates[0][0] === 'lukket');
  clickAtPoint324(-6,-2);
  test('Klik igen: tilbage til åben (skifter frem og tilbage)', w.canvas324PointStates[0][0] === 'aaben');
  clickAtPoint324(-100,-100); // klik langt fra alle punkter
  test('Klik langt fra ethvert punkt: ingen ændring', w.canvas324PointStates[0][0] === 'aaben');

  console.log('\nMedalje niveau 2 kræver bronze + (kurve OG endepunkter)');
  w.restartOpgaver324(); w.opg324Level=2; w.startOpgaver324();
  setVal324('324b-f1','x+2'); setVal324('324b-u1','-10<x<-2');
  setVal324('324b-f2','-2x'); setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');  setVal324('324b-u3','x>1');
  w.checkBronze324();
  test('Kun bronze → ingen medalje endnu', !w.opg324MedalShown);
  setPoints324(expected324); w.checkCurve324();
  test('Bronze+kurve (men ikke endepunkter) → stadig ingen medalje', !w.opg324MedalShown);
  setPointStates324([['aaben','lukket'], ['aaben','lukket'], ['aaben','lukket']]);
  w.checkEndpoints324();
  test('Bronze+kurve+endepunkter → medalje gemmes', w.opg324MedalShown);

  console.log('\nRestart-flow 3.2.4');
  w.restartOpgaver324();
  test('Restart: ready-btn synlig igen', d.getElementById('ready-btn-wrap-324').style.display==='block');
  test('Restart: canvas324Points tømt', w.canvas324Points.every(pts => pts.length === 0));
  test('Restart: endepunkt-sektion skjult', d.getElementById('canvas-324-endpoints-wrap').style.display==='none');
  test('Restart: alle punkt-tilstande nulstillet (tom)', w.canvas324PointStates.every(states => states.length === 0));
  test('Restart: opg324BronzeDone nulstillet', !w.opg324BronzeDone);
  test('Restart: opg324MedalShown nulstillet', !w.opg324MedalShown);

  console.log('\nGuld 3.2.4 — trinvis beskatning (gaffelforskrift + opfølgende spørgsmål)');
  function setVal324g(id,val){var i=d.getElementById('ow-'+id);if(i)i.value=val;}
  function isCorrect324g(id){var i=d.getElementById('ow-'+id);return i&&i.classList.contains('correct');}
  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324g('324g-f1','0.12x');       setVal324g('324g-u1','0<=x<=60000');
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x<=380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','169400');
  setVal324g('324g-income','443103.45');
  w.checkGold324();
  test('Guld: alle 3 formler korrekte', isCorrect324g('324g-f1') && isCorrect324g('324g-f2') && isCorrect324g('324g-f3'));
  test('Guld: alle 3 uligheder korrekte', isCorrect324g('324g-u1') && isCorrect324g('324g-u2') && isCorrect324g('324g-u3'));
  test('Guld: skat ved 450.000 → correct', isCorrect324g('324g-tax1'));
  test('Guld: indkomst ved 165.400 kr. skat → correct', isCorrect324g('324g-income'));
  test('Guld: opg324GoldDone=true', w.opg324GoldDone);

  console.log('\nGuld 3.2.4 — negative tests');
  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324g('324g-f1','0.14x');       setVal324g('324g-u1','0<=x<=60000'); // forkert skatteprocent
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x<=380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','169400'); setVal324g('324g-income','443103.45');
  w.checkGold324();
  test('Guld: forkert sats i stk. 1 → f1 not correct', !isCorrect324g('324g-f1'));
  test('Guld: forkert sats → opg324GoldDone forbliver false', !w.opg324GoldDone);

  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324g('324g-f1','0.12x');       setVal324g('324g-u1','0<=x<=60000');
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x<=380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','170000'); // forkert skatteberegning
  setVal324g('324g-income','443103.45');
  w.checkGold324();
  test('Guld: forkert skattebeløb → tax1 not correct', !isCorrect324g('324g-tax1'));

  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324g('324g-f1','0.12x');       setVal324g('324g-u1','0<=x<=60000');
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x<=380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','169400');
  setVal324g('324g-income','400000'); // forkert omvendt beregning
  w.checkGold324();
  test('Guld: forkert indkomst-tilbageregning → income not correct', !isCorrect324g('324g-income'));

  console.log('\nFuld 3-niveau medaljeflow 3.2.4 (bronze+sølv+guld)');
  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324('324b-f1','x+2');   setVal324('324b-u1','-10<x<-2');
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');    setVal324('324b-u3','x>1');
  w.checkBronze324();
  test('Niveau 3: kun bronze → ingen medalje endnu', !w.opg324MedalShown);
  setPoints324(expected324); w.checkCurve324();
  setPointStates324([['aaben','lukket'], ['aaben','lukket'], ['aaben','lukket']]);
  w.checkEndpoints324();
  test('Niveau 3: bronze+sølv færdig, guld mangler → stadig ingen medalje', !w.opg324MedalShown);
  setVal324g('324g-f1','0.12x');       setVal324g('324g-u1','0<=x<=60000');
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x<=380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','169400'); setVal324g('324g-income','443103.45');
  w.checkGold324();
  test('Niveau 3: alle tre færdige → medalje gemmes', w.opg324MedalShown);
  test('Niveau 3: medal_324 = 3 i localStorage', parseInt(w.loadProgress('medal_324',0)) === 3);

  console.log('\nulighedReplace — live-konvertering af <= og >= til ≤/≥');
  function fakeInput324(value, cursorPos){ return { value: value, selectionStart: cursorPos, selectionEnd: cursorPos }; }
  var uiInp1 = fakeInput324('0<=x<=1', 7);
  w.ulighedReplace(uiInp1);
  test('ulighedReplace: <= bliver til ≤ (begge forekomster)', uiInp1.value === '0≤x≤1');
  test('ulighedReplace: markør rykkes korrekt til enden', uiInp1.selectionStart === 5);
  var uiInp2 = fakeInput324('60000>=x', 8);
  w.ulighedReplace(uiInp2);
  test('ulighedReplace: >= bliver til ≥', uiInp2.value === '60000≥x');
  var uiInp3 = fakeInput324('ingenting', 3);
  w.ulighedReplace(uiInp3);
  test('ulighedReplace: ingen ændring hvis intet at erstatte', uiInp3.value === 'ingenting');

  console.log('\nFelter med ≤/≥ (efter live-erstatning) tjekkes stadig korrekt');
  w.restartOpgaver324(); w.opg324Level=3; w.startOpgaver324();
  setVal324g('324g-f1','0.12x');       setVal324g('324g-u1','0≤x≤60000'); // simulerer allerede-erstattet visning
  setVal324g('324g-f2','0.38x-15600'); setVal324g('324g-u2','60000<x≤380000');
  setVal324g('324g-f3','0.58x-91600'); setVal324g('324g-u3','x>380000');
  setVal324g('324g-tax1','169400'); setVal324g('324g-income','443103.45');
  w.checkGold324();
  test('Guld med ≤/≥ i felterne → stadig alle korrekte', isCorrect324g('324g-u1') && isCorrect324g('324g-u2'));

  console.log('\nparseInequality324 — omvendt enkeltsidet form (tal først, fx "1<=x" = "x>=1")');
  var exp324b3 = [{lower:1,lowerInclusive:false,upper:Infinity,upperInclusive:false},
                  {lower:1,lowerInclusive:true, upper:Infinity,upperInclusive:false}];
  test('1<=x accepteres som x>=1', w.inequalityMatchesAny324(w.parseInequality324('1<=x'), exp324b3));
  test('1≤x (symbol) accepteres', w.inequalityMatchesAny324(w.parseInequality324('1≤x'), exp324b3));
  test('1<x accepteres som x>1', w.inequalityMatchesAny324(w.parseInequality324('1<x'), exp324b3));
  test('Sammensat form virker stadig upåvirket (-10<=x<-2)', w.inequalityMatchesAny324(w.parseInequality324('-10<x<-2'), [{lower:-10,lowerInclusive:false,upper:-2,upperInclusive:false}]));

  console.log('\nBronze 3.2.4 — omvendt ulighed-form accepteres i det faktiske gaffel-tjek');
  w.restartOpgaver324(); w.startOpgaver324();
  setVal324('324b-f1','x+2');   setVal324('324b-u1','-10<x<-2');
  setVal324('324b-f2','-2x');   setVal324('324b-u2','-2<=x<1');
  setVal324('324b-f3','-2');    setVal324('324b-u3','1<=x'); // omvendt form for x>=1
  w.checkBronze324();
  test('Guld/bronze: omvendt form "1<=x" i felt 3 → correct', isCorrect324('324b-u3'));
  test('Bronze: opg324BronzeDone=true med omvendt form', w.opg324BronzeDone);

  // ── RESULTAT ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultat: ${passed}/${passed+failed} tests bestået`);
  if (failed > 0) process.exit(1);
}, 500);
