// Llegeix idioma guardat o es
const currentLang = localStorage.getItem("lang") || "es";

// Carrega traduccions del formulari
applyTranslations(currentLang);

// Traducció del botó "Volver"
const backLink = document.querySelector(".back-link");
if (backLink) {
  backLink.textContent = translations[currentLang].backLink;
}

// Lógica del popup legal de LOPD
const legalCheck = document.getElementById("legalCheck");
const submitBtn = document.querySelector("button[type='submit']");
const openPolicy = document.getElementById("openPolicy");

const popup = document.getElementById("privacyPopup");
const acceptBtn = document.getElementById("acceptPrivacy");
const rejectBtn = document.getElementById("rejectPrivacy");

// Desactivar checkbox i botó d'enviar
legalCheck.disabled = true;
submitBtn.disabled = true;

// Obrir popup
openPolicy.addEventListener("click", (e) => {
  e.preventDefault();
  popup.classList.remove("hidden");
});

// Acceptar
acceptBtn.addEventListener("click", () => {
  legalCheck.disabled = false;
  submitBtn.disabled = false;
  legalCheck.checked = true;
  popup.classList.add("hidden");
});

// Rebutjar
rejectBtn.addEventListener("click", () => {
  alert("Sense acceptar el tractament de dades no podem continuar.");
  window.location.href = "../index.html";
});
