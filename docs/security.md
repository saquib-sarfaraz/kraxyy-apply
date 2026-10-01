# Security, Privacy & Compliance Architecture

Employment and career data involves sensitive personal identifying information (PII). Kraxyy Apply implements rigorous production safeguards:

## 1. Authentication & Token Hygiene
- **Short-Lived Access Tokens**: Signed with HMAC-SHA256, 15-minute expiration window.
- **HTTP-Only Refresh Tokens**: Stored in strict `httpOnly`, `secure`, `sameSite: strict` cookies, isolating them from client-side XSS vulnerabilities.
- **Dedicated Extension Tokens**: Long-lived (90-day) tokens specifically scoped for extension operations; cannot perform destructive account actions.
- **Password Protection**: Passwords hashed with `bcrypt` (10 rounds). Raw passwords are never logged or stored.

## 2. Network & Transport Safeguards
- **CORS Policies**: Explicit origin allowlists supporting web client, admin console, and authorized Chrome extension schemes.
- **Helmet Security Headers**: Enforces strict Content Security Policy, X-Frame-Options, X-Content-Type-Options, and Referrer-Policy.
- **Tiered Rate Limiting**: Dedicated rate limiting thresholds for authentication (30 req / 15m), API endpoints (1000 req / 15m), and extension pairing.

## 3. Extension Safety Rules
- **No Silent Auto-Submissions**: The extension will never automatically click submit buttons or submit forms. Candidates retain full editorial review.
- **No CAPTCHA Bypassing**: CAPTCHA and anti-bot systems are detected and presented as "Manual Action Required".
- **Minimal Scoped Data**: Content scripts only receive the sanitized profile dictionary required for autofill.
