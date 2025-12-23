#!/usr/bin/env python3
"""
Get Saved Episodes

Retrieve a paginated list of episodes saved in the current user's Spotify library.

Usage:
    python get_saved_episodes.py [--limit N] [--offset N] [--market CODE] [--json]

Examples:
    python get_saved_episodes.py --limit 10
    python get_saved_episodes.py --limit 50 --offset 50
    python get_saved_episodes.py --limit 20 --json

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
        print("Set them with: export SPOTIFY_CLIENT_ID='...'", file=sys.stderr)
        sys.exit(1)

    return client_id, client_secret


def format_date(date_str: str) -> str:
    """Format ISO date string to readable format."""
    try:
        # Handle both full ISO format and date-only format
        if 'T' in date_str:
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        else:
            dt = datetime.fromisoformat(date_str)
        return dt.strftime('%B %d, %Y')
    except:
        return date_str


def format_duration(ms: int) -> str:
    """Format duration from milliseconds to mm:ss."""
    minutes = ms // 60000
    seconds = (ms % 60000) // 1000
    if minutes >= 60:
        hours = minutes // 60
        minutes = minutes % 60
        return f"{hours}h {minutes}m"
    return f"{minutes}:{seconds:02d}"


def format_markdown(data: dict) -> str:
    """Format episode data as markdown."""
    items = data['items']
    total = data['total']
    offset = data.get('offset', 0)
    has_more = data.get('next') is not None

    lines = ["# Your Saved Episodes\n"]

    for i, item in enumerate(items):
        episode = item['episode']
        num = offset + i + 1

        lines.append(f"{num}. **{episode['name']}**")
        lines.append(f"   Show: {episode['show']['name']}")
        lines.append(f"   Released: {format_date(episode['release_date'])}")
        lines.append(f"   Added: {format_date(item['added_at'])}")
        lines.append(f"   Duration: {format_duration(episode['duration_ms'])}")

        # Add description preview if available
        if episode.get('description'):
            desc = episode['description']
            # Truncate long descriptions
            if len(desc) > 150:
                desc = desc[:147] + '...'
            lines.append(f"   {desc}")

        lines.append("")  # Blank line between episodes

    # Summary footer
    if has_more:
        lines.append(f"\n*Showing episodes {offset + 1}-{offset + len(items)} of {total} (more available)*")
    else:
        lines.append(f"\n*Showing episodes {offset + 1}-{offset + len(items)} of {total}*")

    return "\n".join(lines)


def format_json_output(data: dict) -> dict:
    """Format episode data for JSON output."""
    episodes = []

    for item in data['items']:
        episode = item['episode']
        episodes.append({
            'id': episode['id'],
            'name': episode['name'],
            'show_name': episode['show']['name'],
            'show_id': episode['show']['id'],
            'release_date': episode['release_date'],
            'added_at': item['added_at'],
            'duration_ms': episode['duration_ms'],
            'description': episode.get('description', ''),
            'uri': episode['uri'],
            'external_urls': episode.get('external_urls', {})
        })

    return {
        'total': data['total'],
        'count': len(data['items']),
        'offset': data.get('offset', 0),
        'limit': data.get('limit', 20),
        'has_more': data.get('next') is not None,
        'next_offset': data.get('offset', 0) + len(data['items']) if data.get('next') else None,
        'episodes': episodes
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Get saved Spotify podcast episodes'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=20,
        help='Maximum episodes to return (1-50, default: 20)'
    )
    parser.add_argument(
        '--offset',
        type=int,
        default=0,
        help='Pagination offset (default: 0)'
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

    # Validate limit
    if args.limit < 1 or args.limit > 50:
        print("Error: limit must be between 1 and 50", file=sys.stderr)
        sys.exit(1)

    # Validate offset
    if args.offset < 0:
        print("Error: offset must be >= 0", file=sys.stderr)
        sys.exit(1)

    try:
        # Get credentials and initialize
        client_id, client_secret = get_credentials()
        auth = SpotifyAuth(client_id, client_secret)
        client = SpotifyClient(auth)

        # Fetch episodes
        data = client.get_saved_episodes(
            limit=args.limit,
            offset=args.offset,
            market=args.market
        )

        # Output
        if args.json:
            output = format_json_output(data)
            print(json.dumps(output, indent=2))
        else:
            output = format_markdown(data)
            print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
