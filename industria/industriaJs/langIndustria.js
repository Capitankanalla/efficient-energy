// ------------------------------------------------------
// CARREGA L'IDIOMA A LA PÀGINA D'INDÚSTRIA
// ------------------------------------------------------
async function carregarIdiomaIndustria() {
    const lang = localStorage.getItem("lang") || "es";
    window.currentLang = lang;

    try {
        const data = await fetch(`/json/lang/${lang}.json`).then(r => r.json());
        const ind = data.industria;
        if (!ind) return;

        // HERO
        document.querySelector(".hero-industria h1").textContent = ind.heroTitle;
        document.querySelector(".hero-industria p").textContent = ind.heroSubtitle;
        document.querySelector(".cta-industria").textContent = ind.heroCta;
        document.querySelector(".back-link").textContent = ind.backLink;

        // SECCIÓ INTRO
        document.querySelector(".section-intro h2").textContent = ind.introTitle;
        document.querySelector(".section-intro .section-lead").textContent = ind.introLead;

        const ul = document.querySelector(".section-intro ul");
        ul.innerHTML = "";
        ind.introItems.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });

        // CARDS
        document.querySelector(".section-caracteristiques h2").textContent = ind.cardsTitle;
        document.querySelector('[data-id="energia"] h3').textContent = ind.cardEnergiaTitle;
        document.querySelector('[data-id="energia"] p').textContent = ind.cardEnergiaText;
        document.querySelector('[data-id="calendari"] h3').textContent = ind.cardCalendariTitle;
        document.querySelector('[data-id="calendari"] p').textContent = ind.cardCalendariText;
        document.querySelector('[data-id="reactiva"] h3').textContent = ind.cardReactivaTitle;
        document.querySelector('[data-id="reactiva"] p').textContent = ind.cardReactivaText;

        // CTA FINAL
        document.querySelector(".section-cta-final h2").textContent = ind.ctaTitle;
        document.querySelector(".section-cta-final .section-lead").textContent = ind.ctaLead;
        document.querySelector(".cta-secundari").textContent = ind.ctaSecundari;
        document.querySelector(".section-cta-final h2").textContent = ind.ctaFinalTitle;
        document.querySelector(".section-cta-final .section-lead").textContent = ind.ctaFinalLead;
        document.querySelector(".section-cta-final .cta-industria").textContent = ind.ctaFinalBtn;

        // CALCULADORA
        document.querySelector(".section-calculadora h2").textContent = ind.calcTitle;
        document.querySelector(".section-calculadora .section-lead").textContent = ind.calcLead;
        document.querySelector(".calculadora-placeholder p").textContent = ind.calcPlaceholder;
        document.querySelector(".section-calculadora .cta").textContent = data.calculator.button; 

    

    } catch (error) {
        console.error("Error carregant l'idioma a indústria:", error);
    }
}

carregarIdiomaIndustria();