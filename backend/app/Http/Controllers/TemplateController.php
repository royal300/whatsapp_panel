<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Template;
use Illuminate\Support\Facades\Auth;
use App\Services\WhatsAppService;

class TemplateController extends Controller
{
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;
        return response()->json(Template::where('tenant_id', $tenantId)->orderBy('created_at', 'desc')->get());
    }

    public function sync()
    {
        $tenant = Auth::user()->tenant;
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 404);

        try {
            $ws = new WhatsAppService($tenant);
            $res = $ws->syncTemplates();

            if (isset($res['error'])) {
                return response()->json(['message' => 'Meta API Error: ' . ($res['error']['message'] ?? 'Unknown Error')], 400);
            }

            if (isset($res['data'])) {
                foreach ($res['data'] as $mt) {
                    // Extract body text from components
                    $bodyText = '';
                    if (isset($mt['components'])) {
                        foreach ($mt['components'] as $comp) {
                            if ($comp['type'] === 'BODY') $bodyText = $comp['text'];
                        }
                    }

                    Template::updateOrCreate(
                        ['tenant_id' => $tenant->id, 'name' => $mt['name']],
                        [
                            'whatsapp_template_id' => $mt['id'] ?? null,
                            'language' => $mt['language'] ?? 'en',
                            'category' => $mt['category'] ?? 'UTILITY',
                            'status' => $mt['status'] ?? 'PENDING',
                            'content' => $mt['components'] ?? [],
                            // We can add a custom attribute for body text if needed, or just parse content on frontend
                        ]
                    );
                }
            }

            return response()->json(['message' => 'Templates synced successfully', 'count' => count($res['data'] ?? [])]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Sync failed: ' . $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|regex:/^[a-z0-9_]+$/',
            'language' => 'required|string',
            'category' => 'required|string',
            'components' => 'required',
            'file' => 'nullable|file|max:16384'
        ]);

        $tenant = Auth::user()->tenant;
        
        $components = $request->input('components');
        if (is_string($components)) {
            $components = json_decode($components, true);
        }

        try {
            $ws = new WhatsAppService($tenant);
            
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $handle = $ws->uploadMedia(
                    file_get_contents($file->getRealPath()), 
                    $file->getMimeType(), 
                    $file->getSize()
                );
                
                // Attach handle to the header component
                foreach ($components as &$comp) {
                    if ($comp['type'] === 'HEADER' && in_array($comp['format'], ['IMAGE', 'VIDEO', 'DOCUMENT'])) {
                        $comp['example'] = [
                            'header_handle' => [$handle]
                        ];
                    }
                }
            }

            $res = $ws->createTemplate(
                $validated['name'],
                $validated['category'],
                $validated['language'],
                $components
            );

            if (isset($res['error'])) {
                return response()->json(['message' => 'Meta API Error: ' . ($res['error']['message'] ?? 'Unknown Error')], 400);
            }

            $template = Template::create([
                'tenant_id' => $tenant->id,
                'whatsapp_template_id' => $res['id'] ?? null,
                'name' => $validated['name'],
                'language' => $validated['language'],
                'category' => $validated['category'],
                'status' => 'PENDING',
                'content' => $components
            ]);

            return response()->json($template, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Creation failed: ' . $e->getMessage()], 500);
        }
    }

    public function show(string $id) { /*...*/ }
    public function update(Request $request, string $id) { /*...*/ }
    public function destroy(string $id) { /*...*/ }
}
