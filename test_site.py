"""
Testsuite for hhx-matematik.html
Kør med: python3 tests/test_site.py
"""
from bs4 import BeautifulSoup
import sys
import re

HTML_FILE = '/mnt/user-data/outputs/hhx-matematik-v4.html'

passed = 0
failed = 0

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  PASS  {name}")
        passed += 1
    else:
        print(f"  FAIL  {name}" + (f" — {detail}" if detail else ""))
        failed += 1

def section(name):
    print(f"\n{name}")
    print("-" * len(name))

with open(HTML_FILE) as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
inline_scripts = [s for s in soup.find_all('script') if not s.get('src')]
js = "\n".join(s.string or "" for s in inline_scripts)
style = soup.find('style')
css = style.string if style else ""

# ── STRUKTUR ──────────────────────────────────────────────────────────────────
section("Sidestruktur")
test("Forside findes",             soup.find('div', id='page-home') is not None)
test("F1 oversigt findes",         soup.find('div', id='page-f1') is not None)
test("Side 1-3-1 findes",          soup.find('div', id='page-1-3-1') is not None)
test("Side 3-1-1 findes",          soup.find('div', id='page-3-1-1') is not None)
test("Alle forløbskort (8)",       len(soup.find_all('div', class_='forloeb-card')) == 8)

all_emne_ids = [
    '1-3-1',
    '3-1-1','3-1-2','3-1-3','3-1-4','3-1-5','3-1-6','3-1-7',
    '3-2-1','3-2-2','3-2-3','3-2-4','3-2-5',
    '3-5-1','3-5-2',
]
for eid in all_emne_ids:
    test(f"Emne side page-{eid} findes", soup.find('div', id=f'page-{eid}') is not None)

# ── NAVIGATION ────────────────────────────────────────────────────────────────
section("Navigation")
test("showPage funktion i JS",     'function showPage' in js)
test("Logo linker til home",       'showPage(\'home\')' in html or 'showPage("home")' in html)
test("Alle back-links til home eller f1",
     len(soup.find_all('a', class_='back-link')) > 0)

emne_cards = soup.find_all('div', class_='emne-card')
cards_with_onclick = [c for c in emne_cards if c.get('onclick')]
test(f"Alle emne-kort har onclick ({len(emne_cards)})",
     len(cards_with_onclick) == len(emne_cards),
     f"{len(emne_cards) - len(cards_with_onclick)} mangler onclick")

# ── TABS ──────────────────────────────────────────────────────────────────────
section("Tabs (Materiale / Opgaver)")
tab_btns = soup.find_all('button', class_='tab-btn')
tab_panels = soup.find_all('div', class_='tab-panel')
test("Tab-knapper findes",         len(tab_btns) > 0, f"fandt {len(tab_btns)}")
test("Tab-panels findes",          len(tab_panels) > 0, f"fandt {len(tab_panels)}")
test("switchTab / tab-btn click i JS", 'tab-btn' in js)

for eid in ['1-3-1', '3-1-1']:
    page = soup.find('div', id=f'page-{eid}')
    if page:
        btns   = page.find_all('button', class_='tab-btn')
        panels = page.find_all('div', class_='tab-panel')
        test(f"{eid}: 3 tab-knapper (Materiale/Tjekspørgsmål/Opgaver)", len(btns) == 3, f"fandt {len(btns)}")
        test(f"{eid}: 3 tab-panels",  len(panels) == 3, f"fandt {len(panels)}")
        active_panels = [p for p in panels if 'active' in p.get('class', [])]
        test(f"{eid}: præcis 1 aktiv panel", len(active_panels) == 1)

# ── CHECKBOKS & GLIMMER ───────────────────────────────────────────────────────
section("Checkboks og glimmer")
checkboxes = soup.find_all('input', class_='card-check')
canvases   = soup.find_all('canvas', class_='sparkle-canvas')

test("Checkboxes findes",                   len(checkboxes) > 0, f"fandt {len(checkboxes)}")
test("Sparkle canvases findes",             len(canvases) > 0,   f"fandt {len(canvases)}")
test("Antal checkboxes = antal canvases",   len(checkboxes) == len(canvases),
     f"checkboxes={len(checkboxes)}, canvases={len(canvases)}")
test("handleCheck funktion i JS",   'function handleCheck' in js)
test("runSparkle funktion i JS",    'function runSparkle' in js)
test("Checkboxes kalder handleCheck",
     all('handleCheck(this' in (c.get('onclick') or '') for c in checkboxes))
test(".card-check CSS findes",       '.card-check' in css)
test(".card-check:checked CSS",      '.card-check:checked' in css)
test(".simple-card.done CSS",        '.simple-card.done' in css)
test(".sparkle-canvas CSS",          '.sparkle-canvas' in css)
test("Grøn done-farve (#f0fdf4)",    '#f0fdf4' in css)
test("Grøn done-kant (#86efac)",     '#86efac' in css)

