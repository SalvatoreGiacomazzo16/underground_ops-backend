@extends('layouts.admin')

@section('content')
<div class="container-fluid">

    {{-- HEADER --}}
    <div class="d-flex justify-content-between align-items-start mb-4">
        <div>
            <h1 class="fx-glitch uo-glitch-text mb-1">Staff Evento</h1>
            <p class="text-secondary">
                {{ $event->title }} —
                {{ $event->start_datetime->translatedFormat('l d F, H:i') }}
            </p>
        </div>

        <a href="{{ route('admin.events.edit', $event) }}" class="uo-btn-secondary">
            ← Torna all’Evento
        </a>
    </div>

    <form action="{{ route('admin.events.staff.update', $event) }}" method="POST">
        @csrf
        @method('PUT')

        <div class="uo-card p-4 uo-form-animated">

            <h3 class="mb-4">👥 Staff disponibile</h3>

            @forelse($staffProfiles as $staff)
                @php
                    $pivot = $assigned->firstWhere('id', $staff->id)?->pivot;
                    $isAssigned = $pivot !== null;
                @endphp

                <div class="uo-staff-row mb-4 p-3 rounded"
                     style="border: 1px solid rgba(201,22,154,0.25);">

                    {{-- HEADER ROW --}}
                    <div class="d-flex justify-content-between align-items-center">

                        <div>
                            <strong>{{ $staff->stage_name }}</strong>
                            <div class="text-secondary small">
                                Ruolo base: {{ $staff->role }}
                            </div>
                        </div>

                        <label class="uo-switch">
                            <input
                                type="checkbox"
                                name="staff[{{ $staff->id }}][enabled]"
                                value="1"
                                {{ $isAssigned ? 'checked' : '' }}
                            >
                            <span class="slider"></span>
                        </label>
                    </div>

                    {{-- DETTAGLI EVENTO --}}
                    <div class="mt-3"
                         style="{{ $isAssigned ? '' : 'display:none;' }}"
                         data-staff-details>

                        <div class="row g-3">

                            {{-- ROLE OVERRIDE --}}
                            <div class="col-md-4 input-field">
                                <label>Ruolo nell’evento (override)</label>
                                <input
                                    type="text"
                                    name="staff[{{ $staff->id }}][role_in_event]"
                                    placeholder="Usa ruolo base se vuoto"
                                    value="{{ $pivot->role_in_event ?? '' }}"
                                >
                            </div>

                            {{-- FEE --}}
                            <div class="col-md-3 input-field">
                                <label>Cachet €</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="staff[{{ $staff->id }}][fee]"
                                    placeholder="Opzionale"
                                    value="{{ $pivot->fee ?? '' }}"
                                >
                            </div>

                            {{-- NOTES --}}
                            <div class="col-md-5 input-field">
                                <label>Note evento</label>
                                <input
                                    type="text"
                                    name="staff[{{ $staff->id }}][notes]"
                                    placeholder="Note specifiche per questo evento"
                                    value="{{ $pivot->notes ?? '' }}"
                                >
                            </div>

                        </div>

                        @if($staff->notes)
                            <div class="text-secondary small mt-2">
                                🛈 Note staff: {{ $staff->notes }}
                            </div>
                        @endif
                    </div>
                </div>

            @empty
                <div class="uo-empty-state text-secondary py-4">
                    Nessuno staff disponibile.
                </div>
            @endforelse

        </div>

        <div class="text-end mt-4">
            <button class="uo-btn-primary">
                Salva Staff Evento
            </button>
        </div>

    </form>
</div>

{{-- MINI JS SOLO PER UX --}}
<script>
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('staff-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', (e) => {
        const roleInputs = form.querySelectorAll('input[name$="[role_in_event]"]');
        let isValid = true;

        roleInputs.forEach(input => {
            if (!input.value) {
                isValid = false;
                // 👻 Toast se manca un ruolo
                window.toast('error', 'Ogni membro dello staff deve avere un ruolo specificato.', { duration: 5000 });
            }
        });

        if (!isValid) {
            e.preventDefault();
        }
    });
});

</script>
@endsection
