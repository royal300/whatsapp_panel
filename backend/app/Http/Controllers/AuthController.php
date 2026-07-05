<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use App\Mail\WelcomeMail;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'company_name' => 'required|string|max:255',
        ]);

        $otp = sprintf('%06d', mt_rand(100000, 999999));

        $cacheData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'], // Storing raw temporarily is okay in secure cache, or store hashed.
            'company_name' => $validated['company_name'],
            'otp' => $otp
        ];

        Cache::put('registration_' . $validated['email'], $cacheData, now()->addMinutes(15));

        try {
            Mail::to($validated['email'])->send(new OtpMail($otp));
        } catch (\Exception $e) {
            // If email fails, we might want to handle it, but for now we proceed
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful. Please verify your email with the OTP sent.',
            'requires_otp' => true,
            'email' => $validated['email']
        ], 200);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6'
        ]);

        $cacheData = Cache::get('registration_' . $request->email);

        if (!$cacheData) {
            return response()->json(['message' => 'Verification session expired or not found. Please register again.'], 404);
        }

        if ($cacheData['otp'] !== $request->otp) {
            return response()->json(['message' => 'Invalid verification code'], 400);
        }

        // OTP is valid. Now create the tenant and user.
        $domainSlug = Str::slug($cacheData['company_name']) . '-' . Str::random(6) . '.royal300.com';
        
        $tenant = Tenant::create([
            'name' => $cacheData['company_name'],
            'domain' => $domainSlug
        ]);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $cacheData['name'],
            'email' => $cacheData['email'],
            'password' => Hash::make($cacheData['password']),
            'role' => 'admin',
            'email_verified_at' => Carbon::now()
        ]);

        Cache::forget('registration_' . $request->email);

        // Send welcome email
        try {
            Mail::to($user->email)->send(new WelcomeMail($user->name));
        } catch (\Exception $e) {
            \Log::error('Failed to send Welcome email: ' . $e->getMessage());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
            'tenant' => $user->tenant
        ], 200);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }
}
