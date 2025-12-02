@extends(auth()->check() ? 'layouts.admin' : 'layouts.guest')

@section('content')

<div class="container py-5 d-flex flex-column align-items-center justify-content-center text-center">

    {{-- LOGO ROTANTE + GLITCH --}}
    <div class="uo-glitch-wrapper mb-4">
        <img src="{{ asset('images/logo.png') }}"
             alt="Underground Ops Logo"
             class="uo-404-logo uo-glitch img-fluid">
    </div>

    {{-- TITOLO --}}
    <h1 class="uo-title uo-glitch-text mb-3"
        data-text="404">
        404
    </h1>

    {{-- SOTTOTITOLO --}}
    <h2 class="uo-glitch-text mb-3"
        data-text="Pagina non trovata"
        style="font-family:'Eater', cursive; color:#C9169A;">
        Pagina non trovata
    </h2>

    {{-- TESTO --}}
    <p class="mb-4 text-light">
        La pagina che cerchi è scappata nel sottosuolo.
    </p>

    {{-- BOTTONE --}}
    <a href="{{ auth()->check() ? route('admin.dashboard') : route('welcome') }}"
       class="uo-btn uo-btn-outline">
       {{ auth()->check() ? 'Vai alla Dashboard' : 'Torna alla Home' }}
    </a>

</div>

@endsection