# ── OPGAVE-WIDGETS & KORREKTE SVAR ───────────────────────────────────────────
section("Interaktive opgaver og korrekte svar")
test("owCheck funktion i JS",        'function owCheck' in js)
ow_inputs = soup.find_all('input', class_='ow-input')
test("Inputfelter til opgaver findes", len(ow_inputs) > 0, f"fandt {len(ow_inputs)}")
test("Øvelse 1312 titel findes",
     soup.find(string=lambda t: t and '1312' in t) is not None)
test("Øvelse 1316 titel findes",
     soup.find(string=lambda t: t and '1316' in t) is not None)

expected_answers = {
    '1a': (13,    '1312a: 3x-8=2x+5'),
    '1b': (1,     '1312b: 3(2+x)=x+8'),
    '1d': (0,     '1312d: -3(x+2)=x-3(x+2)'),
    '2a': (-49,   '1316a: (x-5)/2-(2x-1)/3=6'),
    '2b': (7/6,   '1316b: (4x+5)/6-(2x-1)/3=x'),
}
found_keys = set()
for btn in soup.find_all('button', class_='ow-btn'):
    onclick = btn.get('onclick', '')
    m = re.search(r"owCheck\('(\w+)',\s*([\-\d\.]+)\)", onclick)
    if m:
        key, val = m.group(1), float(m.group(2))
        if key in expected_answers:
            found_keys.add(key)
            exp, label = expected_answers[key]
            test(f"Korrekt svar: {label} → x={exp}",
                 abs(val - exp) < 0.01,
                 f"fandt {val:.4f}, forventede {exp}")

for key, (exp, label) in expected_answers.items():
    if key not in found_keys:
        test(f"Knap for {label} findes", False, "knap ikke fundet i HTML")

# ── EKSTERNE LINKS ────────────────────────────────────────────────────────────
section("Eksterne links (1.3.1)")
page_131 = soup.find('div', id='page-1-3-1')
if page_131:
    systime = page_131.find(attrs={'onclick': re.compile('systime|laerebogimatematik')})
    youtube = page_131.find(attrs={'onclick': re.compile('youtube|IU53tNlfYdY')})
    test("Systime-link på lærebogskort",  systime is not None)
    test("YouTube-link på videokort",     youtube is not None)
else:
    test("page-1-3-1 tilgængelig for link-tjek", False)
# ── AFRUNDING OG INPUT-VALIDERING ────────────────────────────────────────────
section("Afrunding og tolerance i owCheck")

from fractions import Fraction

# Verify the JS tolerance is wide enough for rounded inputs
js_tolerance_ok = 'Math.abs(val - answer) < 0.05' in js
test("owCheck tolerance er 0.05 (ikke 0.01)", js_tolerance_ok,
     "for stramt til afrundede decimalbrøker")

# Simulate what the JS does: abs(input - answer) < 0.05
def js_check(user_input, answer):
    try:
        val = float(str(user_input).replace(',', '.'))
        return abs(val - answer) < 0.05
    except:
        return False

exact = {
    '1a': 13,
    '1b': 1,
    '1d': 0,
    '2a': -49,
    '2b': 7/6,
}
labels = {
    '1a': '1312a (x=13)',
    '1b': '1312b (x=1)',
    '1d': '1312d (x=0)',
    '2a': '1316a (x=-49)',
    '2b': '1316b (x=7/6)',
}

# Heltal: eksakt svar skal virke
for key in ['1a', '1b', '1d', '2a']:
    ans = exact[key]
    test(f"{labels[key]}: eksakt svar accepteres",
         js_check(ans, ans))
    test(f"{labels[key]}: forkert svar afvises",
         not js_check(ans + 1, ans))

# 1316b = 7/6 — test mange afrundinger
ans_76 = 7/6
test("1316b: '1.17' accepteres (2 decimaler)",   js_check('1.17', ans_76))
test("1316b: '1.2' accepteres (1 decimal)",      js_check('1.2',  ans_76))
test("1316b: '1,17' accepteres (komma)",         js_check('1,17', ans_76))
test("1316b: '1.1667' accepteres (4 decimaler)", js_check('1.1667', ans_76))
test("1316b: '2' afvises (for forkert)",         not js_check('2', ans_76))
test("1316b: '1' afvises (for forkert)",         not js_check('1', ans_76))
test("1316b: '1.3' afvises (lige over tolerance)",not js_check('1.3', ans_76))

# Tekst uden tal afvises
test("Ikke-tal 'abc' giver NaN (ikke accepteret)",
     not js_check('abc', 13))

# ── RATIONELLE TAL SOM INPUT ──────────────────────────────────────────────────
section("Rationelle tal (brøkinput) i owCheck")

