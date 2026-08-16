// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA D'ESTALVI ENERGÈTIC — 2.0TD (Llar + Negoci)
//
// Fase actual: NOMÉS 2.0TD. Un cop validada la lògica i integrada al codi,
// es replicarà el mateix model per a 3.0TD i 6.1TD (indústria), i només
// llavors s'afegirà la capa d'idiomes.
//
// Fonts de dades reals: /json/20td.json (mai preus hardcodejats).
// El client MAI veu preus ni comissions — només el % d'estalvi final.
// ═══════════════════════════════════════════════════════════════════════════

const RUTA_TARIFES_20TD = '../netlify/20TD.json'; 
const LLINDAR_ESTALVI_MINIM = 10; // % — per sota d'això, no es mostra percentatge

// ─── ESTAT GLOBAL ─────────────────────────────────────────────────────────
let tarifes20TD     = null;  // contingut del JSON, carregat una vegada
let entradaSegment  = null;  // 'llar' | 'negoci'
let periodesEnergia = 1;     // 1 | 3

// ─── INICIALITZACIÓ ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarTarifes20TD();
});

async function carregarTarifes20TD() {
  try {
    const res = await fetch(RUTA_TARIFES_20TD);
    tarifes20TD = await res.json();
  } catch (e) {
    mostrarError('No s\u2019han pogut carregar les tarifes. Torna-ho a provar més tard.');
    console.error('Error carregant 20td.json', e);
  }
}

// ─── NAVEGACIÓ ENTRE PASSOS ───────────────────────────────────────────────
function anarA(idPas) {
  document.querySelectorAll('.wizard-step').forEach(sec => sec.classList.add('ocult'));
  document.getElementById(idPas).classList.remove('ocult');
  ocultarResultat();
  actualitzarProgres(idPas);
}

function tornarA(idPas) {
  anarA(idPas);
}

function actualitzarProgres(idPas) {
  const mapa = { 'pas-segment': 1, 'pas-pot-coneguda': 2, 'pas-detall': 3, 'pas-simple': 3 };
  const actual = mapa[idPas] || 1;
  document.querySelectorAll('.progress-step').forEach(s => {
    const n = parseInt(s.dataset.step, 10);
    s.classList.toggle('active', n === actual);
    s.classList.toggle('done', n < actual);
  });
}

// ─── PAS 1: SEGMENT ───────────────────────────────────────────────────────
function triarSegment(seg) {
  entradaSegment = seg; // 'llar' | 'negoci'
  document.querySelectorAll('.segment-card').forEach(c => c.classList.remove('active'));
  event.currentTarget.classList.add('active');

  const ajuda = document.getElementById('ajuda-import-potencia');
  if (ajuda) {
    ajuda.textContent = seg === 'negoci'
      ? 'Aquest import ens ajuda a estimar la teva potència contractada.'
      : 'Aquest import és opcional per a llars, però ens ajuda a validar millor l\u2019estimació.';
  }

  anarA('pas-pot-coneguda');
}

// ─── PAS 2: SAPS LA POTÈNCIA? ─────────────────────────────────────────────
function triarPotConeguda(valor) {
  document.getElementById('btn-pot-si').classList.toggle('active', valor === true);
  document.getElementById('btn-pot-no').classList.toggle('active', valor === false);
  anarA(valor ? 'pas-detall' : 'pas-simple');
}

