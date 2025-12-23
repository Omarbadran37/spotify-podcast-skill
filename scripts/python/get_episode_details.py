#!/usr/bin/env python3
"""
Get Episode Details

Retrieve detailed metadata for a specific Spotify episode.

Usage:
    python get_episode_details.py --episode-id <ID> [--market CODE] [--json]

Examples:
    python get_episode_details.py --episode-id 0Q86acNRm6V9GYx55SXKwf
    python get_episode_details.py --episode-id 0Q86acNRm6V9GYx55SXKwf --json

Environment Variables:
    SPOTIFY_CLIENT_ID       - Your Spotify app client ID
    SPOTIFY_CLIENT_SECRET   - Your Spotify app client secret
"""

import os
import sys
import json
import argparse
from datetime import datetime
from spotify_auth import SpotifyAuth
from spotify_client import SpotifyClient


def get_credentials():
    """Get Spotify credentials from environment variables."""
    client_id = os.getenv('SPOTIFY_CLIENT_ID')
    client_secret = os.getenv('SPOTIFY_CLIENT_SECRET')

    if not client_id or not client_secret:
        print("Error: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set", file=sys.stderr)
        sys.exit(1)

    return client_id, client_secret


def format_date(date_str: str) -> str:
    """Format ISO date string to readable format."""
    try:
        if 'T' in date_str:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            dt = datetime.fromisoformat(date_str)
        return dt.strftime('%B %d, %Y')
    except:
        return date_str


def format_duration(ms: int) -> str:
    """Format duration from milliseconds."""
    minutes = ms // 60000
    seconds = (ms % 60000) // 1000
    if minutes >= 60:
        hours = minutes // 60
        minutes = minutes % 60
        return f"{hours}h {minutes}m {seconds}s"
    return f"{minutes}m {seconds}s"


def format_markdown(episode: dict) -> str:
    """Format episode details as markdown."""
    lines = [f"# {episode['name']}\n"]

    lines.append(f"**Show**: {episode['show']['name']}")
    lines.append(f"**Publisher**: {episode['show']['publisher']}")
    lines.append(f"**Released**: {format_date(episode['release_date'])}")
    lines.append(f"**Duration**: {format_duration(episode['duration_ms'])}")
    lines.append(f"**Language**: {episode.get('language', 'N/A')}")
    lines.append(f"**Explicit**: {'Yes' if episode.get('explicit') else 'No'}")
    lines.append(f"**Type**: {episode.get('type', 'episode')}")
    lines.append("")

    # Description
    if episode.get('description'):
        lines.append("## Description\n")
        lines.append(episode['description'])
        lines.append("")

    # Links
    lines.append("## Links\n")
    if episode.get('external_urls', {}).get('spotify'):
        lines.append(f"Spotify: {episode['external_urls']['spotify']}")
    lines.append(f"URI: {episode['uri']}")
    lines.append(f"ID: {episode['id']}")

    return "\n".join(lines)


def format_json_output(episode: dict) -> dict:
    """Format episode details for JSON output."""
    return {
        'id': episode['id'],
        'name': episode['name'],
        'show': {
            'id': episode['show']['id'],
            'name': episode['show']['name'],
            'publisher': episode['show']['publisher']
        },
        'release_date': episode['release_date'],
        'duration_ms': episode['duration_ms'],
        'language': episode.get('language'),
        'explicit': episode.get('explicit', False),
        'description': episode.get('description', ''),
        'html_description': episode.get('html_description', ''),
        'uri': episode['uri'],
        'external_urls': episode.get('external_urls', {}),
        'audio_preview_url': episode.get('audio_preview_url')
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Get detailed metadata for a Spotify episode'
    )
    parser.add_argument(
        '--episode-id',
        type=str,
        required=True,
        help='Spotify episode ID'
    )
    parser.add_argument(
        '--market',
        type=str,
        help='Market code (e.g., US, GB)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output JSON instead of markdown'
    )

    args = parser.parse_args()

    try:
        # Get credentials and initialize
        client_id, client_secret = get_credentials()
        auth = SpotifyAuth(client_id, client_secret)
        client = SpotifyClient(auth)

        # Fetch episode details
        episode = client.get_episode_details(
            episode_id=args.episode_id,
            market=args.market
        )

        # Output
        if args.json:
            output = format_json_output(episode)
            print(json.dumps(output, indent=2))
        else:
            output = format_markdown(episode)
            print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