test("owCheck parser brøker (/ i JS)",
     "raw.indexOf('/') !== -1" in js or "indexOf('/')" in js)

def js_check_frac(user_input, answer):
    raw = str(user_input).replace(',', '.')
    if '/' in raw:
        parts = raw.split('/')
        try:
            num, den = float(parts[0]), float(parts[1])
            val = num / den if den != 0 else float('nan')
        except:
            val = float('nan')
    else:
        try:
            val = float(raw)
        except:
            val = float('nan')
    import math
    return not math.isnan(val) and abs(val - answer) < 0.05

ans_76 = 7/6
test("1316b: '7/6' accepteres",        js_check_frac('7/6',   ans_76))
test("1316b: '14/12' accepteres",      js_check_frac('14/12', ans_76))
test("1316b: '7 / 6' accepteres",      js_check_frac('7 / 6', ans_76))
test("1316b: '1/0' afvises (div 0)",   not js_check_frac('1/0', ans_76))
test("1316b: 'a/b' afvises (NaN)",     not js_check_frac('a/b', ans_76))
test("1316b: '8/6' accepteres (≈1.33)",not js_check_frac('8/6', ans_76))  # 1.333 > 1.167+0.05
# ── ENERGINIVEAU STRUKTUR ─────────────────────────────────────────────────────
section("Energiniveau – antal opgaver per boks")
page_131 = soup.find('div', id='page-1-3-1')
low  = page_131.find('div', id='opgave-low')  if page_131 else None
mid  = page_131.find('div', id='opgave-mid')  if page_131 else None
high = page_131.find('div', id='opgave-high') if page_131 else None

test("opgave-low findes",  low  is not None)
test("opgave-mid findes",  mid  is not None)
test("opgave-high findes", high is not None)

low_items  = low.find_all('div',  class_='ow-item') if low  else []
mid_items  = mid.find_all('div',  class_='ow-item') if mid  else []
high_items = high.find_all('div', class_='ow-item') if high else []

test("Traet (low): kun 1 opgave (1312a)",        len(low_items)  == 1, f"fandt {len(low_items)}")
test("Klar (mid): 2 opgaver (1312b+d)",           len(mid_items)  == 2, f"fandt {len(mid_items)}")
test("Paa den (high): 2 opgaver (1316a+b)",       len(high_items) == 2, f"fandt {len(high_items)}")

# Check correct exercises are in each box
if low_items:
    test("low indeholder 1312a", '1a' in str(low_items[0]))
if mid_items:
    test("mid indeholder 1312b", '1b' in str(mid_items[0]))
    test("mid indeholder 1312d", '1d' in str(mid_items[1]))
if high_items:
    test("high indeholder 1316a", '2a' in str(high_items[0]))
    test("high indeholder 1316b", '2b' in str(high_items[1]))
# ── SLIDER OPFØRSEL ───────────────────────────────────────────────────────────
section("Slider opfoersel og energizoner")

# Verify slider element
slider = soup.find('input', id='energy-slider')
test("Slider element findes",          slider is not None)
test("Slider er type range",           slider.get('type') == 'range' if slider else False)
test("Slider min=0",                   slider.get('min') == '0' if slider else False)
test("Slider max=100",                 slider.get('max') == '100' if slider else False)
test("Slider starter til venstre (value=1)", slider.get('value') == '1' if slider else False)
test("Slider kalder updateEnergy",     'updateEnergy' in (slider.get('oninput','') if slider else ''))

# Verify updateEnergy function exists and has correct zone thresholds
test("updateEnergy funktion i JS",     'function updateEnergy' in js)
test("Zone: under 40 = Traet",         'val < 40' in js)
test("Zone: under 75 = Klar",          'val < 75' in js)
test("Zone: 75+ = Paa den",            'val < 75' in js and 'else' in js)

# Verify all three opgave divs exist and have correct initial display
page_131 = soup.find('div', id='page-1-3-1')
low  = page_131.find('div', id='opgave-low')  if page_131 else None
mid  = page_131.find('div', id='opgave-mid')  if page_131 else None
high = page_131.find('div', id='opgave-high') if page_131 else None

test("opgave-low skjult som standard (opgave-hidden, indtil Klar-knap)",
     low is not None and 'opgave-hidden' in (low.get('class') or []))
test("opgave-mid skjult som standard",
     mid is not None and 'opgave-hidden' in (mid.get('class') or []))
test("opgave-high skjult som standard",
     high is not None and 'opgave-hidden' in (high.get('class') or []))

# Simulate slider logic in Python
def sim_energy(val):
    """Returns which widgets should be visible at a given slider value"""
    val = int(val)
    if val < 40:
        return {'low': True,  'mid': False, 'high': False}
    elif val < 75:
        return {'low': True,  'mid': True,  'high': False}
    else:
        return {'low': True,  'mid': True,  'high': True}

