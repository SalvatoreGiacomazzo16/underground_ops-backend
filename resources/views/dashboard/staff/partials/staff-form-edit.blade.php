{{-- resources/views/dashboard/staff/partials/form.blade.php --}}

@php
    /** @var \App\Models\StaffProfile|null $staff */
    $staff = $staff ?? null;
@endphp

<div class="row g-4">

    {{-- Stage Name --}}
    <div class="col-md-6 input-field">
        <label for="stage_name">Stage Name</label>
        <input
            id="stage_name"
            name="stage_name"
            type="text"
            placeholder="DJ KRYPT, PR Giada, Security Mario…"
            value="{{ old('stage_name', $staff->stage_name ?? '') }}"
        >
    </div>

    {{-- Telefono --}}
    <div class="col-md-6 input-field">
        <label for="phone">Telefono</label>
        <input
            id="phone"
            name="phone"
            type="text"
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
        // Se in edit hai l'array nel DB, lo trasformiamo in stringa "DJ, PR, Tecnico luci"
        $skillsString = old('skills');
        if ($skillsString === null && isset($staff)) {
            if (is_array($staff->skills)) {
                $skillsString = implode(', ', $staff->skills);
            } else {
                $skillsString = $staff->skills ?? '';
            }
        }
    @endphp

    <div class="col-12 input-field">
        <label for="skills">Skills (separate da virgola)</label>
        <input
            type="text"
            id="skills"
            name="skills"
            placeholder="DJ, PR, Tecnico Luci…"
            value="{{ $skillsString }}"
        >
    </div>

    {{-- Attivo --}}
    @php
        $isActive = old('is_active');
        if ($isActive === null) {
            $isActive = isset($staff) ? $staff->is_active : true;
        }
    @endphp

    <div class="col-md-6 d-flex align-items-center">
        <div class="form-check form-switch">
            <input
                class="form-check-input"
                type="checkbox"
                id="is_active"
                name="is_active"
                value="1"
                {{ $isActive ? 'checked' : '' }}
            >
            <label class="form-check-label ms-2" for="is_active">
                Attivo
            </label>
        </div>
    </div>

    {{-- Note interne --}}
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
