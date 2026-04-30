// Animació d'aparició en scroll
const elements = document.querySelectorAll('.section, .card');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

elements.forEach(el => observer.observe(el));


// Efecte parallax al hero
document.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('.hero');
    const x = (e.clientX / window.innerWidth) * 10;
    const y = (e.clientY / window.innerHeight) * 10;
    hero.style.backgroundPosition = `${x}% ${y}%`;
});


// Validació bàsica del formulari
const form = document.querySelector('.contact-form');

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const btn = form.querySelector('button');
        btn.textContent = 'Enviant...';
        btn.disabled = true;

        setTimeout(() => {
            btn.textContent = 'Enviat!';
            form.reset();
        }, 1200);
    });
}

