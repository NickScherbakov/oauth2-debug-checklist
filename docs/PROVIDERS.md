# Provider-Specific OAuth 2.0 Guides 🌐

Quick reference for implementing OAuth 2.0 with popular providers.

## 📑 Table of Contents

- [Google](#google)
- [GitHub](#github)
- [Microsoft / Azure AD](#microsoft--azure-ad)
- [Facebook](#facebook)
- [Auth0](#auth0)
- [Okta](#okta)

---

## Google

### Configuration URLs

```javascript
const GOOGLE_CONFIG = {
  authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
  jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs'
};
```

### Getting Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Add authorized redirect URIs

### Common Scopes

```
openid                 # OpenID Connect
profile                # Basic profile info
email                  # Email address
https://www.googleapis.com/auth/drive.readonly  # Read Google Drive
https://www.googleapis.com/auth/calendar        # Google Calendar
https://www.googleapis.com/auth/gmail.readonly  # Read Gmail
```

### Special Parameters

**For Refresh Tokens**:
```javascript
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent'); // Force consent every time
```

**For Incremental Authorization**:
```javascript
authUrl.searchParams.set('include_granted_scopes', 'true');
```

### Quirks & Tips

✅ **Refresh tokens**: Only issued on first authorization unless `prompt=consent`  
✅ **Token lifetime**: Access tokens expire in 1 hour  
✅ **PKCE support**: Yes, recommended for mobile/SPA  
⚠️ **Redirect URI**: Must be exact match including protocol and port  

### Example Authorization URL

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/callback&
  response_type=code&
  scope=openid%20profile%20email&
  state=RANDOM_STATE&
  access_type=offline&
  prompt=consent
```

### Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)

---

## GitHub

### Configuration URLs

```javascript
const GITHUB_CONFIG = {
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userApiUrl: 'https://api.github.com/user'
};
```

### Getting Credentials

1. Go to Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details
4. Note your Client ID and generate Client Secret

### Common Scopes

```
user              # Read user profile
user:email        # Read email addresses
read:user         # Read all user profile data
repo              # Full repo access
public_repo       # Public repos only
admin:org         # Organization access
gist              # Gist access
```

### Special Parameters

**No special parameters needed** for basic flow.

### Quirks & Tips

✅ **Accept header**: Use `Accept: application/json` for JSON responses  
✅ **Token lifetime**: GitHub tokens don't expire (until revoked)  
✅ **Scope format**: Colon-separated (`read:user`, not `read_user`)  
✅ **PKCE support**: Yes, supported  
⚠️ **Rate limits**: Authenticated requests have higher rate limits  

### Example Authorization URL

```
https://github.com/login/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://yourapp.com/callback&
  scope=user%20repo&
  state=RANDOM_STATE
```

### Token Exchange Quirk

```javascript
// ⚠️ GitHub requires Accept header for JSON response
const response = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Accept': 'application/json', // Important!
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: tokenParams
});
```

### Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps)
- [GitHub OAuth Scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps)

---

## Microsoft / Azure AD

### Configuration URLs

```javascript
const MICROSOFT_CONFIG = {
  authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
  jwksUrl: 'https://login.microsoftonline.com/common/discovery/v2.0/keys'
};
```

### Getting Credentials

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Configure redirect URIs under "Authentication"
5. Create client secret under "Certificates & secrets"

### Common Scopes

```
openid                          # OpenID Connect
profile                         # Profile info
email                           # Email address
offline_access                  # Refresh tokens
User.Read                       # Read user profile
Mail.Read                       # Read mail
Calendars.Read                  # Read calendars
Files.Read.All                  # Read OneDrive files
```

### Special Parameters

**For Admin Consent**:
```javascript
authUrl.searchParams.set('prompt', 'admin_consent');
```

**For Specific Tenant**:
```javascript
// Replace 'common' with tenant ID
const authUrl = 'https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/authorize';
```

### Quirks & Tips

✅ **Refresh tokens**: Require `offline_access` scope  
✅ **Token lifetime**: Access tokens expire in 1 hour  
✅ **Tenant**: Use 'common', 'organizations', 'consumers', or specific tenant ID  
✅ **PKCE support**: Yes, required for mobile apps  
⚠️ **Scope format**: API-specific (e.g., `User.Read`, not `user.read`)  

### Resources

- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API Scopes](https://docs.microsoft.com/en-us/graph/permissions-reference)

---

## Facebook

### Configuration URLs

```javascript
const FACEBOOK_CONFIG = {
  authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  userApiUrl: 'https://graph.facebook.com/v18.0/me'
};
```

### Getting Credentials

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app or select existing
3. Add "Facebook Login" product
4. Configure Valid OAuth Redirect URIs in Facebook Login settings
5. Get App ID and App Secret from Settings → Basic

### Common Scopes

```
public_profile        # Basic profile
email                 # Email address
user_friends          # Friends list
user_photos           # User photos
user_posts            # User posts
pages_show_list       # Pages list
```

### Special Parameters

**For Long-Lived Tokens**:
```javascript
// Exchange short-lived token for long-lived token
const longLivedToken = await fetch(
  'https://graph.facebook.com/v18.0/oauth/access_token?' +
  `grant_type=fb_exchange_token&` +
  `client_id=${CLIENT_ID}&` +
  `client_secret=${CLIENT_SECRET}&` +
  `fb_exchange_token=${shortLivedToken}`
);
```

### Quirks & Tips

✅ **Token lifetime**: Short-lived tokens expire in ~1-2 hours  
✅ **Long-lived tokens**: Valid for ~60 days  
✅ **PKCE support**: Limited  
⚠️ **Scope permissions**: Some require app review  
⚠️ **API versioning**: URLs include version (v18.0)  

### Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Facebook Permissions Reference](https://developers.facebook.com/docs/permissions/reference)

---

## Auth0

### Configuration URLs

```javascript
const AUTH0_CONFIG = {
  authorizationUrl: 'https://YOUR_DOMAIN.auth0.com/authorize',
  tokenUrl: 'https://YOUR_DOMAIN.auth0.com/oauth/token',
  userInfoUrl: 'https://YOUR_DOMAIN.auth0.com/userinfo',
  jwksUrl: 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json'
};
```

### Getting Credentials

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Create application (Regular Web App, SPA, or Native)
3. Note Domain, Client ID, and Client Secret
4. Configure Allowed Callback URLs

### Common Scopes

```
openid                # OpenID Connect
profile               # User profile
email                 # Email address
offline_access        # Refresh tokens
read:users            # Read user data (Management API)
```

### Special Parameters

**For Refresh Tokens**:
```javascript
authUrl.searchParams.set('scope', 'openid profile email offline_access');
```

**For Social Connections**:
```javascript
authUrl.searchParams.set('connection', 'google-oauth2');
// or 'github', 'facebook', etc.
```

### Quirks & Tips

✅ **PKCE support**: Yes, recommended for SPAs  
✅ **Refresh tokens**: Require `offline_access` scope  
✅ **Token lifetime**: Configurable per application  
✅ **Custom domains**: Can use your own domain  
⚠️ **Audience parameter**: Required for API access  

### Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Quickstarts](https://auth0.com/docs/quickstarts)

---

## Okta

### Configuration URLs

```javascript
const OKTA_CONFIG = {
  authorizationUrl: 'https://YOUR_DOMAIN.okta.com/oauth2/v1/authorize',
  tokenUrl: 'https://YOUR_DOMAIN.okta.com/oauth2/v1/token',
  userInfoUrl: 'https://YOUR_DOMAIN.okta.com/oauth2/v1/userinfo',
  jwksUrl: 'https://YOUR_DOMAIN.okta.com/oauth2/v1/keys'
};
```

### Getting Credentials

1. Sign in to [Okta Developer Console](https://developer.okta.com/)
2. Create application (Web, SPA, or Native)
3. Note Client ID and Client Secret
4. Configure Redirect URIs

### Common Scopes

```
openid                # OpenID Connect
profile               # User profile
email                 # Email address
offline_access        # Refresh tokens
groups                # User groups
```

### Special Parameters

**For Custom Authorization Server**:
```javascript
// Use /oauth2/default or custom auth server
const authUrl = 'https://YOUR_DOMAIN.okta.com/oauth2/default/v1/authorize';
```

### Quirks & Tips

✅ **PKCE support**: Yes, required for SPAs and mobile  
✅ **Refresh tokens**: Require `offline_access` scope  
✅ **Token lifetime**: Configurable  
⚠️ **Issuer validation**: Verify issuer in ID token  

### Resources

- [Okta OAuth 2.0 Documentation](https://developer.okta.com/docs/reference/api/oidc/)
- [Okta Developer Portal](https://developer.okta.com/)

---

## General Tips for All Providers

### Testing Your Integration

1. **Use OAuth Playground**: Most providers offer testing tools
2. **Check Token Response**: Verify you receive expected tokens
3. **Test Token Refresh**: Ensure refresh tokens work
4. **Test Scope Denial**: Handle users declining permissions
5. **Test Error Cases**: Invalid credentials, expired codes, etc.

### Common Parameters Across Providers

| Parameter | Description | Required |
|-----------|-------------|----------|
| `client_id` | Your application ID | ✅ Yes |
| `redirect_uri` | Callback URL | ✅ Yes |
| `response_type` | Use `code` for Auth Code Flow | ✅ Yes |
| `scope` | Requested permissions | ✅ Yes |
| `state` | CSRF protection | ✅ Recommended |
| `code_challenge` | PKCE challenge | For public clients |
| `nonce` | Replay attack prevention | For OpenID Connect |

---

**Need help with a specific provider?** Open an issue or contribute a guide!

🌐 **Happy integrating!**
