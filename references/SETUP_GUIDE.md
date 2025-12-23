# Spotify Podcast Manager Setup Guide

## Overview

The Spotify Podcast Manager provides two ways to access your Spotify podcast library:

1. **Skill Scripts** (Recommended): Direct Python/Node.js scripts that call the Spotify API - no MCP runtime needed
2. **MCP Server**: Traditional MCP server for Claude Desktop integration

Both methods share the same authentication tokens and work seamlessly together.

---

# Setup Option 1: Skill Scripts (Recommended)

Use executable Python scripts to interact with your Spotify library directly. This is the simpler approach and doesn't require MCP server configuration.

## Prerequisites

- Python 3.7 or higher
- A Spotify account (free or premium)
- A Spotify Developer application

## Step 1: Create a Spotify Developer Application

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if needed)
3. Click **Create App**
4. Fill in the application details:
   - **App name**: `Spotify Podcast Manager` (or your preferred name)
   - **Description**: `Access my podcast library`
   - Check the boxes for agreeing to terms
5. Accept the Developer Agreement and click **Create**
6. Go to **Settings** and locate your:
   - **Client ID**
   - **Client Secret**

## Step 2: Set Redirect URI

1. In the Spotify Developer Dashboard, go to your app's **Settings**
2. Scroll to **Redirect URIs**
3. Add: `http://127.0.0.1:8888/callback`
4. Click **Save**

**Why this matters**: When you authenticate, Spotify redirects your browser back to this local address with an authorization code.

## Step 3: Install Python Dependencies

```bash
# Navigate to the Python scripts directory
cd /path/to/spotify-podcast-skill/scripts/python

# Install dependencies
pip install -r requirements.txt
```

## Step 4: Set Environment Variables

Set your Spotify credentials as environment variables:

```bash
export SPOTIFY_CLIENT_ID='your_client_id_here'
export SPOTIFY_CLIENT_SECRET='your_client_secret_here'
```

**For persistent setup**, add these to your shell RC file:

```bash
# For bash users
echo "export SPOTIFY_CLIENT_ID='your_id'" >> ~/.bashrc
echo "export SPOTIFY_CLIENT_SECRET='your_secret'" >> ~/.bashrc
source ~/.bashrc

# For zsh users
echo "export SPOTIFY_CLIENT_ID='your_id'" >> ~/.zshrc
echo "export SPOTIFY_CLIENT_SECRET='your_secret'" >> ~/.zshrc
source ~/.zshrc
```

## Step 5: Authenticate with Spotify (Browser Opens Automatically)

Run the authentication script:

```bash
python authenticate.py
```

**What happens**:
1. 🌐 **Browser automatically opens** to the Spotify login page
2. 👤 You log into your Spotify account
3. ✅ You authorize the application (click "Agree" or "Accept")
4. 🔄 Browser redirects back to localhost (you'll see a success page)
5. 💾 Tokens are saved to `~/.spotify-mcp-tokens.json`
6. ✨ Authentication complete! Tokens auto-refresh from now on

**If browser doesn't open**: The authorization URL is also printed in the terminal - copy and paste it into your browser manually.

## Step 6: Verify Authentication

Check your authentication status:

```bash
python authenticate.py status
```

You should see:
```
✓ Authenticated
  Token file: /Users/you/.spotify-mcp-tokens.json
  Scopes: user-library-read user-read-email user-read-private
  Expires in: 59m
```

## Step 7: Start Using the Scripts

You're ready! Try these commands:

```bash
# Get your last 10 episodes
python get_saved_episodes.py --limit 10

# Search for specific topics
python search_saved_episodes.py --query "AI"

# Get episode details
python get_episode_details.py --episode-id <episode_id>

# Get JSON output for programmatic use
python get_saved_episodes.py --limit 20 --json
```

## Token Compatibility

If you already have the MCP server set up with tokens at `~/.spotify-mcp-tokens.json`:
- The skill scripts will use your existing tokens automatically
- Just set the environment variables and you're ready to go
- No need to re-authenticate

---

# Setup Option 2: MCP Server

For traditional MCP server setup with Claude Desktop integration.

## Prerequisites

- Node.js 18 or higher
- A Spotify account (free or premium)
- A Spotify Developer application

## Step 1: Create a Spotify Developer Application

1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account (create one if needed)
3. Click **Create App**
4. Fill in the application details:
   - **App name**: `Spotify MCP Server` (or your preferred name)
   - **Description**: `MCP server for episode management`
   - Check the boxes for agreeing to terms
5. Accept the Developer Agreement and click **Create**
6. Go to **Settings** and locate your:
   - **Client ID**
   - **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Important**: Keep your Client Secret private. Never commit `.env` to version control.

## Step 3: Set Redirect URI

1. In the Spotify Developer Dashboard, go to your app's **Settings**
2. Scroll to **Redirect URIs**
3. Add: `http://127.0.0.1:8888/callback`
4. Click **Save**

## Step 4: Install and Build

```bash
# Navigate to the server directory
cd /path/to/spotify-mcp-server

# Install dependencies
npm install

# Build the TypeScript
npm run build

# If you encounter memory errors during build:
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## Step 5: Authenticate with Spotify

Run the authentication command:

```bash
npm run auth
```

This will:
1. Start a local callback server on port 8888
2. Display an authorization URL
3. Open your browser (or prompt you to open it manually)
4. Ask you to log in and authorize the application
5. Save your access tokens to `~/.spotify-mcp-tokens.json`

**Tokens refresh automatically**, so you only need to do this once.

## Step 6: Verify Authentication

Check authentication status:

```bash
npm run auth status
```

## Step 7: Configure Claude Desktop Integration

Add the MCP server to your Claude Desktop configuration at `~/.config/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "spotify": {
      "command": "node",
      "args": ["/absolute/path/to/spotify-mcp-server/dist/index.js"],
      "env": {
        "SPOTIFY_CLIENT_ID": "your_client_id",
        "SPOTIFY_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

Replace `/absolute/path/to/spotify-mcp-server` with the actual path to your server installation.

## Step 8: Restart Claude Desktop

Restart Claude Desktop for the MCP server to be recognized. Once running, you can ask Claude for Spotify-related tasks.

## Troubleshooting

### "No valid tokens found"
Run `npm run auth` to authenticate.

### "Port 8888 already in use"
Change the port in `src/auth-cli.ts` and update the redirect URI in the Spotify Dashboard to match.

### "Unauthorized" Error
Your token may have expired. Run:
```bash
npm run auth refresh
```

### "Forbidden" Error
Re-authenticate with proper scopes:
```bash
npm run auth logout
npm run auth
```

### Build Memory Error
Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

## Token Storage

Tokens are stored locally at `~/.spotify-mcp-tokens.json`. They contain:
- Access token (for API requests)
- Refresh token (for auto-renewal)
- Expiration time
- Token type and scopes

Tokens are **never** transmitted to external servers (except Spotify's API).
