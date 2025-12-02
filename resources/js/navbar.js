// File: navbar.js (COMPLETO E CORRETTO)

// ======================================================================
// UNIVERSAL MOBILE NAVBAR
// Guest + Admin — Smooth, senza glitch, senza doppioni
// ======================================================================

export default function initUniversalNavbar() {

    const container = document.getElementById('mobileMenuToggleContainer');
    const drawer = document.getElementById('mobileDrawerNav');
    const overlay = document.getElementById('mobileNavOverlay');

    if (!container || !drawer || !overlay) return;

    let toggle = null;
    let isAnimating = false;

    // -------------------------------------------------------
    // CREA HAMBURGER
    // -------------------------------------------------------
    const createToggle = () => {
        const btn = document.createElement('button');
        btn.id = "mobileMenuToggle";
        // CLASSE CORRETTA: usa uo-menu-toggle per lo stile SCSS
        btn.classList.add('uo-menu-toggle');
        btn.innerHTML = `<span></span><span></span><span></span>`;
        btn.addEventListener('click', openMenu);
        container.appendChild(btn);
        return btn;
    };


    // -------------------------------------------------------
    // APRI MENU
    // -------------------------------------------------------
    const openMenu = (e) => {
        if (isAnimating) return;
        isAnimating = true;

        e.stopPropagation();

        drawer.classList.add('is-open');
        overlay.classList.add('active');

        // Nascondo l’hamburger senza spostare layout
        toggle.classList.add('hidden');

        setTimeout(() => {
            isAnimating = false;
        }, 250);
    };


    // -------------------------------------------------------
    // CHIUDI MENU
    // -------------------------------------------------------
    const closeMenu = () => {
        if (isAnimating) return;
        isAnimating = true;

        drawer.classList.remove('is-open');
        overlay.classList.remove('active');

        setTimeout(() => {
            toggle.classList.remove('hidden');

            // Effetto neon flash
            toggle.classList.add('neon-flash');
            setTimeout(() => {
                toggle.classList.remove('neon-flash');
            }, 1000);

            isAnimating = false;
        }, 250);
    };


    // -------------------------------------------------------
    // INIT
    // -------------------------------------------------------
    toggle = createToggle();

    overlay.addEventListener('click', closeMenu);

    drawer.querySelectorAll('a, button').forEach(item => {
        item.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 768 && drawer.classList.contains('is-open')) {
            closeMenu();
        }
    });
}


document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("nav");
    const hero = document.querySelector(".uo-welcome-hero");

    if (!header || !hero) return;

    const adjustHeroHeight = () => {
        const headerHeight = header.offsetHeight;
        hero.style.height = `calc(100vh - ${headerHeight}px)`;
        hero.style.minHeight = `calc(100vh - ${headerHeight}px)`;
    };

    // Applica subito
    adjustHeroHeight();

    // Ricalcola su resize
    window.addEventListener("resize", adjustHeroHeight);
});
