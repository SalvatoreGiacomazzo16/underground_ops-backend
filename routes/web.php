<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

// ================================
// CONTROLLER ADMIN
// ================================

use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\EventTimelineController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\Admin\EventStaffController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\ManagerDashboardController;

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
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
        | EVENTS CRUD + SEZIONI EVENTO
        |--------------------------------------------------------------------------
        */
        Route::prefix('events')
            ->name('events.')
            ->group(function () {

                // ============================
                // LISTE
                // ============================
                Route::get('/',        [AdminEventController::class, 'index'])->name('index');
                Route::get('/table',   [AdminEventController::class, 'table'])->name('table');

                // ============================
                // CREATE
                // ============================
                Route::get('/create',  [AdminEventController::class, 'create'])->name('create');
                Route::post('/',       [AdminEventController::class, 'store'])->name('store');

                // ============================
                // EDIT / UPDATE
                // ============================
                Route::get('/{event}/edit', [AdminEventController::class, 'edit'])->name('edit');
                Route::put('/{event}',      [AdminEventController::class, 'update'])->name('update');

                // ============================
                // DELETE
                // ============================
                Route::delete('/{event}',   [AdminEventController::class, 'destroy'])->name('destroy');

                // ============================
                // STAFF ASSOCIATO ALL’EVENTO
                // ============================
                Route::get('/{event}/staff', [EventStaffController::class, 'edit'])
                    ->name('staff.edit');

                Route::put('/{event}/staff', [EventStaffController::class, 'update'])
                    ->name('staff.update');

                /*
                |--------------------------------------------------------------------------
                | TIMELINE EVENTO (CUORE OPERATIVO)
                |--------------------------------------------------------------------------
                |
                | Questa route È l’unica che deve renderizzare:
                | resources/views/dashboard/events/timeline.blade.php
                |
                */
                Route::get('/{event}/timeline', [EventTimelineController::class, 'show'])
                    ->name('timeline');
            });

        /*
        |--------------------------------------------------------------------------
        | STAFF CRUD
        |--------------------------------------------------------------------------
        */
        Route::resource('staff', StaffController::class)
            ->except(['show']);

        /*
        |--------------------------------------------------------------------------
        | LOCATION CRUD
        |--------------------------------------------------------------------------
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
if (app()->environment('local')) {
    Route::get('/db-test', function () {
        try {
            DB::connection()->getPdo();
            return "DB OK → " . DB::connection()->getDatabaseName();
        } catch (\Exception $e) {
            return "DB ERROR → " . $e->getMessage();
        }
    });
}

/*
|--------------------------------------------------------------------------
| 404 FALLBACK
|--------------------------------------------------------------------------
*/
Route::fallback(fn () => response()->view('pages.not-found', [], 404));
