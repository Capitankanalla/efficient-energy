📂 Estructura de carpetes
Codi
/projecteWebEfficient
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── img/
│   ├── logo.png
│   └── hero.jpg
└── README.md

🚀 Flux de treball recomanat
1. Desenvolupament local
Executar server.js només per simular un entorn real

Treballar amb localhost:3000

2. Publicació
Pujar canvis a la branca main

GitHub Pages actualitza automàticament

Revisar la web a:
https://elmeuusuari.github.io/lamevaweb

3. Quan et quedis encallat
Revisa aquest README

Torna a l’estructura base

Simplifica abans de complicar

Prioritza disseny → contingut → funcionalitat

🧱 Roadmap (llista de tasques)
[X] Afegir logo al header

[ ] Crear menú (superior o lateral)

[X] Dissenyar hero amb CTA

[X] Crear secció de serveis

[X] Crear secció “Per què confiar en mi?”

[X] Crear formulari de contacte (frontend)

[X] Afegir imatges optimitzades

[X] Preparar estructura multiidioma

[X] Crear backend per formularis

[X] Desplegar backend

[X] Connectar frontend + backend

[X] TODO ràpid (opció pujar factura i gestionar-la)
FRONTEND
[X] Popup amb form (nom, cognoms, email, tel)
[X] Botó continuar → guardar dades
[X] Input file (factura)
[X] Crear FormData amb tot
[X] fetch a /.netlify/functions/uploadFactura
BACKEND
[X] Rebre camps + fitxer
[X] Validar (si falta algo → error)
[X] Respondre:
OK → { ok: true }
KO → { error: "..." }
UX (IMPORTANT)
[X] Loading (“Enviant…”)
[X] Success (“Factura rebuda”)
[X] Error visible
HUBSPOT (després)
[X] Crear contacte amb email + tel
[X] (opcional) guardar info factura
[X] OBJECTIU D’AVUI

👉 veure un ok: true al navegador després del upload