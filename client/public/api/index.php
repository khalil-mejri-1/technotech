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

// Handle Admin 2FA Google Authenticator Verification Endpoint
if (preg_match('#/(?:api/)?(?:technotech/)?admin/verify-totp/?(?:\?.*)?$#i', $requestUri) && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");

    $input = json_decode(file_get_contents('php://input'), true);
    $code = trim((string)($input['code'] ?? ''));

    // Base32 Decoder for RFC 4648
    function php_base32_decode($b32) {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $b32 = strtoupper(rtrim(trim($b32), '='));
        $binary = '';
        for ($i = 0; $i < strlen($b32); $i++) {
            $pos = strpos($alphabet, $b32[$i]);
            if ($pos === false) continue;
            $binary .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }
        $bytes = '';
        for ($i = 0; $i + 8 <= strlen($binary); $i += 8) {
            $bytes .= chr(bindec(substr($binary, $i, 8)));
        }
        return $bytes;
    }

    // TOTP Generator
    function php_generate_totp($secret, $timeStep = 30, $timestamp = null) {
        if ($timestamp === null) $timestamp = time();
        $counter = floor($timestamp / $timeStep);
        $secretBytes = php_base32_decode($secret);
        $packedCounter = pack('NN', 0, $counter); // 64-bit big-endian
        $hash = hash_hmac('sha1', $packedCounter, $secretBytes, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;
        return str_pad((string)$code, 6, '0', STR_PAD_LEFT);
    }

    // Verify TOTP with +/- 1 time step tolerance (30 seconds)
    function php_verify_totp($token, $secret, $window = 1) {
        $token = trim((string)$token);
        if (!preg_match('/^\d{6}$/', $token)) return false;
        $now = time();
        for ($i = -$window; $i <= $window; $i++) {
            if (php_generate_totp($secret, 30, $now + ($i * 30)) === $token) {
                return true;
            }
        }
        return false;
    }

    $secretKey = getenv('ADMIN_TOTP_SECRET') ?: 'TECHNOTECHSECUREKEYFORADMIN23456';

    if (php_verify_totp($code, $secretKey)) {
        echo json_encode([
            'success' => true,
            'message' => 'Authentification réussie'
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Code d\'accès incorrect ou expiré'
        ]);
    }
    exit;
}

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
