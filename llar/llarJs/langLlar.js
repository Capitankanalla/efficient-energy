async function carregarIdiomaLlar() {
    const lang = localStorage.getItem("lang") || "es";
    window.currentLang = lang;

    try {
        const data = await fetch(`/json/lang/${lang}.json`).then(r => r.json());
        const llar = data.llar;
        if (!llar) return;

        // HERO
        document.querySelector(".hero-llar h1").textContent = llar.heroTitle;
        document.querySelector(".hero-llar p").textContent = llar.heroSubtitle;
        document.querySelector(".cta-llar").textContent = llar.heroCta;
        document.querySelector(".back-link").textContent = llar.backLink;

        // SECCIÓ INTRO
        document.querySelector(".section-intro h2").textContent = llar.introTitle;
        document.querySelector(".section-intro .section-lead").textContent = llar.introLead;

        const ul = document.querySelector(".section-intro ul");
        ul.innerHTML = "";
        llar.introItems.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });

        // CARDS
        document.querySelector(".section-caracteristiques h2").textContent = llar.cardsTitle;
        document.querySelector('[data-id="tarifa"] h3').textContent = llar.cardTarifaTitle;
        document.querySelector('[data-id="tarifa"] p').textContent = llar.cardTarifaText;
        document.querySelector('[data-id="discriminacio"] h3').textContent = llar.cardDiscriminacioTitle;
        document.querySelector('[data-id="discriminacio"] p').textContent = llar.cardDiscriminacioText;
        document.querySelector('[data-id="autoconsum"] h3').textContent = llar.cardAutoconsumTitle;
        document.querySelector('[data-id="autoconsum"] p').textContent = llar.cardAutoconsumText;

        // CALCULADORA
        document.querySelector(".section-calculadora h2").textContent = llar.calcTitle;
        document.querySelector(".section-calculadora .section-lead").textContent = llar.calcLead;
        document.querySelector(".calculadora-placeholder p").textContent = llar.calcPlaceholder;

        // CTA FINAL
        document.querySelector(".section-cta-final h2").textContent = llar.ctaFinalTitle;
        document.querySelector(".section-cta-final .section-lead").textContent = llar.ctaFinalLead;
        document.querySelector(".section-cta-final .cta-llar").textContent = llar.ctaFinalBtn;
        document.querySelector(".cta-secundari").textContent = llar.ctaSecundari;

    } catch (error) {
        console.error("Error carregant l'idioma a llar:", error);
    }
}

carregarIdiomaLlar();