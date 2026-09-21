// Carregar footer.html i després injectar dades
fetch('/html/footer.html')
    .then(res => {
        if (!res.ok) throw new Error(`Footer no trobat: ${res.status}`);
        return res.text();
    })
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
        window.carregarFooterJSON();
        // Any automàtic
        const any = document.getElementById('any');
        if (any) any.textContent = new Date().getFullYear();
    })
    .catch(error => {
        console.error('Error carregant footer:', error);
    });

function carregarFooterJSON() {
    const lang = window.currentLang || "ca";
    const langFile = lang.charAt(0).toUpperCase() + lang.slice(1);
    fetch(`/json/lang/footer${langFile}.json`)
        .then(res => {
            if (!res.ok) throw new Error(`JSON del footer no trobat: ${res.status}`);
            return res.json();
        })
        .then(data => {

            // Logo
            const logo = document.getElementById("footer-logo");
            if (logo) {
                logo.src = data.logo;
                logo.alt = data.empresa;
            }

            // Frase
            const frase = document.getElementById("footer-frase");
            if (frase) frase.textContent = data.frase;

            // Contacte
            const contacteTitol = document.getElementById("footer-contacte-titol");
            if (contacteTitol) contacteTitol.textContent = data.contacte;

            document.getElementById("footer-empresa").textContent = data.empresa;
            document.getElementById("footer-adreca").textContent = data.adreca;
            document.getElementById("footer-email").textContent = data.email;
            document.getElementById("footer-telefon").textContent = data.telefon;

            // Copyright
            const copy = document.getElementById("footer-copy-empresa");
            if (copy) copy.textContent = data.empresa;
            const drets = document.getElementById("drets");
            if (drets) drets.textContent = data.drets;

            // Bloc legal
            const legalList = document.getElementById("footer-legal");
            legalList.innerHTML = "";

            data.legal.forEach(item => {
                const li = document.createElement("li");
                const span = document.createElement("span");

                span.textContent = item.text;
                span.dataset.legal = item.id;

                // Obrir modal en clicar
                span.addEventListener("click", async () => {
                    try {
                        const response = await fetch('/json/legals.json');
                        const legalData = await response.json();
                        const lang = localStorage.getItem('lang') || window.currentLang || 'ca';
                        const info = legalData[lang]?.[item.id] ?? legalData[item.id];

                        if (!info) return;

                        const titleEl = document.getElementById('modal-title');
                        const bodyEl = document.getElementById('modal-body');
                        const modalEl = document.getElementById('legal-modal');

                        if (titleEl) titleEl.textContent = info.titol;
                        if (bodyEl) {
                            bodyEl.innerHTML = '';
                            info.contingut.forEach(paragraf => {
                                const p = document.createElement('p');
                                p.textContent = paragraf;
                                bodyEl.appendChild(p);
                            });
                        }
                        if (modalEl) modalEl.classList.add('open');
                    } catch (error) {
                        console.error('Error carregant legal modal:', error);
                    }
                });

                li.appendChild(span);
                legalList.appendChild(li);
            });
        });
        
}

window.carregarFooterJSON = carregarFooterJSON;

