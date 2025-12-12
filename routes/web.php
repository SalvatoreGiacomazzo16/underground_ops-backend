<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// CONTROLLER ADMIN
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\EventStaffController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\ManagerDashboardController;

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/
Auth::routes();

/*
|--------------------------------------------------------------------------
| AREA ADMIN (protetta da auth)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // DASHBOARD
        Route::get('/', [ManagerDashboardController::class, 'index'])
            ->name('dashboard');

        /*
        |--------------------------------------------------------------------------
        | EVENT CRUD
        |--------------------------------------------------------------------------
        */
        Route::prefix('events')->name('events.')->group(function () {

            Route::get('/',        [AdminEventController::class, 'index'])->name('index');
            Route::get('/create',  [AdminEventController::class, 'create'])->name('create');
            Route::post('/',       [AdminEventController::class, 'store'])->name('store');

            Route::get('/{event}/edit', [AdminEventController::class, 'edit'])->name('edit');
            Route::put('/{event}',      [AdminEventController::class, 'update'])->name('update');

            Route::delete('/{event}',   [AdminEventController::class, 'destroy'])->name('destroy');
        });

        /*
        |--------------------------------------------------------------------------
        | STAFF CRUD
        |--------------------------------------------------------------------------
        |
        | Usa le views:
        | - resources/views/dashboard/staff/
        |
        */
        Route::resource('staff', StaffController::class)->except(['show']);

        /*
        |--------------------------------------------------------------------------
        | STAFF ASSEGNATO AGLI EVENTI
        |--------------------------------------------------------------------------
        */
        Route::get('events/{event}/staff',  [EventStaffController::class, 'edit'])->name('events.staff.edit');
        Route::post('events/{event}/staff', [EventStaffController::class, 'update'])->name('events.staff.update');

        /*
        |--------------------------------------------------------------------------
        | LOCATION CRUD (correttamente a livello admin, NON dentro events)
        |--------------------------------------------------------------------------
        */
        Route::resource('locations', LocationController::class)->except(['show']);
    });

/*
|--------------------------------------------------------------------------
| HOMEPAGE PUBBLICA
|--------------------------------------------------------------------------
*/
Route::get('/', fn() => view('pages.welcome'))->name('welcome');

/*
|--------------------------------------------------------------------------
| TEST DB
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
| 404 FALLBACK
|--------------------------------------------------------------------------
*/
Route::fallback(fn() => response()->view('pages.not-found', [], 404));