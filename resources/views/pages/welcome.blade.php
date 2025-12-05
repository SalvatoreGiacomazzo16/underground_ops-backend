@extends('layouts.guest')

@section('page-padding', 'pt-0')

@section('content')

<section class="uo-welcome-hero">

    <div class="uo-welcome-overlay"></div>

    <div class="uo-welcome-inner">

        <img src="{{ asset('images/logo.png') }}"
             class="uo-welcome-logo img-fluid"
             alt="Underground Ops">

        <h1 class="uo-welcome-title mt-3 mb-2">
            Underground Ops — Back Office
        </h1>

        <p class="uo-welcome-subtitle mb-4">
            La suite operativa per gestire eventi, location e staff<br>
            con controllo totale e zero rumore.
        </p>

   <div class="uo-welcome-cta d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mb-4">

    @guest
        <a href="{{ route('login') }}" class="uo-btn-primary">
            Accedi alla Piattaforma
        </a>

        <a href="{{ route('register') }}" class="uo-btn-secondary">
            Registrati
        </a>
    @endguest

    @auth
        <a href="{{ route('admin.dashboard') }}" class="uo-btn-primary">
            Torna alla Dashboard
        </a>
    @endauth

</div>


        <div class="uo-feature-strip row g-3 g-md-4 justify-content-center">

            <div class="col-12 col-md-4">
                <div class="uo-feature-pill">
                    <div class="uo-feature-pill-icon">🎛</div>
                    <div class="uo-feature-pill-body">
                        <h3 class="uo-feature-pill-title">Eventi</h3>
                        <p class="uo-feature-pill-text">
                            Crea, programma e pubblica in pochi click.
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-4">
                <div class="uo-feature-pill">
                    <div class="uo-feature-pill-icon">📍</div>
                    <div class="uo-feature-pill-body">
                        <h3 class="uo-feature-pill-title">Location</h3>
                        <p class="uo-feature-pill-text">
                            Sale, spazi e capienze sempre sotto controllo.
                        </p>
                    </div>
                </div>
            </div>

            <div class="col-12 col-md-4">
                <div class="uo-feature-pill">
                    <div class="uo-feature-pill-icon">👥</div>
                    <div class="uo-feature-pill-body">
                        <h3 class="uo-feature-pill-title">Staff & Ruoli</h3>
                        <p class="uo-feature-pill-text">
                            Turni, permessi e responsabilità chiarissime.
                        </p>
                    </div>
                </div>
            </div>

        </div>

        <p class="uo-welcome-mini text-white mt-4 mb-0">
            Underground Ops © {{ date('Y') }} — Professional Back Office Suite
        </p>

    </div>
</section>

@endsection
