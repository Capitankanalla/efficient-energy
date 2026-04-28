// Idioma predeterminat
let currentLang = "es";

// Carrega un idioma
async function loadLanguage(lang) {
    currentLang = lang;

    try {
        const response = await fetch(`data/lang/${lang}.json`);
        const data = await response.json();

        applyTranslations(data);
        updateActiveButton(lang);

    } catch (error) {
        console.error("Error carregant l'idioma:", error);
    }
}

// Aplica les traduccions al DOM
function applyTranslations(data) {

    // HERO
    if (data.hero) {
        document.querySelector(".hero-content h1").textContent = data.hero.title;
        document.querySelector(".hero-content p").textContent = data.hero.subtitle;
        document.querySelector(".hero-content .cta").textContent = data.hero.cta;
    }

    // SELECTOR
    if (data.selector) {
        document.querySelector("#selector h2").textContent = data.selector.title;
        document.querySelector(".opcio.llar .titol").textContent = data.selector.llar;
        document.querySelector(".opcio.negoci .titol").textContent = data.selector.negoci;
        document.querySelector(".opcio.industria .titol").textContent = data.selector.industria;
    }

    // WHY CONSULTANT
    if (data.whyConsultant) {
        document.querySelector("#whyConsultantTitle").textContent = data.whyConsultant.title;
        document.querySelector("#whyConsultantShort").textContent = data.whyConsultant.shortText;
        document.querySelector("#whyConsultantBtn").textContent = data.whyConsultant.button;
    }

    // HOW WE WORK
    if (data.howWeWork) {
        document.querySelector("#howWeWorkTitle").textContent = data.howWeWork.title;

        const stepsList = document.querySelector("#howWeWorkSteps");
        if (stepsList) {
            stepsList.innerHTML = "";
            data.howWeWork.steps.forEach(step => {
                const li = document.createElement("li");
                li.textContent = step;
                stepsList.appendChild(li);
            });
        }
    }

    // CLIENTS
    if (data.clients) {
        document.querySelector("#clientsTitle").textContent = data.clients.title;
        document.querySelector("#clientsIntro").textContent = data.clients.intro;

        const quotesContainer = document.querySelector("#clientsQuotes");
        if (quotesContainer) {
            quotesContainer.innerHTML = "";
            data.clients.quotes.forEach(q => {
                const p = document.createElement("p");
                p.textContent = q;
                quotesContainer.appendChild(p);
            });
        }
    }
}

// Marca el botó actiu
function updateActiveButton(lang) {
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });
}

// Event listeners dels botons
document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        loadLanguage(btn.dataset.lang);
    });
});

// Carrega l’idioma predeterminat
loadLanguage(currentLang);
