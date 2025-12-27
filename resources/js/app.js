import initUniversalNavbar from './navbar';
import './delete-hold.js';
import './toast.js';

// 🔥 Timeline Ops — main controller
// La timeline si auto-inizializza da sola se trova il markup
import './timeline/tl-maincontroller.js';
import './timeline/tl-config.js';

document.addEventListener('DOMContentLoaded', () => {
    initUniversalNavbar();
});
