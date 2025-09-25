@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">{{ __('Dashboard') }}</div>

                <div class="card-body">
                    @if (session('status'))
                        <div class="alert alert-success" role="alert">
                            {{ session('status') }}
                        </div>
                    @endif

                    {{ __('You are logged in!') }}
                </div>
            </div>
        </div>
    </div>
</div>
    <div class="row">
        @foreach ($events as $event)
            <div class="col-md-4 mb-4">
                <div class="card" style="width: 18rem;">
                    <img class="card-img-top"
     src="{{ $event->image ?? 'https://static.vecteezy.com/system/resources/previews/024/603/806/non_2x/rock-music-concert-background-illustration-ai-generativ.jpg' }}"
     alt="{{ $event->name }}">

                    <div class="card-body">
                        <h5 class="card-title">{{ $event->name }}</h5>
                        <p class="card-text">
                            {{ $event->description ?? 'None' }}
                        </p>
                        <p class="card-text">
                            <strong>Start:</strong> {{ $event->start }} <br>
                            <strong>At:</strong> {{$event->location->name ?? 'Unknown' }}
                        </p>

                    </div>
                </div>
            </div>
        @endforeach
    </div>
@endsection
