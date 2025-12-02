<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ManagerDashboardController;
/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/
Auth::routes();
Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {

    Route::get('/', [ManagerDashboardController::class, 'index'])
        ->name('dashboard');

    // EVENT CRUD
    Route::prefix('events')->name('events.')->group(function () {
        Route::get('/', [EventController::class, 'index'])->name('index');
        Route::get('/create', [EventController::class, 'create'])->name('create');
        Route::post('/', [EventController::class, 'store'])->name('store');
    });
});


/*
|--------------------------------------------------------------------------
| Pagina pubblica (Homepage)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return view('pages.welcome');
})->name('welcome');

/*
|--------------------------------------------------------------------------
| Test DB
|--------------------------------------------------------------------------
*/
Route::get('/db-test', function () {
    try {
        DB::connection()->getPdo();
        return "DB OK → " . DB::connection()->getDatabaseName();
    } catch (\Exception $e) {
        return "DB ERROR → " . $e->getMessage();
    }
});

/*
|--------------------------------------------------------------------------
| Area Riservata (solo utenti loggati)
|--------------------------------------------------------------------------
*/

//404 Handling
Route::fallback(function () {
    return response()
        ->view('pages.not-found', [], 404);
});