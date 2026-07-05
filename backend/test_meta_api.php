<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = App\Models\Tenant::find(1);
$ws = new App\Services\WhatsAppService($tenant);

$testCases = [
    // Test Case 1: Simple text body with website URL button (no header)
    'text_with_url_btn' => [
        'name' => 'test_text_url_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            [
                'type' => 'BODY',
                'text' => 'Hello this is a test from Royal 300'
            ],
            [
                'type' => 'BUTTONS',
                'buttons' => [
                    [
                        'type' => 'URL',
                        'text' => 'Visit Us',
                        'url' => 'https://royal300.com/'
                    ]
                ]
            ]
        ]
    ],
    // Test Case 2: Simple text body with phone number button (no header)
    'text_with_phone_btn' => [
        'name' => 'test_text_phone_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            [
                'type' => 'BODY',
                'text' => 'Hello this is a test from Royal 300'
            ],
            [
                'type' => 'BUTTONS',
                'buttons' => [
                    [
                        'type' => 'PHONE_NUMBER',
                        'text' => 'Call Us',
                        'phone_number' => '+919836208908'
                    ]
                ]
            ]
        ]
    ],
    // Test Case 3: Image header only, no buttons
    'image_no_btn' => [
        'name' => 'test_image_nobtn_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            [
                'type' => 'HEADER',
                'format' => 'IMAGE',
                'example' => [
                    'header_url' => ['https://whatsapp.royal300.com/sample.png']
                ]
            ],
            [
                'type' => 'BODY',
                'text' => 'Hello this is a test from Royal 300'
            ]
        ]
    ],
    // Test Case 4: Image header and phone number button
    'image_with_phone_btn' => [
        'name' => 'test_image_phone_' . time(),
        'category' => 'MARKETING',
        'language' => 'en_US',
        'components' => [
            [
                'type' => 'HEADER',
                'format' => 'IMAGE',
                'example' => [
                    'header_url' => ['https://whatsapp.royal300.com/sample.png']
                ]
            ],
            [
                'type' => 'BODY',
                'text' => 'Hello this is a test from Royal 300'
            ],
            [
                'type' => 'BUTTONS',
                'buttons' => [
                    [
                        'type' => 'PHONE_NUMBER',
                        'text' => 'Call Us',
                        'phone_number' => '+919836208908'
                    ]
                ]
            ]
        ]
    ]
];

foreach ($testCases as $key => $payload) {
    echo "=== Running Test: {$key} ===\n";
    try {
        $res = $ws->createTemplate(
            $payload['name'],
            $payload['category'],
            $payload['language'],
            $payload['components']
        );
        echo "Response:\n";
        print_r($res);
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
