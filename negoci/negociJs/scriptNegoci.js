import { openContentModal } from '../../js/modalSeccions.js'; // verifica el path si cal

const sections = document.querySelectorAll('.section');
window.currentLang = localStorage.getItem("lang") || "es";

// Efecte parallax al hero
document.addEventListener('mousemove', (e) => {
    const hero = document.querySelector('.hero');
    const x = (e.clientX / window.innerWidth) * 10;
    const y = (e.clientY / window.innerHeight) * 10;
    hero.style.backgroundPosition = `${x}% ${y}%`;
});

// Animació scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.2 });

sections.forEach(sec => observer.observe(sec));

// Cards clicables → obrir modal
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => {
        openContentModal(card.dataset.id, card.dataset.section);
    });
});