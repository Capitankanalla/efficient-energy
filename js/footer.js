import { openLegalModal } from './modal.js';

// Carregar footer.html i després injectar dades
fetch('./html/footer.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);

        // Any automàtic
        const any = document.getElementById('any');
        if (any) any.textContent = new Date().getFullYear();

        // Ara carreguem el JSON del footer
        carregarFooterJSON();
    });

function carregarFooterJSON() {
    fetch('./json/footer.json')
        .then(res => res.json())
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
            document.getElementById("footer-empresa").textContent = data.empresa;
            document.getElementById("footer-adreca").textContent = data.adreca;
            document.getElementById("footer-email").textContent = data.email;
            document.getElementById("footer-telefon").textContent = data.telefon;

            // Copyright
            const copy = document.getElementById("footer-copy-empresa");
            if (copy) copy.textContent = data.empresa;

            // Bloc legal
            const legalList = document.getElementById("footer-legal");
            legalList.innerHTML = "";

            data.legal.forEach(item => {
                const li = document.createElement("li");
                const span = document.createElement("span");

                span.textContent = item.text;
                span.dataset.legal = item.id;

                // Obrir modal en clicar
                span.addEventListener("click", () => openLegalModal(item.id));

                li.appendChild(span);
                legalList.appendChild(li);
            });
        });
}
