// ================================
// 05_COMPONENTS.JS
// Generatori di HTML e Logica di Template
// ================================

import { minutesToPixels } from './tl-utils.js';

// ================================
// STAFF RENDERING
// ================================

export function renderStaffRow(block) {
    const staff = Array.isArray(block.staff) ? block.staff : [];

    // --- Empty state
    if (staff.length === 0) {
        return `
        <div class="uo-block-staff uo-block-staff--empty">
            <button class="uo-block-staff-add" data-add-staff>
                + Staff
            </button>
        </div>
        `;
    }

    const MAX_VISIBLE = 3;
    const visibleStaff = staff.slice(0, MAX_VISIBLE);
    const extraCount = staff.length - MAX_VISIBLE;

    const chips = visibleStaff.map(member => `
        <span
            class="uo-staff-chip ${member.isQuick ? 'is-quick' : ''}"
            data-staff-id="${member.id}"
            tabindex="0"
            title="${member.isQuick
            ? 'Aggiunto rapidamente (non salvato)'
            : (member.role || '')
        }"
        >
            <span class="uo-staff-chip-label">
                ${member.name}${member.isQuick ? ' ⚡' : ''}
            </span>
        </span>
    `).join('');

    const extraChip = extraCount > 0
        ? `
        <span class="uo-staff-chip uo-staff-chip--more" title="Altri staff">
            +${extraCount}
        </span>
        `
        : '';

    return `
        <div class="uo-block-staff">
            <div class="uo-block-staff-list">
                ${chips}
                ${extraChip}
            </div>

            <button
                class="uo-block-staff-add"
                data-add-staff
                title="Aggiungi staff"
            >
                +
            </button>
        </div>
    `;
}

// ================================
// TIME AXIS GENERATOR
// ================================

export function generateTimeSlots({
    rangeStartMinutes,
    rangeTotalMinutes,
    unitMinutes = 15
}) {
    const slots = [];
    const slotsCount = rangeTotalMinutes / unitMinutes;

    for (let i = 0; i <= slotsCount; i++) {
        const absoluteMinutes = rangeStartMinutes + i * unitMinutes;
        const isHour = (i * unitMinutes) % 60 === 0;

        // normalizzazione ora 0–23
        const hour = Math.floor(
            ((absoluteMinutes % (24 * 60)) + (24 * 60)) % (24 * 60) / 60
        );

        slots.push({
            index: i,
            isHour,
            displayHour: isHour
                ? String(hour).padStart(2, '0')
                : null
        });
    }

    return slots;
}

// ================================
// EVENT RANGE (HIGHLIGHT)
// ================================
// ================================
// EVENT RANGE (HIGHLIGHT)
// ================================

export function renderEventRange({
    canvas,
    eventStartMinutes,
    eventEndMinutes,
    rangeStartMinutes,
    pxPerMinute,
}) {
    if (!canvas || eventStartMinutes == null) return;

    let range = canvas.querySelector('.uo-event-range');
    if (!range) {
        range = document.createElement('div');
        range.className = 'uo-event-range';
        range.setAttribute('aria-hidden', 'true');
        canvas.appendChild(range);
    }

    const SNAP_MINUTES = 15;
    const snapDown = (m) => Math.floor(m / SNAP_MINUTES) * SNAP_MINUTES;
    const snapUp = (m) => Math.ceil(m / SNAP_MINUTES) * SNAP_MINUTES;

    let start = snapDown(eventStartMinutes);
    let end = snapUp(eventEndMinutes ?? (eventStartMinutes + 180));

    if (end < start) end += 24 * 60;

    const startOffset = start - rangeStartMinutes;
    const duration = end - start;

    range.style.top = `${startOffset * pxPerMinute}px`;
    range.style.height = `${duration * pxPerMinute}px`;
}
