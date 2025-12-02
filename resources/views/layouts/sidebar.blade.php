{{-- File: layouts/sidebar.blade.php — DEEP UNDERGROUND EDITION --}}
<nav class="admin-sidebar deep-sidebar text-white d-none d-md-flex flex-column p-4">

    {{-- BRAND --}}
    <div class="sidebar-brand text-center mb-5">
        <h3 class="sidebar-title">Underground Ops</h3>
        <small class="sidebar-subtitle">Back Office</small>
    </div>

    {{-- NAVIGATION --}}
    @include('layouts.sidebar-content-mobile')

    {{-- LOGOUT --}}
    <div class="mt-auto pt-4">
        <form action="{{ route('logout') }}" method="POST">
            @csrf
            <button class="uo-btn-logout w-100">
                Logout
            </button>
        </form>
    </div>
</nav>
