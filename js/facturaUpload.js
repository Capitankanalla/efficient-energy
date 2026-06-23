export function initFacturaUpload() {
    const input = document.querySelector("[data-factura-input]");
    const buttons = document.querySelectorAll("[data-factura-btn]");

    if (!input || !buttons.length) return;

    const currentSection = window.location.pathname.split("/")[1];

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            input.click();
        });
    });

    input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return;

        console.log("Fitxer:", file.name);
        console.log("Secció:", currentSection);
    });
}