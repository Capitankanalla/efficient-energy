/* ------------------------------------------------------
   MODAL PEDAGÒGIC GLOBAL
   Ús: Indústria, Negoci i Llar
   Carrega contingut HTML extern segons idioma i ID
--------------------------------------------------------- */

/* ------------------------------------------------------
   1. ELEMENTS DEL MODAL
--------------------------------------------------------- */
const contentModal = document.getElementById("content-modal");
const contentModalBody = document.getElementById("content-modal-body");
const contentModalTitle = document.getElementById("content-modal-title");
const contentModalClose = document.getElementById("content-modal-close");

/* ------------------------------------------------------
   2. OBRIR EL MODAL AMB UN ID DE CONTINGUT
      Exemple: openContentModal("potencia", "industria")
--------------------------------------------------------- */
export async function openContentModal(id, section) {

   // Idioma actual (global)
   const lang = window.currentLang || "ca";

   // Carreguem el JSON idiomàtic
   const json = await fetch(`/json/lang/${lang}.json`).then(r => r.json());

   // Accedim a la secció (industria / negoci / llar)
   const sectionData = json[section];
   if (!sectionData || !sectionData[id]) {
      console.error("No s'ha trobat el contingut per ID:", id);
      return;
   }

   const info = sectionData[id];

   /* ------------------------------------------------------
      2.1. Títol i text curt (del JSON)
   --------------------------------------------------------- */
   contentModalTitle.textContent = info.title || "";
   contentModalBody.innerHTML = info.text || "<p>Contingut no disponible.</p>";

   /* ------------------------------------------------------
      2.2. Carregar HTML extern (contingut llarg)
           Exemple: "potencia.ca.html" desetimat massa arxius
   --------------------------------------------------------- */
   // if (info.file) {
   //    const html = await fetch(`./html/${section}/${info.file}`).then(r => r.text());
   //    contentModalBody.innerHTML = html;
   // } else {
   //    contentModalBody.innerHTML = "<p>Error: falta el fitxer HTML.</p>";
   // }

   /* ------------------------------------------------------
      2.3. Obrir modal
   --------------------------------------------------------- */
   contentModal.classList.add("open");
}

/* ------------------------------------------------------
   3. TANCAR MODAL
--------------------------------------------------------- */
export function closeContentModal() {
   contentModal.classList.remove("open");
}

/* ------------------------------------------------------
   4. BOTÓ DE TANCAR
--------------------------------------------------------- */
contentModalClose.addEventListener("click", closeContentModal);

/* ------------------------------------------------------
   5. TANCAR CLICANT FORA
--------------------------------------------------------- */
contentModal.addEventListener("click", (e) => {
   if (e.target === contentModal) closeContentModal();
});
