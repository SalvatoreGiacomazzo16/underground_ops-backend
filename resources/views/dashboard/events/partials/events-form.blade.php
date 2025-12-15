@php
    /** @var \App\Models\Event|null $event */
    $event  = $event ?? null;
    $isEdit = $event !== null;

    $now = now()->startOfMinute();
    $startDefault = $now->format('Y-m-d\TH:i');
    $endDefault   = $now->copy()->addHours(3)->format('Y-m-d\TH:i');
@endphp

<div class="row g-4">

    {{-- TITOLO --}}
    <div class="col-md-6 input-field">
        <label for="title">Titolo Evento</label>
        <input
            id="title"
            name="title"
            type="text"
            value="{{ old('title', $event?->title) }}"
            placeholder="Inserisci un titolo…"
            required
        >
    </div>

    {{-- TIPO --}}
    <div class="col-md-6 input-field">
        <label for="event_type">Tipo Evento</label>
        <select id="event_type" name="event_type" required>
            @foreach (['live'=>'Live','djset'=>'DJ Set','party'=>'Party','festival'=>'Festival'] as $key => $label)
                <option value="{{ $key }}"
                    {{ old('event_type', $event?->event_type) === $key ? 'selected' : '' }}>
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
        >{{ old('description', $event?->description) }}</textarea>
    </div>

    {{-- DATA INIZIO --}}
    <div class="col-md-6 input-field">
        <label for="start_datetime">Data & Ora Inizio</label>
        <input
            id="start_datetime"
            name="start_datetime"
            type="datetime-local"
            value="{{ old('start_datetime', $event?->start_datetime?->format('Y-m-d\TH:i') ?? $startDefault) }}"
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
            value="{{ old('end_datetime', $event?->end_datetime?->format('Y-m-d\TH:i') ?? $endDefault) }}"
        >
    </div>

    {{-- LOCATION --}}
    <div class="col-md-6 input-field">
        <label for="location_id">Location</label>
        <select
            id="location_id"
            name="location_id"
            {{ $locations->isEmpty() ? 'disabled' : 'required' }}
        >
            @if($locations->isEmpty())
                <option selected>⚠️ Crea prima una location</option>
            @else
                <option value="" disabled {{ old('location_id', $event?->location_id) ? '' : 'selected' }}>
                    Seleziona una location
                </option>
                @foreach ($locations as $loc)
                    <option value="{{ $loc->id }}"
                        {{ old('location_id', $event?->location_id) == $loc->id ? 'selected' : '' }}>
                        {{ $loc->name }}
                    </option>
                @endforeach
            @endif
        </select>
    </div>

    {{-- STATO --}}
    <div class="col-md-6 input-field">
        <label for="status">Stato</label>
        <select id="status" name="status">
            @foreach (['draft'=>'Bozza','published'=>'Pubblicato','cancelled'=>'Cancellato','archived'=>'Archiviato'] as $key => $label)
                <option value="{{ $key }}"
                    {{ old('status', $event?->status ?? 'draft') === $key ? 'selected' : '' }}>
                    {{ $label }}
                </option>
            @endforeach
        </select>
    </div>

    {{-- VISIBILITÀ --}}
    <div class="col-md-6 input-field">
        <label for="visibility">Visibilità</label>
        <select id="visibility" name="visibility">
            <option value="public"  {{ old('visibility', $event?->visibility ?? 'public') === 'public' ? 'selected' : '' }}>Pubblico</option>
            <option value="private" {{ old('visibility', $event?->visibility) === 'private' ? 'selected' : '' }}>Privato</option>
        </select>
    </div>

</div>
