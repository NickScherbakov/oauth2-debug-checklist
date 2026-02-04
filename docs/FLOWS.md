# OAuth 2.0 Flow Comparison Guide 🔄

Understanding which OAuth 2.0 flow to use for your application type.

## 📊 Quick Decision Table

| Your Application Type | Recommended Flow | Use PKCE? | Use client_secret? |
|----------------------|------------------|-----------|-------------------|
| Web app with backend | Authorization Code | Optional | ✅ Yes |
| Single-Page App (SPA) | Authorization Code | ✅ Required | ❌ No |
| Mobile app (iOS/Android) | Authorization Code | ✅ Required | ❌ No |
| Desktop app | Authorization Code | ✅ Required | ❌ No |
| Server-to-server | Client Credentials | N/A | ✅ Yes |
| Device (Smart TV, CLI) | Device Flow | N/A | ✅ Yes |

---

## 🔐 Flow Types Explained

### 1. Authorization Code Flow (Recommended)

**Best for**: Web applications with a backend server

**Security**: ✅ High - Client secret kept on server

**How it works**:
```
User → Authorization Server → User grants permission
     → Redirect with code
     → Backend exchanges code for tokens (with secret)
     → Backend stores tokens securely
```

**Pros**:
- ✅ Most secure flow
- ✅ Tokens never exposed to browser
- ✅ Supports refresh tokens
- ✅ Client secret protected on server

**Cons**:
- ❌ Requires backend server

**Use when**:
- You have a backend server (Node.js, Python, Java, etc.)
- You can securely store client_secret
- You need the highest security

**Example providers**: All providers support this

**Code example**: [Node.js Authorization Code Flow](../examples/nodejs/basic-oauth.js)

---

### 2. Authorization Code Flow + PKCE

**Best for**: Single-Page Apps (SPAs), Mobile apps, Desktop apps

**Security**: ✅ High - No client secret needed

**How it works**:
```
App → Generate code_verifier (random string)
    → Calculate code_challenge = hash(code_verifier)
    → Authorization Server (with code_challenge)
    → User grants permission
    → Redirect with code
    → Exchange code + code_verifier for tokens
    → Server validates: hash(code_verifier) == code_challenge
```

**Pros**:
- ✅ Secure without client secret
- ✅ Prevents authorization code interception
- ✅ Works for public clients
- ✅ Supports refresh tokens (with offline_access)

**Cons**:
- ❌ Slightly more complex implementation

**Use when**:
- You CAN'T securely store client_secret (SPA, mobile, desktop)
- You need better security than Implicit Flow
- Your provider supports PKCE (most modern providers do)

**Required for**:
- ✅ Single-Page Applications (React, Vue, Angular)
- ✅ Mobile apps (iOS, Android, React Native)
- ✅ Desktop apps (Electron, native)

**Code example**: [Node.js PKCE Flow](../examples/nodejs/oauth-with-pkce.js)

---

### 3. Implicit Flow (DEPRECATED - Don't Use!)

**Status**: ⚠️ **DEPRECATED** - Use Authorization Code + PKCE instead

**Why it's deprecated**:
- ❌ Access token in URL (visible in browser history)
- ❌ Access token in Referer headers
- ❌ No refresh tokens
- ❌ Less secure than PKCE

**Migration path**:
```
❌ Old: response_type=token (Implicit Flow)
✅ New: response_type=code + PKCE (Authorization Code + PKCE)
```

**Never use Implicit Flow** - Always use Authorization Code + PKCE for SPAs.

---

### 4. Client Credentials Flow

**Best for**: Server-to-server communication (no user involved)

**Security**: ✅ High - Service account authentication

**How it works**:
```
Service → Request token with client_id + client_secret
        → Receive access token
        → Call APIs as the service (not as a user)
```

**Pros**:
- ✅ Simple for machine-to-machine
- ✅ No user interaction needed
- ✅ Direct token request

**Cons**:
- ❌ No user context (acts as application, not user)
- ❌ No refresh tokens (tokens represent app, not user)

**Use when**:
- Backend service calling another API
- Scheduled jobs/cron tasks
- Service-to-service authentication
- No user interaction required

**Example use cases**:
- Microservices calling each other
- Backend syncing data from external API
- Automated reporting service

**Not suitable for**:
- User login/authentication
- Accessing user-specific data

---

### 5. Resource Owner Password Credentials (DEPRECATED)

**Status**: ⚠️ **DEPRECATED** - Avoid if possible

**Why it's deprecated**:
- ❌ Application handles user's password (security risk)
- ❌ Can't leverage provider's security features (MFA, etc.)
- ❌ Doesn't support modern auth methods

