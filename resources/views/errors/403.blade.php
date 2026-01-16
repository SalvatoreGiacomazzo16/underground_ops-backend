@extends(auth()->check() ? 'layouts.admin' : 'layouts.guest')

@section('content')

<div class="container py-5 d-flex flex-column align-items-center justify-content-center text-center">

    {{-- LOGO ROTANTE + GLITCH --}}
    <div class="uo-glitch-wrapper mb-4">
        <img src="{{ asset('images/logo.png') }}"
             alt="Underground Ops Logo"
             class="uo-404-logo uo-glitch img-fluid">
    </div>

    {{-- CODICE ERRORE --}}
    <h1 class="uo-title uo-glitch-text mb-3"
        data-text="403">
        403
    </h1>

    {{-- SOTTOTITOLO --}}
    <h2 class="uo-glitch-text mb-3"
        data-text="Accesso negato"
        style="font-family:'Eater', cursive; color:#C9169A;">
        Accesso negato
    </h2>

    {{-- TESTO --}}
    <p class="mb-4 text-light">
        Questa zona è riservata.<br>
        Non hai i permessi per accedere a questa sezione.
    </p>

    {{-- AZIONI --}}
    <div class="d-flex gap-3 flex-wrap justify-content-center">

        <a href="{{ auth()->check() ? route('admin.dashboard') : route('welcome') }}"
           class="uo-btn uo-btn-outline">
            {{ auth()->check() ? 'Torna alla Dashboard' : 'Torna alla Home' }}
        </a>
    </div>

</div>

@endsection
