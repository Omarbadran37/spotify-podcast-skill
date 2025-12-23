# Spotify Skill - Python Implementation

Python scripts for accessing Spotify podcast data directly through the Spotify Web API.

## Prerequisites

- Python 3.7 or higher
- Spotify Developer Application credentials

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

For isolated environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an application
3. Copy your Client ID and Client Secret
4. Set redirect URI to: `http://127.0.0.1:8888/callback`

### 3. Set Environment Variables

```bash
export SPOTIFY_CLIENT_ID='your_client_id_here'
export SPOTIFY_CLIENT_SECRET='your_client_secret_here'
```

Add these to your `~/.bashrc` or `~/.zshrc` to persist them.

### 4. Authenticate

```bash
python authenticate.py
```

This will:
- Open your browser for Spotify login
- Save tokens to `~/.spotify-mcp-tokens.json`
- Enable all other scripts to work

## Available Scripts

### Authentication Management

```bash
# Authenticate (run OAuth flow)
python authenticate.py

# Check authentication status
python authenticate.py status

# Manually refresh token
python authenticate.py refresh

# Logout (clear tokens)
python authenticate.py logout
```

### Get Saved Episodes

Retrieve paginated list of your saved episodes:

```bash
# Get 20 episodes (default)
python get_saved_episodes.py

# Get specific number of episodes
python get_saved_episodes.py --limit 10

# Pagination
python get_saved_episodes.py --limit 50 --offset 50

# JSON output
python get_saved_episodes.py --limit 10 --json

# Specify market
python get_saved_episodes.py --limit 10 --market US
```

### Search Saved Episodes

Search your library by keyword:

```bash
# Search for episodes about AI
python search_saved_episodes.py --query "AI"

# Search with limit
python search_saved_episodes.py --query "productivity" --limit 10

# JSON output
python search_saved_episodes.py --query "technology" --json
```

### Get Episode Details

Get detailed metadata for a specific episode:

```bash
# By episode ID
python get_episode_details.py --episode-id 0Q86acNRm6V9GYx55SXKwf

# JSON output
python get_episode_details.py --episode-id 0Q86acNRm6V9GYx55SXKwf --json
```

### Get Show Details

Get detailed metadata for a podcast/show:

```bash
# By show ID
python get_show_details.py --show-id 4rOoJ6Egrf8K2IrywzwOMk

# JSON output
python get_show_details.py --show-id 4rOoJ6Egrf8K2IrywzwOMk --json
```

## Output Formats

All tools support two output formats:

### Markdown (default)
Human-readable format with formatting and descriptions. Perfect for reading directly.

### JSON (`--json` flag)
Structured data format for programmatic use. Includes all metadata fields.

## Token Management

- Tokens stored at: `~/.spotify-mcp-tokens.json`
- Compatible with Spotify MCP server
- Auto-refresh: Tokens refresh automatically when needed (60s buffer)
- Shared: Same tokens work for both MCP server and these scripts

## Error Handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `Not authenticated` | Run `python authenticate.py` |
| `Environment variables not set` | Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` |
| `Unauthorized` | Run `python authenticate.py refresh` |
| `Forbidden` | Re-authenticate with `python authenticate.py logout` then `python authenticate.py` |
| `Rate limited` | Wait before retrying |

## Examples

### Export all episodes to JSON

```bash
# Fetch multiple pages
python get_saved_episodes.py --limit 50 --offset 0 --json > episodes_1.json
python get_saved_episodes.py --limit 50 --offset 50 --json > episodes_2.json
python get_saved_episodes.py --limit 50 --offset 100 --json > episodes_3.json
```

### Search and format results

```bash
# Search for AI episodes and save markdown
python search_saved_episodes.py --query "AI" > ai_episodes.md
```

### Combine with other tools

```bash
# Get episode count
python get_saved_episodes.py --json | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])"

# Extract episode IDs
python get_saved_episodes.py --json | python3 -c "import sys, json; print('\\n'.join(ep['id'] for ep in json.load(sys.stdin)['episodes']))"
```

## Troubleshooting

### Port 8888 already in use
Change the port in `spotify_auth.py` line 17 and update your Spotify app redirect URI.

### Import errors
Ensure you're in the correct directory and dependencies are installed:
```bash
cd /path/to/scripts/python
pip install -r requirements.txt
```

### Token file permissions
If you get permission errors:
```bash
chmod 600 ~/.spotify-mcp-tokens.json
```

## Advanced Usage

### Custom token path
Modify the `SpotifyAuth` initialization in each script to use a custom path:
```python
auth = SpotifyAuth(client_id, client_secret, token_path="/custom/path/tokens.json")
```

### Integration with other scripts
Import the modules in your own Python scripts:
```python
from spotify_auth import SpotifyAuth
from spotify_client import SpotifyClient

auth = SpotifyAuth(client_id, client_secret)
client = SpotifyClient(auth)

episodes = client.get_saved_episodes(limit=50)
```

## API Reference

See `../../references/API_REFERENCE.md` for detailed Spotify API documentation.

## Authentication Details

See `../../references/AUTHENTICATION.md` for OAuth flow details and token management.
