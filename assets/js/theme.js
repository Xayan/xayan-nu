(() => {
    "use strict";

    window.addEventListener("DOMContentLoaded", () => {
        // Blur the content when the menu is open
        const cbox = document.getElementById("menu-trigger");
        const area = document.querySelector(".wrapper");
        const menu = document.querySelector(".menu");
        const body = document.body;

        const toggleMenu = (isOpen) => {
            body.classList.toggle("nav-open", isOpen);
            menu.classList.toggle("expanded", isOpen);
            area.classList.toggle("blurry", isOpen);
        };

        cbox.addEventListener("change", function () {
            toggleMenu(this.checked);
        });

        // Add class based on URL pathname
        const currentPathname = window.location.pathname;
        if (currentPathname.match(/^\/posts\/.+?$/)) {
            body.classList.add("is-post");
        } else {
            body.classList.add("is-page");
        }
    });
})();
