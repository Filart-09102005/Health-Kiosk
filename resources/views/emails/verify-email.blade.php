<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verify your Health Kiosk email</title>
</head>

<body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                    style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.12);">
                    <tr>
                        <td style="background:#0f172a;padding:30px 34px;color:#ffffff;">
                            <div style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#93c5fd;">
                                Health Kiosk
                            </div>
                            <h1 style="margin:10px 0 0;font-size:30px;line-height:1.2;">
                                Verify your email
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:34px;">
                            <p style="margin:0 0 16px;font-size:17px;line-height:1.6;">
                                Hi {{ $user->firstname }},
                            </p>
                            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#475569;">
                                Welcome to the Health Kiosk system. Please verify your email address so your account can
                                be activated and protected before login.
                            </p>

                            <a href="{{ $verificationUrl }}"
                                style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:14px;">
                                Verify Email Address
                            </a>

                            <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#64748b;">
                                This verification link expires in 60 minutes. If you did not create a Health Kiosk
                                account, you can safely ignore this message.
                            </p>

                            <div style="margin-top:26px;padding:16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                                    If the button does not work, copy and paste this link into your browser:
                                </p>
                                <p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#2563eb;">
                                    {{ $verificationUrl }}
                                </p>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 34px;background:#f8fafc;color:#64748b;font-size:13px;">
                            Health Kiosk Capstone System
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
