// ------------------------------------------------------
// IDIOMA PER DEFECTE
// ------------------------------------------------------
let currentLang = "es";   // La web ha de carregar en castellà

// ------------------------------------------------------
// CARREGA UN IDIOMA
// ------------------------------------------------------
async function loadLanguage(lang) {
    window.currentLang = lang;
    //window.currentLang = lang; // opcional però recomanat

    try {
        const response = await fetch(`json/lang/${lang}.json`);
        const data = await response.json();

        applyTranslations(data);
        updateActiveButton(lang);
        carregarFooterJSON();

        // 🔥 AIXÒ ÉS EL QUE ET FALTA
        // if (typeof carregarFooterJSON === "function") {
        //     carregarFooterJSON();
        // }

    } catch (error) {
        console.error("Error carregant l'idioma:", error);
    }
}
// async function loadLanguage(lang) {
//     currentLang = lang;

//     try {
//         const response = await fetch(`json/lang/${lang}.json`);
//         const data = await response.json();

//         applyTranslations(data);
//         updateActiveButton(lang);

//     } catch (error) {
//         console.error("Error carregant l'idioma:", error);
//     }
// }

// ------------------------------------------------------
// APLICA LES TRADUCCIONS AL DOM
// ------------------------------------------------------
function applyTranslations(data) {

    // -----------------------------
    // HERO
    // -----------------------------
    if (data.hero) {
        document.querySelector(".hero-content h1").textContent = data.hero.title;
        document.querySelector(".hero-content p").textContent = data.hero.subtitle;
        document.querySelector(".hero-content .cta").textContent = data.hero.cta;
    }

    // -----------------------------
    // SELECTOR
    // -----------------------------
    if (data.selector) {
        document.querySelector("#selector h2").textContent = data.selector.title;
        document.querySelector(".opcio.llar .titol").textContent = data.selector.llar;
        document.querySelector(".opcio.negoci .titol").textContent = data.selector.negoci;
        document.querySelector(".opcio.industria .titol").textContent = data.selector.industria;
    }

    // -----------------------------
    // WHY CONSULTANT
    // -----------------------------
    if (data.whyConsultant) {
        document.querySelector("#wc-title").textContent = data.whyConsultant.title;
        document.querySelector("#wc-subtitle").textContent = data.whyConsultant.subtitle;
        document.querySelector("#wc-short").textContent = data.whyConsultant.shortText;
        document.querySelector("#wc-button").textContent = data.whyConsultant.button;
        document.querySelector("#wc-img").src = data.whyConsultant.image;
    }

    // -----------------------------
    // HOW WE WORK
    // -----------------------------
    if (data.howWeWork) {
        document.querySelector("#hww-title").textContent = data.howWeWork.title;
        document.querySelector("#hww-img").src = data.howWeWork.image;

        const list = document.querySelector("#hww-list");
        list.innerHTML = "";
        data.howWeWork.steps.forEach(step => {
            const li = document.createElement("li");
            li.textContent = step;
            list.appendChild(li);
        });
    }

    // -----------------------------
    // CLIENTS
    // -----------------------------
    if (data.clients) {
        document.querySelector("#clients-title").textContent = data.clients.title;
        document.querySelector("#clients-intro").textContent = data.clients.intro;

        // LOGOS
        const track = document.querySelector("#carousel-track");
        track.innerHTML = "";
        data.clients.logos.forEach(src => {
            const img = document.createElement("img");
            img.src = src;
            track.appendChild(img);
        });

        // TESTIMONIALS
        const testimonials = document.querySelector("#clients-testimonials");
        testimonials.innerHTML = "";
        data.clients.quotes.forEach(q => {
            const p = document.createElement("p");
            p.textContent = q;
            testimonials.appendChild(p);
        });
    }
    carregarSeccioConsultor(data.whyConsultant);
    carregarSeccioComTreballem(data.howWeWork);
    carregarSeccioClients(data.clients);
    prepararModalConsultor(data.whyConsultant);

}

// ------------------------------------------------------
// MARCA EL BOTÓ ACTIU
// ------------------------------------------------------
function updateActiveButton(lang) {
    document.querySelectorAll(".lang-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.lang === lang);
    });
}

// ------------------------------------------------------
// EVENT LISTENERS DELS BOTONS
// ------------------------------------------------------
document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        loadLanguage(btn.dataset.lang);
    });
});

// ------------------------------------------------------
// CARREGA L'IDIOMA PER DEFECTE
// ------------------------------------------------------
loadLanguage(currentLang);
