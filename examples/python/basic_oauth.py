import os
import secrets
import requests
from flask import Flask, redirect, request, session, url_for
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(32))

# OAuth Configuration
OAUTH_CONFIG = {
    'client_id': os.getenv('CLIENT_ID'),
    'client_secret': os.getenv('CLIENT_SECRET'),
    'redirect_uri': os.getenv('REDIRECT_URI'),
    'authorization_url': os.getenv('AUTHORIZATION_URL'),
    'token_url': os.getenv('TOKEN_URL'),
    'scope': 'openid profile email'
}


def generate_state():
    """✅ Checklist Item #2: Generate secure state parameter"""
    return secrets.token_urlsafe(32)


@app.route('/')
def home():
    """Home page with login button"""
    if 'user' in session:
        user = session['user']
        return f'''
            <h1>Welcome {user.get('email', 'User')}!</h1>
            <p>You are logged in.</p>
            <a href="/logout">Logout</a>
        '''
    
    return '''
        <h1>OAuth 2.0 Demo (Python/Flask)</h1>
        <a href="/login">Login with OAuth</a>
    '''


@app.route('/login')
def login():
    """Step 1: Redirect to authorization endpoint"""
    # ✅ Checklist Item #2: Generate and store state
    state = generate_state()
    session['oauth_state'] = state

    # ✅ Checklist Item #1: Ensure redirect_uri matches exactly
    params = {
        'client_id': OAUTH_CONFIG['client_id'],
        'redirect_uri': OAUTH_CONFIG['redirect_uri'],
        'response_type': 'code',
        'scope': OAUTH_CONFIG['scope'],
        'state': state
    }

    # ✅ Provider-specific parameters (uncomment as needed)
    # params['access_type'] = 'offline'  # Google: for refresh tokens
    # params['prompt'] = 'consent'  # Force consent screen

    auth_url = f"{OAUTH_CONFIG['authorization_url']}?{requests.compat.urlencode(params)}"
    return redirect(auth_url)


@app.route('/callback')
def callback():
    """Step 2: Handle callback from authorization server"""
    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')
    error_description = request.args.get('error_description')

    # ✅ Checklist Item #6: Handle authorization errors
    if error:
        return f'''
            <h1>Authorization Error</h1>
            <p>Error: {error}</p>
            <p>Description: {error_description or "No description provided"}</p>
            <a href="/">Back to home</a>
        ''', 400

    # ✅ Checklist Item #2: Validate state parameter
    stored_state = session.pop('oauth_state', None)
    if not state or state != stored_state:
        return '''
            <h1>Invalid State Parameter</h1>
            <p>Possible CSRF attack detected. State mismatch.</p>
            <a href="/">Back to home</a>
        ''', 403

    # ✅ Checklist Item #4: Don't confuse authorization code with access token
    if not code:
        return 'No authorization code received', 400

    try:
        # ✅ Checklist Item #3: Token exchange happens server-side with client_secret
        token_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': OAUTH_CONFIG['redirect_uri'],  # ✅ Must match exactly
            'client_id': OAUTH_CONFIG['client_id'],
            'client_secret': OAUTH_CONFIG['client_secret']  # ✅ Never expose to frontend!
        }

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }

        response = requests.post(
            OAUTH_CONFIG['token_url'],
            data=token_data,
            headers=headers,
            timeout=10
        )

        if response.status_code != 200:
            raise Exception(f"Token endpoint returned {response.status_code}: {response.text}")

        token_response = response.json()
        access_token = token_response.get('access_token')
        refresh_token = token_response.get('refresh_token')
        id_token = token_response.get('id_token')

        # ✅ Store tokens securely (in production, use encrypted storage)
        session['access_token'] = access_token
        if refresh_token:
            session['refresh_token'] = refresh_token

        # Decode ID token if present (for OpenID Connect)
        if id_token:
            # In production, verify the JWT signature!
            import base64
            import json
            payload = json.loads(base64.urlsafe_b64decode(
                id_token.split('.')[1] + '=='
            ).decode('utf-8'))
            
            session['user'] = {
                'email': payload.get('email'),
                'name': payload.get('name'),
                'sub': payload.get('sub')
            }

        return redirect('/')

    except Exception as e:
        # ✅ Checklist Item #6: Log and handle token endpoint errors
        print(f'Token exchange error: {str(e)}')
        
        return f'''
            <h1>Token Exchange Failed</h1>
            <p>Error: {str(e)}</p>
            <p>Common causes:</p>
            <ul>
                <li>Authorization code already used (codes are single-use)</li>
                <li>Authorization code expired (usually valid for 10 minutes)</li>
                <li>Invalid client credentials</li>
                <li>Redirect URI mismatch</li>
            </ul>
            <a href="/">Try again</a>
        ''', 500


@app.route('/logout')
def logout():
    """Clear session and logout"""
    session.clear()
    return redirect('/')


@app.route('/api/profile')
def profile():
    """Protected route example"""
    if 'access_token' not in session:
        return {'error': 'Not authenticated'}, 401

    # Use access token to call protected API
    # (implementation depends on your provider)
    return {
        'message': 'This is a protected resource',
        'user': session.get('user')
    }


if __name__ == '__main__':
    print(f"OAuth 2.0 demo server running on http://localhost:5000")
    print(f"Make sure your redirect URI is set to: {OAUTH_CONFIG['redirect_uri']}")
    app.run(debug=True, port=5000)
