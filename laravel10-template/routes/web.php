<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\HomeController;

Auth::routes();


Route::get('/', function () {
    return view('pages.welcome');
})->name('welcome');


Route::get('/home', [App\Http\Controllers\HomeController::class, 'index'])->name('home');
