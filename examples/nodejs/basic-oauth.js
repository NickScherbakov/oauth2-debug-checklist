const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();

// ✅ Checklist Item #2: Secure session for state parameter
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 3600000 // 1 hour
  }
}));

// OAuth Configuration
const config = {
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  authorizationUrl: process.env.AUTHORIZATION_URL,
  tokenUrl: process.env.TOKEN_URL,
  scope: 'openid profile email' // Adjust based on your needs
};

// ✅ Checklist Item #2: Generate secure state parameter
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

// Home page - Login button
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.send(`
      <h1>Welcome ${req.session.user.email || 'User'}!</h1>
      <p>You are logged in.</p>
      <a href="/logout">Logout</a>
    `);
  }
  
  res.send(`
    <h1>OAuth 2.0 Demo</h1>
    <a href="/login">Login with OAuth</a>
  `);
});

// Step 1: Redirect to authorization endpoint
app.get('/login', (req, res) => {
  // ✅ Checklist Item #2: Generate and store state
  const state = generateState();
  req.session.oauthState = state;

  // ✅ Checklist Item #1: Ensure redirect_uri matches exactly
  const authUrl = new URL(config.authorizationUrl);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);

  // ✅ Provider-specific: Some providers need additional parameters
  // authUrl.searchParams.set('access_type', 'offline'); // Google: for refresh tokens
  // authUrl.searchParams.set('prompt', 'consent'); // Force consent screen

  res.redirect(authUrl.toString());
});

// Step 2: Handle callback from authorization server
app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  // ✅ Checklist Item #6: Handle authorization errors
  if (error) {
    return res.status(400).send(`
      <h1>Authorization Error</h1>
      <p>Error: ${error}</p>
      <p>Description: ${error_description || 'No description provided'}</p>
      <a href="/">Back to home</a>
    `);
  }

  // ✅ Checklist Item #2: Validate state parameter
  if (!state || state !== req.session.oauthState) {
    return res.status(403).send(`
      <h1>Invalid State Parameter</h1>
      <p>Possible CSRF attack detected. State mismatch.</p>
      <a href="/">Back to home</a>
    `);
  }

  // Clear state after validation
  delete req.session.oauthState;

  // ✅ Checklist Item #4: Don't confuse authorization code with access token
  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    // ✅ Checklist Item #3: Token exchange happens server-side with client_secret
    const tokenResponse = await axios.post(
      config.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectUri, // ✅ Must match exactly
        client_id: config.clientId,
        client_secret: config.clientSecret // ✅ Never expose this to frontend!
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const { access_token, refresh_token, id_token, expires_in } = tokenResponse.data;

    // ✅ Store tokens securely (in production, use encrypted storage)
    req.session.accessToken = access_token;
    if (refresh_token) {
      req.session.refreshToken = refresh_token;
    }

    // Decode ID token if present (for OpenID Connect)
    if (id_token) {
      // In production, verify the JWT signature!
      const payload = JSON.parse(
        Buffer.from(id_token.split('.')[1], 'base64').toString()
      );
      req.session.user = {
        email: payload.email,
        name: payload.name,
        sub: payload.sub
      };
    }

    res.redirect('/');

  } catch (error) {
    // ✅ Checklist Item #6: Log and handle token endpoint errors
    console.error('Token exchange error:', error.response?.data || error.message);
    
    const errorDetail = error.response?.data?.error || 'unknown_error';
    const errorDesc = error.response?.data?.error_description || error.message;

    res.status(500).send(`
      <h1>Token Exchange Failed</h1>
      <p>Error: ${errorDetail}</p>
      <p>Description: ${errorDesc}</p>
      <p>Common causes:</p>
      <ul>
        <li>Authorization code already used (codes are single-use)</li>
        <li>Authorization code expired (usually valid for 10 minutes)</li>
        <li>Invalid client credentials</li>
        <li>Redirect URI mismatch</li>
      </ul>
      <a href="/">Try again</a>
    `);
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Protected route example
app.get('/api/profile', (req, res) => {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Use access token to call protected API
  // (implementation depends on your provider)
  res.json({
    message: 'This is a protected resource',
    user: req.session.user
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth 2.0 demo server running on http://localhost:${PORT}`);
  console.log('Make sure your redirect URI is set to:', config.redirectUri);
});
