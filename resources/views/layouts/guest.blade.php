<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">


    <title>Underground Ops</title>

    <link href="https://fonts.bunny.net/css?family=Nunito" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Eater&display=swap" rel="stylesheet">

    @vite([
        'resources/sass/main.scss',
        'resources/js/app.js'
    ])
</head>

<body class="bg-black text-white">

    {{-- =============================
        MOBILE NAV
    ============================== --}}
    @include('layouts.nav-mobile')

   {{-- =============================
        MOBILE DRAWER
    ============================== --}}
    @include('layouts.drawer-mobile')


        {{-- =============================
        DESKTOP NAV
    ============================== --}}
   <!-- @include('layouts.nav-desktop') -->

    {{-- =============================
        PAGE CONTENT
    ============================== --}}
    <main class="@yield('page-padding', 'py-4')">
        @yield('content')
    </main>

</body>
</html>