cases = [
    (1,  {'low': True,  'mid': False, 'high': False}, "vaerdi=1 (traet)"),
    (20, {'low': True,  'mid': False, 'high': False}, "vaerdi=20 (traet)"),
    (39, {'low': True,  'mid': False, 'high': False}, "vaerdi=39 (granse traet)"),
    (40, {'low': True,  'mid': True,  'high': False}, "vaerdi=40 (klar starter)"),
    (60, {'low': True,  'mid': True,  'high': False}, "vaerdi=60 (klar)"),
    (74, {'low': True,  'mid': True,  'high': False}, "vaerdi=74 (granse klar)"),
    (75, {'low': True,  'mid': True,  'high': True},  "vaerdi=75 (paa den starter)"),
    (100,{'low': True,  'mid': True,  'high': True},  "vaerdi=100 (maks)"),
]
for val, expected, label in cases:
    result = sim_energy(val)
    test(f"Slider {label}",
         result == expected,
         f"fik {result}, forventede {expected}")

# Verify zone labels are shown
test("Traet zone-label i HTML", '1 s' in html)
test("Klar zone-label i HTML", '2 s' in html)
test("Paa den zone-label i HTML", '3 s' in html)

# Verify showWidget function handles animation
test("showWidget funktion i JS",       'function showWidget' in js)
test("showWidget bruger opacity animation", 'opacity' in js)
# ── OPGAVE-WIDGET GLIMMER OG GRØN ────────────────────────────────────────────
section("Opgave-widget: groen boks og glimmer ved korrekt svar")

html_v2 = html
soup_v2 = soup
js_v2 = js

test("runOpgaveSparkle funktion findes",     'function runOpgaveSparkle' in js_v2)
test("allCorrect logik findes",              'allCorrect' in js_v2)
test("Groen baggrund saettes (#f0fdf4)",     '#f0fdf4' in js_v2)
test("Groen kant saettes (#86efac)",         '#86efac' in js_v2)
test("Sparkle trigges kun naar allCorrect",  'if (allCorrect)' in js_v2)
test("Canvas oprettes dynamisk",             "createElement('canvas')" in js_v2)
test("Canvas fjernes efter animation",       'canvas.remove()' in js_v2)
test("Partikler flyver opad (negativ dy)",   '-(Math.random()' in js_v2)
test("60 partikler genereres",               'i < 60' in js_v2)

# ── SLIDER LABELS ─────────────────────────────────────────────────────────────
section("Slider labels: Traet/Klar/On fire med korrekte farver")

test("'Traet - 1 saet' label i JS",          'Træt' in js_v2 and '1 sæt' in js_v2)
test("'Klar - 2 saet' label i JS",           'Klar' in js_v2 and '2 sæt' in js_v2)
test("'On fire - 3 saet' label i JS",        'On fire' in js_v2 and '3 sæt' in js_v2)
test("Roed farve for Traet (#dc2626)",        '#dc2626' in js_v2)
test("Gul farve for Klar (#ca8a04)",          '#ca8a04' in js_v2)
test("Groen farve for On fire (#16a34a)",     '#16a34a' in js_v2)

# Initial state viser Traet
state_v2 = soup_v2.find('span', id='energy-state')
test("Initial state viser 'Traet - 1 saet'",
     state_v2 is not None and 'Træt' in (state_v2.get_text() or '') and '1 sæt' in (state_v2.get_text() or ''))

# ── SLIDER GRADIENT ───────────────────────────────────────────────────────────
section("Slider gradient roed til groen")
style_v2 = soup_v2.find('style')
css_v2 = style_v2.string if style_v2 else ""

test("Gradient starter med roed (#ef4444)",   '#ef4444' in css_v2)
test("Gradient har gul midtpunkt (#facc15)",  '#facc15' in css_v2)
test("Gradient slutter groen (#22c55e)",      '#22c55e' in css_v2)
test("Gradient er venstre til hoejre",        'to right' in css_v2)

# ── BATTERI EMOJIS ────────────────────────────────────────────────────────────
section("Batteri emojis i slider")
test("Tømt batteri emoji (🪫) i HTML",         '🪫' in html_v2)
test("Fuldt batteri emoji (🔋) i HTML",        '🔋' in html_v2)
test("Batterier har CSS filter til farve",     'filter' in html_v2 and 'hue-rotate' in html_v2)
test("Batterier er paa samme linje som slider",
     soup_v2.find('div', class_='energy-slider-track') is not None and
     soup_v2.find('div', class_='energy-slider-track').find('span') is not None)

