<!doctype html>
<html lang="it">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Underground Ops — Admin</title>

 @vite(['resources/sass/main.scss', 'resources/js/app.js'])
</head>

<body class="uo-bg-deep-dark">

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
            <main class="admin-content container-fluid py-4">
                @yield('content')
            </main>

        </div>
    </div>

</body>
</html>
