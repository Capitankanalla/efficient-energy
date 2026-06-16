// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA D'ESTALVI ENERGÈTIC
// Segments: llar (<10kW · 2.0TD) | negoci (10-15kW · 2.0TD) | industria (>15kW · 3.0TD/6.1TD)
// Punts d'entrada: ?segment=llar | negoci | industria | (buit = dropdown)
// Idiomes: localStorage key "lang" → ca | es | en
// ═══════════════════════════════════════════════════════════════════════════

// ─── TEMPORADES (Península Ibèrica) ──────────────────────────────────────
const TEMPORADES = {
  1:  { nom_ca:'Alta',       nom_es:'Alta',       nom_en:'High',     periodes:['P1','P2','P6'] },
  2:  { nom_ca:'Alta',       nom_es:'Alta',       nom_en:'High',     periodes:['P1','P2','P6'] },
  3:  { nom_ca:'Mitja-alta', nom_es:'Media-alta', nom_en:'Mid-high', periodes:['P2','P3','P6'] },
  4:  { nom_ca:'Baixa',      nom_es:'Baja',       nom_en:'Low',      periodes:['P4','P5','P6'] },
  5:  { nom_ca:'Baixa',      nom_es:'Baja',       nom_en:'Low',      periodes:['P4','P5','P6'] },
  6:  { nom_ca:'Mitja',      nom_es:'Media',      nom_en:'Mid',      periodes:['P3','P4','P6'] },
  7:  { nom_ca:'Alta',       nom_es:'Alta',       nom_en:'High',     periodes:['P1','P2','P6'] },
  8:  { nom_ca:'Mitja',      nom_es:'Media',      nom_en:'Mid',      periodes:['P3','P4','P6'] },
  9:  { nom_ca:'Mitja',      nom_es:'Media',      nom_en:'Mid',      periodes:['P3','P4','P6'] },
  10: { nom_ca:'Baixa',      nom_es:'Baja',       nom_en:'Low',      periodes:['P4','P5','P6'] },
  11: { nom_ca:'Mitja-alta', nom_es:'Media-alta', nom_en:'Mid-high', periodes:['P2','P3','P6'] },
  12: { nom_ca:'Alta',       nom_es:'Alta',       nom_en:'High',     periodes:['P1','P2','P6'] }
};

// ─── OFERTES (substitueix pels teus preus i comissions reals) ─────────────
// El client MAI veu preus ni comissions — només el % d'estalvi final.
// El sistema tria l'oferta de MÀXIMA COMISSIÓ disponible per al segment.
const OFERTES = {
  '2.0TD': [
    {
      id: 'A', comissio: 45,
      energia:  { P1: 0.119, P2: 0.119, P3: 0.119 },
      potencia: { P1: 0.095, P3: 0.040 }
    },
    {
      id: 'B', comissio: 60,
      energia:  { P1: 0.140, P2: 0.105, P3: 0.070 },
      potencia: { P1: 0.090, P3: 0.038 }
    }
  ],
  '3.0TD': [
    {
      id: 'C', comissio: 50,
      energia:  { P1:0.170, P2:0.140, P3:0.110, P4:0.080, P5:0.060, P6:0.040 },
      potencia: { P1:0.110, P2:0.085, P3:0.065, P4:0.045, P5:0.025, P6:0.005 }
    },
    {
      id: 'D', comissio: 65,
      energia:  { P1:0.165, P2:0.135, P3:0.105, P4:0.075, P5:0.055, P6:0.035 },
      potencia: { P1:0.105, P2:0.080, P3:0.060, P4:0.040, P5:0.022, P6:0.004 }
    }
  ],
  '6.1TD': [
    {
      id: 'E', comissio: 55,
      energia:  { P1:0.160, P2:0.130, P3:0.100, P4:0.070, P5:0.050, P6:0.030 },
      potencia: { P1:0.100, P2:0.078, P3:0.058, P4:0.038, P5:0.020, P6:0.003 }
    },
    {
      id: 'F', comissio: 70,
      energia:  { P1:0.155, P2:0.125, P3:0.095, P4:0.065, P5:0.045, P6:0.025 },
      potencia: { P1:0.095, P2:0.073, P3:0.053, P4:0.033, P5:0.018, P6:0.002 }
    }
  ]
};

// ─── ESTAT GLOBAL ─────────────────────────────────────────────────────────
let segmentActual = null;   // 'llar' | 'negoci' | 'comunitat' | 'industria'
let tarifaActual  = '2.0TD';
let t18n          = {};     // traduccions actives

// ─── i18n ─────────────────────────────────────────────────────────────────
async function carregarIdioma() {
  const lang = localStorage.getItem('lang') || 'ca';
  const url  = `/i18n/${lang}.json`;
  try {
    const res  = await fetch(url);
    t18n = await res.json();
  } catch(e) {
    // fallback bàsic si fetch falla
    t18n = { calcular:'Calcular', estalvi_label:'d\'estalvi estimat', cta_boto:'Sol·licitar auditoria' };
  }
  aplicarIdioma();
}

