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

let legalData = null;

fetch("../json/legals.json")
  .then(res => res.json())
  .then(data => legalData = data);


// Desactivar checkbox i botó d'enviar
legalCheck.disabled = true;
submitBtn.disabled = true;

// openPolicy.addEventListener("click", (e) => {
//   e.preventDefault();

//   if (!legalData) return;

//   const title = document.querySelector("#privacyPopup h2");
//   const text = document.querySelector("#privacyPopup p");

//   title.textContent = legalData.privacitat.titol;
//   text.innerHTML = legalData.privacitat.contingut
//     .map(line => `<p>${line}</p>`)
//     .join("");

//   popup.classList.remove("hidden");
// });

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
