# OAuth 2.0 Security Best Practices 🔒

A comprehensive guide to securing your OAuth 2.0 implementation.

## 🎯 Critical Security Rules

### 1. **Always Use HTTPS in Production**

**Risk**: Tokens transmitted over HTTP can be intercepted.

```
❌ http://myapp.com/callback
✅ https://myapp.com/callback
```

**Exception**: `http://localhost` for development only.

---

### 2. **Never Expose Client Secret in Frontend**

**Risk**: Anyone can impersonate your application.

```javascript
// ❌ NEVER in browser/mobile app
const config = {
  client_secret: 'my_secret_123'
};

// ✅ Only in backend
const CLIENT_SECRET = process.env.CLIENT_SECRET;
```

**For public clients** (SPA, mobile): Use PKCE instead of client secret.

---

### 3. **Validate State Parameter**

**Risk**: CSRF attacks - attackers can trick users into authorizing malicious apps.

```javascript
// ✅ Generate and store state
const state = crypto.randomBytes(32).toString('hex');
session.oauthState = state;

// ✅ Validate on callback
if (receivedState !== session.oauthState) {
  throw new Error('CSRF attack detected');
}
```

**Always**:
- Generate random, unpredictable state
- Store it server-side (session/cookie)
- Validate it matches on callback
- Invalidate after use

---

### 4. **Implement PKCE for Public Clients**

**Risk**: Authorization code interception attacks.

**Use PKCE for**:
- Single-Page Applications (React, Vue, Angular)
- Mobile apps (iOS, Android)
- Any app that can't securely store client_secret

```javascript
// ✅ PKCE flow
const codeVerifier = generateRandomString(43); // 43-128 chars
const codeChallenge = base64url(sha256(codeVerifier));

// Authorization request
authUrl.params.code_challenge = codeChallenge;
authUrl.params.code_challenge_method = 'S256';

// Token request
tokenRequest.code_verifier = codeVerifier; // Not the challenge!
```

---

### 5. **Validate ID Token Signature**

**Risk**: Accepting forged identity claims.

```javascript
// ❌ NEVER just decode without verification
const payload = JSON.parse(atob(idToken.split('.')[1])); // INSECURE!

// ✅ Verify signature first
const jwks = await fetchProviderKeys(JWKS_URI);
const payload = await verifyJWT(idToken, jwks);
```

**Validate**:
- ✅ Signature using provider's public key (JWKS)
- ✅ `iss` (issuer) matches expected provider
- ✅ `aud` (audience) matches your client_id
- ✅ `exp` (expiration) hasn't passed
- ✅ `nonce` if used (prevents replay)

---

### 6. **Secure Token Storage**

**Risk**: Token theft leading to unauthorized access.

| Storage Method | Web Apps | Mobile Apps | Security |
|---------------|----------|-------------|----------|
| localStorage | ❌ | ❌ | Vulnerable to XSS |
| sessionStorage | ❌ | ❌ | Vulnerable to XSS |
| httpOnly cookie | ✅ | N/A | Protected from XSS |
| Secure backend session | ✅ | N/A | Best for web |
| Keychain (iOS) | N/A | ✅ | OS-protected |
| Keystore (Android) | N/A | ✅ | OS-protected |

**Web Apps - Best Practice**:
```javascript
// ✅ Store in httpOnly, secure cookie
res.cookie('access_token', token, {
  httpOnly: true,  // Not accessible via JavaScript
  secure: true,    // HTTPS only
  sameSite: 'Lax', // CSRF protection
  maxAge: 3600000  // 1 hour
});
```

---

### 7. **Handle Token Expiration**

**Risk**: Using expired tokens or failing to refresh properly.

```javascript
// ✅ Check expiration before using token
if (Date.now() >= token.expiresAt) {
  token = await refreshAccessToken(refreshToken);
}

// ✅ Handle refresh token rotation
const newTokens = await refreshAccessToken(refreshToken);
// Some providers issue new refresh token
if (newTokens.refresh_token) {
  refreshToken = newTokens.refresh_token;
}
```

---

### 8. **Validate Redirect URI Strictly**

**Risk**: Open redirect vulnerabilities.

