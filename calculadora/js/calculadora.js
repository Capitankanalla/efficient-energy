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

const RUTA_TARIFES_20TD = '../../netlify/20TD.json';
const RUTA_TARIFES_30TD = '../../netlify/30TD.json';
const RUTA_TARIFES_61TD = '../../netlify/61TD.json';
const LLINDAR_ESTALVI_MINIM = 10;
const TRADUCCIONS_CALCULADORA = {
  ca: '../json/calcuCA.json',
  es: '../json/calcuES.json',
  en: '../json/calcuEN.json'
};

// ─── ESTAT GLOBAL ─────────────────────────────────────────────────────────
let tarifes20TD = null;
let tarifesIndustria = {};
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

// ─── INICIALITZACIÓ ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarTarifes20TD();
  await carregarIdiomaCalculadora();
});

async function carregarTarifes20TD() {
  try {
    const res = await fetch(RUTA_TARIFES_20TD);
    tarifes20TD = await res.json();
  } catch (e) {
    mostrarError('tarifes'); // CORREGIT: abans 'error_tarifes'
    console.error('Error carregant 20TD.json', e);
  }
}

// Carrega (i guarda en caché) les tarifes d'indústria segons si l'usuari
// ha marcat el checkbox d'Alta Tensió (>450kW) o no.
async function obtenirTarifesIndustria() {
  const esAT = document.getElementById('chk-at-450').checked;
  const clau = esAT ? '61TD' : '30TD';

  if (tarifesIndustria[clau]) return tarifesIndustria[clau];

  const ruta = esAT ? RUTA_TARIFES_61TD : RUTA_TARIFES_30TD;
  const res = await fetch(ruta);
  const dades = await res.json();
  tarifesIndustria[clau] = dades;
  return dades;
}

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

// Preu mitjà de potència (€/kW/any) d'un segment 2.0TD, fent la mitjana
// entre tots els productes disponibles. Només serveix com a referència
// per estimar la potència contractada quan el lead no la sap.
function preuPotenciaMitjaAnual(segmentObj) {
  let suma = 0, n = 0;
  Object.values(segmentObj.productes).forEach(producte => {
    const variant = producte['3_preus'] || producte['1_preu'];
    if (variant && variant.potencia_kw_any) {
      suma += (variant.potencia_kw_any.p1 + variant.potencia_kw_any.p2) / 2;
      n++;
    }
  });
  return n ? suma / n : 0;
}

// ─── RESOLUCIÓ DE SUBSEGMENT (NOMÉS 2.0TD) ────────────────────────────────
function resolSubsegmentDetallat(potP1, potP3) {
  if (entradaSegment === 'llar') return 'domestico';
  const potRef = Math.max(potP1, potP3);
  return potRef <= 10 ? 'negocio_menys_10kw' : 'negocio_mes_10kw';
}

function resolSubsegmentSimple(importPotencia, dies) {
  if (entradaSegment === 'llar') return 'domestico';
  const refMenys = preuPotenciaMitjaAnual(tarifes20TD.segments.negocio_menys_10kw);
  const kwEstMenys = refMenys > 0 ? importPotencia / ((refMenys / 365) * dies) : 0;
  if (kwEstMenys > 0 && kwEstMenys <= 10) return 'negocio_menys_10kw';
  return 'negocio_mes_10kw';
}

