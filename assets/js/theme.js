(() => {
    "use strict";

    window.addEventListener("DOMContentLoaded", () => {
        // Blur the content when the menu is open
        const cbox = document.getElementById("menu-trigger");
        const area = document.querySelector(".wrapper");
        const body = document.body;

        cbox.addEventListener("change", function () {
            if (this.checked) {
                const scrollY = window.scrollY;
                body.style.setProperty("--scroll-y", `${scrollY}px`);
                body.dataset.scrollY = scrollY;

                body.classList.add("nav-open");
                area.classList.add("blurry");
            } else {
                const scrollY = body.dataset.scrollY || 0;

                area.classList.remove("blurry");
                body.classList.remove("nav-open");
                
                window.scrollTo({ top: parseInt(scrollY), left: 0, behavior: "instant" });
            }
        });
    });
})();