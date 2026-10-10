<?php
/**
 * Kalalaya Fine Arts — Digital Easel lead capture
 * -------------------------------------------------------------
 * Called (JSON) when a visitor saves their drawing on the home page.
 * • Stores the lead in private/leads.csv (blocked from the web by private/.htaccess)
 * • Keeps a copy of their drawing in private/lead-art/
 * • Emails the lead to the enquiry recipient set in includes/config.php
 * Open private/leads.csv from the DirectAdmin File Manager (or download it)
 * to see every lead in Excel / Google Sheets.
 */
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/mailer.php';

ini_set('display_errors', '0');
error_reporting(E_ALL);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Content-Type: application/json; charset=utf-8');

const LEAD_DIR = __DIR__ . '/private';
const LEAD_MAX_ART_BYTES = 4 * 1024 * 1024;   // decoded PNG size limit

function reply(bool $ok, string $message, array $errors = [], int $code = 200): void {
    http_response_code($ok ? 200 : $code);
    echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => (object)$errors]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(false, 'Method not allowed.', [], 405);

start_session();

/* ---- Spam protection ---- */
if (!empty($_POST['website'])) reply(true, 'Thank you!');                                   // honeypot
if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
    reply(false, 'Your session expired. Please reload the page and try again.', [], 400);
}
$last = (int)($_SESSION['last_lead'] ?? 0);
if ($last && time() - $last < 20) reply(false, 'Please wait a few seconds and try again.', [], 429);

/* ---- Input ---- */
$line = static function ($v, int $max): string {
    $v = is_string($v) ? $v : '';
    $v = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $v) ?? '';
    return u_sub(trim(preg_replace('/\s+/', ' ', $v)), $max);
};
$in = [
    'name'    => $line($_POST['name'] ?? '', 80),
    'phone'   => $line($_POST['phone'] ?? '', 20),
    'email'   => $line($_POST['email'] ?? '', 120),
    'student' => $line($_POST['student'] ?? '', 80),
    'course'  => $line($_POST['course'] ?? '', 80),
];
$consent = !empty($_POST['consent']);

$errors = [];
if (u_len($in['name']) < 2) $errors['name'] = 'Please enter your name.';
$digits = preg_replace('/\D/', '', $in['phone']);
if ($in['phone'] === '') $errors['phone'] = 'Please enter your phone / WhatsApp number.';
elseif (!preg_match('/^[0-9+\-\s()]{7,20}$/', $in['phone']) || strlen($digits) < 7 || strlen($digits) > 15) $errors['phone'] = 'Please enter a valid phone number.';
if ($in['email'] !== '' && !filter_var($in['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address, or leave it empty.';
if ($in['course'] !== '' && !in_array($in['course'], cfg('course_options', []), true)) $errors['course'] = 'Please choose an option from the list.';
if (!$consent) $errors['consent'] = 'Please tick the box so we can contact you.';
if ($errors) reply(false, 'Please check the highlighted fields.', $errors, 422);

/* ---- Storage folder (created on first lead, never web-readable) ---- */
if (!is_dir(LEAD_DIR . '/lead-art') && !@mkdir(LEAD_DIR . '/lead-art', 0750, true)) {
    error_log('[Kalalaya lead] cannot create ' . LEAD_DIR);
}
if (!is_file(LEAD_DIR . '/.htaccess')) {
    @file_put_contents(LEAD_DIR . '/.htaccess', "Require all denied\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n");
}

$id = date('Ymd-His') . '-' . bin2hex(random_bytes(3));

/* ---- Keep their drawing (PNG data URL from the canvas) ---- */
$artFile = '';
$data = (string)($_POST['art'] ?? '');
if (strpos($data, 'data:image/png;base64,') === 0) {
    $png = base64_decode(substr($data, 22), true);
    if ($png !== false && strlen($png) <= LEAD_MAX_ART_BYTES && strncmp($png, "\x89PNG\r\n\x1a\n", 8) === 0) {
        $artFile = "lead-art/$id.png";
        if (@file_put_contents(LEAD_DIR . '/' . $artFile, $png) === false) $artFile = '';
    }
}

/* ---- Append to the CSV (Excel-friendly, formula-injection safe) ---- */
$csv = LEAD_DIR . '/leads.csv';
$safe = static fn(string $v): string => preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v;
$csvPhone = ltrim($in['phone'], '+');   // "+91 …" would be read as a formula by Excel
$row = [date('Y-m-d H:i'), $in['name'], $csvPhone, $in['email'], $in['student'], $in['course'] ?: 'Not sure yet', 'Digital Easel', $artFile, 'yes', $id];
$stored = false;
if ($fh = @fopen($csv, 'a')) {
    if (flock($fh, LOCK_EX)) {
        if (filesize($csv) === 0) {
            fwrite($fh, "\xEF\xBB\xBF");   // UTF-8 BOM so Excel shows Tamil/Unicode names correctly
            fputcsv($fh, ['Date', 'Name', 'Phone', 'Email', 'Student', 'Interested in', 'Source', 'Drawing file', 'Consent', 'Lead ID'], ',', '"', '\\');
        }
        fputcsv($fh, array_map($safe, $row), ',', '"', '\\');
        fflush($fh);
        flock($fh, LOCK_UN);
        $stored = true;
    }
    fclose($fh);
}

/* ---- Email the studio ---- */
$conf = cfg('enquiry');
$subject = '[New Lead] ' . $in['name'] . ' saved a drawing on the website';
$body  = "A visitor saved their drawing on the Digital Easel and shared their details.\n";
$body .= str_repeat('-', 44) . "\n";
$body .= "Name:           {$in['name']}\n";
$body .= "Phone/WhatsApp: {$in['phone']}\n";
$body .= 'Email:          ' . ($in['email'] ?: '—') . "\n";
$body .= 'Student:        ' . ($in['student'] ?: '—') . "\n";
$body .= 'Interested in:  ' . ($in['course'] ?: 'Not sure yet') . "\n";
$body .= str_repeat('-', 44) . "\n";
$body .= 'Their drawing:  ' . ($artFile ? "private/$artFile (on the web server)" : 'not saved') . "\n";
$body .= "All leads:      private/leads.csv\n";
$body .= 'Received: ' . date('d M Y, h:i A') . " · Lead ID: $id\n";
$replyTo = $in['email'] ?: $conf['recipient'];
$mailed = !empty($conf['smtp']['enabled'])
    ? smtp_send($conf, $conf['recipient'], $subject, $body, $replyTo, $in['name'])
    : mail_send($conf, $conf['recipient'], $subject, $body, $replyTo, $in['name']);

if (!$stored && !$mailed) {
    error_log('[Kalalaya lead] could not store or email lead ' . $id);
    reply(false, 'Sorry, something went wrong. Please try again, or call us on ' . cfg('phone_display') . '.', [], 500);
}
if (!$mailed) error_log('[Kalalaya lead] stored but email failed for ' . $id);

$_SESSION['last_lead'] = time();
reply(true, 'Thank you, ' . $in['name'] . '! Your artwork is downloading.');