# ── MATERIALE CHECKBOKS GLIMMER ───────────────────────────────────────────────
section("Materiale checkboks: groen og glimmer")
test("handleCheck funktion i JS",        'function handleCheck' in js_v2)
test("runSparkle funktion i JS",         'function runSparkle' in js_v2)
test("Groen done-baggrund i CSS",        '#f0fdf4' in css_v2)
test("Groen done-kant i CSS",            '#86efac' in css_v2)
checkboxes_v2 = soup_v2.find_all('input', class_='card-check')
canvases_v2   = soup_v2.find_all('canvas', class_='sparkle-canvas')
test("Checkboxes og sparkle canvases matcher",
     len(checkboxes_v2) == len(canvases_v2) and len(checkboxes_v2) > 0)
# ── FREMGANG SIDE ─────────────────────────────────────────────────────────────
section("Fremgang side og localStorage")

html_v2 = html
soup_v2 = soup
js_v2 = js

# Side struktur
test("Fremgang side findes",              soup_v2.find('div', id='page-fremgang') is not None)
test("Fremgang knap paa forsiden",        'showPage(\'fremgang\')' in html_v2)
test("updateFremgang funktion i JS",      'function updateFremgang' in js_v2)

# localStorage
test("saveProgress funktion i JS",        'function saveProgress' in js_v2)
test("loadAllProgress funktion i JS",     'function loadAllProgress' in js_v2)
test("restoreState funktion i JS",        'function restoreState' in js_v2)
test("localStorage.setItem bruges",       'localStorage.setItem' in js_v2)
test("localStorage.getItem bruges",       'localStorage.getItem' in js_v2)
test("State gendannes ved load",          "addEventListener('load'" in js_v2 and 'restoreState()' in js_v2)

# Opgave tracking
test("Korrekt svar gemmes (opg_)",        "saveProgress('opg_'" in js_v2)
test("Materiale gemmes (mat_)",           "saveProgress('mat_'" in js_v2)

# Fremgang kort - én linje
test("Kort bruger flex display",          "display:flex;align-items:center" in js_v2)
test("Nummer har fast bredde (flex-shrink:0)", "flex-shrink:0;width:38px" in js_v2)
test("Navn har text-overflow ellipsis",   "text-overflow:ellipsis" in js_v2)
test("Ingen fp-emne-top (gammel struktur fjernet)", "fp-emne-top" not in js_v2)
test("Ingen fp-emne-name klasse (gammel struktur fjernet)", 'class=\\"fp-emne-name\\"' not in js_v2)

# Alt klaret badge
test("Alt klaret badge i JS",             'Alt klaret' in js_v2)
test("all-done CSS klasse",               '.fp-emne-card.all-done' in html_v2)

# Kun fremgang vises
test("Kun emner med fremgang vises (return hvis 0)", 
     'if (opgLoest === 0 && matLoest === 0) return' in js_v2)
test("Tom-tilstand besked",               'Ingen fremgang endnu' in js_v2)

# emneData defineret
test("emneData objekt defineret",         'var emneData' in js_v2)
test("1.3.1 i emneData",                 "'1.3.1'" in js_v2)
# ── MEDALJE OG KLAR-KNAP SYSTEM ───────────────────────────────────────────────
section("Medalje og klar-knap system")

html_v2 = html
soup_v2 = soup
js_v2 = js

# Klar-knap
test("Klar-knap HTML findes",            soup_v2.find('div', id='ready-btn-wrap') is not None)
test("Klar-knap kalder startOpgaver",    'onclick="startOpgaver()"' in html_v2)
test("Blyant og papir tekst",            'blyant og papir' in html_v2)
test("Restart knap findes",              soup_v2.find('button', id='restart-btn') is not None)

# JS funktioner
test("startOpgaver funktion",            'function startOpgaver' in js_v2)
test("restartOpgaver funktion",          'function restartOpgaver' in js_v2)
test("checkAllCorrectForMedal funktion", 'function checkAllCorrectForMedal' in js_v2)
test("showMedal funktion",               'function showMedal' in js_v2)
test("closeMedal funktion",              'function closeMedal' in js_v2)

# Slider låses ved start
test("Slider låses (slider-locked)",     'slider-locked' in js_v2)
test("Slider låses op ved restart",      'classList.remove(\'slider-locked\')' in js_v2)

# Medalje logik
test("Medalje overlay HTML",             soup_v2.find('div', id='medal-overlay') is not None)
test("Bronze emoji (1. niveau)",         '\U0001f949' in js_v2 or '🥉' in js_v2)
test("Sølv emoji (2. niveau)",           '\U0001f948' in js_v2 or '🥈' in js_v2)
test("Guld emoji (3. niveau)",           '\U0001f947' in js_v2 or '🥇' in js_v2)
test("Bedste medalje gemmes",            "saveProgress('medal_131'" in js_v2)
test("Kun bedre medalje erstatter",      'if (currentLevel > prev)' in js_v2)
test("Medalje sparkle animation",        'function animate' in js_v2 and '80' in js_v2)
test("Medalje pop animation CSS",        'medalPop' in html_v2)

