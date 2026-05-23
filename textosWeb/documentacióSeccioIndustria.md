📘 Documentació del projecte – Arquitectura Frontend
🧩 1. Estructura general del projecte
El projecte està organitzat en:

HTML principals: index.html, industria.html, negoci.html, llar.html, form.html

Components dinàmics: header.html, footer.html, seccions carregades via JS

JS globals:

scripts.js → animacions i efectes visuals

header.js → gestió visual del selector d’idioma

lang.js → càrrega de JSON idiomàtic i traduccions

modal.js → modal legal

seccions.js → només per al index

JS per secció (pendents de crear):

scriptIndustria.js

scriptNegoci.js

scriptLlar.js

JSON idiomàtics:

/json/lang/ca.json

/json/lang/es.json

/json/lang/en.json

HTML externs per contingut llarg (pendents):

/html/industria/potencia.ca.html

/html/industria/potencia.es.html

/html/industria/potencia.en.html

etc.

🧠 2. Sistema d’idiomes
L’idioma seleccionat es desa a localStorage → persistent entre pàgines.

header.js només marca el botó actiu.

lang.js:

carrega el JSON d’idioma

injecta textos al DOM

manté window.currentLang per compatibilitat

actualitza el CTA del formulari

Les seccions noves (Indústria, Negoci, Llar) reutilitzaran:

window.currentLang

els JSON idiomàtics

HTML extern per contingut llarg

🪟 3. Arquitectura de modals
Modal 1 — legal-modal
Nom: legal-modal

JS: modal.js

Contingut: JSON legal

Ús: política de privacitat, cookies, avis legal

Modal 2 — info-modal (només index)
Nom: info-modal

JS: dins seccions.js

Contingut: HTML extern (consultor.html)

Ús: secció “Why Consultant”

Modal 3 — content-modal (NOU, global)
Nom recomanat: content-modal

JS recomanat: modalContent.js

Contingut: HTML extern segons idioma

Ús:

potència

energia

reactiva

períodes i temporades

explicacions llargues de Negoci i Llar

qualsevol popup pedagògic

Aquest modal serà el cervell pedagògic de tota la web.

🧱 4. Scripts per secció (pendents de crear)
Cada secció tindrà el seu JS:

scriptIndustria.js

scriptNegoci.js

scriptLlar.js

I cadascun farà:

Llegir idioma → window.currentLang

Llegir JSON → json/lang/${lang}.json

Detectar quin popup s’ha clicat

Carregar l’HTML extern corresponent

Obrir el content-modal

Gestionar “continuar” i “tornar” dins del modal

📦 5. JSON idiomàtic únic per idioma
En lloc de crear 9 JSON nous, es farà:

3 JSON (ca, es, en)

Amb seccions internes:

Codi
{
  "hero": { ... },
  "selector": { ... },
  "whyConsultant": { ... },

  "industria": {
    "potencia": { "title": "...", "short": "...", "file": "potencia.ca.html" },
    "energia": { ... },
    "reactiva": { ... }
  },

  "negoci": { ... },
  "llar": { ... }
}
Amb comentaris dins del JSON per documentar.
