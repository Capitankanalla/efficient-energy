export function initFacturaUpload() {
    const input = document.querySelector("[data-factura-input]");
    const buttons = document.querySelectorAll("[data-factura-btn]");

    if (!input || !buttons.length) return;

    const currentSection = window.location.pathname.split("/")[1] || 'unknown';

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            input.click();
        });
    });

    input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('factura', file);
        formData.append('section', currentSection);

        try {
            const response = await fetch('http://localhost:8888/.netlify/functions/uploadFactura', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                console.error('Error uploading factura:', data);
                return;
            }

            console.log('Upload OK:', data);
            console.log('Fitxer:', file.name);
            console.log('Secció:', currentSection);
        } catch (error) {
            console.error('Error al fer upload:', error);
        }
    });
}