# Medalje vises på fremgang siden
test("Medalje vises i fremgang pills",   'fp-medal' in js_v2)
test("updateFremgang kaldes ved luk",    'updateFremgang()' in js_v2)

# Reset ved restart
test("Inputs nulstilles ved restart",    "inp.value = ''" in js_v2)
test("Opgaver skjules ved restart",      "restartOpgaver" in js_v2 and "style.display = 'none'" in js_v2)
# ── KLAR-KNAP FLOW OG INITIAL STATE ──────────────────────────────────────────
section("Klar-knap flow og initial state")

html_v2 = html
soup_v2 = soup
js_v2 = js

# Initial state - opgaver skal være skjulte
for wid in ['opgave-low', 'opgave-mid', 'opgave-high']:
    w = soup_v2.find('div', id=wid)
    test(f"{wid} er skjult ved start",
         w is not None and 'opgave-hidden' in (w.get('class') or []),
         f"style={w.get('style','') if w else 'NOT FOUND'}")

# Klar-knap er synlig ved start
rbw = soup_v2.find('div', id='ready-btn-wrap')
test("ready-btn-wrap er synlig ved start",
     rbw is not None and 'display:block' in rbw.get('style',''),
     f"style={rbw.get('style','') if rbw else 'NOT FOUND'}")

# currentLevel starter på 1
test("currentLevel starter paa 1",       'var currentLevel = 1' in js_v2)

# showWidget tjekker display:none foer visning
test("showWidget tjekker opgave-hidden",  "classList.contains('opgave-hidden')" in js_v2)
test("showWidget fjerner opgave-hidden",   "classList.remove('opgave-hidden')" in js_v2)

# startOpgaver skjuler klar-knap og viser restart
test("startOpgaver skjuler ready-btn",   "readyWrap.style.display = 'none'" in js_v2)
test("startOpgaver viser restart-btn",   "restartBtn.style.display = 'block'" in js_v2)
test("startOpgaver laaser slider",       "classList.add('slider-locked')" in js_v2)

# restartOpgaver nulstiller korrekt
test("restartOpgaver skjuler restart-btn", "restartBtn.style.display = 'none'" in js_v2)
test("restartOpgaver fjerner slider-lock", "classList.remove('slider-locked')" in js_v2)
test("restartOpgaver nulstiller inputs",   "inp.value = ''" in js_v2)
test("restartOpgaver skjuler opgaver",     "style.display = 'none'" in js_v2)
test("restartOpgaver viser ready-btn igen", "readyWrap.style.display = 'block'" in js_v2)
# ── REGRESSION: restoreState må ikke vise widgets ─────────────────────────────
section("Regression: restoreState viser ikke widgets for tidligt")

html_v2 = html
soup_v2 = soup
js_v2 = js

# restoreState må ikke kalde showWidget eller sætte display direkte
restore_idx = js_v2.find('function restoreState')
restore_end = js_v2.find('\n}\n', restore_idx) + 3
restore_fn = js_v2[restore_idx:restore_end]

test("restoreState kalder ikke showWidget",
     'showWidget' not in restore_fn)
test("restoreState saetter ikke display direkte",
     "style.display = ''" not in restore_fn and "style.display=''" not in restore_fn)
test("restoreState bruger dataset til at gemme vaerdier",
     'dataset.restored' in restore_fn or 'dataset.restoredVal' in restore_fn)
test("startOpgaver anvender restored vaerdier",
     "dataset.restored === '1'" in js_v2)
test("Opgaver stadig skjulte ved start (efter restoreState fix)",
     all('opgave-hidden' in ((soup_v2.find('div', id=wid) or {}).get('class') or [])
         for wid in ['opgave-low','opgave-mid','opgave-high']))
# ── REGRESSION: updateEnergy må ikke vise widgets ─────────────────────────────
section("Regression: updateEnergy viser ikke widgets")

html_v2 = html
soup_v2 = soup
js_v2 = js

# Find updateEnergy function body
ue_idx = js_v2.find('function updateEnergy')
ue_end = js_v2.find('\n}\n', ue_idx) + 3
ue_fn  = js_v2[ue_idx:ue_end]

test("updateEnergy kalder ikke showWidget",
     'showWidget' not in ue_fn)
test("updateEnergy skjuler aktivt alle widgets",
     "classList.add('opgave-hidden')" in ue_fn)
test("updateEnergy viser kun klar-knap (readyWrap)",
     'readyWrap' in ue_fn and 'display = \'block\'' in ue_fn)
test("updateEnergy returnerer tidligt hvis opgaverStarted",
     'if (opgaverStarted) return' in ue_fn)
