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

  // ── RESULTAT ──────────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultat: ${passed}/${passed+failed} tests bestået`);
  if (failed > 0) process.exit(1);
}, 500);
