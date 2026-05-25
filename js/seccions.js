// -----------------------------
// SECCIÓ 1: CONSULTOR
// -----------------------------
function carregarSeccioConsultor(info) {
    document.getElementById("wc-title").textContent = info.title;
    document.getElementById("wc-subtitle").textContent = info.subtitle;
    document.getElementById("wc-short").textContent = info.shortText;
    document.getElementById("wc-img").src = info.modalImage;
}


// -----------------------------
// SECCIÓ 2: COM TREBALLEM
// -----------------------------
function carregarSeccioComTreballem(info) {
    document.getElementById("hww-title").textContent = info.title;
    document.getElementById("hww-img").src = info.image;


    const ul = document.getElementById("hww-list");
    ul.innerHTML = "";

    info.steps.forEach(step => {
        const li = document.createElement("li");
        li.textContent = step;
        ul.appendChild(li);
    });
}

// -----------------------------
// SECCIÓ 3: CLIENTS (LOGOS + TESTIMONIS)
// -----------------------------
function carregarSeccioClients(info) {
    document.getElementById("clients-title").textContent = info.title;
    document.getElementById("clients-intro").textContent = info.intro;

    // --- CARRUSEL DE LOGOS ---
    const track = document.getElementById("carousel-track");
    track.innerHTML = "";

    // Logos originals
    info.logos.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Logo client";
        track.appendChild(img);
    });

    // Duplicats per scroll infinit
    info.logos.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Logo client";
        track.appendChild(img);
    });

    // --- TESTIMONIS ---
    const testimonials = document.getElementById("clients-testimonials");
    testimonials.innerHTML = "";

    info.quotes.forEach(q => {
        const div = document.createElement("div");
        div.classList.add("client-quote");
        div.textContent = q;
        testimonials.appendChild(div);
    });
}



// -----------------------------
// MODAL CONSULTOR
// -----------------------------
function prepararModalConsultor(info) {

    const btn = document.getElementById("wc-button");
    const modal = document.getElementById("info-modal");
    const closeBtn = document.getElementById("info-modal-close");
    const modalBody = document.getElementById("info-modal-body");
    const modalImg = document.getElementById("info-modal-image");

    const nouBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(nouBtn, btn);
    nouBtn.addEventListener("click", () => {

        // Carregar imatge
        modalImg.src = info.modalImage;

        // Carregar text llarg des del fitxer consultor.html
        fetch("./html/" + info.fullTextFile)
            .then(r => r.text())
            .then(html => {
                modalBody.innerHTML = html;
                modal.classList.add("open");
            });
    });

    closeBtn.addEventListener("click", () => {
        modal.classList.remove("open");
    });

    modal.addEventListener("click", e => {
        if (e.target === modal) modal.classList.remove("open");
    });

    // --------------------------------------
    //  Navegació opcions de subministrament
    // --------------------------------------

    document.querySelector('.opcio.llar').addEventListener('click', () => {
        window.location.href = './llar/llar.html';
    });
    document.querySelector('.opcio.negoci').addEventListener('click', () => {
        window.location.href = './negoci/negoci.html';
    });
    document.querySelector('.opcio.industria').addEventListener('click', () => {
        window.location.href = './industria/industria.html';
    });

}