// ─── 2.0TD — VIA DETALLADA: CÀLCUL ─────────────────────────────────────────
function calcularDetallat() {
  ocultarResultat();

  const potP1 = val('d-pot-p1');
  const potP3 = val('d-pot-p3');
  const dies = diesEntre('d-data-inici', 'd-data-fi');

  if (!dies) { mostrarError('dates_factura'); return; } // CORREGIT

  let consumTotal = 0, costActualEnergia = 0;
  const consum = {}, preuActual = {};

  if (periodesEnergia === 1) {
    const e = val('d-e-unic');
    const p = val('d-pe-unic');
    if (!e || !p) { mostrarError('consum_preus'); return; } // CORREGIT
    consumTotal = e;
    costActualEnergia = e * p;
    consum.p1 = e; consum.p2 = e; consum.p3 = e;
  } else {
    consum.p1 = val('d-e-p1'); consum.p2 = val('d-e-p2'); consum.p3 = val('d-e-p3');
    preuActual.p1 = val('d-pe-p1'); preuActual.p2 = val('d-pe-p2'); preuActual.p3 = val('d-pe-p3');
    consumTotal = consum.p1 + consum.p2 + consum.p3;
    if (!consumTotal || (!preuActual.p1 && !preuActual.p2 && !preuActual.p3)) {
      mostrarError('consum_preus'); return; // CORREGIT
    }
    costActualEnergia = consum.p1 * preuActual.p1 + consum.p2 * preuActual.p2 + consum.p3 * preuActual.p3;
  }

  const preuPotActualP1 = val('d-pp-p1');
  const preuPotActualP3 = val('d-pp-p3');
  const costActualPotencia = potP1 * preuPotActualP1 * dies + potP3 * preuPotActualP3 * dies;
  const costActual = costActualEnergia + costActualPotencia;

  if (costActual <= 0) { mostrarError('consum_preus'); return; } // CORREGIT

  const subsegment = resolSubsegmentDetallat(potP1, potP3);
  const variantKey = periodesEnergia === 1 ? '1_preu' : '3_preus';
  const segmentObj = tarifes20TD.segments[subsegment];

  let millor = null;

  Object.entries(segmentObj.productes).forEach(([nom, producte]) => {
    const variant = producte[variantKey];
    if (!variant) return;

    let costNouEnergia;
    if (periodesEnergia === 1) {
      costNouEnergia = consumTotal * variant.energia_con_descuento.p1;
    } else {
      costNouEnergia = consum.p1 * variant.energia_con_descuento.p1
                      + consum.p2 * variant.energia_con_descuento.p2
                      + consum.p3 * variant.energia_con_descuento.p3;
    }
    const costNouPotencia = potP1 * (variant.potencia_kw_any.p1 / 365) * dies
                           + potP3 * (variant.potencia_kw_any.p2 / 365) * dies;
    const costNou = costNouEnergia + costNouPotencia;
    const estalviPct = ((costActual - costNou) / costActual) * 100;

    if (!millor || estalviPct > millor.estalviPct) {
      millor = { nom, estalviPct, costNou };
    }
  });

  if (!millor) { mostrarError('producte'); return; } // CORREGIT

  const estalviEur = costActual - millor.costNou;
  mostrarResultat(millor.estalviPct, estalviEur, dies, false);
}

// ─── 2.0TD — VIA SIMPLIFICADA: CÀLCUL ──────────────────────────────────────
function calcularSimplificat() {
  ocultarResultat();

  const dies = diesEntre('s-data-inici', 's-data-fi');
  if (!dies) { mostrarError('dates_factura'); return; } // CORREGIT

  const importEnergia = val('s-import-energia');
  const importPotencia = val('s-import-potencia');

  if (!importEnergia) { mostrarError('import_energia'); return; } // CORREGIT
  if (entradaSegment === 'negoci' && !importPotencia) {
    mostrarError('import_potencia_negoci'); return; // CORREGIT
  }

  const subsegment = resolSubsegmentSimple(importPotencia, dies);
  const segmentObj = tarifes20TD.segments[subsegment];

  let millorDescompte = 0;
  Object.values(segmentObj.productes).forEach(producte => {
    const variant = producte['3_preus'] || producte['1_preu'];
    if (variant && variant.descuento_percent > millorDescompte) {
      millorDescompte = variant.descuento_percent;
    }
  });

  if (!millorDescompte) { mostrarError('producte'); return; } // CORREGIT

  const estalviEur = importEnergia * (millorDescompte / 100);
  mostrarResultat(millorDescompte, estalviEur, dies, true);
}

