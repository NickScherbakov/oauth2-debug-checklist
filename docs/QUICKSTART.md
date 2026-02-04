# Quick Start Guide 🚀

Get started with OAuth 2.0 in under 5 minutes!

## Choose Your Path

### 🎯 I want to understand OAuth 2.0
1. Read [Why OAuth 2.0?](#why-oauth-20)
2. Check the [OAuth Flow Diagram](#oauth-flow-visualization)
3. Review the [main checklist](../README.md#-the-checklist)

### 💻 I want working code
1. Pick your language: [Node.js](../examples/nodejs/) | [Python](../examples/python/)
2. Clone the example
3. Configure `.env` file
4. Run it!

### 🐛 I'm debugging an issue
1. Check [Common Scenarios](../README.md#-common-scenarios)
2. Follow the [Troubleshooting Flowchart](../README.md#-troubleshooting-flowchart)
3. Go through the [checklist](../README.md#-the-checklist) systematically

---

## Why OAuth 2.0?

**OAuth 2.0** is the industry-standard protocol for authorization. It allows:

- 🔐 **"Login with Google/GitHub"** - Users can sign in using existing accounts
- 🔒 **Secure API access** - Apps can access user data without passwords
- 🎛️ **Fine-grained permissions** - Users control what data apps can access
- ⏰ **Time-limited access** - Tokens expire, reducing security risks

### Real-World Example

**Without OAuth 2.0:**
```
❌ "Enter your Gmail password so we can read your emails"
   → You give away your password
   → Third party has full access forever
   → Huge security risk!
```

**With OAuth 2.0:**
```
✅ "Login with Google to allow read-only email access"
   → Redirected to Google's secure login
   → You approve specific permissions
   → App gets temporary access token
   → You can revoke access anytime
```

---

## OAuth Flow Visualization

### Standard Authorization Code Flow

```
┌─────────┐                                  ┌──────────────┐
│         │                                  │              │
│  User   │                                  │   OAuth      │
│ Browser │                                  │  Provider    │
│         │                                  │  (Google)    │
└────┬────┘                                  └──────┬───────┘
     │                                              │
     │  1. Click "Login with Google"               │
     │─────────────────────────────┐               │
     │                              │               │
     │                         ┌────▼────┐          │
     │                         │         │          │
     │                         │  Your   │          │
     │                         │  App    │          │
     │                         │ Server  │          │
     │                         │         │          │
     │                         └────┬────┘          │
     │                              │               │
     │  2. Redirect to OAuth        │               │
     │     Provider with state      │               │
     │◄─────────────────────────────┤               │
     │                              │               │
     │  3. GET /authorize?          │               │
     │     client_id=...&           │               │
     │     redirect_uri=...&        │               │
     │     state=...                │               │
     ├──────────────────────────────┼──────────────►│
     │                              │               │
     │  4. User logs in &           │               │
     │     grants permissions       │               │
     │                              │               │
     │  5. Redirect back with       │               │
     │     authorization code       │               │
     │◄─────────────────────────────┼───────────────┤
     │  /callback?                  │               │
     │  code=AUTH_CODE&             │               │
     │  state=...                   │               │
     │                              │               │
     │  6. Send code to server      │               │
     ├─────────────────────────────►│               │
     │                              │               │
     │                              │  7. Exchange  │
     │                              │     code for  │
     │                              │     tokens    │
     │                              │  POST /token  │
     │                              ├──────────────►│
     │                              │  code=...     │
     │                              │  client_id=...│
     │                              │  secret=...   │
     │                              │               │
     │                              │  8. Return    │
     │                              │     tokens    │
     │                              │◄──────────────┤
     │                              │  {            │
     │                              │   access_token│
     │                              │   id_token    │
     │                              │  }            │
     │  9. User logged in!          │               │
     │◄─────────────────────────────┤               │
     │                              │               │
```

### Key Steps Explained

1. **User clicks login** - Initiates the OAuth flow
2. **Redirect to provider** - App sends user to OAuth provider (Google, GitHub, etc.)
3. **Authorization request** - Includes client_id, redirect_uri, scope, and state
4. **User authentication** - User logs in and approves permissions
5. **Authorization code** - Provider redirects back with single-use code
6. **Code sent to backend** - Frontend sends code to your server
7. **Token exchange** - Server exchanges code for tokens (includes client_secret)
8. **Tokens received** - Server gets access_token and optionally refresh_token, id_token
9. **User authenticated** - User is now logged in

---

## 5-Minute Setup (Node.js)

### Step 1: Register OAuth App

Pick a provider and register your application:

**Google:**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project
- Enable "Google+ API"
- Create OAuth 2.0 credentials
- Set authorized redirect URI: `http://localhost:3000/callback`

**GitHub:**
- Go to Settings → Developer settings → OAuth Apps
- Click "New OAuth App"
- Set Homepage URL: `http://localhost:3000`
- Set Authorization callback URL: `http://localhost:3000/callback`

### Step 2: Clone Example

```bash
git clone https://github.com/NickScherbakov/oauth2-debug-checklist.git
cd oauth2-debug-checklist/examples/nodejs
npm install
```

### Step 3: Configure

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
CLIENT_ID=your_client_id_from_step_1
CLIENT_SECRET=your_client_secret_from_step_1
REDIRECT_URI=http://localhost:3000/callback

# For Google:
AUTHORIZATION_URL=https://accounts.google.com/o/oauth2/v2/auth
TOKEN_URL=https://oauth2.googleapis.com/token

# For GitHub:
# AUTHORIZATION_URL=https://github.com/login/oauth/authorize
# TOKEN_URL=https://github.com/login/oauth/access_token
```

### Step 4: Run

```bash
npm start
```

Visit `http://localhost:3000` and click "Login"!

---

## Common Mistakes to Avoid

### ❌ Mistake #1: Exposing Client Secret

**Don't do this:**
```javascript
// ❌ NEVER in frontend JavaScript!
const CLIENT_SECRET = 'your_secret_here';
```

**Do this:**
```javascript
// ✅ Only in backend/server code
// Environment variable
const CLIENT_SECRET = process.env.CLIENT_SECRET;
```

---

### ❌ Mistake #2: Forgetting State Parameter

**Don't do this:**
```javascript
// ❌ No CSRF protection
redirect(`${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}`);
```

**Do this:**
```javascript
// ✅ Include state for CSRF protection
const state = generateRandomState();
session.state = state;
redirect(`${authUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`);
```

---

### ❌ Mistake #3: Redirect URI Mismatch

**Don't do this:**
```javascript
// Registered: http://localhost:3000/callback
// But using:  http://localhost:3000/oauth/callback  ❌
```

**Do this:**
```javascript
// ✅ Exact match required!
// Registered: http://localhost:3000/callback
const REDIRECT_URI = 'http://localhost:3000/callback';
```

---

## Next Steps

1. ✅ Get the example working
2. ✅ Read through the [full checklist](../README.md#-the-checklist)
3. ✅ Understand [PKCE](../README.md#8--missing-pkce-for-spas-and-mobile-apps) for SPAs
4. ✅ Review [security best practices](../README.md#12--id-token-validation-skipped)
5. ✅ Check [provider-specific docs](../README.md#5-️-provider-specific-quirks)

---

## Need Help?

- 📚 Read the [FAQ](../README.md#-faq)
- 🐛 [Report an issue](https://github.com/NickScherbakov/oauth2-debug-checklist/issues)
- 💬 Ask in [Discussions](https://github.com/NickScherbakov/oauth2-debug-checklist/discussions)

**Happy coding!** 🎉
