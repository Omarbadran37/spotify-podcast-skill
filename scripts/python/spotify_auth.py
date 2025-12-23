"""
Spotify OAuth Authentication Service

Handles the Authorization Code flow for Spotify API authentication.
Stores tokens locally and handles automatic refresh.

Compatible with Spotify MCP server token format.
"""

import json
import os
import time
import secrets
import webbrowser
from pathlib import Path
from typing import Optional, Dict
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlencode, urlparse, parse_qs
import requests

SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
REDIRECT_URI = "http://127.0.0.1:8888/callback"
SCOPES = "user-library-read user-read-private user-read-email"


class SpotifyAuth:
    """
    Manages Spotify OAuth 2.0 authentication with automatic token refresh.

    Token storage format matches the Spotify MCP server for compatibility.
    """

    def __init__(self, client_id: str, client_secret: str, token_path: Optional[str] = None):
        """
        Initialize Spotify authentication.

        Args:
            client_id: Spotify application client ID
            client_secret: Spotify application client secret
            token_path: Custom token file path (default: ~/.spotify-mcp-tokens.json)
        """
        self.client_id = client_id
        self.client_secret = client_secret

        # Store tokens in user's home directory (matches MCP server)
        if token_path:
            self.token_path = Path(token_path)
        else:
            self.token_path = Path.home() / ".spotify-mcp-tokens.json"

        # Try to load existing tokens
        self.token_data = self._load_tokens()

    def _load_tokens(self) -> Optional[Dict]:
        """Load tokens from disk."""
        try:
            if self.token_path.exists():
                with open(self.token_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Failed to load tokens: {e}", file=__import__('sys').stderr)
        return None

    def _save_tokens(self):
        """Save tokens to disk."""
        try:
            with open(self.token_path, 'w') as f:
                json.dump(self.token_data, f, indent=2)
        except Exception as e:
            print(f"Failed to save tokens: {e}", file=__import__('sys').stderr)

    def _generate_state(self) -> str:
        """Generate a random state string for CSRF protection."""
        return secrets.token_hex(16)

    def has_valid_tokens(self) -> bool:
        """
        Check if we have valid tokens (with 60 second buffer).

        Returns:
            True if tokens exist and are not expired
        """
        if not self.token_data:
            return False

        # Check if token is expired (with 60 second buffer)
        now_ms = int(time.time() * 1000)
        return self.token_data['expires_at'] > now_ms + 60000

    def get_access_token(self) -> str:
        """
        Get the current access token, refreshing if needed.

        Returns:
            Valid access token

        Raises:
            Exception: If not authenticated
        """
        if not self.token_data:
            raise Exception("Not authenticated. Run authenticate.py first.")

        # Check if token needs refresh (60 second buffer)
        now_ms = int(time.time() * 1000)
        if self.token_data['expires_at'] <= now_ms + 60000:
            self._refresh_token()

        return self.token_data['access_token']

    def _refresh_token(self):
        """Refresh the access token using the refresh token."""
        import sys
        if not self.token_data or 'refresh_token' not in self.token_data:
            raise Exception("No refresh token available. Run authenticate.py first.")

        try:
            response = requests.post(
                SPOTIFY_TOKEN_URL,
                data={
                    'grant_type': 'refresh_token',
                    'refresh_token': self.token_data['refresh_token']
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': self._get_basic_auth_header()
                }
            )
            response.raise_for_status()
            data = response.json()

            # Update token data (keep existing refresh token if not provided)
            self.token_data.update({
                'access_token': data['access_token'],
                'refresh_token': data.get('refresh_token', self.token_data['refresh_token']),
                'expires_at': int(time.time() * 1000) + data['expires_in'] * 1000,
                'token_type': data['token_type'],
                'scope': data['scope']
            })

            self._save_tokens()
            print("Token refreshed successfully", file=sys.stderr)
        except Exception as e:
            raise Exception(f"Failed to refresh access token: {e}")

    def _get_basic_auth_header(self) -> str:
        """Get Basic Auth header value."""
        import base64
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    def authenticate(self):
        """
        Start the OAuth flow - opens browser and waits for callback.

        This method will:
        1. Generate authorization URL
        2. Start local server on port 8888
        3. Open browser for user to authorize
        4. Wait for callback with authorization code
        5. Exchange code for tokens
        6. Save tokens to disk
        """
        import sys
        state = self._generate_state()

        # Build authorization URL
        auth_params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'state': state,
            'scope': SCOPES
        }
        auth_url = f"{SPOTIFY_AUTH_URL}?{urlencode(auth_params)}"

        print("\n=== Spotify Authentication ===\n", file=sys.stderr)
        print("Please open this URL in your browser to authenticate:\n", file=sys.stderr)
        print(auth_url, file=sys.stderr)
        print("\nWaiting for authentication...\n", file=sys.stderr)

        # Try to open browser automatically
        try:
            webbrowser.open(auth_url)
        except:
            pass

        # Start local server to receive callback
        code = self._wait_for_callback(state)

        # Exchange code for tokens
        self._exchange_code_for_tokens(code)

        print("\nAuthentication successful! Tokens saved.\n", file=sys.stderr)

    def _wait_for_callback(self, expected_state: str) -> str:
        """
        Start a temporary server to receive the OAuth callback.

        Args:
            expected_state: Expected state parameter for CSRF validation

        Returns:
            Authorization code from callback
        """
        import sys
        result = {'code': None, 'error': None}

        class CallbackHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass  # Suppress default logging

            def do_GET(handler_self):
                parsed_url = urlparse(handler_self.path)

                if parsed_url.path == '/callback':
                    params = parse_qs(parsed_url.query)
                    code = params.get('code', [None])[0]
                    state = params.get('state', [None])[0]
                    error = params.get('error', [None])[0]

                    if error:
                        result['error'] = f"Authentication failed: {error}"
                        handler_self.send_error(400, result['error'])
                        return

                    if state != expected_state:
                        result['error'] = "State mismatch - possible CSRF attack"
                        handler_self.send_error(400, result['error'])
                        return

                    if not code:
                        result['error'] = "No authorization code received"
                        handler_self.send_error(400, result['error'])
                        return

                    # Success
                    result['code'] = code
                    handler_self.send_response(200)
                    handler_self.send_header('Content-type', 'text/html')
                    handler_self.end_headers()
                    html = """
                    <html>
                      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                        <h1>Authentication Successful!</h1>
                        <p>You can close this window and return to the terminal.</p>
                      </body>
                    </html>
                    """
                    handler_self.wfile.write(html.encode())

        # Start server
        server = HTTPServer(('127.0.0.1', 8888), CallbackHandler)
        print("Callback server listening on http://127.0.0.1:8888/callback", file=sys.stderr)

        # Handle one request (the callback)
        server.handle_request()

        if result['error']:
            raise Exception(result['error'])

        return result['code']

    def _exchange_code_for_tokens(self, code: str):
        """
        Exchange authorization code for access and refresh tokens.

        Args:
            code: Authorization code from callback
        """
        try:
            response = requests.post(
                SPOTIFY_TOKEN_URL,
                data={
                    'grant_type': 'authorization_code',
                    'code': code,
                    'redirect_uri': REDIRECT_URI
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': self._get_basic_auth_header()
                }
            )
            response.raise_for_status()
            data = response.json()

            # Save token data (format matches MCP server)
            self.token_data = {
                'access_token': data['access_token'],
                'refresh_token': data['refresh_token'],
                'expires_at': int(time.time() * 1000) + data['expires_in'] * 1000,
                'token_type': data['token_type'],
                'scope': data['scope']
            }

            self._save_tokens()
        except Exception as e:
            raise Exception(f"Failed to exchange authorization code for tokens: {e}")

    def clear_tokens(self):
        """Clear stored tokens (logout)."""
        import sys
        self.token_data = None
        try:
            if self.token_path.exists():
                self.token_path.unlink()
                print(f"Tokens cleared from {self.token_path}", file=sys.stderr)
        except Exception as e:
            print(f"Failed to clear tokens: {e}", file=sys.stderr)
