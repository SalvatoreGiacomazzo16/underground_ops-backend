@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    <h1 class="uo-section-title mb-4">Modifica Evento</h1>

    <form action="{{ route('admin.events.update', $event->id) }}" method="POST">
        @csrf
        @method('PUT')

      @include('dashboard.events.partials.events-form', [
    'event' => $event,
    'locations' => $locations
])

        <button class="uo-btn-primary mt-4">
            Salva Modifiche
        </button>
    </form>

</div>
@endsection
