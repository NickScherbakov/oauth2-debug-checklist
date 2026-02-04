# OAuth 2.0 Error Messages & Solutions 🔧

A comprehensive guide to understanding and fixing OAuth 2.0 error messages.

## 📑 Table of Contents

- [Authorization Errors](#authorization-errors)
- [Token Exchange Errors](#token-exchange-errors)
- [Token Validation Errors](#token-validation-errors)
- [Provider-Specific Errors](#provider-specific-errors)

---

## Authorization Errors

### `redirect_uri_mismatch`

**Full error:**
```json
{
  "error": "redirect_uri_mismatch",
  "error_description": "The redirect URI provided does not match a registered redirect URI"
}
```

**Cause**: The `redirect_uri` in your authorization request doesn't exactly match what's registered with the provider.

**Solutions**:
1. ✅ Check for exact match including:
   - Protocol: `http://` vs `https://`
   - Case: `Callback` vs `callback`
   - Trailing slash: `/callback` vs `/callback/`
   - Port number: `:3000` if present
   - Query parameters

2. ✅ Compare your code:
```javascript
// What you're using in code
const REDIRECT_URI = 'http://localhost:3000/callback';

// vs. what's registered in provider console
// Must match EXACTLY!
```

3. ✅ Common mistakes:
```javascript
❌ http://localhost/callback      vs ✅ http://localhost:3000/callback
❌ http://localhost:3000/Callback vs ✅ http://localhost:3000/callback
❌ https://localhost:3000/callback vs ✅ http://localhost:3000/callback
```

**Related Checklist**: [#1 Redirect URI mismatch](../README.md#1--redirect-uri-mismatch)

---

### `access_denied`

**Full error:**
```json
{
  "error": "access_denied",
  "error_description": "The user denied the request"
}
```

**Cause**: User clicked "Cancel" or "Deny" on the consent screen.

**Solutions**:
1. ✅ Handle gracefully in your application:
```javascript
if (error === 'access_denied') {
  // Show friendly message
  return res.render('login-cancelled', {
    message: 'Login was cancelled. You can try again.'
  });
}
```

2. ✅ Review requested scopes - are you asking for too many permissions?

**Related Checklist**: [#10 Scope problems](../README.md#10--scope-problems)

---

### `invalid_scope`

**Full error:**
```json
{
  "error": "invalid_scope",
  "error_description": "The requested scope is invalid, unknown, or malformed"
}
```

**Cause**: Requested scope doesn't exist or isn't available for your app.

**Solutions**:
1. ✅ Check provider's scope documentation
2. ✅ Common scope format errors:
```javascript
// Google
❌ 'user.read'  ✅ 'profile'

// GitHub  
❌ 'read_user'  ✅ 'read:user'

// Microsoft
❌ 'user.read'  ✅ 'User.Read'  (case-sensitive!)
```

3. ✅ Some scopes require app review/approval

**Related Checklist**: [#10 Scope problems](../README.md#10--scope-problems)

---

## Token Exchange Errors

### `invalid_grant`

**Full error:**
```json
{
  "error": "invalid_grant",
  "error_description": "The provided authorization grant is invalid, expired, or revoked"
}
```

**Cause**: Most common OAuth error! Can have multiple causes:

**1. Authorization code already used**
```
Authorization codes are SINGLE-USE only!
```
**Solution**: Don't retry the same code. Start a new authorization flow.

**2. Authorization code expired**
```
Codes typically expire in 10 minutes
```
**Solution**: Complete the flow faster or start over.

**3. Redirect URI mismatch**
```
redirect_uri in token request ≠ redirect_uri in authorization request
```
**Solution**: Use the exact same redirect_uri in both requests:
```javascript
// Authorization request
authUrl.params.redirect_uri = 'http://localhost:3000/callback';

// Token request (MUST BE IDENTICAL)
tokenParams.redirect_uri = 'http://localhost:3000/callback';
```

**4. Wrong authorization server**
```
Code from provider A used with provider B's token endpoint
```
**Solution**: Ensure token URL matches the authorization URL provider.

**Related Checklist**: [#6 Token endpoint errors](../README.md#6--token-endpoint-errors)

---

### `invalid_client`

**Full error:**
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

**Cause**: Wrong client_id or client_secret, or authentication method issue.

**Solutions**:
1. ✅ Verify credentials:
```javascript
// Double-check these match your provider console
CLIENT_ID: 'abc123...'
CLIENT_SECRET: 'xyz789...'
```

2. ✅ Check authentication method:
```javascript
// Most providers use POST body
const tokenParams = new URLSearchParams({
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
  // ...
});

// Some providers use Basic Auth
const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
headers['Authorization'] = `Basic ${auth}`;
```

3. ✅ Ensure client_secret is not exposed in frontend (use backend)

**Related Checklist**: [#3 Client secret exposed](../README.md#3--client-secret-exposed-in-frontend)

---

### `unsupported_grant_type`

**Full error:**
```json
{
  "error": "unsupported_grant_type",
  "error_description": "The authorization grant type is not supported"
}
```

**Cause**: Wrong or missing `grant_type` parameter.

**Solutions**:
```javascript
// For authorization code exchange
grant_type: 'authorization_code'  ✅

// For token refresh
grant_type: 'refresh_token'  ✅

// Common mistakes
grant_type: 'code'  ❌
grant_type: 'token'  ❌
// Missing grant_type altogether  ❌
```

---

### `invalid_request`

**Full error:**
```json
{
  "error": "invalid_request",
  "error_description": "The request is missing a required parameter"
}
```

**Cause**: Missing required parameter in token request.

**Solutions**:
1. ✅ Ensure all required parameters:
```javascript
const tokenParams = {
  grant_type: 'authorization_code',  // Required
  code: authorizationCode,            // Required
  redirect_uri: REDIRECT_URI,         // Required
  client_id: CLIENT_ID,               // Required
  client_secret: CLIENT_SECRET        // Required (unless using PKCE)
};
```

2. ✅ Check Content-Type header:
```javascript
headers: {
  'Content-Type': 'application/x-www-form-urlencoded'  // Required!
}
```

---

## Token Validation Errors

### Invalid ID Token Signature

**Error:**
```
JsonWebTokenError: invalid signature
```

**Cause**: ID token signature doesn't match provider's public key.

**Solutions**:
1. ✅ Fetch provider's JWKS (public keys):
```javascript
const jwks = await fetch('https://provider.com/.well-known/jwks.json');
```

2. ✅ Verify using the correct key:
```javascript
const { verify } = require('jsonwebtoken');
const jwks = await getProviderKeys();
const decoded = verify(idToken, getKey(jwks), {
  algorithms: ['RS256']
});
```

3. ❌ **Never** skip signature verification:
```javascript
// INSECURE - Don't do this!
const payload = JSON.parse(atob(idToken.split('.')[1]));
```

**Related Checklist**: [#12 ID Token validation skipped](../README.md#12--id-token-validation-skipped)

---

### Token Expired

**Error:**
```
TokenExpiredError: jwt expired
```

**Cause**: Access token or ID token has expired.

**Solutions**:
1. ✅ Use refresh token to get new access token:
```javascript
const newTokens = await refreshAccessToken(refreshToken);
accessToken = newTokens.access_token;
```

2. ✅ Check expiration before using:
```javascript
if (Date.now() >= tokenExpiresAt) {
  accessToken = await refreshAccessToken();
}
```

3. ✅ Handle clock skew (allow 5-minute buffer):
```javascript
const expiresAt = (exp * 1000) - (5 * 60 * 1000); // 5 min buffer
```

**Related Checklist**: [#11 Token refresh issues](../README.md#11--token-refresh-issues)

---

## Provider-Specific Errors

### Google: `org_internal`

**Error:**
```json
{
  "error": "org_internal",
  "error_description": "Only users from your organization can access this app"
}
```

**Cause**: App is set to "Internal" but user is not part of your organization.

**Solution**: Change publishing status to "External" in Google Cloud Console.

---

### GitHub: `bad_verification_code`

**Error:**
```json
{
  "error": "bad_verification_code",
  "error_description": "The code passed is incorrect or expired"
}
```

**Cause**: Same as `invalid_grant` - code already used or expired.

**Solutions**: See [invalid_grant](#invalid_grant) solutions above.

---

### Microsoft: `AADSTS50011`

**Error:**
```
AADSTS50011: The redirect URI specified in the request does not match
```

**Cause**: Redirect URI mismatch (Microsoft-specific error code).

**Solutions**: See [redirect_uri_mismatch](#redirect_uri_mismatch) solutions above.

---

### Microsoft: `AADSTS65001`

**Error:**
```
AADSTS65001: The user or administrator has not consented to use the application
```

**Cause**: Missing consent for requested scopes.

**Solutions**:
1. ✅ Add `prompt=consent` parameter:
```javascript
authUrl.params.prompt = 'consent';
```

2. ✅ Or trigger admin consent:
```javascript
authUrl.params.prompt = 'admin_consent';
```

---

## Debugging Tips

### Enable Verbose Logging

```javascript
// Log full error response
console.error('OAuth error:', {
  error: error.response?.data?.error,
  description: error.response?.data?.error_description,
  status: error.response?.status,
  body: error.response?.data
});
```

### Use OAuth Debugging Tools

- [OAuth Debugger](https://oauthdebugger.com/)
- [jwt.io](https://jwt.io/) - Decode JWTs
- Provider playgrounds:
  - [Google OAuth Playground](https://developers.google.com/oauthplayground/)
  - [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)

### Check Network Tab

1. Open browser DevTools
2. Go to Network tab
3. Look for authorization and token requests
4. Check request/response details

---

## Common Error Patterns

### Pattern 1: Works Locally, Fails in Production

**Likely causes**:
- ❌ Redirect URI not updated for production domain
- ❌ Using HTTP instead of HTTPS in production
- ❌ Environment variables not set in production

**Solutions**:
1. Update redirect URIs in provider console
2. Enforce HTTPS in production
3. Verify environment variables

---

### Pattern 2: Works First Time, Fails on Subsequent Attempts

**Likely causes**:
- ❌ Reusing authorization code
- ❌ State parameter not regenerated

**Solutions**:
1. Generate new authorization code for each attempt
2. Regenerate state parameter for each flow

---

### Pattern 3: Works with Provider A, Fails with Provider B

**Likely causes**:
- ❌ Provider-specific parameters missing
- ❌ Different scope formats
- ❌ Different authentication methods

**Solutions**:
1. Check [provider-specific guides](./PROVIDERS.md)
2. Review provider documentation
3. Compare working vs non-working configurations

---

## Still Stuck?

1. ✅ Check the [main checklist](../README.md#-the-checklist)
2. ✅ Review [troubleshooting flowchart](../README.md#-troubleshooting-flowchart)
3. ✅ Search for your error message in [GitHub issues](https://github.com/NickScherbakov/oauth2-debug-checklist/issues)
4. ✅ Ask in [GitHub Discussions](https://github.com/NickScherbakov/oauth2-debug-checklist/discussions)

---

**Remember**: Most OAuth errors are configuration issues, not code bugs! 🔧
