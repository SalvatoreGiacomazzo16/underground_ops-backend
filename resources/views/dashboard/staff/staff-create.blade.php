@extends('layouts.admin')

@section('content')

<div class="container-fluid">

    {{-- TITOLO --}}
    <h1 class="fx-glitch uo-glitch-text mb-4">Aggiungi Nuovo Staff</h1>

    {{-- FORM CARD --}}
    <div class="uo-card p-4 uo-form-animated">

        {{-- ERRORI --}}
        @if($errors->any())
            <div class="alert alert-danger mb-4">
                <strong>Attenzione:</strong>
                <ul class="mb-0 mt-2">
                    @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('admin.staff.store') }}" method="POST">
            @csrf

            <div class="row g-4">

                {{-- RUOLO --}}
                <div class="col-md-6 input-field">
                    <label for="role">Ruolo</label>
                    <input
                        type="text"
                        id="role"
                        name="role"
                        value="{{ old('role') }}"
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
                        value="{{ old('stage_name') }}"
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
                        value="{{ old('phone') }}"
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
                    >{{ old('bio') }}</textarea>
                </div>

                {{-- Skills --}}
                <div class="col-12 input-field">
                    <label for="skills">Skills (separate da virgola)</label>
                    <input
                        type="text"
                        id="skills"
                        name="skills"
                        value="{{ old('skills') }}"
                        placeholder="DJ, PR, Tecnico luci…"
                    >
                </div>

                {{-- Attivo --}}
                <div class="col-md-6 d-flex align-items-center">
                    <div class="form-check form-switch">
                        <input
                            class="form-check-input"
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            value="1"
                            {{ old('is_active', 1) ? 'checked' : '' }}
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
                    >{{ old('notes') }}</textarea>
                </div>

            </div>

            <button class="uo-btn-primary mt-4">
                Salva Staff
            </button>

        </form>
    </div>
</div>

@endsection
