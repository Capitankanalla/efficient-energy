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
const openPolicy = document.getElementById("openPolicyPopup");

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

// Obrir popup
openPolicy.addEventListener("click", (e) => {
  e.preventDefault();
  if (legalData) {
    const info = legalData[currentLang]?.["privacitat"] ?? legalData["privacitat"];
    if (info) {
      document.querySelector('#privacyPopup [data-lang="privacyTitle"]').textContent = info.titol;
      const body = document.getElementById("privacyBody");
      body.innerHTML = "";
      info.contingut.forEach(paragraf => {
        const p = document.createElement("p");
        p.textContent = paragraf;
        body.appendChild(p);
      });
    }
  }
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
