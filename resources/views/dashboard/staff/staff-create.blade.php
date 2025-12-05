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

                {{-- Tipo staff --}}
                <div class="col-md-6 input-field">
                    <label for="staff_type">Tipo di Staff</label>
                    <select id="staff_type" name="staff_type" required>
                        <option value="registered">Utente Registrato</option>
                        <option value="external">Staff Esterno</option>
                    </select>
                </div>

                {{-- Sezione utenti registrati --}}
                <div class="col-md-6 input-field" id="user_wrapper">
                    <label for="user_id">Utente Registrato</label>
                    <select name="user_id" id="user_id">
                        <option value="">-- Seleziona utente --</option>
                        @foreach($users as $u)
                            <option value="{{ $u->id }}">
                                {{ $u->name }} ({{ $u->email }})
                            </option>
                        @endforeach
                    </select>
                </div>

                {{-- Stage Name --}}
                <div class="col-md-6 input-field">
                    <label for="stage_name">Stage Name</label>
                    <input type="text" id="stage_name" name="stage_name"
                           placeholder="DJ KRYPT, PR Giada, Security Mario…">
                </div>

                {{-- Telefono --}}
                <div class="col-md-6 input-field">
                    <label for="phone">Telefono</label>
                    <input type="text" id="phone" name="phone">
                </div>

                {{-- Bio --}}
                <div class="col-12 input-field">
                    <label for="bio">Bio</label>
                    <textarea id="bio" name="bio" rows="3"
                              placeholder="Breve descrizione dello staff…"></textarea>
                </div>

                {{-- Skills --}}
                <div class="col-12 input-field">
                    <label for="skills">Skills (separate da virgola)</label>
                    <input type="text" id="skills" name="skills"
                           placeholder="DJ, PR, Tecnico Luci…">
                </div>

                {{-- Attivo --}}
                <div class="col-md-6 d-flex align-items-center">
                    <div class="form-check form-switch">
                        <input class="form-check-input" name="is_active" value="1" type="checkbox"
                               name="is_active" id="is_active" checked>
                        <label class="form-check-label ms-2" for="is_active">
                            Attivo
                        </label>
                    </div>
                </div>

                {{-- Note interne --}}
                <div class="col-12 input-field">
                    <label for="notes">Note interne</label>
                    <textarea id="notes" name="notes" rows="3"
                              placeholder="Aggiungi eventuali note…"></textarea>
                </div>

            </div>

            <button class="uo-btn-primary mt-4">
                Salva Staff
            </button>

        </form>
    </div>
</div>

{{-- JS per abilitare/disabilitare lista utenti --}}
<script>
document.addEventListener('DOMContentLoaded', () => {
    const typeSelect = document.getElementById('staff_type');
    const userWrapper = document.getElementById('user_wrapper');

    function toggleUserInput() {
        if (typeSelect.value === 'registered') {
            userWrapper.style.display = 'block';
        } else {
            userWrapper.style.display = 'none';
        }
    }

    typeSelect.addEventListener('change', toggleUserInput);
    toggleUserInput();
});
</script>

@endsection
