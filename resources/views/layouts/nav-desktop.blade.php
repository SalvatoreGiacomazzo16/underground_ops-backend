@php
    $isGuestContext =
        request()->routeIs('welcome') ||
        request()->routeIs('login') ||
        request()->routeIs('register') ||
        request()->routeIs('password.request');
@endphp

@if ($isGuestContext)
<nav class="uo-bg-deep-dark border-bottom uo-divider-dark d-none d-md-flex align-items-center justify-content-between px-4"
     style="min-height: 60px;">

    {{-- BRAND & LOGO --}}
    <a href="{{ route('welcome') }}" class="uo-logo text-decoration-none">
        <img src="{{ asset('images/logo.png') }}" alt="Logo" class="uo-logo-img">
        <span class="uo-logo-text ms-2">Underground Ops</span>
    </a>

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

</nav>
@endif