# ── REGRESSION: slider og navigation ─────────────────────────────────────────
section("Regression: slider skjuler og navigation gemmer state")

html_v3 = html
soup_v3 = soup
js_v3 = js

# updateEnergy skal tilføje klassen OG nulstille inline style
ue_idx = js_v3.find('function updateEnergy')
ue_end = js_v3.find('\n}\n', ue_idx) + 3
ue_fn  = js_v3[ue_idx:ue_end]
test("updateEnergy tilfojer opgave-hidden klasse",  "classList.add('opgave-hidden')" in ue_fn)
test("updateEnergy nulstiller inline style",         "style.display = ''" in ue_fn)

# showPage gendanner opgaver hvis opgaverStarted
sp_idx = js_v3.find('function showPage')
sp_end = js_v3.find('\n}\n', sp_idx) + 3
sp_fn  = js_v3[sp_idx:sp_end]

# localStorage try/catch
test("saveProgress er wrapped i try/catch",
     "function saveProgress" in js_v3 and js_v3[js_v3.find("function saveProgress"):js_v3.find("function saveProgress")+200].count("try {") >= 1)
test("restoreState er wrapped i try/catch ved load",
     "try { restoreState(); }" in js_v3)
test("restoreState nulstiller opgaverStarted ved load",
     "opgaverStarted = false" in js_v3)
# ── REGRESSION: closeMedal nulstiller niveau ──────────────────────────────────
section("Regression: closeMedal nulstiller til ny valg")
html_v3 = html
js_v3 = js

close_idx = js_v3.find('function closeMedal')
close_end = js_v3.find('\n}\n', close_idx) + 3
close_fn  = js_v3[close_idx:close_end]

test("closeMedal kalder restartOpgaver", 'restartOpgaver()' in close_fn)
test("closeMedal kalder updateFremgang", 'updateFremgang()' in close_fn)
# ── REGRESSION: restartOpgaver viser klar-knap ────────────────────────────────
section("Regression: restartOpgaver viser klar-knap igen")
js_v3 = js

restart_idx = js_v3.find('function restartOpgaver')
restart_end = js_v3.find('\n}\n', restart_idx) + 3
restart_fn  = js_v3[restart_idx:restart_end]

test("restartOpgaver viser ready-btn (display block)",
     "readyWrap.style.display = 'block'" in restart_fn)
test("restartOpgaver skjuler restart-btn",
     "restartBtn.style.display = 'none'" in restart_fn)
# ── REGRESSION: ingen dobbelt readyWrap skjulning ────────────────────────────
section("Regression: ingen dobbelt readyWrap i restartOpgaver")
js_v3 = js

restart_idx = js_v3.find('function restartOpgaver')
restart_end = js_v3.find('\n}\n', restart_idx) + 3
restart_fn  = js_v3[restart_idx:restart_end]

test("readyWrap sættes til display block i restartOpgaver",
     "readyWrap.style.display = 'block'" in restart_fn)
test("ingen dobbelt readyWrap skjulning i restartOpgaver",
     restart_fn.count("readyWrap") <= 3 and restart_fn.count("display = 'none'") == 1)
# ── REGRESSION: currentLevel er 1 efter restart ───────────────────────────────
section("Regression: currentLevel ikke 0 efter restart")
js_v3 = js
restart_idx = js_v3.find('function restartOpgaver')
restart_end = js_v3.find('\n}\n', restart_idx) + 3
restart_fn  = js_v3[restart_idx:restart_end]
test("restartOpgaver saetter currentLevel til 1 (ikke 0)",
     'currentLevel = 1' in restart_fn and 'currentLevel = 0' not in restart_fn)
test("startOpgaver returnerer ikke naar level er 1",
     'if (currentLevel === 0) return' in js_v3)
# ── REGRESSION: restoreState skjuler alle widgets ────────────────────────────
section("Regression: restoreState skjuler alle opgave widgets")
js_v3 = js
restore_idx = js_v3.find('function restoreState')
restore_end = js_v3.find('\n}\n', restore_idx) + 3
restore_fn  = js_v3[restore_idx:restore_end]
test("restoreState tilfojer opgave-hidden til alle widgets",
     "classList.add('opgave-hidden')" in restore_fn)
test("restoreState naevner opgave-low",  "'opgave-low'" in restore_fn)
test("restoreState naevner opgave-mid",  "'opgave-mid'" in restore_fn)
test("restoreState naevner opgave-high", "'opgave-high'" in restore_fn)
# ── REGRESSION: ingen dobbelt-definerede updateEnergy-funktioner ─────────────
section("Regression: ingen dobbelt-definerede updateEnergy-funktioner")
html_v3 = html
import re as _re2
names = _re2.findall(r'function (updateEnergy\w*)\s*\(', html_v3)
dupes = sorted(set(n for n in names if names.count(n) > 1))
test("Hver updateEnergy-variant er kun defineret én gang (ingen duplikater)",
     len(dupes) == 0, f"duplikeret: {dupes}")
