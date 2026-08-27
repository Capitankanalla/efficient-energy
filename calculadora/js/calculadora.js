// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA D'ESTALVI ENERGÈTIC — 2.0TD (Llar + Negoci) + Indústria (3.0TD/6.1TD)
//
// Fonts de dades reals (mai preus hardcodejats):
//   /json/20TD.json  → Llar i Negoci fins a 15kW
//   /json/30TD.json  → Negoci/Indústria de 15kW a 450kW
//   /json/61TD.json  → Indústria a partir de 450kW (Alta Tensió)
//
// El client MAI veu preus ni comissions — només el % d'estalvi final.
// ═══════════════════════════════════════════════════════════════════════════

const LLINDAR_ESTALVI_MINIM = 10;
const TRADUCCIONS_CALCULADORA = {
  ca: '../json/calcuCA.json',
  es: '../json/calcuES.json',
  en: '../json/calcuEN.json'
};

// ─── ESTAT GLOBAL ─────────────────────────────────────────────────────────
let entradaSegment = null;
let periodesEnergia = 1;
let periodesEnergiaIndustria = 1;
let calcTranslations = null;

function getNestedTranslation(obj, path) {
  if (!obj || !path) return undefined;

  const directCandidates = [
    path,
    path.replace(/^calculadora\./, ''),
    path.replace(/^resultat\./, ''),
    path.replace(/^errors\./, '')
  ];

  for (const candidate of directCandidates) {
    let current = obj;
    let ok = true;

    for (const part of candidate.split('.')) {
      if (current && Object.prototype.hasOwnProperty.call(current, part)) {
        current = current[part];
      } else {
        ok = false;
        break;
      }
    }

    if (ok && current !== undefined && current !== null && typeof current !== 'object') {
      return current;
    }
  }

  if (obj.calculadora && typeof obj.calculadora === 'object') {
    const flatCandidates = [
      path,
      path.replace(/^calculadora\./, ''),
      `calculadora.${path.replace(/^calculadora\./, '')}`
    ];

    for (const candidate of flatCandidates) {
      const value = obj.calculadora[candidate];
      if (value !== undefined && value !== null && typeof value !== 'object') {
        return value;
      }
    }
  }

  if (obj.resultat && typeof obj.resultat === 'object') {
    const candidate = path.replace(/^resultat\./, '');
    const value = obj.resultat[candidate];
    if (value !== undefined && value !== null && typeof value !== 'object') {
      return value;
    }
  }

  if (obj.errors && typeof obj.errors === 'object') {
    const candidate = path.replace(/^errors\./, '');
    const value = obj.errors[candidate];
    if (value !== undefined && value !== null && typeof value !== 'object') {
      return value;
    }
  }

  return undefined;
}

function t(key, fallback = '') {
  const value = getNestedTranslation(calcTranslations, key);

  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}

function applyTranslationsToDom() {
  document.querySelectorAll('[data-text]').forEach(el => {
    const key = el.dataset.text;
    const value = t(key);
    if (!value) return;

    if (el.tagName.toLowerCase() === 'title') {
      document.title = value;
      return;
    }

    if (el.tagName.toLowerCase() === 'button' || el.tagName.toLowerCase() === 'a') {
      el.textContent = value;
      return;
    }

    el.textContent = value;
  });

  const titulPagina = t('calculadora.titol', document.title);
  if (titulPagina) document.title = titulPagina;
}

async function carregarIdiomaCalculadora() {
  const rawLang = localStorage.getItem('lang') || window.currentLang || 'ca';
  const lang = ['ca', 'es', 'en'].includes(rawLang) ? rawLang : 'ca';
  const ruta = TRADUCCIONS_CALCULADORA[lang] || TRADUCCIONS_CALCULADORA.ca;

  try {
    const res = await fetch(ruta);
    calcTranslations = await res.json();
    applyTranslationsToDom();
  } catch (error) {
    console.error('Error carregant l’idioma de la calculadora:', error);
    calcTranslations = null;
  }
}

