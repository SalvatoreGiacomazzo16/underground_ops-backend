{{-- File: layouts/nav-desktop.blade.php (TOPBAR DESKTOP UNIVERSALE) --}}
@php
    // Controlla se l'utente si trova in una pagina pubblica (Home, Login, Register)
    $isGuestContext = request()->routeIs('welcome') || request()->routeIs('login') || request()->routeIs('register') || request()->routeIs('password.request');
@endphp

<nav class="uo-bg-deep-dark border-bottom uo-divider-dark d-none d-md-flex align-items-center justify-content-between px-4" style="min-height: 60px;">

    @if ($isGuestContext)
        {{-- ===================================
           TOPBAR COMPLETA (Pagine Pubbliche)
           =================================== --}}

        {{-- BRAND & LOGO --}}
        <a href="{{ route('welcome') }}" class="uo-logo text-decoration-none">
            {{-- Includo l'immagine del logo rotante e il titolo a tema --}}
            <img src="{{ asset('images/logo.png') }}" alt="Logo" class="uo-logo-img">
            <span class="uo-logo-text ms-2">Underground Ops</span>
        </a>

        {{-- LINKS (Login/Register o Dashboard/Logout) --}}
        <div class="d-flex align-items-center gap-3">
            @guest
                <a href="{{ route('login') }}" class="uo-btn">Login</a>
                <a href="{{ route('register') }}" class="uo-btn">Registrati</a>
            @endguest

            @auth
                <a href="{{ route('admin.dashboard') }}" class="uo-btn">Dashboard</a>
                <form action="{{ route('logout') }}" method="POST" class="d-inline">
                    @csrf
                    <button class="uo-btn-outline">Logout</button>
                </form>
            @endauth
        </div>

    @else
        {{-- ===================================
           TOPBAR UTILITY (Area Admin)
           =================================== --}}

        {{-- Saluto personalizzato (la navigazione è già nella Sidebar) --}}
        <h5 class="mb-0 me-auto">
          <span class="text-white">  @auth Benvenuto/a,</span> <span class="uo-name fx-glitch uo-glitch-text fw-bold">{{ Auth::user()->name }}</span> @endauth
        </h5>

        {{-- Placeholder per future utilità (es. Ricerca o notifiche) --}}
        <div class="text-secondary small">
            </div>
    @endif

</nav>
