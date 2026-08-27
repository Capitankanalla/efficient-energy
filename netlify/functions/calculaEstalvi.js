const tarifes20TD = require('../20TD.json');
const tarifes30TD = require('../30TD.json');
const tarifes61TD = require('../61TD.json');

const PERIODES_INDUSTRIA = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

function diesEntre(dataInici, dataFi) {
  if (!dataInici || !dataFi) return null;
  const inici = new Date(`${dataInici}T00:00:00Z`);
  const fi = new Date(`${dataFi}T00:00:00Z`);
  const dies = Math.round((fi - inici) / 86400000);
  return dies > 0 ? dies : null;
}

function esNumeroValid(valor, positiu = false) {
  return typeof valor === 'number' && Number.isFinite(valor) && (positiu ? valor > 0 : valor >= 0);
}

function campsValids(dades, camps, positius = false) {
  return camps.every(camp => esNumeroValid(dades[camp], positius));
}

function preuPotenciaMitjaAnual(segmentObj) {
  let suma = 0;
  let quantitat = 0;

  Object.values(segmentObj.productes).forEach(producte => {
    const variant = producte['3_preus'] || producte['1_preu'];
    if (variant && variant.potencia_kw_any) {
      suma += (variant.potencia_kw_any.p1 + variant.potencia_kw_any.p2) / 2;
      quantitat++;
    }
  });

  return quantitat ? suma / quantitat : 0;
}

function obtenirSubsegment(dades) {
  if (dades.segment === 'llar') return 'domestico';
  if (dades.mode === 'simplificat') {
    const preuMitja = preuPotenciaMitjaAnual(tarifes20TD.segments.negocio_menys_10kw);
    const kwEstimats = preuMitja > 0
      ? dades.importPotencia / ((preuMitja / 365) * dades.dies)
      : 0;
    return kwEstimats > 0 && kwEstimats <= 10 ? 'negocio_menys_10kw' : 'negocio_mes_10kw';
  }
  return Math.max(dades.potP1, dades.potP3) <= 10 ? 'negocio_menys_10kw' : 'negocio_mes_10kw';
}

function millorDescompte(productes, variantKey) {
  return Math.max(...Object.values(productes).map(producte => {
    const variant = producte[variantKey] || producte['1_preu'] || producte['3_preus'] || producte['6_preus'];
    return variant ? variant.descuento_percent : 0;
  }));
}

function calcular2TD(dades) {
  const dies = diesEntre(dades.dataInici, dades.dataFi);
  if (!dies) return { error: 'dates_factura' };
  dades.dies = dies;

  const segment = tarifes20TD.segments[obtenirSubsegment(dades)];
  if (!segment) return { error: 'producte' };

  if (dades.mode === 'simplificat') {
    if (!esNumeroValid(dades.importEnergia, true)) return { error: 'import_energia' };
    if (dades.segment === 'negoci' && !esNumeroValid(dades.importPotencia, true)) {
      return { error: 'import_potencia_negoci' };
    }

    const descompte = millorDescompte(segment.productes);
    if (!descompte) return { error: 'producte' };
    return { pct: descompte, estalviEur: dades.importEnergia * descompte / 100, dies, esViaSimplificada: true };
  }

  if (!campsValids(dades, ['potP1', 'potP3', 'preuPotActualP1', 'preuPotActualP3'])) {
    return { error: 'consum_preus' };
  }

  let consum;
  let consumTotal;
  let costActualEnergia;
  if (dades.periodesEnergia === 1) {
    if (!campsValids(dades, ['consumUnic', 'preuEnergiaUnic'], true)) return { error: 'consum_preus' };
    consumTotal = dades.consumUnic;
    consum = { p1: dades.consumUnic, p2: dades.consumUnic, p3: dades.consumUnic };
    costActualEnergia = dades.consumUnic * dades.preuEnergiaUnic;
  } else {
    const camps = ['consumP1', 'consumP2', 'consumP3', 'preuEnergiaP1', 'preuEnergiaP2', 'preuEnergiaP3'];
    if (!campsValids(dades, camps)) return { error: 'consum_preus' };
    consum = { p1: dades.consumP1, p2: dades.consumP2, p3: dades.consumP3 };
    consumTotal = dades.consumP1 + dades.consumP2 + dades.consumP3;
    if (consumTotal <= 0) return { error: 'consum_preus' };
    costActualEnergia = dades.consumP1 * dades.preuEnergiaP1
      + dades.consumP2 * dades.preuEnergiaP2
      + dades.consumP3 * dades.preuEnergiaP3;
  }

  const costActualPotencia = dades.potP1 * dades.preuPotActualP1 * dies
    + dades.potP3 * dades.preuPotActualP3 * dies;
  const costActual = costActualEnergia + costActualPotencia;
  if (costActual <= 0) return { error: 'consum_preus' };

  const variantKey = dades.periodesEnergia === 1 ? '1_preu' : '3_preus';
  let millor = null;
  Object.entries(segment.productes).forEach(([nom, producte]) => {
    const variant = producte[variantKey];
    if (!variant) return;
    const costNouEnergia = dades.periodesEnergia === 1
      ? consumTotal * variant.energia_con_descuento.p1
      : consum.p1 * variant.energia_con_descuento.p1
        + consum.p2 * variant.energia_con_descuento.p2
        + consum.p3 * variant.energia_con_descuento.p3;
    const costNouPotencia = dades.potP1 * variant.potencia_kw_any.p1 / 365 * dies
      + dades.potP3 * variant.potencia_kw_any.p2 / 365 * dies;
    const costNou = costNouEnergia + costNouPotencia;
    const pct = (costActual - costNou) / costActual * 100;
    if (!millor || pct > millor.pct) millor = { nom, pct, costNou };
  });

  if (!millor) return { error: 'producte' };
  return { pct: millor.pct, estalviEur: costActual - millor.costNou, dies, esViaSimplificada: false };
}

