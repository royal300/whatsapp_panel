<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Contact;
use Illuminate\Support\Facades\Auth;

class ContactController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(
            Contact::where('tenant_id', $tenantId)
                ->with('tags')
                ->latest()
                ->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'phone_number' => 'required|string',
            'profile_picture' => 'nullable|string',
            'status' => 'nullable|string|in:subscribed,unsubscribed'
        ]);

        $validated['tenant_id'] = Auth::user()->tenant_id;
        
        $contact = Contact::create($validated);

        return response()->json($contact, 201);
    }

    public function update(Request $request, string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string',
            'phone_number' => 'required|string',
            'profile_picture' => 'nullable|string',
            'status' => 'nullable|string|in:subscribed,unsubscribed',
            'tags' => 'nullable|string' // comma separated
        ]);

        $contact->update($validated);

        if (isset($validated['tags'])) {
            $this->syncTags($contact, $validated['tags']);
        }

        return response()->json($contact->load('tags'));
    }

    public function destroy(string $id)
    {
        $tenantId = Auth::user()->tenant_id;
        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);
        $contact->delete();
        return response()->json(['message' => 'Contact deleted'], 200);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $tenantId = Auth::user()->tenant_id;
        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        $headers = fgetcsv($handle);
        
        // Map headers to indices
        $headerMap = array_flip(array_map('strtolower', $headers));
        
        $count = 0;
        while (($row = fgetcsv($handle)) !== false) {
            $name = $row[$headerMap['name'] ?? 0] ?? '';
            $phone = $row[$headerMap['phone'] ?? $headerMap['phone_number'] ?? 1] ?? '';
            $tagsStr = $row[$headerMap['tags'] ?? 2] ?? '';
            
            if (!$phone) continue;

            // Format phone number: ensure it starts with +
            if (!str_starts_with($phone, '+')) {
                // If it starts with digits, prepend + (assume user provides country code)
                if (is_numeric($phone)) {
                    $phone = '+' . $phone;
                }
            }

            $profilePic = $row[$headerMap['profile_picture'] ?? $headerMap['image'] ?? -1] ?? null;

            $contact = Contact::updateOrCreate(
                ['tenant_id' => $tenantId, 'phone_number' => $phone],
                [
                    'name' => $name ?: 'Unknown', 
                    'status' => 'subscribed',
                    'profile_picture' => $profilePic ?: null
                ]
            );

            if ($tagsStr) {
                $this->syncTags($contact, $tagsStr);
            }
            $count++;
        }
        fclose($handle);

        return response()->json(['message' => "Successfully imported $count contacts"], 200);
    }

    private function syncTags(Contact $contact, string $tagsStr)
    {
        $tenantId = Auth::user()->tenant_id;
        $tagNames = array_map('trim', explode(',', $tagsStr));
        $tagIds = [];

        foreach ($tagNames as $name) {
            if (!$name) continue;
            $tag = \App\Models\ContactTag::firstOrCreate([
                'tenant_id' => $tenantId,
                'name' => $name
            ]);
            $tagIds[] = $tag->id;
        }

        $contact->tags()->sync($tagIds);
    }
}
