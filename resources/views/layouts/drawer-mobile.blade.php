{{-- File: layouts/drawer-mobile.blade.php --}}

{{-- OVERLAY UNIVERSALE --}}
<div id="mobileNavOverlay" class="uo-mobile-overlay"></div>

{{-- DRAWER UNIVERSALE --}}
<nav id="mobileDrawerNav" class="uo-mobile-drawer">

    @auth
        <div class="mb-4">
            <p class="uo-user-label mb-1">Accesso:</p>
            <h5 class="text-white">{{ Auth::user()->name }}</h5>
        </div>

        <hr class="uo-divider-dark">

        {{-- Sidebar Admin versione mobile --}}
        @include('layouts.sidebar-content-mobile')

        <hr class="uo-divider-dark my-4">

        {{-- Logout --}}
        <form action="{{ route('logout') }}" method="POST">
            @csrf
            <button class="uo-btn-outline w-100 uo-btn-pink-outline mt-3">
                Logout
            </button>
        </form>
    @endauth

  @guest
    <ul class="uo-auth-list">
        <li><a href="{{ route('login') }}" class="uo-auth-btn">Login</a></li>
        <li><a href="{{ route('register') }}" class="uo-auth-btn">Registrati</a></li>
    </ul>
@endguest

</nav>
