{{-- resources/views/dashboard/events/partials/events-form.blade.php --}}

@php
    /** @var \App\Models\Event|null $event */
    $isEdit = isset($event);
@endphp

<div class="row g-4">

    {{-- TITOLO --}}
    <div class="col-md-6 input-field">
        <label for="title">Titolo Evento</label>
        <input
            id="title"
            name="title"
            type="text"
            value="{{ old('title', $event->title ?? '') }}"
            placeholder="Inserisci un titolo…"
            required
        >
    </div>

    {{-- TIPO --}}
    <div class="col-md-6 input-field">
        <label for="event_type">Tipo Evento</label>
        <select id="event_type" name="event_type" required>
            @foreach (['live' => 'Live', 'djset' => 'DJ Set', 'party' => 'Party', 'festival' => 'Festival'] as $key => $label)
                <option value="{{ $key }}"
                    {{ old('event_type', $event->event_type ?? '') === $key ? 'selected' : '' }}>
                    {{ $label }}
                </option>
            @endforeach
        </select>
    </div>

    {{-- DESCRIZIONE --}}
    <div class="col-12 input-field">
        <label for="description">Descrizione</label>
        <textarea
            id="description"
            name="description"
            rows="3"
            placeholder="Aggiungi una descrizione…"
        >{{ old('description', $event->description ?? '') }}</textarea>
    </div>

    {{-- DATA INIZIO --}}
    <div class="col-md-6 input-field">
        <label for="start_datetime">Data & Ora Inizio</label>
        <input
            id="start_datetime"
            name="start_datetime"
            type="datetime-local"
            value="{{ old('start_datetime', isset($event) ? $event->start_datetime->format('Y-m-d\TH:i') : '') }}"
            required
        >
    </div>

    {{-- DATA FINE --}}
    <div class="col-md-6 input-field">
        <label for="end_datetime">Data & Ora Fine</label>
        <input
            id="end_datetime"
            name="end_datetime"
            type="datetime-local"
            value="{{ old('end_datetime', isset($event->end_datetime) ? $event->end_datetime->format('Y-m-d\TH:i') : '') }}"
        >
    </div>

    {{-- LOCATION --}}
    <div class="col-md-6 input-field">
        <label for="location_id">Location</label>
        <select id="location_id" name="location_id">
            @foreach ($locations as $loc)
                <option value="{{ $loc->id }}"
                    {{ old('location_id', $event->location_id ?? '') == $loc->id ? 'selected' : '' }}>
                    {{ $loc->name }}
                </option>
            @endforeach
        </select>
    </div>

    {{-- STATO --}}
    <div class="col-md-6 input-field">
        <label for="status">Stato</label>
        <select id="status" name="status">
            @foreach (['draft'=>'Bozza','published'=>'Pubblicato','cancelled'=>'Cancellato','archived'=>'Archiviato'] as $key => $label)
                <option value="{{ $key }}"
                    {{ old('status', $event->status ?? '') === $key ? 'selected' : '' }}>
                    {{ $label }}
                </option>
            @endforeach
        </select>
    </div>

    {{-- VISIBILITÀ --}}
    <div class="col-md-6 input-field">
        <label for="visibility">Visibilità</label>
        <select id="visibility" name="visibility">
            <option value="public" {{ old('visibility', $event->visibility ?? '') === 'public' ? 'selected' : '' }}>
                Pubblico
            </option>
            <option value="private" {{ old('visibility', $event->visibility ?? '') === 'private' ? 'selected' : '' }}>
                Privato
            </option>
        </select>
    </div>

    {{-- CAPACITÀ --}}
    <div class="col-md-6 input-field">
        <label for="max_capacity">Capienza Massima</label>
        <input
            id="max_capacity"
            name="max_capacity"
            type="number"
            placeholder="Es. 300"
            value="{{ old('max_capacity', $event->max_capacity ?? '') }}"
        >
    </div>

    {{-- ETÀ MINIMA --}}
    <div class="col-md-6 input-field">
        <label for="min_age">Età Minima</label>
        <input
            id="min_age"
            name="min_age"
            type="number"
            placeholder="Es. 18"
            value="{{ old('min_age', $event->min_age ?? '') }}"
        >
    </div>

    {{-- PREZZO --}}
    <div class="col-md-6 input-field">
        <label for="base_ticket_price">Prezzo Base (€)</label>
        <input
            id="base_ticket_price"
            name="base_ticket_price"
            type="number"
            step="0.01"
            placeholder="Es. 15.00"
            value="{{ old('base_ticket_price', $event->base_ticket_price ?? '') }}"
        >
    </div>

</div>
