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


// Desactivar botó d'enviar fins que s'accepti la política
let policyAccepted = false;
submitBtn.disabled = true;

// Alert si clica el checkbox sense haver llegit la política
legalCheck.addEventListener("click", (e) => {
  if (!policyAccepted) {
    e.preventDefault();
    alert(translations[currentLang].clickPolicyAlert || "Primer llegeix la política de privacitat.");
  }
});

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
  policyAccepted = true;
  submitBtn.disabled = false;
  legalCheck.checked = true;
  popup.classList.add("hidden");
});

// Rebutjar
rejectBtn.addEventListener("click", () => {
  alert(translations[currentLang].rejectAlert);
  window.location.href = "../index.html";
});
// POPUP D'AGRAÏMENT
const thankyouPopup = document.getElementById("thankyouPopup");
const closeThankyou = document.getElementById("closeThankyou");

function showThankyouPopup() {
  thankyouPopup.classList.remove("hidden");

  // Tancar automàticament als 10 segons
  setTimeout(() => {
    thankyouPopup.classList.add("hidden");
    window.location.href = "../index.html";
  }, 10000);
}

// Tancar manualment amb la X
closeThankyou.addEventListener("click", () => {
  thankyouPopup.classList.add("hidden");
  window.location.href = "../index.html";
});

// Tancar clicant fora
thankyouPopup.addEventListener("click", (e) => {
  if (e.target === thankyouPopup) {
    thankyouPopup.classList.add("hidden");
    window.location.href = "../index.html";
  }
});

// Esperem que HubSpot carregui i registri els seus events globals
document.addEventListener("DOMContentLoaded", () => {
    // HONEYPOT — bloqueig abans d'enviar
  document.getElementById("leadForm").addEventListener("submit", (e) => {
    const hp1 = document.getElementById("hp_token").value.trim();
    const hp2 = document.getElementById("hp_extra").value.trim();

    if (hp1 !== "" || hp2 !== "") {
      e.preventDefault();
      return; // Bot detectat → no enviem res
    }
  });

  const interval = setInterval(() => {
    // Quan HubSpot estigui llest, aquest event existirà
    if (window.hsForms) {
      clearInterval(interval);

      window.addEventListener("hs-form-event:on-form-submit", () => {
        showThankyouPopup();

        const leadForm = document.getElementById("leadForm");
        if (leadForm) leadForm.reset();

        const legalCheck = document.getElementById("legalCheck");
        const submitBtn = document.querySelector("button[type='submit']");
        if (legalCheck) legalCheck.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
      });
    }
  }, 100);
});
