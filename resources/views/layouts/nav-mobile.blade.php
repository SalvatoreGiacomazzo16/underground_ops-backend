{{-- File: layouts/nav-mobile.blade.php (TOPBAR MOBILE UNIVERSALE) --}}
<nav class="uo-mobile-nav d-flex d-md-none align-items-center px-3 py-2">

    {{-- HAMBURGER TOGGLE CONTAINER (gestito da JS) --}}
    <div id="mobileMenuToggleContainer" class="d-flex align-items-center"></div>

    {{-- LOGO/TITOLO MOBILE (Cliccabile per tornare alla Home) --}}
    <a href="{{ route('welcome') }}" class="d-flex align-items-center text-decoration-none">
        <span class="uo-mobile-signature ms-2 fw-bold">
            Underground Ops
        </span>
    </a>

    {{-- NOME UTENTE (Solo se autenticato, allineato a destra) --}}
    <div class="ms-auto d-flex align-items-center">
        @auth
            <span class="small fw-bold text-white">
                {{ Auth::user()->name }}
            </span>
        @endauth
    </div>

</nav>
