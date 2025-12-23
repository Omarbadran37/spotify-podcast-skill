# Spotify Podcast Skill

A collection of Python scripts to interact with the Spotify API for managing and retrieving podcast data. This project allows you to authenticate with Spotify, search your saved episodes, retrieve episode and show details, and more, directly from the command line.

## Features

- **Authentication Management**: Secure OAuth flow to authenticate with Spotify.
- **Get Saved Episodes**: Retrieve your saved podcast episodes with pagination support.
- **Search Episodes**: Search through your saved episodes by query.
- **Episode Details**: Get detailed information about specific episodes.
- **Show Details**: Get information about specific podcast shows.
- **Flexible Output**: Supports both human-readable Markdown and machine-parsable JSON output.

## Prerequisites

- **Python 3.7+**
- A **Spotify Developer Account** and a registered App to get `Client ID` and `Client Secret`.

## Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/Omarbadran37/spotify-podcast-skill.git
    cd spotify-podcast-skill
    ```

2.  Install the required Python dependencies:
    ```bash
    cd scripts/python
    pip install -r requirements.txt
    ```

## Configuration

1.  **Create a Spotify App**:
    - Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
    - Click "Create App".
    - Set the **Redirect URI** to `http://127.0.0.1:8888/callback`.
    - Note down your **Client ID** and **Client Secret**.

2.  **Set Environment Variables**:
    You need to set the following environment variables. You can do this in your terminal session or add them to your shell configuration file (e.g., `.bashrc`, `.zshrc`).

    ```bash
    export SPOTIFY_CLIENT_ID='your_client_id_here'
    export SPOTIFY_CLIENT_SECRET='your_client_secret_here'
    ```

## Usage

All scripts are located in the `scripts/python/` directory.

### 1. Authentication

First, you need to authenticate. This will open your web browser to log in to Spotify.

```bash
python authenticate.py
```

Check authentication status:
```bash
python authenticate.py status
```

### 2. Get Saved Episodes

Fetch your most recent saved episodes:

```bash
python get_saved_episodes.py --limit 10
```

Get episodes in JSON format:
```bash
python get_saved_episodes.py --limit 10 --json
```

### 3. Search Saved Episodes

Search for episodes containing specific keywords:

```bash
python search_saved_episodes.py --query "technology"
```

### 4. Get Episode Details

Get details for a specific episode using its Spotify ID:

```bash
python get_episode_details.py --episode-id <EPISODE_ID>
```

### 5. Get Show Details

Get details for a specific show (podcast) using its Spotify ID:

```bash
python get_show_details.py --show-id <SHOW_ID>
```

## Project Structure

```
spotify-podcast-skill/
├── assets/                 # Configuration templates
├── references/             # Documentation and guides
├── scripts/
│   ├── python/             # Python scripts (Core functionality)
│   └── server-src/         # TypeScript source (Server implementation)
├── SKILL.md                # Detailed skill documentation
└── README.md               # Project overview
```

## Documentation

For more detailed information, check the `references/` directory:
- [Quick Start](references/QUICK_START.md)
- [Setup Guide](references/SETUP_GUIDE.md)
- [API Reference](references/API_REFERENCE.md)
- [Authentication](references/AUTHENTICATION.md)
- [Workflows](references/WORKFLOWS.md)
