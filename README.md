# OAuth 2.0 Debug Checklist 🔍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub issues](https://img.shields.io/github/issues/NickScherbakov/oauth2-debug-checklist)](https://github.com/NickScherbakov/oauth2-debug-checklist/issues)

A practical checklist for debugging **OAuth 2.0 Authorization Code Flow** implementations.
Focus is on real-world pitfalls and recurring issues developers encounter.

> 💡 **Quick Win**: Bookmark this page! When OAuth fails, systematically check each item below before diving into debugging.

---

## 🎯 Why this exists

OAuth 2.0 is widely used for delegated authentication (e.g., "Login with Google", "Sign in with GitHub").
Even experienced developers often run into implementation issues that are:

- ❌ not syntax errors,
- ❌ not library bugs,
- ✅ **but conceptual mismatches and configuration mistakes**.

This checklist gathers common points that often require attention when debugging
OAuth 2.0 authorization flows in real code.

---

## ✅ The Checklist (v0.1)

Each item below has saved hours of debugging time for developers solving real issues.

### 1. **🔗 Redirect URI mismatch**
   
**Problem**: Provider rejects authorization request or callback fails.

**Check**:
- Ensure the redirect URI **exactly** matches what's registered with the provider
- Case sensitivity matters: `http://localhost/callback` ≠ `http://localhost/Callback`
- Trailing slash matters: `/callback` ≠ `/callback/`
- Query parameters must match if specified
- Protocol must match: `http://` ≠ `https://`

**Example error**:
```
error: redirect_uri_mismatch
error_description: The redirect URI provided does not match a registered redirect URI
```

---

### 2. **🛡️ Missing / incorrect state parameter**

**Problem**: CSRF vulnerability or callback validation fails.

**Check**:
- Include `state` parameter in authorization request
- Generate a random, unique value for each request
- Store it securely (session/cookie)
- Verify it matches when handling the callback
- State must be returned unchanged by the provider

**Why it matters**: Without `state`, attackers can execute CSRF attacks.

---

### 3. **🔐 Client secret exposed in frontend**

**Problem**: Security vulnerability — secret leaked in browser/mobile app.

**Check**:
- Authorization Code Flow requires the client secret **only on backend**
- Never include `client_secret` in JavaScript, mobile apps, or browser
- Token exchange (code → access_token) must happen server-side
- For SPAs/mobile apps, use PKCE instead

**Red flag**: If you see `client_secret` in frontend code — **stop and refactor**.

---

### 4. **🎫 Mixing tokens**

**Problem**: Sending wrong token type or confusing authorization code with access token.

**Distinguish**:
- **Authorization code**: Short-lived, single-use, exchanged for tokens
- **Access token**: Used to access protected resources
- **Refresh token**: Used to obtain new access tokens
- **ID token** (OpenID Connect): Contains user identity claims

**Common mistake**: Trying to use authorization code to call APIs (it won't work).

---

### 5. **⚙️ Provider-specific quirks**

**Problem**: Integration works with one provider but fails with another.

**Check**:
- Google requires `access_type=offline` for refresh tokens
- Microsoft may need `prompt=consent` for certain scopes
- GitHub has specific scope naming
- Some providers require `response_mode` parameter
- Always read **provider-specific documentation**

**Resources**:
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft identity platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [GitHub OAuth](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)

---

### 6. **❌ Token endpoint errors**

**Problem**: Token exchange fails with cryptic error.

**Debug**:
- Examine error responses from provider's token endpoint
- Common errors:
  - `invalid_grant`: Code already used, expired, or invalid
  - `invalid_client`: Wrong client_id or client_secret
  - `unsupported_grant_type`: Wrong grant_type parameter
- Log full error response (but redact secrets)
- Check request content-type (usually `application/x-www-form-urlencoded`)

---

### 7. **🕐 Clock skew**

**Problem**: Tokens rejected as expired even when they seem valid.

**Check**:
- Ensure server time is synchronized (use NTP)
- Token `exp` (expiration) and `iat` (issued at) claims depend on accurate time
- Some providers allow small clock skew (usually 5 minutes)
- Verify timezone settings

**Quick test**: `date` on Linux/Mac or `echo %date% %time%` on Windows

---

## 🤝 Contributing

Found a common OAuth 2.0 debugging case not covered here? **We'd love to hear from you!**

- 🐛 [Report an issue](https://github.com/NickScherbakov/oauth2-debug-checklist/issues/new/choose)
- 💡 [Suggest an improvement](https://github.com/NickScherbakov/oauth2-debug-checklist/issues/new?template=documentation-gap.yml)
- 🔧 [Open a Pull Request](https://github.com/NickScherbakov/oauth2-debug-checklist/pulls)

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (if you're planning significant changes).

---

## 📚 Additional Resources

- [RFC 6749 - OAuth 2.0 Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [PKCE (RFC 7636)](https://datatracker.ietf.org/doc/html/rfc7636)
- [OpenID Connect](https://openid.net/connect/)

---

## 📜 License

This repository is released under the [MIT License](LICENSE).

---

## ⭐ Support

If this checklist saved you time, consider:
- ⭐ Starring this repository
- 🔗 Sharing it with your team
- 📝 Contributing your own debugging insights

**Happy debugging!** 🚀