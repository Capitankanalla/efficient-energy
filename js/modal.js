// Obrir modal amb contingut legal
export function openLegalModal(id) {
    fetch('/json/legals.json')
        .then(res => res.json())
        .then(data => {
            const lang = localStorage.getItem("lang") || window.currentLang || "ca";
            const info = data[lang][id]; //const info = data[id];

            if (!info) return;

            document.getElementById("modal-title").textContent = info.titol;

            const body = document.getElementById("modal-body");
            body.innerHTML = "";

            info.contingut.forEach(paragraf => {
                const p = document.createElement("p");
                p.textContent = paragraf;
                body.appendChild(p);
            });

            document.getElementById("legal-modal").classList.add("open");
        });
}

// Tancar modal
export function closeLegalModal() {
    const modal = document.getElementById("legal-modal");
    if (modal) modal.classList.remove("open");
}

// Assignar tancament al botó X i clicant fora
const modalCloseHandler = (e) => {
    const modal = document.getElementById("legal-modal");
    if (!modal) return;

    const clickedClose = e.target.id === "modal-close" || e.target.closest("#modal-close");
    const clickedOutside = e.target.id === "legal-modal" || e.target === modal;

    if (clickedClose || clickedOutside) {
        closeLegalModal();
    }
};

document.addEventListener("click", modalCloseHandler);
