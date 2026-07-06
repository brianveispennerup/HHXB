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
  w.HTMLCanvasElement.prototype.getContext=()=>({clearRect:()=>{},beginPath:()=>{},arc:()=>{},fill:()=>{},globalAlpha:1,fillStyle:'',canvas:{width:100,height:100}});
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
  test('Q3: A afsløres som korrekt', q3[0].classList.contains('reveal-correct'));
  test('Q3: C ikke afsløret', !q3[2].classList.contains('reveal-correct'));

  // Q4: kun C valgt (forkert)
  w.quizRetry();
  d.querySelectorAll('#page-1-3-1 .tab-btn')[1].click();
  const o4C2 = d.getElementById('o4C');
  o4C2 && o4C2.click();
  d.getElementById('q4-check') && d.getElementById('q4-check').click();
  test('Q4: kun C → feedback err', d.getElementById('qf-4').classList.contains('err'));
  test('Q4: C → wrong', o4C2 && o4C2.classList.contains('wrong'));

  // Q4: A+B korrekt
  w.quizRetry();
  d.querySelectorAll('#page-1-3-1 .tab-btn')[1].click();
  d.getElementById('o4A') && d.getElementById('o4A').click();
  d.getElementById('o4B') && d.getElementById('o4B').click();
  d.getElementById('q4-check') && d.getElementById('q4-check').click();
  test('Q4: A+B → feedback ok', d.getElementById('qf-4').classList.contains('ok'));
  test('Q4: A reveal-correct', d.getElementById('o4A') && d.getElementById('o4A').classList.contains('reveal-correct'));
  test('Q4: B reveal-correct', d.getElementById('o4B') && d.getElementById('o4B').classList.contains('reveal-correct'));

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
  test('3.1.1 Q1: B afsløres', q311_1b[1].classList.contains('reveal-correct'));
  test('3.1.1 Q1: A ikke afsløret', !q311_1b[0].classList.contains('reveal-correct'));

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
  test('3.1.2 Q1: B afsløres', q312_1b[1].classList.contains('reveal-correct'));
  test('3.1.2 Q1: C ikke afsløret', !q312_1b[2].classList.contains('reveal-correct'));
  const q312_3b = d.querySelectorAll('#qq312-3 .quiz-option');
  q312_3b[2].click(); // C = wrong
  test('3.1.2 Q3: C → wrong', q312_3b[2].classList.contains('wrong'));
  test('3.1.2 Q3: B afsløres', q312_3b[1].classList.contains('reveal-correct'));

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

  // ── RESULTAT ──────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultat: ${passed}/${passed+failed} tests bestået`);
  if (failed > 0) process.exit(1);
}, 500);