function t(clau) { return t18n[clau] || clau; }

function aplicarIdioma() {
  // data-i18n → textContent
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const clau = el.getAttribute('data-i18n');
    if (t18n[clau]) el.textContent = t18n[clau];
  });
  // data-i18n-html → innerHTML
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const clau = el.getAttribute('data-i18n-html');
    if (t18n[clau]) el.innerHTML = t18n[clau];
  });
  // Actualitzar badge segment si ja està actiu
  if (segmentActual) actualitzarBadge();
}

function nomTemporada(t) {
  const lang = localStorage.getItem('lang') || 'ca';
  if (lang === 'es') return t.nom_es;
  if (lang === 'en') return t.nom_en;
  return t.nom_ca;
}

// ─── INICIALITZACIÓ ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarIdioma();

  const params  = new URLSearchParams(window.location.search);
  const segment = params.get('segment'); // 'llar' | 'negoci' | 'industria' | null

  if (segment && ['llar','negoci','industria'].includes(segment)) {
    setSegment(segment, false);
  } else {
    // Pàgina general → mostra dropdown
    document.getElementById('bloc-dropdown').classList.remove('ocult');
  }
});

// ─── SEGMENT ──────────────────────────────────────────────────────────────
function setSegmentDropdown(val) {
  if (!val) return;
  const seg = val === 'comunitat' ? 'negoci' : val;
  setSegment(seg === 'industria' ? 'industria' : (val === 'negoci' ? 'negoci' : 'llar'), false);
}

function setSegment(seg, mostrarBadge = true) {
  segmentActual = seg;

  // Amaga dropdown, mostra badge si ve de pàgina específica
  document.getElementById('bloc-dropdown').classList.add('ocult');

  if (mostrarBadge || window.location.search.includes('segment=')) {
    document.getElementById('bloc-segment-badge').classList.remove('ocult');
    actualitzarBadge();
  }

  // Blocs visibles
  const es20 = (seg === 'llar' || seg === 'negoci');
  document.getElementById('bloc-20').classList.toggle('ocult', !es20);
  document.getElementById('bloc-30').classList.toggle('ocult', es20);
  document.getElementById('bloc-tarifa-industrial').classList.toggle('ocult', es20);

  if (!es20) {
    tarifaActual = '3.0TD';
    document.getElementById('btn-30').classList.add('active');
    document.getElementById('btn-61').classList.remove('active');
  } else {
    tarifaActual = '2.0TD';
  }

  ocultarResultat();
  updateTemporada();
}

function actualitzarBadge() {
  const mapa = {
    llar:      t('segment_llar'),
    negoci:    t('segment_negoci'),
    industria: t('segment_industria')
  };
  document.getElementById('segment-badge-text').textContent = mapa[segmentActual] || segmentActual;
}

// ─── TARIFA INDUSTRIAL ────────────────────────────────────────────────────
function setTarifa(tar) {
  tarifaActual = tar;
  document.getElementById('btn-30').classList.toggle('active', tar === '3.0TD');
  document.getElementById('btn-61').classList.toggle('active', tar === '6.1TD');
  ocultarResultat();
}

// ─── TEMPORADA ────────────────────────────────────────────────────────────
function updateTemporada() {
  const inici  = document.getElementById('data-inici').value;
  const infoEl = document.getElementById('info-temporada');

  if (!inici || tarifaActual === '2.0TD') {
    infoEl.classList.add('ocult');
    return;
  }

  const mes = new Date(inici).getMonth() + 1;
  const tmp = TEMPORADES[mes];
  infoEl.classList.remove('ocult');
  infoEl.innerHTML = `<strong>${t('temporada')} ${nomTemporada(tmp)}</strong> — ${t('periodes_facturats')}: <strong>${tmp.periodes.join(', ')}</strong>`;
  renderCampsEnergia30(tmp);
}

function renderCampsEnergia30(tmp) {
  const cont = document.getElementById('camps-energia-30');
  const cols = tmp.periodes.length;
  cont.innerHTML = `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;margin-top:6px">` +
    tmp.periodes.map(p => `
      <div>
        <label>${p} (${t('kwh')})</label>
        <input type="number" id="30-e-${p.toLowerCase()}" placeholder="0">
      </div>`).join('') +
    '</div>';
}

// ─── UTILS ────────────────────────────────────────────────────────────────
function mostrarError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
  el.classList.remove('ocult');
}
function ocultarError() { document.getElementById('error-msg').classList.add('ocult'); }
function ocultarResultat() {
  document.getElementById('resultat').classList.add('ocult');
  document.getElementById('bloc-cta').classList.add('ocult');
  ocultarError();
}

