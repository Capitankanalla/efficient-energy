// js/facturaUpload.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// ---------------------------------------------------------------------------
// POPUP LEAD — reutilitza el #content-modal existent
// ---------------------------------------------------------------------------
function openLeadModal() {
    return new Promise((resolve) => {
        const modal    = document.getElementById('content-modal');
        const titleEl  = document.getElementById('content-modal-title');
        const bodyEl   = document.getElementById('content-modal-body');
        const closeBtn = document.getElementById('content-modal-close');

        const lang = window.currentLang || 'es';
        titleEl.textContent = lang === 'ca' ? 'Afegeix la teva factura'
                            : lang === 'en' ? 'Upload your invoice'
                            :                 'Sube tu factura';

        bodyEl.innerHTML = `
            <form id="facturaLeadForm" style="display:flex;flex-direction:column;gap:12px;margin-top:1rem;">
                <input type="text"  name="name"    required autocomplete="name"
                    placeholder="${lang === 'ca' ? 'Nom i cognoms' : lang === 'en' ? 'Full name' : 'Nombre y apellidos'}">
                <input type="email" name="email"   required autocomplete="email"
                    placeholder="Email">
                <input type="tel"   name="phone"   required autocomplete="tel"
                    placeholder="${lang === 'ca' ? 'Telèfon de contacte' : lang === 'en' ? 'Phone number' : 'Teléfono de contacto'}">
                <textarea name="message"
                    placeholder="${lang === 'ca' ? 'Comentari (opcional)' : lang === 'en' ? 'Comment (optional)' : 'Comentario (opcional)'}"></textarea>

                <!-- Honeypot -->
                <input type="text" name="hp_token" style="position:absolute;left:-9999px;" autocomplete="off" tabindex="-1" aria-hidden="true">
                <input type="text" name="hp_extra" style="position:absolute;left:-9999px;" autocomplete="off" tabindex="-1" aria-hidden="true">

                <p id="facturaFormError" style="color:#c0392b;font-size:0.85rem;display:none;"></p>

                <div style="display:flex;justify-content:flex-end;gap:8px;">
                    <button type="button" id="cancelFacturaBtn"
                        style="background:#eee;color:#333;padding:10px 16px;border:none;border-radius:6px;cursor:pointer;">
                        ${lang === 'ca' ? 'Cancel·lar' : lang === 'en' ? 'Cancel' : 'Cancelar'}
                    </button>
                    <button type="submit" style="padding:10px 16px;">
                        ${lang === 'ca' ? 'Continuar' : lang === 'en' ? 'Continue' : 'Continuar'}
                    </button>
                </div>
            </form>
        `;

        modal.classList.add('open');

        const form      = document.getElementById('facturaLeadForm');
        const errorEl   = document.getElementById('facturaFormError');
        const cancelBtn = document.getElementById('cancelFacturaBtn');

        const close = (result) => {
            modal.classList.remove('open');
            bodyEl.innerHTML = '';
            titleEl.textContent = '';
            resolve(result);
        };

        cancelBtn.addEventListener('click', () => close(null));

        const outsideClick = (e) => {
            if (e.target === modal) {
                close(null);
                modal.removeEventListener('click', outsideClick);
            }
        };
        modal.addEventListener('click', outsideClick);

        const closeBtnClick = () => {
            close(null);
            closeBtn.removeEventListener('click', closeBtnClick);
        };
        closeBtn.addEventListener('click', closeBtnClick);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name     = form.name.value.trim();
            const email    = form.email.value.trim().toLowerCase();
            const phone    = form.phone.value.trim();
            const message  = form.message.value.trim();
            const hp_token = form.hp_token.value;
            const hp_extra = form.hp_extra.value;

            if (!name || !EMAIL_REGEX.test(email) || !phone) {
                errorEl.textContent = lang === 'ca' ? 'Omple tots els camps obligatoris amb un format vàlid.'
                                    : lang === 'en' ? 'Please fill in all required fields correctly.'
                                    :                 'Rellena todos los campos obligatorios correctamente.';
                errorEl.style.display = 'block';
                return;
            }

            close({ name, email, phone, message, hp_token, hp_extra });
        });

        form.querySelector('input[name="name"]').focus();
    });
}

