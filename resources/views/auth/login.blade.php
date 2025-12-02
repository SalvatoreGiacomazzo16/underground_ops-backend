@extends('layouts.guest')

@section('content')

<div class="container">
    <div class="row justify-content-center">
        <div class="col-12 col-md-6 col-lg-4">

            <div class="uo-card p-4">
<div class="text-center mb-4">
    <img src="{{ asset('images/logo.png') }}"
         alt="Underground Ops"
         class="uo-auth-logo">
</div>

                <h2 class="uo-title text-center" style="color: #C9169A;">Accedi</h2>

                <form method="POST" action="{{ route('login') }}">
                    @csrf

                    <div class="input-field">
                        <label for="email">Email</label>
                        <input id="email" type="email" name="email" required>
                    </div>

                    <div class="input-field">
                        <label for="password">Password</label>
                        <input id="password" type="password" name="password" required>
                    </div>

                    <button class="btn w-100 uo-btn-primary mt-3">
                        Accedi
                    </button>

                    <p class="text-center text-muted mt-3">
                        Nessun account?
                        <a href="{{ route('register') }}" class="uo-link">Registrati</a>
                    </p>

                </form>

            </div>

        </div>
    </div>
</div>

@endsection
