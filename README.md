# OAuth 2.0 Debug Checklist 🔍

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![GitHub issues](https://img.shields.io/github/issues/NickScherbakov/oauth2-debug-checklist)](https://github.com/NickScherbakov/oauth2-debug-checklist/issues)
[![GitHub stars](https://img.shields.io/github/stars/NickScherbakov/oauth2-debug-checklist?style=social)](https://github.com/NickScherbakov/oauth2-debug-checklist)

A comprehensive, practical checklist for debugging **OAuth 2.0 Authorization Code Flow** implementations.
Save hours of debugging by systematically checking these real-world pitfalls and common issues.

> 💡 **Quick Win**: Bookmark this page! When OAuth fails, check each item below **before** diving into random debugging.

## 📖 Table of Contents

- [Why This Exists](#-why-this-exists)
- [The Checklist](#-the-checklist)
- [Code Examples](#-code-examples)
- [Troubleshooting Flowchart](#-troubleshooting-flowchart)
- [Common Scenarios](#-common-scenarios)
- [FAQ](#-faq)
- [Contributing](#-contributing)
- [Additional Resources](#-additional-resources)

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

## ✅ The Checklist

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

### 8. **🔒 Missing PKCE (for SPAs and mobile apps)**

**Problem**: Reduced security for public clients (single-page apps, mobile apps).

**Check**:
- **Always use PKCE** for SPAs and mobile apps (RFC 7636)
- PKCE eliminates need for client_secret in public clients
- Generate `code_verifier` (random 43-128 character string)
- Calculate `code_challenge` = BASE64URL(SHA256(code_verifier))
- Send `code_challenge` and `code_challenge_method=S256` in authorization request
- Send `code_verifier` in token exchange request

**Why it matters**: Prevents authorization code interception attacks.

**Resources**: [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)

---

### 9. **🌐 CORS issues**

**Problem**: Browser blocks OAuth requests from frontend.

**Check**:
- Authorization endpoint redirect: CORS doesn't apply (browser navigation)
- Token endpoint: Must have proper CORS headers if called from browser
- **Best practice**: Never call token endpoint from browser (use backend proxy)
- If unavoidable, ensure provider allows your origin in CORS policy
- Check browser console for CORS errors

**Red flag**: If you're calling the token endpoint from JavaScript, reconsider your architecture.

---

### 10. **🎭 Scope problems**

**Problem**: Can't access expected resources or missing permissions.

**Check**:
- Request all necessary scopes in authorization request
- Scopes are space-separated: `scope=openid profile email`
- Users can decline scopes (check granted scopes in token response)
- Some scopes require provider approval or special permissions
- Scope names are provider-specific (Google: `profile`, GitHub: `user`)

**Example**:
```
# Requesting
scope=openid profile email read:user

# Check granted scopes
granted_scopes = token_response.get('scope')
```

---

### 11. **🔄 Token refresh issues**

**Problem**: Can't obtain new access tokens after expiration.

**Check**:
- Request `offline_access` scope or equivalent for refresh tokens
- Google requires `access_type=offline` parameter
- Refresh tokens can expire or be revoked
- Store refresh tokens securely (encrypted at rest)
- Handle refresh token rotation (some providers issue new refresh token)
- Check if provider supports refresh tokens (some require re-authentication)

---

### 12. **🔍 ID Token validation skipped**

**Problem**: Security vulnerability - accepting forged identity claims.

**Check** (for OpenID Connect):
- **Always validate ID token signature** using provider's public keys (JWKS)
- Verify `iss` (issuer) matches your provider
- Verify `aud` (audience) matches your client_id
- Check `exp` (expiration) hasn't passed
- Verify `nonce` if used (prevents replay attacks)

**Never** decode ID token without verifying the signature first!

**Example libraries**: 
- Node.js: `jsonwebtoken`, `jose`
- Python: `PyJWT`, `python-jose`

---

### 13. **⚡ Using implicit flow (deprecated)**

**Problem**: Using outdated, less secure flow.

**Check**:
- **Don't use Implicit Flow** (`response_type=token`)
- Implicit Flow is deprecated and insecure
- Always use **Authorization Code Flow** with PKCE for SPAs
- Authorization Code Flow keeps tokens away from browser history
- PKCE provides security without client_secret

**Migration**: Replace Implicit Flow with Authorization Code + PKCE.

---

## 💻 Code Examples

Want to see these best practices in action? Check out our working code examples:

- **[Node.js / Express](./examples/nodejs/)** - Complete implementation with explanations
- **[Python / Flask](./examples/python/)** - Flask-based OAuth 2.0 examples
- **[Java / Spring](./examples/java/)** - Spring Boot OAuth 2.0 (coming soon)
- **[.NET / ASP.NET Core](./examples/dotnet/)** - C# examples (coming soon)

Each example demonstrates:
✅ All checklist items implemented correctly
✅ PKCE support
✅ Proper error handling
✅ Security best practices

---

## 🔀 Troubleshooting Flowchart

```
OAuth 2.0 Not Working?
│
├─ Authorization fails?
│  ├─ Check #1: Redirect URI exact match
│  ├─ Check #5: Provider-specific parameters
│  └─ Check #10: Scope issues
│
├─ Callback fails?
│  ├─ Check #2: State parameter validation
│  └─ Check #1: Redirect URI in callback
│
├─ Token exchange fails?
│  ├─ Check #6: Token endpoint errors
│  │   ├─ invalid_grant → Code expired/used
│  │   ├─ invalid_client → Wrong credentials
│  │   └─ redirect_uri_mismatch → Check #1
│  ├─ Check #3: Client secret server-side only
│  ├─ Check #8: PKCE for public clients
│  └─ Check #9: CORS if calling from browser
│
├─ Token validation fails?
│  ├─ Check #12: ID token signature validation
│  ├─ Check #7: Clock skew
│  └─ Check token claims (iss, aud, exp)
│
├─ Can't access resources?
│  ├─ Check #4: Using correct token type
│  ├─ Check #10: Sufficient scopes
│  └─ Check #11: Token refresh needed
│
└─ Security concerns?
   ├─ Check #2: State parameter (CSRF)
   ├─ Check #3: Client secret exposure
   ├─ Check #8: PKCE for public clients
   ├─ Check #12: ID token validation
   └─ Check #13: Not using Implicit Flow
```

---

## 🎬 Common Scenarios

### Scenario 1: "Login with Google" for a Web App

**Stack**: Node.js backend + React frontend

**Checklist items to focus on**:
- ✅ #1: Redirect URI matches exactly in Google Console and code
- ✅ #2: State parameter for CSRF protection
- ✅ #3: Token exchange happens on backend
- ✅ #5: Add `access_type=offline` for refresh tokens
- ✅ #10: Request scopes: `openid profile email`
- ✅ #12: Validate ID token signature

**Code**: See [Node.js example](./examples/nodejs/basic-oauth.js)

---

### Scenario 2: SPA (Single-Page Application)

**Stack**: React/Vue/Angular with no backend

**Checklist items to focus on**:
- ✅ #8: **Must use PKCE** (no client_secret in browser)
- ✅ #2: State parameter
- ✅ #9: No CORS issues (authorization endpoint is browser navigation)
- ⚠️ #3: No client_secret (not applicable with PKCE)
- ✅ #13: Use Authorization Code Flow + PKCE (not Implicit Flow)

**Code**: See [PKCE example](./examples/nodejs/oauth-with-pkce.js)

---

### Scenario 3: Mobile App (iOS/Android)

**Stack**: Native mobile app

**Checklist items to focus on**:
- ✅ #8: **Must use PKCE**
- ✅ #1: Custom URL scheme for redirect (`myapp://callback`)
- ✅ #2: State parameter
- ⚠️ #3: No client_secret (use PKCE instead)
- Consider App Links (Android) or Universal Links (iOS)

---

### Scenario 4: Debugging "invalid_grant" Error

**Symptoms**: Token exchange fails with `invalid_grant`

**Debugging steps**:
1. ✅ Check #4: Are you sending the authorization code, not access token?
2. ✅ Check #6: Is the code expired? (usually 10-minute lifetime)
3. ✅ Check #6: Was the code already used? (codes are single-use)
4. ✅ Check #1: Does redirect_uri in token request match authorization request?
5. ✅ Check #7: Clock skew issues?

---

## ❓ FAQ

### Q: Do I need HTTPS for OAuth 2.0?

**A**: Yes, for production. OAuth 2.0 spec requires HTTPS except for localhost development. Using HTTP in production is a security vulnerability.

### Q: Can I use the same redirect URI for multiple applications?

**A**: No. Each OAuth application should have its own registered redirect URI for security isolation.

### Q: How long do access tokens last?

**A**: Varies by provider:
- Google: 1 hour
- GitHub: No expiration (until revoked)
- Microsoft: 1 hour
- Always check the `expires_in` field in token response.

### Q: Should I store tokens in localStorage?

**A**: 
- ❌ **localStorage**: Vulnerable to XSS attacks
- ✅ **httpOnly cookies**: Better security for web apps
- ✅ **Secure backend session**: Best option
- For mobile: Use secure storage (Keychain/Keystore)

### Q: What's the difference between OAuth 2.0 and OpenID Connect?

**A**: 
- **OAuth 2.0**: Authorization framework (what can you access?)
- **OpenID Connect**: Identity layer on top of OAuth 2.0 (who are you?)
- OIDC adds ID token with user identity claims
- If you need authentication (login), use OpenID Connect

### Q: Can I test OAuth without registering a real application?

**A**: Most providers require application registration. For testing:
1. Use provider's sandbox/test environments
2. Register a development application (it's free)
3. Use mock OAuth servers for unit tests

---

## 🤝 Contributing

Found a common OAuth 2.0 debugging case not covered here? **We'd love to hear from you!**

Please see our detailed [Contributing Guidelines](CONTRIBUTING.md) for:
- How to add new checklist items
- Code example contribution guidelines
- Translation guidelines
- Pull request process

**Quick links**:
- 🐛 [Report an issue](https://github.com/NickScherbakov/oauth2-debug-checklist/issues/new/choose)
- 💡 [Suggest an improvement](https://github.com/NickScherbakov/oauth2-debug-checklist/issues/new?template=documentation-gap.yml)
- 🔧 [Open a Pull Request](https://github.com/NickScherbakov/oauth2-debug-checklist/pulls)

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines (if you're planning significant changes).

---

## 📚 Additional Resources

### 📖 Official Specifications
- [RFC 6749 - OAuth 2.0 Framework](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OpenID Connect Core](https://openid.net/connect/)

### 🎓 Learning Resources
- [OAuth 2.0 Simplified by Aaron Parecki](https://aaronparecki.com/oauth-2-simplified/)
- [The Modern Guide to OAuth (FusionAuth)](https://fusionauth.io/learn/expert-advice/oauth/modern-guide-to-oauth)
- [OAuth 2.0 Playground (Google)](https://developers.google.com/oauthplayground/)

### 🔧 Tools & Libraries
- [jwt.io](https://jwt.io/) - JWT decoder and debugger
- [OAuth Debugger](https://oauthdebugger.com/) - Test OAuth flows
- Popular libraries: [Passport.js](http://www.passportjs.org/), [Authlib](https://docs.authlib.org/), [Spring Security](https://spring.io/projects/spring-security)

### 🌍 Translations
- [Русский (Russian)](./docs/README.ru.md)
- More translations coming soon! [Help translate](CONTRIBUTING.md#4-translate-content)

---

## 📜 License

This repository is released under the [MIT License](LICENSE).

---

## ⭐ Support

If this checklist saved you time, please consider:
- ⭐ **Starring this repository** - Helps others discover it!
- 🔗 **Sharing** it with your team and on social media
- 📝 **Contributing** your own debugging insights
- 💬 **Spreading the word** - Tweet about it, blog about it!

**Every star helps more developers avoid OAuth debugging headaches!** 🚀

**Happy debugging!** 🎉

**Happy debugging!** 🚀