# DreamWeaver Supabase Email Templates

## How to Apply These Templates

1. Go to [Supabase Auth Templates](https://supabase.com/dashboard/project/xtaoqykzrfdjwzfsawod/auth/templates)
2. For each email type, copy the HTML template below
3. Paste into the corresponding template field
4. Save changes

---

## 1. Confirm Email (signup)

**Subject:** `Welcome to DreamWeaver ✨ Confirm your email`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1423; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #161b2c; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo & Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #7a9eff 0%, #b8a1ff 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 32px;">🌙</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 8px 0; font-family: 'Newsreader', Georgia, serif; font-size: 28px; font-weight: 500; color: #ffffff; text-shadow: 0 0 20px rgba(122, 158, 255, 0.3);">
                      Welcome to DreamWeaver
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #94a3b8;">
                      Magical bedtime stories await ✨
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #1e2538; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      Hi there! You're one step away from creating personalized bedtime stories for your little ones.
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      Click the button below to confirm your email address and start your magical journey.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #7a9eff 0%, #6b8de6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(122, 158, 255, 0.4);">
                      Confirm Email ✨
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      DreamWeaver — AI-powered bedtime stories for magical moments 🌙
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Reset Password

**Subject:** `Reset your DreamWeaver password 🔐`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1423; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #161b2c; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo & Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #7a9eff 0%, #b8a1ff 100%); border-radius: 16px;">
                      <span style="font-size: 32px; line-height: 64px;">🔐</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 8px 0; font-family: 'Newsreader', Georgia, serif; font-size: 28px; font-weight: 500; color: #ffffff;">
                      Reset Your Password
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #94a3b8;">
                      Let's get you back to storytelling
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #1e2538; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      We received a request to reset your password. Click the button below to choose a new one.
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      This link will expire in 1 hour.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #7a9eff 0%, #6b8de6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(122, 158, 255, 0.4);">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                      If you didn't request a password reset, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      DreamWeaver — AI-powered bedtime stories 🌙
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link

**Subject:** `Your DreamWeaver login link ✨`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login to DreamWeaver</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1423; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #161b2c; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo & Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #7a9eff 0%, #b8a1ff 100%); border-radius: 16px;">
                      <span style="font-size: 32px; line-height: 64px;">✨</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 8px 0; font-family: 'Newsreader', Georgia, serif; font-size: 28px; font-weight: 500; color: #ffffff;">
                      Your Magic Link
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #94a3b8;">
                      One click to continue your journey
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #1e2538; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      Click the button below to log in to DreamWeaver. This link will expire in 1 hour.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #7a9eff 0%, #6b8de6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(122, 158, 255, 0.4);">
                      Login to DreamWeaver ✨
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                      If you didn't request this link, you can safely ignore this email.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      DreamWeaver — AI-powered bedtime stories 🌙
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Email Change Confirmation

**Subject:** `Confirm your new email address`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your new email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f1423; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #161b2c; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          <tr>
            <td style="padding: 40px;">
              <!-- Logo & Header -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #7a9eff 0%, #b8a1ff 100%); border-radius: 16px;">
                      <span style="font-size: 32px; line-height: 64px;">📧</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0 0 8px 0; font-family: 'Newsreader', Georgia, serif; font-size: 28px; font-weight: 500; color: #ffffff;">
                      Confirm New Email
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: #94a3b8;">
                      Please verify your new email address
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td style="background-color: #1e2538; border-radius: 12px; padding: 24px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      Click the button below to confirm this email address for your DreamWeaver account.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #7a9eff 0%, #6b8de6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(122, 158, 255, 0.4);">
                      Confirm New Email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b;">
                      If you didn't request this change, please secure your account.
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #475569;">
                      DreamWeaver — AI-powered bedtime stories 🌙
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Design System Colors Used

| Element | Color |
|---------|-------|
| Background (email) | `#0f1423` |
| Card background | `#161b2c` |
| Content box | `#1e2538` |
| Primary button | `#7a9eff` → `#6b8de6` gradient |
| Text primary | `#ffffff` |
| Text secondary | `#cbd5e1` |
| Text subtle | `#94a3b8` |
| Text muted | `#64748b` |
| Border | `rgba(255,255,255,0.05)` |

---

## Fonts

The templates reference:
- **Newsreader** (headings) — Falls back to Georgia, serif
- **Inter** (body) — Falls back to system fonts

> Note: Web fonts in emails have limited support, so fallbacks are critical.
