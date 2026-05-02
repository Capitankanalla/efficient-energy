// Detectar idioma de l'URL
const urlParams = new URLSearchParams(window.location.search);
// Llegeix idioma guardat o es
const currentLang = urlParams.get("lang") || "es";


// Carrega traduccions del formulari
applyTranslations(currentLang);
// Aplicar traduccions
function applyTranslations(lang) {
  // Textos normals
  document.querySelectorAll("[data-lang]").forEach(el => {
    const key = el.getAttribute("data-lang");
    el.innerHTML = translations[lang][key];
  });

  // Placeholders
  document.querySelectorAll("[data-lang-placeholder]").forEach(el => {
    const key = el.getAttribute("data-lang-placeholder");
    el.placeholder = translations[lang][key];
  });

  // Select options
  document.querySelectorAll("[data-lang-select] option").forEach(opt => {
    const key = opt.getAttribute("data-lang");
    if (key) opt.textContent = translations[lang][key];
  });

  // Botó de tornar amb idioma
  const backLink = document.querySelector(".back-link");
  if (backLink) {
    backLink.href = `../index.html?lang=${lang}`;
  }
}

applyTranslations(currentLang);
