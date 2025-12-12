@php
    /** @var \App\Models\StaffProfile|null $staff */
    $staff = $staff ?? null;
@endphp

<div class="row g-4">

    {{-- RUOLO --}}
    <div class="col-md-6 input-field">
        <label for="role">Ruolo</label>
        <input
            type="text"
            id="role"
            name="role"
            value="{{ old('role', $staff->role ?? '') }}"
            placeholder="Cameriere, Barman, Fonico, Security…"
            required
        >
    </div>

    {{-- Stage Name --}}
    <div class="col-md-6 input-field">
        <label for="stage_name">Stage Name</label>
        <input
            type="text"
            id="stage_name"
            name="stage_name"
            value="{{ old('stage_name', $staff->stage_name ?? '') }}"
            placeholder="DJ KRYPT, PR Giada, Security Mario…"
        >
    </div>

    {{-- Telefono --}}
    <div class="col-md-6 input-field">
        <label for="phone">Telefono</label>
        <input
            type="text"
            id="phone"
            name="phone"
            value="{{ old('phone', $staff->phone ?? '') }}"
        >
    </div>

    {{-- Bio --}}
    <div class="col-12 input-field">
        <label for="bio">Bio</label>
        <textarea
            id="bio"
            name="bio"
            rows="3"
            placeholder="Breve descrizione dello staff…"
        >{{ old('bio', $staff->bio ?? '') }}</textarea>
    </div>

    {{-- Skills --}}
    @php
        $skillsString = old(
            'skills',
            isset($staff) && is_array($staff->skills ?? null)
                ? implode(', ', $staff->skills)
                : ($staff->skills ?? '')
        );
    @endphp

    <div class="col-12 input-field">
        <label for="skills">Skills (separate da virgola)</label>
        <input
            type="text"
            id="skills"
            name="skills"
            value="{{ $skillsString }}"
            placeholder="DJ, PR, Tecnico luci…"
        >
    </div>

    {{-- Attivo --}}
    @php
        $active = old('is_active', $staff->is_active ?? true);
    @endphp

    <div class="col-md-6 d-flex align-items-center">
        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="is_active"
                name="is_active"
                value="1"
                {{ $active ? 'checked' : '' }}
            >
            <label class="form-check-label ms-2" for="is_active">Attivo</label>
        </div>
    </div>

    {{-- Note --}}
    <div class="col-12 input-field">
        <label for="notes">Note interne</label>
        <textarea
            id="notes"
            name="notes"
            rows="3"
            placeholder="Aggiungi eventuali note…"
        >{{ old('notes', $staff->notes ?? '') }}</textarea>
    </div>

</div>
