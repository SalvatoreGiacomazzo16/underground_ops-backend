// ================================
// 05_COMPONENTS.JS
// Generatori di HTML e Logica di Template
// ================================

// Logica di rendering dello staff (corrispondente alla versione "complessa"
// e attiva del file originale, riga ~425)

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

export function generateTimeSlots({
    startHour = 12,
    endHour = 6,
    unitMinutes = 15
} = {}) {
    const slots = [];
    const rangeStartMinutes = startHour * 60;
    const rangeEndMinutes = (endHour <= startHour ? 24 + endHour : endHour) * 60;
    const totalDuration = rangeEndMinutes - rangeStartMinutes;
    const slotsCount = totalDuration / unitMinutes;

    for (let i = 0; i < slotsCount; i++) {
        const absoluteMinutes = rangeStartMinutes + i * unitMinutes;
        const isHour = absoluteMinutes % 60 === 0;
        const displayHour = Math.floor(absoluteMinutes / 60) % 24;

        slots.push({
            index: i,
            isHour,
            displayHour: isHour ? String(displayHour).padStart(2, '0') : null
        });
    }
    return slots;
}
