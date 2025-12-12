@extends('layouts.admin')

@section('content')

<div class="container-fluid">

    {{-- TITOLO --}}
    <h1 class="fx-glitch uo-glitch-text mb-4">Crea Nuovo Evento</h1>

    {{-- FORM CARD --}}
    <div class="uo-card p-4 uo-form-animated">

        <form action="{{ route('admin.events.store') }}" method="POST">
            @csrf

            <div class="row g-4">

                {{-- TITOLO --}}
                <div class="col-md-6 input-field">
                    <label for="title">Titolo Evento</label>
                    <input id="title" name="title" type="text" placeholder="Inserisci un titolo" required>
                </div>

                {{-- TIPO --}}
                <div class="col-md-6 input-field">
                    <label for="event_type">Tipo Evento</label>
                    <select id="event_type" name="event_type" required>
                        <option value="live">Live</option>
                        <option value="djset">DJ Set</option>
                        <option value="party">Party</option>
                        <option value="festival">Festival</option>
                    </select>
                </div>

                {{-- DESCRIZIONE --}}
                <div class="col-12 input-field">
                    <label for="description">Descrizione</label>
                    <textarea id="description" name="description" rows="3" placeholder="Aggiungi una descrizione…"></textarea>
                </div>

                {{-- DATE --}}
                <div class="col-md-6 input-field">
                    <label for="start_datetime">Data & Ora Inizio</label>
                    <input id="start_datetime" name="start_datetime" type="datetime-local" required>
                </div>

                <div class="col-md-6 input-field">
                    <label for="end_datetime">Data & Ora Fine</label>
                    <input id="end_datetime" name="end_datetime" type="datetime-local">
                </div>

                {{-- LOCATION --}}
                <div class="col-md-6 input-field">
                    <label for="location_id">Location</label>
                    <select id="location_id" name="location_id" required>
                        @foreach ($locations as $location)
                            <option value="{{ $location->id }}">{{ $location->name }}</option>
                        @endforeach
                    </select>
                </div>

                {{-- STATO --}}
                <div class="col-md-6 input-field">
                    <label for="status">Stato</label>
                    <select id="status" name="status">
                        <option value="draft">Bozza</option>
                        <option value="published">Pubblicato</option>
                        <option value="cancelled">Cancellato</option>
                        <option value="archived">Archiviato</option>
                    </select>
                </div>

                {{-- VISIBILITÀ --}}
                <div class="col-md-6 input-field">
                    <label for="visibility">Visibilità</label>
                    <select id="visibility" name="visibility">
                        <option value="public">Pubblico</option>
                        <option value="private">Privato</option>
                    </select>
                </div>

                {{-- CAPACITÀ --}}
                <div class="col-md-6 input-field">
                    <label for="max_capacity">Capienza Massima</label>
                    <input id="max_capacity" name="max_capacity" type="number" placeholder="Es. 300">
                </div>

                {{-- MIN AGE --}}
                <div class="col-md-6 input-field">
                    <label for="min_age">Età Minima</label>
                    <input id="min_age" name="min_age" type="number" placeholder="Es. 18">
                </div>

                {{-- PREZZO --}}
                <div class="col-md-6 input-field">
                    <label for="base_ticket_price">Prezzo Base (€)</label>
                    <input id="base_ticket_price" name="base_ticket_price" type="number" step="0.01" placeholder="Es. 15.00">
                </div>

            </div>

            <button class="uo-btn-primary mt-4">
                Crea Evento
            </button>

        </form>
    </div>
</div>

@endsection
