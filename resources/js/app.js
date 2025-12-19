import initUniversalNavbar from './navbar';
import './delete-hold.js';
import './toast.js';
import { generateTimeSlots } from './timeline';

const axis = document.getElementById('timeline-axis');

if (axis) {
    const slots = generateTimeSlots();

    slots.forEach(slot => {
        const el = document.createElement('div');
        el.className = 'uo-time-slot';

        if (slot.isHour) {
            el.classList.add('is-hour');
            el.textContent = slot.displayHour;
        }

        axis.appendChild(el);
    });
}



document.addEventListener('DOMContentLoaded', () => {
    initUniversalNavbar();
});

