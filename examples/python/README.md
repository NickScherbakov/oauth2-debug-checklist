# Python OAuth 2.0 Examples

OAuth 2.0 Authorization Code Flow implementation using Python with Flask.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+ installed
- OAuth application registered with your provider

### Installation

```bash
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```env
CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=http://localhost:5000/callback
AUTHORIZATION_URL=https://provider.com/oauth/authorize
TOKEN_URL=https://provider.com/oauth/token
SECRET_KEY=your_random_secret_key_for_sessions
```

### Run

```bash
python basic_oauth.py
```

Visit `http://localhost:5000` to test the OAuth flow.

## 📁 Files

- **`basic_oauth.py`** - Minimal OAuth 2.0 implementation with Flask
- **`oauth_with_pkce.py`** - OAuth 2.0 with PKCE
- **`requirements.txt`** - Python dependencies

## ✅ Security Features

- ✅ State parameter for CSRF protection
- ✅ Secure session handling with Flask-Session
- ✅ Client secret kept server-side
- ✅ Token validation
- ✅ PKCE support

## 📚 Learn More

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Requests-OAuthlib](https://requests-oauthlib.readthedocs.io/)
- [Authlib for Python](https://docs.authlib.org/)
