// js/facturaUpload.js

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// ---------------------------------------------------------------------------
// POPUP — reutilitza el #content-modal que ja existeix a industria/llar/negoci
// ---------------------------------------------------------------------------
function openLeadModal() {
    return new Promise((resolve) => {
        const modal     = document.getElementById('content-modal');
        const titleEl   = document.getElementById('content-modal-title');
        const bodyEl    = document.getElementById('content-modal-body');
        const closeBtn  = document.getElementById('content-modal-close');

        const lang = window.currentLang || 'ca';
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
                    <button type="submit"
                        style="padding:10px 16px;">
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
            // Tornem a connectar el listener de tancament original del modal
            resolve(result);
        };

        cancelBtn.addEventListener('click',  () => close(null));

        // Tancament clicant fora (el listener original de modalSeccions.js ja ho fa,
        // però quan resolve null aquí ja no cal fer res més)
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
    const status  = document.querySelector('[data-factura-status]');

    if (!input || !buttons.length) return;

    const currentSection = window.location.pathname.split('/')[1] || 'unknown';
    let isUploading = false;
    let pendingData = null;

    function setUploading(value) {
        isUploading = value;
        buttons.forEach(btn => btn.disabled = value);
    }

    function showStatus(message, isError = false) {
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('error', isError);
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
            showStatus('Format no permès. Adjunta un PDF o imatge.', true);
            input.value = '';
            return;
        }

        let fileToUpload   = file;
        let uploadFileName = file.name;
        const isImage = file.type === 'image/jpeg' || file.type === 'image/png';

        if (isImage) {
            showStatus('Optimitzant la imatge...');
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
            showStatus('El fitxer és massa gran, fins i tot comprimint-lo (màx. 4MB).', true);
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
        showStatus('Pujant factura...');

        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), 30000);

            const response = await fetch('/api/uploadFactura', {
                method: 'POST',
                body:   formData,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            if (!response.ok) {
                showStatus(data.error || 'Hi ha hagut un error pujant la factura.', true);
                return;
            }
            showStatus('Factura rebuda correctament!');
        } catch (error) {
            console.error('Error al fer upload:', error);
            showStatus('Hi ha hagut un error de connexió.', true);
        } finally {
            setUploading(false);
            input.value = '';
            pendingData = null;
        }
    });
}