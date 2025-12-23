#!/usr/bin/env python3
"""
Search Saved Episodes

Search through the user's saved episodes by episode name or show name.

Usage:
    python search_saved_episodes.py --query "search term" [--limit N] [--json]

Examples:
    python search_saved_episodes.py --query "AI"
    python search_saved_episodes.py --query "productivity" --limit 10
    python search_saved_episodes.py --query "technology" --json

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


def search_episodes(client: SpotifyClient, query: str, limit: int) -> list:
    """
    Search saved episodes by query string.

    Args:
        client: Spotify API client
        query: Search term (matches episode name or show name)
        limit: Maximum results to return

    Returns:
        List of matching episode objects
    """
    all_episodes = []
    fetch_offset = 0
    has_more = True

    # Fetch up to 500 episodes (10 requests of 50 each)
    print(f"Searching saved episodes for '{query}'...", file=sys.stderr)

    while has_more and len(all_episodes) < 500:
        data = client.get_saved_episodes(limit=50, offset=fetch_offset)
        all_episodes.extend(data['items'])
        has_more = data.get('next') is not None
        fetch_offset += 50

        if not has_more:
            break

    # Filter by query (case-insensitive)
    query_lower = query.lower()
    matches = []

    for item in all_episodes:
        episode = item['episode']
        episode_name = episode['name'].lower()
        show_name = episode['show']['name'].lower()

        if query_lower in episode_name or query_lower in show_name:
            matches.append(item)

        # Stop if we have enough matches
        if len(matches) >= limit:
            break

    print(f"Found {len(matches)} matching episodes", file=sys.stderr)
    return matches[:limit]


def format_markdown(matches: list, query: str) -> str:
    """Format search results as markdown."""
    if not matches:
        return f"# Search Results\n\nNo episodes found matching '{query}'"

    lines = [f"# Search Results for '{query}'\n"]
    lines.append(f"Found {len(matches)} matching episodes\n")

    for i, item in enumerate(matches):
        episode = item['episode']
        num = i + 1

        lines.append(f"{num}. **{episode['name']}**")
        lines.append(f"   Show: {episode['show']['name']}")
        lines.append(f"   Released: {format_date(episode['release_date'])}")
        lines.append(f"   Added: {format_date(item['added_at'])}")
        lines.append(f"   Duration: {format_duration(episode['duration_ms'])}")

        if episode.get('description'):
            desc = episode['description']
            if len(desc) > 150:
                desc = desc[:147] + '...'
            lines.append(f"   {desc}")

        lines.append("")

    return "\n".join(lines)


def format_json_output(matches: list, query: str) -> dict:
    """Format search results for JSON output."""
    episodes = []

    for item in matches:
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
        'query': query,
        'count': len(episodes),
        'episodes': episodes
    }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Search saved Spotify podcast episodes'
    )
    parser.add_argument(
        '--query',
        type=str,
        required=True,
        help='Search term (matches episode or show name)'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=20,
        help='Maximum results to return (default: 20)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output JSON instead of markdown'
    )

    args = parser.parse_args()

    # Validate limit
    if args.limit < 1:
        print("Error: limit must be >= 1", file=sys.stderr)
        sys.exit(1)

    try:
        # Get credentials and initialize
        client_id, client_secret = get_credentials()
        auth = SpotifyAuth(client_id, client_secret)
        client = SpotifyClient(auth)

        # Search episodes
        matches = search_episodes(client, args.query, args.limit)

        # Output
        if args.json:
            output = format_json_output(matches, args.query)
            print(json.dumps(output, indent=2))
        else:
            output = format_markdown(matches, args.query)
            print(output)

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
