🍔 1. MENÚ HAMBURGUESA RESPONSIVE
🔹 HTML (posa-ho just dins <body> abans del <header class="hero">)
html
<!-- NAVBAR -->
<nav class="navbar">
    <div class="logo">Efficient Energy</div>

    <div class="hamburger" id="hamburger">
        <span></span>
        <span></span>
        <span></span>
    </div>

    <ul class="nav-links" id="nav-links">
        <li><a href="#selector">Subministraments</a></li>
        <li><a href="#consells">Consells</a></li>
        <li><a href="#contacte">Contacte</a></li>
        <li><a href="#legal">Legal</a></li>
    </ul>
</nav>
🔹 CSS (afegeix-ho al teu styles.css)
css
/* NAVBAR */
.navbar {
    position: fixed;
    top: 0;
    width: 100%;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    z-index: 999;
}

.navbar .logo {
    font-size: 1.2rem;
    font-weight: bold;
}

/* Hamburguesa */
.hamburger {
    width: 30px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.hamburger span {
    height: 3px;
    background: white;
    border-radius: 3px;
    transition: 0.3s;
}

/* Menú ocult per defecte */
.nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    height: 100vh;
    width: 60%;
    background: #111;
    list-style: none;
    padding-top: 80px;
    transition: 0.4s;
}

.nav-links li {
    margin: 20px;
}

.nav-links a {
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
}

/* Quan està obert */
.nav-links.open {
    right: 0;
}

/* Animació hamburguesa */
.hamburger.active span:nth-child(1) {
    transform: translateY(8px) rotate(45deg);
}
.hamburger.active span:nth-child(2) {
    opacity: 0;
}
.hamburger.active span:nth-child(3) {
    transform: translateY(-8px) rotate(-45deg);
}
🔹 JS (afegeix-ho al teu scripts.js)
javascript
// MENÚ HAMBURGUESA
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("open");
});
📌 2. SECCIÓ ACORDIÓ (Consells / FAQ / Explicacions)
🔹 HTML (posa-ho després del selector)
html
<section id="consells" class="section consells">
    <h2>Consells i informació útil</h2>

    <div class="acordio">

        <div class="acordio-item">
            <button class="acordio-btn">Per què necessito un assessor energètic?</button>
            <div class="acordio-content">
                <p>Un assessor detecta errors de facturació, optimitza la potència, revisa tarifes i t’ajuda a reduir costos sense perdre confort.</p>
            </div>
        </div>

        <div class="acordio-item">
            <button class="acordio-btn">Com entendre la factura de la llum?</button>
            <div class="acordio-content">
                <p>La factura inclou potència, energia consumida, impostos i serveis addicionals. Entendre-la és clau per evitar sobrecostos.</p>
            </div>
        </div>

        <div class="acordio-item">
            <button class="acordio-btn">Què puc estalviar realment?</button>
            <div class="acordio-content">
                <p>Depèn del consum i la tarifa, però l’estalvi mitjà acostuma a ser entre un 10% i un 35% anual.</p>
            </div>
        </div>

    </div>
</section>
🔹 CSS (afegeix-ho al teu styles.css)
css
/* ACORDIÓ */
.acordio {
    max-width: 800px;
    margin: auto;
}

.acordio-item {
    margin-bottom: 10px;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #ddd;
}

.acordio-btn {
    width: 100%;
    background: #f3f3f3;
    padding: 15px;
    text-align: left;
    font-size: 1.1rem;
    border: none;
    cursor: pointer;
    transition: 0.3s;
}

.acordio-btn:hover {
    background: #e8e8e8;
}

.acordio-content {
    max-height: 0;
    overflow: hidden;
    background: white;
    padding: 0 15px;
    transition: max-height 0.4s ease;
}

.acordio-content p {
    padding: 15px 0;
}
🔹 JS (afegeix-ho també a scripts.js)
javascript
// ACORDIÓ
const acordioBtns = document.querySelectorAll(".acordio-btn");

acordioBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const content = btn.nextElementSibling;
        const isOpen = content.style.maxHeight;

        document.querySelectorAll(".acordio-content").forEach(c => c.style.maxHeight = null);

        if (!isOpen) {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    });
});
🎉 I ja ho tens: menú hamburguesa + secció acordió, totalment responsive.
