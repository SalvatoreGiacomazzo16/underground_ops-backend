<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClerkBridgeController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'clerk_id' => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255'],
            'name'     => ['nullable', 'string', 'max:255'],
        ]);

        // 1) match per clerk_id
        $user = User::where('clerk_id', $data['clerk_id'])->first();

        // 2) fallback match per email
        if (!$user) {
            $user = User::where('email', $data['email'])->first();
        }

        // 3) create se non esiste
        if (!$user) {
  $user = User::create([
    'clerk_id' => $data['clerk_id'],
    'name' => $data['name'] ?: Str::before($data['email'], '@'),
    'email' => $data['email'],
    'password' => Str::random(40),
    'role_id' => 3,
]);
        } else {
            // collega Clerk all'utente legacy
            if (!$user->clerk_id) {
                $user->clerk_id = $data['clerk_id'];
            }

            // aggiorna name solo se vuoto
            if (!$user->name && !empty($data['name'])) {
                $user->name = $data['name'];
            }

            $user->save();
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'ok' => true,
            'redirect' => route('admin.dashboard'),
        ]);
    }
}