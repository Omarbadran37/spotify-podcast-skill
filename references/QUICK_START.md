# Quick Start: Spotify Podcast Manager

Two ways to access your Spotify library - pick the one that fits your needs:

1. **Skill Scripts** (2 minutes) - Simple Python scripts, no MCP runtime needed
2. **MCP Server** (5 minutes) - Full Claude Desktop integration

---

# Option 1: Skill Scripts Quick Start (2 Minutes)

The simplest way to get started. Just Python scripts that call the Spotify API directly.

## Prerequisites

- Python 3.7+
- A Spotify account
- 2 minutes of your time

## 2-Minute Setup

### 1. Get Spotify Credentials (1 min)

1. Go to https://developer.spotify.com/dashboard
2. Create an app (name it anything, e.g., "Spotify Podcast Manager")
3. Copy your **Client ID** and **Client Secret**
4. Add redirect URI: `http://127.0.0.1:8888/callback`

### 2. Install & Authenticate (1 min)

```bash
# Navigate to the Python scripts directory
cd /path/to/spotify-podcast-skill/scripts/python

# Install dependencies
pip install -r requirements.txt

# Set credentials
export SPOTIFY_CLIENT_ID='your_id_here'
export SPOTIFY_CLIENT_SECRET='your_secret_here'

# Authenticate (browser opens automatically)
python authenticate.py
```

**That's it!** A browser will pop up asking you to log in and authorize. Once you approve, you're done.

### 3. Try It Out

```bash
# Get your last 10 episodes
python get_saved_episodes.py --limit 10

# Search for topics
python search_saved_episodes.py --query "AI"

# Get JSON output
python get_saved_episodes.py --limit 20 --json
```

## What You Get

- Browser-based authentication (fully automatic)
- Token auto-refresh (works forever after first login)
- Markdown output (human-readable)
- JSON output (for programmatic use with `--json`)
- Search, episode details, show details, and more

---

# Option 2: MCP Server Quick Start (5 Minutes)

Full MCP server integration for Claude Desktop.

## Prerequisites

- Node.js 18+
- A Spotify account
- Spotify Developer credentials (see Setup Step 1)

## 5-Minute Setup

### 1. Get Spotify Credentials (2 min)

1. Go to https://developer.spotify.com/dashboard
2. Create an app (name it anything, e.g., "Spotify MCP")
3. Copy your **Client ID** and **Client Secret**
4. Add redirect URI: `http://127.0.0.1:8888/callback`

### 2. Clone & Configure (1 min)

```bash
# Clone the server
git clone https://github.com/Omarbadran37/spotify-mcp-server.git
cd spotify-mcp-server

# Create .env file
echo "SPOTIFY_CLIENT_ID=your_id_here" > .env
echo "SPOTIFY_CLIENT_SECRET=your_secret_here" >> .env
```

### 3. Build & Authenticate (2 min)

```bash
# Install and build
npm install
npm run build

# Authenticate with Spotify
npm run auth
```

This opens a browser - just log in and approve. Done!

### 4. Add to Claude Desktop

Edit `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/path/to/spotify-mcp-server/dist/index.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_id",
        "SPOTIFY_CLIENT_SECRET": "your_secret"
      }
    }
  }
}
```

Restart Claude Desktop. Done!

## Try It Out

Ask Claude:
- "Show me my saved podcast episodes"
- "Search my episodes for AI and machine learning"
- "Get details about episode [episode_id]"

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "No valid tokens" | Run `npm run auth` |
| Port 8888 busy | Change port in `src/auth-cli.ts` |
| Token expired | Run `npm run auth refresh` |
| Build fails | Run with `NODE_OPTIONS="--max-old-space-size=8192" npm run build` |

For more details, see `SETUP_GUIDE.md`.
