<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// CONTROLLER ADMIN
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\EventStaffController;
use App\Http\Controllers\ManagerDashboardController;


/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/
Auth::routes();

/*
|--------------------------------------------------------------------------
| Area Admin (protetta da auth)
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
        |
        | View usate:
        | - dashboard/events/events-index.blade.php
        | - dashboard/events/events-edit.blade.php
        | - dashboard/dashboard-create.blade.php   (create)
        |
        */

        Route::prefix('events')->name('events.')->group(function () {

            // LISTA EVENTI
            Route::get('/', [AdminEventController::class, 'index'])->name('index');

            // CREATE
            Route::get('/create', [AdminEventController::class, 'create'])->name('create');
            Route::post('/', [AdminEventController::class, 'store'])->name('store');

            // EDIT + UPDATE
            Route::get('/{event}/edit', [AdminEventController::class, 'edit'])->name('edit');
            Route::put('/{event}', [AdminEventController::class, 'update'])->name('update');

            // DELETE
            Route::delete('/{event}', [AdminEventController::class, 'destroy'])->name('destroy');
        });

        /*
        |--------------------------------------------------------------------------
        | STAFF CRUD
        | Usa StaffController con views in:
        | - resources/views/dashboard/staff/
        |--------------------------------------------------------------------------
        */
        Route::resource('staff', StaffController::class)->except(['show']);

        /*
        |--------------------------------------------------------------------------
        | STAFF ASSEGNATO AGLI EVENTI
        | View usata:
        | - dashboard/events/staff.blade.php
        |--------------------------------------------------------------------------
        */

        Route::get('events/{event}/staff', [EventStaffController::class, 'edit'])
            ->name('events.staff.edit');

        Route::post('events/{event}/staff', [EventStaffController::class, 'update'])
            ->name('events.staff.update');
    });


/*
|--------------------------------------------------------------------------
| Homepage pubblica
|--------------------------------------------------------------------------
*/
Route::get('/', fn() => view('pages.welcome'))->name('welcome');


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
| 404 Fallback
|--------------------------------------------------------------------------
*/
Route::fallback(fn() => response()->view('pages.not-found', [], 404));