function mostrarResultat(pct, estalviEur, dies, esViaSimplificada) {
  const el = document.getElementById('resultat');
  const pctArrodonit = Math.round(pct);

  if (pctArrodonit < LLINDAR_ESTALVI_MINIM) {
    el.classList.add('condicions-bones');
    el.innerHTML = `
      <strong>${t('resultat.condicions_bones', 'Les teves condicions ja són bones')}</strong>
      <p style="margin-top:8px">${t('resultat.marge_reduit', 'Amb les dades disponibles, el marge d\'estalvi és reduït. Recomanem enviar-nos la teva factura perquè el nostre equip la revisi i validi si hi ha marge real de millora.')}</p>
    `;
    el.classList.remove('ocult');
    const ctaText = document.getElementById('cta-text');
    if (ctaText) ctaText.textContent = String(t('calculadora.cta.auditoria', 'Sol·licitar auditoria gratuïta'));
    document.getElementById('bloc-cta').classList.remove('ocult');
    return;
  }

  const anual = (estalviEur * (365 / dies)).toFixed(0);
  el.innerHTML = `
    <span class="estalvi-pct">${pctArrodonit}%</span>
    <span class="estalvi-label">${t('resultat.estalvi_estimat', "d'estalvi estimat")}</span>
    <span>${t('resultat.estalvi_factura', 'Estalvi en aquesta factura:')}</span> <strong>${estalviEur.toFixed(2)} €</strong><br>
    <span>${t('resultat.estalvi_anual', 'Estalvi anual estimat:')}</span> <strong>${anual} €</strong>
    ${esViaSimplificada ? `<span class="estalvi-avis">${t('resultat.avis_potencia', 'Estimació orientativa sobre la part d\'energia. La potència es validarà amb l\'auditoria de la factura.')}</span>` : ''}
  `;
  el.classList.remove('ocult');
  const ctaText = document.getElementById('cta-text');
  if (ctaText) ctaText.textContent = String(t('calculadora.cta.auditoria', 'Sol·licitar auditoria gratuïta'));
  document.getElementById('bloc-cta').classList.remove('ocult');
}

// ─── INICIALITZACIÓ ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarIdiomaCalculadora();
});

// ─── NAVEGACIÓ ENTRE PASSOS ───────────────────────────────────────────────
function anarA(idPas) {
  document.querySelectorAll('.wizard-step').forEach(sec => sec.classList.add('ocult'));
  document.getElementById(idPas).classList.remove('ocult');
  ocultarResultat();
  actualitzarProgres(idPas);
  applyTranslationsToDom();
}

function tornarA(idPas) {
  anarA(idPas);
}

function actualitzarProgres(idPas) {
  const mapa = {
    'pas-segment': 1,
    'pas-negoci-tipus': 2,
    'pas-negoci-periodes': 2,
    'pas-pot-coneguda': 2,
    'pas-detall': 3,
    'pas-simple': 3,
    'pas-industria-entrada': 2,
    'pas-industria-detall': 3,
    'pas-industria-simple': 3
  };
  const actual = mapa[idPas] || 1;
  document.querySelectorAll('.progress-step').forEach(s => {
    const n = parseInt(s.dataset.step, 10);
    s.classList.toggle('active', n === actual);
    s.classList.toggle('done', n < actual);
  });
}

// ─── PAS 1: SEGMENT ───────────────────────────────────────────────────────
function triarSegment(seg) {
  entradaSegment = seg;
  document.querySelectorAll('.segment-card').forEach(c => c.classList.remove('active'));
  event.currentTarget.classList.add('active');

  if (seg === 'llar') {
    anarA('pas-pot-coneguda');
  } else {
    anarA('pas-negoci-tipus');
  }
}

// ─── PAS 1B: NEGOCI — ÉS ≥15kW? ───────────────────────────────────────────
function triarTipusNegoci(resposta) {
  if (resposta === 'no') {
    anarA('pas-pot-coneguda');
  } else if (resposta === 'si') {
    anarA('pas-industria-entrada');
  } else {
    anarA('pas-negoci-periodes');
  }
}

// ─── PAS 1C: NO HO SÉ — PERÍODES DE POTÈNCIA (2 o 6) ──────────────────────
function triarPeriodesPotenciaNegoci(n) {
  anarA(n === 2 ? 'pas-pot-coneguda' : 'pas-industria-entrada');
}

// ─── PAS 2: SAPS LA POTÈNCIA? (2.0TD) ─────────────────────────────────────
function triarPotConeguda(valor) {
  document.getElementById('btn-pot-si').classList.toggle('active', valor === true);
  document.getElementById('btn-pot-no').classList.toggle('active', valor === false);
  anarA(valor ? 'pas-detall' : 'pas-simple');
}

// ─── PAS 3A: PERÍODES D'ENERGIA 2.0TD (1 vs 3) ────────────────────────────
function triarPeriodesEnergia(n) {
  periodesEnergia = n;
  document.getElementById('btn-periode-1').classList.toggle('active', n === 1);
  document.getElementById('btn-periode-3').classList.toggle('active', n === 3);
  document.getElementById('camps-energia-1preu').classList.toggle('ocult', n !== 1);
  document.getElementById('camps-energia-3preus').classList.toggle('ocult', n !== 3);
}

// ─── INDÚSTRIA: SAPS LA POTÈNCIA? ──────────────────────────────────────────
function triarPotConegudaIndustria(valor) {
  document.getElementById('btn-industria-pot-si').classList.toggle('active', valor === true);
  document.getElementById('btn-industria-pot-no').classList.toggle('active', valor === false);
  anarA(valor ? 'pas-industria-detall' : 'pas-industria-simple');
}

