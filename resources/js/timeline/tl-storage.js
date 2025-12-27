// ================================
// 03_STORAGE.JS
// Storage Layer (Repository Pattern)
// ================================

import { CTX } from './tl-config.js';

export const TimelineRepository = {
    getKey() {
        // Namespace protetto + User isolation + Event isolation
        return `uo_v1:${CTX.userId}:${CTX.eventId}`;
    },

    load() {
        try {
            const raw = localStorage.getItem(this.getKey());
            if (!raw) return []; // Nessun dato salvato -> array vuoto
            const data = JSON.parse(raw);
            // Validazione minima: deve essere un array
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error('Timeline storage corrupted, resetting.', e);
            return []; // Fallback sicuro
        }
    },

    save(blocks) {
        try {
            // Puliamo i dati prima di salvare (rimuoviamo riferimenti DOM se ce ne fossero)
            // Salviamo solo il DTO (Data Transfer Object) puro
            const cleanData = blocks.map(b => ({
                id: b.id,
                tStart: b.tStart,
                duration: b.duration,
                label: b.label,
                color: b.color,
                // [ESTENSIONE] Supporto per la persistenza dello staff
                staff: b.staff || []
            }));

            // In futuro: await fetch('/api/timeline/save', { body: ... })
            localStorage.setItem(this.getKey(), JSON.stringify(cleanData));
        } catch (e) {
            console.error('Save failed (quota exceeded?)', e);
        }
    }
};
