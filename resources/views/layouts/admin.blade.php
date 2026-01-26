<!doctype html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Underground Ops — Admin</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">

    @vite(['resources/sass/main.scss', 'resources/js/app.js'])
</head>

<body class="uo-bg-deep-dark">

    {{-- STAFF DRAWER (GLOBAL, FUORI DALLA TIMELINE) --}}
    @include('dashboard.events.partials.tl-staff-drawer')

    <div id="uo-toasts"></div>

    {{-- UNIVERSAL MOBILE DRAWER --}}
    @include('layouts.drawer-mobile')

    <div class="d-flex" id="admin-layout-wrapper">

        {{-- SIDEBAR DESKTOP --}}
        @include('layouts.sidebar')

        <div class="flex-grow-1 d-flex flex-column">

            {{-- NAVBAR MOBILE --}}
            @include('layouts.nav-mobile')

            {{-- NAVBAR DESKTOP --}}
            @include('layouts.nav-desktop')

            {{-- PAGE CONTENT --}}
            <main class="admin-content p-1">
                @yield('content')
            </main>

        </div>
    </div>

    {{-- TOASTS --}}
    @if (session('success'))
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            toast('success', @json(session('success')));
        });
    </script>
    @endif

    @if (session('error'))
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            toast('error', @json(session('error')));
        });
    </script>
    @endif

    @if ($errors->any())
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            @foreach ($errors->all() as $error)
                toast('error', @json($error), { duration: 6000 });
            @endforeach
        });
    </script>
    @endif

</body>
</html>
