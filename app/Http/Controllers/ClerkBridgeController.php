<?php

namespace App\Http\Controllers;

use App\Models\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ClerkBridgeController extends Controller
{
    public function store(Request $request)
    {
        $token = $this->extractSessionToken($request);

        // Percorso corretto: token Clerk verificato lato server
        if ($token) {
            return $this->loginFromVerifiedClerkToken($request, $token);
        }

        // Fallback temporaneo SOLO in locale, finché non aggiorniamo il frontend
        if (app()->environment('local')) {
            return $this->legacyLocalBridge($request);
        }

        return $this->unauthorizedResponse($request, 'Missing Clerk session token.');
    }

    private function loginFromVerifiedClerkToken(Request $request, string $token)
    {
        try {
            $claims = $this->verifyClerkToken($token);
        } catch (\Throwable $e) {
            report($e);

            return $this->unauthorizedResponse($request, 'Invalid Clerk session token.');
        }

        $clerkId = $claims->sub ?? null;

        if (!$clerkId || !is_string($clerkId)) {
            return $this->unauthorizedResponse($request, 'Missing Clerk user id in token.');
        }

        try {
            $clerkUser = $this->fetchClerkUser($clerkId);
        } catch (\Throwable $e) {
            report($e);

            return $this->unauthorizedResponse($request, 'Unable to fetch Clerk user.');
        }

        $email = $this->extractPrimaryEmail($clerkUser);

        if (!$email) {
            return $this->unauthorizedResponse($request, 'Clerk user has no primary email.');
        }

        $name = $this->extractDisplayName($clerkUser, $email);

        $user = $this->findOrCreateUser(
            clerkId: $clerkId,
            email: $email,
            name: $name
        );

        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        if ($request->expectsJson()) {
            return response()->json([
                'ok' => true,
                'redirect' => route('admin.dashboard'),
            ]);
        }

        return redirect()->route('admin.dashboard');
    }

    private function legacyLocalBridge(Request $request)
    {
        $data = $request->validate([
            'clerk_id' => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255'],
            'name'     => ['nullable', 'string', 'max:255'],
        ]);

        $user = $this->findOrCreateUser(
            clerkId: $data['clerk_id'],
            email: $data['email'],
            name: $data['name'] ?: Str::before($data['email'], '@')
        );

        Auth::guard('web')->login($user, true);
        $request->session()->regenerate();

        if ($request->expectsJson()) {
            return response()->json([
                'ok' => true,
                'redirect' => route('admin.dashboard'),
                'legacy' => true,
            ]);
        }

        return redirect()->route('admin.dashboard');
    }

    private function findOrCreateUser(string $clerkId, string $email, string $name): User
    {
        $user = User::where('clerk_id', $clerkId)->first();

        if (!$user) {
            $user = User::where('email', $email)->first();
        }

        if (!$user) {
            return User::create([
                'clerk_id' => $clerkId,
                'name'     => $name,
                'email'    => $email,
                'password' => Str::random(40),
                'role_id'  => 3,
            ]);
        }

        $dirty = false;

        if ($user->clerk_id !== $clerkId) {
            $user->clerk_id = $clerkId;
            $dirty = true;
        }

        if ($user->email !== $email) {
            $user->email = $email;
            $dirty = true;
        }

        if ((!$user->name || trim($user->name) === '') && $name) {
            $user->name = $name;
            $dirty = true;
        }

        if ($dirty) {
            $user->save();
        }

        return $user;
    }

    private function extractSessionToken(Request $request): ?string
    {
        $authorization = $request->header('Authorization');

        if ($authorization && preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return trim($matches[1]);
        }

        $cookieToken = $request->cookie('__session');

        if (is_string($cookieToken) && trim($cookieToken) !== '') {
            return trim($cookieToken);
        }

        return null;
    }

    private function verifyClerkToken(string $token): object
    {
        $publicKey = env('CLERK_JWT_KEY');

        if (!$publicKey) {
            throw new \RuntimeException('Missing CLERK_JWT_KEY.');
        }

        $claims = JWT::decode($token, new Key($publicKey, 'RS256'));

        $authorizedParties = collect(explode(',', (string) env('CLERK_AUTHORIZED_PARTIES', '')))
            ->map(fn ($value) => trim($value))
            ->filter()
            ->values();

        if ($authorizedParties->isNotEmpty() && isset($claims->azp)) {
            if (!$authorizedParties->contains($claims->azp)) {
                throw new \RuntimeException('Unauthorized party.');
            }
        }

        return $claims;
    }

    private function fetchClerkUser(string $clerkUserId): array
    {
        $secretKey = env('CLERK_SECRET_KEY');

        if (!$secretKey) {
            throw new \RuntimeException('Missing CLERK_SECRET_KEY.');
        }

        $response = Http::withToken($secretKey)
            ->acceptJson()
            ->get("https://api.clerk.com/v1/users/{$clerkUserId}");

        if ($response->failed()) {
            throw new \RuntimeException('Failed to fetch Clerk user: ' . $response->body());
        }

        return $response->json();
    }

    private function extractPrimaryEmail(array $clerkUser): ?string
    {
        $primaryEmailId = data_get($clerkUser, 'primary_email_address_id');
        $emailAddresses = data_get($clerkUser, 'email_addresses', []);

        if (!is_array($emailAddresses)) {
            return null;
        }

        foreach ($emailAddresses as $emailAddress) {
            if (
                data_get($emailAddress, 'id') === $primaryEmailId &&
                is_string(data_get($emailAddress, 'email_address'))
            ) {
                return data_get($emailAddress, 'email_address');
            }
        }

        $fallback = data_get($emailAddresses, '0.email_address');

        return is_string($fallback) ? $fallback : null;
    }

    private function extractDisplayName(array $clerkUser, string $email): string
    {
        $firstName = trim((string) data_get($clerkUser, 'first_name', ''));
        $lastName = trim((string) data_get($clerkUser, 'last_name', ''));
        $username = trim((string) data_get($clerkUser, 'username', ''));

        $fullName = trim($firstName . ' ' . $lastName);

        if ($fullName !== '') {
            return $fullName;
        }

        if ($username !== '') {
            return $username;
        }

        return Str::before($email, '@');
    }

    private function unauthorizedResponse(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'ok' => false,
                'message' => $message,
            ], 401);
        }

        return redirect()
            ->route('welcome')
            ->with('auth_error', $message);
    }
}
