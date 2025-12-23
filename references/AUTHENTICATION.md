# Spotify Authentication Guide

Complete guide to OAuth 2.0 authentication for the Spotify Podcast Manager skill.

## Overview

The skill uses **OAuth 2.0 Authorization Code flow** with automatic token refresh. This is the most secure and recommended authentication method for Spotify API access.

## Authentication Flow

### 1. Initial Setup (One-Time)

User must have:
- Spotify Developer Application (from https://developer.spotify.com/dashboard)
- Client ID and Client Secret
- Redirect URI set to: `http://127.0.0.1:8888/callback`

### 2. Browser-Based OAuth Flow

When user runs `python authenticate.py`:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Generate Authorization URL                          │
│ - Creates state token (CSRF protection)                     │
│ - Builds URL with client_id, redirect_uri, scopes, state    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Browser Opens Automatically                         │
│ - webbrowser.open(auth_url)                                 │
│ - User sees Spotify login page                              │
│ - URL also printed as fallback                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: User Authorizes                                     │
│ - User logs into Spotify account                            │
│ - Sees permission request (scopes)                          │
│ - Clicks "Agree" or "Accept"                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Spotify Redirects Back                              │
│ - Redirects to: http://127.0.0.1:8888/callback              │
│ - Includes: ?code=AUTH_CODE&state=STATE_TOKEN               │
│ - Local server (port 8888) receives callback                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Validate & Exchange                                 │
│ - Validates state token (CSRF protection)                   │
│ - Exchanges auth code for tokens                            │
│ - POST to https://accounts.spotify.com/api/token            │
│ - Uses Basic Auth (client_id:client_secret)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Save Tokens                                         │
│ - Saves to ~/.spotify-mcp-tokens.json                       │
│ - Format: {access_token, refresh_token, expires_at, ...}    │
│ - Tokens now valid for ~1 hour                              │
└─────────────────────────────────────────────────────────────┘
```

## Token Structure

Tokens are stored at `~/.spotify-mcp-tokens.json`:

```json
{
  "access_token": "BQC...(long string)",
  "refresh_token": "AQD...(long string)",
  "expires_at": 1735012345678,
  "token_type": "Bearer",
  "scope": "user-library-read user-read-private user-read-email"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | Used for API requests (valid ~1 hour) |
| `refresh_token` | string | Used to get new access tokens |
| `expires_at` | number | Unix timestamp in milliseconds |
| `token_type` | string | Always "Bearer" |
| `scope` | string | Space-separated list of permissions |

### Important Notes

- **expires_at is in milliseconds** (JavaScript compatible)
- Python: `int(time.time() * 1000)`
- Compatible with Spotify MCP server format
- File permissions: Should be readable only by user

## Automatic Token Refresh

Scripts automatically refresh tokens **without user interaction**.

### Refresh Trigger

Tokens refresh when:
```python
current_time_ms + 60000 >= expires_at
```

That is: **60 seconds before expiration**

### Refresh Process

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Script detects token expiring soon                       │
│    (within 60 second buffer)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. POST to token endpoint                                   │
│    - URL: https://accounts.spotify.com/api/token            │
│    - grant_type: refresh_token                              │
│    - refresh_token: <refresh_token>                         │
│    - Basic Auth: client_id:client_secret                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Receive new tokens                                       │
│    - New access_token (valid for ~1 hour)                   │
│    - May include new refresh_token (reuse old if not)       │
│    - New expires_at timestamp                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Update token file                                        │
│    - Save to ~/.spotify-mcp-tokens.json                     │
│    - Message: "Token refreshed successfully" (stderr)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Continue with API request                                │
│    - Script proceeds seamlessly                             │
│    - User never interrupted                                 │
└─────────────────────────────────────────────────────────────┘
```

### When Refresh Fails

If refresh fails (invalid refresh token, revoked access):
- Script exits with error
- User must re-authenticate: `python authenticate.py`

## Scopes (Permissions)

Currently requested scopes:

| Scope | Purpose |
|-------|---------|
| `user-library-read` | Read user's saved episodes/shows |
| `user-read-private` | Read user profile info |
| `user-read-email` | Read user email address |

### Viewing Current Scopes

```bash
python authenticate.py status
```

Shows:
```
✓ Authenticated
  Token file: /Users/user/.spotify-mcp-tokens.json
  Scopes: user-library-read user-read-email user-read-private
  Expires in: 45m
```

## Security Best Practices

### 1. Protect Client Secret

**Never commit or share**:
- Client Secret
- Access tokens
- Refresh tokens

**Use environment variables**:
```bash
export SPOTIFY_CLIENT_ID='...'
export SPOTIFY_CLIENT_SECRET='...'
```

**Add to .gitignore**:
```
.env
.spotify-mcp-tokens.json
```

### 2. CSRF Protection

The OAuth flow includes CSRF protection:
- Random `state` parameter generated (16 bytes, hex)
- Sent in authorization URL
- Validated on callback
- Prevents cross-site request forgery attacks

### 3. Token Storage

Tokens stored locally:
- Path: `~/.spotify-mcp-tokens.json`
- Permissions: User-readable only
- Not transmitted except to Spotify API
- Shared with MCP server (if installed)

### 4. Redirect URI

**Must be exact match**:
- Spotify Dashboard: `http://127.0.0.1:8888/callback`
- Script: `http://127.0.0.1:8888/callback`
- Case-sensitive, no trailing slash

### 5. Port 8888

**Local callback server**:
- Runs on `127.0.0.1:8888` (localhost only)
- Not accessible from network
- Shuts down after receiving callback
- If port busy, change in both script and Spotify Dashboard

## Troubleshooting

### "No valid tokens found"

**Cause**: Never authenticated or tokens deleted
**Solution**: `python authenticate.py`

### "Tokens expired"

**Cause**: Auto-refresh failed (rare)
**Solution**: `python authenticate.py refresh`

### "Unauthorized" Error

**Cause**: Invalid access token
**Solution**:
```bash
python authenticate.py refresh
# or
python authenticate.py logout && python authenticate.py
```

### "Forbidden" Error

**Cause**: Missing required scopes
**Solution**:
```bash
python authenticate.py logout
python authenticate.py  # Re-authorize with correct scopes
```

### "Port 8888 already in use"

**Cause**: Another process using port 8888
**Solution**:
1. Find process: `lsof -i :8888`
2. Kill it: `kill -9 <PID>`
3. Or change port in `spotify_auth.py` line 17
4. Update redirect URI in Spotify Dashboard

### "Redirect URI mismatch"

**Cause**: Dashboard URI doesn't match script
**Solution**: In Spotify Dashboard, set exactly:
```
http://127.0.0.1:8888/callback
```

### Browser doesn't open

**Cause**: `webbrowser` module issue
**Solution**: URL is printed - copy/paste manually into browser

## Token Lifecycle

### New User Flow

```
Day 1, Hour 0:  python authenticate.py (browser opens)
Day 1, Hour 0:  Tokens saved (valid for 1 hour)
Day 1, Hour 1:  Script auto-refreshes (valid for 1 hour)
Day 1, Hour 2:  Script auto-refreshes (valid for 1 hour)
...continues indefinitely...
```

### Existing MCP User Flow

```
Has tokens: ~/.spotify-mcp-tokens.json (from MCP server)
Set env vars: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
Run script:  python get_saved_episodes.py
Auto-refresh: If needed, tokens refreshed seamlessly
Works!
```

## Multi-User Considerations

**Single token file per machine**:
- Path: `~/.spotify-mcp-tokens.json`
- One user per machine/account
- Each user needs their own credentials

**For multiple users**:
- Use different user accounts (OS level)
- Or modify `token_path` in scripts
- Or use containers/VMs

## Compatibility

### MCP Server

**Token format 100% compatible**:
- Same file: `~/.spotify-mcp-tokens.json`
- Same structure: JSON with ms timestamps
- Shared tokens work for both

### Node.js Scripts

**If Node.js implementation added**:
- Same token file
- Same format
- Same auto-refresh logic
- Seamless interoperability

## Advanced: Manual Token Management

### Check expiration manually

```python
import json, time
from pathlib import Path

token_path = Path.home() / '.spotify-mcp-tokens.json'
with open(token_path) as f:
    data = json.load(f)

now_ms = int(time.time() * 1000)
expires_at = data['expires_at']
remaining_ms = expires_at - now_ms
remaining_min = remaining_ms // 60000

print(f"Expires in: {remaining_min} minutes")
```

### Force refresh

```bash
python authenticate.py refresh
```

### Clear tokens (logout)

```bash
python authenticate.py logout
```

## References

- [Spotify Authorization Guide](https://developer.spotify.com/documentation/web-api/concepts/authorization)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
