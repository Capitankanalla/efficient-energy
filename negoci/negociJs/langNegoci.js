async function carregarIdiomaNegoci() {
    const lang = localStorage.getItem("lang") || "es";
    window.currentLang = lang;

    try {
        const data = await fetch(`/json/lang/${lang}.json`).then(r => r.json());
        const neg = data.negoci;
        if (!neg) return;

        // HERO
        document.querySelector(".hero-negoci h1").textContent = neg.heroTitle;
        document.querySelector(".hero-negoci p").textContent = neg.heroSubtitle;
        document.querySelector(".cta-negoci").textContent = neg.heroCta;
        document.querySelector(".back-link").textContent = neg.backLink;

        // SECCIÓ INTRO
        document.querySelector(".section-intro h2").textContent = neg.introTitle;
        document.querySelector(".section-intro .section-lead").textContent = neg.introLead;

        const ul = document.querySelector(".section-intro ul");
        ul.innerHTML = "";
        neg.introItems.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });

        // CARDS
        document.querySelector(".section-caracteristiques h2").textContent = neg.cardsTitle;
        document.querySelector('[data-id="tarifa"] h3').textContent = neg.cardTarifaTitle;
        document.querySelector('[data-id="tarifa"] p').textContent = neg.cardTarifaText;
        document.querySelector('[data-id="calendari"] h3').textContent = neg.cardCalendariTitle;
        document.querySelector('[data-id="calendari"] p').textContent = neg.cardCalendariText;
        document.querySelector('[data-id="factura"] h3').textContent = neg.cardFacturaTitle;
        document.querySelector('[data-id="factura"] p').textContent = neg.cardFacturaText;

        // CALCULADORA
        document.querySelector(".section-calculadora h2").textContent = neg.calcTitle;
        document.querySelector(".section-calculadora .section-lead").textContent = neg.calcLead;
        document.querySelector(".calculadora-placeholder p").textContent = neg.calcPlaceholder;

        // CTA FINAL
        document.querySelector(".section-cta-final h2").textContent = neg.ctaFinalTitle;
        document.querySelector(".section-cta-final .section-lead").textContent = neg.ctaFinalLead;
        document.querySelector(".section-cta-final .cta-negoci").textContent = neg.ctaFinalBtn;
        document.querySelector(".cta-secundari").textContent = neg.ctaSecundari;

    } catch (error) {
        console.error("Error carregant l'idioma a negoci:", error);
    }
}

carregarIdiomaNegoci();