// ─── CÀLCUL ───────────────────────────────────────────────────────────────
function calcular() {
  ocultarResultat();

  if (!segmentActual) {
    mostrarError(t('error_consum'));
    return;
  }

  const inici = document.getElementById('data-inici').value;
  const fi    = document.getElementById('data-fi').value;
  let dies = 30;
  if (inici && fi) {
    const ms = new Date(fi) - new Date(inici);
    if (ms > 0) dies = Math.round(ms / 86400000);
  }

  let costActual = 0, costNou = 0;

  // ── 2.0TD (llar / negoci) ──
  if (tarifaActual === '2.0TD') {
    const potP1 = parseFloat(document.getElementById('20-pot-p1').value) || 0;
    const potP3 = parseFloat(document.getElementById('20-pot-p3').value) || 0;
    const eP1   = parseFloat(document.getElementById('20-e-p1').value)   || 0;
    const eP2   = parseFloat(document.getElementById('20-e-p2').value)   || 0;
    const eP3   = parseFloat(document.getElementById('20-e-p3').value)   || 0;
    const peP1  = parseFloat(document.getElementById('20-pe-p1').value)  || 0;
    const peP2  = parseFloat(document.getElementById('20-pe-p2').value)  || 0;
    const peP3  = parseFloat(document.getElementById('20-pe-p3').value)  || 0;
    const ppP1  = parseFloat(document.getElementById('20-pp-p1').value)  || 0;
    const ppP3  = parseFloat(document.getElementById('20-pp-p3').value)  || 0;

    if (!eP1 && !eP2 && !eP3) { mostrarError(t('error_consum')); return; }
    if (!peP1 && !peP2 && !peP3) { mostrarError(t('error_preus')); return; }

    costActual = eP1*peP1 + eP2*peP2 + eP3*peP3
               + potP1*ppP1*dies + potP3*ppP3*dies;

    const oferta = OFERTES['2.0TD'].slice().sort((a,b) => b.comissio - a.comissio)[0];
    costNou = eP1*oferta.energia.P1 + eP2*oferta.energia.P2 + eP3*oferta.energia.P3
            + potP1*oferta.potencia.P1*dies + potP3*oferta.potencia.P3*dies;

  // ── 3.0TD / 6.1TD (indústria) ──
  } else {
    if (!inici) { mostrarError(t('error_data')); return; }
    const mes = new Date(inici).getMonth() + 1;
    const tmp = TEMPORADES[mes];

    const pots     = {};
    const ppActual = {};
    const peActual = {};
    [1,2,3,4,5,6].forEach(i => {
      pots['P'+i]     = parseFloat(document.getElementById('30-pot-p'+i).value) || 0;
      ppActual['P'+i] = parseFloat(document.getElementById('30-pp-p'+i).value) || 0;
      peActual['P'+i] = parseFloat(document.getElementById('30-pe-p'+i).value) || 0;
    });

    const eConsum = {};
    tmp.periodes.forEach(p => {
      const el = document.getElementById('30-e-' + p.toLowerCase());
      eConsum[p] = el ? (parseFloat(el.value) || 0) : 0;
    });

    const totalConsum = Object.values(eConsum).reduce((a,b) => a+b, 0);
    if (!totalConsum) { mostrarError(t('error_consum_temporada')); return; }

    const oferta = OFERTES[tarifaActual].slice().sort((a,b) => b.comissio - a.comissio)[0];

    tmp.periodes.forEach(p => {
      costActual += eConsum[p] * peActual[p];
      costNou    += eConsum[p] * oferta.energia[p];
    });
    [1,2,3,4,5,6].forEach(i => {
      const p = 'P'+i;
      costActual += pots[p] * ppActual[p] * dies;
      costNou    += pots[p] * oferta.potencia[p] * dies;
    });
  }

  if (costActual <= 0) { mostrarError(t('error_preus_generals')); return; }

  const estalviAbs = costActual - costNou;
  const estalviPct = Math.round((estalviAbs / costActual) * 100);
  mostrarResultat(estalviPct, estalviAbs, dies);
}

// ─── RESULTAT ─────────────────────────────────────────────────────────────
function mostrarResultat(pct, estalviEur, dies) {
  const anual = (estalviEur * (365 / dies)).toFixed(0);
  const el = document.getElementById('resultat');
  el.innerHTML = `
    <span class="estalvi-pct">${pct}%</span>
    <span class="estalvi-label">${t('estalvi_label')}</span>
    ${t('estalvi_factura')}: <strong>${estalviEur.toFixed(2)} €</strong><br>
    ${t('estalvi_anual')}: <strong>${anual} €</strong>
  `;
  el.classList.remove('ocult');

  // CTA
  document.getElementById('cta-text').innerHTML = t18n['cta_text'] || '';
  document.getElementById('bloc-cta').classList.remove('ocult');
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function solicitarAuditoria() {
  // TODO: connecta aquí el teu formulari de leads o redirecció
  alert('Formulari / lead form aquí');
}