// ─── INDÚSTRIA: PERÍODES D'ENERGIA (1 vs 6) ────────────────────────────────
function triarPeriodesEnergiaIndustria(n) {
  periodesEnergiaIndustria = n;
  document.getElementById('btn-industria-periode-1').classList.toggle('active', n === 1);
  document.getElementById('btn-industria-periode-6').classList.toggle('active', n === 6);
  document.getElementById('camps-industria-energia-1preu').classList.toggle('ocult', n !== 1);
  document.getElementById('camps-industria-energia-6preus').classList.toggle('ocult', n !== 6);
}

// ─── UTILS ────────────────────────────────────────────────────────────────
function val(id) {
  const el = document.getElementById(id);
  return el ? (parseFloat(el.value) || 0) : 0;
}

function diesEntre(idInici, idFi) {
  const inici = document.getElementById(idInici).value;
  const fi = document.getElementById(idFi).value;
  if (!inici || !fi) return null;
  const ms = new Date(fi) - new Date(inici);
  return ms > 0 ? Math.round(ms / 86400000) : null;
}

function mostrarError(clau) {
  const el = document.getElementById('error-msg');
  el.textContent = t(`errors.${clau}`, clau);
  el.classList.remove('ocult');
}

function ocultarError() {
  document.getElementById('error-msg').classList.add('ocult');
}

function ocultarResultat() {
  document.getElementById('resultat').classList.add('ocult');
  document.getElementById('resultat').classList.remove('condicions-bones');
  document.getElementById('bloc-cta').classList.add('ocult');
  ocultarError();
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function solicitarAuditoria() {
  const formUrl = '../../form/form.html?source=calculadora';
  window.location.href = formUrl;
}

async function enviarCalcul(dades) {
  ocultarResultat();

  try {
    const resposta = await fetch('/.netlify/functions/calculaEstalvi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dades)
    });
    const resultat = await resposta.json();

    if (!resposta.ok || resultat.error) {
      mostrarError(resultat.error || 'tarifes');
      return;
    }

    mostrarResultat(resultat.pct, resultat.estalviEur, resultat.dies, resultat.esViaSimplificada);
  } catch (error) {
    console.error('Error comunicant amb la calculadora:', error);
    mostrarError('tarifes');
  }
}

function calcularDetallat() {
  const dades = {
    tarifa: '2TD',
    mode: 'detallat',
    segment: entradaSegment,
    periodesEnergia,
    potP1: val('d-pot-p1'),
    potP3: val('d-pot-p3'),
    dataInici: document.getElementById('d-data-inici').value,
    dataFi: document.getElementById('d-data-fi').value,
    consumUnic: val('d-e-unic'),
    preuEnergiaUnic: val('d-pe-unic'),
    consumP1: val('d-e-p1'),
    consumP2: val('d-e-p2'),
    consumP3: val('d-e-p3'),
    preuEnergiaP1: val('d-pe-p1'),
    preuEnergiaP2: val('d-pe-p2'),
    preuEnergiaP3: val('d-pe-p3'),
    preuPotActualP1: val('d-pp-p1'),
    preuPotActualP3: val('d-pp-p3')
  };
  enviarCalcul(dades);
}

function calcularSimplificat() {
  enviarCalcul({
    tarifa: '2TD',
    mode: 'simplificat',
    segment: entradaSegment,
    dataInici: document.getElementById('s-data-inici').value,
    dataFi: document.getElementById('s-data-fi').value,
    importEnergia: val('s-import-energia'),
    importPotencia: val('s-import-potencia')
  });
}

function calcularIndustriaDetallat() {
  const dades = {
    tarifa: 'industria',
    mode: 'detallat',
    altaTensio: document.getElementById('chk-at-450').checked,
    periodesEnergia: periodesEnergiaIndustria,
    dataInici: document.getElementById('i-data-inici').value,
    dataFi: document.getElementById('i-data-fi').value,
    consumUnic: val('i-e-unic'),
    preuEnergiaUnic: val('i-pe-unic')
  };

  ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach(periode => {
    dades[`pot${periode}`] = val(`i-pot-${periode}`);
    dades[`preuPot${periode}`] = val(`i-pp-${periode}`);
    dades[`consum${periode}`] = val(`i-e-${periode}`);
    dades[`preuEnergia${periode}`] = val(`i-pe-${periode}`);
  });

  enviarCalcul(dades);
}

function calcularIndustriaSimplificat() {
  enviarCalcul({
    tarifa: 'industria',
    mode: 'simplificat',
    altaTensio: document.getElementById('chk-at-450').checked,
    dataInici: document.getElementById('is-data-inici').value,
    dataFi: document.getElementById('is-data-fi').value,
    importEnergia: val('is-import-energia')
  });
}