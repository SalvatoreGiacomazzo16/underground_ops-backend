@extends('layouts.admin')
@php($hideTimelineOps = true)
@section('content')
<div class="container-fluid">

    <h1 class="fx-glitch uo-glitch-text mb-4">Aggiungi Nuova Location</h1>

    <div class="uo-card p-4 uo-form-animated">

        <form action="{{ route('admin.locations.store') }}" method="POST">
            @csrf

            <div class="row g-4">

                {{-- NOME --}}
                <div class="col-md-6 input-field">
                    <label for="name">Nome Location</label>
                    <input id="name" name="name" type="text" required placeholder="Duel Club, Officina 99…">
                </div>

                {{-- INDIRIZZO --}}
                <div class="col-md-6 input-field">
                    <label for="address">Indirizzo</label>
                    <input id="address" name="address" type="text" placeholder="Via Example 45">
                </div>

                {{-- CITTÀ --}}
                <div class="col-md-6 input-field">
                    <label for="city">Città</label>
                    <input id="city" name="city" type="text" placeholder="Napoli, Roma…">
                </div>

                {{-- PROVINCIA --}}
                <div class="col-md-6 input-field">
                    <label for="province">Provincia</label>
                    <input id="province" name="province" type="text" placeholder="NA, RM, MI…">
                </div>

                {{-- CAPACITÀ --}}
                <div class="col-md-6 input-field">
                    <label for="capacity_min">Capienza Minima</label>
                    <input id="capacity_min" name="capacity_min" type="number" placeholder="Es. 100">
                </div>

                <div class="col-md-6 input-field">
                    <label for="capacity_max">Capienza Massima</label>
                    <input id="capacity_max" name="capacity_max" type="number" placeholder="Es. 600">
                </div>

                {{-- CONTATTI --}}
                <div class="col-md-6 input-field">
                    <label for="contact_name">Referente</label>
                    <input id="contact_name" name="contact_name" type="text" placeholder="Nome referente…">
                </div>

                <div class="col-md-6 input-field">
                    <label for="contact_phone">Telefono Referente</label>
                    <input id="contact_phone" name="contact_phone" type="text">
                </div>

                {{-- NOTE --}}
                <div class="col-12 input-field">
                    <label for="notes">Note</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Note interne…"></textarea>
                </div>

            </div>

            <button class="uo-btn-primary mt-4">Salva Location</button>

        </form>
    </div>

</div>
@endsection
