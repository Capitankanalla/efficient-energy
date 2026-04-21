const langButtons = document.querySelectorAll('.lang-btn');

function setActiveLang(lang) {
  langButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

langButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    localStorage.setItem('lang', lang);
    setActiveLang(lang);
  });
});

// En carregar la pàgina
const savedLang = localStorage.getItem('lang') || 'ca';
setActiveLang(savedLang);