// ─── PAS 3A: PERÍODES D'ENERGIA (1 vs 3) ──────────────────────────────────
function triarPeriodesEnergia(n) {
  periodesEnergia = n;
  document.getElementById('btn-periode-1').classList.toggle('active', n === 1);
  document.getElementById('btn-periode-3').classList.toggle('active', n === 3);
  document.getElementById('camps-energia-1preu').classList.toggle('ocult', n !== 1);
  document.getElementById('camps-energia-3preus').classList.toggle('ocult', n !== 3);
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

function mostrarError(msg) {
  const el = document.getElementById('error-msg');
  el.textContent = msg;
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

// Preu mitjà de potència (€/kW/any) d'un segment, fent la mitjana entre
// tots els productes disponibles. Només serveix com a referència per
// estimar la potència contractada quan el lead no la sap.
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

// ─── RESOLUCIÓ DE SUBSEGMENT ──────────────────────────────────────────────
// Via detallada: potència real coneguda (kW)
function resolSubsegmentDetallat(potP1, potP3) {
  if (entradaSegment === 'llar') return 'domestico';
  const potRef = Math.max(potP1, potP3);
  return potRef <= 10 ? 'negocio_menys_10kw' : 'negocio_mes_10kw';
}

// Via simplificada: s'estima la potència a partir de l'import pagat,
// provant primer la hipòtesi "negoci petit" (menys de 10kW). Si amb el
// seu propi preu de referència ja surt una potència estimada > 10kW,
// vol dir que en realitat pertany al segment "negoci gran".
function resolSubsegmentSimple(importPotencia, dies) {
  if (entradaSegment === 'llar') return 'domestico';

  const refMenys = preuPotenciaMitjaAnual(tarifes20TD.segments.negocio_menys_10kw);
  const kwEstMenys = refMenys > 0 ? importPotencia / ((refMenys / 365) * dies) : 0;

  if (kwEstMenys > 0 && kwEstMenys <= 10) return 'negocio_menys_10kw';
  return 'negocio_mes_10kw';
}

// ─── VIA DETALLADA: CÀLCUL ────────────────────────────────────────────────
function calcularDetallat() {
  ocultarResultat();

  const potP1 = val('d-pot-p1');
  const potP3 = val('d-pot-p3');
  const dies = diesEntre('d-data-inici', 'd-data-fi');

  if (!dies) { mostrarError('Introdueix les dates de la factura.'); return; }

  let consumTotal = 0, costActualEnergia = 0;
  const consum = {}, preuActual = {};

  if (periodesEnergia === 1) {
    const e = val('d-e-unic');
    const p = val('d-pe-unic');
    if (!e || !p) { mostrarError('Omple els camps de consum i preu actuals.'); return; }
    consumTotal = e;
    costActualEnergia = e * p;
    consum.p1 = e; consum.p2 = e; consum.p3 = e;
  } else {
    consum.p1 = val('d-e-p1'); consum.p2 = val('d-e-p2'); consum.p3 = val('d-e-p3');
    preuActual.p1 = val('d-pe-p1'); preuActual.p2 = val('d-pe-p2'); preuActual.p3 = val('d-pe-p3');
    consumTotal = consum.p1 + consum.p2 + consum.p3;
    if (!consumTotal || (!preuActual.p1 && !preuActual.p2 && !preuActual.p3)) {
      mostrarError('Omple els camps de consum i preus actuals.'); return;
    }
    costActualEnergia = consum.p1 * preuActual.p1 + consum.p2 * preuActual.p2 + consum.p3 * preuActual.p3;
  }

  const preuPotActualP1 = val('d-pp-p1');
  const preuPotActualP3 = val('d-pp-p3');
  const costActualPotencia = potP1 * preuPotActualP1 * dies + potP3 * preuPotActualP3 * dies;
  const costActual = costActualEnergia + costActualPotencia;

  if (costActual <= 0) { mostrarError('Omple els camps de consum i preus actuals.'); return; }

  const subsegment = resolSubsegmentDetallat(potP1, potP3);
  const variantKey = periodesEnergia === 1 ? '1_preu' : '3_preus';
  const segmentObj = tarifes20TD.segments[subsegment];

  let millor = null; // { nom, estalviPct, costNou }

  Object.entries(segmentObj.productes).forEach(([nom, producte]) => {
    const variant = producte[variantKey];
    if (!variant) return; // aquest producte no ofereix aquesta modalitat

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

  if (!millor) { mostrarError('No hi ha cap producte disponible per a aquest perfil.'); return; }

  const estalviEur = costActual - millor.costNou;
  mostrarResultat(millor.estalviPct, estalviEur, dies, false);
}

// ─── VIA SIMPLIFICADA: CÀLCUL ─────────────────────────────────────────────
function calcularSimplificat() {
  ocultarResultat();

  const dies = diesEntre('s-data-inici', 's-data-fi');
  if (!dies) { mostrarError('Introdueix les dates de la factura.'); return; }

  const importEnergia = val('s-import-energia');
  const importPotencia = val('s-import-potencia');

  if (!importEnergia) { mostrarError('Introdueix almenys l\u2019import d\u2019energia.'); return; }
  if (entradaSegment === 'negoci' && !importPotencia) {
    mostrarError('Per a \u2018Negoci\u2019 necessitem l\u2019import de potència per acotar la teva tarifa.'); return;
  }

  const subsegment = resolSubsegmentSimple(importPotencia, dies);
  const segmentObj = tarifes20TD.segments[subsegment];

  // S'agafa el producte amb més % de descompte disponible al segment.
  // El descompte és el mateix independentment de la variant (1/3 preus),
  // així que no cal saber com paga el lead les seves franges.
  let millorDescompte = 0;
  Object.values(segmentObj.productes).forEach(producte => {
    const variant = producte['3_preus'] || producte['1_preu'];
    if (variant && variant.descuento_percent > millorDescompte) {
      millorDescompte = variant.descuento_percent;
    }
  });

  if (!millorDescompte) { mostrarError('No hi ha cap producte disponible per a aquest perfil.'); return; }

  const estalviEur = importEnergia * (millorDescompte / 100);
  mostrarResultat(millorDescompte, estalviEur, dies, true);
}

// ─── RESULTAT ─────────────────────────────────────────────────────────────
function mostrarResultat(pct, estalviEur, dies, esViaSimplificada) {
  const el = document.getElementById('resultat');
  const pctArrodonit = Math.round(pct);

  if (pctArrodonit < LLINDAR_ESTALVI_MINIM) {
    el.classList.add('condicions-bones');
    el.innerHTML = `
      <strong>Les teves condicions ja són bones</strong>
      <p style="margin-top:8px">Amb les dades disponibles, el marge d\u2019estalvi és reduït. Recomanem enviar-nos la teva factura perquè el nostre equip la revisi i validi si hi ha marge real de millora.</p>
    `;
    el.classList.remove('ocult');
    document.getElementById('cta-text').textContent = 'T\u2019ajudem a confirmar-ho amb una auditoria gratuïta de la teva factura.';
    document.getElementById('bloc-cta').classList.remove('ocult');
    return;
  }

  const anual = (estalviEur * (365 / dies)).toFixed(0);
  el.innerHTML = `
    <span class="estalvi-pct">${pctArrodonit}%</span>
    <span class="estalvi-label">d'estalvi estimat</span>
    Estalvi en aquesta factura: <strong>${estalviEur.toFixed(2)} €</strong><br>
    Estalvi anual estimat: <strong>${anual} €</strong>
    ${esViaSimplificada ? '<span class="estalvi-avis">Estimació orientativa sobre la part d\u2019energia. La potència es validarà amb l\u2019auditoria de la factura.</span>' : ''}
  `;
  el.classList.remove('ocult');

  document.getElementById('cta-text').textContent = 'T\u2019ajudem a confirmar-ho amb una auditoria gratuïta de la teva factura.';
  document.getElementById('bloc-cta').classList.remove('ocult');
}

// ─── CTA ──────────────────────────────────────────────────────────────────
function solicitarAuditoria() {
  // TODO: connecta aquí el teu formulari de leads o redirecció
  alert('Formulari / lead form aquí');
}
