const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', httpOnly: true }
}));

const config = {
  clientId: process.env.CLIENT_ID,
  redirectUri: process.env.REDIRECT_URI,
  authorizationUrl: process.env.AUTHORIZATION_URL,
  tokenUrl: process.env.TOKEN_URL,
  scope: 'openid profile email'
};

// ✅ PKCE: Generate code verifier (43-128 characters)
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

// ✅ PKCE: Generate code challenge from verifier
function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

app.get('/', (req, res) => {
  if (req.session.user) {
    return res.send(`
      <h1>Welcome ${req.session.user.email || 'User'}!</h1>
      <p>Authenticated with PKCE!</p>
      <a href="/logout">Logout</a>
    `);
  }
  
  res.send(`
    <h1>OAuth 2.0 with PKCE Demo</h1>
    <p>PKCE (Proof Key for Code Exchange) adds extra security</p>
    <a href="/login">Login with OAuth + PKCE</a>
  `);
});

app.get('/login', (req, res) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // ✅ Store state and code verifier in session
  req.session.oauthState = state;
  req.session.codeVerifier = codeVerifier;

  const authUrl = new URL(config.authorizationUrl);
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', config.scope);
  authUrl.searchParams.set('state', state);
  
  // ✅ PKCE parameters
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  console.log('🔐 PKCE Flow initiated:');
  console.log('  Code Verifier:', codeVerifier);
  console.log('  Code Challenge:', codeChallenge);

  res.redirect(authUrl.toString());
});

app.get('/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`Error: ${error} - ${error_description}`);
  }

  if (!state || state !== req.session.oauthState) {
    return res.status(403).send('Invalid state parameter - CSRF detected');
  }

  const codeVerifier = req.session.codeVerifier;
  if (!codeVerifier) {
    return res.status(400).send('Code verifier not found in session');
  }

  // Clear session values
  delete req.session.oauthState;
  delete req.session.codeVerifier;

  try {
    // ✅ PKCE: Send code_verifier instead of client_secret
    // Note: Some providers still require client_secret even with PKCE
    const tokenParams = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      code_verifier: codeVerifier // ✅ PKCE parameter
    };

    // If your provider requires client_secret even with PKCE, add it:
    // if (process.env.CLIENT_SECRET) {
    //   tokenParams.client_secret = process.env.CLIENT_SECRET;
    // }

    console.log('🔐 Exchanging code with PKCE:');
    console.log('  Code Verifier:', codeVerifier);

    const tokenResponse = await axios.post(
      config.tokenUrl,
      new URLSearchParams(tokenParams),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }
    );

    const { access_token, id_token } = tokenResponse.data;

    req.session.accessToken = access_token;

    if (id_token) {
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
    console.error('Token exchange error:', error.response?.data || error.message);
    
    res.status(500).send(`
      <h1>Token Exchange Failed</h1>
      <p>${error.response?.data?.error || 'unknown_error'}</p>
      <p>${error.response?.data?.error_description || error.message}</p>
      <a href="/">Try again</a>
    `);
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ OAuth 2.0 with PKCE demo running on http://localhost:${PORT}`);
  console.log('📘 PKCE adds security by using code_verifier/challenge instead of relying solely on client_secret');
});