// ─── INDÚSTRIA — VIA DETALLADA: CÀLCUL (P1-P6) ─────────────────────────────
async function calcularIndustriaDetallat() {
  ocultarResultat();

  const dies = diesEntre('i-data-inici', 'i-data-fi');
  if (!dies) { mostrarError('dates_factura'); return; } // CORREGIT

  const PERIODES = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const potPeriode = {};
  const preuPotActual = {};
  PERIODES.forEach(p => {
    potPeriode[p] = val(`i-pot-${p}`);
    preuPotActual[p] = val(`i-pp-${p}`);
  });

  let consumTotal = 0, costActualEnergia = 0;
  const consum = {}, preuActual = {};

  if (periodesEnergiaIndustria === 1) {
    const e = val('i-e-unic');
    const p = val('i-pe-unic');
    if (!e || !p) { mostrarError('consum_preus'); return; } // CORREGIT
    consumTotal = e;
    costActualEnergia = e * p;
    PERIODES.forEach(pk => { consum[pk] = e; });
  } else {
    PERIODES.forEach(p => {
      consum[p] = val(`i-e-${p}`);
      preuActual[p] = val(`i-pe-${p}`);
    });
    consumTotal = PERIODES.reduce((s, p) => s + consum[p], 0);
    const hiHaPreus = PERIODES.some(p => preuActual[p] > 0);
    if (!consumTotal || !hiHaPreus) { mostrarError('consum_preus'); return; } // CORREGIT
    costActualEnergia = PERIODES.reduce((s, p) => s + consum[p] * preuActual[p], 0);
  }

  const costActualPotencia = PERIODES.reduce((s, p) => s + potPeriode[p] * preuPotActual[p] * dies, 0);
  const costActual = costActualEnergia + costActualPotencia;

  if (costActual <= 0) { mostrarError('consum_preus'); return; } // CORREGIT

  let tarifesObj;
  try {
    tarifesObj = await obtenirTarifesIndustria();
  } catch (e) {
    mostrarError('tarifes'); // CORREGIT
    console.error('Error carregant tarifes indústria', e);
    return;
  }

  const variantKey = periodesEnergiaIndustria === 1 ? '1_preu' : '6_preus';
  const productes = tarifesObj.segments.negocio.productes;

  let millor = null;

  Object.entries(productes).forEach(([nom, producte]) => {
    const variant = producte[variantKey];
    if (!variant) return;

    let costNouEnergia;
    if (periodesEnergiaIndustria === 1) {
      costNouEnergia = consumTotal * variant.energia_con_descuento.p1;
    } else {
      costNouEnergia = PERIODES.reduce((s, p) => s + consum[p] * variant.energia_con_descuento[p], 0);
    }
    const costNouPotencia = PERIODES.reduce((s, p) => s + potPeriode[p] * (variant.potencia_kw_any[p] / 365) * dies, 0);
    const costNou = costNouEnergia + costNouPotencia;
    const estalviPct = ((costActual - costNou) / costActual) * 100;

    if (!millor || estalviPct > millor.estalviPct) {
      millor = { nom, estalviPct, costNou };
    }
  });

  if (!millor) { mostrarError('producte'); return; } // CORREGIT

  const estalviEur = costActual - millor.costNou;
  mostrarResultat(millor.estalviPct, estalviEur, dies, false);
}

// ─── INDÚSTRIA — VIA SIMPLIFICADA: CÀLCUL ──────────────────────────────────
async function calcularIndustriaSimplificat() {
  ocultarResultat();

  const dies = diesEntre('is-data-inici', 'is-data-fi');
  if (!dies) { mostrarError('dates_factura'); return; } // CORREGIT

  const importEnergia = val('is-import-energia');
  if (!importEnergia) { mostrarError('import_energia'); return; } // CORREGIT

  let tarifesObj;
  try {
    tarifesObj = await obtenirTarifesIndustria();
  } catch (e) {
    mostrarError('tarifes'); // CORREGIT
    console.error('Error carregant tarifes indústria', e);
    return;
  }

  const productes = tarifesObj.segments.negocio.productes;

  let millorDescompte = 0;
  Object.values(productes).forEach(producte => {
    const variant = producte['6_preus'] || producte['1_preu'];
    if (variant && variant.descuento_percent > millorDescompte) {
      millorDescompte = variant.descuento_percent;
    }
  });

  if (!millorDescompte) { mostrarError('producte'); return; } // CORREGIT

  const estalviEur = importEnergia * (millorDescompte / 100);
  mostrarResultat(millorDescompte, estalviEur, dies, true);
}

// ─── RESULTAT (compartit per 2.0TD i Indústria) ────────────────────────────
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
    const ctaTraduit = t('calculadora.cta.auditoria', 'Sol·licitar auditoria gratuïta');
    if (ctaText) ctaText.textContent = String(ctaTraduit);
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
  const ctaTraduit = t('calculadora.cta.auditoria', 'Sol·licitar auditoria gratuïta');
  if (ctaText) ctaText.textContent = String(ctaTraduit);
  document.getElementById('bloc-cta').classList.remove('ocult');
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function solicitarAuditoria() {
  const formUrl = '../../form/form.html?source=calculadora';
  window.location.href = formUrl;
}