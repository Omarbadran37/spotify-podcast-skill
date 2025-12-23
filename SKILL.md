---
name: spotify-podcast-manager
description: Access Spotify podcast data through direct API calls using Python scripts. Search episodes, retrieve metadata, and analyze listening habits by invoking executable scripts.
---

# Spotify Podcast Manager

Access Spotify podcast data directly through Python scripts that call the Spotify Web API. No MCP server runtime required - just Python scripts that can be invoked via bash.

## When to Use This Skill

Use this skill when users request:

- **Episode Search**: "Search my episodes for AI topics" or "Find episodes about productivity"
- **Library Browsing**: "Show me my last 20 episodes" or "List my saved podcasts"
- **Episode Details**: "Get details about episode [ID]" or "What's this episode about?"
- **Show Information**: "Tell me about this podcast" or "Get show details for [ID]"
- **Setup Help**: "Help me set up Spotify access" or "How do I authenticate?"

## Available Tools (Python Scripts)

All scripts located in `scripts/python/`:

### 1. Authentication Management (`authenticate.py`)
```bash
python authenticate.py              # Run OAuth flow
python authenticate.py status       # Check auth status
python authenticate.py refresh      # Refresh tokens
python authenticate.py logout       # Clear tokens
```

### 2. Get Saved Episodes (`get_saved_episodes.py`)
```bash
python get_saved_episodes.py --limit 10
python get_saved_episodes.py --limit 50 --offset 50
python get_saved_episodes.py --limit 20 --json
```

### 3. Search Episodes (`search_saved_episodes.py`)
```bash
python search_saved_episodes.py --query "AI"
python search_saved_episodes.py --query "productivity" --limit 10
python search_saved_episodes.py --query "tech" --json
```

### 4. Episode Details (`get_episode_details.py`)
```bash
python get_episode_details.py --episode-id <ID>
python get_episode_details.py --episode-id <ID> --json
```

### 5. Show Details (`get_show_details.py`)
```bash
python get_show_details.py --show-id <ID>
python get_show_details.py --show-id <ID> --json
```

## Setup Workflow

### For New Users

**Step 1: Check Prerequisites**
```bash
python3 --version  # Should be 3.7+
```

**Step 2: Install Dependencies**
```bash
cd /path/to/spotify-podcast-skill/scripts/python
pip install -r requirements.txt
```

**Step 3: Get Spotify Credentials**
Guide user to:
1. Visit https://developer.spotify.com/dashboard
2. Create an app
3. Copy Client ID and Client Secret
4. Set redirect URI: `http://127.0.0.1:8888/callback`

**Step 4: Set Environment Variables**
```bash
export SPOTIFY_CLIENT_ID='...'
export SPOTIFY_CLIENT_SECRET='...'
```

**Step 5: Authenticate (Browser Opens Automatically)**
```bash
python authenticate.py
```
**What happens**:
1. 🌐 Browser automatically opens to Spotify login page
2. 👤 User logs into their Spotify account
3. ✅ User authorizes the application
4. 🔄 Browser redirects back (callback to localhost:8888)
5. 💾 Tokens saved to `~/.spotify-mcp-tokens.json`
6. ✨ Authentication complete! Tokens auto-refresh from now on

### For Existing MCP Server Users

If user already has MCP server configured:
1. Check if `~/.spotify-mcp-tokens.json` exists
2. Set environment variables with credentials
3. Scripts work immediately (shared tokens)

## Execution Patterns

### Pattern 1: Simple Query
User: "Show me my last 10 episodes"

```bash
cd /Users/omarbadran/Desktop/spotify-podcast-skill/scripts/python
python get_saved_episodes.py --limit 10
```

Parse markdown output and present to user.

### Pattern 2: Search Library
User: "Find episodes about machine learning"

```bash
cd /Users/omarbadran/Desktop/spotify-podcast-skill/scripts/python
python search_saved_episodes.py --query "machine learning"
```

Parse markdown output and present results.

### Pattern 3: Paginated Fetch
User: "Get all my episodes"

```bash
cd /Users/omarbadran/Desktop/spotify-podcast-skill/scripts/python

# Loop with pagination
python get_saved_episodes.py --limit 50 --offset 0 --json > page1.json
python get_saved_episodes.py --limit 50 --offset 50 --json > page2.json
python get_saved_episodes.py --limit 50 --offset 100 --json > page3.json
```

Combine results and analyze.

### Pattern 4: Multi-Step Analysis
User: "Which podcast do I listen to most?"

1. Fetch all episodes with pagination (JSON format)
2. Parse show names from JSON
3. Count frequency by show
4. Present top 5 in markdown table

```bash
# Fetch episodes as JSON
python get_saved_episodes.py --limit 50 --json > episodes.json

# Parse and analyze (use Python or jq)
python3 -c "
import json, sys
from collections import Counter
data = json.load(open('episodes.json'))
shows = [ep['show_name'] for ep in data['episodes']]
for show, count in Counter(shows).most_common(5):
    print(f'{show}: {count} episodes')
"
```

