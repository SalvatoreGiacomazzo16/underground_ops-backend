@php
    /** @var \App\Models\Location|null $location */
    $location = $location ?? null;
@endphp

<div class="row g-4">

    {{-- NOME --}}
    <div class="col-md-6 input-field">
        <label for="name">Nome Location</label>
        <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Duel Club, Officina 99…"
            value="{{ old('name', $location->name ?? '') }}"
        >
    </div>

    {{-- INDIRIZZO --}}
    <div class="col-md-6 input-field">
        <label for="address">Indirizzo</label>
        <input
            id="address"
            name="address"
            type="text"
            value="{{ old('address', $location->address ?? '') }}"
        >
    </div>

    {{-- CITTÀ --}}
    <div class="col-md-6 input-field">
        <label for="city">Città</label>
        <input
            id="city"
            name="city"
            type="text"
            value="{{ old('city', $location->city ?? '') }}"
        >
    </div>

    {{-- PROVINCIA --}}
    <div class="col-md-6 input-field">
        <label for="province">Provincia</label>
        <input
            id="province"
            name="province"
            type="text"
            value="{{ old('province', $location->province ?? '') }}"
        >
    </div>

    {{-- CAPIENZA --}}
    <div class="col-md-6 input-field">
        <label for="capacity_min">Capienza Minima</label>
        <input
            id="capacity_min"
            name="capacity_min"
            type="number"
            value="{{ old('capacity_min', $location->capacity_min ?? '') }}"
        >
    </div>

    <div class="col-md-6 input-field">
        <label for="capacity_max">Capienza Massima</label>
        <input
            id="capacity_max"
            name="capacity_max"
            type="number"
            value="{{ old('capacity_max', $location->capacity_max ?? '') }}"
        >
    </div>

    {{-- CONTATTI --}}
    <div class="col-md-6 input-field">
        <label for="contact_name">Referente</label>
        <input
            id="contact_name"
            name="contact_name"
            type="text"
            value="{{ old('contact_name', $location->contact_name ?? '') }}"
        >
    </div>

    <div class="col-md-6 input-field">
        <label for="contact_phone">Telefono Referente</label>
        <input
            id="contact_phone"
            name="contact_phone"
            type="text"
            value="{{ old('contact_phone', $location->contact_phone ?? '') }}"
        >
    </div>

    {{-- NOTE --}}
    <div class="col-12 input-field">
        <label for="notes">Note</label>
        <textarea
            id="notes"
            name="notes"
            rows="3"
        >{{ old('notes', $location->notes ?? '') }}</textarea>
    </div>

</div>
