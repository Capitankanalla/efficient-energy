// Carrega dinàmica del footer
fetch('./html/footer.html')
    .then(res => res.text())
    .then(html => {
        document.body.insertAdjacentHTML('beforeend', html);

        // Inserir l'any automàticament
        const any = document.getElementById('any');
        if (any) any.textContent = new Date().getFullYear();
    })
    .catch(err => console.error("Error carregant el footer:", err));
