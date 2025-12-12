<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class LocationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | INDEX — Solo location dell’utente loggato
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        $locations = Location::where('user_id', Auth::id())
            ->orderBy('name')
            ->paginate(15);

        return view('dashboard.locations.locations-index', compact('locations'));
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    public function create()
    {
        return view('dashboard.locations.locations-create');
    }

    /*
    |--------------------------------------------------------------------------
    | STORE — Salva location associata all’utente
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'address'       => 'nullable|string',
            'city'          => 'nullable|string|max:255',
            'province'      => 'nullable|string|max:255',
            'capacity_min'  => 'nullable|integer|min:0',
            'capacity_max'  => 'nullable|integer|gte:capacity_min',
            'notes'         => 'nullable|string',
        ]);

        $data['slug']    = Str::slug($data['name']);
        $data['user_id'] = Auth::id();

        Location::create($data);

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location creata con successo!');
    }

    /*
    |--------------------------------------------------------------------------
    | EDIT — Sicurezza: solo location dell’utente
    |--------------------------------------------------------------------------
    */
    public function edit(Location $location)
    {
        if ($location->user_id !== Auth::id()) {
            abort(403);
        }

        return view('dashboard.locations.locations-edit', compact('location'));
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, Location $location)
    {
        if ($location->user_id !== Auth::id()) {
            abort(403);
        }

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'address'       => 'nullable|string',
            'city'          => 'nullable|string|max:255',
            'province'      => 'nullable|string|max:255',
            'capacity_min'  => 'nullable|integer|min:0',
            'capacity_max'  => 'nullable|integer|gte:capacity_min',
            'notes'         => 'nullable|string',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $location->update($data);

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location aggiornata!');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function destroy(Location $location)
    {
        if ($location->user_id !== Auth::id()) {
            abort(403);
        }

        $location->delete();

        return redirect()
            ->route('admin.locations.index')
            ->with('success', 'Location eliminata.');
    }
}
