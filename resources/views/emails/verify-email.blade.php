<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>Verify your Health Kiosk email</title>
</head>

<body style="margin:0;padding:0;background-color:#eef4fc;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef4fc;">
        <tr>
            <td align="center" style="padding:40px 16px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                    style="max-width:560px;background-color:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">

                    {{-- Header band: brand mark + wordmark + tagline --}}
                    <tr>
                        <td style="background-color:#eef4fc;padding:36px 40px 28px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="44" valign="middle" style="padding-right:12px;">
                                        <img src="{{ asset('images/mail/logo-mark.png') }}" width="44" height="44" alt="Health Kiosk"
                                            style="display:block;border:0;border-radius:12px;">
                                    </td>
                                    <td valign="middle">
                                        <span style="font-size:20px;font-weight:800;color:#0f172a;">Health</span>
                                        <span style="font-size:20px;font-weight:800;color:#2563eb;">&nbsp;Kiosk</span>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:10px 0 0;font-size:11px;font-weight:700;letter-spacing:2px;color:#64748b;text-transform:uppercase;">
                                Smarter health. Brighter futures.
                            </p>
                        </td>
                    </tr>

                    {{-- Body --}}
                    <tr>
                        <td style="padding:40px 40px 8px;">

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom:24px;">
                                        <img src="{{ asset('images/mail/verify-icon.gif') }}" width="88" height="88" alt=""
                                            style="display:block;border:0;border-radius:999px;">
                                    </td>
                                </tr>
                            </table>

                            <h1 style="margin:0 0 24px;font-size:26px;line-height:1.3;font-weight:800;color:#0f172a;text-align:center;">
                                Verify your email
                            </h1>

                            <p style="margin:0 0 16px;font-size:16px;font-weight:700;line-height:1.6;color:#0f172a;">
                                Hi {{ $user->firstname }},
                            </p>
                            <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#475569;">
                                Welcome to the Health Kiosk system. Please verify your email address so your account
                                can be activated and protected before login.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                                <tr>
                                    <td align="center" style="background-color:#2563eb;border-radius:14px;">
                                        <a href="{{ $verificationUrl }}"
                                            style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                                            Verify Email Address&nbsp;&nbsp;&rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#0f172a;font-weight:700;">
                                &#9201;&nbsp; This verification link expires in 60 minutes.
                            </p>
                            <p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:#94a3b8;">
                                If you did not create a Health Kiosk account, you can safely ignore this message.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
                                <tr><td style="padding-top:24px;"></td></tr>
                            </table>

                            <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#64748b;">
                                &#128279;&nbsp; If the button does not work, copy and paste this link into your browser:
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                                style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:8px;">
                                <tr>
                                    <td style="padding:14px 16px;font-size:13px;line-height:1.6;word-break:break-all;color:#2563eb;">
                                        {{ $verificationUrl }}
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    {{-- Footer band --}}
                    <tr>
                        <td align="center" style="background-color:#eef4fc;padding:28px 40px;">
                            <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:#0f172a;">
                                Health Kiosk Capstone System
                            </p>
                            <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;">
                                Your health. Our priority.
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>

</html>
