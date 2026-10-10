<?php
/**
 * Kalalaya Fine Arts — enquiry form handler
 * -------------------------------------------------------------
 * • Accepts POST from contact.php
 * • JavaScript requests (Accept: application/json) get a JSON reply
 * • Plain form posts are redirected back to contact.php#enquiry
 * • Nothing is stored in a database; the enquiry is emailed only.
 * Configure the recipient / sender / optional SMTP in includes/config.php
 */
define('KALALAYA', true);
require __DIR__ . '/includes/functions.php';
require __DIR__ . '/includes/mailer.php';

ini_set('display_errors', '0');          // never show PHP errors to visitors
error_reporting(E_ALL);
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $message, array $errors = [], array $old = []): void {
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($ok ? 200 : ($errors ? 422 : 400));
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'message' => $message, 'errors' => (object)$errors]);
    } else {
        $_SESSION['enquiry_flash'] = ['status' => $ok ? 'success' : 'error', 'message' => $message, 'errors' => $errors, 'old' => $ok ? [] : $old];
        header('Location: contact.php#enquiry', true, 303);
    }
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: contact.php', true, 303);
    exit;
}

start_session();
$conf = cfg('enquiry');

/* ---- Read & normalise input ---- */
$clean = static function ($v, int $max): string {
    $v = is_string($v) ? $v : '';
    $v = str_replace("\0", '', $v);
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return u_sub(trim($v), $max);
};
$oneLine = static fn(string $v): string => trim(preg_replace('/[\r\n\t]+/', ' ', $v));

$in = [
    'name'    => $oneLine($clean($_POST['name'] ?? '', 120)),
    'phone'   => $oneLine($clean($_POST['phone'] ?? '', 40)),
    'email'   => $oneLine($clean($_POST['email'] ?? '', 160)),
    'course'  => $oneLine($clean($_POST['course'] ?? '', 80)),
    'message' => $clean($_POST['message'] ?? '', 3000),
];

/* ---- Spam protection ---- */
// 1. Honeypot filled → pretend success so bots learn nothing
if (!empty($_POST['website'])) respond(true, 'Thank you! Your enquiry has been sent.');

// 2. Session token (blocks cross-site posts and direct bot posts)
if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
    respond(false, 'Your session expired. Please reload the page and try again.', [], $in);
}
// 3. Too fast to be human
$started = (int)($_SESSION['form_started'] ?? 0);
if ($started && (time() - $started) < (int)$conf['min_seconds']) {
    respond(false, 'That was quick! Please wait a moment and send the form again.', [], $in);
}
// 4. Cool-down between submissions
$last = (int)($_SESSION['last_enquiry'] ?? 0);
if ($last && (time() - $last) < (int)$conf['cooldown']) {
    respond(false, 'You have just sent an enquiry. Please wait a minute before sending another.', [], $in);
}

/* ---- Validation ---- */
$errors = [];
$len = static fn(string $s): int => u_len($s);

if ($len($in['name']) < 2)        $errors['name'] = 'Please enter your name.';
elseif ($len($in['name']) > 80)   $errors['name'] = 'Name must be 80 characters or fewer.';

$digits = preg_replace('/\D/', '', $in['phone']);
if ($in['phone'] === '')          $errors['phone'] = 'Please enter your phone number.';
elseif (!preg_match('/^[0-9+\-\s()]{7,20}$/', $in['phone']) || strlen($digits) < 7 || strlen($digits) > 15)
                                  $errors['phone'] = 'Please enter a valid phone number.';

if ($in['email'] === '')          $errors['email'] = 'Please enter your email address.';
elseif (!filter_var($in['email'], FILTER_VALIDATE_EMAIL) || $len($in['email']) > 120)
                                  $errors['email'] = 'Please enter a valid email address.';

if ($in['course'] !== '' && !in_array($in['course'], cfg('course_options'), true))
                                  $errors['course'] = 'Please choose a course from the list.';

if ($len($in['message']) > 2000)  $errors['message'] = 'Message must be 2000 characters or fewer.';
if (preg_match_all('#https?://#i', $in['message']) > 3) $errors['message'] = 'Please remove some links from your message.';

if ($errors) respond(false, 'Please correct the highlighted fields.', $errors, $in);

/* ---- Compose email ---- */
$site    = cfg('site_name');
$subject = $conf['subject_prefix'] . ' ' . $in['name'] . ($in['course'] ? ' — ' . $in['course'] : '');
$body  = "New enquiry from the {$site} website\n";
$body .= str_repeat('-', 44) . "\n";
$body .= "Name:    {$in['name']}\n";
$body .= "Phone:   {$in['phone']}\n";
$body .= "Email:   {$in['email']}\n";
$body .= 'Course:  ' . ($in['course'] ?: 'Not specified') . "\n";
$body .= "\nMessage:\n" . ($in['message'] !== '' ? $in['message'] : '(no message)') . "\n";
$body .= str_repeat('-', 44) . "\n";
$body .= 'Sent: ' . date('d M Y, h:i A') . ' · IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

$sent = !empty($conf['smtp']['enabled'])
    ? smtp_send($conf, $conf['recipient'], $subject, $body, $in['email'], $in['name'])
    : mail_send($conf, $conf['recipient'], $subject, $body, $in['email'], $in['name']);

if (!$sent) {
    error_log('[Kalalaya enquiry] mail delivery failed for ' . $in['email']);
    respond(false, 'Sorry, your message could not be sent right now. Please call us on ' . cfg('phone_display') . ' or email ' . cfg('email') . '.', [], $in);
}

$_SESSION['last_enquiry'] = time();
$_SESSION['csrf'] = bin2hex(random_bytes(16)); // rotate token
respond(true, 'Thank you! Your enquiry has been sent. We will get back to you soon.');
