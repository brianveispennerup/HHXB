const { JSDOM } = require('/tmp/node_modules/jsdom');
const fs = require('fs');
const html = fs.readFileSync('/mnt/user-data/outputs/hhx-matematik-v4.html', 'utf8');

let p=0,f=0;
function test(n,c,d){if(c){console.log('  PASS ',n);p++;}else{console.log('  FAIL ',n,d?'— '+d:'');f++;}}
function isVisible(el){return el&&!el.classList.contains('page-hidden')&&el.style.display!=='none';}

const storage={_data:{},getItem(k){return this._data[k]||null;},setItem(k,v){this._data[k]=v;},removeItem(k){delete this._data[k];}};
const dom=new JSDOM(html,{runScripts:'dangerously',beforeParse(w){
  Object.defineProperty(w,'localStorage',{value:storage});
  w.requestAnimationFrame=(cb)=>setTimeout(cb,0);
  w.scrollTo=()=>{};
}});

const w = dom.window;
let d;

setTimeout(()=>{
  d = w.document;

  // ── CSS ───────────────────────────────────────────────────────────────────
  console.log('\nCSS og HTML grundstruktur');
  console.log('-------------------------');
  test('page-hidden CSS regel findes', html.includes('.page-hidden { display: none !important; }'));
  test('opgave-hidden CSS regel findes', html.includes('.opgave-hidden { display: none !important; }'));
  test('page-f1 starter med page-hidden', html.includes('id="page-f1" class="page-hidden"'));
  test('page-home starter uden page-hidden', !html.includes('id="page-home" class="page-hidden"'));

  // ── NAVIGATION ────────────────────────────────────────────────────────────
  console.log('\nNavigation');
  console.log('----------');
  test('Forside synlig ved start', isVisible(d.getElementById('page-home')));
  ['home','f1','fremgang','1-3-1','3-1-1'].forEach(id => {
    w.showPage(id);
    test(`showPage('${id}') virker`, isVisible(d.getElementById('page-'+id)));
  });

  // ── FREMGANG KORT ─────────────────────────────────────────────────────────
  console.log('\nFremgang navigation');
  console.log('-------------------');
  storage._data = {'hhxb_fremgang': JSON.stringify({'opg_1a':true,'medal_131':1})};
  w.showPage('fremgang');
  w.updateFremgang();
  const cards = d.querySelectorAll('[data-slug]');
  test('Fremgang kort med data-slug', cards.length > 0);
  if (cards.length > 0) {
    const slug = cards[0].dataset.slug;
    test('Slug er 1-3-1', slug === '1-3-1', `fandt: ${slug}`);
    cards[0].click();
    test('Klik på fremgang-kort navigerer til 1-3-1', isVisible(d.getElementById('page-1-3-1')));
  }

  // ── NÆSTE EMNE ────────────────────────────────────────────────────────────
  console.log('----------');
  storage._data = {};
  w.updateFremgang();
  storage._data = {'hhxb_fremgang': JSON.stringify({'medal_131':1})};
  w.updateFremgang();

  // ── TJEKSPØRGSMÅL ─────────────────────────────────────────────────────────
  console.log('\nTjekspørgsmål fane');
  console.log('------------------');
  w.showPage('1-3-1');
  const tabs = d.querySelectorAll('#page-1-3-1 .tab-btn');
  test('3 faner i 1-3-1', tabs.length === 3, `fandt ${tabs.length}`);
  const tabTexts = Array.from(tabs).map(t => t.textContent.trim());
  test('Rækkefølge: Materiale, Tjekspørgsmål, Opgaver',
    tabTexts[0]==='Materiale' && tabTexts[1].includes('Tjek') && tabTexts[2]==='Opgaver',
    JSON.stringify(tabTexts));
  const quizPanel = d.getElementById('t131-quiz');
  test('Quiz panel eksisterer', !!quizPanel);
  test('4 spørgsmål i quiz', quizPanel && quizPanel.querySelectorAll('.quiz-question').length===4, 
    quizPanel ? `fandt ${quizPanel.querySelectorAll('.quiz-question').length}` : 'panel mangler');
  tabs[1] && tabs[1].click();
  test('Quiz panel aktivt efter klik', quizPanel && quizPanel.classList.contains('active'));
  test('Materiale panel inaktivt efter klik', !d.getElementById('t131-mat').classList.contains('active'));
  const q1opts = d.querySelectorAll('#qq-1 .quiz-option');
  test('Q1 har 3 svarmuligheder', q1opts.length===3, `fandt ${q1opts.length}`);
  const q4opts = d.querySelectorAll('#qq-4 .quiz-option');
  test('Q4 har 3 svarmuligheder (flervalg)', q4opts.length===3);
  test('Tjek svar knap til Q4 findes', !!d.getElementById('q4-check'));

  // ── RESULTAT ──────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(40)}`);
  console.log(`Resultat: ${p}/${p+f} tests bestået`);
  if (f>0) process.exit(1);
}, 500);

// Test: Quiz Q4 multi-select functionality
setTimeout(() => {
  console.log('\nQuiz Q4 multi-select struktur');
  console.log('------------------------------');
  dom.window.showPage('1-3-1');
  
  // Click Tjekspørgsmål tab
  const tabs = d.querySelectorAll('#page-1-3-1 .tab-btn');
  tabs[1] && tabs[1].click();
  
  // Check Q4 structure
  const q4 = d.getElementById('qq-4');
  test('Q4 eksisterer', !!q4);
  test('Q4 har flervalg note', q4 && q4.querySelector('.quiz-q-note') !== null);
  test('Q4 har Tjek svar knap', !!d.getElementById('q4-check'));
  
  const o4A = d.getElementById('o4A');
  const o4B = d.getElementById('o4B');
  const o4C = d.getElementById('o4C');
  test('Q4 option A eksisterer', !!o4A);
  test('Q4 option B eksisterer', !!o4B);
  test('Q4 option C eksisterer', !!o4C);
  
  // Check mbox checkboxes
  test('Q4 option A har .mbox', o4A && o4A.querySelector('.mbox') !== null);
  test('Q4 option B har .mbox', o4B && o4B.querySelector('.mbox') !== null);
  test('Q4 option C har .mbox', o4C && o4C.querySelector('.mbox') !== null);
  
  // Test correct/wrong reveal after checkMulti4
  // Select A and B (correct)
  o4A && o4A.click();
  o4B && o4B.click();
  const chk = d.getElementById('q4-check');
  chk && chk.click();
  
  test('Q4 A markeres som korrekt', o4A && (o4A.classList.contains('reveal-correct') || o4A.classList.contains('correct')));
  test('Q4 B markeres som korrekt', o4B && (o4B.classList.contains('reveal-correct') || o4B.classList.contains('correct')));
  test('Q4 C markeres ikke som korrekt', o4C && !o4C.classList.contains('reveal-correct'));
  
  const fb4 = d.getElementById('qf-4');
  test('Q4 feedback vises', fb4 && fb4.classList.contains('show'));
  test('Q4 feedback er korrekt (ok)', fb4 && fb4.classList.contains('ok'));
  
  console.log(`\n${'='.repeat(40)}\nResultat: ${passed}/${passed+failed} tests bestået`);
  if (failed > 0) process.exit(1);
}, 2000);
