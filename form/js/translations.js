const translations = {
  es: {
    pageTitle: "Auditoría energética",
    backLink: "← Volver",
    formTitle: "Solicita tu auditoría energética",
    formSubtitle: "Analizamos tu consumo y detectamos oportunidades reales de ahorro.",

    namePlaceholder: "Nombre",
    emailPlaceholder: "Email",
    phonePlaceholder: "Teléfono",
    cupsPlaceholder: "Codigo CUPS",
    messagePlaceholder: "Coméntanos tu situación",

    cupsHelp: "El CUPS aparece en tu factura de luz y tiene el formato ES0031...",

    typeDefault: "Tipo de sumnistro",
    typeHome: "Hogar",
    typeBusiness: "Negocio",
    typeIndustry: "Industria",

    legalText: "Acepto la política de privacidad",
    submitBtn: "Solicitar auditoría",
    noteText: "Nuestro equipo de expertos te responderá en menos de 24h.",

    infoTitle: "¿Qué recibirás?",
    info1: "Análisis gratuito sin compromiso",
    info2: "Optimización de costes energéticos",
    info3: "Estudio personalizado",
    info4: "Respuesta en menos de 24h"
  },

  ca: {
    pageTitle: "Auditoria energètica",
    backLink: "← Tornar",
    formTitle: "Sol·licita la teva auditoria energètica",
    formSubtitle: "Analitzem el teu consum i detectem oportunitats reals d'estalvi.",

    namePlaceholder: "Nom",
    emailPlaceholder: "Correu electrònic",
    phonePlaceholder: "Telèfon",
    cupsPlaceholder: "Códi CUPS",
    messagePlaceholder: "Explica'ns la teva situació (opcional)",

    cupsHelp: "El CUPS apareix a la factura de la llum i té el format ES0031...",

    typeDefault: "Tipus de client",
    typeHome: "Llar",
    typeBusiness: "Negoci",
    typeIndustry: "Indústria",

    legalText: "Accepto la política de privacitat",
    submitBtn: "Sol·licitar auditoria",
    noteText: "El nostre equip d'experts et respondrà en menys de 24h.",

    infoTitle: "Què rebràs?",
    info1: "Anàlisi gratuït sense compromís",
    info2: "Optimització de costos energètics",
    info3: "Estudi personalitzat",
    info4: "Resposta en menys de 24h"
  },

  en: {
    pageTitle: "Energy audit",
    backLink: "← Back",
    formTitle: "Request your energy audit",
    formSubtitle: "We analyze your consumption and detect real saving opportunities.",

    namePlaceholder: "Name",
    emailPlaceholder: "Email",
    phonePlaceholder: "Phone",
    cupsPlaceholder: "CUPS (if you know it)",
    messagePlaceholder: "Tell us your situation",

    cupsHelp: "The CUPS appears on your electricity bill it has the format ES0031...",

    typeDefault: "Customer type",
    typeHome: "Home",
    typeBusiness: "Business",
    typeIndustry: "Industry",

    legalText: "I accept the privacy policy",
    submitBtn: "Request audit",
    noteText: "Our experts will contact you within 24h.", 

    infoTitle: "What will you receive?",
    info1: "Free analysis with no commitment",
    info2: "Energy cost optimization",
    info3: "Personalized study",
    info4: "Response within 24h"
  }
};

function applyTranslations(lang) {
  const t = translations[lang];
  if (!t) return;

  // Traducció de text (títols, paràgrafs, botons, etc.)
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.dataset.lang;
    if (t[key]) el.textContent = t[key];
  });

  // Traducció de placeholders (inputs i textarea)
  document.querySelectorAll("[data-lang-placeholder]").forEach(el => {
    const key = el.dataset.langPlaceholder;
    if (t[key]) el.placeholder = t[key];
  });

  // Traducció d'opcions de SELECT
  document.querySelectorAll("option[data-lang]").forEach(el => {
    const key = el.dataset.lang;
    if (t[key]) el.textContent = t[key];
  });
}
