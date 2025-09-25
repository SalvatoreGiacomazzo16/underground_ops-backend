<?php


use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\EventController;

Auth::routes();

Route::get('/', [EventController::class, 'index'])->name('welcome');
Route::get('/home', [HomeController::class, 'index'])->name('home');


//Route::get('/', function () {
  //  return view('pages.welcome');
//})->name('welcome');
