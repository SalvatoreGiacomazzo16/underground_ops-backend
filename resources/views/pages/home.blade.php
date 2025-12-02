@extends('layouts.app')

@section('content')
<div class="container">

    <h2 class="mb-4" style="color:#C9169A;">Dashboard</h2>

    @if (session('status'))
        <div class="alert alert-success" role="alert">
            {{ session('status') }}
        </div>
    @endif

    @auth
        <p>Welcome back, {{ Auth::user()->name }}!</p>
    @else
        <p>You are not logged in.</p>
    @endauth

</div>
@endsection