## Script Interface

All scripts follow this interface:

**Input**:
- Command-line arguments (parsed with argparse)
- Environment variables: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`

**Output**:
- **stdout**: Results (markdown or JSON)
- **stderr**: Errors and status messages
- **Exit code**: 0 (success) or 1 (error)

**Output Formats**:
- **Markdown** (default): Human-readable, formatted
- **JSON** (`--json` flag): Structured data, programmatic use

## Error Handling

### Common Errors

| Error Message | Solution |
|---------------|----------|
| "Not authenticated" | Run `python authenticate.py` |
| "Environment variables not set" | Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` |
| "Unauthorized" | Token expired, run `python authenticate.py refresh` |
| "Forbidden" | Missing scopes, run `python authenticate.py logout` then `python authenticate.py` |
| "Rate limited" | Wait before retrying |

### Error Detection
```bash
if python get_saved_episodes.py --limit 10; then
  echo "Success"
else
  echo "Failed - check stderr for details"
fi
```

## Environment Variables

**Required for all scripts**:
```bash
export SPOTIFY_CLIENT_ID='your_client_id'
export SPOTIFY_CLIENT_SECRET='your_client_secret'
```

**Optional**: Add to `~/.bashrc` or `~/.zshrc` to persist

## Token Management

- **Storage**: `~/.spotify-mcp-tokens.json`
- **Format**: JSON with access_token, refresh_token, expires_at
- **Auto-refresh**: Scripts automatically refresh when within 60s of expiry
- **Compatibility**: Shared with Spotify MCP server (if user has both)

## Response Processing

### Markdown Output (default)
Parse and present directly to user. Clean, formatted, readable.

Example:
```
# Your Saved Episodes

1. **Episode Title**
   Show: Show Name
   Released: January 15, 2024
   Duration: 45:32
```

### JSON Output (`--json`)
Parse programmatically for analysis, filtering, or transformation.

Example:
```json
{
  "total": 150,
  "count": 20,
  "episodes": [
    {
      "id": "...",
      "name": "Episode Title",
      "show_name": "Show Name",
      "duration_ms": 2732000
    }
  ]
}
```

## Implementation Notes

### Script Invocation
Always:
1. Use absolute paths or cd to script directory
2. Activate virtual env if user has one
3. Check exit code for errors
4. Parse stderr for error messages
5. Parse stdout for results

### Credential Management
- Never hardcode credentials
- Always use environment variables
- Guide users to secure storage
- Remind about .gitignore for .env files

### Authentication Flow
First-time setup requires:
1. Spotify Developer app (2 min)
2. Set environment variables (30 sec)
3. Run `authenticate.py` (1 min - opens browser)

Total: ~3-4 minutes for complete setup

### Token Sharing
If user mentions they use MCP server:
- Tokens at `~/.spotify-mcp-tokens.json` work for both
- Just need to set environment variables
- No need to re-authenticate

## Advanced Workflows

### Export All Episodes to CSV
```bash
# Fetch all as JSON
python get_saved_episodes.py --limit 50 --offset 0 --json > all.json

# Convert to CSV
python3 -c "
import json, csv, sys
data = json.load(open('all.json'))
with open('episodes.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'show_name', 'release_date', 'duration_ms'])
    writer.writeheader()
    for ep in data['episodes']:
        writer.writerow({k: ep[k] for k in writer.fieldnames})
"
```

### Find Episodes by Multiple Keywords
```bash
# Search for multiple terms
for term in "AI" "machine learning" "data science"; do
  echo "=== $term ==="
  python search_saved_episodes.py --query "$term" --limit 5
done
```

### Get Episode IDs for Further Processing
```bash
# Extract IDs
python get_saved_episodes.py --json | \
  python3 -c "import json, sys; print('\\n'.join(ep['id'] for ep in json.load(sys.stdin)['episodes']))"
```

## References

- **Python Guide**: `references/PYTHON_GUIDE.md` - Detailed Python implementation docs
- **API Reference**: `references/API_REFERENCE.md` - Spotify API endpoints
- **Authentication**: `references/AUTHENTICATION.md` - OAuth flow details
- **Setup Guide**: `references/SETUP_GUIDE.md` - Step-by-step setup
- **Workflows**: `references/WORKFLOWS.md` - Common task patterns

## Quick Reference

```bash
# Setup (one-time)
pip install -r requirements.txt
export SPOTIFY_CLIENT_ID='...'
export SPOTIFY_CLIENT_SECRET='...'
python authenticate.py

# Check status
python authenticate.py status

# Get episodes
python get_saved_episodes.py --limit 20

# Search
python search_saved_episodes.py --query "topic"

# Episode details
python get_episode_details.py --episode-id <ID>

# Show details
python get_show_details.py --show-id <ID>

# JSON output
python get_saved_episodes.py --limit 10 --json
```
