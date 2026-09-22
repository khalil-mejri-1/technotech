<?php
/**
 * TechnoTech Reverse Proxy Script
 * Completely hides the backend server URL (papayawhip-tapir-274068.hostingersite.com)
 * from visitors and DevTools Network tab.
 */

// Target backend base URL (completely hidden from browser)
$backendBaseUrl = 'https://papayawhip-tapir-274068.hostingersite.com';

// Handle CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
    header("Access-Control-Max-Age: 86400");
    http_response_code(200);
    exit(0);
}

// Get the requested URI (e.g. /api/technotech/settings?foo=bar)
$requestUri = $_SERVER['REQUEST_URI'] ?? '/api';

// Construct the full backend target URL
$targetUrl = rtrim($backendBaseUrl, '/') . '/' . ltrim($requestUri, '/');

// Initialize cURL session
$ch = curl_init($targetUrl);

// Forward HTTP Method
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Forward Request Body if POST/PUT/PATCH/DELETE
$requestBody = file_get_contents('php://input');
if (!empty($requestBody)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
}

// Forward Request Headers
$forwardHeaders = [];
$ignoreHeaders = ['host', 'content-length', 'connection', 'accept-encoding'];

if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        if (!in_array(strtolower($name), $ignoreHeaders)) {
            $forwardHeaders[] = "{$name}: {$value}";
        }
    }
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
            if (!in_array(strtolower($headerName), $ignoreHeaders)) {
                $forwardHeaders[] = "{$headerName}: {$value}";
            }
        }
    }
}

if (isset($_SERVER['CONTENT_TYPE'])) {
    $forwardHeaders[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}

$forwardHeaders[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '');
$forwardHeaders[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http');
curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);

// cURL Options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

// Execute request
$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Erreur de connexion au serveur backend',
        'details' => curl_error($ch)
    ]);
    curl_close($ch);
    exit;
}

// Separate response headers and body
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);
curl_close($ch);

// Set HTTP Status Code
http_response_code($httpCode);

// Forward relevant response headers
header("Access-Control-Allow-Origin: *");
$headerLines = explode("\r\n", $responseHeaders);
foreach ($headerLines as $headerLine) {
    $lower = strtolower($headerLine);
    if (strpos($lower, 'content-type:') === 0) {
        header($headerLine);
    }
}

// Output response body
echo $responseBody;
exit;