```javascript
// ❌ NEVER allow dynamic redirect URIs
const redirectUri = req.query.redirect; // DANGEROUS!

// ✅ Use pre-registered, fixed redirect URIs
const ALLOWED_REDIRECTS = [
  'https://myapp.com/callback',
  'https://myapp.com/auth/callback'
];

if (!ALLOWED_REDIRECTS.includes(redirectUri)) {
  throw new Error('Invalid redirect URI');
}
```

---

### 9. **Don't Use Implicit Flow**

**Risk**: Tokens in URL, browser history, and referrer headers.

```
❌ response_type=token (Implicit Flow - DEPRECATED)
✅ response_type=code (Authorization Code Flow)
✅ response_type=code + PKCE (for SPAs)
```

**Why Implicit Flow is insecure**:
- Tokens exposed in URL
- Tokens in browser history
- Tokens leak via Referer header
- No refresh tokens

**Migration**: Use Authorization Code Flow with PKCE.

---

### 10. **Limit Token Scope**

**Risk**: Over-privileged tokens increase damage from compromise.

```javascript
// ❌ Requesting unnecessary scopes
scope: 'read write delete admin'

// ✅ Request minimum necessary scopes
scope: 'read:user read:email'
```

**Principle of Least Privilege**:
- Request only scopes you actually use
- Users can see and decline scopes
- Narrower scope = less damage if token stolen

---

## 🔐 Additional Security Measures

### Use Nonce (OpenID Connect)

Prevents replay attacks with ID tokens:

```javascript
// Generate and store nonce
const nonce = crypto.randomBytes(32).toString('hex');
session.nonce = nonce;

// Include in authorization request
authUrl.params.nonce = nonce;

// Validate in ID token
const payload = verifyIDToken(idToken);
if (payload.nonce !== session.nonce) {
  throw new Error('Nonce mismatch');
}
```

---

### Implement Rate Limiting

Prevent brute force attacks:

```javascript
// Limit authorization attempts
const attempts = await redis.get(`oauth:${userId}`);
if (attempts > 5) {
  throw new Error('Too many attempts. Try again later.');
}
```

---

### Log Security Events

Monitor for suspicious activity:

```javascript
// Log all OAuth events
logger.info('OAuth authorization started', {
  userId,
  provider,
  scopes,
  ipAddress,
  userAgent
});

logger.warn('OAuth state mismatch', {
  expected: session.state,
  received: query.state,
  ipAddress
});
```

---

### Regular Security Audits

**Checklist**:
- [ ] All tokens stored securely
- [ ] Client secrets not in version control
- [ ] HTTPS enforced in production
- [ ] State parameter validated
- [ ] PKCE implemented for public clients
- [ ] ID token signatures verified
- [ ] Token expiration handled
- [ ] Scopes follow least privilege
- [ ] Error messages don't leak sensitive info
- [ ] Logging and monitoring in place

---

## 🚨 What to Do If Compromised

### If Client Secret is Leaked

1. **Immediately rotate** the client secret in provider console
2. **Revoke all active tokens** if possible
3. **Update** your application with new secret
4. **Investigate** how the leak occurred
5. **Notify users** if user data may be affected

### If Access Token is Stolen

1. **Revoke** the token immediately
2. **Review** access logs for suspicious activity
3. **Force re-authentication** for affected users
4. **Reduce** token lifetime going forward

---

## 📚 Security Resources

- [OAuth 2.0 Security Best Current Practice](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OAuth 2.0 Threat Model](https://datatracker.ietf.org/doc/html/rfc6819)
- [OWASP OAuth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)

---

## ✅ Security Checklist

Before going to production:

- [ ] ✅ HTTPS enforced (no HTTP in production)
- [ ] ✅ Client secret kept server-side only
- [ ] ✅ State parameter generated and validated
- [ ] ✅ PKCE implemented for public clients
- [ ] ✅ ID token signatures verified
- [ ] ✅ Tokens stored securely (not localStorage)
- [ ] ✅ Token expiration handled properly
- [ ] ✅ Redirect URIs strictly validated
- [ ] ✅ Not using Implicit Flow
- [ ] ✅ Scopes follow least privilege
- [ ] ✅ Nonce used (for OpenID Connect)
- [ ] ✅ Rate limiting implemented
- [ ] ✅ Security events logged
- [ ] ✅ Error handling doesn't leak secrets
- [ ] ✅ Dependencies up to date
- [ ] ✅ Security audit completed

---

**Remember**: Security is not a one-time task. Regularly review and update your OAuth implementation as threats evolve.

🔒 **Stay secure!**
