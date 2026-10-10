<?php
/** Shared mail helpers (enquiry form + drawing-canvas leads). Settings: includes/config.php → enquiry */
if (!defined('KALALAYA')) { http_response_code(403); exit; }

/* =====================================================================
   Mail helpers
   ===================================================================== */
function encode_header(string $s): string { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

function build_headers(array $conf, string $replyEmail, string $replyName): array {
    return [
        'From'                      => encode_header($conf['from_name']) . ' <' . $conf['from_email'] . '>',
        'Reply-To'                  => encode_header($replyName) . ' <' . $replyEmail . '>',
        'MIME-Version'              => '1.0',
        'Content-Type'              => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => '8bit',
        'X-Mailer'                  => 'Kalalaya-Website',
    ];
}

/** PHP mail() — works on most DirectAdmin hosts when from_email is on your domain. */
function mail_send(array $conf, string $to, string $subject, string $body, string $replyEmail, string $replyName): bool {
    $headers = build_headers($conf, $replyEmail, $replyName);
    $params = filter_var($conf['from_email'], FILTER_VALIDATE_EMAIL) ? '-f' . $conf['from_email'] : '';
    return @mail($to, encode_header($subject), $body, $headers, $params);
}

/** Minimal authenticated SMTP client (STARTTLS on 587 or SSL on 465). */
function smtp_send(array $conf, string $to, string $subject, string $body, string $replyEmail, string $replyName): bool {
    $s = $conf['smtp'];
    $host = ($s['secure'] === 'ssl' ? 'ssl://' : '') . $s['host'];
    $fp = @stream_socket_client($host . ':' . (int)$s['port'], $errno, $errstr, 15);
    if (!$fp) { error_log("[Kalalaya SMTP] connect failed: $errstr"); return false; }
    stream_set_timeout($fp, 15);

    $read = static function () use ($fp): string {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) { $data .= $line; if (isset($line[3]) && $line[3] === ' ') break; }
        return $data;
    };
    $cmd = static function (string $c, array $ok) use ($fp, $read): bool {
        if ($c !== '') fwrite($fp, $c . "\r\n");
        $r = $read();
        if (!in_array((int)substr($r, 0, 3), $ok, true)) { error_log('[Kalalaya SMTP] ' . trim($r)); return false; }
        return true;
    };
    $ehlo = 'EHLO ' . ($_SERVER['SERVER_NAME'] ?? 'localhost');

    $ok = $cmd('', [220]) && $cmd($ehlo, [250]);
    if ($ok && $s['secure'] === 'tls') {
        $ok = $cmd('STARTTLS', [220])
            && stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)
            && $cmd($ehlo, [250]);
    }
    $ok = $ok && $cmd('AUTH LOGIN', [334]) && $cmd(base64_encode($s['username']), [334]) && $cmd(base64_encode($s['password']), [235])
        && $cmd('MAIL FROM:<' . $conf['from_email'] . '>', [250]) && $cmd('RCPT TO:<' . $to . '>', [250, 251]) && $cmd('DATA', [354]);

    if ($ok) {
        $h = build_headers($conf, $replyEmail, $replyName);
        $h['To'] = '<' . $to . '>';
        $h['Subject'] = encode_header($subject);
        $h['Date'] = date('r');
        $msg = '';
        foreach ($h as $k => $v) $msg .= "$k: $v\r\n";
        $msg .= "\r\n" . preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], "\r\n", $body));
        $ok = $cmd($msg . "\r\n.", [250]);
    }
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return $ok;
}
