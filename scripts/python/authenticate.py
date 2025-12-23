#!/usr/bin/env python3
"""
Spotify Authentication CLI

Manage Spotify API authentication including OAuth flow, status check,
token refresh, and logout.

Usage:
    python authenticate.py              # Run OAuth flow
    python authenticate.py status       # Check authentication status
    python authenticate.py refresh      # Refresh access token
    python authenticate.py logout       # Clear tokens

Environment Variables:
    SPOTIFY_CLIENT_ID       - Your Spotify app client ID
    SPOTIFY_CLIENT_SECRET   - Your Spotify app client secret
"""

import os
import sys
import argparse
from spotify_auth import SpotifyAuth


def get_credentials():
    """
    Get Spotify credentials from environment variables.

    Returns:
        Tuple of (client_id, client_secret)

    Raises:
        SystemExit: If credentials are not set
    """
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    if not client_id or not client_secret:
        print("Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set", file=sys.stderr)
        print("", file=sys.stderr)
        print("Get credentials from: https://developer.spotify.com/dashboard", file=sys.stderr)
        print("", file=sys.stderr)
        print("Set them with:", file=sys.stderr)
        print("  export SPOTIFY_CLIENT_ID='your_client_id'", file=sys.stderr)
        print("  export SPOTIFY_CLIENT_SECRET='your_client_secret'", file=sys.stderr)
        sys.exit(1)

    return client_id, client_secret


def cmd_authenticate(auth: SpotifyAuth):
    """Run the OAuth authentication flow."""
    if auth.has_valid_tokens():
        print("Already authenticated with valid tokens.", file=sys.stderr)
        print(f"Token file: {auth.token_path}", file=sys.stderr)
        print("", file=sys.stderr)
        print("To re-authenticate, first run: python authenticate.py logout", file=sys.stderr)
        return

    try:
        auth.authenticate()
        print("Authentication complete!", file=sys.stderr)
        print(f"Tokens saved to: {auth.token_path}", file=sys.stderr)
    except Exception as e:
        print(f"Authentication failed: {e}", file=sys.stderr)
        sys.exit(1)


def cmd_status(auth: SpotifyAuth):
    """Check authentication status."""
    if not auth.token_data:
        print("Not authenticated", file=sys.stderr)
        print("", file=sys.stderr)
        print("Run: python authenticate.py", file=sys.stderr)
        sys.exit(1)

    if auth.has_valid_tokens():
        print(f"✓ Authenticated", file=sys.stderr)
        print(f"  Token file: {auth.token_path}", file=sys.stderr)
        print(f"  Scopes: {auth.token_data.get('scope', 'N/A')}", file=sys.stderr)

        # Calculate expiry
        import time
        expires_at_ms = auth.token_data['expires_at']
        now_ms = int(time.time() * 1000)
        remaining_seconds = (expires_at_ms - now_ms) // 1000

        if remaining_seconds > 0:
            if remaining_seconds > 3600:
                time_str = f"{remaining_seconds // 3600}h {(remaining_seconds % 3600) // 60}m"
            elif remaining_seconds > 60:
                time_str = f"{remaining_seconds // 60}m"
            else:
                time_str = f"{remaining_seconds}s"
            print(f"  Expires in: {time_str}", file=sys.stderr)
        else:
            print(f"  Status: Expired (will auto-refresh on next use)", file=sys.stderr)
    else:
        print("✗ Tokens expired", file=sys.stderr)
        print("", file=sys.stderr)
        print("Run: python authenticate.py refresh", file=sys.stderr)
        sys.exit(1)


def cmd_refresh(auth: SpotifyAuth):
    """Manually refresh the access token."""
    if not auth.token_data:
        print("Not authenticated", file=sys.stderr)
        print("", file=sys.stderr)
        print("Run: python authenticate.py", file=sys.stderr)
        sys.exit(1)

    try:
        auth._refresh_token()
        print("✓ Token refreshed successfully", file=sys.stderr)
    except Exception as e:
        print(f"✗ Token refresh failed: {e}", file=sys.stderr)
        print("", file=sys.stderr)
        print("You may need to re-authenticate:", file=sys.stderr)
        print("  python authenticate.py logout", file=sys.stderr)
        print("  python authenticate.py", file=sys.stderr)
        sys.exit(1)


def cmd_logout(auth: SpotifyAuth):
    """Clear stored tokens."""
    if not auth.token_data:
        print("Not authenticated (no tokens to clear)", file=sys.stderr)
        return

    auth.clear_tokens()
    print("✓ Logged out successfully", file=sys.stderr)
    print("", file=sys.stderr)
    print("To authenticate again, run: python authenticate.py", file=sys.stderr)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Manage Spotify API authentication',
        epilog='Environment variables SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set.'
    )

    parser.add_argument(
        'command',
        nargs='?',
        default='authenticate',
        choices=['authenticate', 'status', 'refresh', 'logout'],
        help='Command to execute (default: authenticate)'
    )

    args = parser.parse_args()

    # Get credentials
    client_id, client_secret = get_credentials()

    # Initialize auth
    auth = SpotifyAuth(client_id, client_secret)

    # Execute command
    if args.command == 'authenticate':
        cmd_authenticate(auth)
    elif args.command == 'status':
        cmd_status(auth)
    elif args.command == 'refresh':
        cmd_refresh(auth)
    elif args.command == 'logout':
        cmd_logout(auth)


if __name__ == '__main__':
    main()