function calcularIndustria(dades) {
  const dies = diesEntre(dades.dataInici, dades.dataFi);
  if (!dies) return { error: 'dates_factura' };
  const tarifes = dades.altaTensio ? tarifes61TD : tarifes30TD;
  const productes = tarifes.segments.negocio.productes;

  if (dades.mode === 'simplificat') {
    if (!esNumeroValid(dades.importEnergia, true)) return { error: 'import_energia' };
    const descompte = millorDescompte(productes, '6_preus');
    if (!descompte) return { error: 'producte' };
    return { pct: descompte, estalviEur: dades.importEnergia * descompte / 100, dies, esViaSimplificada: true };
  }

  const campsPotencia = PERIODES_INDUSTRIA.flatMap(periode => [`pot${periode}`, `preuPot${periode}`]);
  if (!campsValids(dades, campsPotencia)) return { error: 'consum_preus' };

  let consum;
  let consumTotal;
  let costActualEnergia;
  if (dades.periodesEnergia === 1) {
    if (!campsValids(dades, ['consumUnic', 'preuEnergiaUnic'], true)) return { error: 'consum_preus' };
    consum = Object.fromEntries(PERIODES_INDUSTRIA.map(periode => [periode, dades.consumUnic]));
    consumTotal = dades.consumUnic;
    costActualEnergia = dades.consumUnic * dades.preuEnergiaUnic;
  } else {
    const campsEnergia = PERIODES_INDUSTRIA.flatMap(periode => [`consum${periode}`, `preuEnergia${periode}`]);
    if (!campsValids(dades, campsEnergia)) return { error: 'consum_preus' };
    consum = Object.fromEntries(PERIODES_INDUSTRIA.map(periode => [periode, dades[`consum${periode}`]]));
    consumTotal = Object.values(consum).reduce((total, valor) => total + valor, 0);
    if (consumTotal <= 0) return { error: 'consum_preus' };
    costActualEnergia = PERIODES_INDUSTRIA.reduce((total, periode) => total + consum[periode] * dades[`preuEnergia${periode}`], 0);
  }

  const costActualPotencia = PERIODES_INDUSTRIA.reduce((total, periode) => total + dades[`pot${periode}`] * dades[`preuPot${periode}`] * dies, 0);
  const costActual = costActualEnergia + costActualPotencia;
  if (costActual <= 0) return { error: 'consum_preus' };

  const variantKey = dades.periodesEnergia === 1 ? '1_preu' : '6_preus';
  let millor = null;
  Object.entries(productes).forEach(([nom, producte]) => {
    const variant = producte[variantKey];
    if (!variant) return;
    const costNouEnergia = dades.periodesEnergia === 1
      ? consumTotal * variant.energia_con_descuento.p1
      : PERIODES_INDUSTRIA.reduce((total, periode) => total + consum[periode] * variant.energia_con_descuento[periode], 0);
    const costNouPotencia = PERIODES_INDUSTRIA.reduce((total, periode) => total + dades[`pot${periode}`] * variant.potencia_kw_any[periode] / 365 * dies, 0);
    const costNou = costNouEnergia + costNouPotencia;
    const pct = (costActual - costNou) / costActual * 100;
    if (!millor || pct > millor.pct) millor = { nom, pct, costNou };
  });

  if (!millor) return { error: 'producte' };
  return { pct: millor.pct, estalviEur: costActual - millor.costNou, dies, esViaSimplificada: false };
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'metode_no_permes' }) };
  }

  try {
    const dades = JSON.parse(event.body || '{}');
    const resultat = dades.tarifa === 'industria' ? calcularIndustria(dades) : calcular2TD(dades);
    return {
      statusCode: resultat.error ? 400 : 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resultat)
    };
  } catch (error) {
    console.error('Error calculant l’estalvi:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'error_intern' })
    };
  }
};
