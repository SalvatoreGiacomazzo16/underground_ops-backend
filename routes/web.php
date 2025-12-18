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

        /*
        |--------------------------------------------------------------------------
        | DASHBOARD
        |--------------------------------------------------------------------------
        */
        Route::get('/', [ManagerDashboardController::class, 'index'])
            ->name('dashboard');

        /*
        |--------------------------------------------------------------------------
        | EVENTS CRUD + STAFF EVENTO
        |--------------------------------------------------------------------------
        */
        Route::prefix('events')->name('events.')->group(function () {

            // LISTE
            Route::get('/',        [AdminEventController::class, 'index'])->name('index');
            Route::get('/table',   [AdminEventController::class, 'table'])->name('table');

            // CREATE
            Route::get('/create',  [AdminEventController::class, 'create'])->name('create');
            Route::post('/',       [AdminEventController::class, 'store'])->name('store');

            // EDIT / UPDATE
            Route::get('/{event}/edit', [AdminEventController::class, 'edit'])->name('edit');
            Route::put('/{event}',      [AdminEventController::class, 'update'])->name('update');

            // DELETE
            Route::delete('/{event}',   [AdminEventController::class, 'destroy'])->name('destroy');

            // 👥 STAFF ASSOCIATO ALL’EVENTO
            Route::get('/{event}/staff', [EventStaffController::class, 'edit'])
                ->name('staff.edit');

            Route::put('/{event}/staff', [EventStaffController::class, 'update'])
                ->name('staff.update');
        });

        /*
        |--------------------------------------------------------------------------
        | STAFF CRUD
        |--------------------------------------------------------------------------
        |
        | Views: resources/views/dashboard/staff/
        |
        */
        Route::resource('staff', StaffController::class)
            ->except(['show']);

        /*
        |--------------------------------------------------------------------------
        | LOCATION CRUD
        |--------------------------------------------------------------------------
        |
        | Views: resources/views/dashboard/locations/
        |
        */
        Route::resource('locations', LocationController::class)
            ->except(['show']);
    });

/*
|--------------------------------------------------------------------------
| HOMEPAGE PUBBLICA
|--------------------------------------------------------------------------
*/
Route::get('/', fn () => view('pages.welcome'))
    ->name('welcome');

/*
|--------------------------------------------------------------------------
| TEST DB (DEV ONLY)
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

Route::prefix('admin')
    ->name('admin.')
    ->middleware('auth')
    ->group(function () {

        Route::get('/timeline', function () {
            return view('dashboard.timeline.timeline-ops-index');
        })->name('timeline.index');

    });




/*
|--------------------------------------------------------------------------
| 404 FALLBACK
|--------------------------------------------------------------------------
*/
Route::fallback(fn () => response()->view('pages.not-found', [], 404));