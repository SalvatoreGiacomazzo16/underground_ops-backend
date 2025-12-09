<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\StaffProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class StaffController extends Controller
{
    public function __construct()
    {
        $this->middleware('can:manage-staff');
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        $staff = StaffProfile::orderByDesc('created_at')
            ->paginate(15);

        return view('dashboard.staff.staff-index', compact('staff'));
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    public function create()
    {
        return view('dashboard.staff.staff-create');
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $data = $request->validate([
            'stage_name' => 'required|string|max:255',
            'role'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:255',
            'bio'        => 'nullable|string',
            'skills'     => 'nullable|string', // comma-separated string
            'is_active'  => 'sometimes|boolean',
            'notes'      => 'nullable|string',
        ]);

        // Convert skills string → array
        $skillsArray = null;
        if (!empty($data['skills'])) {
            $skillsArray = collect(explode(',', $data['skills']))
                ->map(fn ($s) => trim($s))
                ->filter()
                ->values()
                ->toArray();
        }

        StaffProfile::create([
            'stage_name' => $data['stage_name'],
            'role'       => $data['role'],
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Profilo staff creato con successo.');
    }

    /*
    |--------------------------------------------------------------------------
    | EDIT
    |--------------------------------------------------------------------------
    */
    public function edit(StaffProfile $staff)
    {
        // Per ricostruire stringa skills: DJ, PR, ecc.
        $skillsString = $staff->skills ? implode(', ', $staff->skills) : '';

        return view('dashboard.staff.staff-edit', compact('staff', 'skillsString'));
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, StaffProfile $staff)
    {
        $data = $request->validate([
            'stage_name' => 'required|string|max:255',
            'role'       => 'required|string|max:255',
            'phone'      => 'nullable|string|max:255',
            'bio'        => 'nullable|string',
            'skills'     => 'nullable|string',
            'is_active'  => 'sometimes|boolean',
            'notes'      => 'nullable|string',
        ]);

        // Convert skills back to array
        $skillsArray = null;
        if (!empty($data['skills'])) {
            $skillsArray = collect(explode(',', $data['skills']))
                ->map(fn ($s) => trim($s))
                ->filter()
                ->values()
                ->toArray();
        }

        $staff->update([
            'stage_name' => $data['stage_name'],
            'role'       => $data['role'],
            'phone'      => $data['phone'] ?? null,
            'bio'        => $data['bio'] ?? null,
            'skills'     => $skillsArray,
            'is_active'  => $request->boolean('is_active'),
            'notes'      => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Profilo staff aggiornato.');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function destroy(StaffProfile $staff)
    {
        $staff->delete();

        return redirect()
            ->route('admin.staff.index')
            ->with('success', 'Profilo staff rimosso.');
    }
}