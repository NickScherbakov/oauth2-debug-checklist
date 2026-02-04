# Node.js OAuth 2.0 Examples

Complete OAuth 2.0 Authorization Code Flow implementation using Node.js and Express.

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ installed
- OAuth application registered with your provider (Google, GitHub, etc.)

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file:

```env
# OAuth Provider Settings
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:3000/callback
AUTHORIZATION_URL=https://provider.com/oauth/authorize
TOKEN_URL=https://provider.com/oauth/token

# Application Settings
PORT=3000
SESSION_SECRET=your_random_session_secret_here
```

### Run

```bash
npm start
```

Visit `http://localhost:3000` to test the OAuth flow.

## 📁 Files

- **`basic-oauth.js`** - Minimal OAuth 2.0 implementation
- **`oauth-with-pkce.js`** - OAuth 2.0 with PKCE for enhanced security
- **`oauth-google.js`** - Google-specific OAuth 2.0 example
- **`oauth-github.js`** - GitHub-specific OAuth 2.0 example

## ✅ Security Checklist

This implementation includes:

- ✅ State parameter for CSRF protection
- ✅ Client secret kept server-side only
- ✅ Secure session management
- ✅ Proper error handling
- ✅ HTTPS enforcement (production)
- ✅ Token validation

## 🔍 Common Issues

See the checklist items in the main README that these examples address:

1. **Redirect URI mismatch** - Exact match in `.env` and provider settings
2. **State parameter** - Generated and validated on each request
3. **Client secret exposure** - Never sent to browser
4. **Token mixing** - Clear separation of authorization code and tokens

## 📚 Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Passport.js OAuth Strategies](http://www.passportjs.org/)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
