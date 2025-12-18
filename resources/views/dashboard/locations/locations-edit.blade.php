@extends('layouts.admin')
@php($hideTimelineOps = true)
@section('content')
<div class="container-fluid">

    <h1 class="fx-glitch uo-glitch-text mb-4">Modifica Location</h1>

    <div class="uo-card p-4 uo-form-animated">

        @if($errors->any())
            <div class="alert alert-danger mb-4">
                <ul class="mb-0">
                    @foreach($errors->all() as $err)
                        <li>{{ $err }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form action="{{ route('admin.locations.update', $location) }}" method="POST">
            @csrf
            @method('PUT')

          @include('dashboard.locations.partials.locations-form', [
    'location' => $location
])

            <button class="uo-btn-primary mt-4">
                Aggiorna Location
            </button>
        </form>

    </div>
</div>
@endsection