**Only use when**:
- You control both the client and server
- Migration from legacy system
- Absolutely no other option

**Better alternatives**:
- ✅ Authorization Code Flow
- ✅ Device Flow

---

### 6. Device Flow

**Best for**: Devices with limited input (Smart TVs, CLI tools, IoT)

**Security**: ✅ Good - Uses second device for auth

**How it works**:
```
Device → Request device code
       → Display code to user: "Go to provider.com/device and enter: ABCD-1234"
       → User enters code on phone/computer
       → User grants permission
       → Device polls for token
       → Receives access token
```

**Pros**:
- ✅ Works on input-limited devices
- ✅ User authenticates on trusted device
- ✅ Secure (no password on device)

**Cons**:
- ❌ Requires user to use another device
- ❌ More complex UX

**Use when**:
- Smart TV app
- CLI tool (like `gh auth login`)
- IoT device
- Limited input capability

**Example providers**: Google, Microsoft, GitHub

---

## 🎯 Choosing the Right Flow - Decision Tree

```
Start: What are you building?
│
├─ Web app with backend server?
│  └─ ✅ Use: Authorization Code Flow
│     (with client_secret on server)
│
├─ Single-Page App (React/Vue/Angular)?
│  └─ ✅ Use: Authorization Code Flow + PKCE
│     (no client_secret)
│
├─ Mobile app (iOS/Android)?
│  └─ ✅ Use: Authorization Code Flow + PKCE
│     (no client_secret)
│
├─ Desktop app (Electron/Native)?
│  └─ ✅ Use: Authorization Code Flow + PKCE
│     (no client_secret)
│
├─ Server-to-server (no user)?
│  └─ ✅ Use: Client Credentials Flow
│     (service account)
│
├─ Smart TV / CLI tool?
│  └─ ✅ Use: Device Flow
│     (user enters code on phone)
│
└─ Legacy app with passwords?
   └─ ⚠️ Use: Resource Owner Password (migrate away!)
```

---

## 📋 Flow Comparison Matrix

| Feature | Auth Code | Auth Code + PKCE | Implicit (Deprecated) | Client Credentials | Device Flow |
|---------|-----------|------------------|----------------------|-------------------|-------------|
| **Requires Backend** | ✅ Yes | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **User Interaction** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| **Client Secret** | ✅ Required | ❌ Not used | ❌ Not used | ✅ Required | ✅ Required |
| **Refresh Tokens** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Security Level** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Complexity** | Medium | Medium | Low | Low | Medium |
| **Best For** | Web apps | SPAs, Mobile | ❌ Nothing | M2M | IoT, TV |

---

## 🔄 Migration Guides

### Migrating from Implicit to Auth Code + PKCE

**Before (Implicit - Deprecated)**:
```javascript
// ❌ Old way
const authUrl = `${PROVIDER}/authorize?` +
  `response_type=token&` +  // Returns token directly
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}`;

// Token in URL hash
const token = window.location.hash.match(/access_token=([^&]*)/)[1];
```

**After (Auth Code + PKCE - Recommended)**:
```javascript
// ✅ New way
const codeVerifier = generateRandomString(43);
const codeChallenge = await sha256(codeVerifier);

const authUrl = `${PROVIDER}/authorize?` +
  `response_type=code&` +  // Returns code instead
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `code_challenge=${codeChallenge}&` +
  `code_challenge_method=S256`;

// Exchange code for token
const code = new URLSearchParams(window.location.search).get('code');
const tokens = await exchangeCodeForTokens(code, codeVerifier);
```

**Benefits of migration**:
- ✅ Tokens not in URL
- ✅ Tokens not in browser history
- ✅ Better security
- ✅ Support for refresh tokens

---

## 🛡️ Security Considerations by Flow

### Authorization Code Flow
**Threats**:
- ❌ Client secret exposure → Use environment variables, never commit to git
- ❌ CSRF attacks → Always use state parameter
- ❌ Authorization code interception → Use HTTPS

### Authorization Code + PKCE
**Threats**:
- ❌ Code interception → PKCE prevents this
- ❌ CSRF attacks → Use state parameter
- ❌ Token storage in browser → Use httpOnly cookies or secure storage

### Client Credentials
**Threats**:
- ❌ Secret exposure → Rotate secrets regularly
- ❌ Over-privileged tokens → Use minimal scopes

---

## 🎓 Learn More

- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OpenID Connect](https://openid.net/connect/)

---

**Remember**: When in doubt, use Authorization Code Flow (with PKCE for public clients)! 🚀
