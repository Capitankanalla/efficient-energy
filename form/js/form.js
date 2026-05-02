// Llegeix idioma guardat o es
const currentLang = localStorage.getItem("lang") || "es";

// Carrega traduccions del formulari
applyTranslations(currentLang);

// Traducció del botó "Volver"
const backLink = document.querySelector(".back-link");
if (backLink) {
  backLink.textContent = translations[currentLang].backLink;
}