// ---------------------------------------------------------------------------
// SPINNER al modal mentre s'envia
// ---------------------------------------------------------------------------
function showModalSpinner() {
    const lang    = window.currentLang || 'es';
    const modal   = document.getElementById('content-modal');
    const titleEl = document.getElementById('content-modal-title');
    const bodyEl  = document.getElementById('content-modal-body');

    titleEl.textContent = lang === 'ca' ? 'Enviant factura...'
                        : lang === 'en' ? 'Sending invoice...'
                        :                 'Enviando factura...';
    bodyEl.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;padding:32px 0;gap:16px;">
            <div style="width:48px;height:48px;border:4px solid #e0e0e0;border-top-color:#333;border-radius:50%;animation:spinFactura 0.8s linear infinite;"></div>
            <p style="color:#555;margin:0;">
                ${lang === 'ca' ? 'Si us plau, espera un moment...'
                : lang === 'en' ? 'Please wait a moment...'
                :                 'Por favor, espera un momento...'}
            </p>
        </div>
        <style>@keyframes spinFactura { to { transform: rotate(360deg); } }</style>
    `;
    modal.classList.add('open');
}

// ---------------------------------------------------------------------------
// FEEDBACK al modal un cop finalitzat l'enviament
// ---------------------------------------------------------------------------
function showModalFeedback(ok, errorMsg) {
    const lang     = window.currentLang || 'es';
    const modal    = document.getElementById('content-modal');
    const titleEl  = document.getElementById('content-modal-title');
    const bodyEl   = document.getElementById('content-modal-body');
    const closeBtn = document.getElementById('content-modal-close');

    titleEl.textContent = ok
        ? (lang === 'ca' ? '✓ Factura enviada!'    : lang === 'en' ? '✓ Invoice received!'  : '✓ ¡Factura enviada!')
        : (lang === 'ca' ? 'Error en l\'enviament' : lang === 'en' ? 'Upload error'          : 'Error en el envío');

    const msgOk = lang === 'ca' ? 'Hem rebut la teva factura. En breu ens posarem en contacte amb tú.'
                : lang === 'en' ? 'We have received your invoice. We will contact you soon.'
                :                 'Hemos recibido tu factura correctamente. En breve nos pondremos en contacto contigo.';

    const msgErr = errorMsg
        || (lang === 'ca' ? 'No s\'ha pogut enviar. Si us plau, torna-ho a intentar.'
           : lang === 'en' ? 'Could not send the invoice. Please try again.'
           :                 'No se ha podido enviar. Por favor, inténtalo de nuevo.');

    const btnLabel = lang === 'ca' ? 'Tancar' : lang === 'en' ? 'Close' : 'Cerrar';

    bodyEl.innerHTML = `
        <div style="text-align:center;padding:24px 0 8px;">
            <p style="font-size:2.5rem;margin:0;">${ok ? '✅' : '❌'}</p>
            <p style="margin:16px 0 24px;color:${ok ? '#333' : '#c0392b'};">${ok ? msgOk : msgErr}</p>
            <button id="feedbackCloseBtn"
                style="padding:10px 28px;border:none;border-radius:6px;background:#111;color:#fff;cursor:pointer;font-size:15px;">
                ${btnLabel}
            </button>
        </div>
    `;

    const tancar = () => {
        modal.classList.remove('open');
        bodyEl.innerHTML = '';
        titleEl.textContent = '';
    };

    document.getElementById('feedbackCloseBtn').addEventListener('click', tancar);
    closeBtn.addEventListener('click', tancar, { once: true });
    modal.addEventListener('click', (e) => { if (e.target === modal) tancar(); }, { once: true });
}

// ---------------------------------------------------------------------------
// COMPRESSIÓ D'IMATGES (JPG / PNG → JPEG)
// ---------------------------------------------------------------------------
async function compressImage(file, maxSizeBytes, maxDimension = 2000) {
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const img = await new Promise((resolve, reject) => {
        const image   = new Image();
        image.onload  = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);

    let quality = 0.85;
    let blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    while (blob && blob.size > maxSizeBytes && quality > 0.4) {
        quality -= 0.15;
        blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
    }
    return blob;
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
export function initFacturaUpload() {
    const input   = document.querySelector('[data-factura-input]');
    const buttons = document.querySelectorAll('[data-factura-btn]');

    if (!input || !buttons.length) return;

    const currentSection = window.location.pathname.split('/')[1] || 'unknown';
    let isUploading = false;
    let pendingData = null;

    function setUploading(value) {
        isUploading = value;
        buttons.forEach(btn => btn.disabled = value);
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (isUploading) return;
            const result = await openLeadModal();
            if (!result) return;
            pendingData = result;
            input.click();
        });
    });

    input.addEventListener('change', async () => {
        const file = input.files[0];
        if (!file || !pendingData) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            showModalFeedback(false, null);
            input.value = '';
            return;
        }

        let fileToUpload   = file;
        let uploadFileName = file.name;
        const isImage = file.type === 'image/jpeg' || file.type === 'image/png';

        if (isImage) {
            try {
                const compressed = await compressImage(file, MAX_SIZE);
                if (compressed) {
                    fileToUpload   = compressed;
                    uploadFileName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                }
            } catch (err) {
                console.error('Error comprimint la imatge:', err);
            }
        }

        if (fileToUpload.size > MAX_SIZE) {
            showModalFeedback(false, 'El fitxer és massa gran (màx. 4MB).');
            input.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('factura',  fileToUpload, uploadFileName);
        formData.append('section',  currentSection);
        formData.append('name',     pendingData.name);
        formData.append('email',    pendingData.email);
        formData.append('phone',    pendingData.phone);
        formData.append('message',  pendingData.message);
        formData.append('hp_token', pendingData.hp_token);
        formData.append('hp_extra', pendingData.hp_extra);

        setUploading(true);
        showModalSpinner();

        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), 30000);

            const response = await fetch('/.netlify/functions/uploadFactura', {
                method: 'POST',
                body:   formData,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            showModalFeedback(response.ok && data.ok, data.error || null);

        } catch (error) {
            console.error('Error al fer upload:', error);
            showModalFeedback(false, null);
        } finally {
            setUploading(false);
            input.value = '';
            pendingData = null;
        }
    });
}