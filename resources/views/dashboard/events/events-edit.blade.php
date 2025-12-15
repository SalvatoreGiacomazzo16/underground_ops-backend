@extends('layouts.admin')

@section('content')
<div class="container-fluid">

    <h1 class="fx-glitch uo-glitch-text mb-4">Modifica Evento</h1>

    <div class="uo-card p-4 uo-form-animated">
        <form action="{{ route('admin.events.update', $event) }}" method="POST">
            @csrf
            @method('PUT')

            @include('dashboard.events.partials.events-form', [
                'event'     => $event,
                'locations' => $locations
            ])

            <button class="uo-btn-primary mt-4">
                Salva Modifiche
            </button>
        </form>
    </div>

</div>
@endsection