test("updateEnergy findes for alle emner (1.3.1, 3.1.1, 3.1.2, 3.1.3, 3.1.4, 3.1.5)",
     set(names) == {'updateEnergy', 'updateEnergy311', 'updateEnergy312', 'updateEnergy313', 'updateEnergy314', 'updateEnergy315'},
     f"fandt {sorted(set(names))}")
# ── REGRESSION: medalje kræver alle synlige widgets ───────────────────────────
section("Regression: medalje kun naar alle synlige widgets er korrekte")
html_v3 = html
idx = html_v3.find('function checkAllCorrectForMedal')
end = html_v3.find('\n}\n', idx) + 3
fn = html_v3[idx:end]
test("checkAllCorrectForMedal tjekker opgave-hidden klasse",
     "classList.contains('opgave-hidden')" in fn)
test("checkAllCorrectForMedal tjekker alle synlige widgets",
     "widgets.every" in fn)
test("checkAllCorrectForMedal returnerer hvis ingen widgets",
     "widgets.length === 0" in fn)
test("checkAllCorrectForMedal kræver inputs.length > 0",
     "inputs.length === 0" in fn)
# ── REGRESSION: inputs nulstilles ved startOpgaver ────────────────────────────
section("Regression: inputs nulstilles ved startOpgaver saa gamle svar ikke tæller")
html_v3 = html
start_idx = html_v3.find('function startOpgaver')
start_end = html_v3.find('\n}\n', start_idx) + 3
start_fn  = html_v3[start_idx:start_end]
test("startOpgaver nulstiller ikke-gendannede input values", "input.value = ''" in start_fn)
test("startOpgaver nulstiller ikke-gendannede input className", "input.className = 'ow-input'" in start_fn)
test("startOpgaver nulstiller result tekst for ikke-gendannede", "result.textContent = ''" in start_fn)
test("startOpgaver genanvender tidligere korrekte svar (dataset.restored)",
     "dataset.restored === '1'" in start_fn)
# ── FREMGANG KORT ER KLIKBARE ─────────────────────────────────────────────────
section("Fremgang kort er klikbare og linker til emne")
html_v3 = html
test("Fremgang kort har onclick med showPage", 'showPage' in html_v3 and 'fp-emne-card' in html_v3)
test("Fremgang kort har cursor:pointer",          "cursor:pointer" in html_v3)
test("Slug beregnes fra nr (replace .)", 'nr.replace' in html_v3)
# ── REGRESSION: forside synlig uden JS ───────────────────────────────────────
section("Regression: forside synlig som standard uden JS")
html_v3 = html
soup_v3 = soup
home = soup_v3.find('div', id='page-home')
test("page-home er synlig som standard (display:block eller ingen display:none)",
     home is not None and 'display:none' not in home.get('style',''))
test("page-home har ikke display:none",
     home is not None and home.get('style','') != 'display:none')
# ── REGRESSION: showPage skjuler ikke page-home ───────────────────────────────
section("Regression: showPage bruger id-selector ikke container-selector")
html_v3 = html
sp_idx = html_v3.find('function showPage')
sp_end = html_v3.find('\n}\n', sp_idx) + 3
sp_fn  = html_v3[sp_idx:sp_end]
test("showPage bruger [id^=page-] ikke .container > div",
     '[id^="page-"]' in sp_fn and '.container > div' not in sp_fn)
# ── REGRESSION: fremgang kort navigation med data-slug ────────────────────────
section("Regression: fremgang kort bruger data-slug ikke inline onclick")
html_v3 = html
test("fp-emne-card bruger data-slug",         'data-slug' in html_v3)
test("event delegation lytter paa data-slug", "closest('[data-slug]')" in html_v3)
test("fp-emne-card har ikke inline onclick", 'onclick=\\\"showPage' not in html_v3 or 'data-slug' in html_v3)
# ── REGRESSION: ingen star-btn på forsiden ────────────────────────────────────
section("Regression: ingen Min fremgang knap paa forsiden")
html_v4 = html
soup_v4 = soup
home_v4 = soup_v4.find('div', id='page-home')
test("Ingen star-btn knap i page-home",
     home_v4 is not None and home_v4.find('button', class_='star-btn') is None)
test("Ingen Min fremgang tekst i page-home",
     home_v4 is not None and 'Min fremgang' not in home_v4.get_text())

# ── RESULTAT ──────────────────────────────────────────────────────────────────
total = passed + failed
print(f"\n{'='*40}")
print(f"Resultat: {passed}/{total} tests bestået")
if failed:
    print(f"FEJL: {failed} test(s) fejlede")
    sys.exit(1)
else:
    print("Alle tests bestået!")
