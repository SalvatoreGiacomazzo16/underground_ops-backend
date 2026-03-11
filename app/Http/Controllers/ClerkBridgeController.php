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

        $user = User::where('clerk_id', $data['clerk_id'])->first();

        if (!$user) {
            $user = User::where('email', $data['email'])->first();
        }

        if (!$user) {
            $user = User::create([
                'clerk_id' => $data['clerk_id'],
                'name' => $data['name'] ?: Str::before($data['email'], '@'),
                'email' => $data['email'],
                'password' => Str::random(40),
                'role_id' => 3,
            ]);
        } else {
            if (!$user->clerk_id) {
                $user->clerk_id = $data['clerk_id'];
            }

            if (!$user->name && !empty($data['name'])) {
                $user->name = $data['name'];
            }

            $user->save();
        }

        Auth::guard('web')->login($user);

        return redirect()->route('admin.dashboard');
    }
}
