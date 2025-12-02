<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class LocationController extends Controller
{
    public function index()
    {
        // Mostra solo le location create dall’utente loggato
        $locations = Location::where('created_by', Auth::id())->get();

        return view('locations.index', compact('locations'));
    }

    public function create()
    {
        return view('locations.create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'capacity_min' => 'nullable|integer',
            'capacity_max' => 'nullable|integer',
            'contact_name' => 'nullable|string',
            'contact_phone' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $data['slug'] = Str::slug($data['name']);
        $data['created_by'] = Auth::id();

        Location::create($data);

        return redirect()->route('locations.index')
                         ->with('success', 'Location creata con successo.');
    }

    public function edit(Location $location)
    {
        // Sicurezza: un utente NON può modificare location non sue
        abort_if($location->created_by !== Auth::id(), 403);

        return view('locations.edit', compact('location'));
    }

    public function update(Request $request, Location $location)
    {
        abort_if($location->created_by !== Auth::id(), 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'capacity_min' => 'nullable|integer',
            'capacity_max' => 'nullable|integer',
            'contact_name' => 'nullable|string',
            'contact_phone' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $data['slug'] = Str::slug($data['name']);

        $location->update($data);

        return redirect()->route('locations.index')
                         ->with('success', 'Location aggiornata.');
    }

    public function destroy(Location $location)
    {
        abort_if($location->created_by !== Auth::id(), 403);

        $location->delete();

        return redirect()->route('locations.index')
                         ->with('success', 'Location eliminata.');
    }
}