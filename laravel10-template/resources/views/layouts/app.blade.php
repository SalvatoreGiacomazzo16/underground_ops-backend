<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'homepage')</title>

    {{-- Vite styles --}}
    @vite(['resources/scss/app.scss', 'resources/js/app.js'])

    {{-- Sezione opzionale per stili extra --}}
    @yield('styles')
</head>
<body>

    {{-- Header (opzionale) --}}
    <header class="bg-light p-3 mb-4 border-bottom">
        <div class="container">
            <h1 class="h4 m-0">Laravel Template</h1>
        </div>
    </header>

    {{-- Contenuto principale --}}
    <main class="container">
        @yield('main-content')
    </main>

    {{-- Footer (opzionale) --}}
    <footer class="bg-light p-3 mt-5 border-top">
        <div class="container text-center">
            <small>&copy; {{ date('Y') }} - Tutti i diritti riservati</small>
        </div>
    </footer>

    {{-- Sezione opzionale per JS extra --}}
    @yield('scripts')
     @vite("resources/js/app.js")
</body>
</html>
