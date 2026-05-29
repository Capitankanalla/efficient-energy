// Obrir modal amb contingut legal
export function openLegalModal(id) {
    fetch('./json/legals.json')
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
    document.getElementById("legal-modal").classList.remove("open");
}
// Assignar tancament al botó X i clicant fora
document.addEventListener("click", e => {
    if (e.target.id === "modal-close") closeLegalModal();
    if (e.target.id === "legal-modal") closeLegalModal();
});
// // Tancar modal
// export function closeLegalModal() {
//     document.getElementById("legal-modal").classList.remove("open");
// }

// // Assignar tancament al botó X
// document.addEventListener("DOMContentLoaded", () => {
//     const closeBtn = document.getElementById("modal-close");
//     if (closeBtn) closeBtn.addEventListener("click", closeLegalModal);

//     // Tancar clicant fora
//     window.addEventListener("click", e => {
//         if (e.target.id === "legal-modal") closeLegalModal();
//     });
// });
