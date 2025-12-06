@extends('layouts.admin')

@section('content')
<div class="uo-dashboard container-fluid">

    <h1 class="uo-section-title mb-4">Modifica Evento</h1>

    <form action="{{ route('admin.events.update', $event) }}" method="POST">
        @csrf
        @method('PUT')

        @include('dashboard.events.partials.form-fields', [
            'event' => $event,
            'locations' => $locations
        ])

        <button class="uo-dashboard-btn mt-3">Salva Modifiche</button>
    </form>

</div>
@endsection
