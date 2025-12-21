@extends('layouts.admin')

@section('content')
<div class="container-fluid">

    <h1 class="fx-glitch uo-glitch-text mb-4">Aggiungi Nuovo Staff</h1>

    <div class="uo-card p-4 uo-form-animated">

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

            @include('dashboard.staff.partials.staff-form')

            <button class="uo-btn-primary mt-4">
                Salva Staff
            </button>
        </form>

    </div>
</div>
@endsection
